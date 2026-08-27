/**
 * Push Notification Service (Firebase Cloud Messaging)
 * Agrawal Matrimony Platform
 *
 * Thin wrapper around firebase-admin messaging. Push is best-effort delivery
 * on top of the in-app notification feed - a send failure here must never
 * fail the action that triggered the notification.
 */

const { getMessaging } = require('../config/firebase');
const logger = require('../utils/logger');

const DEAD_TOKEN_ERRORS = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered'
]);

class PushService {
  /**
   * Sends one notification to a set of FCM tokens.
   * @param {string[]} tokens
   * @param {{ title: string, body?: string, data?: object }} payload
   * @returns {Promise<{ invalidTokens: string[] }>} tokens Firebase rejected as
   *   dead, so the caller can prune them from the user's record.
   */
  async sendToTokens(tokens, payload) {
    const messaging = getMessaging();
    if (!messaging || !tokens?.length) return { invalidTokens: [] };

    try {
      const data = {};
      Object.entries(payload.data || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data[key] = String(value);
      });

      const response = await messaging.sendEachForMulticast({
        notification: {
          title: payload.title,
          body: payload.body || ''
        },
        data,
        tokens
      });

      const invalidTokens = [];
      response.responses.forEach((res, i) => {
        if (!res.success && DEAD_TOKEN_ERRORS.has(res.error?.code)) {
          invalidTokens.push(tokens[i]);
        }
      });

      if (response.failureCount > 0) {
        logger.warn(`FCM send: ${response.successCount} ok, ${response.failureCount} failed`);
      }

      return { invalidTokens };
    } catch (error) {
      logger.error(`FCM send failed: ${error.message}`);
      return { invalidTokens: [] };
    }
  }
}

module.exports = new PushService();
