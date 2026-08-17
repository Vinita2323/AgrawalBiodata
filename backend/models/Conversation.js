/**
 * Conversation Model
 * One thread between exactly two candidate profiles
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    // Per-participant unread counter, incremented on send and cleared on read.
    unreadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastReadAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [participantSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: 'A conversation must have exactly two participants'
      }
    },
    // Sorted "<profileIdA>:<profileIdB>" pair key. Unique, so the same two
    // profiles can never end up with two parallel threads regardless of who
    // opens it first.
    pairKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // Denormalized for the conversation list, which would otherwise need a
    // lookup per row.
    lastMessage: {
      type: String,
      trim: true,
      default: ''
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastMessageSenderProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null
    },
    interestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interest',
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

conversationSchema.index({ 'participants.userId': 1, lastMessageAt: -1 });
conversationSchema.index({ 'participants.profileId': 1 });

/**
 * Builds the canonical pair key for two profile ids, order-independent.
 * @param {string} profileIdA
 * @param {string} profileIdB
 * @returns {string}
 */
conversationSchema.statics.buildPairKey = function (profileIdA, profileIdB) {
  const a = profileIdA.toString();
  const b = profileIdB.toString();
  return a < b ? `${a}:${b}` : `${b}:${a}`;
};

module.exports = mongoose.model('Conversation', conversationSchema);
