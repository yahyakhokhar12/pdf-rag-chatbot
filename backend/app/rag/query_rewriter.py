"""
Query rewriting for multi-turn conversations.
"""
from app.config import get_settings

settings = get_settings()


def rewrite_query(question: str, chat_history: list[dict[str, str]]) -> str:
    """
    Rewrite a follow-up question into a standalone question using conversation history.
    Uses Groq LLM for fast rewriting.
    """
    if not chat_history:
        return question

    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate

    llm = ChatOpenAI(
        model="llama-3.1-8b-instant",  # Fast model for rewriting
        api_key=settings.GROQ_API_KEY,
        base_url=settings.GROQ_BASE_URL,
        temperature=0,
        max_tokens=256,
    )

    # Build recent history context (last 6 messages)
    recent_history = chat_history[-6:]
    history_text = "\n".join(
        f"{msg['role'].capitalize()}: {msg['content']}" for msg in recent_history
    )

    prompt = ChatPromptTemplate.from_template(
        """Given the following conversation history and a follow-up question, 
rewrite the follow-up question to be a standalone question that captures all necessary context.

Chat History:
{history}

Follow-up Question: {question}

Standalone Question:"""
    )

    chain = prompt | llm
    result = chain.invoke({"history": history_text, "question": question})
    return result.content.strip()
