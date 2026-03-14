"""Pydantic models for request/response validation."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class APIKeyUpdate(BaseModel):
    api_key: str


# ---------------------------------------------------------------------------
# Campaign
# ---------------------------------------------------------------------------

class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    game_data: Optional[dict[str, Any]] = None
    world_bible: Optional[str] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    game_data: Optional[dict[str, Any]] = None
    world_bible: Optional[str] = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    game_data: Optional[dict[str, Any]]
    world_bible: Optional[str]
    share_slug: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CampaignListItem(BaseModel):
    id: str
    name: str
    is_public: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

class FeedbackCreate(BaseModel):
    category: Optional[str] = Field(None, pattern="^(idea|bug|question|rating)$")
    message: str = Field(..., min_length=1)
    rating: Optional[int] = Field(None, ge=1, le=5)


class FeedbackResponse(BaseModel):
    id: str
    category: Optional[str]
    message: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Story (Recaps)
# ---------------------------------------------------------------------------

class StoryCreate(BaseModel):
    campaign_id: str
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    excerpt: Optional[str] = Field(None, max_length=500)
    character_name: Optional[str] = Field(None, max_length=150)
    world_name: Optional[str] = Field(None, max_length=255)
    recap_text: Optional[str] = None


class StoryResponse(BaseModel):
    """Basic story response (used in lists)."""
    id: str
    campaign_id: str
    title: str
    content: str
    likes: int
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StoryFeedItem(BaseModel):
    """Enriched story item for the public stories feed."""
    id: str
    slug: Optional[str] = None
    title: str
    excerpt: Optional[str] = None
    author_display_name: Optional[str] = None
    character_name: Optional[str] = None
    world_name: Optional[str] = None
    likes: int
    liked_by_me: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class StoryDetailResponse(BaseModel):
    """Full detail for a single story view."""
    id: str
    slug: Optional[str] = None
    campaign_id: str
    title: str
    excerpt: Optional[str] = None
    content: str
    author_display_name: Optional[str] = None
    character_name: Optional[str] = None
    world_name: Optional[str] = None
    recap_text: Optional[str] = None
    likes: int
    liked_by_me: bool = False
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedStories(BaseModel):
    """Paginated wrapper for story feed items."""
    items: List[StoryFeedItem]
    total: int
    page: int
    page_size: int


class StoryLikeResponse(BaseModel):
    """Response after toggling a story like."""
    status: str
    liked: bool
    likes: int


class ShareCampaignResponse(BaseModel):
    """Response after sharing a campaign (creates a Story + share slug)."""
    campaign_id: str
    story_id: str
    share_slug: str
    share_url: str
    story_slug: Optional[str] = None


class PublicShareResponse(BaseModel):
    """Public view of a shared campaign via slug."""
    campaign_name: str
    character_name: Optional[str] = None
    world_name: Optional[str] = None
    recap_text: Optional[str] = None
    game_data: Optional[Dict[str, Any]] = None
    world_bible: Optional[str] = None
    story_title: Optional[str] = None
    story_excerpt: Optional[str] = None
    likes: int = 0
    created_at: datetime
