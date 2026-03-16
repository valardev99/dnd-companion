"""WebSocket manager for real-time presence, notifications, and multiplayer."""
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

import socketio
from jose import JWTError

logger = logging.getLogger(__name__)

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


@sio.event
async def typing_start(sid, data):
    """Broadcast that a player started typing to others in the campaign room."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    campaign_id = data.get("campaign_id")
    username = data.get("username", "Someone")
    if campaign_id:
        await sio.emit(
            "peer_typing",
            {"user_id": user_id, "username": username, "typing": True},
            room=f"campaign:{campaign_id}",
            skip_sid=sid,
        )


@sio.event
async def typing_stop(sid, data):
    """Broadcast that a player stopped typing."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    campaign_id = data.get("campaign_id")
    username = data.get("username", "Someone")
    if campaign_id:
        await sio.emit(
            "peer_typing",
            {"user_id": user_id, "username": username, "typing": False},
            room=f"campaign:{campaign_id}",
            skip_sid=sid,
        )


def _build_multiplayer_system_prompt(
    campaign_name: str,
    world_bible: Optional[str],
    players: List[Dict],
    game_data: Optional[Dict],
) -> str:
    """Build the system prompt for a multiplayer campaign.

    Includes all player character sheets so the DM AI can address
    each player by name and reference their abilities.
    """
    lines = [
        "You are the Dungeon Master for a multiplayer D&D campaign.",
        f"Campaign: {campaign_name}",
        "",
    ]

    if world_bible:
        lines.append("=== World Bible ===")
        lines.append(world_bible)
        lines.append("")

    if game_data:
        world_state = game_data.get("world_state")
        if world_state:
            lines.append("=== Current World State ===")
            lines.append(json.dumps(world_state, indent=2))
            lines.append("")

    lines.append("=== Player Characters ===")
    for p in players:
        username = p.get("username", "Unknown")
        char_data = p.get("character_data")
        lines.append(f"Player: {username}")
        if char_data:
            char_name = char_data.get("name", "Unnamed")
            char_class = char_data.get("class", "Unknown")
            char_race = char_data.get("race", "Unknown")
            char_level = char_data.get("level", 1)
            lines.append(f"  Character: {char_name} (Level {char_level} {char_race} {char_class})")
            # Include full sheet for reference
            for key, value in char_data.items():
                if key not in ("name", "class", "race", "level"):
                    lines.append(f"  {key}: {value}")
        else:
            lines.append("  No character sheet yet.")
        lines.append("")

    lines.extend([
        "=== Instructions ===",
        "- Address players by their character names when responding in-game.",
        "- Track each player's actions and their effects on the shared world.",
        "- When a player takes an action, describe the results and how it affects all players.",
        "- Keep the narrative engaging for all players, giving each moments to shine.",
        "- If the response includes game state changes (HP, inventory, status effects, etc.),",
        "  include a JSON block at the very end wrapped in ```game_state_update``` fences.",
    ])

    return "\n".join(lines)


def _extract_game_state_update(text: str) -> Optional[Dict]:
    """Extract a game_state_update JSON block from the DM response, if present."""
    marker = "```game_state_update"
    start = text.find(marker)
    if start == -1:
        return None
    # Skip past the opening fence line
    json_start = text.find("\n", start)
    if json_start == -1:
        return None
    json_start += 1
    end = text.find("```", json_start)
    if end == -1:
        return None
    try:
        return json.loads(text[json_start:end].strip())
    except (json.JSONDecodeError, ValueError):
        return None


@sio.event
async def player_action(sid, data):
    """Handle a player sending a message in a multiplayer campaign.

    Expects data: {campaign_id: str, message: str}
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    from app.auth import decrypt_api_key
    from app.database import async_session
    from app.models import Campaign, CampaignPlayer, User
    from app.services.openrouter import stream_chat_completion

    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        await sio.emit("error", {"message": "Not authenticated"}, to=sid)
        return

    campaign_id = data.get("campaign_id")
    message = data.get("message", "").strip()
    if not campaign_id or not message:
        await sio.emit("error", {"message": "campaign_id and message are required"}, to=sid)
        return

    room = f"campaign:{campaign_id}"

    try:
        async with async_session() as db:
            # Load campaign with owner (for API key)
            result = await db.execute(
                select(Campaign)
                .options(selectinload(Campaign.owner))
                .where(Campaign.id == campaign_id)
            )
            campaign = result.scalar_one_or_none()

            if not campaign:
                await sio.emit("error", {"message": "Campaign not found"}, to=sid)
                return

            if not campaign.is_multiplayer:
                await sio.emit("error", {"message": "This is not a multiplayer campaign"}, to=sid)
                return

            # Get the sending player's username
            player_result = await db.execute(
                select(User.username).where(User.id == user_id)
            )
            player_username = player_result.scalar_one_or_none()
            if not player_username:
                await sio.emit("error", {"message": "User not found"}, to=sid)
                return

            # Verify user is a player in this campaign (or the owner)
            if user_id != campaign.owner_id:
                membership_result = await db.execute(
                    select(CampaignPlayer.id)
                    .where(CampaignPlayer.campaign_id == campaign_id)
                    .where(CampaignPlayer.user_id == user_id)
                )
                if not membership_result.scalar_one_or_none():
                    await sio.emit("error", {"message": "You are not in this campaign"}, to=sid)
                    return

            # Get owner's API key
            owner = campaign.owner
            if not owner or not owner.encrypted_api_key:
                await sio.emit("error", {
                    "message": "Campaign owner has no API key configured",
                }, to=sid)
                return

            try:
                api_key = decrypt_api_key(owner.encrypted_api_key)
            except Exception:
                await sio.emit("error", {
                    "message": "Failed to decrypt campaign owner's API key",
                }, to=sid)
                return

            # Load all players with their character data and usernames
            players_result = await db.execute(
                select(CampaignPlayer, User.username)
                .join(User, CampaignPlayer.user_id == User.id)
                .where(CampaignPlayer.campaign_id == campaign_id)
            )
            player_rows = players_result.all()
            players_info = []  # type: List[Dict]
            for cp, uname in player_rows:
                players_info.append({
                    "user_id": cp.user_id,
                    "username": uname,
                    "character_data": cp.character_data,
                    "role": cp.role,
                })

            # Build system prompt
            system_prompt = _build_multiplayer_system_prompt(
                campaign_name=campaign.name,
                world_bible=campaign.world_bible,
                players=players_info,
                game_data=campaign.game_data,
            )

            # Build messages array from chat history + new player message
            chat_history = campaign.chat_history or []  # type: List[Dict]
            player_msg = {
                "role": "user",
                "content": f"[{player_username}]: {message}",
            }
            chat_history.append(player_msg)

            # Broadcast the player message to the room
            await sio.emit("player_message", {
                "campaign_id": campaign_id,
                "user_id": user_id,
                "username": player_username,
                "message": message,
            }, room=room)

            # Stream LLM response and broadcast chunks
            full_response = []  # type: List[str]

            async for sse_line in stream_chat_completion(
                api_key=api_key,
                model="google/gemini-2.5-flash",
                messages=chat_history,
                system_prompt=system_prompt,
                max_tokens=4096,
            ):
                # Parse the SSE line: "data: {json}\n\n"
                line = sse_line.strip()
                if not line.startswith("data: "):
                    continue

                raw = line[6:]
                try:
                    event = json.loads(raw)
                except (json.JSONDecodeError, ValueError):
                    continue

                event_type = event.get("type", "")

                if event_type == "content_block_delta":
                    delta = event.get("delta", {})
                    text = delta.get("text", "")
                    if text:
                        full_response.append(text)
                        await sio.emit("dm_message", {
                            "campaign_id": campaign_id,
                            "chunk": text,
                        }, room=room)

                elif event_type == "error":
                    error_msg = event.get("error", {}).get("message", "Unknown LLM error")
                    await sio.emit("error", {
                        "campaign_id": campaign_id,
                        "message": f"LLM error: {error_msg}",
                    }, room=room)
                    return

                elif event_type == "message_stop":
                    break

            # Assemble full DM response
            dm_text = "".join(full_response)

            # Emit completion event with the full text
            await sio.emit("dm_message_complete", {
                "campaign_id": campaign_id,
                "text": dm_text,
            }, room=room)

            # Save DM response to chat history
            dm_msg = {
                "role": "assistant",
                "content": dm_text,
            }
            chat_history.append(dm_msg)
            campaign.chat_history = chat_history

            # Check for game state updates in the response
            state_update = _extract_game_state_update(dm_text)
            if state_update:
                game_data = campaign.game_data or {}
                game_data.update(state_update)
                campaign.game_data = game_data

            campaign.last_played_at = datetime.utcnow()
            await db.commit()

    except Exception as exc:
        logger.exception("Error in player_action handler: %s", exc)
        await sio.emit("error", {
            "campaign_id": campaign_id,
            "message": "An unexpected error occurred while processing your action.",
        }, to=sid)


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
