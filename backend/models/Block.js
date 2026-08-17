/**
 * Block Model
 * User & Profile Blocking and Moderation
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const { BLOCK_REASONS } = require('../config/constants');

const blockSchema = new mongoose.Schema(
  {
    blockerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocker User ID is required'],
      index: true
    },
    blockerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Blocker Profile ID is required'],
      index: true
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Blocked User ID is required'],
      index: true
    },
    blockedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Blocked Profile ID is required'],
      index: true
    },
    reason: {
      type: String,
      enum: BLOCK_REASONS,
      default: 'Other'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

blockSchema.index({ blockerUserId: 1, blockedUserId: 1 }, { unique: true });
blockSchema.index({ blockerProfileId: 1, blockedProfileId: 1 }, { unique: true });

module.exports = mongoose.model('Block', blockSchema);
