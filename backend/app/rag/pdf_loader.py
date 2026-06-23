"""
PDF text extraction service.
"""
from typing import Any
from pypdf import PdfReader


def load_pdf(file_path: str, source_name: str) -> list[dict[str, Any]]:
    """
    Extract text from a PDF file, returning structured page data.

    Returns a list of dicts with keys: page_content, page, total_pages, source.
    """
    reader = PdfReader(file_path)
    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = clean_text(text)

        if not text.strip():
            continue

        pages.append({
            "page_content": text,
            "page": page_number,
            "total_pages": len(reader.pages),
            "source": source_name,
        })

    return pages


def clean_text(text: str) -> str:
    """Clean extracted PDF text."""
    import re
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)
    # Fix common PDF extraction artifacts
    text = text.replace("\x00", "")
    # Remove excessive line breaks but keep paragraph structure
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def get_pdf_page_count(file_path: str) -> int:
    """Get the total number of pages in a PDF."""
    reader = PdfReader(file_path)
    return len(reader.pages)
