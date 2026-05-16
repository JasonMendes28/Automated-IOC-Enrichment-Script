"""
utils/http_client.py
────────────────────
Thin async HTTP wrapper built on httpx with automatic retry via tenacity.

Usage:
    from app.utils.http_client import get_json

    data = await get_json("https://api.example.com/resource", headers={...})
"""

from __future__ import annotations
import logging
import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_random_exponential,
    retry_if_exception_type,
)
from app.config.settings import settings

logger = logging.getLogger(__name__)


# ── Retry decorator ────────────────────────────────────────────────────────────

def _build_retry():
    return retry(
        reraise=True,
        stop=stop_after_attempt(settings.MAX_RETRIES),
        wait=wait_random_exponential(
            min=settings.RETRY_WAIT_MIN,
            max=settings.RETRY_WAIT_MAX,
        ),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
    )


# ── Core async helpers ─────────────────────────────────────────────────────────

@_build_retry()
async def get_json(
    url: str,
    headers: dict | None = None,
    params: dict | None = None,
) -> dict:
    """
    Fire an async GET request and return the parsed JSON body.
    Retries automatically on timeout / network errors.
    Raises httpx.HTTPStatusError on 4xx/5xx (caller must catch).
    """
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        logger.debug("GET %s params=%s", url, params)
        resp = client.get(url, headers=headers or {}, params=params or {})
        resp = await resp  # type: ignore[misc]  # httpx returns a coroutine-like
        resp.raise_for_status()
        return resp.json()


@_build_retry()
async def post_json(
    url: str,
    headers: dict | None = None,
    json_body: dict | None = None,
    data: dict | None = None,
) -> dict:
    """Fire an async POST and return the parsed JSON body."""
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
        logger.debug("POST %s", url)
        if json_body:
            resp = await client.post(url, headers=headers or {}, json=json_body)
        else:
            resp = await client.post(url, headers=headers or {}, data=data or {})
        resp.raise_for_status()
        return resp.json()


# ── Synchronous fallback (used in report generation) ──────────────────────────

def get_json_sync(
    url: str,
    headers: dict | None = None,
    params: dict | None = None,
) -> dict:
    """Synchronous GET – only for non-async contexts (e.g. pandas export)."""
    import httpx as _httpx
    with _httpx.Client(timeout=settings.REQUEST_TIMEOUT) as client:
        resp = client.get(url, headers=headers or {}, params=params or {})
        resp.raise_for_status()
        return resp.json()
