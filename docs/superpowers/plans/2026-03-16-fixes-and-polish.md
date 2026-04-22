# Fixes & Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Play Free routing bug and ship 6 UX/DX polish items: CSS cleanup, dev script, scroll preservation, styled tooltips, mobile campaign picker, and multiplayer typing indicator.

**Architecture:** All changes are frontend-focused except the typing indicator which adds 2 socket events to the backend. No new dependencies. CSS-only tooltips (no JS library). Mobile campaign picker reuses existing slide-up overlay pattern.

**Tech Stack:** React 19, Vite 8, FastAPI, python-socketio, CSS custom properties

---

## Chunk 1: Quick Wins (Tasks 1-3)

### Task 1: Commit Play Free Routing Fix

Already implemented in working tree. Just needs commit.

**Files:**
- Modified: `client/src/main.jsx` (added PlayPage import + `/play/free` route)
- Modified: `client/src/pages/LandingPage.jsx` (3 links changed from `/play` to `/play/free`)

- [ ] **Step 1: Stage and commit the routing fix**

```bash
git add client/src/main.jsx client/src/pages/LandingPage.jsx
git commit -m "fix: route Play Free to PlayPage instead of auth-gated HubPage

Play Free buttons linked to /play which routes to HubPage.
HubPage redirects unauthenticated users to / creating a loop.
Added /play/free route pointing to PlayPage (no auth required).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: CSS Variable Cleanup

Remove orphaned `--sidebar-width` and `--sidebar-expanded` from variables.css. These were replaced by `--nav-rail-width` and `--icon-sidebar-width` during the UI redesign.

**Files:**
- Modify: `client/src/styles/variables.css:103-104`

- [ ] **Step 1: Verify variables are unused**

```bash
# Search entire client/src/styles for --sidebar-width and --sidebar-expanded usage
grep -r "sidebar-width\|sidebar-expanded" client/src/styles/ --include="*.css"
```

Expected: Only `variables.css` lines 103-104 (the declarations themselves). If found elsewhere, do NOT remove.

- [ ] **Step 2: Remove the two orphaned lines**

In `client/src/styles/variables.css`, delete these two lines:
```css
  --sidebar-width: 64px;
  --sidebar-expanded: 220px;
```

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/variables.css
git commit -m "chore: remove orphaned --sidebar-width CSS variables

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Full-Stack Dev Startup Script

Update `start-dev.sh` to launch both backend and frontend, with clean shutdown on Ctrl+C.

**Files:**
- Modify: `start-dev.sh`

- [ ] **Step 1: Replace start-dev.sh with full-stack version**

```bash
#!/bin/bash
# Start both backend and frontend for local development.
# Usage: ./start-dev.sh
# Press Ctrl+C to stop both servers.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Ensure Node is available (nvm users)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# Backend — FastAPI with SQLite for local dev
echo "Starting backend on :8000..."
DATABASE_URL="sqlite+aiosqlite:///./dev.db" \
  python3 -m uvicorn server.app.main:app \
  --host 0.0.0.0 --port 8000 --reload \
  --reload-dir "$SCRIPT_DIR/server" &
BACKEND_PID=$!

# Frontend — Vite dev server
echo "Starting frontend on :5173..."
cd "$SCRIPT_DIR/client"
npx vite --port 5173 &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Press Ctrl+C to stop both servers"
echo "═══════════════════════════════════════"
echo ""

# Wait for either to exit
wait -n $BACKEND_PID $FRONTEND_PID
```

- [ ] **Step 2: Commit**

```bash
git add start-dev.sh
git commit -m "feat: upgrade start-dev.sh to launch backend + frontend together

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: Channel Scroll Preservation (Task 4)

### Task 4: Preserve Scroll Position Per Channel

Save and restore `scrollTop` in ChatPanel when the `activeChannel` prop changes.

**Files:**
- Modify: `client/src/components/chat/ChatPanel.jsx`
- Modify: `client/src/App.jsx` (pass `activeChannel` prop to ChatPanel)

- [ ] **Step 1: Pass activeChannel prop to ChatPanel**

In `client/src/App.jsx`, find the ChatPanel render (around line 145):
```jsx
<ChatPanel />
```
Replace with:
```jsx
<ChatPanel activeChannel={activeChannel} />
```

- [ ] **Step 2: Add scroll position tracking to ChatPanel**

In `client/src/components/chat/ChatPanel.jsx`, add a `scrollPositionsRef` and an effect that saves/restores scroll position when `activeChannel` changes.

After the existing refs (line 14, after `textareaRef`), add:
```jsx
const scrollPositionsRef = useRef({});
const prevChannelRef = useRef(null);
```

After the existing scroll-tracking useEffect (after line 51), add this new effect:
```jsx
// Save/restore scroll position when switching channels
useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  // Save current channel's scroll position
  if (prevChannelRef.current && prevChannelRef.current !== activeChannel) {
    scrollPositionsRef.current[prevChannelRef.current] = container.scrollTop;
  }

  // Restore new channel's scroll position (default to bottom)
  const saved = scrollPositionsRef.current[activeChannel];
  if (saved !== undefined) {
    container.scrollTop = saved;
  } else {
    // First visit to this channel — scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  prevChannelRef.current = activeChannel;
}, [activeChannel]);
```

- [ ] **Step 3: Add activeChannel to the function signature**

Update the ChatPanel function signature from:
```jsx
function ChatPanel({ multiplayer, campaignId, className }) {
```
to:
```jsx
function ChatPanel({ multiplayer, campaignId, className, activeChannel }) {
```

- [ ] **Step 4: Verify the app compiles**

```bash
cd client && npx vite build 2>&1 | tail -5
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.jsx client/src/components/chat/ChatPanel.jsx
git commit -m "feat: preserve scroll position when switching channel tabs

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: Styled Sidebar Tooltips (Task 5)

### Task 5: CSS-Only Dark Fantasy Tooltips

Replace native `title` attributes with styled CSS tooltips using `data-tooltip` + `::after`.

**Files:**
- Modify: `client/src/components/layout/Sidebar.jsx` (swap `title` → `data-tooltip`)
- Modify: `client/src/styles/layout.css` (add tooltip CSS after `.icon-sidebar-btn:hover` block)
- Modify: `client/src/styles/responsive.css` (hide tooltips on mobile)

- [ ] **Step 1: Update Sidebar.jsx — replace title with data-tooltip**

In `client/src/components/layout/Sidebar.jsx`, replace:
```jsx
            title={panel.label}
```
with:
```jsx
            data-tooltip={panel.label}
```

- [ ] **Step 2: Add tooltip CSS to layout.css**

In `client/src/styles/layout.css`, after the `.icon-sidebar-btn:hover` block (after line 59), add:

```css
/* Styled tooltip — positioned left of sidebar */
.icon-sidebar-btn {
  position: relative;
}

.icon-sidebar-btn::after {
  content: attr(data-tooltip);
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--void);
  color: var(--gold);
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  padding: 4px 8px;
  border: 1px solid var(--border-gold);
  border-radius: 2px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: var(--z-header);
}

.icon-sidebar-btn:hover::after {
  opacity: 1;
}
```

- [ ] **Step 3: Hide tooltips on mobile**

In `client/src/styles/responsive.css`, inside the existing `@media (max-width: 767px)` block, after the `.icon-sidebar-btn.active` rule (around line 77), add:

```css
  /* Hide tooltips on mobile — icons are in horizontal bar */
  .icon-sidebar-btn::after {
    display: none;
  }
```

- [ ] **Step 4: Also hide tooltips on tablet**

In `client/src/styles/responsive.css`, inside the existing `@media (max-width: 1199px)` block (the tablet breakpoint), add:

```css
  /* Hide tooltips on tablet — sidebar may be narrow */
  .icon-sidebar-btn::after {
    display: none;
  }
```

- [ ] **Step 5: Verify build**

```bash
cd client && npx vite build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add client/src/components/layout/Sidebar.jsx client/src/styles/layout.css client/src/styles/responsive.css
git commit -m "feat: add dark-fantasy styled tooltips to icon sidebar

CSS-only tooltips via data-tooltip + ::after pseudo-element.
Positioned left of sidebar on desktop, hidden on tablet/mobile.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: Mobile Campaign Picker (Task 6)

### Task 6: Campaign Picker for Mobile

Add a compass icon to the mobile icon bar that opens a slide-up campaign list. Only visible at the mobile breakpoint.

**Files:**
- Create: `client/src/components/layout/MobileCampaignPicker.jsx`
- Create: `client/src/styles/campaign-picker.css`
- Modify: `client/src/App.jsx` (add state + render MobileCampaignPicker)
- Modify: `client/src/styles/index.css` (import campaign-picker.css)
- Modify: `client/src/components/layout/Sidebar.jsx` (add campaign button on mobile)

- [ ] **Step 1: Create MobileCampaignPicker component**

Create `client/src/components/layout/MobileCampaignPicker.jsx`:

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import '../../styles/campaign-picker.css';

export default function MobileCampaignPicker({ open, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (!open) return null;

  const handleBackToHub = () => {
    onClose();
    navigate('/play');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="campaign-picker-backdrop" onClick={handleOverlayClick}>
      <div className="campaign-picker">
        <div className="campaign-picker-header">
          <span className="campaign-picker-title">Campaigns</span>
          <button className="campaign-picker-close" onClick={onClose}>✕</button>
        </div>
        <div className="campaign-picker-body">
          <p className="campaign-picker-hint">
            {isAuthenticated
              ? 'Return to the hub to switch campaigns or start a new one.'
              : 'Create an account to save campaigns and track your adventures.'}
          </p>
          {isAuthenticated && (
            <button className="campaign-picker-hub-btn" onClick={handleBackToHub}>
              ⚔ Back to Campaign Hub
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create campaign-picker.css**

Create `client/src/styles/campaign-picker.css`:

```css
/* ═══════════════════════════════════════════════════════════════
   MOBILE CAMPAIGN PICKER — slide-up overlay
   ═══════════════════════════════════════════════════════════════ */

.campaign-picker-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.15s ease-out;
}

.campaign-picker {
  width: 100%;
  max-width: 480px;
  max-height: 70vh;
  background: var(--stone);
  border-top: 1px solid var(--border-gold);
  border-radius: 12px 12px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s ease-out;
}

.campaign-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-dim);
}

.campaign-picker-title {
  font-family: 'Cinzel', serif;
  color: var(--gold);
  font-size: 0.9rem;
}

.campaign-picker-close {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
}

.campaign-picker-close:hover {
  color: var(--gold);
}

.campaign-picker-body {
  padding: 16px;
  overflow-y: auto;
}

.campaign-picker-hint {
  color: var(--silver);
  font-size: 0.8rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.campaign-picker-hub-btn {
  width: 100%;
  padding: 10px;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid var(--border-gold);
  border-radius: 4px;
  color: var(--gold);
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.campaign-picker-hub-btn:hover {
  background: rgba(201, 168, 76, 0.2);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 3: Add campaign-picker.css import to index.css**

In `client/src/styles/index.css`, add the import BEFORE `responsive.css` (responsive.css must remain last):

```css
@import './campaign-picker.css';
@import './responsive.css';
```

Replace the last line (`@import './responsive.css';`) with these two lines.

- [ ] **Step 4: Add campaign picker state and button to Sidebar**

In `client/src/components/layout/Sidebar.jsx`, add a compass campaign button that only shows on mobile. The key approach: add a button before the panel icons with a CSS class `mobile-campaign-btn` that is `display: none` by default and `display: flex` on mobile.

Replace the full Sidebar component:

```jsx
import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { PANELS } from '../../data/panels.js';
import GAME_ICONS from '../shared/GameIcons.jsx';

export default function Sidebar({ onMobilePanelSelect, mobilePanelOpen, onToggleCompanion, isTablet, onOpenCampaignPicker }) {
  const { state, dispatch } = useGame();

  const handleClick = (panelId) => {
    dispatch({ type: 'SET_PANEL', payload: panelId });
    if (onMobilePanelSelect && window.innerWidth < 768) {
      onMobilePanelSelect(panelId);
    } else if (onToggleCompanion && isTablet) {
      onToggleCompanion();
    }
  };

  return (
    <div className="icon-sidebar" role="navigation" aria-label="Panel navigation">
      {/* Campaign switcher — visible only on mobile via CSS */}
      <button
        className="icon-sidebar-btn mobile-campaign-btn"
        onClick={onOpenCampaignPicker}
        data-tooltip="Campaigns"
        aria-label="Campaigns"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {PANELS.map(panel => {
        const Icon = GAME_ICONS[panel.id];
        const isActive = state.activePanel === panel.id;
        return (
          <button
            key={panel.id}
            className={`icon-sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(panel.id)}
            data-tooltip={panel.label}
            aria-label={panel.label}
            aria-current={isActive ? 'true' : undefined}
          >
            {Icon ? <Icon /> : panel.icon}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Add mobile-campaign-btn CSS to layout.css**

In `client/src/styles/layout.css`, after the `.icon-sidebar-btn:hover::after` block, add:

```css
/* Campaign button — hidden by default, shown on mobile via responsive.css */
.mobile-campaign-btn {
  display: none;
}
```

- [ ] **Step 6: Show campaign button on mobile in responsive.css**

In `client/src/styles/responsive.css`, inside the `@media (max-width: 767px)` block, after the icon-sidebar rules, add:

```css
  /* Show campaign picker button on mobile */
  .mobile-campaign-btn {
    display: flex;
    border-right: 1px solid var(--border-dim);
    padding-right: 6px;
    margin-right: 2px;
  }
```

- [ ] **Step 7: Wire campaign picker in App.jsx**

In `client/src/App.jsx`:

**Add import** (after the CampaignWizard import, around line 33):
```jsx
import MobileCampaignPicker from './components/layout/MobileCampaignPicker.jsx';
```

**Add state** (after the `mobilePanelOpen` state, around line 66):
```jsx
const [campaignPickerOpen, setCampaignPickerOpen] = useState(false);
```

**Pass prop to Sidebar** — update the Sidebar JSX (around line 149):
```jsx
        <Sidebar
          onMobilePanelSelect={handleMobilePanelSelect}
          mobilePanelOpen={mobilePanelOpen}
          onToggleCompanion={() => setCompanionOpen(true)}
          isTablet={isTablet}
          onOpenCampaignPicker={() => setCampaignPickerOpen(true)}
        />
```

**Render MobileCampaignPicker** — after the mobile-panel-overlay block (around line 202), before the closing `</div>` of `redesigned-layout`:
```jsx
        <MobileCampaignPicker
          open={campaignPickerOpen}
          onClose={() => setCampaignPickerOpen(false)}
        />
```

- [ ] **Step 8: Export from layout index**

In `client/src/components/layout/index.js`, add:
```js
export { default as MobileCampaignPicker } from './MobileCampaignPicker.jsx';
```

- [ ] **Step 9: Verify build**

```bash
cd client && npx vite build 2>&1 | tail -5
```

- [ ] **Step 10: Commit**

```bash
git add client/src/components/layout/MobileCampaignPicker.jsx \
  client/src/components/layout/Sidebar.jsx \
  client/src/components/layout/index.js \
  client/src/styles/campaign-picker.css \
  client/src/styles/index.css \
  client/src/styles/layout.css \
  client/src/styles/responsive.css \
  client/src/App.jsx
git commit -m "feat: add mobile campaign picker with slide-up overlay

Globe icon in mobile icon bar opens a campaign switching panel.
Only visible on mobile (hidden on tablet/desktop where NavRail exists).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 5: Multiplayer Typing Indicator (Task 7)

### Task 7: Peer Typing Indicator

Add `typing_start`/`typing_stop` socket events and display "PlayerName is typing..." below the chat input in multiplayer sessions.

**Files:**
- Modify: `server/app/socketio_manager.py` (add 2 event handlers)
- Modify: `client/src/services/socketService.js` (add emit + listener functions)
- Modify: `client/src/components/chat/ChatPanel.jsx` (emit on keydown, display indicator)
- Modify: `client/src/styles/chat.css` (add peer-typing styles)

- [ ] **Step 1: Add typing events to backend socketio_manager.py**

In `server/app/socketio_manager.py`, after the `session_start` event handler (after line 101), add:

```python
@sio.event
async def typing_start(sid, data):
    """Broadcast that a player started typing to others in the campaign room."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    campaign_id = data.get("campaign_id")
    username = data.get("username", "Someone")
    if campaign_id:
        await sio.emit(
            "peer_typing",
            {"user_id": user_id, "username": username, "typing": True},
            room=f"campaign:{campaign_id}",
            skip_sid=sid,
        )


@sio.event
async def typing_stop(sid, data):
    """Broadcast that a player stopped typing."""
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    campaign_id = data.get("campaign_id")
    username = data.get("username", "Someone")
    if campaign_id:
        await sio.emit(
            "peer_typing",
            {"user_id": user_id, "username": username, "typing": False},
            room=f"campaign:{campaign_id}",
            skip_sid=sid,
        )
```

- [ ] **Step 2: Add socket helper functions on frontend**

In `client/src/services/socketService.js`, add at the end of the file:

```js
// Typing indicators (multiplayer)
export function emitTypingStart(campaignId, username) {
  socket?.emit('typing_start', { campaign_id: campaignId, username });
}

export function emitTypingStop(campaignId, username) {
  socket?.emit('typing_stop', { campaign_id: campaignId, username });
}

export function onPeerTyping(callback) {
  socket?.on('peer_typing', callback);
  return () => socket?.off('peer_typing', callback);
}
```

- [ ] **Step 3: Add typing indicator state and logic to ChatPanel**

In `client/src/components/chat/ChatPanel.jsx`:

**Update imports** — add the new socket functions to the existing import:
```jsx
import { sendPlayerAction, onMultiplayerMessage, emitTypingStart, emitTypingStop, onPeerTyping } from '../../services/socketService.js';
```

**Add state** — after line 11 (`const [showScrollBtn, setShowScrollBtn] = useState(false);`):
```jsx
const [peersTyping, setPeersTyping] = useState({}); // { username: timeoutId }
const typingTimeoutRef = useRef(null);
```

**Add peer typing listener effect** — after the multiplayer message listener effect (after line 31):
```jsx
// Multiplayer: listen for peer typing indicators
useEffect(() => {
  if (!multiplayer) return;
  const cleanup = onPeerTyping((data) => {
    setPeersTyping(prev => {
      const next = { ...prev };
      if (data.typing) {
        // Clear existing timeout for this user
        if (next[data.username]) clearTimeout(next[data.username]);
        // Auto-clear after 3s if no new typing_start
        next[data.username] = setTimeout(() => {
          setPeersTyping(p => {
            const updated = { ...p };
            delete updated[data.username];
            return updated;
          });
        }, 3000);
      } else {
        if (next[data.username]) clearTimeout(next[data.username]);
        delete next[data.username];
      }
      return next;
    });
  });
  return cleanup;
}, [multiplayer]);
```

**Emit typing on keydown** — update the existing `handleKeyDown` function (around line 74):
```jsx
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
    return;
  }
  // Emit typing indicator in multiplayer (debounced)
  if (multiplayer && campaignId) {
    if (!typingTimeoutRef.current) {
      emitTypingStart(campaignId, state.gameData.character.name || 'Player');
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(campaignId, state.gameData.character.name || 'Player');
      typingTimeoutRef.current = null;
    }, 2000);
  }
};
```

**Stop typing on send** — in the existing `handleSend` function, after `setInput('');` (around line 66):
```jsx
    // Clear typing indicator
    if (multiplayer && campaignId) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      emitTypingStop(campaignId, state.gameData.character.name || 'Player');
    }
```

**Render peer typing indicator** — after the DM streaming typing indicator (after line 156), add:
```jsx
        {multiplayer && Object.keys(peersTyping).length > 0 && !state.isStreaming && (
          <div className="typing-indicator peer-typing">
            <span>{Object.keys(peersTyping).join(', ')} {Object.keys(peersTyping).length === 1 ? 'is' : 'are'} typing</span>
            <div className="typing-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
```

- [ ] **Step 4: Add peer-typing CSS**

In `client/src/styles/chat.css`, after the existing `.typing-indicator` styles (find the typing-dots section), add:

```css
/* Peer typing — multiplayer variant */
.typing-indicator.peer-typing span:first-child {
  color: var(--msg-other-purple);
}
```

- [ ] **Step 5: Verify build**

```bash
cd client && npx vite build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add server/app/socketio_manager.py \
  client/src/services/socketService.js \
  client/src/components/chat/ChatPanel.jsx \
  client/src/styles/chat.css
git commit -m "feat: add multiplayer peer typing indicator

typing_start/typing_stop socket events broadcast to campaign room.
Frontend shows 'PlayerName is typing...' with dot animation.
Auto-clears after 3s timeout. Uses existing typing-dots CSS.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
