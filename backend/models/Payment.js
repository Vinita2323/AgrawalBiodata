/**
 * Payment & Transaction Model
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      index: true
    },
    paymentId: {
      type: String,
      default: '',
      index: true
    },
    signature: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true
    },
    status: {
      type: String,
      enum: ['Created', 'Success', 'Failed', 'Refunded'],
      default: 'Created',
      index: true
    },
    method: {
      type: String,
      default: ''
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      index: true
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    webhookEventId: {
      type: String,
      default: '',
      index: true
    },
    errorDetails: {
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

module.exports = mongoose.model('Payment', paymentSchema);
