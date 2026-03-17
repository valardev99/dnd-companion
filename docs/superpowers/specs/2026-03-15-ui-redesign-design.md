# Wonderlore AI — UI Redesign Spec

**Date:** 2026-03-15
**Status:** Draft
**Scope:** Unified layout redesign for single-player and multiplayer, desktop and mobile

---

## 1. Problem

The current single-player app uses a 3-column desktop layout (Chat | 48px Icon Sidebar | Companion) that feels cluttered compared to the cleaner chat-first design developed for the multiplayer mockup. The multiplayer mockup's message styling, status bar, and channel tabs are more readable and immersive. The goal is to unify both modes under one design language that works across all screen sizes.

## 2. Design Principles

1. **One design language** — Single-player, multiplayer, desktop, and mobile share the same layout structure, message styling, and components. The only differences are structural (channel count, player presence dots).
2. **Chat-first with accessible panels** — Chat is the primary view. Companion panels are always reachable but don't dominate the screen.
3. **Not a 5e replicator** — Ability scores, spells, inventory are generic containers. The AI DM defines what exists.

## 3. Desktop Layout (≥1200px)

**Breaking change:** The current desktop breakpoint is 1024px (in `responsive.css`). This spec raises it to 1200px to give the companion panel enough width to be useful. Screens between 1024–1199px will now use tablet layout (companion as overlay) instead of the old side-by-side.

### 3.1 Grid Structure

```
Nav Rail (40px) | Chat | Icon Sidebar (48px) | Companion Panel
```

`grid-template-columns: 40px 1fr 48px minmax(280px, 35%)`

Companion panel is **open by default** on desktop.

### 3.2 Nav Rail (40px)

Left edge of the screen. Contains:
- **App logo** (top) — Wonderlore "W" mark
- **Campaign list** — One icon per campaign, showing first letter. Active campaign highlighted with gold border. Clicking switches campaigns.
- **Bottom actions** — New campaign (+), Settings gear
- **Scrolling:** If campaigns exceed visible space, the campaign list scrolls vertically. Max ~8 visible before scroll.
- **Empty state (no campaigns):** Shows only the "+" button to create first campaign.
- **Multiplayer behavior:** Switching campaigns while in a multiplayer session triggers a confirmation dialog ("Leave current session?") before disconnecting.

The nav rail provides campaign switching without leaving the current view.

### 3.3 Chat Area (flex: 1)

Top to bottom:
1. **Top bar** — Campaign title (Cinzel, `var(--gold)`), session number, player presence dot(s) on the right
2. **Status bar** — Character name, level, HP bar (visual + numeric), AC. Always visible. Clickable — opens the Character panel in the companion (equivalent to clicking the Character icon in the sidebar).
3. **Channel tabs** — Single-player: Story + Whisper. Multiplayer: Story + OOC + Whisper. Active tab has gold underline. Inactive tabs show unread dot indicator when new messages arrive. Switching tabs preserves scroll position per tab.
4. **Message feed** — Scrollable, auto-scroll on new messages. Hybrid message styling (see Section 6).
5. **Input bar** — Rounded input field with placeholder text ("What does [Character] do..."). Same input for all modes including combat.

### 3.4 Icon Sidebar (48px)

Between chat and companion. Vertical stack of panel icons using existing `GameIcons` SVG components (not emoji — emoji shown below are shorthand references only):

| Panel | Icon ref | Current `panels.js` id |
|-------|----------|----------------------|
| Dashboard | 🏠 | `dashboard` |
| Character | 👤 | `character` |
| Inventory | 🎒 | `inventory` |
| Quests | 📜 | `quests` |
| NPCs | 👥 | `npcs` |
| Combat | ⚔ | `combat` |
| Map | 🗺 | `map` |
| Lore Codex | 📖 | `codex` |
| Journal | 📓 | `journal` |
| Settings | ⚙ | `settings` |

This matches the existing `panels.js` definitions exactly. No panels are added or removed.

- Active panel has gold right-border indicator
- Clicking an icon swaps the companion panel content
- This is the existing sidebar, repositioned in the new grid

### 3.5 Companion Panel

Right side. Shows the content for whichever panel icon is selected. Header shows panel name (Cinzel, `var(--gold)`) and close button (✕). Closing hides the companion and the icon sidebar toggles it back open.

Panel contents are unchanged from current implementation (CharacterPanel, InventoryPanel, QuestPanel, etc.).

## 4. Tablet Layout (768px–1199px)

Same grid as desktop **minus the companion panel**:

```
Nav Rail (40px) | Chat | Icon Sidebar (48px)
```

- Companion is hidden by default
- Clicking an icon sidebar item opens the companion as a **right-side overlay** (slides in over the chat, does not push it)
- Overlay width: `min(380px, 85vw)` — similar to current `--context-width: 340px` but slightly wider
- Overlay uses `z-index: var(--z-context)` (80), below modals and notifications
- Backdrop: semi-transparent `rgba(0,0,0,0.5)`, clicking it dismisses the overlay
- Close button or clicking backdrop dismisses overlay
- Transition: `transform 0.3s ease` (matching existing transition patterns)
- Escape key also dismisses the overlay
- Nav rail remains visible

## 5. Mobile Layout (<768px)

### 5.1 Chat View (default)

Full-screen vertical stack, top to bottom:
1. **Horizontal icon bar** — The icon sidebar rotates to a horizontal scrollable strip at the top. Same icons, same `GameIcons` SVGs, same active indicator (gold bottom-border instead of right-border). Tapping an icon opens the panel full-screen. A subtle fade gradient at the right edge indicates more icons are scrollable.
2. **Top bar** — Campaign title + player dot(s)
3. **Status bar** — Compact: character name, HP bar, HP numbers, AC
4. **Channel tabs** — Same as desktop
5. **Message feed** — Same hybrid styling
6. **Input bar** — Same rounded input

Nav rail is hidden on mobile. Campaign switching moves to a menu accessible from the top bar.

### 5.2 Panel View (full-screen takeover)

When a panel icon is tapped:
- Panel content takes over the full screen below the icon bar
- Panel header shows back arrow (←) and panel name, plus close button (✕)
- Back arrow and ✕ both return to chat view
- Icon bar remains at top so user can switch between panels without returning to chat first

### 5.3 Combat (all screen sizes)

Combat behavior is identical on desktop, tablet, and mobile. No UI changes during combat except:
- **Combat banner** appears between the status bar and channel tabs (on all screen sizes)
- Banner shows "⚔ COMBAT" label and enemy names/count
- Banner background: linear gradient with `var(--crimson)` at low opacity
- Enemy HP bars appear as system messages inline in the chat (fog of war — no exact numbers, visual bars + status labels like Wounded, Critical)
- Input bar stays the same — no combat-specific input UI

## 6. New CSS Variables

The following variables must be added to `variables.css` for the message styling system. All message styling should reference these variables, not raw color values.

```css
/* Message styling — DM narration */
--msg-dm-border: var(--gold-dim);           /* left border color */
--msg-dm-bg: rgba(42, 38, 28, 0.6);        /* approximates --stone with alpha */
--msg-dm-text: var(--parchment);            /* body text */

/* Message styling — Player action */
--msg-player-bg-start: rgba(42, 38, 28, 0.95);
--msg-player-bg-end: rgba(30, 25, 15, 0.95);
--msg-player-border: var(--gold-dim);       /* frame border */
--msg-player-text: var(--gold-bright);      /* body text */

/* Message styling — Other player (multiplayer) */
--msg-other-purple: #7b6bc4;               /* new: arcane purple for other players */
--msg-other-purple-light: #b8aee0;         /* new: lighter purple for text */
--msg-other-bg: rgba(123, 107, 196, 0.08);

/* Message styling — System */
--msg-system-bg: rgba(201, 168, 76, 0.05);
--msg-system-border: var(--stone-light);
--msg-system-text: var(--muted);

/* Message styling — Enemy HP (combat) */
--msg-enemy-bg: rgba(139, 42, 26, 0.1);
--msg-enemy-border: rgba(139, 42, 26, 0.3);

/* Channel colors */
--channel-ooc: #5a8ab5;                    /* new: OOC blue */
```

### 6.1 DM Narration
- **Style:** Left-border (3px, `var(--msg-dm-border)`)
- **Background:** `var(--msg-dm-bg)`
- **Header:** "DUNGEON MASTER" — Cinzel, `var(--gold)`, small caps, letter-spacing
- **Body:** Crimson Text, italic, `var(--msg-dm-text)`
- **Radius:** `0 4px 4px 0` (flat left edge where border is)

### 6.2 Player Action (your character)
- **Style:** Framed bubble with WoW-style border
- **Background:** Linear gradient `var(--msg-player-bg-start)` to `var(--msg-player-bg-end)`
- **Border:** 2px solid `var(--msg-player-border)`, 6px border-radius
- **Header:** Character name — Cinzel, `var(--gold)`
- **Body:** Crimson Text, `var(--msg-player-text)`
- **Indent:** `margin-left: 24px` (desktop), `16px` (mobile)

### 6.3 Other Player Action (multiplayer only)
- **Style:** Left-border (3px, `var(--msg-other-purple)`)
- **Background:** `var(--msg-other-bg)`
- **Header:** Character name — Cinzel, `var(--msg-other-purple)`
- **Body:** Crimson Text, `var(--msg-other-purple-light)`

### 6.4 System Messages (dice rolls, HP changes)
- **Style:** Centered, minimal
- **Background:** `var(--msg-system-bg)`
- **Border:** 1px solid `var(--msg-system-border)`
- **Font:** Fira Code monospace
- **Color:** `var(--msg-system-text)` with `var(--gold)` highlights for values

### 6.5 Enemy HP (combat only)
- **Style:** Inline system message with red tint
- **Background:** `var(--msg-enemy-bg)`
- **Border:** 1px solid `var(--msg-enemy-border)`
- **Contains:** Enemy name, status label (Wounded/Critical/etc.), visual HP bar
- **No exact HP numbers** — fog of war

## 7. Single-Player vs. Multiplayer Differences

The layout grid, message styling, status bar, icon sidebar, companion panels, and input bar are **identical**. The only differences:

| Element | Single Player | Multiplayer |
|---------|--------------|-------------|
| Channel tabs | Story + Whisper | Story + OOC + Whisper |
| Player dots (top bar) | 1 (you) | 2+ with green presence indicators |
| Other-player messages | N/A | Purple left-border style |
| Typing indicator | N/A | "[Name] is typing..." above input |
| Combat banner | Shows enemy info | Same |

## 8. Responsive Breakpoints Summary

| Breakpoint | Nav Rail | Chat | Icon Sidebar | Companion | Icon Bar |
|-----------|----------|------|-------------|-----------|----------|
| ≥1200px (desktop) | Visible (40px) | Flex | Visible (48px) | Open by default | N/A |
| 768–1199px (tablet) | Visible (40px) | Flex | Visible (48px) | Hidden, overlay on icon click | N/A |
| <768px (mobile) | Hidden | Full screen | Hidden | Full-screen takeover on tap | Horizontal top bar |

**Note:** The current codebase uses 1024px as the tablet breakpoint. This spec changes it to 1200px. All existing `@media` rules targeting 1024px in `responsive.css` will be rewritten for the new breakpoints.

## 9. Components Affected

### 9.1 New or Heavily Modified
- **AppLayout** — New grid structure with nav rail
- **NavRail** — New component for campaign switching
- **StatusBar** — New component (character name, HP, AC strip)
- **ChannelTabs** — New component (Story/OOC/Whisper tabs with unread indicators)
- **MessageBubble** — Restyle to hybrid format (left-border for DM, framed for player, etc.)
- **CombatBanner** — New component (red banner with enemy info, appears on all screen sizes)
- **responsive.css** — Full rewrite of breakpoints for new layout behavior (replaces all `.two-screen-layout` rules)
- **variables.css** — Add message styling variables (Section 6)

### 9.2 Repositioned (minimal changes)
- **Sidebar** — Moves from position 2 to position 3 in grid (between chat and companion). On mobile, renders as horizontal icon bar instead. Continues using `GameIcons` SVG components.
- **Companion panels** — Content unchanged, wrapper updated for new grid position
- **ChatPanel** — Remains the central component, gains StatusBar and ChannelTabs above it

### 9.3 Removed
- **Current 3-column layout** (`two-screen-layout` grid and all CSS rules targeting it) — Replaced by new 4-column grid
- **Bottom nav bar (mobile)** — Replaced by horizontal icon bar at top

## 10. What Does NOT Change

- Companion panel content (DashboardPanel, CharacterPanel, InventoryPanel, QuestPanel, MapPanel, CodexPanel, NPCPanel, CombatPanel, JournalPanel, SettingsPanel)
- Chat input behavior and submission logic
- SSE streaming and message rendering pipeline
- Socket.IO multiplayer infrastructure
- Backend API and data models
- Theme colors, fonts, and design system CSS variables (only additions, no modifications)
- Footer bar (remains hidden on mobile as it is today, visible on desktop/tablet)

## 11. Visual Mockups

Mockups are preserved in `.superpowers/brainstorm/22628-1773632561/`:
- `layout-direction.html` — Initial layout direction comparison (Option B chosen)
- `desktop-hybrid-layout.html` — Desktop layout options (Option C chosen)
- `full-design-desktop.html` — Final desktop mockups (single + multiplayer)
- `full-design-mobile.html` — Final mobile mockups (chat, panel, multiplayer, combat, breakpoints)
