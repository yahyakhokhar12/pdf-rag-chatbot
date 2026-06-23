"""
Service responsible for splitting documents into smaller overlapping chunks
suitable for embedding and retrieval.
"""
from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

settings = get_settings()


def chunk_documents(documents: List[Document]) -> List[Document]:
    """
    Split a list of page-level Documents into smaller chunks while preserving
    and enriching metadata (source, page, chunk index) for citation purposes.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks: List[Document] = []
    for doc in documents:
        split_texts = splitter.split_text(doc.page_content)
        for idx, text in enumerate(split_texts):
            metadata = dict(doc.metadata)
            metadata["chunk_index"] = idx
            chunks.append(Document(page_content=text, metadata=metadata))

    return chunks
