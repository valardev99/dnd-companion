import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const RACE_OPTIONS = [
  { value: '', label: '-- Choose --' },
  { value: 'Human', label: 'Human' },
  { value: 'Elf', label: 'Elf' },
  { value: 'Dwarf', label: 'Dwarf' },
  { value: 'Halfling', label: 'Halfling' },
  { value: 'Orc', label: 'Orc' },
  { value: 'Tiefling', label: 'Tiefling' },
  { value: 'Exotic', label: 'Exotic / Other' },
  { value: 'decide', label: 'Let the World Decide' },
];

export default function CharacterBuilder({ campaignId, worldBriefing, onCharacterCreated }) {
  const { authFetch } = useAuth();
  const [characterName, setCharacterName] = useState('');
  const [race, setRace] = useState('');
  const [characterConcept, setCharacterConcept] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!characterName.trim()) {
      setError('Your character needs a name, adventurer.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch(`/api/campaigns/${campaignId}/player/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: characterName.trim(),
          race: race || 'decide',
          concept: characterConcept.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create character');
      }
      if (onCharacterCreated) onCharacterCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="character-builder">
      <h3 className="character-builder-title">Forge Your Character</h3>

      {/* World Briefing */}
      {worldBriefing && (
        <div className="character-builder-briefing">
          <h4 className="character-builder-briefing-title">The World Awaits</h4>
          <div className="character-builder-briefing-details">
            {worldBriefing.genre && (
              <span className="character-builder-tag">{worldBriefing.genre}</span>
            )}
            {worldBriefing.tone && (
              <span className="character-builder-tag">{worldBriefing.tone}</span>
            )}
          </div>
          {worldBriefing.settingSummary && (
            <p className="character-builder-briefing-text">{worldBriefing.settingSummary}</p>
          )}
        </div>
      )}

      {/* Character Name */}
      <div className="wizard-field">
        <label className="wizard-label">
          Character Name <span className="wizard-required">*</span>
        </label>
        <input
          className="wizard-input"
          type="text"
          value={characterName}
          onChange={e => setCharacterName(e.target.value)}
          placeholder="Aldric, Theron, Lyra..."
          autoFocus
        />
      </div>

      {/* Race */}
      <div className="wizard-field">
        <label className="wizard-label">Race Preference</label>
        <select
          className="wizard-select"
          value={race}
          onChange={e => setRace(e.target.value)}
        >
          {RACE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Concept / Backstory */}
      <div className="wizard-field">
        <label className="wizard-label">
          Character Concept <span className="wizard-hint">(optional backstory hooks)</span>
        </label>
        <textarea
          className="wizard-textarea"
          value={characterConcept}
          onChange={e => setCharacterConcept(e.target.value)}
          placeholder="A disgraced soldier seeking redemption, a street thief with a hidden bloodline, a scholar fleeing a burning library..."
          rows={3}
        />
      </div>

      {error && <div className="character-builder-error">{error}</div>}

      <button
        className="lobby-ready-btn"
        onClick={handleSubmit}
        disabled={submitting || !characterName.trim()}
        style={{ width: '100%', marginTop: 12 }}
      >
        {submitting ? 'Creating...' : 'Create Character'}
      </button>
    </div>
  );
}
