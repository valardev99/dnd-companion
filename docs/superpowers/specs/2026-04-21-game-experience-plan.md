# Wonderlore AI — Game Experience Plan

**Date:** 2026-04-21 • **Source:** 3-agent game review — live playtest (desktop,
1440×900, real session against localhost), expected-features gap analysis
(code-grounded vs AI Dungeon / D&D Beyond / Roll20 / BG3), and game-feel audit
(every emotional moment traced reducer → render).

---

## The three-sentence diagnosis

1. **The playtest:** the landing page would pass a Blizzard art review (A-),
   but the first session is an onboarding cliff — no wizard fires from the hub
   button, the API-key gate is a dead end (the "connect your key" overlay
   isn't clickable), and the session cockpit renders "—/0/0" everywhere.
2. **The feature gaps:** the biggest missing features are *already built and
   disconnected* — multiplayer fails at one prop, the "Previously on…" recap
   chain is broken in 4 one-line places, combat UI renders on arrays nothing
   populates, the level-up overlay is unreachable dead code.
3. **The game-feel:** zero moments reach "celebrated" tier — every event from
   damage to epic loot is the same corner toast; the app reads as a chat app
   with a news ticker.

---

## Tier 1 — Reconnect what exists (all S — highest priority)

| # | Fix | Evidence |
|---|-----|----------|
| 1.1 | **Wire the level-up.** Dispatch `TOGGLE_LEVELUP: true` from the `ADD_XP` level-crossing (GameContext.jsx:168-173); fix the off-by-one in LevelUpOverlay.jsx:11 (reducer already incremented). | Overlay exists, is never shown. Both audits flagged it #1. |
| 1.2 | **Light the recap chain (4 patches).** (a) Pass `state.sessionSummary` as 5th arg at chatService.js:50 — the DM never sees the "PREVIOUSLY ON" section that already exists in the prompt. (b+c) `session_recap` → `session_summary` in CampaignDetail.jsx:35,94 and LobbyPage.jsx:155-158. (d) JournalPanel.jsx:26-29,52-55 reads `campaign.id` which doesn't exist → `state.activeSaveId` (both Journal buttons currently ALWAYS fail). Then call `/generate-recap` on session exit. | Full summarizer service exists server-side, uncalled. |
| 1.3 | **Route "+ New Campaign" through the wizard.** The hub button creates an unnamed campaign and teleports into an empty cockpit; the 5-step wizard exists but only fires on the `/play/campaign/new` path. | Playtest bug #2 — the make-or-break onboarding moment. |
| 1.4 | **Make the key gate a door.** `chat-disconnected-overlay` gets a click handler that opens the key modal in place; render the composer in disabled state ("Connect a key to speak to your DM") so the core interaction is visible; add "Skip — explore first" to the key modal. | Playtest bug #1 (BLOCKER): new players hit a literal dead end in 90 seconds. |
| 1.5 | **Store combat enemies.** `COMBAT_START` reducer drops the `enemies` payload (GameContext.jsx:156-158) though the prompt requests it — banner permanently says "Unknown foes". | One reducer line. |
| 1.6 | **Populate the NPC web.** The d3 relationship graph reads `npcRelationships` which nothing writes; synthesize player↔NPC edges from `npcs[].relationship` so the showpiece renders day one. | Most impressive dead component in the app. |
| 1.7 | **Kill the placeholder cockpit.** Pre-first-message: collapse the 6× "—" header readouts into "Awaiting your first words…"; default Level 1 / full HP once a character exists. | Playtest change #8 — app looks broken before play starts. |
| 1.8 | **Map return-path bug.** `ADD_MAP_LOCATION` existing-location branch doesn't extend `mapPaths` (GameContext.jsx:127-134) — return journeys draw no route. | Cosmetic, 3 lines. |

## Tier 2 — Signature game-feel (S/M)

| # | Fix |
|---|-----|
| 2.1 | **Inline dice card.** `ROLL_RESULT` renders a `role:'roll'` chat message: parchment-framed card, 600ms number-cycle (reuse DiceRoll.jsx interval logic + `dice-*` CSS from landing.css:1184-1257), margin annotation `17 + 3 vs DC 15 — SUCCESS` with `path-draw` underline, `dice-nat20` bloom on crits. Plus a client-side `/roll d20` command + Roll button — trustworthy RNG the AI can't fake, injected into DM context as a user message. |
| 2.2 | **Damage vignette** — crimson inset box-shadow flash 500ms on HP decrease (Diablo screen-edge blood, no shake). |
| 2.3 | **Heal shimmer** — un-gate tagParser.js:54 for increases; emerald sweep on the HP fill. |
| 2.4 | **Low-HP heartbeat** — below 25%, recolor the unused `gold-pulse` keyframe crimson, 1.2s infinite on HP bar. |
| 2.5 | **Rarity-lit loot toasts** — `data-rarity` variants using the 6 unused `--rarity-*` tokens. Epic loot should look epic. |
| 2.6 | **Quest-complete distinction** — branch on `status==='completed'` in tagParser.js:84-86: "QUEST COMPLETE", gold, one-shot `warcraft-glow` (unused keyframe). |
| 2.7 | **Combat as a place** — 600ms entry ramp (vignette ease-in, banner unfurl, chat dust turns ember-red via mood class, send ⚔ pulses crimson), 1.5s victory exhale instead of the current snap-off. |
| 2.8 | **De-bounce the typing indicator** — three embers fading in sequence (no translateY bounce, against mandate); copy: "The Dungeon Master weaves fate…". |
| 2.9 | **Death state.** HP ≤ 0 → full-screen "You have fallen" overlay (accept death → archive/epilogue flow, or divine-intervention continuation). Games are punctuation: the fanfare (1.1) and the funeral. |
| 2.10 | **Per-word stream pacing** — buffer SSE deltas, release ~30-60ms/word, slow at sentence ends (one function at chatService setStreamText). Narration, not network bursts. |

## Tier 3 — Theme fit-and-finish (M)

- **Replace every emoji with engraved glyphs** — ⚔️🛡️⚙️🧙🚪📜 across hub/session undercut the theme the landing page sets. GameIcons.jsx exists; extend to a 16-icon single-gold-stroke set.
- **Kill the blue buttons** — Test Connection, NPC pill, Journal recap buttons, key-modal CTA → gold fill primary / gold outline secondary.
- **Empty states for Inventory/Quests/NPCs/Combat/Map** — centered glyph + in-world line ("Your pack is empty. Loot awaits.") instead of blank voids.
- **Hub campaigns empty state** — large gold "Begin Your First Adventure" inside the empty state.
- **Character panel palette** — magenta/pink resource bars → theme-constrained (HP crimson, XP gold, mana desaturated frost, sanity violet-grey).
- **Hero art loading** — obsidian-gold gradient fallback + fade-in (first paint is black for seconds).
- **Naming** — pick ONE name for the hub ("Command Center" is referenced in copy but labeled nowhere).

## Tier 4 — Structural game features (M/L)

- **Multiplayer's last wire** — pass `multiplayer` + `campaignId` from GameSessionPage → App → ChatPanel when `campaign.is_multiplayer`; route sends through `sendPlayerAction`. Server rooms, lobby, relay UI all exist and are prop-gated off. *The* genre differentiator.
- **Mechanically real combat** — `[COMBAT_START enemies="Wolf:8/8"]` parsing → populate the already-built initiative list/HP bars/log; add `[ENEMY_HP]` + `[COMBAT_LOG]` tags.
- **Class/archetype picker** — 6 archetype cards in the wizard (players expect one mechanical choice).
- **Onboarding chips** — 3-4 suggested actions under the empty chat ("Look around", "Ask about rumors"), one-time 4-step panel tour.
- **Portrait fallback** — preset-portrait picker when no xAI key (full gen pipeline exists behind a double key-gate).
- **Retention meta** — "Chronicle" achievements strip from data already tracked; idle-campaign email ("Day 12 in Valdris. The DM is waiting.").
- **Sound slots** (deferred by earlier decision): dice landing, level-up, combat start — the top 3 when audio gets green-lit.

## Known dead pathways (fix or cut)

- **Gold and sanity can never change** — no tag exists to update them (UPDATE_VITALS supports both). Add `[GOLD_CHANGE]` / wire sanity into an existing tag, or stop rendering the bars.
- Quest fields `giver/deadline/consequence/milestones` rendered but never parsed.
- Equipment `slot` rendered but never set; weight always 0.
- `NEXT_TURN` reducer dispatched by nothing.
- `sound.js` imported but shadowed by a local duplicate (NotificationOverlay.jsx:3).
- Playtest gaps to close next round: Stories page, mobile pass (390×844), console sweep, fake-key validation.

## Scorecard summary (live playtest, desktop)

Landing A-/A • Auth A- • Hub C+ (SaaS-with-emoji) • Campaign creation **F**
(no wizard fires) • Session shell B-/C (impressive, empty, key dead-end) •
Panels: Character B+, Codex/Journal B, Inventory/Quests/NPCs/Combat/Map D+
(structural shells, blank voids) • Game-feel overall: **zero celebrated moments**.
