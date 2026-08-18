/**
 * Notification Service
 * Agrawal Matrimony Platform
 *
 * Central emit point for the in-app notification feed. Every notification is
 * persisted so the user's feed is complete; the user's delivery preferences
 * only gate the real-time push (Socket.io) and any future email/SMS fan-out.
 *
 * Emitting must never break the action that triggered it: a failure here is
 * logged and swallowed so a notification outage cannot fail an interest send
 * or a payment capture.
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');
const { NOTIFICATION_TYPES, NOTIFICATION_META } = require('../config/constants');

// Set by realtime.js once Socket.io is initialised. Kept as an injected
// reference so this service has no hard dependency on the transport.
let realtimeEmitter = null;

/**
 * Registers the transport used to push notifications to connected clients.
 * @param {{ emitToUser: (userId: string, event: string, payload: object) => void }} emitter
 */
function setRealtimeEmitter(emitter) {
  realtimeEmitter = emitter;
}

class NotificationService {
  /**
   * Creates a notification and pushes it to the recipient if they are online.
   *
   * @param {object} params
   * @param {string} params.userId Recipient user id
   * @param {string} params.type One of NOTIFICATION_TYPES
   * @param {string} params.title
   * @param {string} [params.body]
   * @param {string} [params.profileId] Recipient's candidate profile
   * @param {string} [params.actorProfileId] Profile that triggered it
   * @param {string} [params.linkTarget] Client route to open
   * @param {object} [params.metadata]
   * @returns {Promise<object|null>} the created notification, or null on failure
   */
  async emit({
    userId,
    type,
    title,
    body = '',
    profileId = null,
    actorProfileId = null,
    linkTarget = '',
    metadata = {}
  }) {
    try {
      if (!userId || !type || !title) return null;

      const meta = NOTIFICATION_META[type];
      if (!meta) {
        logger.warn(`Unknown notification type "${type}" - not emitted`);
        return null;
      }

      const notification = await Notification.create({
        userId,
        profileId,
        type,
        category: meta.category,
        title,
        body,
        actorProfileId,
        linkTarget,
        metadata
      });

      // Push in real time only when the recipient opted into this category.
      if (realtimeEmitter && (await this.isPushEnabled(userId, meta.preference))) {
        realtimeEmitter.emitToUser(userId.toString(), 'notification:new', notification.toJSON());
      }

      return notification;
    } catch (error) {
      logger.error(`Failed to emit notification (${type}) to user ${userId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Emits the same notification to many recipients.
   * @param {Array<object>} items Each item is an `emit` params object
   */
  async emitMany(items = []) {
    const results = await Promise.all(items.map((item) => this.emit(item)));
    return results.filter(Boolean);
  }

  /**
   * Whether the user wants real-time push for the given preference key.
   * Notification types with no preference key (account/billing events) are
   * always pushed - a user cannot opt out of being told their payment failed.
   * @param {string} userId
   * @param {string|null} preferenceKey
   * @returns {Promise<boolean>}
   */
  async isPushEnabled(userId, preferenceKey) {
    if (!preferenceKey) return true;

    try {
      const user = await User.findById(userId).select('notificationPreferences');
      if (!user) return false;
      const prefs = user.notificationPreferences || {};
      return prefs[preferenceKey] !== false;
    } catch {
      // Default to delivering rather than silently dropping.
      return true;
    }
  }

  /* ---------------------- Typed emit helpers ---------------------- */

  async interestReceived({ recipientUserId, recipientProfileId, senderProfile }) {
    return this.emit({
      userId: recipientUserId,
      profileId: recipientProfileId,
      type: NOTIFICATION_TYPES.INTEREST_RECEIVED,
      title: `${senderProfile?.fullName || 'Someone'} expressed interest in your profile`,
      body: 'Open your interests to accept or decline this request.',
      actorProfileId: senderProfile?._id || null,
      linkTarget: '/interests'
    });
  }

  async interestAccepted({ senderUserId, senderProfileId, recipientProfile }) {
    return this.emit({
      userId: senderUserId,
      profileId: senderProfileId,
      type: NOTIFICATION_TYPES.INTEREST_ACCEPTED,
      title: `${recipientProfile?.fullName || 'Your match'} accepted your interest`,
      body: 'You are now connected and can start a conversation.',
      actorProfileId: recipientProfile?._id || null,
      linkTarget: '/chat'
    });
  }

  async interestDeclined({ senderUserId, senderProfileId, recipientProfile }) {
    return this.emit({
      userId: senderUserId,
      profileId: senderProfileId,
      type: NOTIFICATION_TYPES.INTEREST_DECLINED,
      title: `${recipientProfile?.fullName || 'A candidate'} declined your interest`,
      body: 'Keep exploring - new matches are added every day.',
      actorProfileId: recipientProfile?._id || null,
      linkTarget: '/matches'
    });
  }

  async profileVisited({ visitedUserId, visitedProfileId, visitorProfile }) {
    return this.emit({
      userId: visitedUserId,
      profileId: visitedProfileId,
      type: NOTIFICATION_TYPES.PROFILE_VISITED,
      title: `${visitorProfile?.fullName || 'Someone'} viewed your profile`,
      actorProfileId: visitorProfile?._id || null,
      linkTarget: '/profile'
    });
  }

  async messageReceived({ recipientUserId, recipientProfileId, senderProfile, preview, conversationId }) {
    return this.emit({
      userId: recipientUserId,
      profileId: recipientProfileId,
      type: NOTIFICATION_TYPES.MESSAGE_RECEIVED,
      title: `New message from ${senderProfile?.fullName || 'a connection'}`,
      body: preview || '',
      actorProfileId: senderProfile?._id || null,
      linkTarget: '/chat',
      metadata: { conversationId }
    });
  }

  async verificationReviewed({ userId, profileId, approved, reason = '' }) {
    return this.emit({
      userId,
      profileId,
      type: approved
        ? NOTIFICATION_TYPES.VERIFICATION_APPROVED
        : NOTIFICATION_TYPES.VERIFICATION_REJECTED,
      title: approved
        ? 'Your profile is now verified'
        : 'Your verification request was rejected',
      body: approved
        ? 'The verified badge is now visible on your candidate profile.'
        : reason || 'Please re-submit clearer documents.',
      linkTarget: '/profile'
    });
  }

  async paymentSucceeded({ userId, planName, amount }) {
    return this.emit({
      userId,
      type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
      title: `${planName} membership activated`,
      body: `Payment of Rs. ${amount} received successfully.`,
      linkTarget: '/membership'
    });
  }

  /* -------------------------- Queries ---------------------------- */

  /**
   * Narrows a feed query to one candidate profile.
   *
   * Notifications about a candidate (interests, visits, messages) carry that
   * profile's id; account-level notices such as payment receipts carry none and
   * belong to every profile, so they are always included.
   */
  scopeToProfile(filter, profileId) {
    if (!profileId) return filter;
    return {
      ...filter,
      $or: [{ profileId }, { profileId: null }]
    };
  }

  /**
   * Paginated feed for one user, optionally narrowed to a candidate profile.
   */
  async list(userId, { category = 'All', unreadOnly = false, page = 1, limit = 20, profileId = null } = {}) {
    const base = { userId };
    if (category && category !== 'All') base.category = category;
    if (unreadOnly) base.isRead = false;

    const filter = this.scopeToProfile(base, profileId);
    const skip = (page - 1) * limit;

    const [total, notifications, unreadCount] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .populate('actorProfileId', 'fullName profileId profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(this.scopeToProfile({ userId, isRead: false }, profileId))
    ]);

    return { notifications, total, unreadCount };
  }

  async markRead(userId, notificationId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllRead(userId, profileId = null) {
    const result = await Notification.updateMany(
      this.scopeToProfile({ userId, isRead: false }, profileId),
      { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount || 0;
  }

  async unreadCount(userId, profileId = null) {
    return Notification.countDocuments(this.scopeToProfile({ userId, isRead: false }, profileId));
  }

  async remove(userId, notificationId) {
    return Notification.findOneAndDelete({ _id: notificationId, userId });
  }
}

const notificationService = new NotificationService();
notificationService.setRealtimeEmitter = setRealtimeEmitter;

module.exports = notificationService;
