"""Connection test route — verify API key and model connectivity."""
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.config import OPENROUTER_API_URL

router = APIRouter(tags=["test"])


class TestRequest(BaseModel):
    apiKey: str
    model: str = "google/gemini-2.5-flash"


class TestResponse(BaseModel):
    status: str
    message: str
    model: str


@router.post("/api/test", response_model=TestResponse)
async def test_connection(body: TestRequest):
    """Test API key + model connectivity with a minimal OpenRouter request."""
    if not body.apiKey:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key is required",
        )

    payload = {
        "model": body.model,
        "max_tokens": 50,
        "messages": [
            {"role": "user", "content": "Say 'Connection successful.' and nothing else."}
        ],
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {body.apiKey}",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                OPENROUTER_API_URL,
                json=payload,
                headers=headers,
            )

            if response.status_code != 200:
                try:
                    error_json = response.json()
                    msg = error_json.get("error", {}).get("message", response.text)
                except Exception:
                    msg = response.text
                raise HTTPException(status_code=response.status_code, detail=msg)

            result = response.json()
            text = (
                result.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            return TestResponse(status="ok", message=text, model=body.model)

        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Connection error: {exc}",
            )
