// ═══════════════════════════════════════════════════════════════
// TAG PARSER — Parses metadata tags from DM responses
// ═══════════════════════════════════════════════════════════════

import { generatePortraitAsync } from '../services/imageService.js';

export const TAG_REGEX = /\[([A-Z_]+):\s*([^\]]+)\]/g;

export function parseTagParams(paramStr) {
  const params = {};
  const regex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\[([^\]]*)\]|(\S+))/g;
  let m;
  while ((m = regex.exec(paramStr)) !== null) {
    const key = m[1];
    const val = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4].split(',').map(s => s.trim().replace(/['"]/g, '')) : m[5];
    if (!isNaN(val) && val !== '' && typeof val === 'string') { params[key] = parseFloat(val); }
    else { params[key] = val; }
  }
  return params;
}

export function parseMetadataTags(text) {
  const tags = [];
  let cleanText = text;
  let match;
  const re = /\[([A-Z_]+):\s*([^\]]+)\]/g;
  while ((match = re.exec(text)) !== null) {
    tags.push({ type: match[1], params: parseTagParams(match[2]), raw: match[0] });
  }
  for (const tag of tags) { cleanText = cleanText.replace(tag.raw, ''); }
  return { cleanText: cleanText.replace(/\n{3,}/g, '\n\n').trim(), tags };
}

export function dispatchTagActions(tags, dispatch, state = null) {
  for (const tag of tags) {
    const p = tag.params;
    switch (tag.type) {
      case 'SCENE_UPDATE':
        dispatch({ type: 'UPDATE_CAMPAIGN', payload: { location: p.location, time: p.time, day: p.day, mood: p.mood } });
        // Auto-add location to map if it doesn't exist yet
        if (p.location) {
          dispatch({ type: 'ADD_MAP_LOCATION', payload: { name: p.location, mood: p.mood } });
        }
        break;
      case 'STAT_CHANGE':
        dispatch({ type: 'UPDATE_STAT', payload: { stat: p.stat, value: p.new ?? p.value, prevValue: p.old } });
        // Only show notification if value actually changed
        if (parseInt(p.new ?? p.value) !== parseInt(p.old)) {
          dispatch({ type: 'ADD_NOTIFICATION', payload: { title: `${p.stat} ${(p.new??0) > (p.old??0) ? 'INCREASED' : 'DECREASED'}`, body: p.reason || '', statChanges: [{ stat: p.stat, from: p.old, to: p.new ?? p.value, dir: (p.new??0) > (p.old??0) ? 'increase' : 'decrease' }] } });
        }
        break;
      case 'HP_CHANGE':
        dispatch({ type: 'UPDATE_VITALS', payload: { hp: p.new ?? p.value } });
        if ((p.new??0) < (p.old??999)) dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'DAMAGE TAKEN', body: p.reason || '', style: 'critical', statChanges: [{ stat: 'HP', from: p.old, to: p.new ?? p.value, dir: 'decrease' }] } });
        break;
      case 'MP_CHANGE':
        dispatch({ type: 'UPDATE_VITALS', payload: { mp: p.new ?? p.value } });
        break;
      case 'XP_GAIN':
        dispatch({ type: 'ADD_XP', payload: { amount: parseInt(p.amount) || 0 } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'EXPERIENCE GAINED', body: `+${p.amount} XP — ${p.reason || p.source || ''}`, style: 'success' } });
        break;
      case 'ITEM_ACQUIRED': {
        const itemType = (p.type || '').toLowerCase();
        const equipTypes = ['weapon', 'armor', 'shield', 'accessory', 'ring', 'amulet', 'helmet', 'boots', 'gloves'];
        const consumeTypes = ['consumable', 'potion', 'scroll', 'food', 'drink'];
        const materialTypes = ['material', 'reagent', 'ingredient', 'ore', 'gem'];
        const keyTypes = ['key', 'quest', 'special'];
        let category = 'keyItems';
        if (equipTypes.some(t => itemType.includes(t))) category = 'equipped';
        else if (consumeTypes.some(t => itemType.includes(t))) category = 'consumables';
        else if (materialTypes.some(t => itemType.includes(t))) category = 'materials';
        else if (keyTypes.some(t => itemType.includes(t))) category = 'keyItems';
        const iconMap = { weapon: '⚔', armor: '🛡', shield: '🛡', ring: '💍', amulet: '📿', accessory: '💎', consumable: '🧪', potion: '🧪', scroll: '📜', material: '🔮', key: '🔑', tool: '🔧', relic: '✨', valuable: '💰', lore: '📖' };
        const icon = Object.entries(iconMap).find(([k]) => itemType.includes(k))?.[1] || '🔮';
        dispatch({ type: 'ADD_ITEM', payload: { category, item: { name: p.name, rarity: p.rarity || 'common', icon, desc: p.desc || '', qty: 1, weight: 0 } } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'ITEM ACQUIRED', body: `${p.name} (${p.rarity || 'common'}) — ${p.desc || ''}`, style: 'arcane' } });
        break;
      }
      case 'ITEM_REMOVED':
        dispatch({ type: 'REMOVE_ITEM', payload: p.name });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'ITEM LOST', body: `${p.name}${p.reason ? ` — ${p.reason}` : ''}`, style: 'critical' } });
        break;
      case 'QUEST_UPDATE':
        dispatch({ type: 'UPDATE_QUEST', payload: { id: p.id, status: p.status, progress: p.progress, objective: p.objective } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'QUEST UPDATED', body: `${p.id} — ${p.objective || p.status || ''}`, style: 'success' } });
        break;
      case 'NPC_UPDATE': {
        dispatch({ type: 'UPDATE_NPC', payload: { name: p.name, relationship: p.relationship, status: p.status, location: p.location, loyalty: p.loyalty, role: p.role, desc: p.desc, avatar: p.avatar } });
        // Generate portrait for NEW NPCs (ones that don't exist yet)
        if (state && state.xaiKey) {
          const existingNpc = state.gameData.npcs.find(n => n.name === p.name);
          if (!existingNpc || !existingNpc.image) {
            generatePortraitAsync({
              apiKey: state.xaiKey,
              name: p.name,
              description: p.desc || '',
              role: p.role || '',
              relationship: p.relationship || 'neutral',
            }, dispatch, 'npc');
          }
        }
        break;
      }
      case 'COMBAT_START':
        dispatch({ type: 'COMBAT_START', payload: { environment: p.environment } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: '⚔ COMBAT INITIATED', body: p.environment || 'Roll initiative!', style: 'critical' } });
        break;
      case 'COMBAT_END':
        dispatch({ type: 'COMBAT_END', payload: {} });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'COMBAT ENDED', body: `Result: ${p.result || 'Victory'}${p.xp ? ` — +${p.xp} XP` : ''}`, style: 'success' } });
        break;
      case 'ROLL_RESULT':
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: `ROLL: ${p.type || 'Check'}`, body: `Rolled ${p.rolled}${p.modifier ? `+${p.modifier}` : ''} vs DC ${p.dc || '?'} — ${p.result || ''}`, style: p.result === 'success' || p.result === 'critical_success' ? 'success' : 'critical' } });
        break;
      case 'HIDDEN_TRACKER':
        dispatch({ type: 'UPDATE_TRACKER', payload: { tracker: p.tracker, value: p.new_value, hint: p.hint } });
        break;
      case 'CONDITION_ADD':
        dispatch({ type: 'ADD_CONDITION', payload: { name: p.name, type: p.type || 'neutral', desc: p.desc || '', icon: p.type === 'buff' ? '⚡' : p.type === 'debuff' ? '💀' : '👁' } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: p.type === 'buff' ? 'BUFF GAINED' : p.type === 'debuff' ? 'DEBUFF APPLIED' : 'CONDITION CHANGED', body: `${p.name}${p.desc ? ` — ${p.desc}` : ''}`, style: p.type === 'buff' ? 'success' : p.type === 'debuff' ? 'critical' : 'arcane' } });
        break;
      case 'CONDITION_REMOVE':
        dispatch({ type: 'REMOVE_CONDITION', payload: p.name });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'CONDITION REMOVED', body: `${p.name} has faded.` } });
        break;
      case 'LORE_UNLOCK':
        dispatch({ type: 'ADD_LORE', payload: { title: p.title, category: p.category || 'History', content: p.content || '???' } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'LORE UNLOCKED', body: `${p.category}: ${p.title}`, style: 'arcane' } });
        break;
      case 'REVEAL_VITAL':
        dispatch({ type: 'REVEAL_VITAL', payload: { vital: p.vital, label: p.label, fullLabel: p.fullLabel, icon: p.icon } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'VITAL REVEALED', body: `${p.label || p.vital} has been unlocked!`, style: 'arcane' } });
        break;
      case 'ABILITY_ADD':
        dispatch({ type: 'ADD_ABILITY', payload: { name: p.name, type: p.type || 'Active', desc: p.desc || '', cost: p.cost || '', cooldown: p.cooldown || '', icon: p.type === 'Passive' ? '🛡' : p.type === 'Reaction' ? '⚡' : '✨' } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'NEW ABILITY UNLOCKED', body: `${p.name} (${p.type || 'Active'}) — ${p.desc || ''}`, style: 'arcane' } });
        break;
    }
  }
}
