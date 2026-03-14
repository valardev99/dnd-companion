#!/usr/bin/env python3
"""
Tag Emission Test — Plays through ~20 exchanges with the LLM
and tracks which metadata tags come back in each response.
"""

import json
import re
import sys
import time
import urllib.request

API_URL = "http://localhost:3000/api/chat"
API_KEY = "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"
MODEL = "google/gemini-3-flash-preview"
PROVIDER = "openrouter"

# Read dm-engine from disk
with open("/tmp/dnd-companion/dm-engine.md", "r") as f:
    DM_ENGINE = f.read()

# Simple test world bible
WORLD_BIBLE = """# The Sunken Crypt — Test Campaign

## Core Premise
An ancient crypt beneath a forgotten temple has awakened. Undead stir in its depths, traps guard forgotten treasures, and a lich lord consolidates power in the deepest chamber. The world is dark fantasy with moderate magic.

## Character
Name: Kaelen
Race: Human
Class: To be assigned by the world
"""

# Build the system prompt the same way the app does
WORLD_STATE = json.dumps({
    "campaign": {"name": "The Sunken Crypt", "session": 1, "day": 1, "time": "Dawn", "location": "Temple Entrance", "mood": "Ominous"},
    "character": {
        "name": "Kaelen", "race": "Human", "class": "", "level": 1,
        "hp": {"current": 20, "max": 20}, "mp": {"current": 10, "max": 10},
        "sanity": {"current": 100, "max": 100}, "gold": 0,
        "stats": {
            "RESONANCE": {"value": 0, "trend": "stable"},
            "VITALITY": {"value": 0, "trend": "stable"},
            "ACUITY": {"value": 0, "trend": "stable"},
            "WILL": {"value": 0, "trend": "stable"},
            "AFFINITY": {"value": 0, "trend": "stable"},
        },
        "conditions": [], "abilities": [],
    },
    "inventory": {"equipped": [], "consumables": [], "keyItems": []},
    "quests": [], "npcs": [],
    "combat": {"active": False},
    "vitalsConfig": {},
}, indent=2)

TAG_INSTRUCTIONS = """
CRITICAL — METADATA TAG INSTRUCTIONS:
You MUST include metadata tags after EVERY response. The companion app ONLY updates through these tags. If you don't emit tags, the player's stats, inventory, quests, and abilities will NOT update. This is CRITICAL — the companion app is DEAD without your tags.

Tags are parsed silently — the player never sees them.
Format: [TAG_TYPE: key=value, key=value]

Available tags:
[SCENE_UPDATE: location="...", time="...", day=N, mood="..."]
[STAT_CHANGE: stat="...", old=N, new=N, reason="..."]
[HP_CHANGE: old=N, new=N, reason="..."]
[MP_CHANGE: old=N, new=N, reason="..."]
[XP_GAIN: amount=N, source="...", reason="..."]
[ITEM_ACQUIRED: name="...", rarity="...", type="...", desc="..."]
[ITEM_REMOVED: name="...", reason="..."]
[QUEST_UPDATE: id="...", status="...", progress=N, objective="..."]
[NPC_UPDATE: name="...", relationship="...", status="...", location="..."]
[COMBAT_START: enemies="...", environment="..."]
[COMBAT_END: result="...", xp=N]
[ROLL_RESULT: type="...", rolled=N, modifier=N, dc=N, result="..."]
[HIDDEN_TRACKER: tracker="...", change=N, new_value=N]
[CONDITION_ADD: name="...", type="...", desc="..."]
[CONDITION_REMOVE: name="..."]
[LORE_UNLOCK: category="...", title="...", content="..."]
[REVEAL_VITAL: vital="mp|sanity", label="...", fullLabel="...", icon="..."]
[ABILITY_ADD: name="...", type="Active|Passive|Reaction", desc="...", cost="...", cooldown="..."]

IMPORTANT RULES FOR TAGS:
- ALWAYS emit [NPC_UPDATE] the FIRST time the player meets any named NPC.
- ALWAYS emit [ABILITY_ADD] when the player discovers or unlocks a new ability.
- ALWAYS emit [XP_GAIN] when the player earns experience. This MUST include the amount.
- Use [STAT_CHANGE] ONLY when a stat value actually changes — do not re-emit current values.
- In your FIRST response of a new campaign, emit [STAT_CHANGE] for all 5 core stats, [HP_CHANGE], and [XP_GAIN] to initialize the companion app.

ALWAYS include relevant tags at the END of your response. The companion app depends entirely on these tags.
"""

SYSTEM_PROMPT = f"""{DM_ENGINE}

--- WORLD BIBLE ---
{WORLD_BIBLE}

--- CURRENT WORLD STATE ---
{WORLD_STATE}

{TAG_INSTRUCTIONS}
"""

# Player messages to simulate a real playthrough
PLAYER_MESSAGES = [
    "[SYSTEM] A new campaign in The Sunken Crypt has begun. Welcome the player, set the opening scene, establish initial character stats via metadata tags, and ask the player what they want to do.",
    "I look around. What do I see at the temple entrance?",
    "I enter the temple cautiously, drawing my sword.",
    "I examine the walls for any markings or traps.",
    "I continue deeper into the crypt.",
    "Is there anyone else here? I call out quietly.",
    "I approach the figure. Who are you?",
    "I ask them to join me. What lies ahead?",
    "I move forward into the next chamber.",
    "I search the room for anything useful.",
    "I pick up the item and keep exploring.",
    "I hear something ahead. I ready my weapon.",
    "I attack the creature!",
    "I try to dodge its attack and strike back.",
    "I finish it off. What loot do I find?",
    "I take a moment to rest and tend my wounds.",
    "I push forward to the next level of the crypt.",
    "There's a locked door. I try to pick the lock.",
    "I enter the room beyond the door.",
    "I examine the altar in the center of the room.",
]

TAG_PATTERN = re.compile(r'\[([A-Z_]+):\s*([^\]]+)\]')

def send_message(messages):
    """Send a message to the API and get the full response (non-streaming)."""
    # Use non-streaming endpoint via direct OpenRouter call
    payload = json.dumps({
        "apiKey": API_KEY,
        "model": MODEL,
        "provider": PROVIDER,
        "messages": messages,
        "systemPrompt": SYSTEM_PROMPT,
    }).encode('utf-8')

    req = urllib.request.Request(API_URL, data=payload, headers={"Content-Type": "application/json"})

    # Read the SSE stream
    full_text = ""
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            for raw_line in resp:
                line = raw_line.decode('utf-8').strip()
                if not line.startswith('data: '):
                    continue
                data = line[6:].strip()
                if data == '[DONE]':
                    break
                try:
                    event = json.loads(data)
                    if event.get('type') == 'message_stop':
                        break
                    if event.get('type') == 'content_block_delta' and event.get('delta', {}).get('text'):
                        full_text += event['delta']['text']
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        return f"ERROR: {e}", []

    # Extract tags
    tags_found = TAG_PATTERN.findall(full_text)
    return full_text, tags_found


def main():
    print("=" * 70)
    print("TAG EMISSION TEST — Playing through 20 exchanges")
    print("=" * 70)
    print(f"Model: {MODEL}")
    print(f"Provider: {PROVIDER}")
    print()

    conversation = []
    total_tags = 0
    responses_with_tags = 0
    responses_without_tags = 0
    tag_type_counts = {}

    for i, player_msg in enumerate(PLAYER_MESSAGES):
        print(f"\n{'─' * 70}")
        print(f"TURN {i+1}/{len(PLAYER_MESSAGES)}")
        print(f"PLAYER: {player_msg[:80]}{'...' if len(player_msg) > 80 else ''}")

        conversation.append({"role": "user", "content": player_msg})

        response_text, tags = send_message(conversation[-20:])  # Last 20 messages for context

        if response_text.startswith("ERROR:"):
            print(f"  ⚠ {response_text}")
            break

        # Count sentences in the narrative (before tags)
        clean_text = TAG_PATTERN.sub('', response_text).strip()
        sentences = [s.strip() for s in re.split(r'[.!?]+', clean_text) if s.strip() and len(s.strip()) > 10]

        # Truncate display
        display_text = clean_text[:200] + ('...' if len(clean_text) > 200 else '')
        print(f"  DM: {display_text}")
        print(f"  📏 Sentences: ~{len(sentences)}")

        if tags:
            responses_with_tags += 1
            total_tags += len(tags)
            print(f"  ✅ TAGS ({len(tags)}):")
            for tag_type, tag_params in tags:
                print(f"     [{tag_type}: {tag_params[:60]}{'...' if len(tag_params) > 60 else ''}]")
                tag_type_counts[tag_type] = tag_type_counts.get(tag_type, 0) + 1
        else:
            responses_without_tags += 1
            print(f"  ❌ NO TAGS EMITTED")

        conversation.append({"role": "assistant", "content": response_text})

        # Small delay to be nice to rate limits
        time.sleep(1)

    # Summary
    print(f"\n{'=' * 70}")
    print(f"SUMMARY")
    print(f"{'=' * 70}")
    print(f"Total exchanges:        {len(PLAYER_MESSAGES)}")
    print(f"Responses WITH tags:    {responses_with_tags} ✅")
    print(f"Responses WITHOUT tags: {responses_without_tags} ❌")
    print(f"Tag emission rate:      {responses_with_tags}/{responses_with_tags + responses_without_tags} ({100*responses_with_tags/max(1, responses_with_tags + responses_without_tags):.0f}%)")
    print(f"Total tags emitted:     {total_tags}")
    print(f"\nTag type breakdown:")
    for tag_type, count in sorted(tag_type_counts.items(), key=lambda x: -x[1]):
        print(f"  {tag_type}: {count}")

    # Sentence length analysis
    print(f"\nDone.")


if __name__ == "__main__":
    main()
