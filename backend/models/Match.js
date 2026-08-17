/**
 * Match Model
 * Cached Match Calculations & Recommendations
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Profile ID is required'],
      index: true
    },
    matchedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Matched Profile ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
      index: true
    },
    isSagotra: {
      type: Boolean,
      default: false
    },
    hasMaternalConflict: {
      type: Boolean,
      default: false
    },
    isDailyRecommendation: {
      type: Boolean,
      default: false,
      index: true
    },
    breakdown: {
      gotra: { type: mongoose.Schema.Types.Mixed },
      age: { type: mongoose.Schema.Types.Mixed },
      education: { type: mongoose.Schema.Types.Mixed },
      location: { type: mongoose.Schema.Types.Mixed },
      income: { type: mongoose.Schema.Types.Mixed },
      manglik: { type: mongoose.Schema.Types.Mixed }
    },
    viewed: {
      type: Boolean,
      default: false
    },
    lastCalculatedAt: {
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

matchSchema.index({ profileId: 1, matchedProfileId: 1 }, { unique: true });
matchSchema.index({ profileId: 1, matchScore: -1 });

module.exports = mongoose.model('Match', matchSchema);
