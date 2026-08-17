/**
 * Contact Unlock Model
 * Records which candidate contacts a user has paid to reveal
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const contactUnlockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    unlockedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true,
      index: true
    },
    unlockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Whether the reveal cost a plan allowance or came free with a connection.
    source: {
      type: String,
      enum: ['Subscription', 'Connection'],
      default: 'Subscription'
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

// One unlock per (viewer, profile) pair - the uniqueness guarantee behind
// "never charge twice for the same contact".
contactUnlockSchema.index({ userId: 1, unlockedProfileId: 1 }, { unique: true });

module.exports = mongoose.model('ContactUnlock', contactUnlockSchema);
