"""Quality tracking routes — rate DM responses, log metrics, view stats."""
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user, get_current_user, get_optional_user
from app.database import get_db
from app.models import QualityLog

router = APIRouter(tags=["quality"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class QualityRateRequest(BaseModel):
    """Submit a user rating for a specific DM response."""
    message_id: Optional[str] = None
    campaign_id: Optional[str] = None
    rating: int  # 1-5


class QualityLogRequest(BaseModel):
    """Log quality metrics for a DM response (typically sent by the frontend automatically)."""
    message_id: Optional[str] = None
    campaign_id: Optional[str] = None
    rating: Optional[int] = None  # 1-5
    tag_count: Optional[int] = None
    word_count: Optional[int] = None
    expected_tags: Optional[List[str]] = None
    missing_tags: Optional[List[str]] = None
    response_time_ms: Optional[int] = None
    model_used: Optional[str] = None


class QualityLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    campaign_id: Optional[str]
    message_id: Optional[str]
    rating: Optional[int]
    tag_count: Optional[int]
    word_count: Optional[int]
    expected_tags: Optional[Any]
    missing_tags: Optional[Any]
    response_time_ms: Optional[int]
    model_used: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class QualityStatsResponse(BaseModel):
    total_logs: int
    total_rated: int
    avg_rating: Optional[float]
    avg_response_time_ms: Optional[float]
    avg_word_count: Optional[float]
    avg_tag_count: Optional[float]
    rating_distribution: dict  # {1: count, 2: count, ...}
    model_breakdown: dict  # {model_name: count}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _quality_to_response(q: QualityLog) -> QualityLogResponse:
    return QualityLogResponse(
        id=str(q.id),
        user_id=str(q.user_id) if q.user_id else None,
        campaign_id=str(q.campaign_id) if q.campaign_id else None,
        message_id=q.message_id,
        rating=q.rating,
        tag_count=q.tag_count,
        word_count=q.word_count,
        expected_tags=q.expected_tags,
        missing_tags=q.missing_tags,
        response_time_ms=q.response_time_ms,
        model_used=q.model_used,
        created_at=q.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/api/quality/rate", response_model=QualityLogResponse, status_code=status.HTTP_201_CREATED)
async def rate_response(
    body: QualityRateRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a user rating (1-5) for a DM response. Authenticated users only."""
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rating must be between 1 and 5",
        )

    log = QualityLog(
        user_id=str(user.id),
        campaign_id=body.campaign_id,
        message_id=body.message_id,
        rating=body.rating,
    )
    db.add(log)
    await db.flush()
    return _quality_to_response(log)


@router.post("/api/quality/log", response_model=QualityLogResponse, status_code=status.HTTP_201_CREATED)
async def log_quality_metrics(
    body: QualityLogRequest,
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Log quality metrics for a DM response. Auth optional (frontend can log anonymously)."""
    if body.rating is not None and (body.rating < 1 or body.rating > 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rating must be between 1 and 5",
        )

    log = QualityLog(
        user_id=str(user.id) if user else None,
        campaign_id=body.campaign_id,
        message_id=body.message_id,
        rating=body.rating,
        tag_count=body.tag_count,
        word_count=body.word_count,
        expected_tags=body.expected_tags,
        missing_tags=body.missing_tags,
        response_time_ms=body.response_time_ms,
        model_used=body.model_used,
    )
    db.add(log)
    await db.flush()
    return _quality_to_response(log)


@router.get("/api/quality/stats", response_model=QualityStatsResponse)
async def quality_stats(
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated quality statistics. Admin only."""
    # Total logs
    total_result = await db.execute(select(func.count(QualityLog.id)))
    total_logs = total_result.scalar() or 0

    # Total with ratings
    rated_result = await db.execute(
        select(func.count(QualityLog.id)).where(QualityLog.rating.is_not(None))
    )
    total_rated = rated_result.scalar() or 0

    # Average rating
    avg_rating_result = await db.execute(
        select(func.avg(QualityLog.rating)).where(QualityLog.rating.is_not(None))
    )
    avg_rating = avg_rating_result.scalar()

    # Average response time
    avg_time_result = await db.execute(
        select(func.avg(QualityLog.response_time_ms)).where(QualityLog.response_time_ms.is_not(None))
    )
    avg_response_time_ms = avg_time_result.scalar()

    # Average word count
    avg_wc_result = await db.execute(
        select(func.avg(QualityLog.word_count)).where(QualityLog.word_count.is_not(None))
    )
    avg_word_count = avg_wc_result.scalar()

    # Average tag count
    avg_tc_result = await db.execute(
        select(func.avg(QualityLog.tag_count)).where(QualityLog.tag_count.is_not(None))
    )
    avg_tag_count = avg_tc_result.scalar()

    # Rating distribution (1-5)
    rating_distribution: dict[str, int] = {}
    for r in range(1, 6):
        count_result = await db.execute(
            select(func.count(QualityLog.id)).where(QualityLog.rating == r)
        )
        count = count_result.scalar() or 0
        rating_distribution[str(r)] = count

    # Model breakdown — count per model_used value
    model_rows = await db.execute(
        select(QualityLog.model_used, func.count(QualityLog.id))
        .where(QualityLog.model_used.is_not(None))
        .group_by(QualityLog.model_used)
    )
    model_breakdown = {row[0]: row[1] for row in model_rows.all()}

    return QualityStatsResponse(
        total_logs=total_logs,
        total_rated=total_rated,
        avg_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        avg_response_time_ms=round(float(avg_response_time_ms), 1) if avg_response_time_ms is not None else None,
        avg_word_count=round(float(avg_word_count), 1) if avg_word_count is not None else None,
        avg_tag_count=round(float(avg_tag_count), 1) if avg_tag_count is not None else None,
        rating_distribution=rating_distribution,
        model_breakdown=model_breakdown,
    )
