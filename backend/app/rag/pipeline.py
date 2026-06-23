"""
Main RAG pipeline orchestrator.
Combines query rewriting, hybrid retrieval, reranking, and LLM generation.
"""
import json
from typing import Any, AsyncGenerator

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage

from app.config import get_settings
from app.rag.prompts import SYSTEM_PROMPT, FOLLOW_UP_PROMPT, TITLE_GENERATION_PROMPT
from app.rag.retriever import hybrid_retrieve
from app.rag.query_rewriter import rewrite_query

settings = get_settings()


def get_chat_model() -> ChatOpenAI | ChatGoogleGenerativeAI:
    """Return a chat model instance based on settings."""
    provider = settings.LLM_PROVIDER.lower()

    if provider == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set")
        return ChatOpenAI(
            model=settings.GROQ_CHAT_MODEL,
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
            temperature=0.3,
            streaming=True,
        )
    elif provider == "gemini":
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set")
        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_CHAT_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.3,
            streaming=True,
        )
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")


def format_context(results: list[dict[str, Any]]) -> str:
    """Format retrieved chunks into context for the LLM prompt."""
    if not results:
        return "No relevant context found in the documents."

    parts = []
    for i, result in enumerate(results, start=1):
        payload = result.get("payload", {})
        source = payload.get("source", "Unknown")
        page = payload.get("page", "?")
        text = payload.get("text", "")
        score = result.get("rrf_score", result.get("score", 0))

        parts.append(
            f"[Chunk {i} | Source: {source} | Page: {page} | Relevance: {score:.3f}]\n{text}"
        )

    return "\n\n---\n\n".join(parts)


def format_sources(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Format retrieved chunks into source citation data."""
    sources = []
    seen = set()

    for result in results:
        payload = result.get("payload", {})
        source_key = f"{payload.get('document_id', '')}_{payload.get('page', '')}"

        if source_key in seen:
            continue
        seen.add(source_key)

        sources.append({
            "document_id": payload.get("document_id", ""),
            "document_name": payload.get("source", "Unknown"),
            "page": payload.get("page"),
            "chunk_index": payload.get("chunk_index"),
            "snippet": payload.get("text", "")[:300],
            "score": result.get("rrf_score", result.get("score", 0)),
        })

    return sources


async def stream_rag_response(
    question: str,
    chat_history: list[dict[str, str]] | None = None,
    document_ids: list[str] | None = None,
    user_id: str | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """
    Full RAG pipeline with streaming:
    1. Rewrite query (if history exists)
    2. Hybrid retrieve
    3. Format context
    4. Stream LLM response
    5. Yield sources at the end
    """
    chat_history = chat_history or []

    # Step 1: Query rewriting for multi-turn
    standalone_query = question
    if chat_history:
        try:
            standalone_query = rewrite_query(question, chat_history)
        except Exception:
            standalone_query = question

    # Step 2: Hybrid retrieval
    results = hybrid_retrieve(
        query=standalone_query,
        top_k=settings.RERANKER_TOP_N,
        document_ids=document_ids,
        user_id=user_id,
    )

    # Step 3: Format context and sources
    context = format_context(results)
    sources = format_sources(results)

    # Step 4: Build prompt and stream response
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        *[
            ("human" if msg["role"] == "user" else "assistant", msg["content"])
            for msg in (chat_history[-6:] if chat_history else [])
        ],
        ("human", "{question}"),
    ])

    llm = get_chat_model()
    chain = prompt | llm

    # Stream tokens
    full_response = ""
    async for chunk in chain.astream({"context": context, "question": question}):
        token = chunk.content if hasattr(chunk, "content") else str(chunk)
        if token:
            full_response += token
            yield {"type": "token", "content": token}

    # Step 5: Yield sources
    yield {"type": "sources", "content": sources}

    # Step 6: Generate related questions
    try:
        related = await generate_related_questions(full_response, question)
        yield {"type": "related_questions", "content": related}
    except Exception:
        yield {"type": "related_questions", "content": []}

    yield {"type": "done", "content": full_response}


async def generate_related_questions(answer: str, question: str) -> list[str]:
    """Generate follow-up questions based on the answer."""
    try:
        llm = ChatOpenAI(
            model="llama-3.1-8b-instant",
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
            temperature=0.5,
            max_tokens=256,
        )
        messages = [
            HumanMessage(content=f"Question: {question}\nAnswer: {answer[:500]}\n\n{FOLLOW_UP_PROMPT}")
        ]
        result = await llm.ainvoke(messages)
        return json.loads(result.content)
    except Exception:
        return []


async def generate_title(message: str) -> str:
    """Generate a conversation title from the first message."""
    try:
        llm = ChatOpenAI(
            model="llama-3.1-8b-instant",
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
            temperature=0.3,
            max_tokens=30,
        )
        prompt = ChatPromptTemplate.from_template(TITLE_GENERATION_PROMPT)
        chain = prompt | llm
        result = await chain.ainvoke({"message": message})
        return result.content.strip().strip('"')[:100]
    except Exception:
        return message[:50] + "..." if len(message) > 50 else message
