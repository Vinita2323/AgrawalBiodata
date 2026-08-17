/**
 * Saved Search Model
 * Backs the "Recent searches" strip and saved search filters
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null
    },
    // Free-text term the user typed, if any.
    query: {
      type: String,
      trim: true,
      default: ''
    },
    // Structured filter set (gotra, city, age range, ...).
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Human-readable label rendered on the recent-search chip.
    label: {
      type: String,
      trim: true,
      default: ''
    },
    // Explicitly saved searches survive; unsaved ones are recent history.
    isSaved: {
      type: Boolean,
      default: false,
      index: true
    },
    resultCount: {
      type: Number,
      default: 0
    },
    lastRunAt: {
      type: Date,
      default: Date.now
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

savedSearchSchema.index({ userId: 1, lastRunAt: -1 });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
