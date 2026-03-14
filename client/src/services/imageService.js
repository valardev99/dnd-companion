// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION SERVICE — Generates character/NPC portraits via Grok
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a portrait image for a character or NPC.
 * Calls the backend /api/generate-image endpoint which proxies to xAI Grok.
 *
 * @param {Object} params
 * @param {string} params.apiKey - xAI API key
 * @param {string} params.name - Character/NPC name
 * @param {string} [params.race] - Race/species
 * @param {string} [params.characterClass] - Class
 * @param {string} [params.description] - Physical description
 * @param {string} [params.role] - NPC role
 * @param {string} [params.relationship] - NPC relationship type
 * @returns {Promise<{url: string, revised_prompt: string} | null>}
 */
export async function generatePortrait({
  apiKey,
  name,
  race = '',
  characterClass = '',
  description = '',
  role = '',
  relationship = '',
}) {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        name,
        race,
        characterClass,
        description,
        role,
        relationship,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Image generation failed' }));
      console.error('Image generation error:', err.detail || err);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('Image generation network error:', err);
    return null;
  }
}

/**
 * Generate a portrait and dispatch the result to the game state.
 * Non-blocking — fires and forgets so it doesn't block tag processing.
 *
 * @param {Object} params - Same as generatePortrait
 * @param {Function} dispatch - GameContext dispatch function
 * @param {'character'|'npc'} target - Whether this is for the player character or an NPC
 */
export function generatePortraitAsync({ apiKey, name, race, characterClass, description, role, relationship }, dispatch, target = 'npc') {
  // Don't block — run in background
  generatePortrait({ apiKey, name, race, characterClass, description, role, relationship })
    .then(result => {
      if (result && result.url) {
        if (target === 'character') {
          dispatch({ type: 'SET_CHARACTER_IMAGE', payload: result.url });
        } else {
          dispatch({ type: 'SET_NPC_IMAGE', payload: { name, image: result.url } });
        }
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            title: 'PORTRAIT GENERATED',
            body: `A portrait of ${name} has been revealed.`,
            style: 'arcane',
          },
        });
      }
    })
    .catch(err => {
      console.warn('Portrait generation failed silently:', err);
    });
}
