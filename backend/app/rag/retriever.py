"""
Hybrid retriever combining semantic (Qdrant) and keyword (BM25) search
with reciprocal rank fusion.
"""
from typing import Any

from rank_bm25 import BM25Okapi

from app.rag.embeddings import embed_query
from app.vectorstore.qdrant import search_vectors

from app.config import get_settings

settings = get_settings()


def semantic_search(
    query: str,
    top_k: int = 10,
    document_ids: list[str] | None = None,
    user_id: str | None = None,
) -> list[dict[str, Any]]:
    """Perform semantic search using Qdrant vector similarity."""
    query_vector = embed_query(query)
    results = search_vectors(
        query_vector=query_vector,
        top_k=top_k,
        document_ids=document_ids,
        user_id=user_id,
    )
    return results


def keyword_search(
    query: str,
    chunks: list[dict[str, Any]],
    top_k: int = 10,
) -> list[dict[str, Any]]:
    """Perform BM25 keyword-based search over chunk texts."""
    if not chunks:
        return []

    # Tokenize corpus
    corpus = [chunk["payload"]["text"] for chunk in chunks]
    tokenized_corpus = [doc.lower().split() for doc in corpus]
    tokenized_query = query.lower().split()

    bm25 = BM25Okapi(tokenized_corpus)
    scores = bm25.get_scores(tokenized_query)

    # Pair chunks with scores and sort
    scored_chunks = list(zip(chunks, scores))
    scored_chunks.sort(key=lambda x: x[1], reverse=True)

    return [
        {**chunk, "bm25_score": score}
        for chunk, score in scored_chunks[:top_k]
    ]


def reciprocal_rank_fusion(
    semantic_results: list[dict],
    keyword_results: list[dict],
    k: int = 60,
) -> list[dict[str, Any]]:
    """
    Combine semantic and keyword results using Reciprocal Rank Fusion (RRF).
    """
    scores: dict[str, float] = {}
    result_map: dict[str, dict] = {}

    # Score semantic results
    for rank, result in enumerate(semantic_results):
        doc_id = result["id"]
        scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
        result_map[doc_id] = result

    # Score keyword results
    for rank, result in enumerate(keyword_results):
        doc_id = result.get("id", str(rank))
        scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
        if doc_id not in result_map:
            result_map[doc_id] = result

    # Sort by fused score
    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

    return [
        {**result_map[doc_id], "rrf_score": scores[doc_id]}
        for doc_id in sorted_ids
    ]


def hybrid_retrieve(
    query: str,
    top_k: int | None = None,
    document_ids: list[str] | None = None,
    user_id: str | None = None,
) -> list[dict[str, Any]]:
    """
    Perform hybrid retrieval combining semantic and keyword search.
    """
    if top_k is None:
        top_k = settings.RETRIEVER_TOP_K

    # Get semantic results (fetch more for fusion)
    semantic_results = semantic_search(
        query=query,
        top_k=top_k * 2,
        document_ids=document_ids,
        user_id=user_id,
    )

    # Use semantic results as the corpus for BM25
    keyword_results = keyword_search(
        query=query,
        chunks=semantic_results,
        top_k=top_k * 2,
    )

    # Fuse results
    fused = reciprocal_rank_fusion(semantic_results, keyword_results)

    return fused[:top_k]
