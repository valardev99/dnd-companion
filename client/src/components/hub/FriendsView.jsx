import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AddFriendModal from './AddFriendModal.jsx';

function PresenceIndicator({ status, detail }) {
  const statusMap = {
    online: { className: 'presence-online', text: 'Online' },
    in_game: { className: 'presence-in-game', text: detail ? `In ${detail}` : 'In Campaign' },
    idle: { className: 'presence-idle', text: detail || 'Idle' },
    offline: { className: 'presence-offline', text: detail || 'Offline' },
  };
  const s = statusMap[status] || statusMap.offline;

  return (
    <span className={`friend-presence ${s.className}`}>
      <span className="presence-dot" />
      <span className="presence-text">{s.text}</span>
    </span>
  );
}

export default function FriendsView() {
  const { user, token, authFetch } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchFriends = useCallback(async () => {
    if (!token) return; // Don't fetch until authenticated
    try {
      const res = await authFetch('/api/friends/');
      if (res.ok) {
        const data = await res.json();
        // Backend returns a raw list of friends, not {friends: [...]}
        setFriends(Array.isArray(data) ? data : data.friends || []);
        setPendingIncoming(Array.isArray(data) ? [] : data.pending_incoming || []);
      }
    } catch (e) {
      // API may not exist yet
    }
    setLoading(false);
  }, [authFetch, token]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleAccept = async (friendId) => {
    try {
      await authFetch(`/api/friends/${friendId}/accept`, { method: 'POST' });
      fetchFriends();
    } catch (e) {}
  };

  const handleDecline = async (friendId) => {
    try {
      await authFetch(`/api/friends/${friendId}/decline`, { method: 'POST' });
      fetchFriends();
    } catch (e) {}
  };

  const copyFriendCode = () => {
    if (user?.friend_code) {
      navigator.clipboard.writeText(user.friend_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="friends-view">
      {/* Your Friend Code */}
      <div className="friends-your-code">
        <div className="friends-your-code-label">Your Friend Code</div>
        <div className="friends-your-code-display">
          <span className="friends-your-code-value">#{user?.friend_code || '--------'}</span>
          <button className="friends-copy-btn" onClick={copyFriendCode}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="friends-your-code-hint">Share this code with others so they can add you as an ally.</div>
      </div>

      {/* Add Friend Button */}
      <div className="friends-header">
        <h2 className="friends-title">Allies</h2>
        <button className="friends-add-btn" onClick={() => setShowAddModal(true)}>
          + Add Ally
        </button>
      </div>

      {/* Pending Requests */}
      {pendingIncoming.length > 0 && (
        <div className="friends-pending">
          <h3 className="friends-section-title">Pending Requests</h3>
          {pendingIncoming.map(req => (
            <div key={req.id} className="friend-row friend-row-pending">
              <div className="friend-row-info">
                <span className="friend-row-name">{req.username}</span>
                <span className="friend-row-code">#{req.friend_code}</span>
              </div>
              <div className="friend-row-actions">
                <button className="notif-btn notif-accept" onClick={() => handleAccept(req.id)}>Accept</button>
                <button className="notif-btn notif-decline" onClick={() => handleDecline(req.id)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friend List */}
      {loading ? (
        <div className="campaigns-loading">Searching the realm...</div>
      ) : friends.length === 0 ? (
        <div className="campaigns-empty">
          <div className="campaigns-empty-icon">{'\uD83D\uDEE1\uFE0F'}</div>
          <h3>No allies yet</h3>
          <p>Share your friend code or add an ally to begin your fellowship.</p>
        </div>
      ) : (
        <div className="friends-list">
          {friends.map(friend => (
            <div key={friend.id} className="friend-row">
              <div className="friend-row-info">
                <span className="friend-row-name">{friend.username}</span>
                <PresenceIndicator status={friend.presence} detail={friend.presence_detail} />
              </div>
              <button
                className="friend-invite-btn"
                title="Invite to campaign"
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddFriendModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchFriends}
        />
      )}
    </div>
  );
}
