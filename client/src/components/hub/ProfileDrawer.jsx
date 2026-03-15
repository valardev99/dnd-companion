import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import avatarPresets, { getAvatarEmoji } from './avatarPresets.js';

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, authFetch, setUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync form state when drawer opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.display_name || '');
      setSelectedAvatar(user.avatar_url || '');
      setShowAvatarGrid(false);
    }
  }, [isOpen, user]);

  const hasChanges =
    (displayName !== (user?.display_name || '')) ||
    (selectedAvatar !== (user?.avatar_url || ''));

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const res = await authFetch('/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName || null,
          avatar_url: selectedAvatar || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(prev => ({ ...prev, ...updated }));
        onClose();
      }
    } catch (e) {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [hasChanges, saving, displayName, selectedAvatar, authFetch, setUser, onClose]);

  const handleCopyCode = useCallback(() => {
    if (user?.friend_code) {
      navigator.clipboard.writeText(user.friend_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`profile-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`profile-drawer ${isOpen ? 'open' : ''}`}>
        <div className="profile-drawer-header">
          <h2 className="profile-drawer-title">Profile</h2>
          <button className="profile-drawer-close" onClick={onClose} title="Close">
            {'\u2715'}
          </button>
        </div>

        <div className="profile-drawer-body">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {getAvatarEmoji(selectedAvatar)}
            </div>
            <button
              className="profile-avatar-change"
              onClick={() => setShowAvatarGrid(!showAvatarGrid)}
            >
              {showAvatarGrid ? 'Close' : 'Change Avatar'}
            </button>

            {showAvatarGrid && (
              <div className="profile-avatar-grid">
                {avatarPresets.map(preset => (
                  <button
                    key={preset.id}
                    className={`profile-avatar-option ${selectedAvatar === 'preset:' + preset.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedAvatar('preset:' + preset.id);
                      setShowAvatarGrid(false);
                    }}
                    title={preset.label}
                  >
                    {preset.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="profile-field">
            <label className="profile-field-label">Display Name</label>
            <input
              type="text"
              className="profile-field-input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={user.username}
              maxLength={100}
            />
          </div>

          {/* Username (read-only) */}
          <div className="profile-field">
            <label className="profile-field-label">Username</label>
            <div className="profile-field-readonly">
              {user.username}
              <span className="profile-field-hint">(cannot change)</span>
            </div>
          </div>

          {/* Friend Code */}
          <div className="profile-field">
            <label className="profile-field-label">Friend Code</label>
            <div className="profile-friend-code" onClick={handleCopyCode} title="Click to copy">
              <span className="profile-friend-code-value">#{user.friend_code}</span>
              <span className="profile-friend-code-copy">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="profile-drawer-footer">
          <button
            className="profile-save-btn"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
