"""Friends routes — friend codes, requests, and friend list management."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import FriendRequest, Friendship, Notification, User
from app.schemas import FriendCodeLookup, FriendRequestResponse, FriendResponse

router = APIRouter(prefix="/api/friends", tags=["friends"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _user_to_friend_response(user: User) -> FriendResponse:
    return FriendResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        friend_code=user.friend_code,
        is_online=False,
        status="offline",
        last_seen=None,
        current_campaign_name=None,
    )


def _friend_request_to_response(fr: FriendRequest) -> FriendRequestResponse:
    return FriendRequestResponse(
        id=str(fr.id),
        from_user=_user_to_friend_response(fr.from_user),
        status=fr.status,
        created_at=fr.created_at,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/me/code")
async def get_my_friend_code(user=Depends(get_current_user)):
    """Return the current user's friend code."""
    return {"friend_code": user.friend_code}


@router.post("/request", response_model=FriendRequestResponse, status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    body: FriendCodeLookup,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a friend request by friend code."""
    # Look up target user
    result = await db.execute(
        select(User).where(User.friend_code == body.friend_code)
    )
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user found with that friend code")

    if str(target.id) == str(user.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot send a friend request to yourself")

    # Check if already friends
    existing_friendship = await db.execute(
        select(Friendship).where(
            Friendship.user_id == str(user.id),
            Friendship.friend_id == str(target.id),
        )
    )
    if existing_friendship.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already friends with this user")

    # Check for existing pending request (in either direction)
    existing_request = await db.execute(
        select(FriendRequest).where(
            FriendRequest.status == "pending",
            or_(
                (FriendRequest.from_user_id == str(user.id)) & (FriendRequest.to_user_id == str(target.id)),
                (FriendRequest.from_user_id == str(target.id)) & (FriendRequest.to_user_id == str(user.id)),
            ),
        )
    )
    if existing_request.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A pending friend request already exists")

    # Create the friend request
    fr = FriendRequest(
        from_user_id=str(user.id),
        to_user_id=str(target.id),
        status="pending",
    )
    db.add(fr)

    # Create notification for target user
    notification = Notification(
        user_id=str(target.id),
        type="friend_request",
        title="New Friend Request",
        body=f"{user.username} wants to be your friend!",
        data={"friend_request_id": str(fr.id), "from_user_id": str(user.id)},
    )
    db.add(notification)

    await db.flush()

    # Eagerly load the from_user relationship
    await db.refresh(fr, attribute_names=["from_user"])
    return _friend_request_to_response(fr)


@router.post("/request/{request_id}/accept", response_model=FriendResponse)
async def accept_friend_request(
    request_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a friend request, creating a bidirectional friendship."""
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == str(user.id),
            FriendRequest.status == "pending",
        )
    )
    fr = result.scalar_one_or_none()
    if fr is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found")

    fr.status = "accepted"

    # Create bidirectional friendship records
    friendship_a = Friendship(user_id=str(user.id), friend_id=str(fr.from_user_id))
    friendship_b = Friendship(user_id=str(fr.from_user_id), friend_id=str(user.id))
    db.add(friendship_a)
    db.add(friendship_b)

    # Notify the sender that request was accepted
    notification = Notification(
        user_id=str(fr.from_user_id),
        type="friend_request_accepted",
        title="Friend Request Accepted",
        body=f"{user.username} accepted your friend request!",
        data={"friend_id": str(user.id)},
    )
    db.add(notification)

    await db.flush()

    # Return the new friend's info
    sender_result = await db.execute(select(User).where(User.id == fr.from_user_id))
    sender = sender_result.scalar_one()
    return _user_to_friend_response(sender)


@router.post("/request/{request_id}/decline", status_code=status.HTTP_200_OK)
async def decline_friend_request(
    request_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Decline a friend request."""
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == str(user.id),
            FriendRequest.status == "pending",
        )
    )
    fr = result.scalar_one_or_none()
    if fr is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found")

    fr.status = "declined"
    await db.flush()
    return {"status": "declined"}


@router.get("/", response_model=List[FriendResponse])
async def list_friends(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all friends of the current user."""
    result = await db.execute(
        select(Friendship).where(Friendship.user_id == str(user.id))
    )
    friendships = result.scalars().all()

    if not friendships:
        return []

    friend_ids = [str(f.friend_id) for f in friendships]
    friends_result = await db.execute(
        select(User).where(User.id.in_(friend_ids))
    )
    friends = friends_result.scalars().all()
    return [_user_to_friend_response(f) for f in friends]


@router.delete("/{friend_id}", status_code=status.HTTP_200_OK)
async def remove_friend(
    friend_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a friend (bidirectional)."""
    # Delete both directions
    result_a = await db.execute(
        select(Friendship).where(
            Friendship.user_id == str(user.id),
            Friendship.friend_id == friend_id,
        )
    )
    result_b = await db.execute(
        select(Friendship).where(
            Friendship.user_id == friend_id,
            Friendship.friend_id == str(user.id),
        )
    )

    friendship_a = result_a.scalar_one_or_none()
    friendship_b = result_b.scalar_one_or_none()

    if friendship_a is None and friendship_b is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found")

    if friendship_a:
        await db.delete(friendship_a)
    if friendship_b:
        await db.delete(friendship_b)

    await db.flush()
    return {"status": "removed"}
