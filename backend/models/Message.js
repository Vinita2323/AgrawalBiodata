/**
 * Message Model
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation reference is required'],
      index: true
    },
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
      maxlength: [2000, 'A message cannot exceed 2000 characters']
    },
    // Set the instant the recipient's client actually receives this message
    // (online at send time, or the next time they connect/open the thread).
    deliveredAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    },
    editedAt: {
      type: Date,
      default: null
    },
    // "Delete for everyone": the original body is kept (the schema requires
    // a non-empty body, and there is no need to destroy it) but never
    // serialized once this flag is set - see toJSON below.
    deletedForEveryone: {
      type: Boolean,
      default: false
    },
    // "Delete for me": each side can independently hide the message from
    // their own view without affecting the other participant's thread.
    deletedFor: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.deletedForEveryone) {
          ret.body = '';
        }
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Threads are always read newest-first within one conversation.
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
