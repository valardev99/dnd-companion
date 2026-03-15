import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

// Notification type → icon mapping
const TYPE_ICONS = {
  friend_request: '\u2694',      // crossed swords
  campaign_invite: '\uD83D\uDCDC', // scroll
  friend_online: '\uD83D\uDD2E',   // crystal ball
  campaign_ready: '\u2618',       // shamrock/clover
  campaign_invite_accepted: '\uD83E\uDD1D', // handshake
  info: '\uD83D\uDD14',          // bell
  success: '\u2714',             // check
  error: '\u26A0',               // warning
};

function NotificationToast() {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div style={styles.container}>
      {notifications.map((notif, index) => (
        <Toast
          key={notif.id}
          notification={notif}
          index={index}
          onDismiss={() => dismissNotification(notif.id)}
        />
      ))}
    </div>
  );
}

function Toast({ notification, index, onDismiss }) {
  const [phase, setPhase] = useState('entering');

  useEffect(() => {
    // Transition from entering to visible after animation
    const timer = setTimeout(() => setPhase('visible'), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    if (notification.onAccept) notification.onAccept(notification.data);
    onDismiss();
  };

  const handleDecline = () => {
    if (notification.onDecline) notification.onDecline(notification.data);
    onDismiss();
  };

  const icon = TYPE_ICONS[notification.type] || TYPE_ICONS.info;

  return (
    <div
      style={{
        ...styles.toast,
        opacity: phase === 'entering' ? 0 : 1,
        transform: phase === 'entering' ? 'translateX(100%)' : 'translateX(0)',
      }}
    >
      {/* Gold border top */}
      <div style={styles.borderTop} />

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>{icon}</span>
        <span style={styles.title}>{notification.title}</span>
        <button
          style={styles.closeBtn}
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          \u2715
        </button>
      </div>

      {/* Body */}
      {notification.body && (
        <div style={styles.body}>{notification.body}</div>
      )}

      {/* Action buttons for actionable notifications */}
      {notification.actionable && (
        <div style={styles.actions}>
          <button style={styles.acceptBtn} onClick={handleAccept}>
            Accept
          </button>
          <button style={styles.declineBtn} onClick={handleDecline}>
            Decline
          </button>
        </div>
      )}

      {/* Gold border bottom */}
      <div style={styles.borderBottom} />

      {/* Auto-dismiss progress bar */}
      <div style={styles.progressTrack}>
        <div style={styles.progressBar} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '12px',
    pointerEvents: 'none',
    maxWidth: '380px',
    width: '100%',
  },
  toast: {
    pointerEvents: 'auto',
    background: 'linear-gradient(145deg, #1a1a24 0%, #12121a 100%)',
    border: '1px solid #c9a84c',
    borderRadius: '4px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 12px rgba(201, 168, 76, 0.15)',
    overflow: 'hidden',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    fontFamily: '"Crimson Text", serif',
  },
  borderTop: {
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
  },
  borderBottom: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #c9a84c40, transparent)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px 4px',
  },
  icon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontFamily: '"Cinzel", serif',
    fontSize: '13px',
    fontWeight: 700,
    color: '#c9a84c',
    letterSpacing: '0.3px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#8a8a9a',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '2px 4px',
    lineHeight: 1,
    flexShrink: 0,
    transition: 'color 0.2s',
  },
  body: {
    padding: '4px 12px 10px',
    fontSize: '14px',
    color: '#e8dcc8',
    lineHeight: 1.4,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    padding: '4px 12px 10px',
  },
  acceptBtn: {
    flex: 1,
    padding: '6px 12px',
    background: 'linear-gradient(180deg, #2d5a1e 0%, #1a3a12 100%)',
    border: '1px solid #10b981',
    borderRadius: '3px',
    color: '#e8dcc8',
    fontFamily: '"Cinzel", serif',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    transition: 'background 0.2s, box-shadow 0.2s',
  },
  declineBtn: {
    flex: 1,
    padding: '6px 12px',
    background: 'linear-gradient(180deg, #3a1a1a 0%, #2a1212 100%)',
    border: '1px solid #dc262680',
    borderRadius: '3px',
    color: '#e8dcc8',
    fontFamily: '"Cinzel", serif',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    transition: 'background 0.2s, box-shadow 0.2s',
  },
  progressTrack: {
    height: '2px',
    background: '#0a0a0f',
  },
  progressBar: {
    height: '100%',
    background: '#c9a84c',
    animation: 'toast-progress 8s linear forwards',
    transformOrigin: 'left',
  },
};

// Inject keyframe animation for progress bar
if (typeof document !== 'undefined') {
  const styleId = 'notification-toast-keyframes';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @keyframes toast-progress {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(styleEl);
  }
}

export default NotificationToast;
