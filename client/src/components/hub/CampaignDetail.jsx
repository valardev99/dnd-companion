import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ArchiveModal from './ArchiveModal.jsx';

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CampaignDetail({ campaign, onArchived, onBack }) {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [showArchive, setShowArchive] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  if (!campaign) return null;

  const {
    id,
    name,
    character_name,
    character_level,
    world_name,
    world_summary,
    session_recap,
    session_count,
    total_play_hours,
    last_played,
    character_stats,
  } = campaign;

  const handleLaunch = () => {
    navigate(`/play/campaign/${id}`);
  };

  const handleInvite = async () => {
    if (!inviteCode.trim()) return;
    setInviting(true);
    setInviteMsg('');
    try {
      const res = await authFetch(`/api/campaigns/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_code: inviteCode.trim() }),
      });
      if (res.ok) {
        setInviteMsg('Invitation sent!');
        setInviteCode('');
      } else {
        const data = await res.json();
        setInviteMsg(data.detail || 'Failed to send invite');
      }
    } catch (e) {
      setInviteMsg('Failed to send invite');
    }
    setInviting(false);
  };

  const handleArchived = () => {
    setShowArchive(false);
    if (onArchived) onArchived(id);
  };

  return (
    <div className="campaign-detail">
      <button className="campaign-detail-back" onClick={onBack}>
        {'\u2190'} Back to Campaigns
      </button>

      <div className="campaign-detail-header">
        <h2 className="campaign-detail-title">{name || 'Untitled Campaign'}</h2>
        {world_name && <div className="campaign-detail-world">{world_name}</div>}
      </div>

      {/* World Bible Summary */}
      {world_summary && (
        <div className="campaign-detail-section">
          <h4 className="campaign-detail-section-title">World Lore</h4>
          <p className="campaign-detail-text">{world_summary}</p>
        </div>
      )}

      {/* Session Recap */}
      {session_recap && (
        <div className="campaign-detail-section">
          <h4 className="campaign-detail-section-title">Previously on...</h4>
          <p className="campaign-detail-text campaign-detail-recap">{session_recap}</p>
        </div>
      )}

      {/* Character Preview */}
      {character_name && (
        <div className="campaign-detail-section">
          <h4 className="campaign-detail-section-title">Character</h4>
          <div className="campaign-detail-character">
            <span className="campaign-detail-char-name">{character_name}</span>
            {character_level && <span className="campaign-detail-char-level">Level {character_level}</span>}
          </div>
          {character_stats && (
            <div className="campaign-detail-stats">
              {Object.entries(character_stats).map(([stat, val]) => (
                <div key={stat} className="campaign-detail-stat">
                  <span className="campaign-detail-stat-name">{stat}</span>
                  <span className="campaign-detail-stat-value">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="campaign-detail-meta">
        {session_count != null && (
          <div className="campaign-detail-meta-item">
            <span className="campaign-detail-meta-label">Sessions</span>
            <span className="campaign-detail-meta-value">{session_count}</span>
          </div>
        )}
        {total_play_hours != null && (
          <div className="campaign-detail-meta-item">
            <span className="campaign-detail-meta-label">Hours Played</span>
            <span className="campaign-detail-meta-value">{total_play_hours}</span>
          </div>
        )}
        <div className="campaign-detail-meta-item">
          <span className="campaign-detail-meta-label">Last Played</span>
          <span className="campaign-detail-meta-value">{timeAgo(last_played)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="campaign-detail-actions">
        <button className="campaign-detail-launch" onClick={handleLaunch}>
          Launch Session
        </button>
        <button className="campaign-detail-archive" onClick={() => setShowArchive(true)}>
          Archive
        </button>
      </div>

      {/* Invite Friend */}
      <div className="campaign-detail-invite">
        <h4 className="campaign-detail-section-title">Invite an Ally</h4>
        <div className="campaign-detail-invite-row">
          <input
            type="text"
            className="campaign-detail-invite-input"
            placeholder="Friend code..."
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            maxLength={8}
          />
          <button
            className="campaign-detail-invite-btn"
            onClick={handleInvite}
            disabled={inviting || !inviteCode.trim()}
          >
            {inviting ? 'Sending...' : 'Invite'}
          </button>
        </div>
        {inviteMsg && <div className="campaign-detail-invite-msg">{inviteMsg}</div>}
      </div>

      {showArchive && (
        <ArchiveModal
          campaign={campaign}
          onConfirm={handleArchived}
          onCancel={() => setShowArchive(false)}
        />
      )}
    </div>
  );
}
