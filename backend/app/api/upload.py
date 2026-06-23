"""
API routes for uploading PDFs and managing stored documents.
"""
import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.config import get_settings
from app.database.chroma import add_documents, delete_by_source, list_sources, collection_count
from app.services.chunker import chunk_documents
from app.services.pdf_loader import load_pdf

router = APIRouter(prefix="/api/upload", tags=["upload"])
settings = get_settings()


class UploadResponse(BaseModel):
    filename: str
    pages_processed: int
    chunks_created: int
    message: str


class SourcesResponse(BaseModel):
    sources: List[str]
    total_chunks: int


@router.post("", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload a PDF file. The file is saved, text is extracted, chunked,
    embedded, and stored in the vector database.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save uploaded file to disk with a unique-safe name but keep original for metadata
    safe_filename = file.filename
    file_id = uuid.uuid4().hex[:8]
    stored_filename = f"{file_id}_{safe_filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {exc}")

    try:
        # Extract text page-by-page
        page_documents = load_pdf(file_path, source_name=safe_filename)

        if not page_documents:
            raise HTTPException(
                status_code=422,
                detail="No extractable text found in PDF (it may be a scanned image-only document).",
            )

        # Chunk
        chunks = chunk_documents(page_documents)

        # Embed + store
        add_documents(chunks)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {exc}")

    return UploadResponse(
        filename=safe_filename,
        pages_processed=len(page_documents),
        chunks_created=len(chunks),
        message="PDF processed and stored successfully.",
    )


@router.get("/sources", response_model=SourcesResponse)
async def get_sources() -> SourcesResponse:
    """List all PDF source documents currently stored in the vector database."""
    sources = list_sources()
    total = collection_count()
    return SourcesResponse(sources=sources, total_chunks=total)


@router.delete("/sources/{source_name}")
async def delete_source(source_name: str) -> dict:
    """Delete all chunks belonging to a given source PDF."""
    try:
        delete_by_source(source_name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete source: {exc}")
    return {"message": f"Deleted all chunks for source '{source_name}'."}
