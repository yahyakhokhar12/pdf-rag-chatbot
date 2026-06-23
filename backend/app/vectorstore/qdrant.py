"""
Qdrant vector database client wrapper.
"""
from typing import Any
from uuid import UUID

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance, VectorParams, PointStruct, Filter,
    FieldCondition, MatchValue, FilterSelector,
)

from app.config import get_settings
from app.vectorstore import local as local_store

settings = get_settings()

_client: QdrantClient | None = None
_use_local_fallback = False


def _fallback(reason: Exception | None = None) -> None:
    """Switch to local vector storage when Qdrant is unavailable."""
    global _use_local_fallback
    if not _use_local_fallback and reason is not None:
        print(f"Qdrant unavailable, using local vector store: {reason}")
    _use_local_fallback = True

def get_qdrant_client() -> QdrantClient:
    """Get or create the Qdrant client."""
    global _client
    if _client is None:
        _client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
        )
    return _client


def ensure_collection():
    """Create the collection if it doesn't exist."""
    if _use_local_fallback:
        local_store.ensure_collection()
        return

    try:
        client = get_qdrant_client()
        collections = [c.name for c in client.get_collections().collections]

        if settings.QDRANT_COLLECTION not in collections:
            client.create_collection(
                collection_name=settings.QDRANT_COLLECTION,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=Distance.COSINE,
                ),
            )
    except Exception as exc:
        _fallback(exc)
        local_store.ensure_collection()


def upsert_vectors(
    ids: list[str],
    vectors: list[list[float]],
    payloads: list[dict[str, Any]],
):
    """Upsert vectors with metadata payloads into Qdrant."""
    if _use_local_fallback:
        local_store.upsert_vectors(ids, vectors, payloads)
        return

    client = get_qdrant_client()
    points = [
        PointStruct(id=id_, vector=vector, payload=payload)
        for id_, vector, payload in zip(ids, vectors, payloads)
    ]

    # Batch upsert in chunks of 100
    batch_size = 100
    try:
        for i in range(0, len(points), batch_size):
            batch = points[i : i + batch_size]
            client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=batch,
            )
    except Exception as exc:
        _fallback(exc)
        local_store.upsert_vectors(ids, vectors, payloads)


def search_vectors(
    query_vector: list[float],
    top_k: int = 10,
    document_ids: list[str] | None = None,
    user_id: str | None = None,
) -> list[dict[str, Any]]:
    """Search for similar vectors with optional document filtering."""
    if _use_local_fallback:
        return local_store.search_vectors(query_vector, top_k, document_ids, user_id)

    client = get_qdrant_client()

    # Build filters
    must_conditions = []
    if user_id:
        must_conditions.append(
            FieldCondition(key="user_id", match=MatchValue(value=user_id))
        )
    if document_ids:
        # Use "should" for OR across multiple document IDs
        must_conditions.append(
            Filter(
                should=[
                    FieldCondition(key="document_id", match=MatchValue(value=did))
                    for did in document_ids
                ]
            )
        )

    query_filter = Filter(must=must_conditions) if must_conditions else None

    try:
        results = client.search(
            collection_name=settings.QDRANT_COLLECTION,
            query_vector=query_vector,
            limit=top_k,
            query_filter=query_filter,
            with_payload=True,
        )
    except Exception as exc:
        _fallback(exc)
        return local_store.search_vectors(query_vector, top_k, document_ids, user_id)

    return [
        {
            "id": str(hit.id),
            "score": hit.score,
            "payload": hit.payload,
        }
        for hit in results
    ]


def delete_by_document_id(document_id: str):
    """Delete all vectors belonging to a specific document."""
    if _use_local_fallback:
        local_store.delete_by_document_id(document_id)
        return

    client = get_qdrant_client()
    try:
        client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(
                            key="document_id", match=MatchValue(value=document_id)
                        )
                    ]
                )
            ),
        )
    except Exception as exc:
        _fallback(exc)
        local_store.delete_by_document_id(document_id)


def delete_by_user_id(user_id: str):
    """Delete all vectors belonging to a specific user."""
    if _use_local_fallback:
        local_store.delete_by_user_id(user_id)
        return

    client = get_qdrant_client()
    try:
        client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(
                            key="user_id", match=MatchValue(value=user_id)
                        )
                    ]
                )
            ),
        )
    except Exception as exc:
        _fallback(exc)
        local_store.delete_by_user_id(user_id)


def get_collection_info() -> dict[str, Any]:
    """Get collection statistics."""
    if _use_local_fallback:
        return local_store.get_collection_info()

    client = get_qdrant_client()
    try:
        info = client.get_collection(settings.QDRANT_COLLECTION)
        return {
            "vectors_count": info.vectors_count,
            "points_count": info.points_count,
            "status": info.status.value if info.status else "unknown",
        }
    except Exception:
        return local_store.get_collection_info()
