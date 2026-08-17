/**
 * Socket.io Client
 * Agrawal Matrimony Platform
 *
 * A single shared connection for the whole app. The socket authenticates with
 * the same access token as the REST client, and reconnects automatically.
 *
 * Chat still works without a live socket: the UI falls back to the REST
 * endpoints, so a blocked WebSocket degrades latency rather than function.
 */

import { io } from 'socket.io-client';
import { getAuthToken, ASSET_ORIGIN } from './api';

let socket = null;

/**
 * Returns the shared socket, connecting on first use.
 * @returns {import('socket.io-client').Socket|null} null when not logged in
 */
export function getSocket() {
  const token = getAuthToken();
  if (!token) return null;

  if (socket?.connected || socket?.connecting) return socket;

  if (!socket) {
    // In development the Vite proxy does not forward WebSockets by default, so
    // the socket connects to the backend origin directly. In production
    // ASSET_ORIGIN is the deployed API origin.
    socket = io(ASSET_ORIGIN || undefined, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity
    });

    // Re-send the current token on every reconnect so a refreshed access token
    // is used instead of the one captured at construction time.
    socket.on('reconnect_attempt', () => {
      socket.auth = { token: getAuthToken() };
    });
  } else {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
}

/** Tears the connection down, e.g. on logout. */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Subscribes to an event and returns an unsubscribe function, so callers can
 * clean up from a useEffect without tracking handler identity.
 * @param {string} event
 * @param {Function} handler
 * @returns {Function} unsubscribe
 */
export function onSocketEvent(event, handler) {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
}

/** Joins a conversation room to receive typing and read receipts. */
export function joinConversation(conversationId) {
  const s = getSocket();
  if (s && conversationId) s.emit('conversation:join', conversationId);
}

export function leaveConversation(conversationId) {
  const s = getSocket();
  if (s && conversationId) s.emit('conversation:leave', conversationId);
}

/**
 * Sends a message over the socket, resolving with the persisted message.
 * Rejects if the socket is unavailable so the caller can fall back to REST.
 */
export function sendSocketMessage(conversationId, body) {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s || !s.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    s.emit('message:send', { conversationId, body }, (ack) => {
      if (ack?.ok) resolve(ack.message);
      else reject(new Error(ack?.error || 'Failed to send message'));
    });
  });
}

export function emitTyping(conversationId, isTyping) {
  const s = getSocket();
  if (!s?.connected) return;
  s.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
}

export function emitConversationRead(conversationId) {
  const s = getSocket();
  if (!s?.connected) return;
  s.emit('conversation:read', { conversationId });
}

export default {
  getSocket,
  disconnectSocket,
  onSocketEvent,
  joinConversation,
  leaveConversation,
  sendSocketMessage,
  emitTyping,
  emitConversationRead
};
