import React from 'react';

/**
 * Dark Fantasy SVG Icons — WoW/Diablo aesthetic
 * All icons use currentColor so they inherit the parent's color.
 * Designed at 24x24 viewBox for sidebar use.
 */

const iconStyle = { display: 'inline-block', verticalAlign: 'middle' };

/* ─── Dashboard: Castle/Stronghold ─── */
export function IconDashboard({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Main castle body */}
      <rect x="5" y="10" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Gate arch */}
      <path d="M9 22v-5a3 3 0 0 1 6 0v5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Left tower */}
      <rect x="3" y="7" width="4" height="15" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Right tower */}
      <rect x="17" y="7" width="4" height="15" rx="0.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Tower tops (crenellations) */}
      <path d="M3 7h1v-2h2v2h1" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M17 7h1v-2h2v2h1" stroke="currentColor" strokeWidth="1.2" fill="none" />
      {/* Center banner */}
      <path d="M10 10h4v3l-2 1.5L10 13z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3" />
      {/* Flag */}
      <line x1="12" y1="2" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 2l4 2-4 2z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/* ─── Character: Helm/Shield ─── */
export function IconCharacter({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Shield shape */}
      <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Inner shield border */}
      <path d="M12 4.5L6 7.5v3.8c0 4 2.6 7.7 6 8.7 3.4-1 6-4.7 6-8.7V7.5L12 4.5z" stroke="currentColor" strokeWidth="0.8" opacity="0.4" fill="none" />
      {/* Sword cross on shield */}
      <line x1="12" y1="7" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" />
      {/* Gem at center */}
      <circle cx="12" cy="10" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/* ─── Inventory: Treasure Chest ─── */
export function IconInventory({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Chest body */}
      <rect x="3" y="11" width="18" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Chest lid */}
      <path d="M3 11V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Lid curve (arched top) */}
      <path d="M4 7c0-2 3.5-4 8-4s8 2 8 4" stroke="currentColor" strokeWidth="1.2" opacity="0.4" fill="none" />
      {/* Metal bands */}
      <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      {/* Lock/clasp */}
      <rect x="10" y="13" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="15" r="0.8" fill="currentColor" opacity="0.6" />
      {/* Metal corners */}
      <path d="M3 11l2-0.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M21 11l-2-0.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

/* ─── Quests: Scroll with Wax Seal ─── */
export function IconQuests({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Scroll body */}
      <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Top roll */}
      <ellipse cx="12" cy="4" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Bottom roll */}
      <ellipse cx="12" cy="20" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Text lines */}
      <line x1="9" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="9" y1="10.5" x2="14" y2="10.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="9" y1="15.5" x2="12" y2="15.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      {/* Wax seal */}
      <circle cx="17" cy="18" r="2.5" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1" />
      <path d="M16.2 17.5l0.8 0.8 1.5-1.5" stroke="currentColor" strokeWidth="1" opacity="0.8" />
    </svg>
  );
}

/* ─── NPCs: Hooded Figures ─── */
export function IconNPCs({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Back figure hood */}
      <path d="M16 7c0-2-1.5-3.5-3-3.5S10 5 10 7" stroke="currentColor" strokeWidth="1.2" opacity="0.4" fill="none" />
      {/* Back figure body */}
      <path d="M8 22v-6c0-2 1.8-4 5-4s5 2 5 4v6" stroke="currentColor" strokeWidth="1.2" opacity="0.4" fill="none" />
      {/* Front figure head */}
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Front figure hood */}
      <path d="M6 6c0-3 1.5-5 3-5s3 2 3 5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      {/* Front figure body/cloak */}
      <path d="M3 22v-5c0-3 2.5-5 6-5s6 2 6 5v5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Cloak clasp */}
      <circle cx="9" cy="14" r="0.8" fill="currentColor" opacity="0.5" />
      {/* Second figure head */}
      <circle cx="16" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" fill="none" />
    </svg>
  );
}

/* ─── Combat: Crossed Swords ─── */
export function IconCombat({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Left sword blade */}
      <line x1="4" y1="4" x2="15" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Left sword guard */}
      <line x1="13" y1="11" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="13" x2="11" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Left sword pommel */}
      <circle cx="4" cy="4" r="1.2" fill="currentColor" opacity="0.4" />
      {/* Right sword blade */}
      <line x1="20" y1="4" x2="9" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Right sword guard */}
      <line x1="11" y1="11" x2="13" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="13" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Right sword pommel */}
      <circle cx="20" cy="4" r="1.2" fill="currentColor" opacity="0.4" />
      {/* Center clash spark */}
      <circle cx="12" cy="10" r="1.5" fill="currentColor" opacity="0.3" />
      <path d="M12 7.5v-1.5M14.5 10h1.5M12 12.5v1.5M9.5 10H8" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/* ─── Map: Compass Rose ─── */
export function IconMap({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Outer circle */}
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Inner circle */}
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.2" />
      {/* North point (filled) */}
      <path d="M12 2.5L13.5 10H10.5L12 2.5z" fill="currentColor" opacity="0.6" />
      {/* South point */}
      <path d="M12 21.5L10.5 14H13.5L12 21.5z" stroke="currentColor" strokeWidth="0.8" fill="none" />
      {/* East point */}
      <path d="M21.5 12L14 10.5V13.5L21.5 12z" stroke="currentColor" strokeWidth="0.8" fill="none" />
      {/* West point (filled) */}
      <path d="M2.5 12L10 13.5V10.5L2.5 12z" fill="currentColor" opacity="0.6" />
      {/* Cardinal markers */}
      <text x="12" y="6" textAnchor="middle" fill="currentColor" fontSize="3" fontFamily="Cinzel,serif" opacity="0.7">N</text>
      {/* Decorative ring */}
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="none" strokeDasharray="2 2" />
    </svg>
  );
}

/* ─── Codex: Ancient Tome ─── */
export function IconCodex({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Book cover */}
      <path d="M4 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Book spine */}
      <path d="M4 3v18a1 1 0 0 0 1 1" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="3" x2="4" y2="21" stroke="currentColor" strokeWidth="2.5" />
      {/* Pages edge */}
      <path d="M6 3v18" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      {/* Cover emblem — eye of knowledge */}
      <circle cx="13" cy="11" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="13" cy="11" r="1.5" fill="currentColor" opacity="0.4" />
      {/* Decorative corner flourishes */}
      <path d="M8 5l2 0 0 2" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <path d="M18 5l-2 0 0 2" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <path d="M8 17l2 0 0-2" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <path d="M18 17l-2 0 0-2" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      {/* Title line */}
      <line x1="10" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

/* ─── Journal: Quill & Parchment ─── */
export function IconJournal({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Parchment page */}
      <path d="M6 2h10l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Page fold */}
      <path d="M16 2v4h4" stroke="currentColor" strokeWidth="1.2" fill="none" />
      {/* Text lines */}
      <line x1="7" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      <line x1="7" y1="11.5" x2="14" y2="11.5" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      <line x1="7" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      <line x1="7" y1="16.5" x2="11" y2="16.5" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      {/* Quill */}
      <path d="M18 22l-3-3 1.5-1.5c1-1 2.5-0.5 2.5 0.5v3l-1 1z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3" />
      <line x1="15" y1="19" x2="12" y2="16.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/* ─── Settings: Runic Gear ─── */
export function IconSettings({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={iconStyle}>
      {/* Outer gear shape */}
      <path d="M12 1l1.5 2.5h3l0.8 2.9 2.7 1.1 2.5-1.5 1.5 1.5-1.5 2.5 1.1 2.7 2.9 0.8v3l-2.9 0.8-1.1 2.7 1.5 2.5-1.5 1.5-2.5-1.5-2.7 1.1L13.5 23h-3l-0.8-2.9-2.7-1.1-2.5 1.5L3 19l1.5-2.5L3.4 13.8 0.5 13v-3l2.9-0.8 1.1-2.7L3 5l1.5-1.5 2.5 1.5L9.7 3.9 10.5 1h1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" />
      {/* Inner circle */}
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Rune marks inside */}
      <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/**
 * Icon map — maps panel IDs to icon components for easy lookup
 */
export const GAME_ICONS = {
  dashboard: IconDashboard,
  character: IconCharacter,
  inventory: IconInventory,
  quests: IconQuests,
  npcs: IconNPCs,
  combat: IconCombat,
  map: IconMap,
  codex: IconCodex,
  journal: IconJournal,
  settings: IconSettings,
};

export default GAME_ICONS;
