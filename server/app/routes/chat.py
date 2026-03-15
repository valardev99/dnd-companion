"""Chat SSE proxy route — streams LLM completions from OpenRouter."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import decrypt_api_key, get_optional_user
from app.database import get_db
from app.services.openrouter import stream_chat_completion

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    apiKey: Optional[str] = None
    model: str = "google/gemini-2.5-flash"
    messages: List[Dict[str, Any]]
    systemPrompt: Optional[str] = None
    maxTokens: int = 4096


@router.post("/api/chat")
async def chat(
    body: ChatRequest,
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream a chat completion from OpenRouter.

    If the user is authenticated and has a stored API key, that key is used.
    Otherwise the key must be provided in the request body.
    """
    # Resolve API key: prefer stored key for authenticated users
    api_key = body.apiKey
    if user is not None and user.encrypted_api_key:
        try:
            api_key = decrypt_api_key(user.encrypted_api_key)
        except Exception:
            # Fall back to body key if decryption fails
            pass

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
