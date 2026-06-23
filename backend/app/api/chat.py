"""
API routes for chatting with the RAG pipeline over uploaded PDFs.
"""
import uuid
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag_chain import answer_question

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Simple in-memory chat history store, keyed by session_id.
# For production, replace with a persistent store (Redis, DB, etc.)
_chat_sessions: Dict[str, List[Dict[str, str]]] = {}


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The user's question about the PDF(s).")
    session_id: Optional[str] = Field(
        default=None, description="Session ID for maintaining chat history. Omit to start a new session."
    )
    source_filter: Optional[str] = Field(
        default=None, description="Optional filename to restrict the answer to a single PDF."
    )


class SourceChunk(BaseModel):
    source: str
    page: Optional[int] = None
    chunk_index: Optional[int] = None
    snippet: str


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: List[SourceChunk]


class HistoryResponse(BaseModel):
    session_id: str
    history: List[Dict[str, str]]


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Ask a question about the uploaded PDF(s). Maintains chat history per session.
    """
    session_id = request.session_id or str(uuid.uuid4())
    history = _chat_sessions.get(session_id, [])

    try:
        result = answer_question(
            question=request.question,
            chat_history=history,
            source_filter=request.source_filter,
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {exc}")

    # Update history
    history.append({"role": "user", "content": request.question})
    history.append({"role": "assistant", "content": result["answer"]})
    _chat_sessions[session_id] = history

    return ChatResponse(
        session_id=session_id,
        answer=result["answer"],
        sources=[SourceChunk(**s) for s in result["sources"]],
    )


@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(session_id: str) -> HistoryResponse:
    """Retrieve the chat history for a given session."""
    history = _chat_sessions.get(session_id, [])
    return HistoryResponse(session_id=session_id, history=history)


@router.delete("/history/{session_id}")
async def clear_history(session_id: str) -> dict:
    """Clear the chat history for a given session."""
    _chat_sessions.pop(session_id, None)
    return {"message": f"Cleared history for session '{session_id}'."}
