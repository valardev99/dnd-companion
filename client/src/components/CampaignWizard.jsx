import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { sendChatMessage } from '../services/chatService.js';
import { generateWorldBible } from '../utils/worldBible.js';
import { createBlankGameData } from '../data/defaultGameData.js';
import { PRESETS } from '../data/presets.js';

function CampaignWizard() {
  const { state, dispatch } = useGame();
  // Start at API key step (-2) if no key is configured, otherwise go straight to path selection (-1)
  const [step, setStep] = useState(state.apiKey ? -1 : -2);
  const [wizardMode, setWizardMode] = useState(null); // 'quick' or 'builder' or 'preset'
  const [quickStartText, setQuickStartText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [localApiKey, setLocalApiKey] = useState(state.apiKey || '');
  const [rememberKey, setRememberKey] = useState(state.rememberKey || false);

  const [wizardData, setWizardData] = useState({
    worldName: '', premise: '', sentient: 'partially', worldAge: 'standard',
    darkness: 65, horror: 'creeping', comedy: 'dry', inspirations: [],
    magicLevel: 'common', magicSource: 'learned', magicCost: 'expensive', magicFlavor: '',
    essenceLabel: '', sanityLabel: '', essenceVisible: true, sanityVisible: true,
    startingLocation: 'settlement', openingSituation: 'stranger', initialConflict: '', factions: '',
    playerName: 'Chris', characterName: '', race: '', characterConcept: '',
  });

  const update = (key, val) => setWizardData(prev => ({ ...prev, [key]: val }));
  const toggleInspiration = (tag) => {
    setWizardData(prev => {
      const has = prev.inspirations.includes(tag);
      if (has) return { ...prev, inspirations: prev.inspirations.filter(t => t !== tag) };
      if (prev.inspirations.length >= 3) return prev;
      return { ...prev, inspirations: [...prev.inspirations, tag] };
    });
  };

  const canProceed = step === -2 ? localApiKey.trim().length > 0 : step === 0 ? wizardData.worldName.trim().length > 0 : step === -1 ? (wizardMode !== null && (wizardMode !== 'preset' || selectedPreset !== null)) : true;
  const stepTitles = ['Forge Your World', 'Set the Tone', 'Shape the Magic', 'The Opening Chapter', 'Your Character'];
  const stepIcons = ['🌍', '🎭', '✨', '📖', '⚔️'];

  const saveApiKey = () => {
    if (!localApiKey.trim()) return;
    dispatch({ type: 'SET_API_KEY', payload: localApiKey.trim() });
    dispatch({ type: 'SET_API_STATUS', payload: 'connected' });
    dispatch({ type: 'SET_REMEMBER_KEY', payload: rememberKey });
    setStep(-1);
  };

  const beginCampaign = () => {
    const worldBible = generateWorldBible(wizardData);
    const gameData = createBlankGameData(wizardData);
    dispatch({ type: 'START_NEW_CAMPAIGN', payload: { gameData, worldBible } });
    localStorage.removeItem('dnd-chat');
    localStorage.removeItem('dnd-gameData');
    localStorage.removeItem('dnd-worldBible');
    // Set flag to auto-send opening message after state updates
    dispatch({ type: 'SET_PENDING_OPENING', payload: true });
  };

  const beginQuickStart = () => {
    if (!quickStartText.trim()) return;
    const gameData = createBlankGameData({ worldName: 'New Campaign', playerName: 'Chris' });
    const worldBible = `# Quick Start Campaign\n\nThe player has provided a freeform world description. Use it to establish the setting, create an opening scene, and begin character creation.\n\nBuild the world, NPCs, conflicts, and magic system from the player's description. Assign the player a character that fits naturally into the world they described. Start with the character creation process, then launch directly into the opening scene.\n`;
    dispatch({ type: 'START_NEW_CAMPAIGN', payload: { gameData, worldBible } });
    localStorage.removeItem('dnd-chat');
    localStorage.removeItem('dnd-gameData');
    localStorage.removeItem('dnd-worldBible');
    // Send the freeform text as the first chat message
    setTimeout(() => {
      if (state.apiKey) {
        sendChatMessage(quickStartText, { ...state, gameData, worldBible, chatMessages: [] }, dispatch);
      } else {
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'player', content: quickStartText } });
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'system', content: '⚠ No API key configured. Go to Settings → API Configuration to add your key, then resend your message.' } });
      }
    }, 100);
  };

  const beginPreset = () => {
    if (!selectedPreset) return;
    const preset = PRESETS.find(p => p.id === selectedPreset);
    if (!preset) return;
    const presetWizardData = { worldName: preset.worldName, premise: preset.premise, sentient: preset.sentient, worldAge: preset.worldAge, characterName: '', playerName: 'Chris' };
    const gameData = createBlankGameData(presetWizardData);
    const worldBible = `# ${preset.worldName} — Preset Campaign\n\n## Core Premise\n${preset.premise}\n\n## Tone\n${preset.tone}\n\n## Magic Level\n${preset.magicLevel}\n\nThis is a preset campaign. Build the world, NPCs, factions, conflicts, and magic system from this premise. Create a rich, living world. Assign the player a class and starting stats that fit this setting. Begin with character creation, then launch into the opening scene.\n`;
    dispatch({ type: 'START_NEW_CAMPAIGN', payload: { gameData, worldBible } });
    localStorage.removeItem('dnd-chat');
    localStorage.removeItem('dnd-gameData');
    localStorage.removeItem('dnd-worldBible');
    dispatch({ type: 'SET_PENDING_OPENING', payload: true });
  };

  const OptionCard = ({ value, current, onSelect, icon, label, desc }) => (
    <div className={`wizard-option-card ${current === value ? 'selected' : ''}`} onClick={() => onSelect(value)}>
      {icon && <span className="wizard-option-icon">{icon}</span>}
      <span className="wizard-option-label">{label}</span>
      {desc && <span className="wizard-option-desc">{desc}</span>}
    </div>
  );

  const renderStep = () => {
    switch(step) {
      case -2: return (
        <div className="wizard-step-content">
          <p style={{textAlign:'center',fontSize:'0.85rem',color:'var(--silver)',marginBottom:20,lineHeight:1.6}}>
            Wanderlore AI uses an AI service to power your Dungeon Master. Connect your API key to get started.
          </p>
          <div className="wizard-field">
            <label className="wizard-label">API Key <span className="wizard-required">*</span></label>
            <input
              className="wizard-input"
              type="password"
              value={localApiKey}
              onChange={e => setLocalApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              autoFocus
              style={{fontFamily:"'Fira Code',monospace",fontSize:'0.8rem'}}
            />
          </div>
          <div className="wizard-field" style={{marginTop:8}}>
            <label style={{fontSize:'0.75rem',color:'var(--muted)',display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={rememberKey} onChange={e => setRememberKey(e.target.checked)} />
              Remember my key on this device
            </label>
          </div>
          <div style={{marginTop:16,padding:'12px 16px',background:'rgba(201,168,76,0.08)',border:'1px solid var(--border-dim)',borderRadius:8}}>
            <p style={{fontSize:'0.72rem',color:'var(--silver)',lineHeight:1.6,margin:0}}>
              <strong style={{color:'var(--gold)'}}>Where to get a key:</strong> Sign up at{' '}
              <span style={{color:'var(--gold-bright)',fontFamily:"'Fira Code',monospace"}}>openrouter.ai</span>{' '}
              and create an API key. Your key is stored locally and never sent to our servers.
            </p>
          </div>
          {state.apiKey && (
            <p style={{textAlign:'center',fontSize:'0.75rem',color:'var(--emerald-bright)',marginTop:12}}>
              ● API key already configured
            </p>
          )}
        </div>
      );
      case -1: return (
        <div className="wizard-step-content">
          <p style={{textAlign:'center',fontSize:'0.85rem',color:'var(--silver)',marginBottom:20,lineHeight:1.6}}>
            How would you like to create your campaign?
          </p>
          <div className="wizard-option-grid cols-3" style={{marginBottom:20}}>
            <div className={`wizard-option-card ${wizardMode === 'quick' ? 'selected' : ''}`} onClick={() => setWizardMode('quick')} style={{padding:'20px 16px'}}>
              <span className="wizard-option-icon">⚡</span>
              <span className="wizard-option-label">Quick Start</span>
              <span className="wizard-option-desc">Describe your world freely</span>
            </div>
            <div className={`wizard-option-card ${wizardMode === 'builder' ? 'selected' : ''}`} onClick={() => setWizardMode('builder')} style={{padding:'20px 16px'}}>
              <span className="wizard-option-icon">🔨</span>
              <span className="wizard-option-label">World Builder</span>
              <span className="wizard-option-desc">Step-by-step forge</span>
            </div>
            <div className={`wizard-option-card ${wizardMode === 'preset' ? 'selected' : ''}`} onClick={() => setWizardMode('preset')} style={{padding:'20px 16px'}}>
              <span className="wizard-option-icon">📜</span>
              <span className="wizard-option-label">Presets</span>
              <span className="wizard-option-desc">Ready-made campaigns</span>
            </div>
          </div>
          {wizardMode === 'quick' && (
            <div className="wizard-field" style={{marginTop:8}}>
              <label className="wizard-label">Describe Your World</label>
              <textarea className="wizard-textarea" value={quickStartText} onChange={e => setQuickStartText(e.target.value)}
                placeholder="A dark fantasy world where magic is fueled by memories. I want to play a rogue who's lost their past. There's a war between two ancient kingdoms and something sinister lurking beneath the capital city..."
                rows={6} autoFocus />
              <p style={{fontSize:'0.68rem',color:'var(--muted)',marginTop:6,fontStyle:'italic'}}>
                Include anything — setting, tone, character ideas, magic systems, themes. The DM will build everything from your vision.
              </p>
            </div>
          )}
          {wizardMode === 'preset' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:8}}>
              {PRESETS.map(p => (
                <div key={p.id} className={`wizard-option-card ${selectedPreset === p.id ? 'selected' : ''}`} onClick={() => setSelectedPreset(p.id)}
                  style={{padding:'16px',textAlign:'left',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span style={{fontSize:'1.3rem'}}>{p.icon}</span>
                    <span style={{fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:'0.9rem',color:'var(--gold-bright)'}}>{p.name}</span>
                  </div>
                  <span className="wizard-option-desc" style={{fontSize:'0.75rem',lineHeight:1.4}}>{p.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
      case 0: return (
        <div className="wizard-step-content">
          <div className="wizard-field">
            <label className="wizard-label">World Name <span className="wizard-required">*</span></label>
            <input className="wizard-input" type="text" value={wizardData.worldName} onChange={e => update('worldName', e.target.value)} placeholder="Valdris, Aethermoor, The Hollow Wastes..." autoFocus />
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Core Premise</label>
            <textarea className="wizard-textarea" value={wizardData.premise} onChange={e => update('premise', e.target.value)} placeholder="A dying continent where magic is sentient and the gods have gone silent..." rows={3} />
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Is the World Sentient?</label>
            <div className="wizard-option-grid cols-3">
              <OptionCard value="yes" current={wizardData.sentient} onSelect={v => update('sentient', v)} icon="👁" label="Yes" desc="Watches and judges" />
              <OptionCard value="partially" current={wizardData.sentient} onSelect={v => update('sentient', v)} icon="🌀" label="Echoes" desc="Residual awareness" />
              <OptionCard value="no" current={wizardData.sentient} onSelect={v => update('sentient', v)} icon="🪨" label="No" desc="Standard planet" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">World Age</label>
            <div className="wizard-option-grid cols-3">
              <OptionCard value="standard" current={wizardData.worldAge} onSelect={v => update('worldAge', v)} icon="🏛" label="Standard" />
              <OptionCard value="young" current={wizardData.worldAge} onSelect={v => update('worldAge', v)} icon="🌱" label="New World" />
              <OptionCard value="dying" current={wizardData.worldAge} onSelect={v => update('worldAge', v)} icon="💀" label="Dying" />
            </div>
          </div>
        </div>
      );

      case 1: return (
        <div className="wizard-step-content">
          <div className="wizard-field">
            <label className="wizard-label">Darkness / Hope Ratio</label>
            <div className="wizard-slider-container">
              <span className="wizard-slider-label">💀 Grimdark</span>
              <input type="range" className="wizard-slider" min="0" max="100" value={wizardData.darkness} onChange={e => update('darkness', parseInt(e.target.value))} />
              <span className="wizard-slider-label">☀️ Hopeful</span>
            </div>
            <div className="wizard-slider-value">{wizardData.darkness}/100</div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Horror Level</label>
            <div className="wizard-option-grid cols-3">
              <OptionCard value="none" current={wizardData.horror} onSelect={v => update('horror', v)} icon="😌" label="None" desc="Clean danger" />
              <OptionCard value="creeping" current={wizardData.horror} onSelect={v => update('horror', v)} icon="😰" label="Creeping" desc="Subtle dread" />
              <OptionCard value="visceral" current={wizardData.horror} onSelect={v => update('horror', v)} icon="😱" label="Visceral" desc="Full nightmare" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Comedy Level</label>
            <div className="wizard-option-grid cols-3">
              <OptionCard value="serious" current={wizardData.comedy} onSelect={v => update('comedy', v)} icon="😐" label="Serious" desc="Grounded tone" />
              <OptionCard value="dry" current={wizardData.comedy} onSelect={v => update('comedy', v)} icon="😏" label="Dry Wit" desc="Gallows humor" />
              <OptionCard value="chaotic" current={wizardData.comedy} onSelect={v => update('comedy', v)} icon="🤪" label="Chaotic" desc="Absurd universe" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Inspiration Tags <span className="wizard-hint">(pick 1-3)</span></label>
            <div className="wizard-chip-grid">
              {['LitRPG Progression', 'Dark Souls', 'Lovecraftian', 'Sword & Sorcery', 'Political Intrigue', 'Survival Horror', 'Epic Quest', 'Mystery'].map(tag => (
                <button key={tag} className={`wizard-chip ${wizardData.inspirations.includes(tag) ? 'selected' : ''}`} onClick={() => toggleInspiration(tag)}>{tag}</button>
              ))}
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div className="wizard-step-content">
          <div className="wizard-field">
            <label className="wizard-label">Magic Prevalence</label>
            <div className="wizard-option-grid cols-4">
              <OptionCard value="none" current={wizardData.magicLevel} onSelect={v => update('magicLevel', v)} icon="🚫" label="None" desc="No magic" />
              <OptionCard value="low" current={wizardData.magicLevel} onSelect={v => update('magicLevel', v)} icon="🕯" label="Low" desc="Rare & feared" />
              <OptionCard value="common" current={wizardData.magicLevel} onSelect={v => update('magicLevel', v)} icon="🔮" label="Common" desc="Known force" />
              <OptionCard value="high" current={wizardData.magicLevel} onSelect={v => update('magicLevel', v)} icon="⚡" label="High" desc="Saturates all" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Source of Magic</label>
            <div className="wizard-option-grid cols-3">
              <OptionCard value="learned" current={wizardData.magicSource} onSelect={v => update('magicSource', v)} icon="📚" label="Learned" desc="Through study & practice" />
              <OptionCard value="innate" current={wizardData.magicSource} onSelect={v => update('magicSource', v)} icon="🧬" label="Innate" desc="Birthright & bloodline" />
              <OptionCard value="custom" current={wizardData.magicSource} onSelect={v => update('magicSource', v)} icon="✏️" label="Custom" desc="You decide" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Cost of Magic</label>
            <div className="wizard-option-grid cols-3">
              <OptionCard value="free" current={wizardData.magicCost} onSelect={v => update('magicCost', v)} icon="🎁" label="Free" desc="Minimal cost" />
              <OptionCard value="expensive" current={wizardData.magicCost} onSelect={v => update('magicCost', v)} icon="💰" label="Expensive" desc="Demands a price" />
              <OptionCard value="catastrophic" current={wizardData.magicCost} onSelect={v => update('magicCost', v)} icon="💥" label="Catastrophic" desc="Risks disaster" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Magic Flavor <span className="wizard-hint">(optional)</span></label>
            <input className="wizard-input" type="text" value={wizardData.magicFlavor} onChange={e => update('magicFlavor', e.target.value)} placeholder="Rune-carved bones, blood sigils, crystallized emotions..." />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="wizard-field">
              <label className="wizard-label">Energy Resource Name <span className="wizard-hint">(1-2 words)</span></label>
              <input className="wizard-input" type="text" value={wizardData.essenceLabel} onChange={e => update('essenceLabel', e.target.value)} placeholder="Mana, Chi, Essence, Flux..." />
              <span style={{fontSize:'0.65rem',color:'var(--muted)',marginTop:2,display:'block'}}>Keep it short — enter a name, not a description.</span>
              <label style={{fontSize:'0.7rem',color:'var(--muted)',display:'flex',alignItems:'center',gap:6,marginTop:6,cursor:'pointer'}}>
                <input type="checkbox" checked={wizardData.essenceVisible} onChange={e => update('essenceVisible', e.target.checked)} />
                Show from start
              </label>
            </div>
            <div className="wizard-field">
              <label className="wizard-label">Mental Tracker Name <span className="wizard-hint">(optional)</span></label>
              <input className="wizard-input" type="text" value={wizardData.sanityLabel} onChange={e => update('sanityLabel', e.target.value)} placeholder="Sanity, Resolve, Clarity..." />
              <label style={{fontSize:'0.7rem',color:'var(--muted)',display:'flex',alignItems:'center',gap:6,marginTop:6,cursor:'pointer'}}>
                <input type="checkbox" checked={wizardData.sanityVisible} onChange={e => update('sanityVisible', e.target.checked)} />
                Show from start
              </label>
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div className="wizard-step-content">
          <div className="wizard-field">
            <label className="wizard-label">Starting Location</label>
            <div className="wizard-option-grid cols-5">
              <OptionCard value="settlement" current={wizardData.startingLocation} onSelect={v => update('startingLocation', v)} icon="🏘" label="Settlement" />
              <OptionCard value="ruins" current={wizardData.startingLocation} onSelect={v => update('startingLocation', v)} icon="🏚" label="Ruins" />
              <OptionCard value="city" current={wizardData.startingLocation} onSelect={v => update('startingLocation', v)} icon="🏰" label="City" />
              <OptionCard value="wilderness" current={wizardData.startingLocation} onSelect={v => update('startingLocation', v)} icon="🌲" label="Wilderness" />
              <OptionCard value="prison" current={wizardData.startingLocation} onSelect={v => update('startingLocation', v)} icon="⛓" label="Prison" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Opening Situation</label>
            <div className="wizard-option-grid cols-2">
              <OptionCard value="stranger" current={wizardData.openingSituation} onSelect={v => update('openingSituation', v)} icon="🚶" label="Stranger Arrives" desc="No allies, no reputation" />
              <OptionCard value="local" current={wizardData.openingSituation} onSelect={v => update('openingSituation', v)} icon="🏠" label="Local in Crisis" desc="Ordinary life shattered" />
              <OptionCard value="amnesia" current={wizardData.openingSituation} onSelect={v => update('openingSituation', v)} icon="❓" label="Amnesia" desc="Fragments surface through play" />
              <OptionCard value="hired" current={wizardData.openingSituation} onSelect={v => update('openingSituation', v)} icon="📋" label="Hired for a Job" desc="More than it appears" />
            </div>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Initial Conflict <span className="wizard-hint">(optional — Claude generates if blank)</span></label>
            <input className="wizard-input" type="text" value={wizardData.initialConflict} onChange={e => update('initialConflict', e.target.value)} placeholder="A murder in the town square, a strange plague, missing children..." />
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Factions & Powers <span className="wizard-hint">(optional)</span></label>
            <textarea className="wizard-textarea" value={wizardData.factions} onChange={e => update('factions', e.target.value)} placeholder="A corrupt merchant guild, a dying order of knights, a cult worshipping something beneath the earth..." rows={3} />
          </div>
        </div>
      );

      case 4: return (
        <div className="wizard-step-content">
          <div className="wizard-field">
            <label className="wizard-label">Character Name <span className="wizard-hint">(leave blank to choose in chat)</span></label>
            <input className="wizard-input" type="text" value={wizardData.characterName} onChange={e => update('characterName', e.target.value)} placeholder="Aldric, Theron, Lyra..." />
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Race Preference</label>
            <select className="wizard-select" value={wizardData.race} onChange={e => update('race', e.target.value)}>
              <option value="">— Choose —</option>
              <option value="Human">Human</option>
              <option value="Elf">Elf</option>
              <option value="Dwarf">Dwarf</option>
              <option value="Halfling">Halfling</option>
              <option value="Orc">Orc</option>
              <option value="Tiefling">Tiefling</option>
              <option value="Exotic">Exotic / Other</option>
              <option value="decide">Let the World Decide</option>
            </select>
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Character Concept <span className="wizard-hint">(optional backstory hooks)</span></label>
            <textarea className="wizard-textarea" value={wizardData.characterConcept} onChange={e => update('characterConcept', e.target.value)} placeholder="A disgraced soldier seeking redemption, a street thief with a hidden bloodline, a scholar fleeing a burning library..." rows={3} />
          </div>
          <div className="wizard-field">
            <label className="wizard-label">World Bible Preview</label>
            <div className="wizard-preview">{generateWorldBible(wizardData)}</div>
          </div>
          <div className="wizard-info-box">
            ⚔️ Your class, stats, and abilities will be assigned by the world during play through the character creation process.
          </div>
        </div>
      );
    }
  };

  return (
    <div className="wizard-overlay" onClick={e => e.target === e.currentTarget && dispatch({ type: 'SHOW_CAMPAIGN_WIZARD', payload: false })}>
      <div className="wizard-container">
        <button className="wizard-close" onClick={() => dispatch({ type: 'SHOW_CAMPAIGN_WIZARD', payload: false })}>✕</button>
        <div className="wizard-header">
          <h2 className="wizard-title">{step === -2 ? '🔑 Connect Your Key' : step === -1 ? '🗺️ Choose Your Path' : `${stepIcons[step]} ${stepTitles[step]}`}</h2>
          {step >= 0 && (
            <>
              <div className="wizard-steps">
                {stepTitles.map((_, i) => (
                  <div key={i} className={`wizard-dot ${i === step ? 'active' : i < step ? 'completed' : ''}`} onClick={() => { if (i < step || (i === step + 1 && canProceed)) setStep(i); }} />
                ))}
              </div>
              <div className="wizard-step-label">Step {step + 1} of 5</div>
            </>
          )}
        </div>

        {renderStep()}

        <div className="wizard-nav">
          {step > 0 && <button className="wizard-btn wizard-btn-back" onClick={() => setStep(step - 1)}>← Back</button>}
          {step === 0 && <button className="wizard-btn wizard-btn-back" onClick={() => { setStep(-1); setWizardMode('builder'); }}>← Back</button>}
          {step === -1 && <button className="wizard-btn wizard-btn-back" onClick={() => setStep(-2)}>← API Key</button>}
          <div style={{flex:1}} />
          {step === -2 ? (
            <button className="wizard-btn wizard-btn-next" onClick={saveApiKey} disabled={!localApiKey.trim()}>
              {state.apiKey ? 'Next →' : 'Connect & Continue →'}
            </button>
          ) : step === -1 && wizardMode === 'quick' ? (
            <button className="wizard-btn wizard-btn-begin" onClick={beginQuickStart} disabled={!quickStartText.trim()}>⚡ Begin Adventure</button>
          ) : step === -1 && wizardMode === 'preset' ? (
            <button className="wizard-btn wizard-btn-begin" onClick={beginPreset} disabled={!selectedPreset}>⚔️ Launch Campaign</button>
          ) : step === -1 && wizardMode === 'builder' ? (
            <button className="wizard-btn wizard-btn-next" onClick={() => setStep(0)}>Next →</button>
          ) : step < 4 ? (
            <button className="wizard-btn wizard-btn-next" onClick={() => canProceed && setStep(step + 1)} disabled={!canProceed}>Next →</button>
          ) : (
            <button className="wizard-btn wizard-btn-begin" onClick={beginCampaign}>⚔️ Begin Campaign</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampaignWizard;
