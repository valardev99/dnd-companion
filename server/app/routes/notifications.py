"""Notifications routes — list, read, and manage user notifications."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification
from app.schemas import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _notification_to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=str(n.id),
        type=n.type,
        title=n.title,
        body=n.body,
        data=n.data,
        read=n.read,
        created_at=n.created_at,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all notifications for the current user (newest first, limit 50)."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == str(user.id))
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifications = result.scalars().all()
    return [_notification_to_response(n) for n in notifications]


@router.get("/unread-count")
async def unread_count(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the count of unread notifications."""
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == str(user.id),
            Notification.read == False,  # noqa: E712
        )
    )
    count = result.scalar()
    return {"unread_count": count}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == str(user.id),
        )
    )
    notification = result.scalar_one_or_none()
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.read = True
    await db.flush()
    return _notification_to_response(notification)


@router.post("/read-all")
async def mark_all_as_read(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == str(user.id),
            Notification.read == False,  # noqa: E712
        )
        .values(read=True)
    )
    await db.flush()
    return {"status": "all_read"}
