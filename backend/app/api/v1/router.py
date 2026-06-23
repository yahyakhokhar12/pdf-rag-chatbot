"""
API v1 router aggregator.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.chat import router as chat_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.admin import router as admin_router

router = APIRouter(prefix="/api/v1")

router.include_router(auth_router)
router.include_router(documents_router)
router.include_router(chat_router)
router.include_router(conversations_router)
router.include_router(admin_router)
