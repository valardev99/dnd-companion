"""Recap generation service — generates dramatic story recaps via OpenRouter."""
import json
from typing import Any, Dict, List, Optional

import httpx

from app.config import OPENROUTER_API_URL


def _build_recap_prompt(
    game_data: Optional[Dict[str, Any]],
    chat_messages: Optional[List[Dict[str, Any]]],
    world_bible: Optional[str],
) -> str:
    """Build a system prompt that instructs the LLM to write a dramatic recap."""

    # Extract key details from game_data
    character_name = "the adventurer"
    world_name = "the realm"
    journal_entries: List[str] = []
    npc_encounters: List[str] = []
    quest_info: str = ""

    if game_data:
        # Character info
        character = game_data.get("character", {})
        if isinstance(character, dict):
            character_name = character.get("name", character_name)

        # World info
        world = game_data.get("world", {})
        if isinstance(world, dict):
            world_name = world.get("name", world_name)

        # Journal / session log
        journal = game_data.get("journal", [])
        if isinstance(journal, list):
            journal_entries = [
                entry.get("text", str(entry)) if isinstance(entry, dict) else str(entry)
                for entry in journal
            ]

        # NPCs
        npcs = game_data.get("npcs", [])
        if isinstance(npcs, list):
            for npc in npcs:
                if isinstance(npc, dict):
                    name = npc.get("name", "Unknown")
                    desc = npc.get("description", npc.get("role", ""))
                    npc_encounters.append(f"{name}: {desc}" if desc else name)
                else:
                    npc_encounters.append(str(npc))

        # Quest progress
        quests = game_data.get("quests", game_data.get("quest", ""))
        if isinstance(quests, list):
            quest_info = "; ".join(
                q.get("title", str(q)) if isinstance(q, dict) else str(q)
                for q in quests
            )
        elif isinstance(quests, str):
            quest_info = quests

    # Format chat history excerpt (recent messages for context)
    chat_excerpt = ""
    if chat_messages:
        recent = chat_messages[-30:]  # Last 30 messages for context
        formatted = []
        for msg in recent:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            if content:
                formatted.append(f"[{role}]: {content}")
        if formatted:
            chat_excerpt = "\n".join(formatted)

    # Assemble the context block
    context_parts = [
        f"Character: {character_name}",
        f"World: {world_name}",
    ]

    if journal_entries:
        context_parts.append("Journal entries:\n" + "\n- ".join([""] + journal_entries))

    if npc_encounters:
        context_parts.append("NPCs encountered:\n" + "\n- ".join([""] + npc_encounters))

    if quest_info:
        context_parts.append(f"Quest progress: {quest_info}")

    if world_bible:
        # Include a trimmed world bible for lore context
        trimmed_bible = world_bible[:3000]
        context_parts.append(f"World lore:\n{trimmed_bible}")

    if chat_excerpt:
        context_parts.append(f"Recent session dialogue:\n{chat_excerpt}")

    context_block = "\n\n".join(context_parts)

    system_prompt = (
        "You are a master storyteller and narrator for a Dungeons & Dragons campaign. "
        "Your task is to write a dramatic, vivid, and immersive story recap of the "
        "adventure so far.\n\n"
        "INSTRUCTIONS:\n"
        "- Write exactly 3-4 paragraphs of dramatic prose\n"
        "- Use vivid, evocative language — paint scenes, not bullet points\n"
        "- Weave in character actions, NPC interactions, and quest developments naturally\n"
        "- Capture the emotional tone and tension of the adventure\n"
        "- Write in past tense, third person, as if recounting an epic tale\n"
        "- Reference specific names, places, and events from the provided context\n"
        "- Emphasize dramatic storytelling over dry summary\n"
        "- End with a hook or moment of tension that makes the reader eager to continue\n"
        "- Do NOT include any meta-commentary, headers, or formatting markers\n"
        "- Do NOT mention game mechanics, dice rolls, or out-of-character details\n\n"
        "CAMPAIGN CONTEXT:\n"
        f"{context_block}"
    )

    return system_prompt


async def generate_recap(
    game_data: Optional[Dict[str, Any]],
    chat_messages: Optional[List[Dict[str, Any]]],
    world_bible: Optional[str],
    api_key: str,
    model: str = "google/gemini-3-flash-preview",
) -> str:
    """Generate an LLM-powered dramatic story recap.

    Calls OpenRouter with a non-streaming completion request and returns
    the generated recap text.

    Args:
        game_data: Campaign game_data JSONB (character, world, journal, npcs, quests).
        chat_messages: List of chat message dicts with role/content keys.
        world_bible: Free-text world lore / setting description.
        api_key: OpenRouter API key.
        model: Model identifier for the completion.

    Returns:
        The generated recap text.

    Raises:
        RuntimeError: If the API call fails or returns no content.
    """
    system_prompt = _build_recap_prompt(game_data, chat_messages, world_bible)

    user_message = (
        "Write a dramatic story recap of this D&D campaign based on the context provided. "
        "Make it feel like the opening narration of an epic fantasy novel."
    )

    payload = {
        "model": model,
        "max_tokens": 2048,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
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
