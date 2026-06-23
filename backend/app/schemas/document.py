"""
Pydantic schemas for document operations.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    original_filename: str
    file_size: int
    status: str
    page_count: int | None = None
    chunk_count: int | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class DocumentRenameRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=500)


class UploadResponse(BaseModel):
    id: uuid.UUID
    filename: str
    pages_processed: int
    chunks_created: int
    message: str
