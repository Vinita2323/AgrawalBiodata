/**
 * Shortlist Model
 * Profile Bookmarks & Favorites
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Active Profile ID is required'],
      index: true
    },
    shortlistedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: [true, 'Shortlisted Profile ID is required'],
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
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

shortlistSchema.index({ profileId: 1, shortlistedProfileId: 1 }, { unique: true });
shortlistSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Shortlist', shortlistSchema);
