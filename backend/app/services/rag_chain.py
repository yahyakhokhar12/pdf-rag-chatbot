"""
RAG chain service: combines retrieval with an LLM to answer questions about
uploaded PDFs, returning both the answer text and the source chunks used.
"""
from typing import Any, Dict, List, Optional
from langchain_core.documents import Document
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

from app.config import get_settings
from app.services.retriever import get_retriever

settings = get_settings()


SYSTEM_PROMPT = """You are a helpful assistant that answers questions strictly based on
the provided context extracted from one or more PDF documents.

Rules:
- Only use information from the provided context to answer.
- If the answer cannot be found in the context, say so clearly instead of guessing.
- Be concise and accurate.
- When relevant, refer to the document and page number(s) you used.

Context:
{context}
"""


def get_chat_model() -> BaseChatModel:
    """Return a chat model instance based on settings.LLM_PROVIDER."""
    provider = settings.LLM_PROVIDER.lower()

    # if provider == "openai":
    #     from langchain_openai import ChatOpenAI

    #     if not settings.OPENAI_API_KEY:
    #         raise ValueError("OPENAI_API_KEY is not set in environment/.env")

    #     return ChatOpenAI(
    #         model=settings.OPENAI_CHAT_MODEL,
    #         api_key=settings.OPENAI_API_KEY,
    #         temperature=0.2,
    #     )

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set in environment/.env")

        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_CHAT_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.2,
        )

    elif provider == "groq":
        from langchain_openai import ChatOpenAI

        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in environment/.env")

        return ChatOpenAI(
            model=settings.GROQ_CHAT_MODEL,
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
            temperature=0.2,
        )

    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}")


def _format_context(documents: List[Document]) -> str:
    """Format retrieved documents into a context string for the prompt."""
    parts = []
    for i, doc in enumerate(documents, start=1):
        source = doc.metadata.get("source", "unknown")
        page = doc.metadata.get("page", "?")
        parts.append(f"[Chunk {i} | source: {source} | page: {page}]\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def _format_sources(documents: List[Document]) -> List[Dict[str, Any]]:
    """Format retrieved documents into a citation-friendly list for the API response."""
    sources = []
    for doc in documents:
        sources.append(
            {
                "source": doc.metadata.get("source", "unknown"),
                "page": doc.metadata.get("page"),
                "chunk_index": doc.metadata.get("chunk_index"),
                "snippet": doc.page_content[:300],
            }
        )
    return sources


def _format_chat_history(history: Optional[List[Dict[str, str]]]) -> List[Any]:
    """Convert a list of {role, content} dicts into LangChain message objects."""
    messages: List[Any] = []
    if not history:
        return messages

    for turn in history:
        role = turn.get("role")
        content = turn.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
    return messages


def answer_question(
    question: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    source_filter: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Run the full RAG pipeline: retrieve relevant chunks, build a prompt with
    context + chat history, call the LLM, and return the answer with sources.

    Args:
        question: The user's current question.
        chat_history: Optional list of prior {role, content} messages.
        source_filter: Optional filename to restrict retrieval to a single PDF.

    Returns:
        Dict with keys "answer" and "sources".
    """
    retriever = get_retriever(source_filter=source_filter)
    retrieved_docs = retriever.invoke(question)

    context_text = _format_context(retrieved_docs) if retrieved_docs else "No relevant context found."

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("placeholder", "{chat_history}"),
            ("human", "{question}"),
        ]
    )

    llm = get_chat_model()
    chain = prompt | llm | StrOutputParser()

    answer = chain.invoke(
        {
            "context": context_text,
            "chat_history": _format_chat_history(chat_history),
            "question": question,
        }
    )

    return {
        "answer": answer,
        "sources": _format_sources(retrieved_docs),
    }
