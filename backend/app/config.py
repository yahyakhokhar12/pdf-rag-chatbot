"""
Application configuration loaded from environment variables / .env file.
"""
import os
from functools import lru_cache
from typing import Any
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # General
    APP_NAME: str = "PDF RAG Chatbot"
    ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "pdf_documents"
    LOCAL_VECTORSTORE_PATH: str = "data/vectorstore.json"

    # JWT Auth
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google Gemini (Embeddings + optional chat)
    GOOGLE_API_KEY: str = ""
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    EMBEDDING_DIMENSION: int = 3072
    GEMINI_CHAT_MODEL: str = "gemini-1.5-flash"

    # Optional OpenAI embeddings fallback when Groq is used for chat
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Groq (Primary LLM for chat)
    GROQ_API_KEY: str = ""
    GROQ_CHAT_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_EMBEDDING_PROVIDER: str = "gemini"

    # LLM Provider: "groq" or "gemini"
    LLM_PROVIDER: str = "groq"

    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RETRIEVER_TOP_K: int = 10
    RERANKER_TOP_N: int = 5

    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50
    MAX_STORAGE_PER_USER_MB: int = 500

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "dev", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "prod", "production", "release"}:
                return False
        return bool(value)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    return settings
