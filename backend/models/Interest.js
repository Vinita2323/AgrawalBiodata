/**
 * Interest Model
 * Matrimonial Interest Lifecycle (Pending -> Accepted / Declined / Cancelled)
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const { INTEREST_STATUS } = require('../config/constants');

const interestSchema = new mongoose.Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender User ID is required'],
      index: true
    },
    senderProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Sender Profile ID is required'],
      index: true
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient User ID is required'],
      index: true
    },
    recipientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Recipient Profile ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: [
        INTEREST_STATUS.PENDING,
        INTEREST_STATUS.ACCEPTED,
        INTEREST_STATUS.DECLINED,
        INTEREST_STATUS.CANCELLED
      ],
      default: INTEREST_STATUS.PENDING,
      index: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
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

interestSchema.index({ senderProfileId: 1, recipientProfileId: 1 }, { unique: true });
interestSchema.index({ recipientUserId: 1, status: 1, createdAt: -1 });
interestSchema.index({ senderUserId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Interest', interestSchema);
