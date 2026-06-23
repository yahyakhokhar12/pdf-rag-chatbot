"""
Service that provides an embeddings model instance based on the configured
LLM provider (OpenAI or Google Gemini).
"""
from langchain_core.embeddings import Embeddings

from app.config import get_settings

settings = get_settings()


def get_embeddings_model() -> Embeddings:
    """
    Return an embeddings model instance based on settings.LLM_PROVIDER.
    """
    provider = settings.LLM_PROVIDER.lower()

    # if provider == "openai":
    #     from langchain_openai import OpenAIEmbeddings

    #     if not settings.OPENAI_API_KEY:
    #         raise ValueError("OPENAI_API_KEY is not set in environment/.env")

    #     return OpenAIEmbeddings(
    #         model=settings.OPENAI_EMBEDDING_MODEL,
    #         api_key=settings.OPENAI_API_KEY,
    #     )

    if provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set in environment/.env")

        return GoogleGenerativeAIEmbeddings(
            model=settings.GEMINI_EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
        )

    elif provider == "groq":
        # Groq has no embeddings API; fall back to OPENAI or GEMINI for embeddings only.
        fallback = settings.GROQ_EMBEDDING_PROVIDER.lower()

        if fallback == "openai":
            from langchain_openai import OpenAIEmbeddings

            if not settings.OPENAI_API_KEY:
                raise ValueError(
                    "GROQ_EMBEDDING_PROVIDER is 'openai' but OPENAI_API_KEY is not set in environment/.env"
                )

            return OpenAIEmbeddings(
                model=settings.OPENAI_EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY,
            )

        elif fallback == "gemini":
            from langchain_google_genai import GoogleGenerativeAIEmbeddings

            if not settings.GOOGLE_API_KEY:
                raise ValueError(
                    "GROQ_EMBEDDING_PROVIDER is 'gemini' but GOOGLE_API_KEY is not set in environment/.env"
                )

            return GoogleGenerativeAIEmbeddings(
                model=settings.GEMINI_EMBEDDING_MODEL,
                google_api_key=settings.GOOGLE_API_KEY,
            )

        else:
            raise ValueError(f"Unsupported GROQ_EMBEDDING_PROVIDER: {settings.GROQ_EMBEDDING_PROVIDER}")

    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}")
