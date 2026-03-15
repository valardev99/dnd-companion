import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  socket.on('connect', () => console.log('[WS] Connected'));
  socket.on('disconnect', () => console.log('[WS] Disconnected'));
  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

// Presence
export function onFriendPresence(callback) {
  socket?.on('friend_presence', callback);
  return () => socket?.off('friend_presence', callback);
}

// Notifications
export function onNotification(callback) {
  socket?.on('notification', callback);
  return () => socket?.off('notification', callback);
}

// Multiplayer
export function joinCampaignRoom(campaignId) {
  socket?.emit('join_campaign', { campaign_id: campaignId });
}

export function leaveCampaignRoom(campaignId) {
  socket?.emit('leave_campaign', { campaign_id: campaignId });
}

export function emitPlayerReady(campaignId) {
  socket?.emit('player_ready', { campaign_id: campaignId });
}

export function onPlayerReady(callback) {
  socket?.on('player_ready', callback);
  return () => socket?.off('player_ready', callback);
}

export function onSessionStart(callback) {
  socket?.on('session_start', callback);
  return () => socket?.off('session_start', callback);
}

export function emitSessionStart(campaignId) {
  socket?.emit('session_start', { campaign_id: campaignId });
}

export function onMultiplayerMessage(callback) {
  socket?.on('dm_message', callback);
  return () => socket?.off('dm_message', callback);
}

export function sendPlayerAction(campaignId, message) {
  socket?.emit('player_action', { campaign_id: campaignId, message });
}
