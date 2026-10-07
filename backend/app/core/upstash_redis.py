import os

from upstash_redis.asyncio import Redis

from app.core.config import settings

_redis_client: Redis | None = None


def get_upstash_redis_client() -> Redis | None:
    """Create one shared Upstash Redis REST client per worker/process."""
    global _redis_client

    url = (os.getenv("UPSTASH_REDIS_REST_URL") or settings.upstash_redis_rest_url or "").strip()
    token = (os.getenv("UPSTASH_REDIS_REST_TOKEN") or settings.upstash_redis_rest_token or "").strip()
    if not url or not token:
        _redis_client = None
        return None

    if _redis_client is None or getattr(_redis_client, "_test_url", None) != url:
        _redis_client = Redis(url=url, token=token)
        setattr(_redis_client, "_test_url", url)
    return _redis_client


