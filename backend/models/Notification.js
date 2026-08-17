/**
 * Notification Model
 * In-app notification feed for candidate users
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    // Recipient account. Notifications are addressed to a user, and optionally
    // scoped to one of that user's candidate profiles.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user ID is required'],
      index: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Notification type is required'],
      index: true
    },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES.filter((c) => c !== 'All'),
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    body: {
      type: String,
      trim: true,
      default: ''
    },
    // Profile that triggered the notification, used to render its avatar.
    actorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null
    },
    // Client-side route to open when the notification is tapped.
    linkTarget: {
      type: String,
      trim: true,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// The feed is always queried newest-first for one recipient, optionally
// filtered by category or unread state.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
