# Fixes & Polish — Design Spec

**Date:** 2026-03-16

## Overview

Seven targeted fixes and enhancements to address routing bugs, UX gaps from the UI redesign, and developer experience improvements.

## Items

### 1. Play Free Routing Fix (already implemented, needs commit)
- `/play/free` route added pointing to `PlayPage` (no auth required)
- All "Play Free" / "Start Your Adventure" links updated from `/play` to `/play/free`
- Files changed: `main.jsx`, `LandingPage.jsx`

### 2. CSS Variable Cleanup
- Remove orphaned `--sidebar-width: 64px` and `--sidebar-expanded: 220px` from `variables.css`
- These were replaced by `--nav-rail-width` and `--icon-sidebar-width` during the redesign

### 3. Dev Startup Script
- Root-level `dev.sh` that starts both backend (uvicorn with SQLite) and frontend (vite) concurrently
- Kills both processes on Ctrl+C via trap
- Backend: `DATABASE_URL=sqlite+aiosqlite:///./dev.db uvicorn server.app.main:app --port 8000`
- Frontend: `cd client && npx vite --port 5173`

### 4. Channel Scroll Position Preservation
- Store `scrollPositions` ref in `ChatPanel` as `{ story: 0, ooc: 0, whisper: 0 }`
- On channel switch: save current `scrollTop`, restore saved position for new channel after render
- Uses `useRef` + `useEffect` keyed on `activeChannel` prop

### 5. Styled Sidebar Tooltips
- CSS-only tooltips using `data-tooltip` attribute + `::after` pseudo-element on `.icon-sidebar-btn`
- Dark fantasy style: obsidian background, gold text, gold border, Cinzel font
- Desktop: positioned to the left of the sidebar (sidebar is on the right edge)
- Mobile: hidden (icon bar is horizontal, labels would be redundant with the visible layout)
- Remove native `title` attribute from Sidebar.jsx

### 6. Mobile Campaign Picker
- Add a campaign/compass icon as the first button in the mobile horizontal icon bar
- Only visible on mobile (`@media max-width: 767px`)
- Tapping opens a slide-up modal overlay with:
  - Campaign list from game state or auth context
  - Each campaign shows first-letter avatar + name
  - Tapping navigates to `/play/campaign/:id`
  - "Back to Hub" link at bottom navigates to `/play`
- Slide-up animation consistent with existing mobile-panel-overlay pattern

### 7. Multiplayer Typing Indicator
- **Backend**: Two socket events — `typing_start` and `typing_stop`, broadcast to lobby room excluding sender
- **Frontend emit**: On keydown in chat input, emit `typing_start` (debounced 2s). Emit `typing_stop` on message send or input blur.
- **Frontend display**: Below chat input, show "PlayerName is typing..." with existing `.typing-dots` CSS animation
- **Auto-clear**: 3s timeout on receiver side if no new `typing_start` received
- Only active in multiplayer sessions
