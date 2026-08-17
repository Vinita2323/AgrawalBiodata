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

export const notificationService = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
};

export default notificationService;
