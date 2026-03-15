import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getAvatarEmoji } from './avatarPresets.js';

function NotificationItem({ notification, onAction }) {
  // Backend returns: { id, type, title, body, data, read, created_at }
  const { type, title, body, data, id, created_at } = notification;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Determine if this notification has actionable buttons
  const isActionable = type === 'friend_request' || type === 'campaign_invite';

  return (
    <div className={`notification-item ${notification.read ? 'read' : ''}`}>
      <div className="notification-item-icon">
        {type === 'friend_request' ? '\u{1F6E1}\uFE0F' : type === 'campaign_invite' ? '\u2694\uFE0F' : type === 'friend_request_accepted' ? '\u{1F91D}' : '\u{1F514}'}
      </div>
      <div className="notification-item-body">
        <div className="notification-item-title">{title}</div>
        {body && <div className="notification-item-text">{body}</div>}
        <div className="notification-item-time">{timeAgo(created_at)}</div>
        {isActionable && (
          <div className="notification-item-actions">
            <button className="notif-btn notif-accept" onClick={() => onAction(notification, 'accept')}>Accept</button>
            <button className="notif-btn notif-decline" onClick={() => onAction(notification, 'decline')}>Decline</button>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationDropdown({ notifications, onAction, onClose }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-dropdown-header">
        <h3>Notifications</h3>
        <button
          className="notification-dropdown-close"
          onClick={onClose}
          aria-label="Close notifications"
        >✕</button>
      </div>
      <div className="notification-dropdown-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">No new tidings, adventurer.</div>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onAction={onAction} />
          ))
        )}
      </div>
    </div>
  );
}

export default function HubTopBar({ title, onProfileClick }) {
  const { user, token, authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch('/api/notifications/');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
      }
    } catch (e) {
      // Notifications endpoint may not exist yet
    }
  }, [authFetch, token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleAction = async (notification, action) => {
    const { id, type, data } = notification;
    try {
      if (type === 'friend_request' && data?.friend_request_id) {
        const endpoint = action === 'accept'
          ? `/api/friends/request/${data.friend_request_id}/accept`
          : `/api/friends/request/${data.friend_request_id}/decline`;
        await authFetch(endpoint, { method: 'POST' });
      } else if (type === 'campaign_invite' && data?.invite_id) {
        const endpoint = action === 'accept'
          ? `/api/campaigns/invites/${data.invite_id}/accept`
          : `/api/campaigns/invites/${data.invite_id}/decline`;
        await authFetch(endpoint, { method: 'POST' });
      }
      await authFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      // Silently fail
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const copyFriendCode = () => {
    if (user?.friend_code) {
      navigator.clipboard.writeText(user.friend_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="hub-topbar">
      {/* Mobile: back arrow + brand */}
      <div className="hub-topbar-left">
        <Link to="/" className="hub-topbar-back" title="Back to Home">
          {'\u27F5'}
        </Link>
        <h1 className="hub-topbar-title">{title}</h1>
      </div>

      <div className="hub-topbar-right">
        {/* Notification Bell */}
        <div className="hub-notification-wrapper">
          <button
            className="hub-notification-bell"
            onClick={() => setShowDropdown(!showDropdown)}
            title="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="hub-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {showDropdown && (
            <NotificationDropdown
              notifications={notifications}
              onAction={handleAction}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>

        {/* Desktop: Profile + Friend Code */}
        <div className="hub-profile hub-desktop-only">
          <span className="hub-profile-name">{user?.display_name || user?.username || 'Adventurer'}</span>
          {user?.friend_code && (
            <button className="hub-friend-code" onClick={copyFriendCode} title="Copy friend code">
              <span className="hub-friend-code-value">#{user.friend_code}</span>
              <span className="hub-friend-code-copied">{copied ? 'Copied!' : ''}</span>
            </button>
          )}
        </div>

        {/* Mobile: Profile avatar button */}
        <button
          className="hub-topbar-avatar hub-mobile-only"
          onClick={onProfileClick}
          title="Profile"
        >
          {getAvatarEmoji(user?.avatar_url)}
        </button>
      </div>
    </div>
  );
}
