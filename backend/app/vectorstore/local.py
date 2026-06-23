"""
Small local vector store used when Qdrant/Docker is unavailable.
"""
from __future__ import annotations

import json
import math
import os
from tempfile import NamedTemporaryFile
from typing import Any

from app.config import get_settings

settings = get_settings()


def _store_path() -> str:
    return settings.LOCAL_VECTORSTORE_PATH


def _load_points() -> list[dict[str, Any]]:
    path = _store_path()
    if not os.path.exists(path):
        return []

    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    points = data.get("points", [])
    return points if isinstance(points, list) else []


def _save_points(points: list[dict[str, Any]]) -> None:
    path = _store_path()
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)

    payload = {"points": points}
    with NamedTemporaryFile("w", encoding="utf-8", delete=False, dir=directory or ".") as file:
        json.dump(payload, file)
        temp_path = file.name

    os.replace(temp_path, path)


def ensure_collection() -> None:
    """Create the local store file if it does not exist."""
    if not os.path.exists(_store_path()):
        _save_points([])


def upsert_vectors(
    ids: list[str],
    vectors: list[list[float]],
    payloads: list[dict[str, Any]],
) -> None:
    """Insert or replace vectors in the local JSON store."""
    ensure_collection()
    existing = {point["id"]: point for point in _load_points()}

    for id_, vector, payload in zip(ids, vectors, payloads):
        existing[id_] = {
            "id": id_,
            "vector": vector,
            "payload": payload,
        }

    _save_points(list(existing.values()))


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0

    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def search_vectors(
    query_vector: list[float],
    top_k: int = 10,
    document_ids: list[str] | None = None,
    user_id: str | None = None,
) -> list[dict[str, Any]]:
    """Search local vectors by cosine similarity."""
    points = _load_points()
    document_id_set = set(document_ids or [])
    matches: list[dict[str, Any]] = []

    for point in points:
        payload = point.get("payload") or {}
        if user_id and payload.get("user_id") != user_id:
            continue
        if document_id_set and payload.get("document_id") not in document_id_set:
            continue

        score = _cosine_similarity(query_vector, point.get("vector") or [])
        matches.append({
            "id": str(point.get("id")),
            "score": score,
            "payload": payload,
        })

    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:top_k]


def delete_by_document_id(document_id: str) -> None:
    points = [
        point for point in _load_points()
        if (point.get("payload") or {}).get("document_id") != document_id
    ]
    _save_points(points)


def delete_by_user_id(user_id: str) -> None:
    points = [
        point for point in _load_points()
        if (point.get("payload") or {}).get("user_id") != user_id
    ]
    _save_points(points)


def get_collection_info() -> dict[str, Any]:
    points = _load_points()
    return {
        "vectors_count": len(points),
        "points_count": len(points),
        "status": "local",
    }
