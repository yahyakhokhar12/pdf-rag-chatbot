"""
Retriever service: wraps the Chroma vectorstore as a LangChain retriever,
with optional filtering by source document.
"""
from typing import List, Optional
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStoreRetriever

from app.config import get_settings
from app.database.chroma import get_vectorstore

settings = get_settings()


def get_retriever(source_filter: Optional[str] = None) -> VectorStoreRetriever:
    """
    Build a retriever from the Chroma vectorstore.

    Args:
        source_filter: If provided, restrict retrieval to chunks whose
                        metadata "source" matches this filename.
    """
    vectorstore = get_vectorstore()
    search_kwargs = {"k": settings.RETRIEVER_TOP_K}

    if source_filter:
        search_kwargs["filter"] = {"source": source_filter}

    return vectorstore.as_retriever(search_kwargs=search_kwargs)


def retrieve_relevant_chunks(
    query: str, source_filter: Optional[str] = None
) -> List[Document]:
    """Retrieve the most relevant chunks for a given query."""
    retriever = get_retriever(source_filter=source_filter)
    return retriever.invoke(query)
