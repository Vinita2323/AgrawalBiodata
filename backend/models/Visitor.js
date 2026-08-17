/**
 * Visitor Model
 * Daily-Deduplicated Profile View Tracking
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    visitedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Visited Profile ID is required'],
      index: true
    },
    visitedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Visited User ID is required'],
      index: true
    },
    visitorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
      index: true
    },
    visitorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    visitDate: {
      type: Date,
      required: [true, 'Visit date is required'],
      index: true
    },
    visitCount: {
      type: Number,
      default: 1,
      min: 1
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now
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

visitorSchema.index({ visitedProfileId: 1, visitorProfileId: 1, visitDate: 1 }, { unique: true });
visitorSchema.index({ visitedProfileId: 1, lastVisitedAt: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);
