import React, { useState, useEffect, useRef } from 'react';

// Context
import { useGame } from './contexts/GameContext.jsx';

// Layout
import { Header, Sidebar, Footer } from './components/layout';

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


// ═══════════════════════════════════════════════════════════════
// MAIN APP — Two-Screen Layout
// ═══════════════════════════════════════════════════════════════

function App() {
  const { state } = useGame();

  const panels = {
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

  const RenderedPanel = panels[renderedPanel] || DashboardPanel;

  return (
    <React.Fragment>
      <ParticleBackground />
      <Header />
      <div className={`two-screen-layout ${state.gameData.combat.active ? 'combat-active' : ''}`}>
        <ChatPanel />
        <Sidebar />
        <div className="companion-wrapper">
          <div className="companion-content" style={{ zoom: (parseInt(state.companionTextSize || '100', 10) / 100) || 1 }}>
            <main className={`companion-main ${panelFade}`}>
              <RenderedPanel />
            </main>
            <aside className={`context-panel ${ctxFade}`}>
              <ContextPanelInner panel={renderedPanel} />
            </aside>
          </div>
        </div>
      </div>
      <Footer />
      <NotificationOverlay />
      <LevelUpOverlay />
      {state.showCampaignWizard && <CampaignWizard />}
    </React.Fragment>
  );
}

export default App;
