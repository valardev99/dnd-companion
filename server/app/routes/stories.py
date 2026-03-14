"""Public stories routes — browse, view detail, and like community recaps."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_optional_user
from app.database import get_db
from app.models import Story, StoryLike, Campaign
from app.schemas import (
    PaginatedStories,
    StoryDetailResponse,
    StoryFeedItem,
    StoryLikeResponse,
    PublicShareResponse,
)

router = APIRouter(tags=["stories"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _story_to_feed_item(story: Story, liked_by_me: bool = False) -> StoryFeedItem:
    """Convert a Story ORM object to a feed-item schema."""
    return StoryFeedItem(
        id=str(story.id),
        slug=story.slug,
        title=story.title,
        excerpt=story.excerpt or (story.content[:200] + "..." if story.content and len(story.content) > 200 else story.content),
        author_display_name=story.author_display_name,
        character_name=story.character_name,
        world_name=story.world_name,
        likes=story.likes or 0,
        liked_by_me=liked_by_me,
        created_at=story.created_at,
    )


def _story_to_detail(story: Story, liked_by_me: bool = False) -> StoryDetailResponse:
    """Convert a Story ORM object to a full-detail schema."""
    return StoryDetailResponse(
        id=str(story.id),
        slug=story.slug,
        campaign_id=str(story.campaign_id),
        title=story.title,
        excerpt=story.excerpt,
        content=story.content,
        author_display_name=story.author_display_name,
        character_name=story.character_name,
        world_name=story.world_name,
        recap_text=story.recap_text,
        likes=story.likes or 0,
        liked_by_me=liked_by_me,
        is_public=story.is_public,
        created_at=story.created_at,
        updated_at=story.updated_at,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/stories", response_model=PaginatedStories)
async def list_stories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=200, description="Search stories by title or character name"),
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Paginated list of public story recaps with optional search."""
    base_filter = Story.is_public == True  # noqa: E712

    # Optional text search on title/character/world
    if search:
        like_pattern = f"%{search}%"
        search_filter = and_(
            base_filter,
            (
                Story.title.ilike(like_pattern)
                | Story.character_name.ilike(like_pattern)
                | Story.world_name.ilike(like_pattern)
                | Story.author_display_name.ilike(like_pattern)
            ),
        )
    else:
        search_filter = base_filter

    # Total count
    count_result = await db.execute(
        select(func.count(Story.id)).where(search_filter)
    )
    total = count_result.scalar() or 0

    # Paginated results
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Story)
        .where(search_filter)
        .order_by(Story.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    stories = result.scalars().all()

    # Determine which stories the current user has liked
    liked_story_ids: set = set()
    if user and stories:
        story_ids = [s.id for s in stories]
        like_result = await db.execute(
            select(StoryLike.story_id).where(
                and_(
                    StoryLike.user_id == str(user.id),
                    StoryLike.story_id.in_(story_ids),
                )
            )
        )
        liked_story_ids = {row[0] for row in like_result.fetchall()}

    return PaginatedStories(
        items=[
            _story_to_feed_item(s, liked_by_me=(s.id in liked_story_ids))
            for s in stories
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/stories/{story_id}", response_model=StoryDetailResponse)
async def get_story(
    story_id: str,
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full details of a single story. Public stories are visible to everyone."""
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()

    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    # Non-public stories are only visible to the author
    if not story.is_public:
        if user is None or str(user.id) != str(story.user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    # Check if current user has liked this story
    liked_by_me = False
    if user:
        like_result = await db.execute(
            select(StoryLike.id).where(
                and_(
                    StoryLike.story_id == story_id,
                    StoryLike.user_id == str(user.id),
                )
            )
        )
        liked_by_me = like_result.scalar_one_or_none() is not None

    return _story_to_detail(story, liked_by_me=liked_by_me)


@router.post("/stories/{story_id}/like", response_model=StoryLikeResponse)
async def toggle_like_story(
    story_id: str,
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle like on a public story.

    - Authenticated users: tracked toggle (like/unlike).
    - Unauthenticated users: simple increment (no unlike capability).
    """
    result = await db.execute(select(Story).where(Story.id == story_id))
    story = result.scalar_one_or_none()

    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    if not story.is_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    if user:
        # Check for existing like
        existing_like = await db.execute(
            select(StoryLike).where(
                and_(
                    StoryLike.story_id == story_id,
                    StoryLike.user_id == str(user.id),
                )
            )
        )
        existing = existing_like.scalar_one_or_none()

        if existing:
            # Unlike — remove the record and decrement
            await db.delete(existing)
            story.likes = max((story.likes or 0) - 1, 0)
            liked = False
        else:
            # Like — create the record and increment
            new_like = StoryLike(story_id=story_id, user_id=str(user.id))
            db.add(new_like)
            story.likes = (story.likes or 0) + 1
            liked = True
    else:
        # Anonymous like — simple increment, no toggle
        story.likes = (story.likes or 0) + 1
        liked = True

    db.add(story)
    await db.flush()

    return StoryLikeResponse(
        status="ok",
        liked=liked,
        likes=story.likes,
    )


# ---------------------------------------------------------------------------
# Public share route — no auth required
# ---------------------------------------------------------------------------
@router.get("/share/{slug}", response_model=PublicShareResponse)
async def get_public_share(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Return public campaign view data by share slug.

    Looks up the campaign by its share_slug. If a corresponding Story exists
    for that campaign, enriches the response with story metadata.
    """
    # Look up campaign by share slug
    result = await db.execute(
        select(Campaign).where(
            and_(
                Campaign.share_slug == slug,
                Campaign.is_public == True,  # noqa: E712
            )
        )
    )
    campaign = result.scalar_one_or_none()

    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared campaign not found",
        )

    # Try to find the most recent public story for this campaign
    story_result = await db.execute(
        select(Story)
        .where(
            and_(
                Story.campaign_id == campaign.id,
                Story.is_public == True,  # noqa: E712
            )
        )
        .order_by(Story.created_at.desc())
        .limit(1)
    )
    story = story_result.scalar_one_or_none()

    # Extract character info from game_data if available
    game_data = campaign.game_data or {}
    character_name = None
    if story and story.character_name:
        character_name = story.character_name
    elif isinstance(game_data, dict):
        character_name = game_data.get("characterName") or game_data.get("character_name")

    world_name = None
    if story and story.world_name:
        world_name = story.world_name

    recap_text = None
    if story and story.recap_text:
        recap_text = story.recap_text

    return PublicShareResponse(
        campaign_name=campaign.name,
        character_name=character_name,
        world_name=world_name,
        recap_text=recap_text,
        game_data=campaign.game_data,
        world_bible=campaign.world_bible,
        story_title=story.title if story else None,
        story_excerpt=story.excerpt or (story.content[:300] + "..." if story and story.content and len(story.content) > 300 else (story.content if story else None)),
        likes=story.likes if story else 0,
        created_at=story.created_at if story else campaign.created_at,
    )
