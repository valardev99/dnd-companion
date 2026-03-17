# WonderloreAI Command Center & Multiplayer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform WonderloreAI from a single-session game into a full platform with a command center hub, friends system, multiplayer co-op campaigns, real-time notifications, and enhanced DM storytelling.

**Architecture:** The command center replaces the current direct-to-game flow with a hub that lives at `/play`. The existing game session moves to `/play/campaign/:id`. WebSocket connections (via Socket.IO) power real-time presence, notifications, and multiplayer chat streaming. New database tables handle friends, invites, multiplayer campaigns, and archived campaigns. The DM engine prompt is enhanced with storytelling guides and multi-player awareness.

**Tech Stack:** React 19 + React Router DOM 7 (frontend), FastAPI + python-socketio (backend), PostgreSQL/SQLite (database), Socket.IO (real-time)

---

## Chunk 1: Database Foundation & Backend Models

### Task 1: New Database Models

**Files:**
- Modify: `server/app/models.py`

Note: This project uses `init_db()` with `Base.metadata.create_all` for schema management (no Alembic). New tables will be auto-created on server restart in dev.

- [ ] **Step 1: Add friend_code field to User model**

Add a unique 8-character friend code generated on user creation.

```python
# In models.py, add to User class:
import secrets
import string

def generate_friend_code() -> str:
    """Generate an 8-char alphanumeric friend code (uppercase, no ambiguous chars)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # No 0/O/1/I
    return ''.join(secrets.choice(alphabet) for _ in range(8))

# New column on User:
friend_code = Column(String(8), unique=True, nullable=False, default=generate_friend_code, index=True)
display_name = Column(String(100), nullable=True)  # Optional display name for friends list
avatar_url = Column(String(500), nullable=True)  # Profile avatar
```

- [ ] **Step 2: Create Friendship model**

```python
class Friendship(Base):
    """Bidirectional friendship between two users."""
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("user_id", "friend_id", name="uq_friendship_pair"),
    )

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    friend_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], backref="friendships_initiated")
    friend = relationship("User", foreign_keys=[friend_id], backref="friendships_received")
```

- [ ] **Step 3: Create FriendRequest model**

```python
class FriendRequest(Base):
    """Pending friend request via friend code."""
    __tablename__ = "friend_requests"
    __table_args__ = (
        UniqueConstraint("from_user_id", "to_user_id", name="uq_friend_request_pair"),
    )

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    from_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    to_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)  # pending | accepted | declined
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    from_user = relationship("User", foreign_keys=[from_user_id], backref="sent_friend_requests")
    to_user = relationship("User", foreign_keys=[to_user_id], backref="received_friend_requests")
```

- [ ] **Step 4: Create CampaignPlayer model (for multiplayer)**

```python
class CampaignPlayer(Base):
    """Links players to campaigns they participate in (not the owner)."""
    __tablename__ = "campaign_players"
    __table_args__ = (
        UniqueConstraint("campaign_id", "user_id", name="uq_campaign_player"),
    )

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    campaign_id = Column(_UUID, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    character_data = Column(JSON, nullable=True)  # This player's character sheet
    role = Column(String(20), default="player", nullable=False)  # player | spectator
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship("Campaign", backref="players")
    user = relationship("User", backref="joined_campaigns")
```

- [ ] **Step 5: Create CampaignInvite model**

```python
class CampaignInvite(Base):
    """Invite a friend to join a multiplayer campaign."""
    __tablename__ = "campaign_invites"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    campaign_id = Column(_UUID, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    from_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    to_user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)  # pending | accepted | declined | expired
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    campaign = relationship("Campaign", backref="invites")
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
```

- [ ] **Step 6: Create Notification model**

```python
class Notification(Base):
    """In-app notifications for friend requests, campaign invites, etc."""
    __tablename__ = "notifications"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # friend_request | campaign_invite | campaign_ready | friend_online
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)  # Structured payload (invite_id, campaign_id, etc.)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="notifications")
```

- [ ] **Step 7: Create ArchivedCampaign model**

```python
class ArchivedCampaign(Base):
    """Lightweight archive of completed/abandoned campaigns."""
    __tablename__ = "archived_campaigns"

    id = Column(_UUID, primary_key=True, default=generate_uuid)
    user_id = Column(_UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_campaign_id = Column(String(36), nullable=True)  # Reference only, no FK (original deleted)
    name = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    ending = Column(Text, nullable=True)
    character_name = Column(String(150), nullable=True)
    world_name = Column(String(255), nullable=True)
    sessions_played = Column(Integer, default=0)
    was_multiplayer = Column(Boolean, default=False)
    co_player_name = Column(String(100), nullable=True)
    archived_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="archived_campaigns")
```

- [ ] **Step 8: Add new fields to Campaign model**

```python
# Add to existing Campaign model:
is_multiplayer = Column(Boolean, default=False, nullable=False)
max_players = Column(Integer, default=1, nullable=False)
status = Column(String(20), default="active", nullable=False)  # active | in_session | archived
chat_history = Column(JSON, nullable=True)  # Persisted chat messages
session_summary = Column(Text, nullable=True)  # "Previously on..." AI-generated recap
thumbnail_url = Column(String(500), nullable=True)  # Campaign card art
last_played_at = Column(DateTime, nullable=True)
```

- [ ] **Step 9: Restart dev server to create tables**

Run: `cd server && python -c "import asyncio; from app.database import init_db; asyncio.run(init_db())"`
Expected: All new tables created via `Base.metadata.create_all`

- [ ] **Step 10: Commit**

```bash
git add server/app/models.py server/alembic/versions/
git commit -m "feat: add database models for command center, friends, multiplayer, notifications"
```

---

### Task 2: Pydantic Schemas for New Models

**Files:**
- Modify: `server/app/schemas.py`

- [ ] **Step 1: Add request/response schemas**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- Friends ---
class FriendCodeLookup(BaseModel):
    friend_code: str

class FriendResponse(BaseModel):
    id: str
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    friend_code: str
    is_online: bool = False
    status: Optional[str] = None  # "online" | "in_campaign" | "idle" | "offline"
    last_seen: Optional[datetime] = None
    current_campaign_name: Optional[str] = None

class FriendRequestResponse(BaseModel):
    id: str
    from_user: FriendResponse
    status: str
    created_at: datetime

# --- Campaign Hub ---
class CampaignCardResponse(BaseModel):
    id: str
    name: str
    character_name: Optional[str]
    character_level: Optional[int]
    world_name: Optional[str]
    thumbnail_url: Optional[str]
    is_multiplayer: bool
    co_player: Optional[FriendResponse]
    status: str
    last_played_at: Optional[datetime]
    session_count: Optional[int]
    created_at: datetime

class CampaignDetailResponse(CampaignCardResponse):
    world_bible_summary: Optional[str]
    session_summary: Optional[str]  # "Previously on..."
    game_data: Optional[dict]
    chat_history: Optional[list]

class ArchiveCampaignRequest(BaseModel):
    confirmation_text: str  # Must match campaign name
    summary: Optional[str]
    ending: Optional[str]

class ArchivedCampaignResponse(BaseModel):
    id: str
    name: str
    summary: Optional[str]
    ending: Optional[str]
    character_name: Optional[str]
    sessions_played: int
    was_multiplayer: bool
    co_player_name: Optional[str]
    archived_at: datetime

# --- Campaign Invites ---
class CampaignInviteRequest(BaseModel):
    friend_id: str

class CampaignInviteResponse(BaseModel):
    id: str
    campaign_name: str
    from_user: FriendResponse
    status: str
    created_at: datetime
    world_briefing: Optional[str]  # Genre, tone, setting summary for character creation

# --- Notifications ---
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: Optional[str]
    data: Optional[dict]
    read: bool
    created_at: datetime

# --- User Profile ---
class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    friend_code: str
    has_api_key: bool
    is_admin: bool
    active_campaign_count: int
    max_campaigns: int  # 5
```

- [ ] **Step 2: Commit**

```bash
git add server/app/schemas.py
git commit -m "feat: add Pydantic schemas for hub, friends, multiplayer, notifications"
```

---

### Task 3: Friends API Routes

**Files:**
- Create: `server/app/routes/friends.py`
- Modify: `server/app/main.py`

- [ ] **Step 1: Create friends router**

```python
"""Friend system routes — friend codes, requests, friend list."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Friendship, FriendRequest, Notification
from app.schemas import FriendCodeLookup, FriendResponse, FriendRequestResponse

router = APIRouter(prefix="/api/friends", tags=["friends"])


@router.get("/me/code")
async def get_my_friend_code(user=Depends(get_current_user)):
    """Return current user's friend code."""
    return {"friend_code": user.friend_code}


@router.post("/request")
async def send_friend_request(
    body: FriendCodeLookup,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send friend request by friend code."""
    # Look up target user
    result = await db.execute(select(User).where(User.friend_code == body.friend_code.upper()))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(404, "No adventurer found with that code")
    if target.id == user.id:
        raise HTTPException(400, "You cannot befriend yourself")

    # Check if already friends
    existing = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.user_id == user.id, Friendship.friend_id == target.id),
                and_(Friendship.user_id == target.id, Friendship.friend_id == user.id),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Already friends with this adventurer")

    # Check for existing pending request
    existing_req = await db.execute(
        select(FriendRequest).where(
            FriendRequest.from_user_id == user.id,
            FriendRequest.to_user_id == target.id,
            FriendRequest.status == "pending",
        )
    )
    if existing_req.scalar_one_or_none():
        raise HTTPException(400, "Friend request already sent")

    # Create request
    req = FriendRequest(from_user_id=user.id, to_user_id=target.id)
    db.add(req)

    # Create notification for target
    notif = Notification(
        user_id=target.id,
        type="friend_request",
        title=f"{user.username} wants to be your ally",
        body=f"Accept their friend request to adventure together.",
        data={"request_id": req.id, "from_user_id": user.id, "from_username": user.username},
    )
    db.add(notif)
    await db.commit()

    return {"status": "sent", "message": f"Friend request sent to {target.username}"}


@router.post("/request/{request_id}/accept")
async def accept_friend_request(
    request_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a pending friend request."""
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == user.id,
            FriendRequest.status == "pending",
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Friend request not found")

    req.status = "accepted"

    # Create bidirectional friendship
    db.add(Friendship(user_id=req.from_user_id, friend_id=req.to_user_id))
    db.add(Friendship(user_id=req.to_user_id, friend_id=req.from_user_id))

    # Notify the sender
    db.add(Notification(
        user_id=req.from_user_id,
        type="friend_accepted",
        title=f"{user.username} accepted your friend request",
        data={"friend_id": user.id, "friend_username": user.username},
    ))

    await db.commit()
    return {"status": "accepted"}


@router.post("/request/{request_id}/decline")
async def decline_friend_request(
    request_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Decline a pending friend request."""
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == user.id,
            FriendRequest.status == "pending",
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(404, "Friend request not found")

    req.status = "declined"
    await db.commit()
    return {"status": "declined"}


@router.get("/", response_model=list[FriendResponse])
async def list_friends(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all friends with online status."""
    result = await db.execute(
        select(User)
        .join(Friendship, Friendship.friend_id == User.id)
        .where(Friendship.user_id == user.id)
    )
    friends = result.scalars().all()
    # Online status will be injected by WebSocket presence manager
    return [
        FriendResponse(
            id=f.id,
            username=f.username,
            display_name=f.display_name,
            avatar_url=f.avatar_url,
            friend_code=f.friend_code,
            is_online=False,  # Enriched by presence system
        )
        for f in friends
    ]


@router.delete("/{friend_id}")
async def remove_friend(
    friend_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a friend (bidirectional)."""
    result = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.user_id == user.id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user.id),
            )
        )
    )
    friendships = result.scalars().all()
    for f in friendships:
        await db.delete(f)
    await db.commit()
    return {"status": "removed"}
```

- [ ] **Step 2: Register friends router in main.py**

Add to `server/app/main.py`:
```python
from app.routes import friends
app.include_router(friends.router)
```

- [ ] **Step 3: Commit**

```bash
git add server/app/routes/friends.py server/app/main.py
git commit -m "feat: add friends API routes (request, accept, decline, list, remove)"
```

---

### Task 4: Notifications API Routes

**Files:**
- Create: `server/app/routes/notifications.py`
- Modify: `server/app/main.py`

- [ ] **Step 1: Create notifications router**

```python
"""Notification routes — list, mark read, clear."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/")
async def list_notifications(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all notifications, newest first."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.get("/unread-count")
async def unread_count(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get count of unread notifications."""
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == user.id, Notification.read == False)
    )
    return {"count": result.scalar()}


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user.id)
        .values(read=True)
    )
    await db.commit()
    return {"status": "read"}


@router.post("/read-all")
async def mark_all_read(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read == False)
        .values(read=True)
    )
    await db.commit()
    return {"status": "all_read"}
```

- [ ] **Step 2: Register in main.py**

```python
from app.routes import notifications
app.include_router(notifications.router)
```

- [ ] **Step 3: Commit**

```bash
git add server/app/routes/notifications.py server/app/main.py
git commit -m "feat: add notifications API routes (list, unread count, mark read)"
```

---

### Task 5: Campaign Hub API Routes (Enhanced CRUD)

**Files:**
- Modify: `server/app/routes/campaigns.py`

- [ ] **Step 1: Add campaign limit enforcement**

On campaign creation, check active campaign count ≤ 5.

- [ ] **Step 2: Add archive endpoint**

```python
@router.post("/campaigns/{campaign_id}/archive")
async def archive_campaign(
    campaign_id: str,
    body: ArchiveCampaignRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive a campaign (type-to-confirm). Stores name + summary + ending only."""
    campaign = await db.get(Campaign, campaign_id)
    if not campaign or campaign.owner_id != user.id:
        raise HTTPException(404, "Campaign not found")

    # Confirmation: user must type the campaign name exactly
    if body.confirmation_text != campaign.name:
        raise HTTPException(400, "Confirmation text does not match campaign name")

    # Create archive record
    char_name = campaign.game_data.get("character", {}).get("name") if campaign.game_data else None
    world_name = campaign.game_data.get("campaign", {}).get("name") if campaign.game_data else None
    session_count = campaign.game_data.get("campaign", {}).get("session", 0) if campaign.game_data else 0

    archive = ArchivedCampaign(
        user_id=user.id,
        original_campaign_id=campaign.id,
        name=campaign.name,
        summary=body.summary,
        ending=body.ending,
        character_name=char_name,
        world_name=world_name,
        sessions_played=session_count,
        was_multiplayer=campaign.is_multiplayer,
    )
    db.add(archive)

    # Delete the full campaign (frees the slot)
    await db.delete(campaign)
    await db.commit()

    return {"status": "archived", "archive_id": archive.id}
```

- [ ] **Step 3: Add campaign card list endpoint**

```python
@router.get("/campaigns/hub")
async def list_campaigns_for_hub(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return campaign cards for the command center."""
    # Active campaigns (owned + joined)
    owned = await db.execute(
        select(Campaign).where(Campaign.owner_id == user.id, Campaign.status != "archived")
        .order_by(Campaign.last_played_at.desc().nullslast())
    )
    # Joined multiplayer campaigns
    joined = await db.execute(
        select(Campaign)
        .join(CampaignPlayer, CampaignPlayer.campaign_id == Campaign.id)
        .where(CampaignPlayer.user_id == user.id)
        .order_by(Campaign.last_played_at.desc().nullslast())
    )
    # Archived
    archived = await db.execute(
        select(ArchivedCampaign).where(ArchivedCampaign.user_id == user.id)
        .order_by(ArchivedCampaign.archived_at.desc())
    )

    owned_campaigns = owned.scalars().all()
    joined_campaigns = joined.scalars().all()
    archived_list = archived.scalars().all()

    return {
        "active": [format_campaign_card(c) for c in owned_campaigns],
        "joined": [format_campaign_card(c) for c in joined_campaigns],
        "archived": archived_list,
        "active_count": len(owned_campaigns),
        "max_campaigns": 5,
    }


def format_campaign_card(campaign):
    """Format a Campaign ORM object into a card response dict."""
    game_data = campaign.game_data or {}
    character = game_data.get("character", {})
    campaign_info = game_data.get("campaign", {})
    return {
        "id": campaign.id,
        "name": campaign.name,
        "character_name": character.get("name"),
        "character_level": character.get("level"),
        "world_name": campaign_info.get("name"),
        "thumbnail_url": campaign.thumbnail_url,
        "is_multiplayer": campaign.is_multiplayer,
        "status": campaign.status,
        "last_played_at": campaign.last_played_at.isoformat() if campaign.last_played_at else None,
        "session_count": campaign_info.get("session", 0),
        "created_at": campaign.created_at.isoformat(),
    }


def extract_world_briefing(world_bible: str) -> str:
    """Extract a spoiler-free world briefing from the world bible for invited players.
    Returns the first ~500 chars covering genre, tone, and setting."""
    if not world_bible:
        return "A mysterious world awaits..."
    # Take content up to the first major section break or 500 chars
    lines = world_bible.split("\n")
    briefing_lines = []
    char_count = 0
    for line in lines:
        if char_count > 500:
            break
        # Skip sections that might contain spoilers
        lower = line.lower()
        if any(keyword in lower for keyword in ["quest", "conflict", "secret", "plot", "opening"]):
            continue
        briefing_lines.append(line)
        char_count += len(line)
    return "\n".join(briefing_lines).strip() or "A mysterious world awaits..."
```

- [ ] **Step 4: Add campaign invite endpoint**

```python
@router.post("/campaigns/{campaign_id}/invite")
async def invite_to_campaign(
    campaign_id: str,
    body: CampaignInviteRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a friend to a multiplayer campaign."""
    campaign = await db.get(Campaign, campaign_id)
    if not campaign or campaign.owner_id != user.id:
        raise HTTPException(404, "Campaign not found")

    # Create invite
    invite = CampaignInvite(
        campaign_id=campaign.id,
        from_user_id=user.id,
        to_user_id=body.friend_id,
    )
    db.add(invite)

    # Generate world briefing (genre, tone, setting — no spoilers)
    world_bible = campaign.world_bible or ""
    briefing = extract_world_briefing(world_bible)  # Helper: first ~500 chars of setting info

    # Create notification
    db.add(Notification(
        user_id=body.friend_id,
        type="campaign_invite",
        title=f"{user.username} invites you to {campaign.name}",
        body=briefing,
        data={
            "invite_id": invite.id,
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "from_username": user.username,
        },
    ))
    await db.commit()
    return {"status": "invited"}
```

- [ ] **Step 5: Add campaign invite accept/decline endpoints**

```python
@router.post("/campaigns/invites/{invite_id}/accept")
async def accept_campaign_invite(
    invite_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a campaign invite — creates CampaignPlayer record."""
    result = await db.execute(
        select(CampaignInvite).where(
            CampaignInvite.id == invite_id,
            CampaignInvite.to_user_id == user.id,
            CampaignInvite.status == "pending",
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(404, "Invite not found")

    invite.status = "accepted"

    # Create player record
    player = CampaignPlayer(
        campaign_id=invite.campaign_id,
        user_id=user.id,
    )
    db.add(player)

    # Mark campaign as multiplayer
    campaign = await db.get(Campaign, invite.campaign_id)
    campaign.is_multiplayer = True
    campaign.max_players = 2

    # Notify campaign owner
    db.add(Notification(
        user_id=invite.from_user_id,
        type="invite_accepted",
        title=f"{user.username} joined {campaign.name}",
        data={"campaign_id": campaign.id},
    ))

    await db.commit()
    return {"status": "accepted", "campaign_id": invite.campaign_id}


@router.post("/campaigns/invites/{invite_id}/decline")
async def decline_campaign_invite(
    invite_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Decline a campaign invite."""
    result = await db.execute(
        select(CampaignInvite).where(
            CampaignInvite.id == invite_id,
            CampaignInvite.to_user_id == user.id,
            CampaignInvite.status == "pending",
        )
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(404, "Invite not found")

    invite.status = "declined"
    await db.commit()
    return {"status": "declined"}
```

- [ ] **Step 6: Add player character save endpoint**

```python
@router.put("/campaigns/{campaign_id}/player/character")
async def save_player_character(
    campaign_id: str,
    body: dict,  # Character data JSON
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save character data for an invited player in a multiplayer campaign."""
    result = await db.execute(
        select(CampaignPlayer).where(
            CampaignPlayer.campaign_id == campaign_id,
            CampaignPlayer.user_id == user.id,
        )
    )
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(404, "You are not a player in this campaign")

    player.character_data = body
    await db.commit()
    return {"status": "saved"}
```

- [ ] **Step 7: Commit**

```bash
git add server/app/routes/campaigns.py
git commit -m "feat: add hub campaign endpoints (card list, archive, invite, accept/decline, player character)"
```

---

### Task 6: WebSocket / Socket.IO Setup for Real-Time

**Files:**
- Create: `server/app/socketio_manager.py`
- Modify: `server/app/main.py`
- Modify: `server/requirements.txt`

- [ ] **Step 1: Add python-socketio dependency**

Add to `server/requirements.txt`:
```
python-socketio[asyncio]==5.11.0
```

Run: `cd server && pip install -r requirements.txt`

- [ ] **Step 2: Create Socket.IO manager**

```python
"""WebSocket manager for real-time presence, notifications, and multiplayer."""
import socketio
from datetime import datetime

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
)

# In-memory presence store: {user_id: {sid, status, current_campaign, last_active}}
presence: dict[str, dict] = {}


@sio.event
async def connect(sid, environ, auth):
    """User connects — register presence."""
    # Auth token passed in handshake
    token = auth.get("token") if auth else None
    if not token:
        raise socketio.exceptions.ConnectionRefusedError("Authentication required")

    from app.auth import decode_token
    user_data = decode_token(token)
    if not user_data:
        raise socketio.exceptions.ConnectionRefusedError("Invalid token")

    user_id = user_data["sub"]
    await sio.save_session(sid, {"user_id": user_id})

    # Join personal room for notifications
    await sio.enter_room(sid, f"user:{user_id}")

    # Update presence
    presence[user_id] = {
        "sid": sid,
        "status": "online",
        "current_campaign": None,
        "last_active": datetime.utcnow().isoformat(),
    }

    # Notify friends
    await broadcast_presence_to_friends(user_id)


@sio.event
async def disconnect(sid):
    """User disconnects — update presence."""
    session = await sio.get_session(sid)
    if not session:
        return
    user_id = session.get("user_id")
    if user_id and user_id in presence:
        presence[user_id]["status"] = "offline"
        presence[user_id]["last_active"] = datetime.utcnow().isoformat()
        await broadcast_presence_to_friends(user_id)


@sio.event
async def join_campaign(sid, data):
    """Player joins a campaign room for multiplayer."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    campaign_id = data.get("campaign_id")

    await sio.enter_room(sid, f"campaign:{campaign_id}")

    if user_id in presence:
        presence[user_id]["status"] = "in_campaign"
        presence[user_id]["current_campaign"] = campaign_id
        await broadcast_presence_to_friends(user_id)


@sio.event
async def leave_campaign(sid, data):
    """Player leaves a campaign room."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    campaign_id = data.get("campaign_id")

    await sio.leave_room(sid, f"campaign:{campaign_id}")

    if user_id in presence:
        presence[user_id]["status"] = "online"
        presence[user_id]["current_campaign"] = None
        await broadcast_presence_to_friends(user_id)


@sio.event
async def player_ready(sid, data):
    """Player signals ready in lobby."""
    campaign_id = data.get("campaign_id")
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    await sio.emit("player_ready", {"user_id": user_id}, room=f"campaign:{campaign_id}")


@sio.event
async def session_start(sid, data):
    """Campaign owner launches the session — notify all players in the room."""
    campaign_id = data.get("campaign_id")
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    await sio.emit("session_start", {
        "campaign_id": campaign_id,
        "launched_by": user_id,
    }, room=f"campaign:{campaign_id}")


async def broadcast_presence_to_friends(user_id: str):
    """Send presence update to all friends of this user."""
    # Get friend IDs from DB (cached in production)
    from app.database import async_session
    from app.models import Friendship
    from sqlalchemy import select

    async with async_session() as db:
        result = await db.execute(
            select(Friendship.friend_id).where(Friendship.user_id == user_id)
        )
        friend_ids = [r[0] for r in result.all()]

    status_data = presence.get(user_id, {"status": "offline"})
    for fid in friend_ids:
        await sio.emit("friend_presence", {
            "user_id": user_id,
            "status": status_data.get("status", "offline"),
            "last_active": status_data.get("last_active"),
            "current_campaign": status_data.get("current_campaign"),
        }, room=f"user:{fid}")


async def send_notification(user_id: str, notification: dict):
    """Push a real-time notification to a user (even if in a game session)."""
    await sio.emit("notification", notification, room=f"user:{user_id}")
```

- [ ] **Step 3: Mount Socket.IO on FastAPI**

In `server/app/main.py`, wrap the ASGI app:

```python
from app.socketio_manager import sio
import socketio as socketio_lib

# After creating FastAPI app:
socket_app = socketio_lib.ASGIApp(sio, other_app=app)

# Use socket_app instead of app for uvicorn
```

- [ ] **Step 4: Commit**

```bash
git add server/app/socketio_manager.py server/app/main.py server/requirements.txt
git commit -m "feat: add Socket.IO real-time layer for presence, notifications, multiplayer rooms"
```

---

## Chunk 2: Frontend Command Center

### Task 7: Routing Restructure

**Files:**
- Modify: `client/src/main.jsx`
- Create: `client/src/pages/HubPage.jsx`
- Create: `client/src/pages/GameSessionPage.jsx`
- Create: `client/src/pages/LobbyPage.jsx`
- Modify: `client/src/App.jsx` (becomes game-only layout)

The key architectural change: `/play` becomes the command center hub. `/play/campaign/:id` becomes the actual game session.

- [ ] **Step 1: Update routing in main.jsx**

```jsx
// New route structure:
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/play" element={<HubPage />} />
  <Route path="/play/campaign/:id" element={<GameSessionPage />} />
  <Route path="/play/lobby/:id" element={<LobbyPage />} />
  {/* Campaign creation handled via CampaignWizard modal from CampaignsView */}
  {/* Campaign invite acceptance handled via notification actions → lobby redirect */}
  <Route path="/stories" element={<StoriesPage />} />
  <Route path="/share/:slug" element={<SharePage />} />
  <Route path="/admin" element={<AdminPage />} />
</Routes>
```

- [ ] **Step 2: Create HubPage.jsx shell**

The hub page manages its own nav state (campaigns/friends/settings) and renders the appropriate view. This is the command center.

```jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import HubNav from '../components/hub/HubNav.jsx';
import HubTopBar from '../components/hub/HubTopBar.jsx';
import CampaignsView from '../components/hub/CampaignsView.jsx';
import FriendsView from '../components/hub/FriendsView.jsx';
import SettingsView from '../components/hub/SettingsView.jsx';

export default function HubPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('campaigns');

  if (!user) return <Navigate to="/" />;

  const views = {
    campaigns: CampaignsView,
    friends: FriendsView,
    settings: SettingsView,
  };
  const ActiveView = views[activeView];

  return (
    <div className="hub-layout">
      <HubNav activeView={activeView} onNavigate={setActiveView} />
      <div className="hub-main">
        <HubTopBar />
        <ActiveView />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create GameSessionPage.jsx**

Wraps the existing `App.jsx` game layout, loads campaign data by ID from the backend.

```jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GameProvider } from '../contexts/GameContext.jsx';
import App from '../App.jsx';

export default function GameSessionPage() {
  const { id } = useParams();

  return (
    <GameProvider campaignId={id}>
      <App />
    </GameProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/main.jsx client/src/pages/HubPage.jsx client/src/pages/GameSessionPage.jsx
git commit -m "feat: restructure routing — hub at /play, game session at /play/campaign/:id"
```

---

### Task 8: Hub Navigation Component

**Files:**
- Create: `client/src/components/hub/HubNav.jsx`

- [ ] **Step 1: Build left nav with dark fantasy styling**

```jsx
import React from 'react';

const navItems = [
  { id: 'campaigns', label: 'Campaigns', icon: '⚔️' },
  { id: 'friends', label: 'Allies', icon: '🛡️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function HubNav({ activeView, onNavigate }) {
  return (
    <nav className="hub-nav">
      <div className="hub-nav-logo">
        <h1 className="hub-logo-text">Wonderlore</h1>
        <span className="hub-logo-sub">AI</span>
      </div>
      <div className="hub-nav-items">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`hub-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="hub-nav-icon">{item.icon}</span>
            <span className="hub-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/hub/HubNav.jsx
git commit -m "feat: add hub left navigation component"
```

---

### Task 9: Hub Top Bar (Notifications + Profile)

**Files:**
- Create: `client/src/components/hub/HubTopBar.jsx`

- [ ] **Step 1: Build top bar with notification bell and profile**

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function HubTopBar() {
  const { user, authFetch } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll until WebSocket ready
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    const res = await authFetch('/api/notifications/unread-count');
    if (res.ok) {
      const data = await res.json();
      setUnreadCount(data.count);
    }
  }

  async function toggleNotifications() {
    if (!showNotifications) {
      const res = await authFetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    }
    setShowNotifications(!showNotifications);
  }

  return (
    <header className="hub-topbar">
      <div className="hub-topbar-left">
        {/* Breadcrumb or page title */}
      </div>
      <div className="hub-topbar-right">
        <button className="hub-notification-bell" onClick={toggleNotifications}>
          <span className="bell-icon">🔔</span>
          {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
        </button>
        <div className="hub-profile">
          <span className="hub-profile-name">{user?.username}</span>
          <span className="hub-friend-code">#{user?.friend_code}</span>
        </div>
      </div>
      {showNotifications && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onAction={fetchUnreadCount}
        />
      )}
    </header>
  );
}

function NotificationDropdown({ notifications, onClose, onAction }) {
  // Render notification list with accept/decline actions
  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="notification-list">
        {notifications.length === 0 && (
          <p className="notification-empty">No new scrolls await you.</p>
        )}
        {notifications.map(n => (
          <NotificationItem key={n.id} notification={n} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

function NotificationItem({ notification, onAction }) {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  async function handleAccept() {
    if (notification.type === 'friend_request') {
      await authFetch(`/api/friends/request/${notification.data.request_id}/accept`, { method: 'POST' });
    } else if (notification.type === 'campaign_invite') {
      const res = await authFetch(`/api/campaigns/invites/${notification.data.invite_id}/accept`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        navigate(`/play/lobby/${data.campaign_id}`);
      }
    }
    // Mark notification read
    await authFetch(`/api/notifications/${notification.id}/read`, { method: 'POST' });
    onAction();
  }

  async function handleDecline() {
    if (notification.type === 'friend_request') {
      await authFetch(`/api/friends/request/${notification.data.request_id}/decline`, { method: 'POST' });
    } else if (notification.type === 'campaign_invite') {
      await authFetch(`/api/campaigns/invites/${notification.data.invite_id}/decline`, { method: 'POST' });
    }
    await authFetch(`/api/notifications/${notification.id}/read`, { method: 'POST' });
    onAction();
  }

  const hasActions = ['friend_request', 'campaign_invite'].includes(notification.type);

  return (
    <div className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
      <div className="notification-content">
        <strong>{notification.title}</strong>
        {notification.body && <p>{notification.body}</p>}
      </div>
      {hasActions && !notification.read && (
        <div className="notification-actions">
          <button className="btn-accept" onClick={handleAccept}>Accept</button>
          <button className="btn-decline" onClick={handleDecline}>Decline</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/hub/HubTopBar.jsx
git commit -m "feat: add hub top bar with notification bell and profile area"
```

---

### Task 10: Campaigns View (Campaign Cards + Detail)

**Files:**
- Create: `client/src/components/hub/CampaignsView.jsx`
- Create: `client/src/components/hub/CampaignCard.jsx`
- Create: `client/src/components/hub/CampaignDetail.jsx`
- Create: `client/src/components/hub/ArchiveModal.jsx`

- [ ] **Step 1: Build CampaignsView with card grid**

Main campaigns view: grid of campaign cards, "New Campaign" button (disabled if 5 active), archived section below.

- [ ] **Step 2: Build CampaignCard component**

Rich card showing: campaign art/thumbnail, name, character name & level, world name, last played, status badge, co-op partner avatar (if multiplayer).

- [ ] **Step 3: Build CampaignDetail view**

Clicking a card opens detail: world bible summary, "Previously on..." recap, character sheet preview, session count, launch button, invite friend button (if multiplayer), archive button.

- [ ] **Step 4: Build ArchiveModal**

Type-to-confirm modal. User must type the exact campaign name. Shows warning about data loss. On confirm, calls archive endpoint.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/hub/CampaignsView.jsx client/src/components/hub/CampaignCard.jsx client/src/components/hub/CampaignDetail.jsx client/src/components/hub/ArchiveModal.jsx
git commit -m "feat: add campaigns view with cards, detail page, and archive modal"
```

---

### Task 11: Friends View

**Files:**
- Create: `client/src/components/hub/FriendsView.jsx`
- Create: `client/src/components/hub/AddFriendModal.jsx`

- [ ] **Step 1: Build FriendsView**

Shows: your friend code (copy button), friend list with presence indicators, add friend button, pending requests section.

Presence display per friend:
- Green dot + "Online"
- Blue dot + "In [Campaign Name]"
- Yellow dot + "Idle (5m ago)"
- Grey dot + "Last seen 2 days ago"

Each friend row has an "Invite to Campaign" button.

- [ ] **Step 2: Build AddFriendModal**

Input for friend code, send request button, confirmation message.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/hub/FriendsView.jsx client/src/components/hub/AddFriendModal.jsx
git commit -m "feat: add friends view with presence indicators and friend code system"
```

---

### Task 12: Settings View (Extracted from Game)

**Files:**
- Create: `client/src/components/hub/SettingsView.jsx`
- Modify: `client/src/components/panels/SettingsPanel.jsx` (keep only text scaling)

- [ ] **Step 1: Build SettingsView**

Move from SettingsPanel to SettingsView:
- API key management (OpenRouter)
- xAI API key
- Model selection
- DM Style dial
- Theme selection
- Particle background toggle
- System notifications toggle
- Companion panel scale

Keep in SettingsPanel (in-game):
- Chat text size (small/medium/large/xl)

- [ ] **Step 2: Simplify SettingsPanel**

Remove everything that moved to SettingsView. Keep only text size and "Return to Hub" button.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/hub/SettingsView.jsx client/src/components/panels/SettingsPanel.jsx
git commit -m "feat: extract settings to hub, keep only text scaling in-game"
```

---

### Task 13: Hub CSS (Dark Fantasy Theme)

**Files:**
- Create: `client/src/styles/hub.css`
- Modify: `client/src/styles/index.css` (import hub.css)

- [ ] **Step 1: Style the command center**

Full dark fantasy styling for:
- Hub layout (left nav + main content area)
- Nav items (gold active state, hover glow)
- Top bar (notification bell, profile)
- Campaign cards (metallic borders, hover lift, status badges)
- Campaign detail (parchment-style sections)
- Friends list (presence dots, invite buttons)
- Settings view (consistent with existing form styling)
- Notification dropdown (dark overlay, gold accents)
- Archive modal (red warning styling, type-to-confirm input)
- Responsive: stack nav on mobile

All using existing CSS variables from CLAUDE.md (--gold, --obsidian, --stone, --parchment, etc.)

- [ ] **Step 2: Commit**

```bash
git add client/src/styles/hub.css client/src/styles/index.css
git commit -m "feat: add dark fantasy hub CSS for command center"
```

---

## Chunk 3: Multiplayer System

### Task 14: Socket.IO Client Integration

**Files:**
- Create: `client/src/services/socketService.js`
- Modify: `client/package.json` (add socket.io-client)

- [ ] **Step 1: Install socket.io-client**

Run: `cd client && npm install socket.io-client`

- [ ] **Step 2: Create socket service**

```javascript
import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('[WS] Connected'));
  socket.on('disconnect', () => console.log('[WS] Disconnected'));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Presence
export function onFriendPresence(callback) {
  socket?.on('friend_presence', callback);
  return () => socket?.off('friend_presence', callback);
}

// Notifications
export function onNotification(callback) {
  socket?.on('notification', callback);
  return () => socket?.off('notification', callback);
}

// Multiplayer
export function joinCampaignRoom(campaignId) {
  socket?.emit('join_campaign', { campaign_id: campaignId });
}

export function leaveCampaignRoom(campaignId) {
  socket?.emit('leave_campaign', { campaign_id: campaignId });
}

export function emitPlayerReady(campaignId) {
  socket?.emit('player_ready', { campaign_id: campaignId });
}

export function onPlayerReady(callback) {
  socket?.on('player_ready', callback);
  return () => socket?.off('player_ready', callback);
}

export function onMultiplayerMessage(callback) {
  socket?.on('dm_message', callback);
  return () => socket?.off('dm_message', callback);
}

export function sendPlayerAction(campaignId, message) {
  socket?.emit('player_action', { campaign_id: campaignId, message });
}
```

- [ ] **Step 3: Connect socket on auth**

In AuthContext.jsx, connect socket after successful login, disconnect on logout.

- [ ] **Step 4: Commit**

```bash
git add client/src/services/socketService.js client/package.json
git commit -m "feat: add Socket.IO client for presence, notifications, and multiplayer"
```

---

### Task 15: Pre-Game Lobby

**Files:**
- Create: `client/src/pages/LobbyPage.jsx`

- [ ] **Step 1: Build lobby page**

Shows:
- Campaign name and recap ("Previously on...")
- Both player character cards (owner + invited)
- Ready-up buttons
- Owner has "Launch Session" button (enabled when both ready)
- If invited player hasn't created a character yet → show character creation wizard (character steps only, no world building)

- [ ] **Step 2: WebSocket lobby events**

- Players join the campaign room on mount
- "Ready" button emits `player_ready`
- Listen for both players ready → owner can launch
- Launch emits `session_start` → both navigate to `/play/campaign/:id`

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/LobbyPage.jsx
git commit -m "feat: add pre-game lobby with ready-up and character creation for invited player"
```

---

### Task 16: Character-Only Builder for Invited Players

**Files:**
- Create: `client/src/components/hub/CharacterBuilder.jsx`

- [ ] **Step 1: Build character-only wizard**

Extracts character creation steps from CampaignWizard.jsx (Step 4 only):
- Shows world briefing (genre, tone, key factions — from world bible summary)
- Character name input
- Race preference dropdown
- Character concept / backstory
- No world-building steps

Saves character data to CampaignPlayer.character_data via API.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/hub/CharacterBuilder.jsx
git commit -m "feat: add character-only builder for invited multiplayer players"
```

---

### Task 17: Multiplayer Chat Flow

**Files:**
- Modify: `client/src/components/chat/ChatPanel.jsx`
- Modify: `server/app/routes/chat.py`
- Modify: `client/src/utils/systemPrompt.js`

- [ ] **Step 1: Update system prompt for multiplayer**

When `campaign.is_multiplayer`, the system prompt includes:
- Both player character sheets
- Instructions for addressing both players
- Turn-taking guidance (the DM addresses the player who acted, but both see everything)
- Format: player names prefixed on messages so both know who said what

```javascript
// In systemPrompt.js, add multiplayer section:
function buildMultiplayerContext(player1, player2) {
  return `
## MULTIPLAYER SESSION
Two adventurers are playing together. Address them by name.

**Player 1:** ${player1.name} — ${player1.race} ${player1.class} (Level ${player1.level})
**Player 2:** ${player2.name} — ${player2.race} ${player2.class} (Level ${player2.level})

Rules:
- When one player acts, describe the outcome and give the other player a chance to react
- Both players see all DM narration
- Combat: alternate turns between players, then enemies
- Reference both characters in scene descriptions
- Each player's actions affect the shared world
`;
}
```

- [ ] **Step 2: Update ChatPanel for multiplayer**

- Messages show which player sent them (prefixed with player name)
- Both players see all messages in real-time via WebSocket
- Player actions sent via `sendPlayerAction()` → server broadcasts to both
- DM responses streamed to the campaign room (both players receive)

- [ ] **Step 3: Update chat route for multiplayer**

Server-side:
- When a multiplayer chat comes in, include both player contexts in the prompt
- Stream response via SSE AND broadcast via Socket.IO to the campaign room
- Store messages in campaign.chat_history

- [ ] **Step 4: Commit**

```bash
git add client/src/components/chat/ChatPanel.jsx server/app/routes/chat.py client/src/utils/systemPrompt.js
git commit -m "feat: add multiplayer chat flow with shared narration and dual-player context"
```

---

## Chunk 4: Campaign Persistence & Context Management

### Task 18: Auto-Save to Backend

**Files:**
- Modify: `client/src/contexts/GameContext.jsx`
- Modify: `client/src/hooks/useCloudSync.js`

- [ ] **Step 1: Switch from localStorage-only to backend-primary save**

Current: game state saves to localStorage only.
New: game state saves to backend via `PUT /api/campaigns/:id` (debounced every 30s and on unmount), with localStorage as offline fallback.

The save payload includes:
- `game_data` (full game state JSON)
- `chat_history` (last 100 messages)
- `last_played_at` (timestamp)

- [ ] **Step 2: Load campaign from backend on GameSessionPage mount**

When navigating to `/play/campaign/:id`, fetch campaign from `GET /api/campaigns/:id` and hydrate GameContext.

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/GameContext.jsx client/src/hooks/useCloudSync.js
git commit -m "feat: switch to backend-primary campaign persistence with localStorage fallback"
```

---

### Task 19: Session Recap / Context Summarization

**Files:**
- Create: `server/app/services/summarizer.py`
- Modify: `server/app/routes/campaigns.py`

- [ ] **Step 1: Build summarizer service**

When a session ends (user navigates back to hub or closes browser):
1. Take the chat history from that session
2. Call the LLM with a summarization prompt
3. Store the summary in `campaign.session_summary`
4. This becomes the "Previously on..." text shown in the lobby and campaign detail

```python
RECAP_PROMPT = """You are a fantasy narrator. Summarize this play session in 2-3 paragraphs.
Focus on: key decisions made, NPCs encountered, items gained/lost, quests advanced, and where the story left off.
Write in past tense, third person, dramatic style. End with a hook for the next session.
Do NOT include game mechanics or stat changes — narrative only."""
```

- [ ] **Step 2: Add recap generation endpoint**

```python
@router.post("/campaigns/{campaign_id}/generate-recap")
async def generate_recap(campaign_id: str, ...):
    """Generate a 'Previously on...' recap from recent chat history."""
```

- [ ] **Step 3: Context window management**

For long campaigns, the full chat history won't fit in the AI context window. Strategy:
- Always include: system prompt + world bible + current game state
- Include: session recap (summarized previous sessions)
- Include: last 30 raw messages (recent conversation)
- Drop: older raw messages (they're captured in the recap)

This keeps the prompt under ~8K tokens of history while maintaining narrative continuity.

- [ ] **Step 4: Commit**

```bash
git add server/app/services/summarizer.py server/app/routes/campaigns.py
git commit -m "feat: add session recap generation and context window management"
```

---

## Chunk 5: Real-Time Notification System

### Task 20: Global Notification Overlay

**Files:**
- Create: `client/src/components/effects/NotificationToast.jsx`
- Create: `client/src/contexts/NotificationContext.jsx`
- Modify: `client/src/main.jsx` (wrap with NotificationProvider)

- [ ] **Step 1: Build toast notification system**

A global component that renders floating toast notifications regardless of which page/view the user is on. Works in the hub AND during a game session.

Triggered by Socket.IO `notification` events. Shows:
- Friend request received
- Campaign invite received
- Friend came online
- Campaign ready to launch

Toast auto-dismisses after 8 seconds, or user can click to act (accept/decline/view).

- [ ] **Step 2: Create NotificationProvider context**

Manages notification state globally, listens to Socket.IO events, provides `addNotification()` for local notifications too.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/hub/NotificationToast.jsx client/src/main.jsx
git commit -m "feat: add global real-time notification toast system"
```

---

## Chunk 6: DM Storytelling Enhancement

### Task 21: Research & Compile DM Storytelling Guides

**Files:**
- Create: `docs/dm-storytelling-research.md`

- [ ] **Step 1: Research professional DM storytelling techniques**

Research and compile guides on:
- **Narrative structure:** Three-act structure, rising action, climax in TTRPG sessions
- **Scene-setting:** Sensory details (sight, sound, smell, texture), environmental storytelling
- **NPC voice:** Giving NPCs distinct speech patterns, motivations, and mannerisms
- **Pacing:** When to use long descriptions vs. quick dialogue, managing tension and relief
- **Player agency:** Presenting meaningful choices, consequences, "yes, and..." improv techniques
- **Combat narration:** Making combat feel cinematic, not mechanical
- **Mystery & foreshadowing:** Planting clues, building suspense, dramatic reveals
- **Emotional beats:** Creating moments of wonder, dread, humor, triumph
- **Session flow:** Strong openings, satisfying endings, cliffhangers
- **Collaborative storytelling:** Incorporating player backstories, respecting character arcs

Sources: Matt Colville's "Running the Game", Matt Mercer's DM tips, The Angry GM, Sly Flourish's "Return of the Lazy Dungeon Master", Robin Laws' "Robin's Laws of Good Game Mastering", professional improv techniques adapted for D&D.

- [ ] **Step 2: Commit research document**

```bash
git add docs/dm-storytelling-research.md
git commit -m "docs: compile DM storytelling research from professional guides"
```

---

### Task 22: Enhance DM Engine Prompt

**Files:**
- Modify: `dm-engine.md`

- [ ] **Step 1: Integrate storytelling best practices into DM Engine V3**

Add new sections to the DM engine prompt:

**Narrative Craft:**
- Scene structure (establish → develop → resolve/cliffhang)
- Sensory-rich descriptions (always 2+ senses per scene description)
- NPC voice differentiation (dialect, vocabulary, speech rhythm)
- Pacing awareness (alternate tension/relief, vary description length)

**Player Experience:**
- Present 2-3 meaningful choices per scene
- Reference past decisions to show consequences
- "Yes, and..." — build on player actions, never flat-out deny
- Emotional variety — not every scene is combat, include moments of wonder, humor, connection

**Session Flow:**
- Strong session openings (start mid-action or with a hook)
- Satisfying session endings (cliffhanger or emotional resolution)
- Mid-session pacing (escalating stakes, breathing room between encounters)

**Combat Narration:**
- Describe attacks cinematically, not just mechanically
- Environment interaction in combat (terrain, weather, objects)
- NPC combat personality (cowardly goblins fight differently than disciplined soldiers)

- [ ] **Step 2: Add multiplayer DM instructions**

Add section to dm-engine.md for when 2 players are present:
- Address both characters by name
- Give each player spotlight moments
- Create opportunities for player-to-player interaction
- Alternate focus between players naturally
- Handle split-party scenarios

- [ ] **Step 3: Commit**

```bash
git add dm-engine.md
git commit -m "feat: enhance DM Engine with storytelling best practices and multiplayer awareness"
```

---

## Chunk 7: Integration & Polish

### Task 23: Auth Flow Update (Hub as Default)

**Files:**
- Modify: `client/src/contexts/AuthContext.jsx`
- Modify: `client/src/pages/LandingPage.jsx`

- [ ] **Step 1: After login, redirect to /play (hub) instead of game**

Currently login → `/play` which loads the game directly.
New: login → `/play` which is now the command center hub.
The user picks a campaign and clicks "Launch" to enter `/play/campaign/:id`.

- [ ] **Step 2: Add friend_code to auth response**

Backend `/auth/me` and `/auth/login` should return `friend_code` in the user object.

- [ ] **Step 3: Commit**

```bash
git add client/src/contexts/AuthContext.jsx client/src/pages/LandingPage.jsx server/app/routes/auth.py
git commit -m "feat: redirect to command center hub after login, include friend_code in auth"
```

---

### Task 24: Mobile Responsive Hub

**Files:**
- Modify: `client/src/styles/hub.css`

- [ ] **Step 1: Add responsive breakpoints**

- Desktop: left nav visible, campaign card grid (2-3 columns)
- Tablet: left nav collapsible, campaign cards (2 columns)
- Mobile: bottom nav bar, campaign cards (1 column, swipeable), friends as a tab

- [ ] **Step 2: Commit**

```bash
git add client/src/styles/hub.css
git commit -m "feat: add responsive styling for hub on tablet and mobile"
```

---

### Task 25: End-to-End Testing Checklist

- [ ] **Step 1: Test campaign lifecycle**
  - Create campaign from hub → redirects to game
  - Play session → auto-saves to backend
  - Return to hub → campaign card shows updated state
  - Click card → detail view with recap
  - Archive campaign → type-to-confirm → card moves to archived section
  - Verify 5 campaign limit enforcement

- [ ] **Step 2: Test friend system**
  - Copy friend code → send to friend
  - Friend enters code → request sent
  - Accept request → both see each other in friends list
  - Online/offline presence updates
  - Remove friend

- [ ] **Step 3: Test multiplayer flow**
  - Owner creates multiplayer campaign
  - Owner invites friend from campaign detail
  - Friend receives notification (bell + toast)
  - Friend accepts → sees character builder with world briefing
  - Friend creates character
  - Owner enters lobby → friend enters lobby
  - Both ready up → owner launches
  - Both see shared chat, can take turns acting
  - Session saves for both players

- [ ] **Step 4: Test notifications**
  - Friend request → bell badge + toast
  - Campaign invite → bell badge + toast (even during solo session)
  - Accept/decline from notification dropdown
  - Mark all read

---

## Summary of New Files

```
server/app/
├── socketio_manager.py          # Socket.IO real-time manager
├── services/summarizer.py       # Session recap AI summarization
└── routes/
    ├── friends.py               # Friend system API
    └── notifications.py         # Notification API

client/src/
├── pages/
│   ├── HubPage.jsx              # Command center hub
│   ├── GameSessionPage.jsx      # Game wrapper (loads campaign by ID)
│   └── LobbyPage.jsx            # Pre-game multiplayer lobby
├── components/hub/
│   ├── HubNav.jsx               # Left navigation
│   ├── HubTopBar.jsx            # Top bar with notifications + profile
│   ├── CampaignsView.jsx        # Campaign card grid
│   ├── CampaignCard.jsx         # Individual campaign card
│   ├── CampaignDetail.jsx       # Campaign detail view
│   ├── ArchiveModal.jsx         # Type-to-confirm archive
│   ├── FriendsView.jsx          # Friends list with presence
│   ├── AddFriendModal.jsx       # Add friend by code
│   ├── SettingsView.jsx         # Hub settings
│   └── CharacterBuilder.jsx     # Character-only wizard for invited players
├── contexts/
│   └── NotificationContext.jsx  # Global notification state + Socket.IO listener
├── components/effects/
│   └── NotificationToast.jsx    # Global toast notifications (works in hub + game)
├── services/
│   └── socketService.js         # Socket.IO client
└── styles/
    └── hub.css                  # Hub dark fantasy styles

docs/
└── dm-storytelling-research.md  # DM storytelling guide compilation
```

## Modified Files

```
server/app/models.py             # New models (Friendship, FriendRequest, CampaignPlayer, etc.)
server/app/schemas.py            # New Pydantic schemas
server/app/main.py               # Socket.IO mount + new route registration
server/app/routes/campaigns.py   # Archive, invite, hub list endpoints
server/app/routes/chat.py        # Multiplayer chat support
server/app/routes/auth.py        # friend_code in auth response
server/requirements.txt          # python-socketio

client/src/main.jsx              # New routes
client/src/App.jsx               # Game-only layout (unchanged internally)
client/src/contexts/AuthContext.jsx    # Socket connect on login, hub redirect
client/src/contexts/GameContext.jsx    # Backend-primary persistence
client/src/hooks/useCloudSync.js       # Backend save logic
client/src/components/chat/ChatPanel.jsx        # Multiplayer chat
client/src/components/panels/SettingsPanel.jsx  # Simplified (text size only)
client/src/utils/systemPrompt.js       # Multiplayer prompt context
client/src/styles/index.css            # Import hub.css
client/package.json                    # socket.io-client

dm-engine.md                     # Storytelling enhancements + multiplayer DM instructions
```
