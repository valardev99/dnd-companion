# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the Wanderlore AI layout across single-player, multiplayer, desktop, and mobile with a chat-first design, collapsible companion panel, and hybrid message styling.

**Architecture:** Replace the current 3-column grid (`two-screen-layout`) with a 4-column desktop grid (Nav Rail | Chat | Icon Sidebar | Companion). Add new components (NavRail, StatusBar, ChannelTabs, CombatBanner). Rewrite responsive breakpoints from 1024px/768px to 1200px/768px. Mobile switches from bottom nav to horizontal top icon bar with full-screen panel takeover.

**Tech Stack:** React 19, Vite 8, CSS custom properties, no test framework (visual verification via dev server)

**Spec:** `docs/superpowers/specs/2026-03-15-ui-redesign-design.md`

---

## Chunk 1: Foundation — CSS Variables & Layout Sizing

### Task 1: Add message styling CSS variables

**Files:**
- Modify: `client/src/styles/variables.css`

- [ ] **Step 1: Add message and layout variables to variables.css**

Add these variables inside the `:root` block, after the existing `--border-bright` declaration (after line 58):

```css
  /* ═══ Message styling ═══ */
  --msg-dm-border: var(--gold-dim);
  --msg-dm-bg: rgba(42, 38, 28, 0.6);
  --msg-dm-text: var(--parchment);

  --msg-player-bg-start: rgba(42, 38, 28, 0.95);
  --msg-player-bg-end: rgba(30, 25, 15, 0.95);
  --msg-player-border: var(--gold-dim);
  --msg-player-text: var(--gold-bright);

  --msg-other-purple: #7b6bc4;
  --msg-other-purple-light: #b8aee0;
  --msg-other-bg: rgba(123, 107, 196, 0.08);

  --msg-system-bg: rgba(201, 168, 76, 0.05);
  --msg-system-border: var(--stone-light);
  --msg-system-text: var(--muted);

  --msg-enemy-bg: rgba(139, 42, 26, 0.1);
  --msg-enemy-border: rgba(139, 42, 26, 0.3);

  --channel-ooc: #5a8ab5;

  /* ═══ Layout — redesign ═══ */
  --nav-rail-width: 40px;
  --icon-sidebar-width: 48px;
```

- [ ] **Step 2: Verify variables load**

Run: `npm run dev` from `client/`
Open browser, inspect `:root` in DevTools → confirm new variables appear.

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/variables.css
git commit -m "feat: add CSS variables for message styling and new layout"
```

---

## Chunk 2: New Components

### Task 2: Create StatusBar component

**Files:**
- Create: `client/src/components/layout/StatusBar.jsx`
- Create: `client/src/styles/statusbar.css`

- [ ] **Step 1: Create StatusBar.jsx**

```jsx
import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import '../../styles/statusbar.css';

export default function StatusBar() {
  const { state, dispatch } = useGame();
  const { character } = state.gameData;
  const hp = character.hp || { current: 0, max: 1 };
  const hpPercent = Math.round((hp.current / hp.max) * 100);

  const handleClick = () => {
    dispatch({ type: 'SET_PANEL', payload: 'character' });
  };

  return (
    <div className="status-bar" onClick={handleClick} role="button" tabIndex={0}>
      <div className="status-bar-left">
        <span className="status-char-name">{character.name || 'Hero'}</span>
        {character.level && (
          <span className="status-level">Lvl {character.level}</span>
        )}
        <span className="status-label">HP</span>
        <div className="status-hp-bar">
          <div
            className="status-hp-fill"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <span className="status-hp-text">{hp.current}/{hp.max}</span>
        {character.ac && (
          <>
            <span className="status-label">AC</span>
            <span className="status-ac">{character.ac}</span>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create statusbar.css**

```css
/* ═══ STATUS BAR ═══ */
.status-bar {
  padding: 4px 12px;
  background: rgba(42, 38, 28, 0.8);
  border-bottom: 1px solid var(--border-dim);
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.status-bar:hover {
  background: rgba(42, 38, 28, 0.95);
}

.status-bar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status-char-name {
  color: var(--gold);
  font-family: Cinzel, serif;
  font-size: 0.75rem;
}

.status-level {
  color: var(--ash);
  font-size: 0.7rem;
}

.status-label {
  color: var(--ash);
  font-size: 0.65rem;
}

.status-hp-bar {
  width: 60px;
  height: 5px;
  background: var(--deep-stone);
  border-radius: 3px;
  overflow: hidden;
}

.status-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a8a4a, var(--emerald-bright));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.status-hp-text {
  color: var(--muted);
  font-size: 0.7rem;
  font-family: 'Fira Code', monospace;
}

.status-ac {
  color: var(--gold);
  font-size: 0.7rem;
  font-weight: bold;
}
```

- [ ] **Step 3: Add import to styles/index.css**

Add `@import './statusbar.css';` to `client/src/styles/index.css`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/StatusBar.jsx client/src/styles/statusbar.css client/src/styles/index.css
git commit -m "feat: add StatusBar component"
```

---

### Task 3: Create ChannelTabs component

**Files:**
- Create: `client/src/components/layout/ChannelTabs.jsx`
- Create: `client/src/styles/channel-tabs.css`

- [ ] **Step 1: Create ChannelTabs.jsx**

```jsx
import React from 'react';
import '../../styles/channel-tabs.css';

const SINGLE_PLAYER_CHANNELS = [
  { id: 'story', label: 'Story', color: 'var(--gold)' },
  { id: 'whisper', label: 'Whisper', color: 'var(--msg-other-purple)' },
];

const MULTIPLAYER_CHANNELS = [
  { id: 'story', label: 'Story', color: 'var(--gold)' },
  { id: 'ooc', label: 'OOC', color: 'var(--channel-ooc)' },
  { id: 'whisper', label: 'Whisper', color: 'var(--msg-other-purple)' },
];

export default function ChannelTabs({ activeChannel, onChannelChange, multiplayer = false, unreadChannels = {} }) {
  const channels = multiplayer ? MULTIPLAYER_CHANNELS : SINGLE_PLAYER_CHANNELS;

  return (
    <div className="channel-tabs">
      {channels.map(ch => (
        <button
          key={ch.id}
          className={`channel-tab ${activeChannel === ch.id ? 'active' : ''}`}
          style={{
            '--tab-color': ch.color,
          }}
          onClick={() => onChannelChange(ch.id)}
        >
          {ch.label}
          {unreadChannels[ch.id] && <span className="channel-unread-dot" />}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create channel-tabs.css**

```css
/* ═══ CHANNEL TABS ═══ */
.channel-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-dim);
  background: var(--obsidian);
}

.channel-tab {
  flex: 1;
  padding: 6px 16px;
  font-size: 0.75rem;
  font-family: Cinzel, serif;
  color: var(--tab-color, var(--ash));
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s, border-color 0.2s;
  position: relative;
  text-align: center;
}

.channel-tab:hover {
  opacity: 0.8;
}

.channel-tab.active {
  opacity: 1;
  border-bottom-color: var(--tab-color, var(--gold));
}

.channel-unread-dot {
  position: absolute;
  top: 4px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: var(--tab-color, var(--gold));
  border-radius: 50%;
}
```

- [ ] **Step 3: Add import to styles/index.css**

Add `@import './channel-tabs.css';` to `client/src/styles/index.css`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/ChannelTabs.jsx client/src/styles/channel-tabs.css client/src/styles/index.css
git commit -m "feat: add ChannelTabs component"
```

---

### Task 4: Create CombatBanner component

**Files:**
- Create: `client/src/components/layout/CombatBanner.jsx`
- Create: `client/src/styles/combat-banner.css`

- [ ] **Step 1: Create CombatBanner.jsx**

```jsx
import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import '../../styles/combat-banner.css';

export default function CombatBanner() {
  const { state } = useGame();
  const { combat } = state.gameData;

  if (!combat.active) return null;

  const enemies = combat.enemies || [];
  const enemySummary = enemies.length > 0
    ? enemies.map(e => e.name).join(', ')
    : 'Unknown foes';

  return (
    <div className="combat-banner">
      <div className="combat-banner-label">⚔ COMBAT</div>
      <div className="combat-banner-enemies">{enemySummary}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create combat-banner.css**

```css
/* ═══ COMBAT BANNER ═══ */
.combat-banner {
  padding: 5px 12px;
  background: linear-gradient(90deg, rgba(139, 42, 26, 0.3), rgba(139, 42, 26, 0.15));
  border-bottom: 1px solid rgba(139, 42, 26, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.combat-banner-label {
  font-size: 0.75rem;
  color: #e8c0c0;
  font-family: Cinzel, serif;
  letter-spacing: 0.06em;
}

.combat-banner-enemies {
  font-size: 0.7rem;
  color: #e8c0c0;
  font-family: 'Crimson Text', serif;
}
```

- [ ] **Step 3: Add import to styles/index.css**

Add `@import './combat-banner.css';` to `client/src/styles/index.css`.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layout/CombatBanner.jsx client/src/styles/combat-banner.css client/src/styles/index.css
git commit -m "feat: add CombatBanner component"
```

---

### Task 5: Create NavRail component

**Files:**
- Create: `client/src/components/layout/NavRail.jsx`
- Create: `client/src/styles/nav-rail.css`

- [ ] **Step 1: Create NavRail.jsx**

The NavRail needs campaign data. For now it reads from the game context. Campaign switching will dispatch a navigation event — the actual route change is handled by React Router.

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext.jsx';
import '../../styles/nav-rail.css';

export default function NavRail({ campaigns = [], activeCampaignId }) {
  const navigate = useNavigate();

  const handleCampaignClick = (campaignId) => {
    if (campaignId !== activeCampaignId) {
      navigate(`/play/campaign/${campaignId}`);
    }
  };

  const handleNewCampaign = () => {
    navigate('/play');
  };

  const handleSettings = () => {
    navigate('/play');
  };

  return (
    <nav className="nav-rail" aria-label="Campaign navigation">
      <div className="nav-rail-logo" title="Wanderlore AI">W</div>
      <div className="nav-rail-divider" />
      <div className="nav-rail-campaigns">
        {campaigns.map(c => (
          <button
            key={c.id}
            className={`nav-rail-campaign ${c.id === activeCampaignId ? 'active' : ''}`}
            onClick={() => handleCampaignClick(c.id)}
            title={c.name}
          >
            {(c.name || 'C')[0].toUpperCase()}
          </button>
        ))}
      </div>
      <div className="nav-rail-bottom">
        <button className="nav-rail-action" onClick={handleNewCampaign} title="New Campaign">+</button>
        <button className="nav-rail-action" onClick={handleSettings} title="Settings">⚙</button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create nav-rail.css**

```css
/* ═══ NAV RAIL ═══ */
.nav-rail {
  width: var(--nav-rail-width);
  background: #08080c;
  border-right: 1px solid rgba(201, 168, 76, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 6px;
  flex-shrink: 0;
}

.nav-rail-logo {
  width: 24px;
  height: 24px;
  background: rgba(201, 168, 76, 0.15);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--gold);
  font-family: Cinzel, serif;
  font-weight: bold;
}

.nav-rail-divider {
  width: 16px;
  height: 1px;
  background: var(--border-dim);
  margin: 2px 0;
}

.nav-rail-campaigns {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

.nav-rail-campaigns::-webkit-scrollbar {
  display: none;
}

.nav-rail-campaign {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: var(--ash);
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-rail-campaign:hover {
  color: var(--gold);
  background: rgba(201, 168, 76, 0.08);
}

.nav-rail-campaign.active {
  color: var(--gold);
  background: rgba(201, 168, 76, 0.12);
  border-color: rgba(201, 168, 76, 0.3);
}

.nav-rail-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nav-rail-action {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--ash);
  background: none;
  border: 1px dashed var(--border-dim);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-rail-action:hover {
  color: var(--gold);
  border-color: var(--border-gold);
}
```

- [ ] **Step 3: Add import to styles/index.css**

Add `@import './nav-rail.css';` to `client/src/styles/index.css`.

- [ ] **Step 4: Export NavRail from layout index**

Update `client/src/components/layout/index.js` to export `NavRail` and `StatusBar`:

```js
export { default as Header } from './Header.jsx';
export { default as Sidebar } from './Sidebar.jsx';
export { default as Footer } from './Footer.jsx';
export { default as MobileNav } from './MobileNav.jsx';
export { default as NavRail } from './NavRail.jsx';
export { default as StatusBar } from './StatusBar.jsx';
export { default as ChannelTabs } from './ChannelTabs.jsx';
export { default as CombatBanner } from './CombatBanner.jsx';
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/layout/NavRail.jsx client/src/styles/nav-rail.css client/src/components/layout/index.js client/src/styles/index.css
git commit -m "feat: add NavRail component for campaign switching"
```

---

## Chunk 3: Layout Rewrite

### Task 6: Rewrite App.jsx layout grid

**Files:**
- Modify: `client/src/App.jsx`

This is the central change. The current `App.jsx` renders:
```
Header → two-screen-layout (ChatPanel | Sidebar | companion-wrapper) → Footer → MobileNav
```

The new structure renders:
```
Header (modified top bar) → redesigned-layout (NavRail | chat-area (StatusBar + ChannelTabs + CombatBanner + ChatPanel) | Sidebar | companion-wrapper) → Footer
```

- [ ] **Step 1: Rewrite App.jsx**

Replace the entire content of `client/src/App.jsx` with:

```jsx
import React, { useState, useEffect, useRef } from 'react';

// Context
import { useGame } from './contexts/GameContext.jsx';

// Layout
import { Header, Sidebar, Footer, NavRail, StatusBar, ChannelTabs, CombatBanner } from './components/layout';

// Effects
import { ParticleBackground, NotificationOverlay, LevelUpOverlay } from './components/effects';

// Panels
import {
  DashboardPanel,
  CharacterPanel,
  InventoryPanel,
  QuestPanel,
  NPCPanel,
  CombatPanel,
  MapPanel,
  CodexPanel,
  JournalPanel,
  SettingsPanel,
} from './components/panels';

// Context sidebar
import { ContextPanelInner } from './components/context';

// Chat
import ChatPanel from './components/chat/ChatPanel.jsx';

// Campaign Wizard
import CampaignWizard from './components/CampaignWizard.jsx';

// Panel registry
const PANEL_MAP = {
  dashboard: DashboardPanel,
  character: CharacterPanel,
  inventory: InventoryPanel,
  quests: QuestPanel,
  npcs: NPCPanel,
  combat: CombatPanel,
  map: MapPanel,
  codex: CodexPanel,
  journal: JournalPanel,
  settings: SettingsPanel,
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP — Redesigned Layout
// ═══════════════════════════════════════════════════════════════

function App() {
  const { state, dispatch } = useGame();

  // Channel state
  const [activeChannel, setActiveChannel] = useState('story');

  // Companion visibility (desktop: open, tablet: closed, mobile: full-screen)
  const [companionOpen, setCompanionOpen] = useState(true);

  // Tablet detection for overlay behavior
  const [isTablet, setIsTablet] = useState(false);

  // Mobile panel view — null means chat is showing, string means panel is open
  const [mobilePanelOpen, setMobilePanelOpen] = useState(null);

  // Breakpoint listener — manages companion visibility by screen width
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      const tablet = width >= 768 && width < 1200;
      setIsTablet(tablet);
      if (width >= 1200) setCompanionOpen(true);
      if (tablet) setCompanionOpen(false);
    };
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  // Escape key closes tablet overlay
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isTablet && companionOpen) {
        setCompanionOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isTablet, companionOpen]);

  // Panel transition animation
  const [panelFade, setPanelFade] = useState('panel-active');
  const [ctxFade, setCtxFade] = useState('ctx-active');
  const [renderedPanel, setRenderedPanel] = useState(state.activePanel);
  const prevPanelRef = useRef(state.activePanel);

  useEffect(() => {
    if (state.activePanel !== prevPanelRef.current) {
      setPanelFade('panel-exiting');
      setCtxFade('ctx-exiting');
      setTimeout(() => {
        setRenderedPanel(state.activePanel);
        setPanelFade('panel-entering');
        setCtxFade('ctx-entering');
        setTimeout(() => {
          setPanelFade('panel-active');
          setCtxFade('ctx-active');
        }, 250);
      }, 200);
      prevPanelRef.current = state.activePanel;
    }
  }, [state.activePanel]);

  // On mobile, opening a panel via the icon bar
  const handleMobilePanelSelect = (panelId) => {
    dispatch({ type: 'SET_PANEL', payload: panelId });
    setMobilePanelOpen(panelId);
  };

  const handleMobilePanelClose = () => {
    setMobilePanelOpen(null);
  };

  const RenderedPanel = PANEL_MAP[renderedPanel] || DashboardPanel;

  return (
    <React.Fragment>
      <ParticleBackground />
      <Header />

      <div className="redesigned-layout">
        {/* Nav Rail — campaign switching (hidden on mobile via CSS) */}
        <NavRail activeCampaignId={state.campaignId} campaigns={[]} />

        {/* Chat Area — always visible on desktop/tablet, hidden when mobile panel open */}
        <div className={`chat-area ${mobilePanelOpen ? 'mobile-hidden' : ''}`}>
          <StatusBar />
          <CombatBanner />
          <ChannelTabs
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
          <ChatPanel />
        </div>

        {/* Icon Sidebar — vertical on desktop/tablet, horizontal on mobile via CSS */}
        <Sidebar
          onMobilePanelSelect={handleMobilePanelSelect}
          mobilePanelOpen={mobilePanelOpen}
        />

        {/* Tablet backdrop — rendered when companion overlays on tablet */}
        {isTablet && companionOpen && (
          <div
            className="companion-backdrop visible"
            onClick={() => setCompanionOpen(false)}
          />
        )}

        {/* Companion Panel — always in DOM, visibility controlled via CSS classes
            (conditional rendering would break CSS transitions for tablet overlay) */}
        <div className={`companion-wrapper ${companionOpen ? 'companion-visible' : 'companion-hidden'} ${isTablet ? 'tablet-mode' : ''}`}>
          <div className="companion-header">
            <span className="companion-title">
              {(renderedPanel || 'dashboard').toUpperCase()}
            </span>
            <button
              className="companion-close"
              onClick={() => setCompanionOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="companion-content" style={{ zoom: (parseInt(state.companionTextSize || '100', 10) / 100) || 1 }}>
            <main className={`companion-main ${panelFade}`}>
              <RenderedPanel />
            </main>
            <aside className={`context-panel ${ctxFade}`}>
              <ContextPanelInner panel={renderedPanel} />
            </aside>
          </div>
        </div>

        {/* Mobile full-screen panel overlay */}
        {mobilePanelOpen && (
          <div className="mobile-panel-overlay">
            <div className="mobile-panel-header">
              <button className="mobile-panel-back" onClick={handleMobilePanelClose}>←</button>
              <span className="mobile-panel-title">
                {(renderedPanel || 'dashboard').toUpperCase()}
              </span>
              <button className="mobile-panel-close" onClick={handleMobilePanelClose}>✕</button>
            </div>
            <div className="mobile-panel-content" style={{ zoom: (parseInt(state.companionTextSize || '100', 10) / 100) || 1 }}>
              <RenderedPanel />
            </div>
          </div>
        )}
      </div>

      <Footer />
      <NotificationOverlay />
      <LevelUpOverlay />
      {state.showCampaignWizard && <CampaignWizard />}
    </React.Fragment>
  );
}

export default App;
```

- [ ] **Step 2: Verify the app loads**

Run: `npm run dev` from `client/`
Open browser at `http://localhost:5173/play/campaign/<any-id>`.
Expect: Layout will look broken at this point because CSS hasn't been updated yet. Confirm no JS console errors — the component tree is rendering.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: rewrite App.jsx with redesigned 4-column layout"
```

---

### Task 7: Update Sidebar for new grid position + mobile horizontal mode

**Files:**
- Modify: `client/src/components/layout/Sidebar.jsx`

The Sidebar currently renders a vertical icon strip. It stays vertical on desktop/tablet (position 3 in the grid, between chat and companion). On mobile (<768px), CSS will transform it to a horizontal bar at the top. The component needs to accept props for mobile panel selection.

- [ ] **Step 1: Update Sidebar.jsx**

Replace the content of `client/src/components/layout/Sidebar.jsx`:

```jsx
import React from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { PANELS } from '../../data/panels.js';
import GAME_ICONS from '../shared/GameIcons.jsx';

export default function Sidebar({ onMobilePanelSelect, mobilePanelOpen }) {
  const { state, dispatch } = useGame();

  const handleClick = (panelId) => {
    dispatch({ type: 'SET_PANEL', payload: panelId });
    // On mobile, also trigger full-screen panel
    if (onMobilePanelSelect) {
      onMobilePanelSelect(panelId);
    }
  };

  return (
    <div className="icon-sidebar" role="navigation" aria-label="Panel navigation">
      {PANELS.map(panel => {
        const Icon = GAME_ICONS[panel.id];
        const isActive = state.activePanel === panel.id;
        return (
          <button
            key={panel.id}
            className={`icon-sidebar-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(panel.id)}
            title={panel.label}
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

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/Sidebar.jsx
git commit -m "feat: update Sidebar for new grid position and mobile props"
```

---

### Task 8: Rewrite layout.css for new grid

**Files:**
- Modify: `client/src/styles/layout.css`

- [ ] **Step 1: Rewrite layout.css**

Replace the content of `client/src/styles/layout.css`. Keep the footer section, context-panel base rules, and particles canvas. Replace the grid and companion sections:

```css
/* ═══════════════════════════════════════════════════════════════
   LAYOUT — Redesigned 4-column grid
   ═══════════════════════════════════════════════════════════════ */

/* ═══ APP LAYOUT (legacy — kept for non-game pages) ═══ */
.app-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ═══ REDESIGNED LAYOUT ═══ */
.redesigned-layout {
  display: grid;
  grid-template-columns: var(--nav-rail-width) 1fr var(--icon-sidebar-width) minmax(280px, 35%);
  flex: 1;
  overflow: hidden;
}

/* ═══ CHAT AREA ═══ */
.chat-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ═══ ICON SIDEBAR ═══ */
.icon-sidebar {
  background: var(--obsidian);
  border-left: 1px solid rgba(201, 168, 76, 0.08);
  border-right: 1px solid rgba(201, 168, 76, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 4px;
  flex-shrink: 0;
}

.icon-sidebar-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-right: 2px solid transparent;
  color: var(--ash);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.icon-sidebar-btn:hover {
  color: var(--gold);
  background: rgba(201, 168, 76, 0.06);
}

.icon-sidebar-btn.active {
  color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
  border-right-color: var(--gold);
}

.icon-sidebar-btn svg {
  width: 16px;
  height: 16px;
}

/* ═══ COMPANION WRAPPER ═══ */
.companion-wrapper {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--void);
}

.companion-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-dim);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.companion-title {
  font-family: Cinzel, serif;
  font-size: 0.7rem;
  color: var(--gold);
  letter-spacing: 0.08em;
}

.companion-close {
  background: none;
  border: none;
  color: var(--ash);
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 0.2s;
}

.companion-close:hover {
  color: var(--gold);
}

.companion-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.companion-main {
  flex: 1 0 auto;
  overflow-x: hidden;
  padding: 16px 18px;
  position: relative;
}

/* Context panel inside companion */
.companion-content > .context-panel {
  width: 100%;
  background: var(--void);
  border-top: 1px solid var(--border-dim);
  border-left: none;
  overflow-y: visible;
  padding: 14px 18px;
  flex-shrink: 0;
}

/* ═══ MAIN CONTENT (non-game pages) ═══ */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px;
  position: relative;
}

/* ═══ CONTEXT PANEL (standalone) ═══ */
.context-panel {
  width: var(--context-width);
  background: var(--void);
  border-left: 1px solid var(--border-dim);
  overflow-y: auto;
  padding: 16px;
  flex-shrink: 0;
}

.context-panel h3 {
  font-size: 0.85rem;
  color: var(--gold);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ═══ MOBILE PANEL OVERLAY ═══ */
.mobile-panel-overlay {
  display: none; /* Shown via responsive.css on mobile */
}

.mobile-panel-header {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-dim);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(180deg, rgba(20, 16, 8, 0.9), rgba(10, 10, 15, 0.9));
}

.mobile-panel-back,
.mobile-panel-close {
  background: none;
  border: none;
  color: var(--ash);
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.2s;
}

.mobile-panel-back:hover,
.mobile-panel-close:hover {
  color: var(--gold);
}

.mobile-panel-title {
  font-family: Cinzel, serif;
  font-size: 0.7rem;
  color: var(--gold);
  letter-spacing: 0.05em;
}

.mobile-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* ═══ SEARCH (shared) ═══ */
.search-input {
  width: 100%;
  padding: 8px 12px;
  padding-left: 32px;
  background: transparent;
  border: 6px solid var(--stone);
  border-image-source: var(--wc-input-frame);
  border-image-slice: 16 fill;
  border-image-repeat: stretch;
  border-radius: 0;
  color: var(--parchment);
  font-size: 0.8rem;
  outline: none;
  transition: filter 0.2s;
}

.search-input:focus { filter: brightness(1.15); }
.search-input::placeholder { color: var(--ash); }

.search-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 0.8rem;
}

/* ═══ PARTICLES CANVAS ═══ */
.particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  opacity: 0.4;
}

/* Subtle parchment texture overlay */
.main-content::before,
.companion-main::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(201, 168, 76, 0.02) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(201, 168, 76, 0.015) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(139, 42, 26, 0.01) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* ═══ FOOTER ═══ */
.app-footer {
  height: 28px;
  background: linear-gradient(180deg, #141008, #0c0a06);
  border-top: 2px solid var(--gold-dim);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 0.65rem;
  color: var(--muted);
  font-family: 'Fira Code', monospace;
  z-index: 50;
  position: relative;
  overflow: hidden;
}

.app-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(201, 168, 76, 0.03) 30%, rgba(201, 168, 76, 0.06) 50%, rgba(201, 168, 76, 0.03) 70%, transparent 100%);
  background-size: 200% 100%;
  animation: footer-breathe 8s ease-in-out infinite;
  pointer-events: none;
}

.footer-status { display: flex; align-items: center; gap: 6px; }
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--emerald);
  animation: pulse-subtle 2s ease-in-out infinite;
}

.footer-api-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-api-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.footer-api-dot.connected { background: var(--emerald); animation: pulse-subtle 2s ease-in-out infinite; }
.footer-api-dot.disconnected { background: var(--crimson); }
.footer-api-dot.streaming { background: var(--gold); animation: pulse-subtle 0.5s ease-in-out infinite; }

/* ═══ COMPANION VISIBILITY ═══ */
.companion-wrapper.companion-hidden {
  display: none;
}

.companion-wrapper.companion-visible {
  display: flex;
}

/* Tablet overlay mode */
.companion-wrapper.tablet-mode {
  position: fixed;
  right: 0;
  top: var(--header-height);
  bottom: 28px;
  width: min(380px, 85vw);
  z-index: var(--z-context);
  border-left: 1px solid var(--border-dim);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.companion-wrapper.tablet-mode.companion-visible {
  transform: translateX(0);
  display: flex;
}

.companion-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-context) - 1);
}

/* ═══ TWO COLUMN LAYOUT (for panels like codex) ═══ */
.two-col {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
}
```

- [ ] **Step 2: Verify layout grid renders**

Refresh browser. The 4-column grid should now be visible: nav rail on left, chat area, icon sidebar, companion panel. Styling may still be rough but the structure should be correct.

- [ ] **Step 3: Commit**

```bash
git add client/src/styles/layout.css
git commit -m "feat: rewrite layout.css for 4-column redesigned grid"
```

---

## Chunk 4: Message Styling

### Task 9: Restyle chat messages to hybrid format

**Files:**
- Modify: `client/src/styles/chat.css`
- Modify: `client/src/components/chat/ChatPanel.jsx`

The current ChatPanel uses `.message-bubble` with `.dm`, `.player`, `.system` modifiers and WoW border-image frames on all messages. The new design uses:
- DM narration → left-border, no frame
- Player action → WoW framed bubble
- System → centered minimal

- [ ] **Step 1: Update message CSS classes in chat.css**

Find the existing message bubble section in `client/src/styles/chat.css` and replace the `.message-bubble` styles. Keep the chat input, welcome screen, and typing indicator styles. Replace the message styling section with:

```css
/* ═══ MESSAGE STYLES — Hybrid Format ═══ */

/* Base message */
.chat-message {
  margin-bottom: 8px;
}

/* DM Narration — left border, clean */
.chat-message.dm-narration {
  background: var(--msg-dm-bg);
  border-left: 3px solid var(--msg-dm-border);
  border-radius: 0 4px 4px 0;
  padding: 10px 12px;
}

.chat-message.dm-narration .msg-sender {
  font-size: 0.65rem;
  color: var(--gold);
  font-family: Cinzel, serif;
  margin-bottom: 3px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chat-message.dm-narration .msg-body {
  font-size: 0.8rem;
  color: var(--msg-dm-text);
  font-style: italic;
  font-family: 'Crimson Text', serif;
  line-height: 1.5;
}

/* Player Action — WoW framed bubble */
.chat-message.player-action {
  background: linear-gradient(135deg, var(--msg-player-bg-start), var(--msg-player-bg-end));
  border: 2px solid var(--msg-player-border);
  border-radius: 6px;
  padding: 10px 12px;
  margin-left: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.chat-message.player-action .msg-sender {
  font-size: 0.65rem;
  color: var(--gold);
  font-family: Cinzel, serif;
  margin-bottom: 3px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chat-message.player-action .msg-body {
  font-size: 0.8rem;
  color: var(--msg-player-text);
  font-family: 'Crimson Text', serif;
  line-height: 1.5;
}

/* Other Player — purple left border (multiplayer) */
.chat-message.other-player {
  background: var(--msg-other-bg);
  border-left: 3px solid var(--msg-other-purple);
  border-radius: 0 4px 4px 0;
  padding: 10px 12px;
}

.chat-message.other-player .msg-sender {
  font-size: 0.65rem;
  color: var(--msg-other-purple);
  font-family: Cinzel, serif;
  margin-bottom: 3px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.chat-message.other-player .msg-body {
  font-size: 0.8rem;
  color: var(--msg-other-purple-light);
  font-family: 'Crimson Text', serif;
  line-height: 1.5;
}

/* System Message — centered, minimal */
.chat-message.system-msg {
  background: var(--msg-system-bg);
  border: 1px solid var(--msg-system-border);
  border-radius: 4px;
  padding: 4px 8px;
  text-align: center;
  align-self: center;
  margin: 4px auto;
  width: fit-content;
}

.chat-message.system-msg .msg-body {
  font-size: 0.7rem;
  color: var(--msg-system-text);
  font-family: 'Fira Code', monospace;
}

.chat-message.system-msg .msg-highlight {
  color: var(--gold);
  font-weight: bold;
}

/* Enemy HP — combat inline */
.chat-message.enemy-hp {
  background: var(--msg-enemy-bg);
  border: 1px solid var(--msg-enemy-border);
  border-radius: 4px;
  padding: 6px 10px;
  margin: 4px 0;
}

.enemy-hp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.enemy-hp-name {
  font-size: 0.65rem;
  color: #e8c0c0;
  font-family: Cinzel, serif;
}

.enemy-hp-status {
  font-size: 0.65rem;
  color: var(--crimson-bright);
}

.enemy-hp-bar {
  width: 100%;
  height: 4px;
  background: var(--deep-stone);
  border-radius: 2px;
  overflow: hidden;
}

.enemy-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--crimson-bright), var(--crimson));
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

- [ ] **Step 2: Update ChatPanel.jsx message rendering**

In `client/src/components/chat/ChatPanel.jsx`, update the message rendering section to use the new CSS classes. Find the message map in the JSX (around line 110-140) and update the message wrapper classes:

Replace the existing message rendering block (lines 107-124 of ChatPanel.jsx) with:

```jsx
{state.chatMessages.map((msg, i) => {
  // Determine message type for styling
  let messageClass = 'chat-message';
  let senderName = '';

  if (msg.role === 'dm' && msg.isMultiplayer && msg.playerName) {
    // Other player's action relayed by DM (multiplayer)
    messageClass += ' other-player';
    senderName = msg.playerName;
  } else if (msg.role === 'dm') {
    messageClass += ' dm-narration';
    senderName = 'Dungeon Master';
  } else if (msg.role === 'player') {
    messageClass += ' player-action';
    senderName = multiplayer && msg.playerName ? msg.playerName : (state.gameData.character.name || 'You');
  } else if (msg.role === 'system') {
    messageClass += ' system-msg';
  }

  const isStreaming = state.isStreaming && i === state.chatMessages.length - 1;
  const content = msg.content || (isStreaming ? '' : '');

  return (
    <React.Fragment key={msg.id || i}>
      <div className={messageClass}>
        {msg.role !== 'system' && (
          <div className="msg-sender">{senderName}</div>
        )}
        <div className="msg-body">
          {msg.role === 'dm' && !msg.isMultiplayer ? formatDMText(content) : content}
        </div>
      </div>
      {/* Preserve SessionRating after completed DM messages */}
      {msg.role === 'dm' && msg.content && !isStreaming && i === state.chatMessages.length - 1 && (
        <SessionRating messageId={msg.id} />
      )}
    </React.Fragment>
  );
})}
```

**Key differences from current code:**
- Uses new CSS classes (`dm-narration`, `player-action`, `other-player`, `system-msg`) instead of old `message-bubble dm/player/system-msg`
- Detects other-player messages via existing data shape: `role === 'dm'` with `isMultiplayer && playerName`
- Preserves `SessionRating` widget after completed DM messages
- Preserves streaming-aware empty content handling
- Uses `msg-sender` / `msg-body` class names instead of old `message-sender` / `message-content`

**Important:** Keep the existing `formatDMText` import, `messagesEndRef`, `messagesContainerRef`, scroll logic, typing indicator, welcome screen, input bar, and `SessionRating` import untouched. Only modify the message rendering loop.

- [ ] **Step 3: Verify messages render with new styling**

Refresh browser. Open a campaign. Messages should show DM text with gold left-border (italic), player messages in framed bubbles, system messages centered.

- [ ] **Step 4: Commit**

```bash
git add client/src/styles/chat.css client/src/components/chat/ChatPanel.jsx
git commit -m "feat: restyle chat messages to hybrid format"
```

---

## Chunk 5: Responsive CSS

### Task 10: Rewrite responsive.css for new breakpoints

**Files:**
- Modify: `client/src/styles/responsive.css`

This is the largest single file change. The current 1134-line responsive.css targets the old `two-screen-layout` class and old breakpoints (1024px, 768px). It needs a full rewrite targeting the new `redesigned-layout` class and new breakpoints (1200px, 768px).

- [ ] **Step 1: Rewrite responsive.css**

Replace the entire content of `client/src/styles/responsive.css`. Key breakpoints:

```css
/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE — New breakpoints: 1200px (desktop), 768px (mobile)
   ═══════════════════════════════════════════════════════════════ */

/* ═══ TABLET: 768px – 1199px ═══ */
@media (max-width: 1199px) {
  /* Companion removed from grid — handled via fixed positioning in layout.css tablet-mode class */
  .redesigned-layout {
    grid-template-columns: var(--nav-rail-width) 1fr var(--icon-sidebar-width);
  }

  /* Chat message indent reduction */
  .chat-message.player-action {
    margin-left: 16px;
  }

  /* ── Panel content responsive (tablet) ── */
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .combat-grid {
    grid-template-columns: 1fr;
  }

  .map-container {
    height: 300px;
  }

  .two-col {
    grid-template-columns: 160px 1fr;
  }
}

/* ═══ MOBILE: <768px ═══ */
@media (max-width: 767px) {
  /* Full-screen chat, no grid */
  .redesigned-layout {
    display: flex;
    flex-direction: column;
    grid-template-columns: none;
  }

  /* Hide nav rail on mobile */
  .nav-rail {
    display: none;
  }

  /* Icon sidebar becomes horizontal top bar */
  .icon-sidebar {
    flex-direction: row;
    width: 100%;
    padding: 4px 8px;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid rgba(201, 168, 76, 0.08);
    order: -1; /* Move to top */
  }

  .icon-sidebar::-webkit-scrollbar {
    display: none;
  }

  .icon-sidebar-btn {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-right: none;
    border-bottom: 2px solid transparent;
  }

  .icon-sidebar-btn.active {
    border-right: none;
    border-bottom-color: var(--gold);
  }

  /* Fade gradient for scrollable icon bar */
  .icon-sidebar::after {
    content: '';
    position: sticky;
    right: 0;
    flex-shrink: 0;
    width: 20px;
    background: linear-gradient(to left, var(--obsidian), transparent);
    pointer-events: none;
  }

  /* Chat area fills remaining space */
  .chat-area {
    flex: 1;
    order: 0;
  }

  .chat-area.mobile-hidden {
    display: none;
  }

  /* Hide companion wrapper on mobile — use overlay instead */
  .companion-wrapper {
    display: none;
  }

  /* Mobile panel overlay */
  .mobile-panel-overlay {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--void);
    z-index: var(--z-context);
  }

  /* Mobile-specific message adjustments */
  .chat-message.player-action {
    margin-left: 16px;
  }

  /* Status bar compact */
  .status-bar {
    padding: 3px 10px;
  }

  .status-hp-bar {
    width: 40px;
    height: 4px;
  }

  .status-bar-left {
    gap: 6px;
  }

  .status-char-name {
    font-size: 0.7rem;
  }

  /* Channel tabs compact */
  .channel-tab {
    padding: 5px 10px;
    font-size: 0.7rem;
  }

  /* Hide footer on mobile */
  .app-footer {
    display: none;
  }

  /* Adjust header for mobile */
  .app-header {
    height: 48px;
  }
}

  /* ── Panel content responsive (mobile) ── */
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-block .stat-value {
    font-size: 1.2rem;
  }

  .combat-grid {
    grid-template-columns: 1fr;
  }

  .map-container {
    height: 250px;
  }

  .two-col {
    grid-template-columns: 1fr;
  }

  .codex-sidebar {
    max-height: 150px;
    overflow-y: auto;
    margin-bottom: 12px;
  }

  .npc-card {
    padding: 8px;
  }

  .quest-entry {
    padding: 8px;
  }

  .wizard-container {
    padding: 16px;
  }

  .wizard-option-grid.cols-2,
  .wizard-option-grid.cols-3,
  .wizard-option-grid.cols-4,
  .wizard-option-grid.cols-5 {
    grid-template-columns: 1fr;
  }
}

/* ═══ SMALL PHONE: <360px ═══ */
@media (max-width: 359px) {
  .status-bar-left {
    gap: 4px;
  }

  .status-char-name {
    font-size: 0.65rem;
  }

  .status-hp-bar {
    width: 30px;
  }

  .chat-message.dm-narration .msg-body,
  .chat-message.player-action .msg-body {
    font-size: 0.75rem;
  }
}

/* ═══ LANDSCAPE SHORT SCREENS ═══ */
@media (max-height: 500px) and (max-width: 767px) {
  .app-header {
    height: 40px;
  }

  .status-bar {
    padding: 2px 10px;
  }

  .icon-sidebar {
    padding: 2px 8px;
  }
}
```

**Note:** This is a starting point. The old responsive.css had 1134 lines of rules targeting `.two-screen-layout`, `.sidebar`, `.mobile-nav`, `.companion-wrapper`, etc. Many of those rules targeted classes that no longer exist. This rewrite covers the core responsive behavior. Additional panel-specific responsive rules from the old file (e.g., `.codex-list`, `.quest-card` sizing) should be preserved — check the old file and carry forward any panel content responsive rules that don't reference old layout classes.

- [ ] **Step 2: Check for panel-specific responsive rules to preserve**

Read the old `responsive.css` (before this rewrite) and identify any rules targeting panel content classes (e.g., `.stat-block`, `.quest-card`, `.npc-grid`, `.codex-list`). Add these to the end of the new responsive.css under a `/* ═══ PANEL CONTENT RESPONSIVE ═══ */` section.

- [ ] **Step 3: Verify responsive behavior**

Open browser at various widths:
- **≥1200px:** 4-column grid with companion visible
- **768–1199px:** 3-column grid, companion hidden
- **<768px:** Mobile layout with horizontal icon bar at top

- [ ] **Step 4: Commit**

```bash
git add client/src/styles/responsive.css
git commit -m "feat: rewrite responsive.css for new layout breakpoints"
```

---

### Task 11: Update sidebar.css for new icon-sidebar class

**Files:**
- Modify: `client/src/styles/sidebar.css`

The old `sidebar.css` targets the `.sidebar` class. The new class is `.icon-sidebar` and most styling is now in `layout.css`. Update sidebar.css to either redirect to the new class or remove duplicate rules.

- [ ] **Step 1: Clean up sidebar.css**

Review `client/src/styles/sidebar.css`. Remove any rules that now conflict with `.icon-sidebar` rules in `layout.css`. Keep tooltip styles if they exist. Remove `.sidebar` rules since the class has been renamed.

The old Sidebar component's tooltip system should be preserved — carry forward any `.sidebar-tooltip` or tooltip-related CSS.

- [ ] **Step 2: Commit**

```bash
git add client/src/styles/sidebar.css
git commit -m "refactor: clean up sidebar.css for renamed icon-sidebar class"
```

---

## Chunk 6: Cleanup & Integration

### Task 12: Remove old MobileNav dependency

**Files:**
- Modify: `client/src/App.jsx` (already done in Task 6 — MobileNav import removed)
- Note: `MobileNav.jsx` file kept for now (no file deletion without confirmation)

The MobileNav component is no longer imported or rendered in App.jsx as of Task 6. Its CSS in responsive.css has been replaced. The component file itself (`MobileNav.jsx`) can remain in the codebase as dead code until a cleanup pass.

- [ ] **Step 1: Verify MobileNav is not imported anywhere**

Search codebase for `MobileNav` imports. If only `layout/index.js` re-exports it (and App.jsx no longer imports it), it's safely unused.

- [ ] **Step 2: Remove MobileNav export from layout/index.js**

Update `client/src/components/layout/index.js`:

```js
export { default as Header } from './Header.jsx';
export { default as Sidebar } from './Sidebar.jsx';
export { default as Footer } from './Footer.jsx';
export { default as NavRail } from './NavRail.jsx';
export { default as StatusBar } from './StatusBar.jsx';
export { default as ChannelTabs } from './ChannelTabs.jsx';
export { default as CombatBanner } from './CombatBanner.jsx';
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/index.js
git commit -m "refactor: remove MobileNav export from layout index"
```

---

### Task 13: Remove old two-screen-layout references

**Files:**
- Verify: `client/src/styles/layout.css` (already replaced in Task 8)
- Verify: `client/src/styles/responsive.css` (already replaced in Task 10)

- [ ] **Step 1: Search for remaining two-screen-layout references**

Search codebase for `two-screen-layout`. If any CSS or JSX files still reference it, update them to use `redesigned-layout` or remove the reference.

Run: `grep -r "two-screen-layout" client/src/`

Fix any remaining references found.

- [ ] **Step 2: Search for old .sidebar class references**

Run: `grep -r "\.sidebar[^-]" client/src/styles/`

Any remaining `.sidebar` class references (not `.icon-sidebar`) in CSS files need to be updated or removed.

- [ ] **Step 3: Commit**

```bash
git add -A client/src/styles/
git commit -m "refactor: remove all old two-screen-layout and .sidebar references"
```

---

### Task 14: Wire Sidebar to toggle companion on tablet

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/layout/Sidebar.jsx`

The tablet breakpoint detection, escape handler, backdrop, and companion CSS classes were already added in Tasks 6 and 8. This task wires the Sidebar to open the companion when an icon is clicked on tablet.

- [ ] **Step 1: Pass onToggleCompanion to Sidebar in App.jsx**

In the `<Sidebar>` JSX in App.jsx, add the prop:

```jsx
<Sidebar
  onMobilePanelSelect={handleMobilePanelSelect}
  mobilePanelOpen={mobilePanelOpen}
  onToggleCompanion={() => setCompanionOpen(true)}
  isTablet={isTablet}
/>
```

- [ ] **Step 2: Update Sidebar.jsx to call onToggleCompanion on tablet**

In Sidebar's `handleClick` function, add:

```jsx
const handleClick = (panelId) => {
  dispatch({ type: 'SET_PANEL', payload: panelId });
  if (onMobilePanelSelect && window.innerWidth < 768) {
    onMobilePanelSelect(panelId);
  } else if (onToggleCompanion && isTablet) {
    onToggleCompanion();
  }
};
```

Update the component signature to accept the new props:

```jsx
export default function Sidebar({ onMobilePanelSelect, mobilePanelOpen, onToggleCompanion, isTablet }) {
```

- [ ] **Step 3: Verify tablet overlay behavior**

Resize browser to 800px–1100px width. Click an icon sidebar button — companion should slide in from right with backdrop. Click backdrop or press Escape to dismiss.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/components/layout/Sidebar.jsx
git commit -m "feat: wire Sidebar to toggle companion overlay on tablet"
```

---

### Task 15: Final visual verification pass

**Files:** None (verification only)

- [ ] **Step 1: Desktop verification (≥1200px)**

Open browser at full desktop width. Verify:
- 4-column grid renders: nav rail | chat | icon sidebar | companion
- Status bar shows character name, HP bar, AC
- Channel tabs show Story + Whisper
- Messages use hybrid styling (DM = left border, player = framed bubble, system = centered)
- Icon sidebar highlights active panel
- Clicking icon switches companion content
- Companion has close button, closing hides it
- Footer visible

- [ ] **Step 2: Tablet verification (768–1199px)**

Resize to ~900px. Verify:
- 3-column grid: nav rail | chat | icon sidebar
- Companion hidden
- Clicking icon opens companion as overlay with backdrop
- Clicking backdrop or Escape closes overlay
- Messages render correctly at narrower width

- [ ] **Step 3: Mobile verification (<768px)**

Resize to ~390px or use mobile emulation. Verify:
- Horizontal icon bar at top
- Chat fills screen below
- Tapping icon opens full-screen panel
- Back arrow returns to chat
- No bottom nav bar
- Footer hidden
- Status bar compact

- [ ] **Step 4: Final commit with any fixes**

If visual issues found, fix and commit with descriptive message.

```bash
git add -A
git commit -m "fix: visual polish from verification pass"
```

---

## Known Gaps (deferred to follow-up tasks)

These are spec requirements not covered in this plan because they depend on additional infrastructure:

1. **Channel tab scroll position preservation** — Spec Section 3.3 says "switching tabs preserves scroll position per tab." Implementation requires storing scroll positions per channel in state and restoring on tab switch. Add to ChatPanel after the base redesign is working.

2. **Multiplayer typing indicator** — Spec Section 7 lists "[Name] is typing..." above input. This depends on the Socket.IO `typing` event from `socketService.js`. Add after the base layout redesign is validated.

3. **Mobile campaign switching** — Spec Section 5.1 says "Campaign switching moves to a menu accessible from the top bar" since the nav rail is hidden on mobile. The NavRail component is hidden via CSS, but no mobile campaign menu has been added to the Header component. Add a campaign dropdown or hamburger menu to Header for mobile in a follow-up.

4. **Sidebar tooltip removal** — The current Sidebar.jsx has a custom hover tooltip system (showing panel labels on hover with fixed positioning). The plan's rewrite replaces this with native `title` attributes. If the custom tooltips are desired, re-add them as a follow-up.

5. **`--sidebar-width` variable cleanup** — The existing `--sidebar-width: 64px` variable is now unused (replaced by `--icon-sidebar-width: 48px`). Clean up in a follow-up pass to avoid confusion.
