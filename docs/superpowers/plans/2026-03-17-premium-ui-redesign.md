# Premium UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Wonderlore AI from dev-built to studio-built quality with cinematic landing page (D20 dice roll, glassmorphic cards, treasure chest CTA) and premium game UI polish (avatar frames, hexagonal sidebar, premium buttons, micro-interactions).

**Architecture:** Pure CSS/JSX visual upgrade. New `premium.css` provides shared utility classes. Landing page gets 2 new extracted components (DiceRoll, TreasureChest). All existing component logic untouched — only markup additions and CSS changes.

**Tech Stack:** React 19, CSS3 (backdrop-filter, clip-path, CSS transforms, keyframe animations), Intersection Observer API

**Spec:** `docs/superpowers/specs/2026-03-17-premium-ui-redesign-design.md`

---

## File Structure

### New Files:
| File | Responsibility |
|------|---------------|
| `client/src/styles/premium.css` | Shared premium utility classes: glass panels, gold glow, premium buttons, texture overlay |
| `client/src/components/landing/DiceRoll.jsx` | D20 dice animation component with scene selection |
| `client/src/components/landing/TreasureChest.jsx` | Treasure chest CTA with Intersection Observer |

### Modified Files:
| File | Changes |
|------|---------|
| `client/src/styles/index.css` | Add `@import './premium.css'` after variables.css |
| `client/src/pages/LandingPage.jsx` | Import DiceRoll + TreasureChest, replace hero + CTA sections |
| `client/src/styles/landing.css` | Glassmorphic pillar/story cards, dice + chest keyframes |
| `client/src/styles/hub.css` | Glassmorphic campaign cards + settings cards |
| `client/src/components/layout/Header.jsx` | Premium avatar frame, SVG stat icons |
| `client/src/styles/header.css` | Header gradient, texture, avatar frame, stat styling |
| `client/src/styles/layout.css` | Hexagonal sidebar icons (visual only, button stays rectangular) |
| `client/src/styles/panels.css` | Premium solid card treatment for game session |
| `client/src/styles/responsive.css` | Mobile adaptations for all new styles + prefers-reduced-motion |

---

## Chunk 1: Foundation — Premium CSS Utilities

### Task 1: Create premium.css with shared utility classes

**Files:**
- Create: `client/src/styles/premium.css`
- Modify: `client/src/styles/index.css`

- [ ] **Step 1: Create premium.css with glass, glow, button, and texture utilities**

```css
/* ═══════════════════════════════════════════════════════════════
   PREMIUM — Shared utility classes for studio-quality UI
   Import after variables.css, before component files
   ═══════════════════════════════════════════════════════════════ */

/* ═══ GLASSMORPHIC PANEL ═══ */
.glass-panel {
  background: rgba(20, 16, 8, 0.4);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(201, 168, 76, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.glass-panel:hover {
  background: rgba(20, 16, 8, 0.5);
  border-color: rgba(201, 168, 76, 0.35);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 0 40px rgba(201, 168, 76, 0.08);
}

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: rgba(20, 16, 8, 0.85);
  }
}

/* Reduced blur on touch devices for GPU performance */
@media (hover: none) {
  .glass-panel {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

/* ═══ GOLD INNER GLOW (background layer, no pseudo-elements) ═══ */
.gold-glow-bg {
  background-image: radial-gradient(circle at 30% 20%, rgba(201, 168, 76, 0.06), transparent 50%);
  background-repeat: no-repeat;
}

.gold-glow-bg:hover {
  background-image: radial-gradient(circle at 30% 20%, rgba(201, 168, 76, 0.12), transparent 50%);
}

/* ═══ TOP GOLD EDGE LINE ═══ */
.gold-top-edge {
  border-top: 2px solid transparent;
  border-image: linear-gradient(90deg, transparent, var(--gold-dim), transparent) 1;
}

/* ═══ PREMIUM BUTTONS ═══ */
.btn-premium {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(180deg, var(--gold-bright), var(--gold), var(--gold-dim));
  color: var(--obsidian);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-decoration: none;
  border: 1px solid var(--gold);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(201, 168, 76, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn-premium:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(201, 168, 76, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  background: linear-gradient(180deg, #f8dc80, var(--gold-bright), var(--gold));
}

.btn-premium:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(201, 168, 76, 0.15),
              inset 0 1px 0 rgba(0, 0, 0, 0.1);
}

.btn-premium-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 28px;
  background: transparent;
  color: var(--gold);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-decoration: none;
  border: 1px solid rgba(201, 168, 76, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-premium-secondary:hover {
  background: rgba(201, 168, 76, 0.08);
  border-color: var(--gold);
  box-shadow: 0 0 12px rgba(201, 168, 76, 0.1);
}

/* ═══ TEXTURE OVERLAY (via background-image layer) ═══ */
.texture-overlay {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='0.3' opacity='0.03'/%3E%3C/svg%3E");
}

@media (hover: none) {
  .texture-overlay {
    background-image: none;
  }
}

/* ═══ FOCUS GLOW ═══ */
.gold-focus:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.3);
}

/* ═══ HOVER LIFT (selective — only for cards and CTAs) ═══ */
@media (hover: hover) {
  .hover-lift {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

/* ═══ REDUCED MOTION ═══ */
@media (prefers-reduced-motion: reduce) {
  .glass-panel,
  .btn-premium,
  .btn-premium-secondary,
  .hover-lift {
    transition: none !important;
  }
  .hover-lift:hover {
    transform: none !important;
  }
  .btn-premium:hover {
    transform: none !important;
  }
}
```

- [ ] **Step 2: Add premium.css import to index.css (after variables.css, line 2)**

In `client/src/styles/index.css`, add after line 1 (`@import './variables.css'`):
```css
@import './premium.css';
```

- [ ] **Step 3: Verify build passes**

Run: `cd client && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add client/src/styles/premium.css client/src/styles/index.css
git commit -m "feat: add premium.css shared utility classes (glass, glow, buttons, texture)"
```

---

## Chunk 2: Landing Page — Glassmorphic Cards

### Task 2: Apply glassmorphic treatment to landing page pillars and story cards

**Files:**
- Modify: `client/src/styles/landing.css` (lines 605-829)
- Modify: `client/src/pages/LandingPage.jsx` (lines 552-664)

- [ ] **Step 1: Update pillar card CSS in landing.css**

In `landing.css`, find the `.landing-pillar` rule (around line 615) and update its background/border/shadow properties to use the glass treatment. Keep existing layout properties (padding, text-align, etc.) — only change the visual surface:

Replace the background and border styles of `.landing-pillar` with:
```css
.landing-pillar {
  /* existing layout properties stay */
  background: rgba(20, 16, 8, 0.4);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(201, 168, 76, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  background-image: radial-gradient(circle at 30% 20%, rgba(201, 168, 76, 0.06), transparent 50%);
  background-repeat: no-repeat;
  transition: all 0.3s ease;
}
```

Update `.landing-pillar:hover` to add inner gold glow:
```css
.landing-pillar:hover {
  background: rgba(20, 16, 8, 0.5);
  border-color: rgba(201, 168, 76, 0.35);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 0 40px rgba(201, 168, 76, 0.08);
  background-image: radial-gradient(circle at 30% 20%, rgba(201, 168, 76, 0.12), transparent 50%);
  transform: translateY(-4px);
}
```

- [ ] **Step 2: Update story card CSS in landing.css**

Find `.landing-story-card` (around line 730) and apply matching glass treatment:
```css
.landing-story-card {
  /* existing layout stays */
  background: rgba(20, 16, 8, 0.4);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(201, 168, 76, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.landing-story-card:hover {
  border-color: rgba(201, 168, 76, 0.35);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 0 40px rgba(201, 168, 76, 0.08);
  transform: translateY(-4px);
}
```

- [ ] **Step 3: Add backdrop-filter fallback**

Add at the end of landing.css (before responsive section):
```css
@supports not (backdrop-filter: blur(1px)) {
  .landing-pillar,
  .landing-story-card {
    background: rgba(20, 16, 8, 0.85);
  }
}
```

- [ ] **Step 4: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 5: Commit**

```bash
git add client/src/styles/landing.css
git commit -m "feat: glassmorphic cards on landing page pillars and stories"
```

---

## Chunk 3: Landing Page — D20 Dice Roll Hero

### Task 3: Create DiceRoll component

**Files:**
- Create: `client/src/components/landing/DiceRoll.jsx`

- [ ] **Step 1: Create landing components directory**

```bash
mkdir -p client/src/components/landing
```

- [ ] **Step 2: Create DiceRoll.jsx**

```jsx
import { useState, useEffect, useCallback } from 'react';

const TAGLINES = [
  "Danger lurks in every shadow",
  "Ancient powers stir",
  "Empires rise and fall",
  "Legends are forged in fire",
  "The realm awaits its champion",
];

export default function DiceRoll({ onRollComplete }) {
  const [rolling, setRolling] = useState(true);
  const [displayNum, setDisplayNum] = useState(20);
  const [finalRoll, setFinalRoll] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Check if already rolled this session
  useEffect(() => {
    const prev = sessionStorage.getItem('wonderlore-dice-rolled');
    if (prev) {
      const roll = parseInt(prev, 10);
      setRolling(false);
      setFinalRoll(roll);
      setFadeOut(true);
      onRollComplete(Math.floor((roll - 1) / 4), TAGLINES[Math.floor((roll - 1) / 4)], roll === 20);
      return;
    }

    // Animate number cycling
    const roll = Math.floor(Math.random() * 20) + 1;
    let frame = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
      frame++;
      if (frame < totalFrames) {
        setDisplayNum(Math.floor(Math.random() * 20) + 1);
      } else {
        clearInterval(interval);
        setDisplayNum(roll);
        setFinalRoll(roll);
        setRolling(false);
        setShowResult(true);
        sessionStorage.setItem('wonderlore-dice-rolled', String(roll));

        const sceneIndex = Math.min(Math.floor((roll - 1) / 4), 4);
        onRollComplete(sceneIndex, TAGLINES[sceneIndex], roll === 20);

        // Fade out dice after showing result
        setTimeout(() => setFadeOut(true), 2000);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [onRollComplete]);

  // Skip animation if already seen
  if (fadeOut && !showResult) return null;

  const isNat20 = finalRoll === 20;
  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  return (
    <div className={`dice-overlay ${fadeOut ? 'dice-fade-out' : ''}`}>
      <div className={`dice-container ${rolling && !reducedMotion ? 'dice-spinning' : ''} ${isNat20 ? 'dice-nat20' : ''}`}>
        <div className="dice-face">
          <span className="dice-number">{displayNum}</span>
        </div>
      </div>
      {showResult && (
        <div className="dice-result-text">
          You rolled a {finalRoll}!
          {isNat20 && <span className="dice-crit"> ✦ CRITICAL! ✦</span>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add dice CSS to landing.css**

Add before the responsive section in landing.css:
```css
/* ═══ D20 DICE ROLL ═══ */
.dice-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
  transition: opacity 0.8s ease;
}

.dice-overlay.dice-fade-out {
  opacity: 0;
}

.dice-container {
  width: 100px;
  height: 100px;
  perspective: 600px;
}

.dice-face {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(20, 16, 8, 0.9), rgba(42, 32, 21, 0.9));
  border: 2px solid var(--gold);
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(201, 168, 76, 0.3),
              inset 0 0 20px rgba(201, 168, 76, 0.1);
}

.dice-number {
  transform: rotate(-45deg);
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--gold-bright);
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.5);
}

.dice-spinning {
  animation: dice-spin 2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes dice-spin {
  0% { transform: rotateY(0deg) rotateX(0deg) scale(0.5); opacity: 0; }
  20% { opacity: 1; transform: rotateY(360deg) rotateX(180deg) scale(1.1); }
  60% { transform: rotateY(720deg) rotateX(360deg) scale(1); }
  100% { transform: rotateY(1080deg) rotateX(540deg) scale(1); }
}

.dice-nat20 .dice-face {
  border-color: var(--gold-bright);
  box-shadow: 0 0 60px rgba(245, 212, 120, 0.6),
              0 0 120px rgba(201, 168, 76, 0.3),
              inset 0 0 30px rgba(245, 212, 120, 0.2);
}

.dice-nat20 .dice-number {
  color: #fff;
  text-shadow: 0 0 30px rgba(245, 212, 120, 0.8);
}

.dice-result-text {
  margin-top: 24px;
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.4);
  animation: dice-result-reveal 0.6s ease forwards;
  letter-spacing: 2px;
}

.dice-crit {
  display: block;
  color: var(--gold-bright);
  font-size: 0.9rem;
  margin-top: 4px;
  animation: dice-crit-pulse 0.8s ease infinite alternate;
}

@keyframes dice-result-reveal {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes dice-crit-pulse {
  from { text-shadow: 0 0 10px rgba(245, 212, 120, 0.4); }
  to { text-shadow: 0 0 30px rgba(245, 212, 120, 0.8); }
}

@media (prefers-reduced-motion: reduce) {
  .dice-spinning { animation: none; }
  .dice-crit { animation: none; }
  .dice-result-text { animation: none; opacity: 1; }
  .dice-overlay { transition: none; }
}
```

- [ ] **Step 4: Integrate DiceRoll into LandingPage.jsx hero section**

In `LandingPage.jsx`:
1. Add import: `import DiceRoll from '../components/landing/DiceRoll';`
2. Add state:
```jsx
const [heroScene, setHeroScene] = useState({ index: 0, tagline: '', isNat20: false, resolved: false });
```
3. Add callback:
```jsx
const handleRollComplete = useCallback((index, tagline, isNat20) => {
  setHeroScene({ index, tagline, isNat20, resolved: true });
}, []);
```
4. Replace the hero background carousel with scene-based display — the DiceRoll component sits inside `.landing-hero` and the background uses `heroScene.index` to pick the image
5. Show tagline from `heroScene.tagline` below the main title when resolved

- [ ] **Step 5: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 6: Commit**

```bash
git add client/src/components/landing/DiceRoll.jsx client/src/pages/LandingPage.jsx client/src/styles/landing.css
git commit -m "feat: D20 dice roll hero with scene selection and nat20 effects"
```

---

## Chunk 4: Landing Page — Treasure Chest CTA

### Task 4: Create TreasureChest component

**Files:**
- Create: `client/src/components/landing/TreasureChest.jsx`
- Modify: `client/src/pages/LandingPage.jsx` (lines 666-677, CTA footer section)
- Modify: `client/src/styles/landing.css` (lines 830-875, CTA footer CSS)

- [ ] **Step 1: Create TreasureChest.jsx**

```jsx
import { useEffect, useRef, useState } from 'react';

export default function TreasureChest() {
  const ref = useRef(null);
  const [opened, setOpened] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check sessionStorage for previous view
    if (sessionStorage.getItem('wonderlore-chest-opened')) {
      setOpened(true);
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setTimeout(() => {
            setOpened(true);
            sessionStorage.setItem('wonderlore-chest-opened', '1');
          }, 300);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  return (
    <div ref={ref} className={`chest-cta ${visible ? 'chest-visible' : ''} ${opened ? 'chest-opened' : ''} ${reducedMotion ? 'chest-no-motion' : ''}`}>
      <div className="chest-wrapper">
        <div className="chest-glow" />
        <div className="chest-body">
          <div className="chest-lid">
            <div className="chest-lid-front" />
          </div>
          <div className="chest-base">
            <div className="chest-base-front" />
          </div>
        </div>
        <div className="chest-rays" />
      </div>

      <div className="chest-content">
        <h2 className="chest-title">Your Story Begins Now</h2>
        <p className="chest-subtitle">No downloads. No paywalls. Free to play.</p>
        <a href="/play" className="btn-premium chest-btn">
          CLAIM YOUR DESTINY
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add treasure chest CSS to landing.css**

Replace the existing `.landing-cta-footer` CSS (lines 830-875) with:

```css
/* ═══ TREASURE CHEST CTA ═══ */
.chest-cta {
  position: relative;
  padding: 120px 24px 80px;
  text-align: center;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.chest-cta.chest-visible {
  opacity: 1;
}

.chest-cta.chest-no-motion {
  opacity: 1;
}

.chest-cta.chest-no-motion .chest-lid {
  transform: rotateX(-110deg);
}

.chest-cta.chest-no-motion .chest-content {
  opacity: 1;
}

.chest-wrapper {
  position: relative;
  width: 160px;
  height: 120px;
  margin: 0 auto 40px;
  perspective: 800px;
}

.chest-body {
  position: relative;
  width: 100%;
  height: 100%;
}

.chest-base {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 60px;
}

.chest-base-front {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #5a3a1a, #3a2410);
  border: 2px solid var(--gold-dim);
  border-radius: 0 0 8px 8px;
  box-shadow: inset 0 -4px 8px rgba(0, 0, 0, 0.4);
}

.chest-lid {
  position: absolute;
  top: 0;
  width: 100%;
  height: 50px;
  transform-origin: top center;
  transform: rotateX(0deg);
  transition: transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chest-opened .chest-lid {
  transform: rotateX(-110deg);
}

.chest-lid-front {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #6a4a2a, #4a3018);
  border: 2px solid var(--gold-dim);
  border-radius: 12px 12px 0 0;
  box-shadow: inset 0 4px 8px rgba(201, 168, 76, 0.1);
}

/* Gold glow from inside */
.chest-glow {
  position: absolute;
  top: 40%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 212, 120, 0.6), rgba(201, 168, 76, 0.2), transparent);
  transform: translate(-50%, -50%);
  transition: width 1.5s ease, height 1.5s ease, opacity 1s ease;
  opacity: 0;
}

.chest-opened .chest-glow {
  width: 400px;
  height: 400px;
  opacity: 1;
}

/* Light rays */
.chest-rays {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 1s ease 0.5s;
  background:
    linear-gradient(0deg, rgba(245, 212, 120, 0.3) 0%, transparent 60%) no-repeat center,
    linear-gradient(45deg, rgba(245, 212, 120, 0.2) 0%, transparent 50%) no-repeat center,
    linear-gradient(-45deg, rgba(245, 212, 120, 0.2) 0%, transparent 50%) no-repeat center,
    linear-gradient(90deg, rgba(245, 212, 120, 0.15) 0%, transparent 40%) no-repeat center,
    linear-gradient(-90deg, rgba(245, 212, 120, 0.15) 0%, transparent 40%) no-repeat center;
}

.chest-opened .chest-rays {
  opacity: 1;
}

.chest-content {
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease 0.8s, transform 0.8s ease 0.8s;
}

.chest-opened .chest-content {
  opacity: 1;
  transform: translateY(0);
}

.chest-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 4vw, 3rem);
  color: var(--gold);
  letter-spacing: 3px;
  margin-bottom: 12px;
  text-shadow: 0 0 40px rgba(201, 168, 76, 0.3);
}

.chest-subtitle {
  color: var(--silver);
  font-size: 1.1rem;
  margin-bottom: 32px;
}

.chest-btn {
  position: relative;
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .chest-lid { transition: none; }
  .chest-glow { transition: none; }
  .chest-rays { transition: none; }
  .chest-content { transition: none; opacity: 1; transform: none; }
  .chest-cta { transition: none; opacity: 1; }
}
```

- [ ] **Step 3: Replace CTA footer in LandingPage.jsx**

1. Add import: `import TreasureChest from '../components/landing/TreasureChest';`
2. Replace the existing CTA footer section (the `landing-cta-footer` div) with: `<TreasureChest />`

- [ ] **Step 4: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 5: Commit**

```bash
git add client/src/components/landing/TreasureChest.jsx client/src/pages/LandingPage.jsx client/src/styles/landing.css
git commit -m "feat: treasure chest CTA with opening animation and light rays"
```

---

## Chunk 5: Game UI — Header & Avatar Premium Polish

### Task 5: Upgrade header bar and avatar frame

**Files:**
- Modify: `client/src/components/layout/Header.jsx`
- Modify: `client/src/styles/header.css`

- [ ] **Step 1: Add SVG stat icons and premium avatar to Header.jsx**

In Header.jsx, add small inline SVG icon components before the return:
```jsx
const IconHeart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconCoin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v12M8 12h8"/>
  </svg>
);
```

Replace the back-arrow avatar area with a premium avatar:
```jsx
<Link to="/play" className="header-avatar-frame">
  <span className="header-avatar-initial">
    {/* First letter of username */}
    {gameData?.character?.name?.[0]?.toUpperCase() || 'W'}
  </span>
</Link>
```

Add SVG icons before each stat value (e.g., `<IconHeart />` before HP, `<IconStar />` before Level, `<IconCoin />` before Gold).

- [ ] **Step 2: Update header.css with premium styling**

Add/update in header.css:

```css
/* ═══ PREMIUM AVATAR FRAME ═══ */
.header-avatar-frame {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--deep-stone), var(--stone));
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border: 2px solid var(--gold-dim);
  box-shadow: 0 0 0 3px var(--obsidian),
              0 0 0 5px rgba(201, 168, 76, 0.25),
              0 0 12px rgba(201, 168, 76, 0.15);
  transition: box-shadow 0.3s ease;
  flex-shrink: 0;
}

.header-avatar-frame:hover {
  box-shadow: 0 0 0 3px var(--obsidian),
              0 0 0 5px rgba(201, 168, 76, 0.4),
              0 0 20px rgba(201, 168, 76, 0.25);
}

.header-avatar-initial {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--gold);
  text-shadow: 0 0 8px rgba(201, 168, 76, 0.3);
}

/* ═══ STAT ICONS ═══ */
.header-stat svg {
  color: var(--gold-dim);
  flex-shrink: 0;
}

.header-stat-value {
  color: var(--gold);
  font-family: 'Fira Code', monospace;
}

.header-stat-value.hp-low {
  color: var(--crimson-bright);
}
```

Update the header background to use texture:
```css
.app-header {
  background: linear-gradient(180deg, rgba(42, 32, 21, 0.98), rgba(26, 18, 9, 0.95), var(--obsidian));
  background-image:
    url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='0.3' opacity='0.02'/%3E%3C/svg%3E"),
    linear-gradient(180deg, rgba(42, 32, 21, 0.98), rgba(26, 18, 9, 0.95), var(--obsidian));
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/Header.jsx client/src/styles/header.css
git commit -m "feat: premium avatar frame with double-ring glow and SVG stat icons"
```

---

## Chunk 6: Game UI — Hexagonal Sidebar Icons

### Task 6: Convert sidebar icons to hexagonal visual shape

**Files:**
- Modify: `client/src/styles/layout.css` (lines 29-104)

- [ ] **Step 1: Update sidebar icon CSS**

In layout.css, update the `.icon-sidebar-btn` and related rules. The button element stays rectangular for full hit area; add an inner visual hex:

```css
.icon-sidebar-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 0.75rem;
  position: relative;
  transition: color 0.25s ease;
}

/* Hexagonal visual background */
.icon-sidebar-btn::before {
  content: '';
  position: absolute;
  width: 34px;
  height: 34px;
  clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
  background: linear-gradient(135deg, var(--deep-stone), var(--void));
  border: none;
  transition: all 0.25s ease;
  z-index: -1;
}

.icon-sidebar-btn:hover {
  color: var(--gold);
}

.icon-sidebar-btn:hover::before {
  background: linear-gradient(135deg, rgba(42, 32, 21, 0.8), var(--deep-stone));
  box-shadow: 0 0 12px rgba(201, 168, 76, 0.15);
}

.icon-sidebar-btn.active {
  color: var(--gold);
}

.icon-sidebar-btn.active::before {
  background: linear-gradient(135deg, rgba(42, 32, 21, 0.9), rgba(26, 18, 9, 0.9));
  box-shadow: 0 0 16px rgba(201, 168, 76, 0.2),
              inset 0 0 8px rgba(201, 168, 76, 0.05);
}
```

Note: The existing `::after` tooltip pseudo-element must be preserved — it uses `content: attr(data-tooltip)` and is positioned to the left of the button. The `::before` is used for the hex background.

- [ ] **Step 2: Verify tooltip still works**

The tooltip uses `::after` which remains unchanged. Only `::before` is repurposed for the hex shape.

- [ ] **Step 3: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 4: Commit**

```bash
git add client/src/styles/layout.css
git commit -m "feat: hexagonal sidebar icons with preserved touch targets"
```

---

## Chunk 7: Game UI — Content Cards & Panel Polish

### Task 7: Premium treatment for game session panels

**Files:**
- Modify: `client/src/styles/panels.css`

- [ ] **Step 1: Update panel card styling**

In panels.css, update `.stat-block` and add new card treatment:

```css
/* ═══ PREMIUM CARD TREATMENT ═══ */
.stat-block {
  background: linear-gradient(135deg, rgba(26, 18, 9, 0.95), rgba(20, 16, 8, 0.95));
  border: 1px solid rgba(201, 168, 76, 0.12);
  border-top: 2px solid transparent;
  border-image: linear-gradient(90deg, transparent, var(--gold-dim), transparent) 1;
  border-image-slice: 1 0 0 0;
  background-image: radial-gradient(circle at 30% 20%, rgba(201, 168, 76, 0.04), transparent 50%);
  background-repeat: no-repeat;
  transition: all 0.3s ease;
}

@media (hover: hover) {
  .stat-block:hover {
    border-color: rgba(201, 168, 76, 0.25);
    background-image: radial-gradient(circle at 30% 20%, rgba(201, 168, 76, 0.08), transparent 50%);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
}

.section-title {
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/panels.css
git commit -m "feat: premium solid card treatment for game session panels"
```

---

## Chunk 8: Hub — Glassmorphic Campaign Cards

### Task 8: Apply glass treatment to hub cards

**Files:**
- Modify: `client/src/styles/hub.css`

- [ ] **Step 1: Update campaign card and settings card CSS**

Find `.campaign-card` in hub.css and update its visual surface:

```css
.campaign-card {
  /* keep existing layout properties */
  background: rgba(20, 16, 8, 0.4);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(201, 168, 76, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
  background-image: radial-gradient(circle at 30% 20%, rgba(201, 168, 76, 0.06), transparent 50%);
  background-repeat: no-repeat;
  transition: all 0.3s ease;
}

.campaign-card:hover {
  background: rgba(20, 16, 8, 0.5);
  border-color: rgba(201, 168, 76, 0.35);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 0 40px rgba(201, 168, 76, 0.08);
  transform: translateY(-2px);
}
```

Similarly update settings cards (`.settings-group` or equivalent class).

Add fallback:
```css
@supports not (backdrop-filter: blur(1px)) {
  .campaign-card {
    background: rgba(20, 16, 8, 0.85);
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/hub.css
git commit -m "feat: glassmorphic campaign cards in hub"
```

---

## Chunk 9: Mobile Responsive Adaptations

### Task 9: Ensure all premium styles adapt to mobile

**Files:**
- Modify: `client/src/styles/responsive.css`

- [ ] **Step 1: Add mobile adaptations for new premium features**

In responsive.css, within the appropriate media query blocks:

```css
/* ═══ MOBILE PREMIUM ADAPTATIONS ═══ */
@media (max-width: 767px) {
  /* Hexagonal sidebar icons — smaller visual hex */
  .icon-sidebar-btn::before {
    width: 30px;
    height: 30px;
  }

  /* Dice overlay — smaller on mobile */
  .dice-container {
    width: 80px;
    height: 80px;
  }
  .dice-number {
    font-size: 1.5rem;
  }
  .dice-result-text {
    font-size: 1rem;
  }

  /* Treasure chest — smaller */
  .chest-wrapper {
    width: 120px;
    height: 90px;
  }

  /* Avatar frame — slightly smaller */
  .header-avatar-frame {
    width: 32px;
    height: 32px;
  }
  .header-avatar-initial {
    font-size: 0.85rem;
  }
}

/* ═══ TOUCH DEVICE: disable hover lifts ═══ */
@media (hover: none) {
  .campaign-card:hover,
  .landing-pillar:hover,
  .landing-story-card:hover {
    transform: none;
  }

  /* Remove texture overlays on mobile for GPU perf */
  .texture-overlay {
    background-image: none !important;
  }
}
```

- [ ] **Step 2: Add prefers-reduced-motion global rules**

Add to responsive.css (or confirm existing block covers new animations):
```css
@media (prefers-reduced-motion: reduce) {
  .dice-spinning,
  .dice-crit,
  .chest-lid,
  .chest-glow,
  .chest-rays,
  .chest-content {
    animation: none !important;
    transition: none !important;
  }

  .chest-cta {
    opacity: 1;
  }

  .chest-opened .chest-content {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd client && npm run build`

- [ ] **Step 4: Commit**

```bash
git add client/src/styles/responsive.css
git commit -m "feat: mobile responsive adaptations for premium UI"
```

---

## Chunk 10: Final Verification

### Task 10: Build verification and cleanup

- [ ] **Step 1: Full build check**

Run: `cd client && npm run build`
Expected: 0 errors, 0 warnings related to our changes

- [ ] **Step 2: Visual spot-check in browser at key viewports**

Open the app and verify at:
- 1440px (desktop) — landing page, hub, game session
- 768px (tablet) — all pages
- 375px (mobile) — all pages

Check for:
- Glass cards render with blur effect
- Dice roll plays on first landing page visit
- Treasure chest opens on scroll
- Hexagonal icons display correctly
- Avatar frame has double-ring glow
- No layout overflow on mobile
- Touch targets ≥44px on mobile

- [ ] **Step 3: Final commit with all remaining changes**

```bash
git add -A
git commit -m "chore: premium UI redesign complete — landing page + game session polish"
```
