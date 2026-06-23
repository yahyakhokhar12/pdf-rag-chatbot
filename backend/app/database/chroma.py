"""
Chroma vector database access layer.

Provides a singleton-style accessor for the Chroma collection used to store
and retrieve document embeddings.
"""
from typing import List, Optional
import chromadb
from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.config import get_settings
from app.services.embeddings import get_embeddings_model

settings = get_settings()

_chroma_client: Optional[chromadb.ClientAPI] = None
_vectorstore: Optional[Chroma] = None


def get_chroma_client() -> chromadb.ClientAPI:
    """Return a persistent Chroma client (created once, reused)."""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
    return _chroma_client


def get_vectorstore() -> Chroma:
    """Return the LangChain Chroma vectorstore wrapper (created once, reused)."""
    global _vectorstore
    if _vectorstore is None:
        client = get_chroma_client()
        embeddings = get_embeddings_model()
        _vectorstore = Chroma(
            client=client,
            collection_name=settings.CHROMA_COLLECTION,
            embedding_function=embeddings,
        )
    return _vectorstore


def add_documents(documents: List[Document]) -> List[str]:
    """Embed and add a list of chunked Documents to the vector store."""
    vectorstore = get_vectorstore()
    ids = vectorstore.add_documents(documents)
    return ids


def delete_by_source(source_name: str) -> None:
    """Delete all chunks belonging to a given source document (filename)."""
    vectorstore = get_vectorstore()
    vectorstore._collection.delete(where={"source": source_name})


def list_sources() -> List[str]:
    """Return a list of unique source filenames currently stored."""
    client = get_chroma_client()
    collection = client.get_or_create_collection(settings.CHROMA_COLLECTION)
    result = collection.get(include=["metadatas"])
    sources = set()
    for metadata in result.get("metadatas", []) or []:
        if metadata and "source" in metadata:
            sources.add(metadata["source"])
    return sorted(sources)


def collection_count() -> int:
    """Return total number of chunks stored in the collection."""
    client = get_chroma_client()
    collection = client.get_or_create_collection(settings.CHROMA_COLLECTION)
    return collection.count()
