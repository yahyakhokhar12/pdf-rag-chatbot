"""
Chat API endpoints with Server-Sent Events (SSE) streaming.
"""
import json
import uuid
from typing import Annotated, AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database.session import async_session_factory, get_db
from app.models.user import User
from app.models.conversation import Conversation, Message, MessageRole, MessageFeedback
from app.rag.pipeline import stream_rag_response, generate_title
from app.schemas.chat import ChatRequest, FeedbackRequest

router = APIRouter(prefix="/chat", tags=["chat"])


async def sse_generator(
    question: str,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
    document_ids: list[str] | None = None,
    chat_history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Generate Server-Sent Events from the RAG pipeline."""
    full_response = ""
    sources_data = []

    try:
        async for event in stream_rag_response(
            question=question,
            chat_history=chat_history,
            document_ids=document_ids,
            user_id=str(user_id),
        ):
            event_type = event["type"]

            if event_type == "token":
                full_response += event["content"]
                yield f"data: {json.dumps({'type': 'token', 'content': event['content']})}\n\n"

            elif event_type == "sources":
                sources_data = event["content"]
                yield f"data: {json.dumps({'type': 'sources', 'content': sources_data})}\n\n"

            elif event_type == "related_questions":
                yield f"data: {json.dumps({'type': 'related_questions', 'content': event['content']})}\n\n"

            elif event_type == "done":
                # Save assistant message in a short-lived session so the
                # streaming response does not keep the request DB transaction open.
                async with async_session_factory() as save_db:
                    assistant_msg = Message(
                        conversation_id=conversation_id,
                        role=MessageRole.ASSISTANT,
                        content=full_response,
                        sources=sources_data,
                    )
                    save_db.add(assistant_msg)
                    await save_db.commit()
                    await save_db.refresh(assistant_msg)

                yield f"data: {json.dumps({'type': 'done', 'message_id': str(assistant_msg.id), 'conversation_id': str(conversation_id)})}\n\n"

    except Exception as exc:
        yield f"data: {json.dumps({'type': 'error', 'content': str(exc)})}\n\n"


@router.post("")
async def chat(
    request: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Send a message and get a streaming response."""
    conversation_id = request.conversation_id

    # Get or create conversation
    if conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        title = await generate_title(request.message)
        conversation = Conversation(
            user_id=current_user.id,
            title=title,
        )
        db.add(conversation)
        await db.flush()
        conversation_id = conversation.id

    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role=MessageRole.USER,
        content=request.message,
    )
    db.add(user_msg)
    await db.flush()

    # Get chat history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    chat_history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in messages[:-1]  # Exclude the just-added user message
    ]

    # Prepare document IDs
    doc_ids = [str(d) for d in request.document_ids] if request.document_ids else None

    # Commit before returning StreamingResponse. Otherwise SQLite keeps the
    # request transaction open for the entire stream and follow-up actions like
    # delete can hit "database is locked".
    await db.commit()

    return StreamingResponse(
        sse_generator(
            question=request.message,
            conversation_id=conversation_id,
            user_id=current_user.id,
            db=db,
            document_ids=doc_ids,
            chat_history=chat_history,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/{message_id}/feedback")
async def feedback(
    message_id: uuid.UUID,
    request: FeedbackRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Like or dislike a message."""
    result = await db.execute(
        select(Message)
        .join(Conversation)
        .where(
            Message.id == message_id,
            Conversation.user_id == current_user.id,
        )
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.feedback = MessageFeedback(request.feedback)
    await db.flush()

    return {"message": "Feedback recorded"}
