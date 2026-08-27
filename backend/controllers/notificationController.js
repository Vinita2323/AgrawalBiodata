/**
 * Notification Controller
 * Agrawal Matrimony Platform
 */

const notificationService = require('../services/notificationService');
const User = require('../models/User');
const { getUserActiveProfile } = require('../utils/profileHelper');
const { success, notFound, badRequest } = require('../utils/apiResponse');
const { NOTIFICATION_CATEGORIES } = require('../config/constants');

/**
 * The candidate profile this request is acting as, or null when the account has
 * none yet. Feeds are narrowed to it so a parent running two children's
 * biodatas does not see one child's alerts while viewing the other.
 */
async function actingProfileId(req) {
  const data = await getUserActiveProfile(req.user.userId, req.user.requestedProfileId);
  return data?.activeProfile?._id || null;
}

/**
 * 1. List the authenticated user's notification feed
 * GET /api/notifications?category=Interests&unreadOnly=true&page=1&limit=20
 */
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const category = req.query.category || 'All';

    if (!NOTIFICATION_CATEGORIES.includes(category)) {
      return badRequest(res, `Category must be one of: ${NOTIFICATION_CATEGORIES.join(', ')}`);
    }

    const { notifications, total, unreadCount } = await notificationService.list(req.user.userId, {
      category,
      unreadOnly: req.query.unreadOnly === 'true',
      page,
      limit,
      profileId: await actingProfileId(req)
    });

    return success(res, 'Notifications retrieved successfully', {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Unread badge count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await notificationService.unreadCount(req.user.userId, await actingProfileId(req));
    return success(res, 'Unread notification count retrieved', { unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Mark a single notification as read
 * PUT /api/notifications/:id/read
 */
const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user.userId, req.params.id);
    if (!notification) {
      return notFound(res, 'Notification not found');
    }

    const unreadCount = await notificationService.unreadCount(req.user.userId, await actingProfileId(req));
    return success(res, 'Notification marked as read', { notification, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Mark every notification as read
 * PUT /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markAllRead(req.user.userId, await actingProfileId(req));
    return success(res, 'All notifications marked as read', { updated, unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const removed = await notificationService.remove(req.user.userId, req.params.id);
    if (!removed) {
      return notFound(res, 'Notification not found');
    }
    return success(res, 'Notification deleted', { deletedId: req.params.id });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Read notification delivery preferences
 * GET /api/notifications/preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('notificationPreferences');
    if (!user) {
      return notFound(res, 'User not found');
    }
    return success(res, 'Notification preferences retrieved', {
      preferences: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

const PREFERENCE_KEYS = [
  'newMatchAlerts',
  'interestAlerts',
  'messageAlerts',
  'weeklyDigestEmail',
  'promotionalEmails'
];

/**
 * 7. Update notification delivery preferences
 * PUT /api/notifications/preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return notFound(res, 'User not found');
    }

    const incoming = req.body || {};
    const applied = {};

    PREFERENCE_KEYS.forEach((key) => {
      if (typeof incoming[key] === 'boolean') {
        user.notificationPreferences[key] = incoming[key];
        applied[key] = incoming[key];
      }
    });

    if (Object.keys(applied).length === 0) {
      return badRequest(
        res,
        `Provide at least one boolean preference. Valid keys: ${PREFERENCE_KEYS.join(', ')}`
      );
    }

    await user.save();

    return success(res, 'Notification preferences updated', {
      preferences: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

const MAX_FCM_TOKENS_PER_USER = 10;

/**
 * Rejects strings that cannot be FCM registration tokens.
 *
 * The endpoint used to store whatever it was given and answer 200, so pasting
 * an access token here looked like success while every later send failed
 * against a token Firebase would never accept. A JWT is the easy mistake to
 * make - it is the other long opaque string in the app - and it is trivially
 * recognisable, so name it specifically rather than reporting a vague error.
 *
 * Nothing else is rejected on shape. Google has changed the token format
 * before, and refusing a token that would have worked is worse than storing an
 * odd-looking one, which the send path prunes on its first failure anyway.
 */
function describeInvalidFcmToken(token) {
  if (/^eyJ[A-Za-z0-9_-]*.[A-Za-z0-9_-]+.[A-Za-z0-9_-]+$/.test(token)) {
    return 'That is a JWT (your login token), not an FCM registration token. A push token is issued by the Firebase SDK in the browser or app via getToken(), never by this API.';
  }
  return null;
}

/**
 * 8. Register a device/browser FCM token for push delivery
 * POST /api/notifications/fcm-token
 * Body: { token: string, platform?: 'web' | 'app' }
 */
const saveFcmToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body || {};
    if (!token || typeof token !== 'string') {
      return badRequest(res, 'A valid FCM token is required');
    }

    const problem = describeInvalidFcmToken(token.trim());
    if (problem) {
      return badRequest(res, problem, null, 'INVALID_FCM_TOKEN');
    }

    const validPlatform = (platform === 'app' || platform === 'web') ? platform : 'web';

    const user = await User.findById(req.user.userId).select('fcmTokens');
    if (!user) {
      return notFound(res, 'User not found');
    }

    // Normalize existing tokens in case the document had legacy plain string tokens
    const normalizedTokens = (user.fcmTokens || [])
      .map(item => {
        if (!item) return null;
        if (typeof item === 'string') {
          return { token: item, platform: 'web', lastUsed: new Date() };
        }
        if (item.token) {
          return {
            token: item.token,
            platform: item.platform || 'web',
            lastUsed: item.lastUsed || new Date()
          };
        }
        return null;
      })
      .filter(Boolean);

    // Check if token already exists
    const existingIndex = normalizedTokens.findIndex(item => item.token === token);

    if (existingIndex !== -1) {
      // Update platform and lastUsed if changed
      normalizedTokens[existingIndex] = {
        token,
        platform: validPlatform,
        lastUsed: new Date()
      };
    } else {
      normalizedTokens.push({
        token,
        platform: validPlatform,
        lastUsed: new Date()
      });
    }

    // Cap per account
    user.fcmTokens = normalizedTokens.slice(-MAX_FCM_TOKENS_PER_USER);

    await user.save();

    return success(res, 'Push token registered', { platform: validPlatform });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Remove a device/browser FCM token, e.g. on logout
 * DELETE /api/notifications/fcm-token
 * Body: { token: string }
 */
const removeFcmToken = async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return badRequest(res, 'A valid FCM token is required');
    }

    const user = await User.findById(req.user.userId).select('fcmTokens');
    if (user && Array.isArray(user.fcmTokens)) {
      user.fcmTokens = user.fcmTokens.filter(item =>
        (typeof item === 'string' ? item : item?.token) !== token
      );
      await user.save();
    }

    return success(res, 'Push token removed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  saveFcmToken,
  removeFcmToken
};
