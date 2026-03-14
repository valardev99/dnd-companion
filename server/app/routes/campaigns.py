"""Campaign CRUD routes."""
import logging
import re
import secrets
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import decrypt_api_key, get_current_user
from app.database import get_db
from app.models import Campaign, Story, User
from app.schemas import ShareCampaignResponse
from app.services.recap import generate_recap

logger = logging.getLogger(__name__)

router = APIRouter(tags=["campaigns"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class CampaignCreate(BaseModel):
    name: str
    world_bible: Optional[str] = None
    game_data: Optional[Dict[str, Any]] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    world_bible: Optional[str] = None
    game_data: Optional[Dict[str, Any]] = None


class CampaignResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    world_bible: Optional[str]
    game_data: Optional[Dict[str, Any]]
    is_public: bool
    share_slug: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class RecapRequest(BaseModel):
    chat_messages: Optional[List[Dict[str, Any]]] = None
    model: str = "google/gemini-3-flash-preview"
    title: Optional[str] = None


class RecapResponse(BaseModel):
    id: str
    campaign_id: str
    title: str
    content: str
    likes: int
    is_public: bool
    created_at: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _campaign_to_response(c: Campaign) -> CampaignResponse:
    return CampaignResponse(
        id=str(c.id),
        owner_id=str(c.owner_id),
        name=c.name,
        world_bible=c.world_bible,
        game_data=c.game_data,
        is_public=c.is_public,
        share_slug=c.share_slug,
        created_at=c.created_at.isoformat(),
        updated_at=c.updated_at.isoformat(),
    )


async def _get_owned_campaign(campaign_id: str, user: User, db: AsyncSession) -> Campaign:
    """Fetch a campaign and verify ownership. Raises 404/403 on failure."""
    result = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
    campaign = result.scalar_one_or_none()
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    if str(campaign.owner_id) != str(user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your campaign")
    return campaign


def _slugify(text: str, max_length: int = 60) -> str:
    """Convert text to a URL-friendly slug.

    - Lowercases
    - Replaces non-alphanumeric chars with hyphens
    - Collapses consecutive hyphens
    - Strips leading/trailing hyphens
    - Truncates to max_length
    """
    slug = text.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    slug = slug.strip("-")
    return slug[:max_length]


async def _generate_unique_campaign_slug(
    name: str,
    db: AsyncSession,
    *,
    max_attempts: int = 10,
) -> str:
    """Generate a URL-friendly slug based on the campaign name + random suffix.

    Checks the Campaign.share_slug column for uniqueness and retries with
    different random suffixes if collisions occur.
    """
    base_slug = _slugify(name)
    if not base_slug:
        base_slug = "campaign"

    for _ in range(max_attempts):
        suffix = secrets.token_urlsafe(6)  # ~8 chars of URL-safe randomness
        candidate = f"{base_slug}-{suffix}"

        existing = await db.execute(
            select(Campaign.id).where(Campaign.share_slug == candidate).limit(1)
        )
        if existing.scalar_one_or_none() is None:
            return candidate

    # Extremely unlikely fallback — pure random slug
    return secrets.token_urlsafe(16)


async def _generate_unique_story_slug(
    name: str,
    db: AsyncSession,
    *,
    max_attempts: int = 10,
) -> str:
    """Generate a URL-friendly slug for a Story record."""
    base_slug = _slugify(name)
    if not base_slug:
        base_slug = "story"

    for _ in range(max_attempts):
        suffix = secrets.token_urlsafe(6)
        candidate = f"{base_slug}-{suffix}"

        existing = await db.execute(
            select(Story.id).where(Story.slug == candidate).limit(1)
        )
        if existing.scalar_one_or_none() is None:
            return candidate

    return secrets.token_urlsafe(16)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/campaigns", response_model=List[CampaignResponse])
async def list_campaigns(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all campaigns owned by the current user."""
    result = await db.execute(
        select(Campaign)
        .where(Campaign.owner_id == user.id)
        .order_by(Campaign.updated_at.desc())
    )
    campaigns = result.scalars().all()
    return [_campaign_to_response(c) for c in campaigns]


@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    body: CampaignCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new campaign."""
    campaign = Campaign(
        owner_id=str(user.id),
        name=body.name,
        world_bible=body.world_bible,
        game_data=body.game_data,
    )
    db.add(campaign)
    await db.flush()
    return _campaign_to_response(campaign)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a campaign by ID. Must be the owner."""
    campaign = await _get_owned_campaign(campaign_id, user, db)
    return _campaign_to_response(campaign)


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    body: CampaignUpdate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a campaign's name, world_bible, or game_data."""
    campaign = await _get_owned_campaign(campaign_id, user, db)

    if body.name is not None:
        campaign.name = body.name
    if body.world_bible is not None:
        campaign.world_bible = body.world_bible
    if body.game_data is not None:
        campaign.game_data = body.game_data

    db.add(campaign)
    await db.flush()
    return _campaign_to_response(campaign)


@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a campaign."""
    campaign = await _get_owned_campaign(campaign_id, user, db)
    await db.delete(campaign)
    await db.flush()


@router.post("/campaigns/{campaign_id}/share", response_model=ShareCampaignResponse)
async def share_campaign(
    campaign_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Share a campaign: generate a URL-friendly slug, create a Story record, set public.

    If the campaign already has a share_slug, it is reused. A new Story is
    only created if one doesn't already exist for this campaign.

    Returns the share URL and related identifiers.
    """
    campaign = await _get_owned_campaign(campaign_id, user, db)

    # --- 1. Ensure campaign has a share slug (URL-friendly) -------------------
    if not campaign.share_slug:
        campaign.share_slug = await _generate_unique_campaign_slug(campaign.name, db)
    campaign.is_public = True
    db.add(campaign)
    await db.flush()

    # --- 2. Ensure a Story record exists for this campaign --------------------
    story_result = await db.execute(
        select(Story).where(Story.campaign_id == campaign.id).limit(1)
    )
    story = story_result.scalar_one_or_none()

    if story is None:
        # Extract character/world info from game_data if available
        game_data = campaign.game_data or {}
        character_name = None
        world_name = None
        recap_text = None

        if isinstance(game_data, dict):
            character_name = (
                game_data.get("characterName")
                or game_data.get("character_name")
            )
            world_name = (
                game_data.get("worldName")
                or game_data.get("world_name")
            )

            # Look for recap in game_data
            recaps = game_data.get("recaps") or game_data.get("recap")
            if isinstance(recaps, list) and recaps:
                recap_text = recaps[-1] if isinstance(recaps[-1], str) else str(recaps[-1])
            elif isinstance(recaps, str):
                recap_text = recaps

        # Build story title and content
        title = f"{campaign.name} — Adventure Recap"
        content = recap_text or f"An adventure in the world of {world_name or campaign.name}."
        excerpt = content[:500] if len(content) > 500 else content

        story_slug = await _generate_unique_story_slug(campaign.name, db)

        story = Story(
            campaign_id=str(campaign.id),
            user_id=str(user.id),
            slug=story_slug,
            title=title,
            excerpt=excerpt,
            content=content,
            author_display_name=user.username,
            character_name=character_name,
            world_name=world_name,
            recap_text=recap_text,
            is_public=True,
        )
        db.add(story)
        await db.flush()

    # --- 3. Build share URL ---------------------------------------------------
    share_url = f"/share/{campaign.share_slug}"

    return ShareCampaignResponse(
        campaign_id=str(campaign.id),
        story_id=str(story.id),
        share_slug=campaign.share_slug,
        share_url=share_url,
        story_slug=story.slug,
    )


@router.post("/campaigns/{campaign_id}/recap", response_model=RecapResponse, status_code=status.HTTP_201_CREATED)
async def create_recap(
    campaign_id: str,
    body: RecapRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a dramatic story recap for a campaign and store it.

    Uses the user's stored OpenRouter API key to call the LLM. The recap
    is persisted as a Story row linked to the campaign.
    """
    campaign = await _get_owned_campaign(campaign_id, user, db)

    # Resolve the user's API key
    if not user.encrypted_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API key stored. Please save your OpenRouter API key in account settings.",
        )

    try:
        api_key = decrypt_api_key(user.encrypted_api_key)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt API key. Please re-save your key.",
        )

    # Generate the recap via the LLM
    try:
        recap_text = await generate_recap(
            game_data=campaign.game_data,
            chat_messages=body.chat_messages,
            world_bible=campaign.world_bible,
            api_key=api_key,
            model=body.model,
        )
    except RuntimeError as exc:
        logger.error("Recap generation failed for campaign %s: %s", campaign_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Recap generation failed: {exc}",
        )

    # Build a title — use the provided one or auto-generate from campaign name
    title = body.title or f"Recap: {campaign.name}"

    # Extract character/world info from game_data for the story
    game_data = campaign.game_data or {}
    character_name = None
    world_name = None
    if isinstance(game_data, dict):
        character_name = game_data.get("characterName") or game_data.get("character_name")
        world_name = game_data.get("worldName") or game_data.get("world_name")

    excerpt = recap_text[:500] if len(recap_text) > 500 else recap_text
    story_slug = await _generate_unique_story_slug(campaign.name, db)

    # Persist as a Story
    story = Story(
        campaign_id=str(campaign.id),
        user_id=str(user.id),
        slug=story_slug,
        title=title,
        excerpt=excerpt,
        content=recap_text,
        author_display_name=user.username,
        character_name=character_name,
        world_name=world_name,
        recap_text=recap_text,
    )
    db.add(story)
    await db.flush()

    return RecapResponse(
        id=str(story.id),
        campaign_id=str(story.campaign_id),
        title=story.title,
        content=story.content,
        likes=story.likes,
        is_public=story.is_public,
        created_at=story.created_at.isoformat(),
    )
