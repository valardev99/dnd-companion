# Premium UI Redesign — Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Landing page enhancements + full-app UI polish (desktop + mobile)

## Summary

Elevate Wonderlore AI from "dev-built" to "studio-built" quality across the entire application. Two workstreams:

1. **Landing Page — Cinematic Interactive** (D20 dice roll hero, glassmorphic cards, treasure chest CTA)
2. **Game UI — Premium Polish** (profile frames, header bar, sidebar icons, cards, buttons, micro-interactions)

No changes to core game functionality, routing, or backend logic. This is a pure CSS/JSX visual upgrade.

**Color palette note:** All colors use the WARM brown palette from variables.css (`--obsidian: #0c0a06`, `--void: #141008`, `--deep-stone: #1a1209`, `--stone: #2a2015`). No cool blue-gray tones.

---

## Part 1: Landing Page Enhancements

### 1.1 D20 Dice Roll Hero

**What:** On page load, an animated D20 die rolls across the hero section. The result determines which hero scene appears.

**Implementation:**
- Stylized diamond/gem shape (rotated square with facet lines) that spins via CSS `rotateY` + `rotateX` keyframes (~2s). NOT a true 20-sided icosahedron (impossible in pure CSS). The shape suggests a die without needing WebGL.
- Numbers cycle rapidly on the face during spin, landing on the final value
- After roll completes, fade-reveal the selected hero image + tagline
- 5 scenes mapped to existing `HERO_IMAGES` array:
  - Roll 1-4: Image 0 — "Danger lurks in every shadow"
  - Roll 5-8: Image 1 — "Ancient powers stir"
  - Roll 9-12: Image 2 — "Empires rise and fall"
  - Roll 13-16: Image 3 — "Legends are forged in fire"
  - Roll 17-20: Image 4 — "The realm awaits its champion"
- **Nat 20 special:** Golden particle burst via the existing `LandingParticles` canvas (increase count + brightness for 2s), brighter gold tint on the scene
- Each scene gets a subtle color tint via CSS filter (hue-rotate) to feel distinct
- Roll result displayed briefly as floating text ("You rolled a 14!") with fade-out
- `sessionStorage` flag to only animate on first visit per session (subsequent visits show random static hero)
- **Reduced motion:** Under `prefers-reduced-motion: reduce`, skip animation entirely — show static hero with random scene selection

**Files modified:**
- `client/src/pages/LandingPage.jsx` — Add DiceRoll component, scene selection logic
- `client/src/styles/landing.css` — Dice animation keyframes, scene-specific tints

### 1.2 Glassmorphic Cards (Medium Glass + Inner Glow)

**What:** Replace flat dark cards with frosted glass panels on landing page and hub.

**CSS properties (warm palette):**
```css
background: rgba(20, 16, 8, 0.4);
backdrop-filter: blur(20px) saturate(1.2);
-webkit-backdrop-filter: blur(20px) saturate(1.2);
border: 1px solid rgba(201, 168, 76, 0.2);
box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
```

**Hover state:**
```css
background: rgba(20, 16, 8, 0.5);
box-shadow: 0 12px 40px rgba(0,0,0,0.4), inset 0 0 40px rgba(201,168,76,0.08);
border-color: rgba(201, 168, 76, 0.4);
```

**Visual effects (via CSS background layers, NOT pseudo-elements to avoid conflicts):**
- Warm gold radial gradient glow: `background-image: radial-gradient(circle at 30% 20%, rgba(201,168,76,0.06), transparent 50%)`
- Top edge gold gradient: via `border-image` or `background` layering

**Fallback for older browsers / mobile perf:**
```css
@supports not (backdrop-filter: blur(1px)) {
  background: rgba(20, 16, 8, 0.85); /* solid fallback */
}
@media (hover: none) {
  backdrop-filter: blur(8px); /* reduced blur on touch devices */
}
```

**Applied to:**
- Landing page: Feature pillars (`.landing-pillar`), story cards (`.story-card`)
- Hub: Campaign cards, settings cards
- NOT applied to: Game session companion panels (keep solid for readability)

**Files modified:**
- `client/src/styles/landing.css` — Pillar and story card restyling
- `client/src/styles/hub.css` — Campaign card and settings card restyling

### 1.3 Treasure Chest CTA

**What:** Replaces the existing `.landing-cta-footer` section. The CTA animates as a treasure chest opening when it scrolls into view.

**Implementation:**
- Intersection Observer triggers animation at 50% visibility
- Chest is built with CSS (two divs: `.chest-lid` + `.chest-base`)
  - Lid rotates open via `transform: rotateX(-110deg)` with transform-origin at top edge
  - Golden glow radiates outward from inside (box-shadow + radial gradient expanding)
  - Light rays via multiple `background` gradient layers on the chest container (not pseudo-elements)
- CTA button fades in after chest opens (0.5s delay)
- Button text: "CLAIM YOUR DESTINY"
- Existing `LandingParticles` canvas intensifies during this section (more particles, brighter)
- `sessionStorage` flag prevents re-animation on same-session return visits (chest shown open)
- **Reduced motion:** Chest shown already open, no animation

**Files modified:**
- `client/src/pages/LandingPage.jsx` — TreasureChestCTA component replaces existing CTA footer
- `client/src/styles/landing.css` — Chest animation keyframes, light rays

---

## Part 2: Game UI Premium Polish

### 2.1 Profile Avatar Frame

**Current:** Plain circle with flat border.

**Premium:**
- Double-ring frame: inner gold border + outer dark gap + outer gold glow ring
- `box-shadow: 0 0 0 3px var(--obsidian), 0 0 0 5px rgba(201,168,76,0.3), 0 0 12px rgba(201,168,76,0.15)`
- Inner radial glow: `inset 0 0 8px rgba(201,168,76,0.1)`
- Gold Cinzel initial letter instead of plain text
- Background: `linear-gradient(135deg, var(--deep-stone), var(--stone))`

**Files modified:**
- `client/src/components/layout/Header.jsx` — Avatar markup
- `client/src/styles/header.css` — Avatar frame styles

### 2.2 Header Bar Enhancement

**Current:** Flat dark background, plain text stats, thin border.

**Premium:**
- Gradient background: `linear-gradient(180deg, rgba(26,32,21,0.98), rgba(20,16,8,0.95))`
- Bottom gold gradient line via existing `::after` pseudo-element (already in header.css)
- Subtle texture overlay via `background-image` layer (inline SVG data URI, NOT pseudo-element)
- Campaign title in Cinzel with gold text-shadow: `0 0 12px rgba(201,168,76,0.2)`
- Stats with small inline SVG icons (NOT emoji — emoji renders inconsistently across platforms and breaks the medieval aesthetic)
  - HP: Small SVG heart in crimson
  - Level: Small SVG star in gold
  - Gold: Small SVG coin in gold
- Stat values highlighted in `var(--gold)`, labels in `var(--muted)`
- Stats in `Fira Code` monospace

**Files modified:**
- `client/src/components/layout/Header.jsx` — Stat display markup with SVG icons
- `client/src/styles/header.css` — Header background, typography, texture

### 2.3 Sidebar Icons — Hexagonal

**Current:** Square buttons with rounded corners, flat borders.

**Premium:**
- Button element stays RECTANGULAR (preserves full touch/click target area)
- Inner visual element gets hexagonal shape via `clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)`
- Gradient background: `linear-gradient(135deg, var(--deep-stone), var(--void))`
- Active state: Gold border glow + inner gold gradient tint via box-shadow
- Hover: Radial gold glow + slight background lighten
- Transition: 0.25s ease for all properties
- Size: 40px visual hex inside 44px+ clickable button (meets WCAG 2.5.5)

**Files modified:**
- `client/src/styles/layout.css` — Sidebar icon restyling (sidebar.css is empty, styles live in layout.css)

### 2.4 Content Cards — Solid Premium (Game Session)

**Note:** Game session cards stay SOLID for readability. Premium polish treatment:

- Top gold gradient line via `border-top` or `background` layer
- Warm radial glow on hover via `background-image` layer
- Headings: Cinzel with `letter-spacing: 1px`
- Body text: Crimson Text with `line-height: 1.6`
- Hover (desktop only): `translateY(-2px)`, gold border, subtle box-shadow
- Transition: 0.3s ease
- Background: `linear-gradient(135deg, rgba(26,18,9,0.95), rgba(20,16,8,0.95))`

**Files modified:**
- `client/src/styles/panels.css` — Companion panel card styling

### 2.5 Buttons — Premium Treatment

**All buttons across the app get:**
- Primary: Gold gradient (3-stop: `var(--gold-bright)` → `var(--gold)` → `var(--gold-dim)`), gold border, inner highlight/shadow
- Cinzel font, uppercase, letter-spacing: 2px
- `box-shadow: 0 2px 8px rgba(201,168,76,0.2), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)`
- Hover (desktop only): translateY(-1px), enhanced glow, brighter gradient
- Active: translateY(0), reduced shadow (press feel)
- Secondary: Transparent bg, gold border at 0.4 opacity, gold text
- Secondary hover: Semi-transparent gold fill

**Files modified:**
- New `client/src/styles/premium.css` — Shared button system + utility classes
  - Import order: after `variables.css`, before component CSS files

### 2.6 Micro-Interactions

**Selective application (NOT every element — avoid jitter in compact UI):**

**Gets hover lift (translateY -2px):**
- Landing page cards (pillars, stories)
- Hub campaign cards
- CTA buttons (primary + secondary)

**Gets gold focus glow only (no lift):**
- Sidebar icon buttons
- Header elements
- Tab bar items
- Chat input
- Modal buttons
- Game session panel cards

**All interactive elements get:**
- `transition: 0.2-0.3s ease` on animated properties
- Gold glow on focus: `box-shadow: 0 0 0 2px rgba(201,168,76,0.3)`

**Touch device handling:**
- Existing `responsive.css` `@media (hover: none)` rules preserved
- Hover lifts disabled on touch devices (existing behavior)

### 2.7 Texture Overlay System

**Subtle background texture via `background-image` layers (NOT pseudo-elements to avoid conflicts):**

Inline SVG data URI pattern:
```css
background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='0.3' opacity='0.03'/%3E%3C/svg%3E");
```

Applied to:
- Header background
- Sidebar background
- Modal overlay backgrounds
- Landing page section backgrounds

Mobile: Reduced to `opacity: 0.01` via reduced background-image opacity or removal.

---

## Part 3: Mobile Adaptations

All premium treatments adapt to mobile:
- Hexagonal icons: 36px visual hex inside 44px+ clickable button
- Glass cards: `backdrop-filter: blur(8px)` (reduced from 20px for GPU performance)
- Profile frame: Proportionally scaled, maintains double-ring effect
- Touch targets: ≥44px on all interactive elements (hex is visual only, not clip on button)
- Texture overlays: Removed on mobile (`background-image: none` in `@media (hover: none)`)
- Dice roll: Simplified 2D rotation (rotateZ only) on mobile for performance
- Hover lifts: Disabled on touch devices (preserve existing responsive.css behavior)

**Accessibility:**
- `@media (prefers-reduced-motion: reduce)`:
  - Dice roll: Skip animation, show static random hero
  - Treasure chest: Show open state immediately, no animation
  - Hover lifts: Removed
  - Particle effects: Disabled (existing behavior)
  - All transitions reduced to 0.01s

---

## Files Affected (Summary)

### Modified:
- `client/src/pages/LandingPage.jsx` — Dice roll, treasure chest, glassmorphic sections
- `client/src/styles/landing.css` — All landing page visual upgrades
- `client/src/styles/hub.css` — Hub glassmorphic cards
- `client/src/components/layout/Header.jsx` — Premium header + avatar with SVG stat icons
- `client/src/styles/header.css` — Header styling
- `client/src/styles/layout.css` — Hexagonal sidebar icons
- `client/src/styles/panels.css` — Premium solid cards for game session
- `client/src/styles/responsive.css` — Mobile adaptations for all new styles

### New:
- `client/src/styles/premium.css` — Shared premium utility classes (glass, glow, buttons, texture)
  - Imported in main CSS after `variables.css`, before component files
- `client/src/components/landing/DiceRoll.jsx` — Dice animation component
- `client/src/components/landing/TreasureChest.jsx` — Chest CTA component

---

## What Does NOT Change

- Core game functionality (chat, campaigns, combat, etc.)
- Backend/API routes
- Authentication flow
- Data models or database schema
- Game session panel content/logic
- Routing structure
