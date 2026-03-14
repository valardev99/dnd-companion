"""xAI Grok Image Generation service.

Generates character/NPC portrait images via the Grok Imagine API.
Endpoint: POST https://api.x.ai/v1/images/generations
Model: grok-imagine-image ($0.02/image)
"""
import json
from typing import Optional

import httpx

XAI_IMAGE_API_URL = "https://api.x.ai/v1/images/generations"


def build_portrait_prompt(
    name: str,
    race: str = "",
    character_class: str = "",
    description: str = "",
    role: str = "",
    relationship: str = "",
) -> str:
    """Build a rich portrait prompt for dark fantasy character art.

    Structures the prompt as: subject + distinguishing features + style.
    Always enforces the WoW/Diablo dark fantasy aesthetic.
    """
    subject_parts = []

    if name:
        subject_parts.append(f"Portrait of {name}")

    if race:
        subject_parts.append(f"a {race}")
    if character_class:
        subject_parts.append(f"{character_class}")
    if role:
        subject_parts.append(f"who is a {role}")

    subject = ", ".join(subject_parts) if subject_parts else f"Portrait of {name}"

    # Add description details if provided
    desc_part = ""
    if description:
        desc_part = f". {description}"

    # Mood based on relationship
    mood_map = {
        "ally": "warm candlelight, trustworthy expression",
        "friendly": "warm candlelight, trustworthy expression",
        "neutral": "neutral expression, ambient lighting",
        "hostile": "menacing shadows, cold eyes, threatening aura",
        "rumored": "mysterious, partially obscured face, fog and shadow",
    }
    mood = mood_map.get(relationship, "dramatic rim lighting")

    prompt = (
        f"{subject}{desc_part}. "
        f"{mood}. "
        f"Dark fantasy art style inspired by World of Warcraft and Diablo, "
        f"rich oil painting technique, medieval fantasy setting, "
        f"detailed armor and clothing with ornate metalwork, "
        f"moody atmospheric background with deep shadows and warm highlights, "
        f"gold and amber accent lighting, cinematic composition, "
        f"highly detailed, 4K quality portrait"
    )

    return prompt


async def generate_portrait(
    api_key: str,
    name: str,
    race: str = "",
    character_class: str = "",
    description: str = "",
    role: str = "",
    relationship: str = "",
    aspect_ratio: str = "3:4",
) -> dict:
    """Generate a character portrait via xAI Grok Imagine API.

    Args:
        api_key: xAI API key (xai-...) or OpenRouter key for fallback.
        name: Character name.
        race: Character race/species.
        character_class: Character class.
        description: Physical description.
        role: NPC role (e.g., "Apothecary").
        relationship: NPC relationship (ally, hostile, neutral, rumored).
        aspect_ratio: Image aspect ratio (default 3:4 for portraits).

    Returns:
        dict with 'url' and 'revised_prompt' keys, or 'error' on failure.
    """
    prompt = build_portrait_prompt(
        name=name,
        race=race,
        character_class=character_class,
        description=description,
        role=role,
        relationship=relationship,
    )

    payload = {
        "model": "grok-2-image",
        "prompt": prompt,
        "n": 1,
        "response_format": "url",
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
        try:
            response = await client.post(
                XAI_IMAGE_API_URL,
                json=payload,
                headers=headers,
            )

            if response.status_code != 200:
                error_text = response.text
                return {"error": f"Image generation failed ({response.status_code}): {error_text}"}

            data = response.json()
            image_data = data.get("data", [{}])[0]

            return {
                "url": image_data.get("url", ""),
                "revised_prompt": image_data.get("revised_prompt", prompt),
            }

        except httpx.RequestError as exc:
            return {"error": f"Connection error: {str(exc)}"}
        except Exception as exc:
            return {"error": f"Unexpected error: {str(exc)}"}
