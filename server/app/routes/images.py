"""Image generation route — generates character/NPC portraits via xAI Grok."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import decrypt_api_key, get_optional_user
from app.database import get_db
from app.services.image_gen import generate_portrait

router = APIRouter(tags=["images"])


class ImageRequest(BaseModel):
    apiKey: Optional[str] = None
    name: str
    race: str = ""
    characterClass: str = ""
    description: str = ""
    role: str = ""
    relationship: str = ""


@router.post("/api/generate-image")
async def generate_image(
    body: ImageRequest,
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a character/NPC portrait image.

    Uses the xAI Grok Imagine API. Requires an xAI API key
    provided in the request body or stored in the user's account.
    """
    # Resolve API key
    api_key = body.apiKey
    if user is not None and user.encrypted_api_key:
        try:
            api_key = decrypt_api_key(user.encrypted_api_key)
        except Exception:
            pass

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="xAI API key is required for image generation.",
        )

    result = await generate_portrait(
        api_key=api_key,
        name=body.name,
        race=body.race,
        character_class=body.characterClass,
        description=body.description,
        role=body.role,
        relationship=body.relationship,
    )

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result["error"],
        )

    return result
