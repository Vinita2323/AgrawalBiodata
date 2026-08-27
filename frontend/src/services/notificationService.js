/**
 * Notification Service
 * Agrawal Matrimony Platform
 */

import { api } from './api';

/**
 * 1. Fetch the notification feed
 * GET /api/notifications
 * @param {Object} [params] { category, unreadOnly, page, limit }
 */
export async function getNotifications(params = {}) {
  return api.get('/notifications', params);
}

/**
 * 2. Unread badge count
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount() {
  return api.get('/notifications/unread-count');
}

/**
 * 3. Mark one notification as read
 * PUT /api/notifications/:id/read
 */
export async function markNotificationRead(id) {
  return api.put(`/notifications/${id}/read`);
}

/**
 * 4. Mark every notification as read
 * PUT /api/notifications/read-all
 */
export async function markAllNotificationsRead() {
  return api.put('/notifications/read-all');
}

/**
 * 5. Delete a notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(id) {
  return api.delete(`/notifications/${id}`);
}

/**
 * 6. Read delivery preferences
 * GET /api/notifications/preferences
 */
export async function getNotificationPreferences() {
  return api.get('/notifications/preferences');
}

/**
 * 7. Update delivery preferences
 * PUT /api/notifications/preferences
 * @param {Object} preferences Any subset of
 *   { newMatchAlerts, interestAlerts, messageAlerts, weeklyDigestEmail, promotionalEmails }
 */
export async function updateNotificationPreferences(preferences) {
  return api.put('/notifications/preferences', preferences);
}

/**
 * 8. Register this browser's FCM token for push delivery
 * POST /api/notifications/fcm-token
 */
export async function saveFcmToken(token, platform = 'web') {
  return api.post('/notifications/fcm-token', { token, platform });
}

/**
 * 9. Remove this browser's FCM token, e.g. on logout
 * DELETE /api/notifications/fcm-token
 */
export async function removeFcmToken(token) {
  return api.delete('/notifications/fcm-token', { token });
}

export const notificationService = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  saveFcmToken,
  removeFcmToken
};

export default notificationService;
