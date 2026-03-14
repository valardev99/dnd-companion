"""User submission routes — bug reports, feature requests, feedback, questions."""
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user, get_current_user
from app.database import get_db
from app.models import UserSubmission

router = APIRouter(tags=["submissions"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class SubmissionCreate(BaseModel):
    type: str  # "bug" | "feature" | "feedback" | "question"
    title: str
    description: str
    priority: str = "medium"  # "low" | "medium" | "high" | "critical"
    tags: Optional[List[str]] = None


class SubmissionUpdate(BaseModel):
    status: Optional[str] = None  # "new" | "triaged" | "in_progress" | "resolved" | "closed"
    priority: Optional[str] = None  # "low" | "medium" | "high" | "critical"
    assigned_to: Optional[str] = None
    tags: Optional[List[str]] = None


class SubmissionResponse(BaseModel):
    id: str
    user_id: Optional[str]
    type: str
    title: str
    description: str
    priority: str
    status: str
    assigned_to: Optional[str]
    tags: Optional[Any]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
VALID_TYPES = ("bug", "feature", "feedback", "question")
VALID_PRIORITIES = ("low", "medium", "high", "critical")
VALID_STATUSES = ("new", "triaged", "in_progress", "resolved", "closed")


def _submission_to_response(s: UserSubmission) -> SubmissionResponse:
    return SubmissionResponse(
        id=str(s.id),
        user_id=str(s.user_id) if s.user_id else None,
        type=s.type,
        title=s.title,
        description=s.description,
        priority=s.priority,
        status=s.status,
        assigned_to=s.assigned_to,
        tags=s.tags,
        created_at=s.created_at.isoformat(),
        updated_at=s.updated_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/api/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    body: SubmissionCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new submission. Authenticated users only."""
    if body.type not in VALID_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"type must be one of: {', '.join(VALID_TYPES)}",
        )
    if body.priority not in VALID_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"priority must be one of: {', '.join(VALID_PRIORITIES)}",
        )

    submission = UserSubmission(
        user_id=str(user.id),
        type=body.type,
        title=body.title,
        description=body.description,
        priority=body.priority,
        tags=body.tags,
    )
    db.add(submission)
    await db.flush()
    return _submission_to_response(submission)


@router.get("/api/submissions", response_model=List[SubmissionResponse])
async def list_submissions(
    submission_type: Optional[str] = None,
    submission_status: Optional[str] = None,
    limit: int = 100,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List submissions. Admins see all; regular users see only their own."""
    query = select(UserSubmission)

    # Non-admin users can only see their own submissions
    if not user.is_admin:
        query = query.where(UserSubmission.user_id == str(user.id))

    if submission_type:
        query = query.where(UserSubmission.type == submission_type)
    if submission_status:
        query = query.where(UserSubmission.status == submission_status)

    query = query.order_by(UserSubmission.created_at.desc()).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return [_submission_to_response(s) for s in items]


@router.get("/api/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single submission by ID. Admins can view any; users can view their own."""
    result = await db.execute(
        select(UserSubmission).where(UserSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    # Non-admin users can only view their own submissions
    if not user.is_admin and str(submission.user_id) != str(user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this submission")

    return _submission_to_response(submission)


@router.patch("/api/submissions/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: str,
    body: SubmissionUpdate,
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update submission status, priority, assignment, or tags. Admin only."""
    result = await db.execute(
        select(UserSubmission).where(UserSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"status must be one of: {', '.join(VALID_STATUSES)}",
            )
        submission.status = body.status

    if body.priority is not None:
        if body.priority not in VALID_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"priority must be one of: {', '.join(VALID_PRIORITIES)}",
            )
        submission.priority = body.priority

    if body.assigned_to is not None:
        submission.assigned_to = body.assigned_to

    if body.tags is not None:
        submission.tags = body.tags

    db.add(submission)
    await db.flush()
    return _submission_to_response(submission)
