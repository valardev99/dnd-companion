# Wonderlore AI — Project Guidelines

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

## E2E Testing Checklist (MANDATORY before any "ready to push" claim)

When asked to run full testing, EVERY section below must be checked. Do not skip any.

### 1. Auth Flow (Registration → Login → Session)
- [ ] Register a NEW account (not reuse existing) — verify 201 response
- [ ] Login with the new account — verify token returned
- [ ] Verify token works for authenticated API calls
- [ ] Test invalid email, short password, duplicate email — verify friendly error messages
- [ ] Test error handling for non-JSON server responses (500s, timeouts)

### 2. Database Schema Parity
**THIS IS THE #1 MISSED BUG CATEGORY.** Local SQLite and production PostgreSQL can drift.
- [ ] If ANY column was added to a model, verify `_safe_migrate()` in `database.py` includes it
- [ ] After model changes, test against a FRESH database (delete local.db, restart server) to catch missing columns
- [ ] Check that `create_all` + `_safe_migrate()` together produce a working schema from scratch
- [ ] Remember: `create_all` NEVER adds columns to existing tables — only `_safe_migrate()` does

### 3. API Error Handling
- [ ] All frontend `fetch()` calls must wrap `.json()` in try/catch for non-JSON responses
- [ ] Server 500 errors should show "Server error" not crash the UI
- [ ] Pydantic validation errors (422) should show friendly field-specific messages
- [ ] Network failures should be caught and shown gracefully

### 4. Frontend — Desktop (1280px+)
- [ ] Landing page: nav links, hero, all sections, footer
- [ ] Auth modals: login, register, forgot password
- [ ] Hub: campaign list, campaign detail, settings, notifications
- [ ] Game session: chat, sidebar panels, header stats, wizard

### 5. Frontend — Mobile (375px and 320px)
- [ ] Landing page: hamburger menu works, all sections fit, no overflow
- [ ] Auth modals: inputs and buttons fit within viewport
- [ ] Hub: campaign list, detail, settings all usable with touch targets
- [ ] Game session: chat input, panel switching, header — all fit

### 6. Production Readiness
- [ ] `npm run build` passes clean (no errors)
- [ ] No hardcoded localhost URLs in production code
- [ ] Environment variables documented (RESEND_API_KEY, DATABASE_URL, JWT_SECRET, etc.)
- [ ] CORS origins include production domain
- [ ] Server starts without crashes (test: `python -m uvicorn app.main:app`)
