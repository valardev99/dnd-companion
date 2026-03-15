"""WebSocket manager for real-time presence, notifications, and multiplayer."""
import socketio
from datetime import datetime
from jose import JWTError

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
    token = auth.get("token") if auth else None
    if not token:
        raise socketio.exceptions.ConnectionRefusedError("Authentication required")

    from app.auth import decode_token

    try:
        user_data = decode_token(token)
    except JWTError:
        raise socketio.exceptions.ConnectionRefusedError("Invalid token")

    user_id = user_data["sub"]
    await sio.save_session(sid, {"user_id": user_id})
    await sio.enter_room(sid, f"user:{user_id}")

    presence[user_id] = {
        "sid": sid,
        "status": "online",
        "current_campaign": None,
        "last_active": datetime.utcnow().isoformat(),
    }
    await broadcast_presence_to_friends(user_id)


@sio.event
async def disconnect(sid):
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
    campaign_id = data.get("campaign_id")
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    await sio.emit("player_ready", {"user_id": user_id}, room=f"campaign:{campaign_id}")


@sio.event
async def session_start(sid, data):
    campaign_id = data.get("campaign_id")
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    await sio.emit("session_start", {
        "campaign_id": campaign_id,
        "launched_by": user_id,
    }, room=f"campaign:{campaign_id}")


async def broadcast_presence_to_friends(user_id: str):
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
    await sio.emit("notification", notification, room=f"user:{user_id}")
