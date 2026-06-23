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

settings = get_settings()

_client: QdrantClient | None = None

# Gemini embedding-001 produces 768-dimensional vectors
EMBEDDING_DIMENSION = 768


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
    client = get_qdrant_client()
    collections = [c.name for c in client.get_collections().collections]

    if settings.QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=EMBEDDING_DIMENSION,
                distance=Distance.COSINE,
            ),
        )


def upsert_vectors(
    ids: list[str],
    vectors: list[list[float]],
    payloads: list[dict[str, Any]],
):
    """Upsert vectors with metadata payloads into Qdrant."""
    client = get_qdrant_client()
    points = [
        PointStruct(id=id_, vector=vector, payload=payload)
        for id_, vector, payload in zip(ids, vectors, payloads)
    ]

    # Batch upsert in chunks of 100
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=batch,
        )


def search_vectors(
    query_vector: list[float],
    top_k: int = 10,
    document_ids: list[str] | None = None,
    user_id: str | None = None,
) -> list[dict[str, Any]]:
    """Search for similar vectors with optional document filtering."""
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

    results = client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        limit=top_k,
        query_filter=query_filter,
        with_payload=True,
    )

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
    client = get_qdrant_client()
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


def delete_by_user_id(user_id: str):
    """Delete all vectors belonging to a specific user."""
    client = get_qdrant_client()
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


def get_collection_info() -> dict[str, Any]:
    """Get collection statistics."""
    client = get_qdrant_client()
    try:
        info = client.get_collection(settings.QDRANT_COLLECTION)
        return {
            "vectors_count": info.vectors_count,
            "points_count": info.points_count,
            "status": info.status.value if info.status else "unknown",
        }
    except Exception:
        return {"vectors_count": 0, "points_count": 0, "status": "not_found"}
