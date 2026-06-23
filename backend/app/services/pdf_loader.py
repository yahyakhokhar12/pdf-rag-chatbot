"""
Service responsible for extracting raw text (with page metadata) from PDF files.
"""
from typing import List
from langchain_core.documents import Document
from pypdf import PdfReader


def load_pdf(file_path: str, source_name: str) -> List[Document]:
    """
    Extract text from a PDF file, returning one LangChain Document per page.

    Args:
        file_path: Path to the PDF file on disk.
        source_name: Human-readable name (e.g. original filename) stored in metadata
                     so it can be cited back to the user.

    Returns:
        List of Document objects, each representing one page of the PDF.
    """
    reader = PdfReader(file_path)
    documents: List[Document] = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()

        if not text:
            # Skip pages with no extractable text (e.g. pure images)
            continue

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "source": source_name,
                    "page": page_number,
                    "total_pages": len(reader.pages),
                },
            )
        )

    return documents
