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

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  getPreferences,
  updatePreferences
};
