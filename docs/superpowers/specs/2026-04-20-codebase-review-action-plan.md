# Wonderlore AI — Codebase + UX Review Action Plan

**Date:** 2026-04-20 • **Scope:** Results of 4-agent parallel review +
continuation on hotfixes + next-level vision.

---

## What landed in this session (already shipped to branch)

| # | Fix | Files touched |
|---|-----|---------------|
| P0.1 | Fernet key hard-fails in production if `FERNET_KEY` unset | `server/app/config.py` |
| P0.2 | `SECRET_KEY` hard-fails in production if unset (JWT forge risk) | `server/app/config.py` |
| P0.3 | Stripe webhook idempotency — dedupes by `event.id` via new `stripe_webhook_events` table | `server/app/models.py`, `server/app/routes/billing.py` |
| P0.4 | NotificationToast close `×` renders correctly + Escape dismisses | `client/src/components/effects/NotificationToast.jsx` |
| P0.5 | AdminPage now uses `authFetch` (was reading nonexistent localStorage token) | `client/src/pages/AdminPage.jsx` |
| P0.6 | `_safe_migrate` now covers Campaign / Story / Subscription / Notification / Feedback columns | `server/app/database.py` |
| P1   | Skip-link, focus-visible, reduced-motion globally | `client/src/styles/accessibility.css`, `client/src/components/shared/SkipLink.jsx`, `App.jsx`, `LandingPage.jsx` |
| P1   | SSE DM narration announced to screen readers via polite live region | `client/src/components/chat/ChatPanel.jsx` |
| P1   | Email logger no longer leaks Resend API-key prefix | `server/app/email.py` |

**Build verified:** `npm run build` passes clean (587KB / 171KB gz).
**Server compile verified:** all modified `.py` files pass `py_compile`.

---

## Still outstanding from the reviews

### Backend — HIGH priority remaining

| Ref | Issue | Effort |
|-----|-------|--------|
| C3 | Email sending blocks async event loop — `resend.Emails.send` is sync | S — wrap in `asyncio.to_thread` |
| C7 | Refresh-token reuse not detected (no rotation) | M |
| C8 | Password reset doesn't invalidate other active sessions | S |
| H1 | No rate limit on `/auth/login`, `/auth/register`, `/auth/magic-link` | S — `slowapi` |
| H2 | Alembic directory exists but is unused — we should adopt it and retire `_safe_migrate` once migrated | L |
| H3 | `get_db()` session auto-commits on every request — expensive for read-heavy routes | M |

### Frontend — HIGH priority remaining

| Ref | Issue | Effort |
|-----|-------|--------|
| C5 | `useCloudSync` stale-closure bug drops sync for campaigns renamed mid-session | S |
| C6 | `GameContext` re-hydrate duplicates chat history on reconnection | M |
| C7 | `ChatPanel` SSE race: fast second message overwrites streaming buffer | M |
| H-auth | Plaintext API key crosses our server on save (doc the tradeoff OR client-side encrypt) | M |

### Accessibility — AA level (Level A shipped above)

| Ref | Issue | Effort |
|-----|-------|--------|
| A1 | Older `LoginModal`/`RegisterModal` on landing page lack focus trap (AuthModal is fine) | S — replace with AuthModal |
| A2 | Color contrast on `--muted` text over `--stone-light` fails 4.5:1 | S — bump to `--silver` |
| A3 | Auth modal password strength announcement should be `aria-live="polite"` with descriptive text not just "Fair" | S |
| A4 | Hub campaign cards render as `<div onClick>` with no keyboard handler | S |

### Competitive-research wins to harvest

Ordered by impact-per-hour (all M or smaller unless noted):

1. **Parchment-as-content-surface for story/codex** — readability win, fantasy-faithful
2. **Rarity-coded inventory borders** — tokens already in `variables.css`
3. **Shaped HP display on header** — hexagonal HP orb instead of flat bar
4. **Skeuomorphic primary buttons** — carved stone/embossed gold depth
5. **Cinzel + humanist sans pairing** — body copy switches from Crimson Text to a humanist sans below 15px for better mobile readability

---

## Next-level experience roadmap (see 2026-04-20-next-level-experience-design.md for detail)

### Sprint A (next 2 weeks) — **"Cold-start → 15 seconds"**

1. Starter World Picker + 3 hand-crafted worlds
2. Guest mode + magic-link login (kills the signup wall)
3. Continue-your-journey hero row on hub
4. Command Chip Rail in chat ("/roll", "Attack", "Search")
5. AI hero portraits at character creation

**Expected impact:** time-to-first-DM-response from ~90s → ≤15s.

### Sprint B (weeks 3–6) — **"The Wayfarer's Hall"**

6. Full hub redesign (parchment surface, hero portrait header, party/stories tabs)
7. Discord OAuth
8. Command Palette ⌘K
9. Adjutant unified companion view + auto-codex from DM tags
10. Mobile bottom-sheet for companion

### Sprint C (month 3) — **"Living world"**

11. Scene + loot AI images (debounced, style-locked to campaign world)
12. Map canvas + pinning
13. 3 more starter worlds
14. Session analytics dashboard

---

## Open questions for you

1. **UX agent re-dispatch** — both Desktop and Mobile UX agents need
   Claude-in-Chrome MCP connected to audit the live site. Two paths:
   (a) reconnect the extension and I'll re-run them, or (b) run them
   as static-audit agents against `client/src/` which is weaker
   but unblocks today. Which?
2. **Starter World Picker first?** That's the single biggest
   activation bet. If yes, I'd want you to greenlight the
   6-world list (§1 of the next-level spec) and whether writer
   sourcing is in scope or I generate the worlds with Claude.
3. **Budget for AI image generation?** Portraits alone at ~$0.005
   each and ~5k new characters/month ≈ $25/mo. Scene images
   could add $100–300/mo at scale. OK to provision?
4. **Discord OAuth — app credentials ready?** If you already have a
   Discord developer account and can create an app, this ships this
   week. If not, we slot it into Sprint B.

---

## What I recommend you do now

1. **Review + push the hotfix branch** (everything in the "What
   landed" table above). These are shipping-blockers — production
   is exposed on P0.1, P0.2, P0.3 today.
2. **Read `2026-04-20-next-level-experience-design.md`.** It's the
   vision doc. Tell me which P0 items in §8 are the first cut.
3. **Answer the four open questions.** That unblocks Sprint A.
