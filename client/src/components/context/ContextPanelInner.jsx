import React from 'react';
import ContextDashboard from './ContextDashboard.jsx';
import ContextCharacter from './ContextCharacter.jsx';
import ContextInventory from './ContextInventory.jsx';
import ContextQuest from './ContextQuest.jsx';
import ContextNPC from './ContextNPC.jsx';
import ContextCombat from './ContextCombat.jsx';
import ContextMap from './ContextMap.jsx';
import ContextCodex from './ContextCodex.jsx';
import ContextJournal from './ContextJournal.jsx';
import ContextSettings from './ContextSettings.jsx';

function ContextPanelInner({ panel }) {
  return (
    <React.Fragment>
      {panel === 'dashboard' && <ContextDashboard />}
      {panel === 'character' && <ContextCharacter />}
      {panel === 'inventory' && <ContextInventory />}
      {panel === 'quests' && <ContextQuest />}
      {panel === 'npcs' && <ContextNPC />}
      {panel === 'combat' && <ContextCombat />}
      {panel === 'map' && <ContextMap />}
      {panel === 'codex' && <ContextCodex />}
      {panel === 'journal' && <ContextJournal />}
      {panel === 'settings' && <ContextSettings />}
    </React.Fragment>
  );
}

export default ContextPanelInner;
