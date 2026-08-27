/**
 * User Account Model
 * 1 User Account -> N Candidate Profiles
 */

const mongoose = require('mongoose');
const { ACCOUNT_STATUS, VERIFICATION_STATUS, SUBSCRIPTION_STATUS, SUBSCRIPTION_PLANS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', ''],
      default: ''
    },
    dob: {
      type: Date
    },
    createdFor: {
      type: String,
      enum: ['Myself', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend', ''],
      default: 'Myself'
    },
    accountStatus: {
      type: String,
      enum: [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.DEACTIVATED],
      default: ACCOUNT_STATUS.ACTIVE,
      index: true
    },
    deactivatedAt: {
      type: Date,
      default: null
    },
    verificationStatus: {
      type: String,
      enum: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED, 'Unverified'],
      default: 'Unverified',
      index: true
    },
    subscriptionPlan: {
      type: String,
      default: SUBSCRIPTION_PLANS.FREE,
      index: true
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
      index: true
    },
    subscriptionStatus: {
      type: String,
      enum: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.EXPIRED, SUBSCRIPTION_STATUS.CANCELLED, SUBSCRIPTION_STATUS.FREE],
      default: SUBSCRIPTION_STATUS.FREE
    },
    subscriptionExpiresAt: {
      type: Date
    },
    contactViewLimit: {
      type: Number,
      default: 0
    },
    contactViewsUsed: {
      type: Number,
      default: 0
    },
    dailyMatchLimit: {
      type: Number,
      default: 0 // Resolved from plan on activation; 0 falls back to the Free plan's limit
    },
    matchQuotaDate: {
      type: String,
      default: '' // 'YYYY-MM-DD' the counters below were last reset for
    },
    profilesViewedToday: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Profile',
      default: []
    },
    // Push (FCM) registration tokens for this account's devices (web / app).
    // Stored as subdocuments with platform ('web' | 'app') tracking.
    fcmTokens: {
      type: [
        new mongoose.Schema(
          {
            token: { type: String, required: true },
            platform: { type: String, enum: ['web', 'app'], default: 'web' },
            lastUsed: { type: Date, default: Date.now }
          },
          { _id: false }
        )
      ],
      default: []
    },
    // Delivery preferences. In-app notifications are always recorded; these
    // flags gate push/email/SMS fan-out for the matching categories.
    notificationPreferences: {
      newMatchAlerts: { type: Boolean, default: true },
      interestAlerts: { type: Boolean, default: true },
      messageAlerts: { type: Boolean, default: true },
      weeklyDigestEmail: { type: Boolean, default: true },
      promotionalEmails: { type: Boolean, default: false }
    },
    activeProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null
    },
    profiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile'
      }
    ],
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        delete ret.refreshTokens;
        return ret;
      }
    }
  }
);

// A malformed fcmTokens entry (e.g. cast from a pre-migration plain-string
// token, or any other future corruption) must never block a save - push
// delivery is best-effort, but this field sits on the same document as
// login/session state. Rather than fight Mongoose's cast timing to recover
// bad data, just drop anything that didn't come out with a real token string.
userSchema.pre('validate', function (next) {
  if (Array.isArray(this.fcmTokens)) {
    this.fcmTokens = this.fcmTokens.filter((entry) => entry && typeof entry.token === 'string' && entry.token.length > 0);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
