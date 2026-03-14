// ═══════════════════════════════════════════════════════════════
// WORLD BIBLE GENERATOR — Builds world bible markdown from wizard data
// ═══════════════════════════════════════════════════════════════

export function generateWorldBible(w) {
  const sentientMap = { yes: 'The world is alive and sentient — it watches, judges, and responds to the actions of its inhabitants.', partially: 'The world carries echoes of sentience — residual awareness that manifests in strange coincidences, shifting landscapes, and whispered warnings.', no: 'The world is a standard planet — indifferent to its inhabitants, governed by natural laws.' };
  const ageMap = { standard: 'This is an established world with layered history, civilizations, and deep-rooted traditions.', young: 'This is a new world, raw and unformed — its rules are still being written, its boundaries still being tested.', dying: 'This is a dying world — its magic fading, its lands crumbling, its people clinging to what remains.' };
  const horrorMap = { none: 'Horror is absent — danger exists, but it is physical and comprehensible.', creeping: 'A creeping dread pervades the world — things are wrong in ways that are hard to articulate, and the truth is always worse than expected.', visceral: 'Horror is visceral and ever-present — the world contains genuine nightmares, body horror, psychological torment, and entities that break minds.' };
  const comedyMap = { serious: 'The tone is consistently serious and grounded.', dry: 'Dry wit and dark humor punctuate the tension — gallows humor is a survival mechanism.', chaotic: 'Chaos and absurdity are woven into the fabric of the world — the universe has a sick sense of humor.' };
  const magicMap = { none: 'Magic does not exist in this world. All power is mundane.', low: 'Magic is rare and feared — most people live their entire lives without witnessing it.', common: 'Magic is a known force — practiced by specialists, regulated by authorities, and woven into daily life.', high: 'Magic saturates everything — the air hums with it, children are born with it, and reality itself is negotiable.' };
  const sourceMap = { learned: 'Magic is learned through rigorous study, practice, and mentorship — a discipline like any other craft.', innate: 'Magic is innate — a birthright carried in the blood, awakened by circumstance or heredity.', custom: 'The source of magic is unique to this world — the DM will establish how magic manifests based on the campaign\'s needs.' };
  const costMap = { free: 'Magic flows freely with minimal personal cost — it is a tool like any other.', expensive: 'Magic demands a price — fatigue, shortened lifespan, sanity erosion, or material sacrifice.', catastrophic: 'Every use of magic risks catastrophe — unintended consequences, corruption, or attracting the attention of things best left undisturbed.' };
  const locationMap = { settlement: 'a remote settlement', ruins: 'ancient ruins', city: 'a sprawling city', wilderness: 'untamed wilderness', prison: 'a prison or place of confinement' };
  const situationMap = { stranger: 'A stranger arrives in an unfamiliar place — no allies, no reputation, no safety net.', local: 'A local whose ordinary life is shattered by sudden crisis — everything familiar becomes dangerous.', amnesia: 'Awakening with no memory — fragments of identity surface through play, and the truth may be unwelcome.', hired: 'Hired for a job that is more than it appears — the employer has secrets, the task has hidden layers.' };

  let bible = `# World Bible: ${w.worldName}\n\n`;
  bible += `## Core Identity\n`;
  bible += `**${w.worldName}** — ${w.premise || 'A world of adventure and mystery.'}\n\n`;
  bible += `${sentientMap[w.sentient] || sentientMap.no} ${ageMap[w.worldAge] || ageMap.ancient}\n\n`;

  bible += `## Tone & Atmosphere\n`;
  const darknessLabel = w.darkness <= 25 ? 'Grimdark' : w.darkness <= 50 ? 'Dark with glimmers of hope' : w.darkness <= 75 ? 'Balanced between darkness and hope' : 'Hopeful with shadows at the edges';
  bible += `The world sits at **${darknessLabel}** on the spectrum (${w.darkness}/100 hope). `;
  bible += `${horrorMap[w.horror] || horrorMap.none} ${comedyMap[w.comedy] || comedyMap.serious}\n`;
  if (w.inspirations && w.inspirations.length > 0) {
    bible += `\nInspirational touchstones: ${w.inspirations.join(', ')}.\n`;
  }
  bible += `\n`;

  bible += `## Magic System\n`;
  bible += `${magicMap[w.magicLevel] || magicMap.common} ${sourceMap[w.magicSource] || sourceMap.internal} ${costMap[w.magicCost] || costMap.expensive}\n`;
  if (w.magicFlavor) {
    bible += `\nMagic in ${w.worldName} manifests as: ${w.magicFlavor}\n`;
  }
  if (w.essenceLabel) {
    bible += `\nMagical energy is called **${w.essenceLabel}** in this world.\n`;
  }
  if (w.sanityLabel && w.sanityLabel !== 'Sanity') {
    bible += `Mental fortitude is tracked as **${w.sanityLabel}**.\n`;
  }
  if (w.essenceVisible === false || w.sanityVisible === false) {
    const hidden = [];
    if (w.essenceVisible === false) hidden.push(w.essenceLabel || 'Energy');
    if (w.sanityVisible === false) hidden.push(w.sanityLabel || 'Sanity');
    bible += `\n**Hidden vitals:** ${hidden.join(', ')} — these are not yet revealed to the player. Use [REVEAL_VITAL] when the narrative makes it appropriate (e.g., first magical awakening, first encounter with madness).\n`;
  }
  bible += `\n`;

  bible += `## Starting Scenario\n`;
  bible += `The story begins in ${locationMap[w.startingLocation] || 'an unknown place'}. `;
  bible += `${situationMap[w.openingSituation] || situationMap.stranger}\n`;
  if (w.initialConflict) {
    bible += `\nImmediate conflict: ${w.initialConflict}\n`;
  }
  if (w.factions) {
    bible += `\nFactions & power structures: ${w.factions}\n`;
  }
  bible += `\n`;

  bible += `## Player Character\n`;
  bible += `**Player:** ${w.playerName || 'Adventurer'}\n`;
  if (w.characterName) bible += `**Character Name:** ${w.characterName}\n`;
  if (w.race && w.race !== 'decide') bible += `**Race:** ${w.race}\n`;
  if (w.race === 'decide') bible += `**Race:** To be determined by the world during character creation.\n`;
  if (w.characterConcept) bible += `**Concept/Hooks:** ${w.characterConcept}\n`;
  bible += `\nClass, stats, abilities, and detailed backstory will be established through the Opening Instructions character creation process.\n`;

  return bible;
}
