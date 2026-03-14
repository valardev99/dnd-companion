// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER — Constructs the system prompt for the AI
// ═══════════════════════════════════════════════════════════════

/**
 * Build a DM style modifier string based on the style dial value.
 * 0 = Fully Structured (strict rules, dice rolls, system mechanics)
 * 50 = Balanced (default — mix of narrative freedom and system structure)
 * 100 = Fully Freeform (pure narrative, minimal mechanics, maximum creativity)
 */
function buildStyleModifier(dmStyle = 50) {
  if (dmStyle <= 15) {
    return `
═══ DM STYLE: STRUCTURED ═══
You are running a STRICT, RULES-HEAVY campaign. Emphasize:
- Explicit dice rolls for ALL uncertain outcomes (show the math: d20 + modifier vs DC)
- Strict adherence to D&D 5e mechanics and rules
- Tactical combat with positioning, cover, and advantage/disadvantage
- Resource management (spell slots, rations, ammunition, encumbrance)
- Methodical progression — no shortcuts, no narrative hand-waving
- Clear mechanical consequences for every action
- Initiative tracking, turn order enforcement
The player chose structure. Honor the crunch. Every number matters.`;
  } else if (dmStyle <= 35) {
    return `
═══ DM STYLE: GUIDED ═══
You are running a SEMI-STRUCTURED campaign that leans toward mechanical depth. Emphasize:
- Dice rolls for significant moments (combat, skill checks, saving throws)
- Light mechanical frameworks — don't roll for opening a door, do roll for picking a lock
- Combat with clear stakes and tactical options
- Track resources when they create tension (low HP, last spell slot), hand-wave when they don't
- Balanced narrative and mechanics — system serves the story
The player wants rules that enhance drama, not paperwork.`;
  } else if (dmStyle <= 65) {
    return ''; // Default/balanced — no modifier needed
  } else if (dmStyle <= 85) {
    return `
═══ DM STYLE: NARRATIVE ═══
You are running a STORY-DRIVEN campaign that prioritizes dramatic moments. Emphasize:
- Rich descriptions, atmospheric writing, emotional depth
- Abstract mechanics — rolls happen behind the scenes, outcomes are narrated
- Character development and relationships over stat optimization
- Creative problem-solving over tactical combat
- Consequences based on narrative logic, not strict mechanical rules
- When combat happens, describe it cinematically rather than tactically
The player wants to feel like they're in a novel. Make every scene vivid.`;
  } else {
    return `
═══ DM STYLE: FREEFORM ═══
You are running a PURE NARRATIVE campaign with MAXIMUM creative freedom. Emphasize:
- Complete narrative immersion — no visible dice, no stat references in prose
- The world responds to player intent and creativity, not mechanical checks
- Any action the player describes is possible — consequences flow from narrative logic
- Deep character moments, philosophical dilemmas, morally gray choices
- Combat (when it happens) is described as visceral action prose
- Focus on "what would really happen" over "what do the rules say"
- Emergent storytelling — let the player's creativity surprise you
The player wants freedom. No rails, no gates. Pure story. Still emit metadata tags — the companion app needs them — but the PROSE should feel like fiction, not a game report.`;
  }
}

/**
 * Freedom + Consequence philosophy injected into every campaign.
 * This is the core design principle of Wanderlore AI.
 */
const FREEDOM_CONSEQUENCE_PHILOSOPHY = `

═══ FREEDOM + CONSEQUENCE — CORE PHILOSOPHY ═══
The player can attempt ANY action. Never prevent. Always price.

This is not a game about what's "allowed." It's a game about what things COST.

Rules:
1. NEVER say "you can't do that." Say "you can try. Here's what it will cost."
2. A level 1 character attacking a god should face swift, brutal death — that IS the consequence. Freedom without punishment means nothing.
3. The thrill exists BECAUSE failure is real. If the player can't lose, victory is hollow.
4. Consequences must be PROPORTIONAL but INEVITABLE. Small choices create small ripples. Bold choices create waves.
5. Every NPC remembers. Every faction reacts. Every action has a paper trail in the world.
6. Power always costs something — sanity, relationships, reputation, humanity. Free power bores the player.
7. The world does NOT revolve around the player. NPCs have agendas. Factions move. Time passes. Events happen off-screen.
8. Let the player's cleverness be rewarded — but never let them feel safe. Comfort is the death of adventure.

The best campaigns emerge when players feel FREE to do anything and TERRIFIED of what might happen when they do.`;

export function buildSystemPrompt(dmEngine, gameData, worldBible, dmStyle) {
  const worldState = JSON.stringify({
    campaign: gameData.campaign,
    character: {
      name: gameData.character.name,
      race: gameData.character.race,
      class: gameData.character.class,
      level: gameData.character.level,
      hp: gameData.character.hp,
      mp: gameData.character.mp,
      sanity: gameData.character.sanity,
      gold: gameData.character.gold,
      stats: gameData.character.stats,
      conditions: gameData.character.conditions.map(c => c.name),
      abilities: gameData.character.abilities.map(a => a.name),
    },
    inventory: {
      equipped: gameData.inventory.equipped.map(i => i.name),
      consumables: gameData.inventory.consumables.map(i => `${i.name} x${i.qty}`),
      keyItems: gameData.inventory.keyItems.map(i => i.name),
    },
    quests: gameData.quests.filter(q => q.status === 'active').map(q => ({ title: q.title, progress: q.progress })),
    npcs: gameData.npcs.map(n => ({ name: n.name, relationship: n.relationship, location: n.location })),
    combat: gameData.combat.active ? { active: true, round: gameData.combat.round } : { active: false },
    vitalsConfig: gameData.vitalsConfig || {},
  }, null, 2);

  const tagInstructions = `

CRITICAL — METADATA TAG INSTRUCTIONS:
You MUST include metadata tags after EVERY response. The companion app ONLY updates through these tags. If you don't emit tags, the player's stats, inventory, quests, and abilities will NOT update. This is CRITICAL — the companion app is DEAD without your tags.

Tags are parsed silently — the player never sees them.
Format: [TAG_TYPE: key=value, key=value]

Available tags:
[SCENE_UPDATE: location="...", time="...", day=N, mood="..."]
[STAT_CHANGE: stat="...", old=N, new=N, reason="..."]
[HP_CHANGE: old=N, new=N, reason="..."]
[MP_CHANGE: old=N, new=N, reason="..."]
[XP_GAIN: amount=N, source="...", reason="..."]
[ITEM_ACQUIRED: name="...", rarity="...", type="...", desc="..."]
[ITEM_REMOVED: name="...", reason="..."]
[QUEST_UPDATE: id="...", status="...", progress=N, objective="..."]
[NPC_UPDATE: name="...", relationship="...", status="...", location="..."]
[COMBAT_START: enemies="...", environment="..."]
[COMBAT_END: result="...", xp=N]
[ROLL_RESULT: type="...", rolled=N, modifier=N, dc=N, result="..."]
[HIDDEN_TRACKER: tracker="...", change=N, new_value=N]
[CONDITION_ADD: name="...", type="...", desc="..."]
[CONDITION_REMOVE: name="..."]
[LORE_UNLOCK: category="...", title="...", content="..."]
[REVEAL_VITAL: vital="mp|sanity", label="...", fullLabel="...", icon="..."]
[ABILITY_ADD: name="...", type="Active|Passive|Reaction", desc="...", cost="...", cooldown="..."]

IMPORTANT RULES FOR TAGS:
- ALWAYS emit [NPC_UPDATE] the FIRST time the player meets any named NPC.
- ALWAYS emit [ABILITY_ADD] when the player discovers or unlocks a new ability.
- ALWAYS emit [XP_GAIN] when the player earns experience. This MUST include the amount.
- Use [STAT_CHANGE] ONLY when a stat value actually changes — do not re-emit current values.
- In your FIRST response of a new campaign, emit [STAT_CHANGE] for all 5 core stats, [HP_CHANGE], and [XP_GAIN] to initialize the companion app.

Note: vitalsConfig in world state shows which vitals are currently visible. Use REVEAL_VITAL to unlock hidden vitals when narratively appropriate. Only reveal vitals that are currently hidden (visible: false).

ALWAYS include relevant tags at the END of your response. The companion app depends entirely on these tags.`;

  // Replace [YOUR WORLD] placeholders with actual world name
  let processedEngine = dmEngine;
  if (gameData.campaign.name) {
    processedEngine = dmEngine.replace(/\[YOUR WORLD\]/g, gameData.campaign.name);
  }

  // DM Style modifier
  const styleModifier = buildStyleModifier(dmStyle);
  const styleSection = styleModifier ? `\n${styleModifier}\n` : '';

  // Build prompt layers: DM Engine → Freedom+Consequence → Style Modifier → World Bible → World State → Tag Instructions
  const worldBibleSection = worldBible ? `\n\n═══ WORLD BIBLE ═══\n${worldBible}\n` : '';
  return `${processedEngine}${FREEDOM_CONSEQUENCE_PHILOSOPHY}${styleSection}${worldBibleSection}\n\n═══ CURRENT WORLD STATE ═══\n${worldState}\n${tagInstructions}`;
}
