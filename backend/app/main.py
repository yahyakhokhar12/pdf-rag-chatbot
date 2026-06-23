"""
Main FastAPI application entrypoint for the PDF RAG Chatbot SaaS.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.config import get_settings
from app.database.session import init_db
from app.database.redis import close_redis
from app.middleware.rate_limiter import RateLimitMiddleware
from app.vectorstore.qdrant import ensure_collection

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if settings.DEBUG:
        await init_db()
    
    # Ensure Qdrant collection exists
    try:
        ensure_collection()
    except Exception as e:
        print(f"Failed to initialize Qdrant collection: {e}")
        
    yield
    
    # Shutdown
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade PDF RAG Chatbot SaaS backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middlewares
app.add_middleware(RateLimitMiddleware)

# Routers
app.include_router(api_v1_router)


@app.get("/", tags=["health"])
async def root() -> dict:
    """Health check endpoint."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.ENV,
    }


@app.get("/health", tags=["health"])
async def health() -> dict:
    """Simple health check endpoint for container orchestration."""
    return {"status": "healthy"}
