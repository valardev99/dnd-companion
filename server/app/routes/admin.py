"""Admin dashboard routes — stats and quality metrics."""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user
from app.database import get_db
from app.models import Campaign, Feedback, User

router = APIRouter(tags=["admin"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class StatsResponse(BaseModel):
    user_count: int
    campaign_count: int
    feedback_count: int


class QualityResponse(BaseModel):
    avg_rating: Optional[float]
    total_feedback: int
    rated_feedback: int
    tag_rates: dict


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/admin/stats", response_model=StatsResponse)
async def admin_stats(
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """High-level platform statistics. Admin only."""
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    campaign_count = (await db.execute(select(func.count(Campaign.id)))).scalar() or 0
    feedback_count = (await db.execute(select(func.count(Feedback.id)))).scalar() or 0

    return StatsResponse(
        user_count=user_count,
        campaign_count=campaign_count,
        feedback_count=feedback_count,
    )


@router.get("/admin/quality", response_model=QualityResponse)
async def admin_quality(
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Quality metrics — average rating and tag distribution. Admin only."""
    # Average rating (only for feedback with a rating)
    avg_result = await db.execute(
        select(func.avg(Feedback.rating)).where(Feedback.rating.is_not(None))
    )
    avg_rating = avg_result.scalar()

    # Total and rated counts
    total_result = await db.execute(select(func.count(Feedback.id)))
    total_feedback = total_result.scalar() or 0

    rated_result = await db.execute(
        select(func.count(Feedback.id)).where(Feedback.rating.is_not(None))
    )
    rated_feedback = rated_result.scalar() or 0

    # Tag frequency — aggregate across all feedback with tags
    # Since tags are stored as JSON arrays, we need to process them in Python
    tag_result = await db.execute(
        select(Feedback.tags).where(Feedback.tags.is_not(None))
    )
    tag_rows = tag_result.scalars().all()
    tag_counts: dict[str, int] = {}
    for tags in tag_rows:
        if isinstance(tags, list):
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

    # Convert to rates (percentage of total feedback)
    tag_rates = {}
    if total_feedback > 0:
        tag_rates = {tag: round(count / total_feedback, 4) for tag, count in tag_counts.items()}

    return QualityResponse(
        avg_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        total_feedback=total_feedback,
        rated_feedback=rated_feedback,
        tag_rates=tag_rates,
    )
