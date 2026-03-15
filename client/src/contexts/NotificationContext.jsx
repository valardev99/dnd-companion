import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onNotification } from '../services/socketService.js';

const NotificationContext = createContext();

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 8000;

/**
 * Global notification provider — listens to Socket.IO notification events
 * and manages a queue of toast notifications displayed app-wide.
 *
 * Works in both the hub and during game sessions.
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timerMapRef = useRef({}); // id -> timeout

  // Add a notification to the queue
  const addNotification = useCallback((notification) => {
    const id = notification.id || Date.now() + Math.random();
    const entry = {
      id,
      type: notification.type || 'info',
      title: notification.title || '',
      body: notification.body || '',
      data: notification.data || null,
      actionable: notification.actionable || false,
      onAccept: notification.onAccept || null,
      onDecline: notification.onDecline || null,
      createdAt: Date.now(),
    };

    setNotifications(prev => {
      // Limit queue — drop oldest beyond a reasonable buffer
      const next = [...prev, entry];
      return next.slice(-10);
    });

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      dismissNotification(id);
    }, AUTO_DISMISS_MS);
    timerMapRef.current[id] = timer;
  }, []);

  // Dismiss a notification
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (timerMapRef.current[id]) {
      clearTimeout(timerMapRef.current[id]);
      delete timerMapRef.current[id];
    }
  }, []);

  // Listen to Socket.IO notification events
  useEffect(() => {
    const cleanup = onNotification((data) => {
      addNotification({
        type: data.type || 'info',
        title: data.title || 'Notification',
        body: data.body || '',
        data: data.data || null,
        actionable: data.actionable || false,
      });
    });

    return cleanup;
  }, [addNotification]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timerMapRef.current).forEach(clearTimeout);
    };
  }, []);

  // Only expose the top MAX_VISIBLE notifications
  const visibleNotifications = notifications.slice(-MAX_VISIBLE);

  return (
    <NotificationContext.Provider value={{
      notifications: visibleNotifications,
      addNotification,
      dismissNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
