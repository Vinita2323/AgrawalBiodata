/**
 * User Subscription Model
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required'],
      index: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: [true, 'Subscription end date is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Cancelled', 'Pending'],
      default: 'Active',
      index: true
    },
    paymentId: {
      type: String,
      default: ''
    },
    orderId: {
      type: String,
      default: ''
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    features: {
      type: [String],
      default: []
    },
    contactViewLimit: {
      type: Number,
      default: 0
    },
    dailyMatchLimit: {
      type: Number,
      default: 5
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

// Helper method to check if subscription is currently active
subscriptionSchema.methods.isCurrentlyActive = function () {
  return this.status === 'Active' && this.endDate > new Date();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
