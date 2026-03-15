"""Session summarizer service — generates 'Previously on...' recaps via OpenRouter.

Called when a session ends (manual endpoint or triggered on save) to create
a narrative recap that can be injected into future prompts for context continuity.
"""
import json
from typing import Any, Dict, List, Optional

import httpx

from app.config import OPENROUTER_API_URL

RECAP_PROMPT = """You are a fantasy narrator. Summarize this play session in 2-3 paragraphs.
Focus on: key decisions made, NPCs encountered, items gained/lost, quests advanced, and where the story left off.
Write in past tense, third person, dramatic style. End with a hook for the next session.
Do NOT include game mechanics or stat changes — narrative only."""


def _build_recap_context(
    chat_messages: Optional[List[Dict[str, Any]]],
    game_data: Optional[Dict[str, Any]],
    world_bible: Optional[str],
) -> str:
    """Build context block from chat messages, game data, and world bible."""
    parts = []

    # Extract key info from game_data
    if game_data and isinstance(game_data, dict):
        character = game_data.get("character", {})
        if isinstance(character, dict):
            name = character.get("name", "the adventurer")
            race = character.get("race", "")
            cls = character.get("class", "")
            level = character.get("level", "")
            parts.append(f"Character: {name} — {race} {cls} (Level {level})")

        campaign = game_data.get("campaign", {})
        if isinstance(campaign, dict):
            world = campaign.get("name", "")
            location = campaign.get("location", "")
            if world:
                parts.append(f"World: {world}")
            if location:
                parts.append(f"Current location: {location}")

        # Active quests
        quests = game_data.get("quests", [])
        if isinstance(quests, list):
            active = [q for q in quests if isinstance(q, dict) and q.get("status") == "active"]
            if active:
                quest_lines = [f"- {q.get('title', q.get('id', 'Unknown'))}: {q.get('objective', '')}" for q in active]
                parts.append("Active quests:\n" + "\n".join(quest_lines))

        # NPCs
        npcs = game_data.get("npcs", [])
        if isinstance(npcs, list) and npcs:
            npc_lines = [f"- {n.get('name', '?')} ({n.get('relationship', 'unknown')})" for n in npcs if isinstance(n, dict)]
            if npc_lines:
                parts.append("Known NPCs:\n" + "\n".join(npc_lines))

    # World bible excerpt for lore flavor
    if world_bible:
        trimmed = world_bible[:2000]
        parts.append(f"World lore:\n{trimmed}")

    # Last 30 chat messages
    if chat_messages:
        recent = chat_messages[-30:]
        formatted = []
        for msg in recent:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if content:
                # Truncate very long messages
                if len(content) > 500:
                    content = content[:500] + "..."
                formatted.append(f"[{role}]: {content}")
        if formatted:
            parts.append("Recent session dialogue:\n" + "\n".join(formatted))

    return "\n\n".join(parts)


async def generate_session_summary(
    chat_messages: Optional[List[Dict[str, Any]]],
    game_data: Optional[Dict[str, Any]],
    world_bible: Optional[str],
    api_key: str,
    model: str = "google/gemini-3-flash-preview",
) -> str:
    """Generate a 'Previously on...' session summary via OpenRouter (non-streaming).

    Args:
        chat_messages: List of chat message dicts with role/content keys.
        game_data: Campaign game_data JSON (character, quests, npcs, etc.).
        world_bible: Free-text world lore / setting description.
        api_key: OpenRouter API key.
        model: Model identifier for the completion.

    Returns:
        The generated session summary text.

    Raises:
        RuntimeError: If the API call fails or returns no content.
    """
    context = _build_recap_context(chat_messages, game_data, world_bible)

    system_message = RECAP_PROMPT + "\n\nCAMPAIGN CONTEXT:\n" + context

    payload = {
        "model": model,
        "max_tokens": 1024,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_message},
            {
                "role": "user",
                "content": (
                    "Write a 'Previously on...' recap of this play session. "
                    "Make it dramatic and end with a hook for next time."
                ),
            },
        ],
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0)) as client:
        try:
            response = await client.post(
                OPENROUTER_API_URL,
                json=payload,
                headers=headers,
            )
        except httpx.RequestError as exc:
            raise RuntimeError(f"Failed to connect to OpenRouter: {exc}") from exc

    if response.status_code != 200:
        error_text = response.text
        raise RuntimeError(
            f"OpenRouter returned status {response.status_code}: {error_text}"
        )

    try:
        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("OpenRouter returned no choices in response")

        content = choices[0].get("message", {}).get("content", "")
        if not content:
            raise RuntimeError("OpenRouter returned empty content")

        return content.strip()

    except (json.JSONDecodeError, KeyError, IndexError) as exc:
        raise RuntimeError(f"Failed to parse OpenRouter response: {exc}") from exc
