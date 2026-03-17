// ═══════════════════════════════════════════════════════════════
// DEFAULT GAME DATA — Blank Wonderlore AI (no active campaign)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_GAME_DATA = {
  campaign: {
    name: "Wonderlore AI",
    session: 0,
    day: 0,
    time: "—",
    location: "",
    mood: "",
  },
  character: {
    name: "",
    race: "",
    class: "",
    assignedBy: "",
    level: 0,
    ep: { current: 0, max: 0 },
    hp: { current: 0, max: 0 },
    mp: { current: 0, max: 0 },
    sanity: { current: 0, max: 0 },
    gold: 0,
    weight: { current: 0, max: 0 },
    stats: {
      RESONANCE: { value: 0, trend: "stable", prevValue: 0 },
      VITALITY: { value: 0, trend: "stable", prevValue: 0 },
      ACUITY: { value: 0, trend: "stable", prevValue: 0 },
      WILL: { value: 0, trend: "stable", prevValue: 0 },
      AFFINITY: { value: 0, trend: "stable", prevValue: 0 },
    },
    conditions: [],
    abilities: [],
    traits: [],
  },
  vitalsConfig: {
    mp: { label: "EP", fullLabel: "Essence Points", icon: "✨", visible: true },
    sanity: { label: "Sanity", fullLabel: "Sanity", icon: "🧠", visible: true },
  },
  hiddenTrackers: {
    sanity: { value: 0, hint: "" },
    worldAwareness: { value: 0, hint: "" },
    corruption: { value: 0, hint: "" },
    magicalDebt: { value: 0, hint: "" },
    transformation: { value: 0, hint: "" },
  },
  inventory: {
    equipped: [],
    consumables: [],
    keyItems: [],
    materials: [],
  },
  quests: [],
  npcs: [],
  npcRelationships: [],
  combat: {
    active: false,
    round: 0,
    location: "",
    turnOrder: [],
    currentTurn: 0,
    log: [],
  },
  mapLocations: [],
  mapPaths: [],
  lore: {
    categories: ["Geography", "Factions", "Magic", "Bestiary", "History", "Pantheon"],
    entries: [],
  },
  sessions: [],
  consequenceLog: [],
};

// ═══════════════════════════════════════════════════════════════
// BLANK GAME DATA — Fresh campaign (wizard fills in name/race)
// ═══════════════════════════════════════════════════════════════

export function createBlankGameData(wizardData = {}) {
  return {
    campaign: {
      name: wizardData.worldName || "New World",
      session: 1,
      day: 1,
      time: "Dawn",
      location: wizardData.startingLocation || "Unknown",
      mood: "anticipation",
    },
    character: {
      name: wizardData.characterName || "",
      race: wizardData.race || "",
      class: "",
      assignedBy: "",
      level: 1,
      ep: { current: 0, max: 1000 },
      hp: { current: 20, max: 20 },
      mp: { current: 10, max: 10 },
      sanity: { current: 100, max: 100 },
      gold: 0,
      weight: { current: 0, max: 50 },
      stats: {
        RESONANCE: { value: 0, trend: "stable", prevValue: 0 },
        VITALITY: { value: 0, trend: "stable", prevValue: 0 },
        ACUITY: { value: 0, trend: "stable", prevValue: 0 },
        WILL: { value: 0, trend: "stable", prevValue: 0 },
        AFFINITY: { value: 0, trend: "stable", prevValue: 0 },
      },
      conditions: [],
      abilities: [],
      traits: [],
    },
    vitalsConfig: {
      mp: { label: wizardData.essenceLabel || "EP", fullLabel: wizardData.essenceLabel ? wizardData.essenceLabel + " Points" : "Essence Points", icon: "✨", visible: wizardData.essenceVisible !== false },
      sanity: { label: wizardData.sanityLabel || "Sanity", fullLabel: wizardData.sanityLabel || "Sanity", icon: "🧠", visible: wizardData.sanityVisible !== false },
    },
    hiddenTrackers: {
      sanity: { value: 100, hint: "Your mind is clear. For now." },
      worldAwareness: { value: 0, hint: "The world has not yet noticed you." },
      corruption: { value: 0, hint: "You are uncorrupted." },
      magicalDebt: { value: 0, hint: "You owe nothing to the arcane." },
      transformation: { value: 0, hint: "You are unchanged." },
    },
    inventory: {
      equipped: [],
      consumables: [],
      keyItems: [],
      materials: [],
    },
    quests: [],
    npcs: [],
    npcRelationships: [],
    combat: {
      active: false,
      round: 0,
      location: "",
      turnOrder: [],
      currentTurn: 0,
      log: [],
    },
    mapLocations: [],
    mapPaths: [],
    lore: {
      categories: ["Geography", "Factions", "Magic", "Bestiary", "History", "Pantheon"],
      entries: [],
    },
    sessions: [],
    consequenceLog: [],
  };
}
