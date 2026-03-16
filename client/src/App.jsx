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

      <div className={`redesigned-layout ${state.gameData.combat.active ? 'combat-active' : ''}`}>
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
          onToggleCompanion={() => setCompanionOpen(true)}
          isTablet={isTablet}
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
