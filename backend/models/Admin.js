/**
 * Admin Account Model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ADMIN_ROLES } = require('../config/constants');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Admin password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.MODERATOR],
      default: ADMIN_ROLES.MODERATOR,
      index: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    lastLoginAt: {
      type: Date
    },
    preferences: {
      notifyVerifications: { type: Boolean, default: true },
      notifyComplaints: { type: Boolean, default: true },
      notifyPayments: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-save hook to hash password if modified
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password against bcrypt hash
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
