"""
Google Gemini embeddings service.
"""
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings

settings = get_settings()

_embeddings_model = None


def get_embeddings_model() -> GoogleGenerativeAIEmbeddings:
    """Get or create the Gemini embeddings model instance."""
    global _embeddings_model
    if _embeddings_model is None:
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set in environment/.env")

        _embeddings_model = GoogleGenerativeAIEmbeddings(
            model=settings.GEMINI_EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
        )
    return _embeddings_model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts."""
    model = get_embeddings_model()
    # Batch processing with rate limit awareness
    batch_size = 50
    all_embeddings = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        embeddings = model.embed_documents(batch)
        all_embeddings.extend(embeddings)

    return all_embeddings


def embed_query(text: str) -> list[float]:
    """Generate an embedding for a single query text."""
    model = get_embeddings_model()
    return model.embed_query(text)
