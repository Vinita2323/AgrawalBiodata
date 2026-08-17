/**
 * OTP Model for Passwordless Mobile Verification
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    cooldownUntil: {
      type: Date,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    requestCount: {
      type: Number,
      default: 1
    },
    windowStart: {
      type: Date,
      default: Date.now
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically clear expired OTP documents after 15 minutes
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model('OTP', otpSchema);
