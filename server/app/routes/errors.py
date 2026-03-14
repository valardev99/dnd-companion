"""Error log routes — report, list, update, and auto-resolve errors."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_admin_user, get_optional_user
from app.database import get_db
from app.models import ErrorLog

router = APIRouter(tags=["errors"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ErrorLogCreate(BaseModel):
    error_type: str  # "frontend" | "backend" | "api"
    error_code: Optional[str] = None
    message: str
    stack_trace: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ErrorLogUpdate(BaseModel):
    resolution_status: Optional[str] = None  # "new" | "investigating" | "resolved" | "wont_fix"
    resolution_notes: Optional[str] = None


class ErrorLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    error_type: str
    error_code: Optional[str]
    message: str
    stack_trace: Optional[str]
    context: Optional[Any]
    resolution_status: str
    resolution_notes: Optional[str]
    auto_resolved: bool
    created_at: str

    class Config:
        from_attributes = True


class AutoResolveResult(BaseModel):
    resolved_count: int
    patterns_matched: List[str]


# ---------------------------------------------------------------------------
# Known error patterns for auto-resolution
# ---------------------------------------------------------------------------
AUTO_RESOLVE_PATTERNS = [
    {
        "pattern": "ResizeObserver loop",
        "resolution": "Benign browser warning — ResizeObserver loop limit exceeded. No action needed.",
    },
    {
        "pattern": "Failed to fetch",
        "resolution": "Transient network error — client lost connectivity momentarily.",
    },
    {
        "pattern": "AbortError",
        "resolution": "Request was intentionally aborted (e.g. navigation or component unmount).",
    },
    {
        "pattern": "ChunkLoadError",
        "resolution": "Stale JS chunk after deployment. User needs to refresh the page.",
    },
    {
        "pattern": "Loading chunk",
        "resolution": "Stale JS chunk after deployment. User needs to refresh the page.",
    },
    {
        "pattern": "Network Error",
        "resolution": "Transient network connectivity issue. No server-side action required.",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _error_to_response(e: ErrorLog) -> ErrorLogResponse:
    return ErrorLogResponse(
        id=str(e.id),
        user_id=str(e.user_id) if e.user_id else None,
        error_type=e.error_type,
        error_code=e.error_code,
        message=e.message,
        stack_trace=e.stack_trace,
        context=e.context,
        resolution_status=e.resolution_status,
        resolution_notes=e.resolution_notes,
        auto_resolved=e.auto_resolved,
        created_at=e.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/api/errors", response_model=ErrorLogResponse, status_code=status.HTTP_201_CREATED)
async def log_error(
    body: ErrorLogCreate,
    user=Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a new error. No authentication required (frontend can report anonymously)."""
    if body.error_type not in ("frontend", "backend", "api"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="error_type must be one of: frontend, backend, api",
        )

    error = ErrorLog(
        user_id=str(user.id) if user else None,
        error_type=body.error_type,
        error_code=body.error_code,
        message=body.message,
        stack_trace=body.stack_trace,
        context=body.context,
    )
    db.add(error)
    await db.flush()
    return _error_to_response(error)


@router.get("/api/errors", response_model=List[ErrorLogResponse])
async def list_errors(
    resolution_status: Optional[str] = None,
    error_type: Optional[str] = None,
    limit: int = 100,
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List error logs with optional filters. Admin only."""
    query = select(ErrorLog)

    if resolution_status:
        query = query.where(ErrorLog.resolution_status == resolution_status)
    if error_type:
        query = query.where(ErrorLog.error_type == error_type)

    query = query.order_by(ErrorLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return [_error_to_response(e) for e in items]


@router.patch("/api/errors/{error_id}", response_model=ErrorLogResponse)
async def update_error(
    error_id: str,
    body: ErrorLogUpdate,
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an error's resolution status and/or notes. Admin only."""
    result = await db.execute(select(ErrorLog).where(ErrorLog.id == error_id))
    error = result.scalar_one_or_none()
    if error is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Error log not found")

    if body.resolution_status is not None:
        if body.resolution_status not in ("new", "investigating", "resolved", "wont_fix"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="resolution_status must be one of: new, investigating, resolved, wont_fix",
            )
        error.resolution_status = body.resolution_status

    if body.resolution_notes is not None:
        error.resolution_notes = body.resolution_notes

    db.add(error)
    await db.flush()
    return _error_to_response(error)


@router.post("/api/errors/auto-resolve", response_model=AutoResolveResult)
async def auto_resolve_errors(
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Auto-resolve known error patterns. Admin only.

    Scans all unresolved errors and matches them against known benign patterns,
    marking matches as resolved with an explanation.
    """
    result = await db.execute(
        select(ErrorLog).where(ErrorLog.resolution_status == "new")
    )
    unresolved = result.scalars().all()

    resolved_count = 0
    patterns_matched: List[str] = []

    for error in unresolved:
        for pattern_info in AUTO_RESOLVE_PATTERNS:
            if pattern_info["pattern"].lower() in error.message.lower():
                error.resolution_status = "resolved"
                error.resolution_notes = pattern_info["resolution"]
                error.auto_resolved = True
                db.add(error)
                resolved_count += 1
                if pattern_info["pattern"] not in patterns_matched:
                    patterns_matched.append(pattern_info["pattern"])
                break  # Only match the first pattern per error

    await db.flush()

    return AutoResolveResult(
        resolved_count=resolved_count,
        patterns_matched=patterns_matched,
    )
