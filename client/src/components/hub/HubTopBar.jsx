import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

function NotificationItem({ notification, onAction }) {
  const { type, message, from_username, campaign_name, id, created_at } = notification;

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

  return (
    <div className="notification-item">
      <div className="notification-item-icon">
        {type === 'friend_request' ? '\uD83D\uDEE1\uFE0F' : type === 'campaign_invite' ? '\u2694\uFE0F' : '\uD83D\uDD14'}
      </div>
      <div className="notification-item-body">
        <div className="notification-item-text">
          {type === 'friend_request' && <><strong>{from_username}</strong> wants to be your ally</>}
          {type === 'campaign_invite' && <><strong>{from_username}</strong> invited you to <strong>{campaign_name}</strong></>}
          {type === 'generic' && message}
        </div>
        <div className="notification-item-time">{timeAgo(created_at)}</div>
        {(type === 'friend_request' || type === 'campaign_invite') && (
          <div className="notification-item-actions">
            <button className="notif-btn notif-accept" onClick={() => onAction(id, 'accept')}>Accept</button>
            <button className="notif-btn notif-decline" onClick={() => onAction(id, 'decline')}>Decline</button>
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

export default function HubTopBar({ title }) {
  const { user, authFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      // Notifications endpoint may not exist yet
    }
  }, [authFetch]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleAction = async (notifId, action) => {
    try {
      await authFetch(`/api/notifications/${notifId}/${action}`, { method: 'POST' });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (e) {}
  };

  const unreadCount = notifications.length;

  const copyFriendCode = () => {
    if (user?.friend_code) {
      navigator.clipboard.writeText(user.friend_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="hub-topbar">
      <h1 className="hub-topbar-title">{title}</h1>

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

        {/* Profile + Friend Code */}
        <div className="hub-profile">
          <span className="hub-profile-name">{user?.username || 'Adventurer'}</span>
          {user?.friend_code && (
            <button className="hub-friend-code" onClick={copyFriendCode} title="Copy friend code">
              <span className="hub-friend-code-value">#{user.friend_code}</span>
              <span className="hub-friend-code-copied">{copied ? 'Copied!' : ''}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
