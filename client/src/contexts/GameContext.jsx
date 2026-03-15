import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { DEFAULT_GAME_DATA } from '../data/defaultGameData.js';
import { useCloudSync } from '../hooks/useCloudSync.js';
import { useAuth } from './AuthContext.jsx';

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT — REDUCER + CONTEXT
// ═══════════════════════════════════════════════════════════════

const GameContext = createContext();

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PANEL': return { ...state, activePanel: action.payload };
    case 'SET_TAB': return { ...state, tabs: { ...state.tabs, [action.panel]: action.payload } };
    case 'SELECT_ITEM': return { ...state, selected: { ...state.selected, [action.category]: action.payload } };
    case 'ADD_NOTIFICATION': return { ...state, notifications: [...state.notifications, { ...action.payload, id: Date.now() + Math.random(), timestamp: Date.now() }] };
    case 'REMOVE_NOTIFICATION': return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'TOGGLE_LEVELUP': return { ...state, showLevelUp: action.payload };
    case 'NEXT_TURN': {
      const next = (state.combatTurn + 1) % (state.gameData.combat.turnOrder || []).length;
      return { ...state, combatTurn: next };
    }

    // ─── Chat actions ───
    case 'ADD_CHAT_MESSAGE': return { ...state, chatMessages: [...state.chatMessages, { ...action.payload, id: Date.now() + Math.random(), timestamp: Date.now() }] };
    case 'SET_STREAMING': return { ...state, isStreaming: action.payload };
    case 'UPDATE_STREAM_TEXT': {
      const msgs = [...state.chatMessages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'dm') { msgs[msgs.length - 1] = { ...last, content: action.payload }; }
      return { ...state, chatMessages: msgs };
    }

    // ─── API config ───
    case 'SET_API_KEY': return { ...state, apiKey: action.payload };
    case 'SET_MODEL': return { ...state, model: action.payload };
    case 'SET_API_PROVIDER': return { ...state, apiProvider: action.payload };
    case 'SET_REMEMBER_KEY': return { ...state, rememberKey: action.payload };
    case 'SET_API_STATUS': return { ...state, apiStatus: action.payload };
    case 'SET_DM_ENGINE': return { ...state, dmEngine: action.payload };

    // ─── Game state updates from metadata tags ───
    case 'UPDATE_CAMPAIGN': return { ...state, gameData: { ...state.gameData, campaign: { ...state.gameData.campaign, ...action.payload } } };
    case 'UPDATE_CHARACTER': return { ...state, gameData: { ...state.gameData, character: { ...state.gameData.character, ...action.payload } } };
    case 'UPDATE_STAT': {
      const { stat, value, prevValue } = action.payload;
      const trend = value > (prevValue || 0) ? 'up' : value < (prevValue || 0) ? 'down' : 'stable';
      return { ...state, gameData: { ...state.gameData, character: { ...state.gameData.character, stats: { ...state.gameData.character.stats, [stat]: { value, prevValue: prevValue || state.gameData.character.stats[stat]?.value || 0, trend } } } } };
    }
    case 'UPDATE_VITALS': {
      const ch = { ...state.gameData.character };
      if (action.payload.hp !== undefined) ch.hp = { ...ch.hp, current: action.payload.hp };
      if (action.payload.mp !== undefined) ch.mp = { ...ch.mp, current: action.payload.mp };
      if (action.payload.xp !== undefined) ch.ep = { ...ch.ep, current: action.payload.xp };
      if (action.payload.sanity !== undefined) ch.sanity = { ...ch.sanity, current: action.payload.sanity };
      if (action.payload.gold !== undefined) ch.gold = action.payload.gold;
      return { ...state, gameData: { ...state.gameData, character: ch } };
    }
    case 'ADD_CONDITION': {
      // Prevent duplicate conditions — replace if same name exists
      const existingConds = state.gameData.character.conditions.filter(c => c.name !== action.payload.name);
      const conds = [...existingConds, action.payload];
      return { ...state, gameData: { ...state.gameData, character: { ...state.gameData.character, conditions: conds } } };
    }
    case 'REMOVE_CONDITION': {
      const conds = state.gameData.character.conditions.filter(c => c.name !== action.payload);
      return { ...state, gameData: { ...state.gameData, character: { ...state.gameData.character, conditions: conds } } };
    }
    case 'ADD_ITEM': {
      const cat = action.payload.category || 'keyItems';
      const inv = { ...state.gameData.inventory };
      inv[cat] = [...(inv[cat] || []), action.payload.item];
      return { ...state, gameData: { ...state.gameData, inventory: inv } };
    }
    case 'REMOVE_ITEM': {
      const inv = { ...state.gameData.inventory };
      for (const cat of Object.keys(inv)) {
        inv[cat] = inv[cat].filter(i => i.name !== action.payload);
      }
      return { ...state, gameData: { ...state.gameData, inventory: inv } };
    }
    case 'UPDATE_QUEST': {
      const exists = state.gameData.quests.some(q => q.id === action.payload.id);
      if (exists) {
        const quests = state.gameData.quests.map(q => q.id === action.payload.id ? { ...q, ...action.payload } : q);
        return { ...state, gameData: { ...state.gameData, quests } };
      } else {
        // Auto-create new quest if it doesn't exist
        const newQuest = { id: action.payload.id, title: action.payload.objective || action.payload.id, type: action.payload.type || 'active', status: action.payload.status || 'active', progress: parseInt(action.payload.progress) || 0, objective: action.payload.objective || '', steps: [] };
        return { ...state, gameData: { ...state.gameData, quests: [...state.gameData.quests, newQuest] } };
      }
    }
    case 'ADD_QUEST': {
      return { ...state, gameData: { ...state.gameData, quests: [...state.gameData.quests, action.payload] } };
    }
    case 'UPDATE_NPC': {
      const npcs = state.gameData.npcs.map(n => n.name === action.payload.name ? { ...n, ...action.payload } : n);
      const exists = state.gameData.npcs.some(n => n.name === action.payload.name);
      return { ...state, gameData: { ...state.gameData, npcs: exists ? npcs : [...state.gameData.npcs, action.payload] } };
    }
    case 'UPDATE_TRACKER': {
      const trackers = { ...state.gameData.hiddenTrackers };
      if (trackers[action.payload.tracker]) {
        trackers[action.payload.tracker] = { ...trackers[action.payload.tracker], value: action.payload.value, hint: action.payload.hint || trackers[action.payload.tracker].hint };
      } else {
        // Auto-create new tracker if it doesn't exist
        trackers[action.payload.tracker] = { value: action.payload.value, hint: action.payload.hint || '', visible: false };
      }
      return { ...state, gameData: { ...state.gameData, hiddenTrackers: trackers } };
    }
    case 'ADD_MAP_LOCATION': {
      const locs = state.gameData.mapLocations || [];
      const locId = action.payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const exists = locs.some(l => l.id === locId);
      if (exists) {
        // Mark existing location as current, demote previous current to explored
        const updated = locs.map(l => ({
          ...l,
          status: l.id === locId ? 'current' : (l.status === 'current' ? 'explored' : l.status),
        }));
        return { ...state, gameData: { ...state.gameData, mapLocations: updated } };
      }
      // Add new location — place it in a grid pattern based on how many exist
      const count = locs.length;
      const col = count % 4;
      const row = Math.floor(count / 4);
      const x = 10 + col * 22 + (row % 2 ? 11 : 0); // stagger rows
      const y = 15 + row * 20;
      const moodToDanger = { 'Lethal': 'high', 'Hostile': 'high', 'Combat': 'high', 'Ominous': 'medium', 'Tense': 'medium', 'Eerie': 'medium' };
      const danger = moodToDanger[action.payload.mood] || 'low';
      const icons = ['🏚', '🏛', '⛪', '🕯', '⚔', '🌀', '🕳', '🏰', '🗿', '🌿'];
      const icon = icons[count % icons.length];
      // Demote old current to explored
      const updatedLocs = locs.map(l => ({ ...l, status: l.status === 'current' ? 'explored' : l.status }));
      const newLoc = { id: locId, name: action.payload.name, icon, x, y, status: 'current', danger, desc: '' };
      // Add path from previous current location
      const prevCurrent = locs.find(l => l.status === 'current');
      const paths = [...(state.gameData.mapPaths || [])];
      if (prevCurrent) {
        paths.push({ from: prevCurrent.id, to: locId, traveled: true });
      }
      return { ...state, gameData: { ...state.gameData, mapLocations: [...updatedLocs, newLoc], mapPaths: paths } };
    }
    case 'COMBAT_START': {
      return { ...state, gameData: { ...state.gameData, combat: { active: true, round: 1, location: action.payload.environment || '', turnOrder: [], currentTurn: 0, log: [{ text: '═══ COMBAT BEGINS ═══', type: 'system' }] } } };
    }
    case 'COMBAT_END': {
      return { ...state, gameData: { ...state.gameData, combat: { ...state.gameData.combat, active: false } } };
    }
    case 'ADD_XP': {
      const amount = parseInt(action.payload.amount) || 0;
      const ep = { ...state.gameData.character.ep };
      ep.current = ep.current + amount;
      // Handle level-up(s) — use while loop for multi-threshold XP gains
      let ch = { ...state.gameData.character, ep };
      while (ep.current >= ep.max && ep.max > 0) {
        ch.level = (ch.level || 1) + 1;
        ep.current = ep.current - ep.max;
        ep.max = Math.floor(ep.max * 1.4); // Scale XP needed for next level
        ch.ep = ep;
      }
      return { ...state, gameData: { ...state.gameData, character: ch } };
    }
    case 'ADD_ABILITY': {
      const abilities = [...(state.gameData.character.abilities || [])];
      // Don't add duplicates
      if (!abilities.some(a => a.name === action.payload.name)) {
        abilities.push(action.payload);
      }
      return { ...state, gameData: { ...state.gameData, character: { ...state.gameData.character, abilities } } };
    }
    case 'ADD_LORE': {
      // Deduplicate lore by title — update existing or add new
      const existing = state.gameData.lore.entries.find(e => e.title === action.payload.title);
      let entries;
      if (existing) {
        entries = state.gameData.lore.entries.map(e => e.title === action.payload.title ? { ...e, ...action.payload, discovered: true } : e);
      } else {
        entries = [...state.gameData.lore.entries, { ...action.payload, discovered: true }];
      }
      return { ...state, gameData: { ...state.gameData, lore: { ...state.gameData.lore, entries } } };
    }

    // ─── Vitals Config ───
    case 'REVEAL_VITAL': {
      const vc = { ...(state.gameData.vitalsConfig || {}) };
      const v = action.payload.vital;
      vc[v] = { ...(vc[v] || {}), visible: true, ...(action.payload.label && { label: action.payload.label }), ...(action.payload.fullLabel && { fullLabel: action.payload.fullLabel }), ...(action.payload.icon && { icon: action.payload.icon }) };
      return { ...state, gameData: { ...state.gameData, vitalsConfig: vc } };
    }

    // ─── Character/NPC Images ───
    case 'SET_CHARACTER_IMAGE':
      return { ...state, gameData: { ...state.gameData, character: { ...state.gameData.character, image: action.payload } } };
    case 'SET_NPC_IMAGE': {
      const npcsWithImg = state.gameData.npcs.map(n =>
        n.name === action.payload.name ? { ...n, image: action.payload.image } : n
      );
      return { ...state, gameData: { ...state.gameData, npcs: npcsWithImg } };
    }

    // ─── Image Generation Config ───
    case 'SET_XAI_KEY': return { ...state, xaiKey: action.payload };

    // ─── Campaign Wizard ───
    case 'SET_WORLD_BIBLE': return { ...state, worldBible: action.payload };
    case 'SHOW_CAMPAIGN_WIZARD': return { ...state, showCampaignWizard: action.payload };
    case 'START_NEW_CAMPAIGN': {
      return { ...state, gameData: action.payload.gameData, worldBible: action.payload.worldBible, chatMessages: [], showCampaignWizard: false };
    }

    case 'SET_PENDING_OPENING': return { ...state, pendingOpening: action.payload };
    case 'SET_CHAT_TEXT_SIZE': return { ...state, chatTextSize: action.payload };
    case 'SET_COMPANION_TEXT_SIZE': return { ...state, companionTextSize: action.payload };
    case 'SET_DM_STYLE': return { ...state, dmStyle: action.payload };
    case 'SET_ACTIVE_SAVE': return { ...state, activeSaveId: action.payload };

    // ─── Session summary (recap from previous sessions) ───
    case 'SET_SESSION_SUMMARY': return { ...state, sessionSummary: action.payload };

    // ─── Persistence ───
    case 'LOAD_GAME_STATE': return { ...state, ...action.payload };
    case 'SET_GAME_DATA': return { ...state, gameData: action.payload };

    default: return state;
  }
}

const initialState = {
  activePanel: 'dashboard',
  tabs: { character: 'stats', inventory: 'equipped', codex: 'Geography' },
  selected: { inventory: null, npc: null, quest: null, codex: null, map: null, session: null },
  notifications: [],
  showLevelUp: false,
  combatTurn: 0,
  // Chat + API state
  chatMessages: [],
  isStreaming: false,
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
  apiProvider: 'openrouter',
  apiStatus: 'disconnected', // disconnected | connected | testing | error
  dmEngine: '',
  gameData: DEFAULT_GAME_DATA,
  // Campaign wizard
  worldBible: '',
  showCampaignWizard: false,
  // Security
  rememberKey: false,
  // Opening scene trigger
  pendingOpening: false,
  // DM Style dial (0 = Structured, 100 = Freeform)
  dmStyle: 50,
  // xAI image generation
  xaiKey: '',
  // Server persistence
  activeSaveId: null,
  // Session summary / recap from previous sessions
  sessionSummary: null,
};

function GameProvider({ children, campaignId }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { isAuthenticated, authFetch } = useAuth();

  // Cloud sync — backend-primary save, localStorage as fallback
  const { syncNow, loadFromCloud, setCampaignId } = useCloudSync(state, dispatch);

  // Set activeSaveId from route param
  useEffect(() => {
    if (campaignId && campaignId !== 'new') {
      dispatch({ type: 'SET_ACTIVE_SAVE', payload: campaignId });
    }
  }, [campaignId]);

  // Create campaign on backend when id is "new", then update URL
  const createdRef = useRef(false);
  useEffect(() => {
    if (campaignId !== 'new' || !isAuthenticated || createdRef.current) return;
    createdRef.current = true;
    (async () => {
      try {
        const res = await authFetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Campaign' }),
        });
        if (res.ok) {
          const campaign = await res.json();
          dispatch({ type: 'SET_ACTIVE_SAVE', payload: campaign.id });
          setCampaignId(campaign.id);
          // Replace URL without full navigation so state is preserved
          window.history.replaceState(null, '', `/play/campaign/${campaign.id}`);
          // Show the campaign wizard for new campaigns
          dispatch({ type: 'SHOW_CAMPAIGN_WIZARD', payload: true });
        }
      } catch (e) {
        console.warn('[GameProvider] Failed to create campaign:', e);
        loadFromLocalStorage(dispatch);
      }
    })();
  }, [campaignId, isAuthenticated, authFetch, setCampaignId]);

  // Load from backend on mount when we have a real campaignId and are authenticated
  const cloudLoadedRef = useRef(false);
  useEffect(() => {
    if (campaignId && campaignId !== 'new' && isAuthenticated && !cloudLoadedRef.current) {
      cloudLoadedRef.current = true;
      loadFromCloud(campaignId).then((loaded) => {
        if (!loaded) {
          // Fallback: load from localStorage
          loadFromLocalStorage(dispatch);
        }
      });
    } else if (!campaignId || !isAuthenticated) {
      // No campaign ID or not authenticated — use localStorage
      loadFromLocalStorage(dispatch);
    }
  }, [campaignId, isAuthenticated, loadFromCloud]);

  // Sync immediately when wizard completes (worldBible gets set)
  const prevWorldBibleRef = useRef(state.worldBible);
  useEffect(() => {
    if (state.worldBible && !prevWorldBibleRef.current && state.activeSaveId) {
      syncNow();
    }
    prevWorldBibleRef.current = state.worldBible;
  }, [state.worldBible, state.activeSaveId, syncNow]);

  // Load DM Engine on mount
  useEffect(() => {
    fetch('/dm-engine.md').then(r => r.ok ? r.text() : '').then(t => {
      if (t) dispatch({ type: 'SET_DM_ENGINE', payload: t });
    }).catch(() => {});
  }, []);

  // Auto-save to localStorage (debounced) — kept as offline fallback
  const saveTimer = useRef(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        if (state.apiKey) {
          if (state.rememberKey) {
            localStorage.setItem('dnd-apiKey', state.apiKey);
            sessionStorage.removeItem('dnd-apiKey');
          } else {
            sessionStorage.setItem('dnd-apiKey', state.apiKey);
            localStorage.removeItem('dnd-apiKey');
          }
        }
        localStorage.setItem('dnd-rememberKey', state.rememberKey.toString());
        if (state.model) localStorage.setItem('dnd-model', state.model);
        localStorage.setItem('dnd-apiProvider', state.apiProvider);
        // Save last 50 messages
        const trimmed = state.chatMessages.slice(-50);
        localStorage.setItem('dnd-chat', JSON.stringify(trimmed));
        localStorage.setItem('dnd-gameData', JSON.stringify(state.gameData));
        if (state.worldBible) localStorage.setItem('dnd-worldBible', state.worldBible);
        if (state.dmStyle !== undefined) localStorage.setItem('dnd-dmStyle', state.dmStyle.toString());
      } catch(e) {}
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state.chatMessages, state.gameData, state.apiKey, state.model, state.apiProvider, state.worldBible, state.rememberKey, state.dmStyle]);

  return <GameContext.Provider value={{ state, dispatch, syncNow }}>{children}</GameContext.Provider>;
}

/** Load saved state from localStorage (offline fallback). */
function loadFromLocalStorage(dispatch) {
  try {
    const savedRemember = localStorage.getItem('dnd-rememberKey') === 'true';
    const savedKey = savedRemember ? localStorage.getItem('dnd-apiKey') : sessionStorage.getItem('dnd-apiKey');
    const savedModel = localStorage.getItem('dnd-model');
    const savedChat = localStorage.getItem('dnd-chat');
    const savedGameData = localStorage.getItem('dnd-gameData');
    const savedWorldBible = localStorage.getItem('dnd-worldBible');
    if (savedRemember) dispatch({ type: 'SET_REMEMBER_KEY', payload: true });
    if (savedKey) dispatch({ type: 'SET_API_KEY', payload: savedKey });
    if (savedModel) dispatch({ type: 'SET_MODEL', payload: savedModel });
    if (savedChat) {
      try { const msgs = JSON.parse(savedChat); msgs.forEach(m => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: m })); } catch(e) {}
    }
    if (savedGameData) {
      try { dispatch({ type: 'SET_GAME_DATA', payload: JSON.parse(savedGameData) }); } catch(e) {}
    }
    if (savedWorldBible) dispatch({ type: 'SET_WORLD_BIBLE', payload: savedWorldBible });
    const savedTextSize = localStorage.getItem('dnd-chatTextSize');
    if (savedTextSize) dispatch({ type: 'SET_CHAT_TEXT_SIZE', payload: savedTextSize });
    const savedCompanionSize = localStorage.getItem('dnd-companionTextSize');
    if (savedCompanionSize) dispatch({ type: 'SET_COMPANION_TEXT_SIZE', payload: savedCompanionSize });
    const savedDmStyle = localStorage.getItem('dnd-dmStyle');
    if (savedDmStyle) dispatch({ type: 'SET_DM_STYLE', payload: parseInt(savedDmStyle) });
    const savedXaiKey = localStorage.getItem('dnd-xaiKey');
    if (savedXaiKey) dispatch({ type: 'SET_XAI_KEY', payload: savedXaiKey });

    // First-time visitor: no saved world or chat → auto-show Campaign Wizard
    if (!savedWorldBible && !savedChat) {
      dispatch({ type: 'SHOW_CAMPAIGN_WIZARD', payload: true });
    }
  } catch(e) {}
}

function useGame() { return useContext(GameContext); }

export { GameContext, gameReducer, initialState, GameProvider, useGame };
