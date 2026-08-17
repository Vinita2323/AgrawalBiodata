/**
 * KYC & Document Verification Model
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const { VERIFICATION_STATUS } = require('../config/constants');

const verificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null,
      index: true
    },
    documentType: {
      type: String,
      enum: [
        'Aadhaar',
        'Passport',
        'VoterID',
        'DrivingLicense',
        'PAN',
        'Other',
        'Aadhaar Card',
        'PAN Card',
        'Passport',
        'Voter ID',
        'Driving License'
      ],
      default: 'Aadhaar'
    },
    documentNumber: {
      type: String,
      trim: true,
      default: ''
    },
    idProofUrl: {
      type: String,
      trim: true,
      default: ''
    },
    professionProofUrl: {
      type: String,
      trim: true,
      default: ''
    },
    addressProofUrl: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: [VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED],
      default: VERIFICATION_STATUS.PENDING,
      index: true
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    rejectionCategory: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    reviewedByName: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
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

module.exports = mongoose.model('Verification', verificationSchema);
