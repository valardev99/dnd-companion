# Wanderlore AI — Project Guidelines

## Design System (DO NOT OVERRIDE)

This project uses a **Dark Fantasy / World of Warcraft** visual theme. All UI work must preserve this aesthetic.

### Core Design Rules
- **Color palette:** Gold (#c9a84c), obsidian (#0a0a0f), stone (#1a1a24), parchment (#e8dcc8), crimson (#dc2626), emerald (#10b981). NO bright whites, NO pastel colors, NO corporate blues.
- **Typography:** Cinzel (serif) for headings/titles, Crimson Text for body, Fira Code for monospace. NO system fonts, NO sans-serif headings.
- **Borders:** Warcraft-style metallic card borders with stone/wood textures. NO rounded-corner-only cards, NO flat Material Design.
- **Tone:** Dark, atmospheric, medieval. Think Diablo/WoW UI, not SaaS dashboard.
- **Animations:** Subtle gold glows, particle effects, fade transitions. NO bouncy/playful animations.

### CSS Variables (defined in client/src/styles/variables.css)
```
--gold, --gold-bright, --gold-dim
--obsidian, --void, --stone, --stone-light
--parchment, --silver, --muted
--crimson, --crimson-bright
--emerald, --emerald-bright
--amber
--border-dim, --border-gold
```

### When UI/UX Pro Max activates
Use its accessibility, touch target, and performance rules. For style/color/typography decisions, ALWAYS defer to the dark fantasy theme above.

## Architecture

- **Frontend:** React + Vite (client/)
- **Backend:** FastAPI + SQLAlchemy async (server/)
- **API routes:** All under /api/* (campaigns, stories, feedback, admin, chat, test) or /auth/*
- **Database:** PostgreSQL in prod, SQLite (aiosqlite) for local dev
- **Chat:** SSE streaming via OpenRouter API

## Important Rules
- DO NOT push to GitHub without explicit permission
- DO NOT change the visual theme to anything modern/corporate/generic
- API keys are stored locally, never sent to our servers
- Use Fernet encryption for API keys at rest on the server
