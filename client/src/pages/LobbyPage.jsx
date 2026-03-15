import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  joinCampaignRoom,
  leaveCampaignRoom,
  emitPlayerReady,
  onPlayerReady,
  onSessionStart,
  emitSessionStart,
} from '../services/socketService.js';
import CharacterBuilder from '../components/hub/CharacterBuilder.jsx';

export default function LobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readyState, setReadyState] = useState({}); // { [userId]: true/false }
  const [launching, setLaunching] = useState(false);

  const isOwner = campaign && user && campaign.owner_id === user.id;

  // Fetch campaign data
  const fetchCampaign = useCallback(async () => {
    try {
      const res = await authFetch(`/api/campaigns/${id}`);
      if (!res.ok) throw new Error('Failed to load campaign');
      const data = await res.json();
      setCampaign(data);

      // Build players list from campaign data
      const playerList = [];
      // Owner
      playerList.push({
        userId: data.owner_id,
        username: data.owner_username || 'Owner',
        isOwner: true,
        character: data.game_data?.character || null,
      });
      // Invited players from campaign_players
      if (data.players) {
        data.players.forEach(p => {
          playerList.push({
            userId: p.user_id,
            username: p.username,
            isOwner: false,
            character: p.character_data || null,
          });
        });
      }
      setPlayers(playerList);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, authFetch]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Join campaign room on mount
  useEffect(() => {
    joinCampaignRoom(id);
    return () => leaveCampaignRoom(id);
  }, [id]);

  // Listen for player_ready events
  useEffect(() => {
    const cleanup = onPlayerReady((data) => {
      setReadyState(prev => ({ ...prev, [data.user_id]: true }));
    });
    return cleanup;
  }, []);

  // Listen for session_start — auto-navigate for non-owner
  useEffect(() => {
    const cleanup = onSessionStart(() => {
      navigate(`/play/campaign/${id}`);
    });
    return cleanup;
  }, [id, navigate]);

  const handleReady = () => {
    if (!user) return;
    setReadyState(prev => ({ ...prev, [user.id]: true }));
    emitPlayerReady(id);
  };

  const allReady = players.length >= 2 && players.every(p => readyState[p.userId]);

  const handleLaunch = () => {
    if (!allReady) return;
    setLaunching(true);
    emitSessionStart(id);
    navigate(`/play/campaign/${id}`);
  };

  const handleCharacterCreated = () => {
    // Re-fetch campaign to get updated player data
    fetchCampaign();
  };

  // Check if the current user is an invited player who needs to create a character
  const currentPlayer = players.find(p => p.userId === user?.id);
  const needsCharacter = currentPlayer && !currentPlayer.isOwner && !currentPlayer.character;

  if (loading) {
    return (
      <div className="lobby-page">
        <div className="lobby-loading">
          <div className="lobby-loading-icon">&#9876;</div>
          <p>Preparing the war room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lobby-page">
        <div className="lobby-error">
          <h2>Failed to Load Lobby</h2>
          <p>{error}</p>
          <Link to="/play" className="lobby-back-link">Return to Command Center</Link>
        </div>
      </div>
    );
  }

  // World briefing for character builder
  const worldBriefing = campaign ? {
    genre: campaign.game_data?.campaign?.genre || 'Fantasy',
    tone: campaign.game_data?.campaign?.tone || 'Dark',
    settingSummary: campaign.world_summary || campaign.game_data?.campaign?.premise || 'A mysterious world awaits...',
  } : null;

  return (
    <div className="lobby-page">
      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <Link to="/play" className="lobby-back-btn">&#8592; Command Center</Link>
          <h1 className="lobby-title">{campaign?.name || 'Multiplayer Lobby'}</h1>
          <p className="lobby-subtitle">Prepare for adventure</p>
        </div>

        {/* Session Recap */}
        {campaign?.session_recap && (
          <div className="lobby-recap">
            <h3 className="lobby-recap-title">Previously on...</h3>
            <p className="lobby-recap-text">{campaign.session_recap}</p>
          </div>
        )}

        {/* Character Builder for invited players without a character */}
        {needsCharacter && (
          <div className="lobby-character-builder">
            <CharacterBuilder
              campaignId={id}
              worldBriefing={worldBriefing}
              onCharacterCreated={handleCharacterCreated}
            />
          </div>
        )}

        {/* Player Cards */}
        <div className="lobby-players">
          <h3 className="lobby-section-title">Adventuring Party</h3>
          <div className="lobby-player-grid">
            {players.map((player) => (
              <div key={player.userId} className={`lobby-player-card ${readyState[player.userId] ? 'ready' : ''}`}>
                <div className="lobby-player-badge">
                  {player.isOwner ? 'Host' : 'Ally'}
                </div>
                <div className="lobby-player-name">{player.username}</div>
                {player.character ? (
                  <div className="lobby-character-info">
                    <div className="lobby-char-name">{player.character.name || 'Unnamed Hero'}</div>
                    <div className="lobby-char-details">
                      {player.character.race && <span>{player.character.race}</span>}
                      {player.character.class && <span>{player.character.class}</span>}
                      {player.character.level && <span>Level {player.character.level}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="lobby-no-character">
                    <span>Awaiting character creation...</span>
                  </div>
                )}
                <div className="lobby-ready-status">
                  {readyState[player.userId] ? (
                    <span className="lobby-ready-badge">Ready</span>
                  ) : (
                    <span className="lobby-not-ready-badge">Not Ready</span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slot if only one player */}
            {players.length < 2 && (
              <div className="lobby-player-card empty">
                <div className="lobby-player-badge">Empty</div>
                <div className="lobby-player-name">Awaiting Ally</div>
                <div className="lobby-no-character">
                  <span>Invite a friend to join</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="lobby-actions">
          {user && !readyState[user.id] && (
            <button className="lobby-ready-btn" onClick={handleReady}>
              Ready Up
            </button>
          )}
          {user && readyState[user.id] && (
            <button className="lobby-ready-btn confirmed" disabled>
              You are Ready
            </button>
          )}
          {isOwner && (
            <button
              className="lobby-launch-btn"
              onClick={handleLaunch}
              disabled={!allReady || launching}
            >
              {launching ? 'Launching...' : 'Launch Session'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
