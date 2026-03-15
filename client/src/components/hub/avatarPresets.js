const avatarPresets = [
  { id: 'warrior', label: 'Warrior', emoji: '\u2694\uFE0F' },
  { id: 'mage', label: 'Mage', emoji: '\uD83E\uDDD9' },
  { id: 'rogue', label: 'Rogue', emoji: '\uD83D\uDDE1\uFE0F' },
  { id: 'ranger', label: 'Ranger', emoji: '\uD83C\uDFF9' },
  { id: 'cleric', label: 'Cleric', emoji: '\u2728' },
  { id: 'paladin', label: 'Paladin', emoji: '\uD83D\uDEE1\uFE0F' },
  { id: 'bard', label: 'Bard', emoji: '\uD83C\uDFB6' },
  { id: 'druid', label: 'Druid', emoji: '\uD83C\uDF3F' },
  { id: 'necromancer', label: 'Necromancer', emoji: '\uD83D\uDC80' },
  { id: 'monk', label: 'Monk', emoji: '\u270A' },
  { id: 'warlock', label: 'Warlock', emoji: '\uD83D\uDD25' },
  { id: 'artificer', label: 'Artificer', emoji: '\u2699\uFE0F' },
];

export default avatarPresets;

export function getAvatarEmoji(avatarUrl) {
  if (!avatarUrl) return '\uD83E\uDDD9';
  const id = avatarUrl.replace('preset:', '');
  const preset = avatarPresets.find(p => p.id === id);
  return preset ? preset.emoji : '\uD83E\uDDD9';
}
