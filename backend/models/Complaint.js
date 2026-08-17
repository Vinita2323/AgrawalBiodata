/**
 * Complaint & Abuse Moderation Model
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const { COMPLAINT_CATEGORIES } = require('../config/constants');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true
    },
    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user ID is required'],
      index: true
    },
    reporterProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
      index: true
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    reportedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
      index: true
    },
    reason: {
      type: String,
      required: [true, 'Complaint reason is required'],
      trim: true
    },
    category: {
      type: String,
      enum: [...COMPLAINT_CATEGORIES, 'Other', 'General', ''],
      default: 'Other',
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    evidenceUrls: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Resolved', 'Dismissed'],
      default: 'Pending',
      index: true
    },
    resolutionAction: {
      type: String,
      enum: ['Warning Sent', 'User Suspended', 'Profile Removed', 'Dismissed', 'None', ''],
      default: ''
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    resolvedByName: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
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

// Auto-assign human-readable complaintId (e.g. CMP-100234) before save
complaintSchema.pre('save', function (next) {
  if (!this.complaintId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    this.complaintId = `CMP-${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
