import React, { useState, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

function JournalPanel() {
  const { state, dispatch } = useGame();
  const { authFetch, isAuthenticated } = useAuth();
  const sel = state.selected.session;
  const sessions = state.gameData.sessions;
  const campaign = state.gameData.campaign;
  const cLog = state.gameData.consequenceLog;

  const [recapLoading, setRecapLoading] = useState(false);
  const [recapText, setRecapText] = useState('');
  const [recapError, setRecapError] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareError, setShareError] = useState('');
  const [copied, setCopied] = useState(false);

  const totalXP = sessions.reduce((a,s) => a + s.xp, 0);
  const totalCombats = sessions.reduce((a,s) => a + s.combats, 0);
  const totalDecisions = sessions.reduce((a,s) => a + s.decisions, 0);

  const handleGenerateRecap = useCallback(async () => {
    if (!campaign?.id) {
      setRecapError('No active campaign found.');
      return;
    }
    setRecapLoading(true);
    setRecapError('');
    setRecapText('');
    try {
      const res = await authFetch(`/api/campaigns/${campaign.id}/recap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate recap');
      }
      const data = await res.json();
      setRecapText(data.recap || data.text || data.content || '');
    } catch (e) {
      setRecapError(e.message || 'Failed to generate recap.');
    } finally {
      setRecapLoading(false);
    }
  }, [campaign?.id, authFetch]);

  const handleShareJourney = useCallback(async () => {
    if (!campaign?.id) {
      setShareError('No active campaign found.');
      return;
    }
    setShareLoading(true);
    setShareError('');
    setShareLink('');
    try {
      const res = await authFetch(`/api/campaigns/${campaign.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to share journey');
      }
      const data = await res.json();
      const slug = data.slug || data.share_slug || '';
      const link = slug ? `${window.location.origin}/share/${slug}` : (data.url || data.link || '');
      setShareLink(link);
    } catch (e) {
      setShareError(e.message || 'Failed to create share link.');
    } finally {
      setShareLoading(false);
    }
  }, [campaign?.id, authFetch]);

  const handleCopyLink = useCallback(async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareLink]);

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title"><span className="icon">&#x1F4D3;</span> Session Journal</h1>
      </div>

      {/* Recap & Share Actions */}
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <button
          className="demo-btn"
          onClick={handleGenerateRecap}
          disabled={recapLoading}
          style={{
            padding:'10px 20px',
            fontSize:'0.78rem',
            opacity: recapLoading ? 0.6 : 1,
            cursor: recapLoading ? 'wait' : 'pointer',
          }}
        >
          {recapLoading ? (
            <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <span className="recap-spinner" /> Generating...
            </span>
          ) : (
            <span>&#x1F4DC; Generate Recap</span>
          )}
        </button>
        <button
          className="demo-btn"
          onClick={handleShareJourney}
          disabled={shareLoading}
          style={{
            padding:'10px 20px',
            fontSize:'0.78rem',
            opacity: shareLoading ? 0.6 : 1,
            cursor: shareLoading ? 'wait' : 'pointer',
          }}
        >
          {shareLoading ? (
            <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <span className="recap-spinner" /> Sharing...
            </span>
          ) : (
            <span>&#x1F517; Share Journey</span>
          )}
        </button>
      </div>

      {/* Recap Display */}
      {recapError && (
        <div style={{
          padding:'10px 14px',marginBottom:16,background:'rgba(198,40,40,0.1)',
          border:'1px solid rgba(198,40,40,0.3)',borderRadius:4,
          fontSize:'0.78rem',color:'var(--crimson-bright)',
        }}>
          {recapError}
        </div>
      )}
      {recapText && (
        <div className="recap-card" style={{marginBottom:16}}>
          <div style={{
            fontFamily:"'Cinzel',serif",fontSize:'0.9rem',color:'var(--gold)',
            marginBottom:10,display:'flex',alignItems:'center',gap:8,
          }}>
            <span>&#x1F4DC;</span> Campaign Recap
          </div>
          <div style={{
            fontSize:'0.85rem',lineHeight:1.8,color:'var(--parchment)',
            whiteSpace:'pre-wrap',
          }}>
            {recapText}
          </div>
        </div>
      )}

      {/* Share Link Display */}
      {shareError && (
        <div style={{
          padding:'10px 14px',marginBottom:16,background:'rgba(198,40,40,0.1)',
          border:'1px solid rgba(198,40,40,0.3)',borderRadius:4,
          fontSize:'0.78rem',color:'var(--crimson-bright)',
        }}>
          {shareError}
        </div>
      )}
      {shareLink && (
        <div style={{
          padding:'12px 14px',marginBottom:16,
          background:'rgba(201,168,76,0.06)',border:'1px solid var(--border-gold)',
          borderRadius:4,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',
        }}>
          <span style={{fontSize:'0.78rem',color:'var(--gold)',flexShrink:0}}>&#x1F517; Share Link:</span>
          <code style={{
            flex:1,fontSize:'0.72rem',color:'var(--frost)',
            fontFamily:"'Fira Code',monospace",wordBreak:'break-all',minWidth:0,
          }}>
            {shareLink}
          </code>
          <button
            className="demo-btn"
            onClick={handleCopyLink}
            style={{padding:'4px 12px',fontSize:'0.68rem',flexShrink:0}}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          { label: 'Sessions', value: campaign.session, icon: '\uD83D\uDCC5' },
          { label: 'Total XP', value: totalXP, icon: '\u2B50' },
          { label: 'Combats', value: totalCombats, icon: '\u2694\uFE0F' },
          { label: 'Decisions', value: totalDecisions, icon: '\uD83C\uDFAF' },
        ].map((s,i) => (
          <div key={i} className="card" style={{textAlign:'center'}}>
            <div style={{fontSize:'1.2rem',marginBottom:4}}>{s.icon}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'1.3rem',color:'var(--gold-bright)',fontWeight:700}}>{s.value}</div>
            <div style={{fontSize:'0.65rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:16}}>
        <h4 style={{marginBottom:10}}>{'\u26A0'} Consequence Ledger</h4>
        <table style={{width:'100%',fontSize:'0.75rem',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{color:'var(--muted)',textAlign:'left',borderBottom:'1px solid var(--border-dim)'}}>
              <th style={{padding:'4px 8px'}}>Event</th>
              <th style={{padding:'4px 8px'}}>Session</th>
              <th style={{padding:'4px 8px'}}>Impact</th>
            </tr>
          </thead>
          <tbody>
            {cLog.map((c,i) => (
              <tr key={i} style={{borderBottom:'1px solid var(--border-dim)'}}>
                <td style={{padding:'6px 8px',color:'var(--parchment)'}}>{c.event}</td>
                <td style={{padding:'6px 8px',color:'var(--gold-dim)',fontFamily:"'Fira Code',monospace"}}>S{c.session}</td>
                <td style={{padding:'6px 8px',color:'var(--silver)'}}>{c.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{fontSize:'0.85rem',marginBottom:10}}>Recent Sessions</h3>
      {[...sessions].reverse().map(session => (
        <div key={session.number} className={`session-card ${sel===session.number?'selected':''}`}
          onClick={() => dispatch({ type: 'SELECT_ITEM', category: 'session', payload: session.number })}
          style={{borderColor: sel===session.number ? 'var(--gold)' : undefined}}>
          <div className="session-number">Session {session.number} {'\u00B7'} {session.date}</div>
          <div className="session-title">{session.title}</div>
          <p style={{fontSize:'0.8rem',color:'var(--silver)',lineHeight:1.5,marginBottom:10}}>{session.summary}</p>
          <div className="session-stats">
            <span>{'\u2B50'} +{session.xp} XP</span>
            <span style={{color: session.gold < 0 ? 'var(--crimson-bright)' : 'var(--gold)'}}>&#x1F4B0; {session.gold >= 0 ? '+' : ''}{session.gold}g</span>
            <span>{'\u2694'} {session.combats} combat{session.combats !== 1 ? 's' : ''}</span>
            <span>{'\uD83C\uDFAF'} {session.decisions} decisions</span>
          </div>
          {session.keyMoment && (
            <div style={{marginTop:10,padding:'8px 10px',background:'rgba(201,168,76,0.06)',borderRadius:4,fontSize:'0.78rem',color:'var(--gold)',border:'1px solid var(--border-dim)',fontStyle:'italic'}}>
              Key Moment: "{session.keyMoment}"
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default JournalPanel;
