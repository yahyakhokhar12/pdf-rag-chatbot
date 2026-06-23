"""
Redis client for caching, rate limiting, and session management.
"""
import redis.asyncio as redis

from app.config import get_settings

settings = get_settings()

redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    """Get the Redis client instance."""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return redis_client


async def close_redis():
    """Close the Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


async def cache_get(key: str) -> str | None:
    """Get a cached value."""
    client = await get_redis()
    return await client.get(key)


async def cache_set(key: str, value: str, ttl: int = 3600) -> None:
    """Set a cached value with TTL."""
    client = await get_redis()
    await client.setex(key, ttl, value)


async def cache_delete(key: str) -> None:
    """Delete a cached value."""
    client = await get_redis()
    await client.delete(key)


async def rate_limit_check(key: str, max_requests: int, window_seconds: int) -> bool:
    """Check if a rate limit has been exceeded. Returns True if allowed."""
    client = await get_redis()
    current = await client.incr(key)
    if current == 1:
        await client.expire(key, window_seconds)
    return current <= max_requests
