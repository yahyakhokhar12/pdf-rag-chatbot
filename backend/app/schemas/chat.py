"""
Pydantic schemas for chat operations.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: uuid.UUID | None = None
    document_ids: list[uuid.UUID] | None = None


class SourceChunk(BaseModel):
    document_id: uuid.UUID
    document_name: str
    page: int | None = None
    chunk_index: int | None = None
    snippet: str
    score: float | None = None


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    sources: list[SourceChunk] | None = None
    feedback: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackRequest(BaseModel):
    feedback: str = Field(..., pattern=r"^(like|dislike)$")


class RegenerateRequest(BaseModel):
    message_id: uuid.UUID


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    message_count: int | None = None

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse]

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    conversations: list[ConversationResponse]
    total: int


class ConversationUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    is_pinned: bool | None = None


class ExportRequest(BaseModel):
    format: str = Field(..., pattern=r"^(pdf|docx|markdown|txt)$")
