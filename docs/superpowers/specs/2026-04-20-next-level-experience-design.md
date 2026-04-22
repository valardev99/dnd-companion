# Wonderlore AI — Next-Level Experience Design

**Status:** Draft vision • **Date:** 2026-04-20 • **Scope:** App-wide

This document turns the "next level" ambition into specific, buildable moves
across six surfaces. It assumes the premium-UI-redesign spec (2026-03-17) has
shipped; everything here stacks on top. Priorities are marked P0/P1/P2.
Sizes: S = ≤½ day, M = 1–3 days, L = 1+ week.

---

## 0. The thesis

The app today has a beautiful shell and a working DM. Two things block the
"million-dollar feel":

1. **Cold start is hostile.** A new player lands on an empty chat with a
   blinking cursor and has to invent a world from nothing. Baldur's Gate
   doesn't do that. Hearthstone doesn't do that. Nobody who feels premium
   does that.
2. **The controls are invisible.** Power lives in unlabeled icons, a
   scroll of a panel, and a text box. There's no affordance for *what
   you can do*. Every premium RPG teaches you the verbs in the first 60
   seconds — `/roll`, `/whisper`, `/search`, weapon buttons, spell
   hotbars, context menus.

Everything below serves one of those two goals: **make cold start feel
like opening a box of dice**, and **make every action a button, not a
guess.**

---

## 1. Pre-built starter content ("Open the box")

**Problem:** First campaign today = staring at a text input with no
premise. High drop-off.

**Vision:** First-run offers a **gallery of curated "worlds"** — each
is a 3-scene intro with a preset hero, map pin, and conflict. Players
press *Begin* and the DM narrates them in.

### Starter Worlds (launch with 6)

| World | Tagline | Art direction | Audience |
|-------|---------|---------------|----------|
| **The Sunken Keep** | Drowned ruins, cursed crown, no one returns | Green-blue, kelp, barnacles | Classic dungeon |
| **Ashfall** | The mountain bled gold, then the dead rose | Obsidian, ember, ash rain | Horror |
| **The Velvet Court** | Intrigue in a city of masks | Violet, gilt, candlelight | Political / RP |
| **Hollow Wilds** | The forest eats travelers and sings their names | Bone-white, moss, fungi | Folk horror |
| **Sandseer** | Dune-drowned city, prophecy in glass | Rust, bronze, star-sigils | Exploration |
| **The Broken Wheel** | A kingdom that died, then woke up again | Slate gray, blood, clocks | Mystery |

Each world ships with:
- 1 hero card (portrait + stats + 3 signature moves)
- A 120-word opening narration the DM reads verbatim
- 3 suggested first actions as chips (`Investigate the altar`,
  `Speak to the cloaked figure`, `Draw steel`)
- A hero-image for the `landing` rotation + a map-pin for the `world-bible`
- An optional "second-chair" NPC (companion who travels with you)

### UI pattern: "Starter World Picker"

- Full-bleed card grid, 3×2 on desktop, horizontal snap-scroll on mobile
- Each card: hero image with parallax, title in Cinzel, tagline in
  Crimson Text italic, a *Begin →* button on hover
- A 7th tile: **"Forge your own"** — falls through to today's blank wizard
- On card hover: faint music stinger (skippable), rune glow around border
- Accessible: cards are `<button>` with `aria-label="Begin <World> — <tagline>"`

### Where it lives

- **First visit:** this IS the landing CTA (replaces today's "Create Account → empty")
- **Authenticated empty hub:** shown in place of the current empty-state
- **`/hub/new`:** as tab 1 of the wizard (tab 2 is "Forge your own")

### Implementation notes

- Starter worlds stored as JSON in `client/src/data/worlds/*.json` + a
  hero-image each in `/public/worlds/`. Versioned, easy to A/B.
- Server can ship them too — a `/api/worlds/starters` endpoint so
  mobile app later sees the same list.
- **Do NOT bake them into `world_bible` strings.** Keep a `starter_id`
  on the campaign so recaps/stories can link back to the world.

**Effort:** M for the framework + 1 starter world; S for each
additional world (mostly writing + sourcing art).

**Priority:** **P0** — highest single-bet lift on activation.

---

## 2. Main menu / Hub

**Problem:** The hub today is "a list of campaigns." That's a file
manager. Premium RPGs open on **a destination**: the tavern, the war
table, the mission select. Something you *want* to be in.

**Vision:** "**The Wayfarer's Hall**" — a room, not a list.

### Layout

```
╔════════════════════════════════════════════════════╗
║  Header: username • HP of streak • gold of coins   ║
╠══════════════════╦═══════════════╦═════════════════╣
║  Hall Banner     ║  Your Hero    ║  Notifications  ║
║  (hero image of  ║  Portrait     ║  • Friend req   ║
║  last world)     ║  Name / Level ║  • Campaign inv ║
║                  ║  3 stats      ║                 ║
╠══════════════════╩═══════════════╩═════════════════╣
║   CONTINUE YOUR JOURNEY                            ║
║   [Active campaign card — full width, resume btn]  ║
╠════════════════════════════════════════════════════╣
║   BEGIN A NEW LEGEND                               ║
║   [Starter world grid — 3 visible, scroll for more]║
╠════════════════════════════════════════════════════╣
║   YOUR CAMPAIGNS     • YOUR PARTY    • YOUR STORIES║
║   [tabs of horizontal cards]                       ║
╚════════════════════════════════════════════════════╝
```

### Key moves

- **"Continue your journey" hero row** — last-played campaign gets a
  fat, animated card. Art is the campaign's world image. CTA: *Resume*.
  If it's been >14 days: a subtitle ("It's been a fortnight. The
  Sunken Keep remembers.") that uses the last session summary.
- **Hero portrait header** — your main character's face, level, class,
  and 3 signature stats (HP, gold, renown). Click → character sheet.
  Makes the hub feel like YOU have a stake, not just files.
- **Party tab** — friends + recently-played-with players, avatars in a
  row, "Invite to campaign" quick action. We already have Friendship
  models; this surfaces them.
- **Stories tab** — completed campaigns rendered as *book spines* on a
  shelf. Click one → the recap page. Tapping into the existing
  `ArchivedCampaign` table.
- **Command Palette (⌘K)** — global. Search campaigns, stories, friends,
  and commands (`Create campaign`, `Roll d20`, `Open settings`,
  `Jump to codex`). See §4.

### Visual treatment

- Hub background = parchment-over-wood, NOT the chat's obsidian black.
  This is a different *room*. You walk out of it to play.
- Cards use the "Medium Glass + Inner Glow" language from the premium
  redesign so visual continuity is preserved.
- Idle animations: candle flickers on the banner, a raven crosses the
  top every ~2 min, dust motes. ALL disabled under `prefers-reduced-motion`.

**Effort:** M for layout + Continue-hero card; M more for Party/Stories
tabs; S for Command Palette scaffolding.

**Priority:** **P0** for the continue-hero + starter-world rail.
**P1** for Party/Stories tabs. **P1** for command palette.

---

## 3. Easier login system

**Problem:** Registration today = email + username + password + email
verification + "check spam." That's 5 gates. Industry benchmark for
gaming apps: **one tap.**

**Vision:** A 3-way door. Players can start with whichever is
fastest, and we up-convert later.

### The three doors

1. **"Play as Guest"** (default, front-and-centre)
   - Zero friction. Generates a local character with a random
     adventurer name (`Sunwarden Iris`, `Kael the Unbound`).
     Campaign saved to localStorage.
   - After 3 sessions OR when they try a premium action
     (save to cloud, multiplayer, story share), we surface:
     "Save your legend — create a free account in 10 seconds."
     One-field email-only signup, magic-link verification → done.
2. **"Continue with Discord"** (OAuth, prominent)
   - D&D audience overlap with Discord is ~everything. OAuth = 1 click.
   - Maps Discord username → our `username`; avatar URL flows in free.
   - We already have the Discord icon + "Coming soon" in AuthModal.
     Time to ship it.
3. **"Email login"** (the existing flow, kept, not dominant)
   - For players who don't want Discord.
   - Switch to **magic link** as the default (passwordless). Password
     becomes a fallback for accounts that want it.

### Proposed AuthModal redesign (wireframe)

```
┌──── Welcome to Wonderlore AI ─────┐
│                                   │
│  ┌─────────────────────────────┐  │
│  │   🎲  Play as Guest         │  │   ← primary, pulsing
│  │   Start in 2 seconds        │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │    [D] Continue with Discord │  │
│  └─────────────────────────────┘  │
│                                   │
│   — or email —                    │
│                                   │
│  [ email address            ]     │
│  [    Send magic link       ]     │
│                                   │
│  Already have an account? Sign in │
└───────────────────────────────────┘
```

### Implementation moves

- **Guest mode:** already 80% there — the app works without auth
  today for local-only campaigns. Formalise a `guest_id` cookie +
  "claim this account" conversion flow.
- **Magic links:** Resend already wired. Add a new `/auth/magic-link`
  route that emails a one-time JWT. Click → direct login, no password.
- **Discord OAuth:** use FastAPI's `Authlib` integration. `redirect_uri`
  back to `/auth/discord/callback`. ~300 lines of code.
- **Passkey (WebAuthn)** — later. Cool, but Discord covers 80% of
  the audience for 10% of the effort.

### Accessibility

- Escape closes modal (already done)
- Focus starts on Play-as-Guest (the primary action)
- Screen reader announces "Welcome to Wonderlore AI. Three ways to
  start…"

**Effort:** M for Guest mode conversion; M for magic link; M for
Discord OAuth. Total ~1 week.

**Priority:** **P0** Guest mode + magic link (activation + retention
double-lift). **P1** Discord OAuth (loveable but not blocking).

---

## 4. Better controls (Command Chip Rail + Palette)

**Problem:** Today you play by typing prose. That works. It does not
*feel like a game*. Every premium RPG surfaces your verbs.

### 4a. Command Chip Rail (in-session)

Above the chat input, a horizontal scroll of contextual verb chips:

```
╭──────────────────────────────────────────────────────────╮
│  /roll ▾   🗡 Attack   👁 Search   🗣 Persuade   📜 Cast  │
│  /whisper  ⚡ Shortrest  🎒 Inventory  🗺 Map   /help     │
╰──────────────────────────────────────────────────────────╯
│  > Type your action...                          [Enter]  │
╰──────────────────────────────────────────────────────────╯
```

- Chips are context-aware: in combat, `Attack / Defend / Use Item`
  surface first. In peace, `Search / Speak / Look`. The DM's response
  tags (`<combat>`, `<dialogue>`) drive this.
- Tapping a chip inserts prose **and** auto-fires, so beginners get
  instant feedback. Power users type.
- `/roll ▾` opens a dropdown with d4/d6/d8/d10/d12/d20/d100 + a
  custom `<n>d<s>+<mod>` field. Result chat-bubbles with a shaped card.
- Accessible: chips are `<button>`, arrow-keys navigate, Enter fires.
  Rail has `role="toolbar"` + `aria-label="Quick actions"`.

### 4b. Command Palette (⌘K / Ctrl+K) — global

The power-user front door. Every major app (Linear, VS Code, Arc,
Raycast) has one. Ours covers:

- Navigation: *Go to Hub, Open Character Sheet, Open Settings*
- Creation: *New campaign, Roll d20, Log a bug*
- Search: *Find campaign "Sunken", Find NPC "Mara", Find story "…"*
- AI: *Re-ask the DM last turn, Summarize this session, Draw my character*

`onKeyDown` globally, fuzzy matcher via `fuse.js` (8KB gz). Live on
every route including the landing page.

### 4c. Keyboard shortcuts (documented)

Publish a `/help` overlay — pressing `?` anywhere opens it. Covers:

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Command palette |
| `⌘/` | Toggle keyboard help |
| `Alt+1…9` | Switch sidebar panel (1=Character, 2=Inventory, …) |
| `R` | Roll d20 |
| `Esc` | Close overlay / modal |
| `/` | Focus chat input |

**Effort:** S for keyboard help overlay; M for Command Chip Rail
(context-awareness is the tricky part); M for Command Palette.

**Priority:** **P0** Command Chip Rail (biggest "feels like a game"
lift). **P1** Command Palette + keyboard shortcuts.

---

## 5. Photo generation (AI image in-line)

**Problem:** The DM describes "a crumbling gate flanked by two
moss-eaten statues" and you see… text. Premium DMs hand you a
map, a token, a portrait. We can do better than a human DM here —
the machine already *wrote* the description, it can render it.

**Vision:** The DM emits three kinds of images, inline:

### 5a. Hero portraits (one-time, on character creation)

At character forge, the wizard calls `/api/images/portrait` with
`{ race, class, description }`. Renders a 512×768 shoulders-up
portrait in the dark-fantasy house style (prompt template
includes `"painterly, oil painting, warcraft concept art,
dramatic rim light"`).

- Shown in the character panel, the hub banner, and the chat avatar
- Cached to `users.avatar_url` on the server (Cloudflare R2 or S3)
- Regenerate button (3 free, then premium)

### 5b. Scene cards (mid-session, tagged by DM)

When the DM emits `<scene>` or `<location>` tags, we insert an
image prompt synchronously after the chunk streams:

```
DM: "You crest the ridge and the Sunken Keep looms below — …"
     ↳ [scene image renders below DM message, 600×340 landscape]
```

- Debounced: at most 1 scene per minute of play (otherwise cost explodes)
- Optional per-campaign (some players want prose-only)
- Style-locked to the campaign's starter world (§1) for coherence

### 5c. Loot / token cards (short prompts, fast)

When DM tags `<item>` or `<creature>`, a small 256×256 card
renders inline. Rarity-coloured border per `variables.css`
(`--rarity-*`). Cheaper model, shorter prompt.

### Technical

- **Model:** FLUX.1 schnell or SDXL-Turbo via Together.ai or
  Replicate. $0.003–$0.01 per image.
- **Caching:** hash(prompt + style) → R2 key. Identical prompts
  never re-render.
- **Rate limit:** 10 scene images / 50 loot images per session free;
  unlimited on premium. Enforced in `server/app/services/image_gen.py`
  (which already exists — needs implementation).
- **Moderation:** run `OpenAI moderations` on prompts before image
  generation to avoid NSFW / slurs.
- **Accessibility:** every image has an `alt` derived from the
  DM's narration snippet. Users on low-bandwidth or
  prefers-reduced-data can disable in settings.

**Effort:** M for portraits; L for scene cards (the trigger logic +
style coherence is fiddly); M for loot cards.

**Priority:** **P1** portraits (highest perceived value per dollar).
**P2** scene cards (visually stunning but expensive). **P2** loot cards.

---

## 6. Side panel (Companion) — from "file tabs" to "living dashboard"

**Problem:** The companion panel today is a switcher between
Character / Inventory / Quests / NPCs / Combat / Map / Codex /
Journal / Settings. That's 9 tabs. Most are read-only.
Cognitive load is high and nothing reacts to the scene.

**Vision:** **"The Adjutant"** — one surface that morphs with
the scene, not nine tabs.

### Default state: *Companion*

A single panel showing the 4 things that matter *right now*:

```
┌── Your Character ──────────────┐
│  [portrait]  Kael the Unbound  │
│  HP ▓▓▓▓▓▓░░░ 34/50            │
│  MP ▓▓▓▓░░░░░ 12/25            │
│  XP ▓▓▓▓▓▓▓░░ 680/1000 → Lv 6  │
└────────────────────────────────┘
┌── On You ──────────────────────┐
│  🗡 Moonwrought Sword   (eqpd) │
│  🛡 Ironwood Buckler    (eqpd) │
│  🧪 Healing Draught × 3        │
│  + 12 more                 [⌄] │
└────────────────────────────────┘
┌── The Scene ───────────────────┐
│  You're in: The Velvet Court   │
│  Present: Mara (friendly)      │
│           Duke Ashlyn (tense)  │
│  Last roll: d20 → 17 ✦         │
└────────────────────────────────┘
┌── Quests ──────────────────────┐
│  ► Find the Crown              │
│    (leads: the drowned chapel) │
└────────────────────────────────┘
```

### Adaptive behaviour

- **In combat** → panel swaps to the existing CombatPanel but wrapped
  in the same card language (HP, initiative order, abilities)
- **In a shop / loot drop** → Inventory panel auto-opens with new
  items highlighted, "Add to pack" chip on each
- **On level-up** → full-panel celebration (already exists) that then
  returns to Companion
- **At rest** → Journal + recap widget surfaces

The tabs still exist as a nav bar at the top of the panel, but the
**default** is a unified view, not one-of-nine.

### Specific improvements to what's there

- **Character panel:** add an "Edit" chip on the portrait that
  regenerates the image (§5a)
- **Inventory:** rarity-coded borders on every item using the
  existing `--rarity-*` tokens. Drag-to-equip, sorted by slot.
  Hover reveals tooltip with flavor + stats.
- **Quest panel:** tree view of objectives, not a flat list.
  Completed objectives strike-through with a golden check.
  Active objective pulses.
- **Map panel:** the empty stub today becomes a scrollable map
  canvas. AI-generated map image (§5) + player-placeable pins
  for locations they've visited. Long-term hook for VTT-lite.
- **Codex:** auto-populates from DM mentions. Every `<npc>` or
  `<location>` tag creates a codex entry. Player can add notes.
  Entries link bidirectionally (Mara → mentions Ashlyn → back to Mara).
- **Journal:** every 10 messages, DM writes a one-sentence
  "scene summary" — these become the journal entries. Player
  can edit. Makes session-recap generation 10× better.

### Mobile adaptation

On mobile, the companion is a **bottom sheet** (swipe up from
below the chat). Default height covers 40% of screen, drag to
60% or 95%. This matches what the competitive review
surfaced as "D&D Beyond's most-copied pattern."

**Effort:** L for the Adjutant morphing view (adaptive logic is
real work); M for auto-codex from tags; M for bottom-sheet mobile;
S for each existing-panel polish item.

**Priority:** **P1** Adjutant default view. **P1** Auto-codex.
**P1** Mobile bottom-sheet. **P2** everything else.

---

## 7. Cross-cutting: the "first 90 seconds"

Every change above should serve one test: **what does a new
player see in their first 90 seconds?** Target journey:

| t+ | What they see |
|----|---------------|
| 0s | Landing hero. Dice roll animation. "Play in 2 seconds" guest CTA |
| 3s | Click guest. See starter world picker (6 cards). Hover reveals parallax art |
| 15s | Click *The Sunken Keep*. Fade to game session |
| 16s | Their pre-generated hero portrait loads (§5a). DM's 120-word opening narrates in |
| 45s | DM's first scene image renders below the narration (§5b) |
| 50s | Command chip rail offers: `Investigate the altar / Speak to the figure / Draw steel` |
| 55s | Player taps a chip. DM responds. Chat is flowing |
| 90s | Player has: a hero with a portrait, an image of where they are, three clear next actions, and zero friction behind them |

Compare to today: 90s in, player has typed "create a wizard" and is
looking at blank text. The above is the lift.

---

## 8. Priority rollup

### P0 — ship in the next 2 weeks

1. **Starter World Picker** + 3 worlds (§1) — activation lift
2. **Guest mode + magic-link login** (§3) — friction kill
3. **Continue-your-journey hero row on hub** (§2) — retention lift
4. **Command Chip Rail in session** (§4a) — feel-like-a-game lift
5. **AI hero portraits on character creation** (§5a) — premium-feel lift

### P1 — ship in the next month

6. Full "Wayfarer's Hall" hub layout (§2)
7. Discord OAuth (§3)
8. Command Palette ⌘K (§4b) + keyboard help overlay
9. Adjutant unified companion view (§6)
10. Auto-codex from DM tags (§6)
11. Mobile bottom-sheet for companion (§6)

### P2 — quarter after

12. Remaining 3 starter worlds
13. Scene + loot AI images (§5b, §5c)
14. Map canvas with pinning (§6)
15. Passkey / WebAuthn
16. VTT-lite

---

## 9. What we are explicitly NOT doing

- **Procedural generation of starter worlds** — writers do it better.
  Pay a writer $200/world for 6 months; ship with hand-crafted ones.
- **A social feed.** This is a game, not a network. Stories are the
  sharing primitive; that's enough.
- **Subscription gating of core play.** Premium = cloud sync, AI
  portraits, priority models. Free tier must remain fully playable.
- **Realistic 3D avatars.** Keep stylized 2D painterly. The art
  direction is Warcraft-concept-art, not Baldur's Gate engine.
- **Voice synthesis of the DM (yet).** Cool, expensive, and can wait.

---

## 10. Success metrics

If these six moves land, we should expect to see:

| Metric | Today (est) | Target |
|--------|-------------|--------|
| Time to first DM response | ~90s (signup → empty chat → type) | ≤15s (guest → starter world → DM narrates) |
| Day-1 retention | ? | 40%+ |
| Day-7 retention | ? | 20%+ |
| Avg session length | ? | 18 min+ |
| Free → paid conversion | ? | 4%+ of WAU |
| Mobile share of sessions | ? | 35%+ |

Instrument all six via the existing `UserTestSession` model.
