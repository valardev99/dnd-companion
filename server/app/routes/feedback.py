"""Feedback routes — submit, list, and manage user feedback."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user, get_optional_user
from app.database import get_db
from app.models import Feedback

router = APIRouter(tags=["feedback"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class FeedbackCreate(BaseModel):
    category: Optional[str] = None
    message: str
    rating: Optional[int] = None
    tags: Optional[List[str]] = None


class FeedbackUpdate(BaseModel):
    status: str


class FeedbackResponse(BaseModel):
    id: str
    user_id: Optional[str]
    category: Optional[str]
    message: str
    rating: Optional[int]
    tags: Optional[Any]
    status: str
    created_at: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _feedback_to_response(f: Feedback) -> FeedbackResponse:
    return FeedbackResponse(
        id=str(f.id),
        user_id=str(f.user_id) if f.user_id else None,
        category=f.category,
        message=f.message,
        rating=f.rating,
        tags=f.tags,
        status=f.status,
        created_at=f.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/api/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    body: FeedbackCreate,
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit feedback. Authentication is optional."""
    feedback = Feedback(
        user_id=str(user.id) if user else None,
        category=body.category,
        message=body.message,
        rating=body.rating,
        tags=body.tags,
    )
    db.add(feedback)
    await db.flush()
    return _feedback_to_response(feedback)


@router.get("/api/feedback", response_model=List[FeedbackResponse])
async def list_feedback(
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all feedback entries. Admin only."""
    result = await db.execute(
        select(Feedback).order_by(Feedback.created_at.desc())
    )
    items = result.scalars().all()
    return [_feedback_to_response(f) for f in items]


@router.put("/api/feedback/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: str,
    body: FeedbackUpdate,
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update feedback status. Admin only."""
    result = await db.execute(select(Feedback).where(Feedback.id == feedback_id))
    feedback = result.scalar_one_or_none()
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    feedback.status = body.status
    db.add(feedback)
    await db.flush()
    return _feedback_to_response(feedback)
