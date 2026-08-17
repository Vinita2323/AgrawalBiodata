/**
 * Subscription Plan Model
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      index: true
    },
    nameHindi: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    tagline: {
      type: String,
      trim: true,
      default: ''
    },
    badge: {
      type: String,
      trim: true,
      default: '' // e.g. 'Popular', 'Best Value', 'VIP'
    },
    monthlyPrice: {
      type: Number,
      required: [true, 'Monthly price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    quarterlyPrice: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    yearlyPrice: {
      type: Number,
      required: [true, 'Yearly price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    discountPercent: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0
    },
    features: {
      type: [String],
      default: []
    },
    contactViewLimit: {
      type: Number,
      default: 0 // -1 for unlimited
    },
    interestSendLimit: {
      type: Number,
      default: 10 // -1 for unlimited
    },
    verifiedPriority: {
      type: Boolean,
      default: false
    },
    chatAccess: {
      type: Boolean,
      default: false
    },
    relationshipManager: {
      type: Boolean,
      default: false
    },
    profileBoost: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0
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

// Pre-save hook to generate planId slug if missing
planSchema.pre('save', function (next) {
  if (!this.planId && this.name) {
    this.planId = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Plan', planSchema);
