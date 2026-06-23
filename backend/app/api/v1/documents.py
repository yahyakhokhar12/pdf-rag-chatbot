"""
Document management API endpoints.
"""
import os
import uuid
import shutil
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import get_settings
from app.database.session import get_db
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.rag.pdf_loader import load_pdf, get_pdf_page_count
from app.rag.chunker import chunk_pages
from app.rag.embeddings import embed_texts
from app.vectorstore.qdrant import upsert_vectors, delete_by_document_id, ensure_collection
from app.schemas.document import DocumentResponse, DocumentListResponse, DocumentRenameRequest, UploadResponse

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    """Upload and process a PDF document."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Check file size
    content = await file.read()
    file_size = len(content)
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum {settings.MAX_FILE_SIZE_MB}MB allowed")

    # Check storage limit
    if current_user.storage_used + file_size > current_user.storage_limit:
        raise HTTPException(status_code=400, detail="Storage limit exceeded")

    # Save file
    file_id = uuid.uuid4()
    stored_filename = f"{file_id}_{file.filename}"
    user_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, stored_filename)

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {exc}")

    # Create document record
    doc = Document(
        id=file_id,
        user_id=current_user.id,
        filename=stored_filename,
        original_filename=file.filename,
        file_size=file_size,
        file_path=file_path,
        status=DocumentStatus.PROCESSING,
    )
    db.add(doc)
    await db.flush()

    try:
        # Extract text
        pages = load_pdf(file_path, source_name=file.filename)
        if not pages:
            doc.status = DocumentStatus.ERROR
            doc.error_message = "No extractable text found in PDF"
            await db.flush()
            raise HTTPException(status_code=422, detail="No extractable text found in PDF")

        doc.page_count = len(pages)

        # Chunk
        chunks = chunk_pages(pages)
        doc.chunk_count = len(chunks)

        # Generate embeddings
        texts = [c["page_content"] for c in chunks]
        vectors = embed_texts(texts)

        # Store in Qdrant
        ensure_collection()
        point_ids = [str(uuid.uuid4()) for _ in chunks]
        payloads = [
            {
                **c["metadata"],
                "text": c["page_content"],
                "document_id": str(file_id),
                "user_id": str(current_user.id),
            }
            for c in chunks
        ]
        upsert_vectors(point_ids, vectors, payloads)

        # Update status
        doc.status = DocumentStatus.READY
        current_user.storage_used += file_size
        await db.flush()

    except HTTPException:
        raise
    except Exception as exc:
        doc.status = DocumentStatus.ERROR
        doc.error_message = str(exc)
        await db.flush()
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {exc}")

    return UploadResponse(
        id=file_id,
        filename=file.filename,
        pages_processed=doc.page_count or 0,
        chunks_created=doc.chunk_count or 0,
        message="PDF processed and stored successfully",
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status_filter: str | None = None,
):
    """List user's documents with pagination and search."""
    query = select(Document).where(Document.user_id == current_user.id)

    if search:
        query = query.where(Document.original_filename.ilike(f"%{search}%"))
    if status_filter:
        query = query.where(Document.status == status_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(desc(Document.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    documents = result.scalars().all()

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in documents],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get document details."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.patch("/{document_id}", response_model=DocumentResponse)
async def rename_document(
    document_id: uuid.UUID,
    request: DocumentRenameRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Rename a document."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.original_filename = request.filename
    await db.flush()
    return doc


@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a document and its vectors."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete vectors from Qdrant
    try:
        delete_by_document_id(str(document_id))
    except Exception:
        pass

    # Delete file from disk
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception:
        pass

    # Update storage
    current_user.storage_used = max(0, current_user.storage_used - doc.file_size)

    await db.delete(doc)
    await db.flush()

    return {"message": "Document deleted successfully"}


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Download the original PDF file."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type="application/pdf",
    )
