# The Shattered Reaches — D&D Companion App

A solo D&D campaign companion powered by Claude as your AI Dungeon Master. Two-screen experience: chat with your DM on the left, track your adventure on the right.

![Dark Fantasy Theme](https://img.shields.io/badge/theme-Dark%20Fantasy-8b1a1a) ![Claude API](https://img.shields.io/badge/AI-Claude%20API-c9a84c) ![No Dependencies](https://img.shields.io/badge/deps-zero-4caf50)

## Features

**AI Dungeon Master**
- Real-time streaming chat with Claude (Sonnet or Opus)
- DM Engine V3 rules system — dice, hidden trackers, consequences, NPC depth
- Metadata tag parsing — Claude's responses silently update all companion panels

**10 Companion Panels**
- **Dashboard** — Current scene, vitals, conditions, quick stats
- **Character Sheet** — Stats, conditions, abilities, traits, hidden trackers
- **Inventory** — Equipped gear, consumables, key items, materials with rarity system
- **Quest Tracker** — Main quests, active, rumored, failed with milestone tracking
- **NPC Roster** — Allies, neutral, hostile with D3.js relationship web
- **Combat Tracker** — Turn order, combat log, initiative tracking
- **World Map** — SVG interactive map with discovered/unexplored locations
- **Lore Codex** — Unlockable world lore organized by category
- **Session Journal** — Session summaries, consequence ledger, campaign analytics
- **Settings** — API configuration, campaign management, theme options

**Technical**
- Zero dependencies — React 18 + D3.js via CDN, Python stdlib server
- Dark Fantasy CSS theme (Cinzel/Fira Code fonts, crimson/gold/obsidian palette)
- Canvas particle background with floating arcane runes
- LitRPG-style system notifications for stat changes, items, quests
- localStorage persistence for game state, chat history, and API key
- SSE streaming via Python proxy (no Node.js required)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/dnd-companion.git
cd dnd-companion

# Start the server
python3 server.py

# Open in browser
open http://localhost:3000
```

1. Go to **Settings** → **API Configuration**
2. Paste your [Anthropic API key](https://console.anthropic.com/)
3. Click **Test Connection**
4. Start chatting — type a message and the DM will respond!

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER: Campaign Title │ Session # │ Level │ Alerts          │
├────────────────────────────┬─────┬───────────────────────────┤
│                            │     │                           │
│     CHAT PANEL (65%)       │ NAV │    COMPANION (35%)        │
│                            │     │    (10 panels + context)  │
│  ┌──────────────────────┐  │ 🏠  │                           │
│  │ Message history       │  │ 👤  │  ┌─────────────────────┐ │
│  │ (streaming)           │  │ 🎒  │  │  Active Panel        │ │
│  │                       │  │ 📜  │  │  (auto-updates from  │ │
│  │                       │  │ 👥  │  │   metadata tags)     │ │
│  │                       │  │ ⚔️  │  │                      │ │
│  │                       │  │ 🗺  │  └─────────────────────┘ │
│  └──────────────────────┘  │ 📖  │                           │
│  ┌──────────────────────┐  │ 📓  │  ┌─────────────────────┐ │
│  │ Input: What do you do?│  │ ⚙️  │  │  Context Details     │ │
│  └──────────────────────┘  │     │  └─────────────────────┘ │
├────────────────────────────┴─────┴───────────────────────────┤
│ FOOTER: API Status │ Model │ Session/Day/Time               │
└──────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Player types message → sends to Python proxy
2. Proxy forwards to Claude API with system prompt (DM Engine + world state + tag instructions)
3. Claude streams narrative response with embedded metadata tags
4. Frontend parses tags, strips them from display, dispatches state updates
5. Companion panels re-render with new game state
6. System notifications fire for stat changes, items, quests

## Files

| File | Description |
|------|-------------|
| `index.html` | Complete React app — all components, state management, streaming logic |
| `styles.css` | Dark Fantasy theme — ~1,800 lines of CSS |
| `server.py` | Python stdlib API proxy with SSE streaming (~170 lines) |
| `dm-engine.md` | DM Engine V3 rules system (~80KB) |
| `serve.sh` | Simple static file server (legacy, use server.py instead) |

## Requirements

- Python 3.6+
- A modern browser
- An [Anthropic API key](https://console.anthropic.com/)

## How It Works

Claude receives a three-layer system prompt on every request:

1. **DM Engine V3** — Complete rules for narrative style, dice mechanics, hidden trackers, NPC behavior, pacing, and consequences
2. **World State** — Serialized JSON of current character stats, inventory, quests, NPCs, combat status
3. **Metadata Tag Instructions** — Tells Claude to embed structured tags like `[STAT_CHANGE: stat="RES", old=5, new=6]` that the app parses silently

The companion app never sees the tags — they're stripped before display and dispatched as state updates to the React reducer.

## License

MIT
