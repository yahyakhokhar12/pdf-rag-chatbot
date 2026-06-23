"""
Document chunking service with semantic-aware splitting.
"""
from typing import Any

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

settings = get_settings()


def chunk_pages(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Split page-level text into overlapping chunks with enriched metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunks: list[dict[str, Any]] = []
    global_idx = 0

    for page_data in pages:
        text = page_data["page_content"]
        split_texts = splitter.split_text(text)

        for local_idx, chunk_text in enumerate(split_texts):
            chunks.append({
                "page_content": chunk_text,
                "metadata": {
                    "source": page_data["source"],
                    "page": page_data["page"],
                    "total_pages": page_data["total_pages"],
                    "chunk_index": global_idx,
                    "local_chunk_index": local_idx,
                    "char_count": len(chunk_text),
                },
            })
            global_idx += 1

    return chunks
