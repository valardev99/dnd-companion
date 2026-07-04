"""Chat SSE proxy route — streams LLM completions from OpenRouter."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import select

from app.auth import decode_token, decrypt_api_key
from app.database import async_session
from app.limits import limiter
from app.services.openrouter import stream_chat_completion

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    apiKey: Optional[str] = None
    model: str = "google/gemini-2.5-flash"
    messages: List[Dict[str, Any]]
    systemPrompt: Optional[str] = None
    maxTokens: int = 4096


async def _resolve_stored_key(request: Request) -> Optional[str]:
    """Decrypt the authenticated user's stored API key, if any.

    Uses a short-lived session that is closed BEFORE streaming starts.
    A Depends(get_db) here would pin a pool connection for the entire
    SSE stream (up to 120s) — with pool_size=5/max_overflow=10, only
    15 concurrent chats would exhaust the pool and 500 every other
    request in the app.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    try:
        payload = decode_token(auth_header[7:])
    except JWTError:
        return None
    if payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None

    from app.models import User
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            return None
        if payload.get("tv", 0) != (user.token_version or 0):
            return None
        if not user.encrypted_api_key:
            return None
        try:
            return decrypt_api_key(user.encrypted_api_key)
        except Exception:
            return None


@router.post("/api/chat")
@limiter.limit("20/minute")
async def chat(request: Request, body: ChatRequest):
    """Stream a chat completion from OpenRouter.

    If the user is authenticated and has a stored API key, that key is used.
    Otherwise the key must be provided in the request body.
    """
    # Resolve API key: prefer stored key for authenticated users
    api_key = await _resolve_stored_key(request) or body.apiKey

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key is required. Provide it in the request body or store it in your account.",
        )

    if not body.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Messages are required.",
        )

    return StreamingResponse(
        stream_chat_completion(
            api_key=api_key,
            model=body.model,
            messages=body.messages,
            system_prompt=body.systemPrompt,
            max_tokens=body.maxTokens,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
