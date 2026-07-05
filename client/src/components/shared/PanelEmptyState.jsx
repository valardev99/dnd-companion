import React from 'react';

/**
 * Shared empty-state for companion panels. Replaces the blank voids the
 * playtest flagged — a centered engraved glyph + one line of in-world copy,
 * so an empty Inventory/Quests/NPCs/Combat/Map reads as "nothing yet",
 * not "broken".
 */
export default function PanelEmptyState({ glyph, title, hint }) {
  return (
    <div className="panel-empty">
      <div className="panel-empty-glyph" aria-hidden="true">{glyph}</div>
      <div className="panel-empty-title">{title}</div>
      {hint && <div className="panel-empty-hint">{hint}</div>}
    </div>
  );
}
