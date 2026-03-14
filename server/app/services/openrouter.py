"""OpenRouter SSE streaming service.

Handles communication with the OpenRouter API, translating server-sent events
from OpenRouter's OpenAI-compatible format into the client-expected format.
"""
import json
from typing import AsyncGenerator, List, Optional

import httpx

from app.config import OPENROUTER_API_URL


def _translate_openrouter_sse(line: str) -> Optional[str]:
    """Translate an OpenRouter SSE data line to the client SSE format.

    OpenRouter emits:
        data: {"choices":[{"delta":{"content":"text"}}]}
    We translate to:
        data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"text"}}

    The [DONE] sentinel becomes:
        data: {"type":"message_stop"}
    """
    raw = line[6:].strip()  # strip "data: " prefix
    if raw == "[DONE]":
        return 'data: {"type":"message_stop"}'

    try:
        event = json.loads(raw)
        choices = event.get("choices", [])
        if not choices:
            return None

        delta = choices[0].get("delta", {})
        content = delta.get("content")
        if content is not None:
            translated = {
                "type": "content_block_delta",
                "delta": {"type": "text_delta", "text": content},
            }
            return f"data: {json.dumps(translated)}"

        # Propagate upstream errors
        if "error" in event:
            err = {"type": "error", "error": {"message": str(event["error"])}}
            return f"data: {json.dumps(err)}"

        return None
    except (json.JSONDecodeError, KeyError, IndexError):
        return None


async def stream_chat_completion(
    api_key: str,
    model: str,
    messages: List[dict],
    system_prompt: Optional[str] = None,
    max_tokens: int = 4096,
) -> AsyncGenerator[str, None]:
    """Stream chat completions from OpenRouter, yielding translated SSE events.

    This is an async generator that:
    1. Builds the OpenRouter request payload
    2. Opens an httpx streaming connection
    3. Yields each translated SSE line to the caller

    Args:
        api_key: OpenRouter API key.
        model: Model identifier (e.g. "google/gemini-3-flash-preview").
        messages: Chat message history.
        system_prompt: Optional system prompt prepended as a system message.
        max_tokens: Maximum tokens for the completion.

    Yields:
        Translated SSE event strings (each line includes the "data: " prefix).
    """
    # Build message list with optional system prompt
    api_messages: List[dict] = []
    if system_prompt:
        api_messages.append({"role": "system", "content": system_prompt})
    api_messages.extend(messages)

    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "stream": True,
        "messages": api_messages,
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "Accept": "text/event-stream",
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0)) as client:
        try:
            async with client.stream(
                "POST",
                OPENROUTER_API_URL,
                json=payload,
                headers=headers,
            ) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    error_text = error_body.decode("utf-8", errors="replace")
                    err = {"type": "error", "error": {"message": error_text}}
                    yield f"data: {json.dumps(err)}\n\n"
                    return

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    if line.startswith("data: "):
                        translated = _translate_openrouter_sse(line)
                        if translated:
                            yield f"{translated}\n\n"
                            # Stop iterating after [DONE]
                            if '"message_stop"' in translated:
                                return
                    # Forward non-data SSE fields (e.g. event:, id:) as-is
                    # (unlikely from OpenRouter but safe)

        except httpx.HTTPStatusError as exc:
            err = {"type": "error", "error": {"message": str(exc)}}
            yield f"data: {json.dumps(err)}\n\n"
        except httpx.RequestError as exc:
            err = {"type": "error", "error": {"message": f"Connection error: {exc}"}}
            yield f"data: {json.dumps(err)}\n\n"
