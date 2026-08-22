/**
 * Messaging Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/**
 * 1. List the user's conversations
 * GET /api/messages/conversations
 */
export async function getConversations(params = {}) {
  return api.get('/messages/conversations', params);
}

/**
 * 2. Open (or create) a conversation with a candidate profile.
 * Requires an accepted interest between the two profiles.
 * POST /api/messages/conversations
 */
export async function openConversation(targetProfileId) {
  return api.post('/messages/conversations', { targetProfileId });
}

/**
 * 3. Read a conversation thread (oldest-first)
 * GET /api/messages/conversations/:id
 */
export async function getMessages(conversationId, params = {}) {
  return api.get(`/messages/conversations/${conversationId}`, params);
}

/**
 * 4. Send a message over REST. Prefer the socket when connected; this is the
 * fallback path and the two share the same server-side write.
 * POST /api/messages/conversations/:id
 */
export async function sendMessage(conversationId, body, replyToMessageId) {
  return api.post(`/messages/conversations/${conversationId}`, { body, replyToMessageId });
}

/**
 * 5. Mark a conversation as read
 * PUT /api/messages/conversations/:id/read
 */
export async function markConversationRead(conversationId) {
  return api.put(`/messages/conversations/${conversationId}/read`);
}

/**
 * 6. Total unread messages across all conversations
 * GET /api/messages/unread-count
 */
export async function getUnreadMessageCount() {
  return api.get('/messages/unread-count');
}

/**
 * 7. Edit a sent message (sender only, within 15 minutes of sending)
 * PUT /api/messages/:messageId
 */
export async function editMessage(messageId, body) {
  return api.put(`/messages/${messageId}`, { body });
}

/**
 * 8. Delete a message - for yourself only, or (sender only) for everyone
 * DELETE /api/messages/:messageId
 * @param {string} messageId
 * @param {'me'|'everyone'} [scope='me']
 */
export async function deleteMessage(messageId, scope = 'me') {
  return api.delete(`/messages/${messageId}`, { scope });
}

export const messageService = {
  getConversations,
  openConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadMessageCount,
  editMessage,
  deleteMessage
};

export default messageService;
