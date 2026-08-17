/**
 * Profile Model
 * Complete Matrimonial Biodata & Multi-Profile Entity
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');
const { isValidGotra, normalizeGotra } = require('../utils/gotras');
const { MANGLIK_STATUS, GENDER, MARITAL_STATUS, RELATIVE_RELATION_TYPES } = require('../config/constants');

// Embedded Relative Subdocument Schema
const relativeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    relationType: {
      type: String,
      enum: [...RELATIVE_RELATION_TYPES, ''],
      default: ''
    },
    status: {
      type: String,
      enum: ['Unmarried', 'Married', 'Divorced', 'Widowed'],
      default: 'Unmarried'
    },
    spouseName: {
      type: String,
      trim: true,
      default: ''
    },
    homePlace: {
      type: String,
      trim: true,
      default: '' // In-laws / Sasural City
    },
    occupation: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

// Gallery Photo Schema
const galleryPhotoSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    caption: {
      type: String,
      trim: true,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      index: true
    },
    profileId: {
      type: String,
      unique: true,
      index: true
    },
    profileFor: {
      type: String,
      enum: ['Self', 'Myself', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend'],
      default: 'Self'
    },

    // 1. Personal & Physical Details
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    gender: {
      type: String,
      enum: [GENDER.MALE, GENDER.FEMALE],
      required: [true, 'Gender is required']
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    tob: {
      type: String,
      trim: true,
      default: ''
    },
    pob: {
      type: String,
      trim: true,
      default: ''
    },
    height: {
      type: String,
      trim: true,
      default: ''
    },
    complexion: {
      type: String,
      trim: true,
      default: ''
    },
    maritalStatus: {
      type: String,
      default: 'Never Married'
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: ''
    },
    diet: {
      type: String,
      trim: true,
      default: ''
    },
    hobbies: {
      type: [String],
      default: []
    },
    bio: {
      type: String,
      trim: true,
      default: ''
    },

    // 2. Astrology & Gotra
    gotra: {
      type: String,
      required: [true, 'Gotra is required'],
      trim: true,
      validate: {
        validator: function (value) {
          return isValidGotra(value);
        },
        message: props => `"${props.value}" is not one of the authentic 18 Agarwal Gotras`
      }
    },
    motherGotra: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (value) {
          if (!value || value.trim() === '') return true;
          return isValidGotra(value);
        },
        message: props => `"${props.value}" is not one of the authentic 18 Agarwal Gotras`
      }
    },
    manglik: {
      type: String,
      enum: [MANGLIK_STATUS.NON_MANGLIK, MANGLIK_STATUS.MANGLIK, MANGLIK_STATUS.ANSHIK_MANGLIK, MANGLIK_STATUS.DONT_KNOW],
      default: MANGLIK_STATUS.NON_MANGLIK
    },
    rashi: {
      type: String,
      trim: true,
      default: ''
    },
    nakshatra: {
      type: String,
      trim: true,
      default: ''
    },

    // 3. Education & Career
    qualification: {
      type: String,
      trim: true,
      default: ''
    },
    educationLevel: {
      type: String,
      trim: true,
      default: ''
    },
    workingAt: {
      type: String,
      trim: true,
      default: ''
    },
    occupation: {
      type: String,
      trim: true,
      default: ''
    },
    occupationType: {
      type: String,
      trim: true,
      default: ''
    },
    income: {
      type: String,
      trim: true,
      default: ''
    },

    // 4. 3-Generation Family Tree
    grandfather: {
      type: String,
      trim: true,
      default: ''
    },
    grandmother: {
      type: String,
      trim: true,
      default: ''
    },
    maternalGrandfather: {
      type: String,
      trim: true,
      default: ''
    },
    maternalGrandmother: {
      type: String,
      trim: true,
      default: ''
    },
    father: {
      type: String,
      trim: true,
      default: ''
    },
    fatherOccupation: {
      type: String,
      trim: true,
      default: ''
    },
    fatherOccupationDetails: {
      type: String,
      trim: true,
      default: ''
    },
    mother: {
      type: String,
      trim: true,
      default: ''
    },
    motherOccupation: {
      type: String,
      trim: true,
      default: ''
    },
    familyType: {
      type: String,
      trim: true,
      default: ''
    },
    familyValues: {
      type: String,
      trim: true,
      default: ''
    },
    familyOrigin: {
      type: String,
      trim: true,
      default: ''
    },

    // 5. Relatives Dynamic Subdocuments
    brotherList: {
      type: [relativeSchema],
      default: []
    },
    sisterList: {
      type: [relativeSchema],
      default: []
    },
    taujiList: {
      type: [relativeSchema],
      default: []
    },
    chachaList: {
      type: [relativeSchema],
      default: []
    },
    buajiList: {
      type: [relativeSchema],
      default: []
    },
    mamajiList: {
      type: [relativeSchema],
      default: []
    },
    masijiList: {
      type: [relativeSchema],
      default: []
    },

    // 6. Contact & Address
    residentialAddress: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    privacySettings: {
      phoneVisibility: {
        type: String,
        enum: ['All Members', 'Connected Members Only', 'Connected Only', 'Premium Members Only', 'Hidden'],
        default: 'Connected Members Only'
      },
      addressVisibility: {
        type: String,
        enum: ['All Members', 'Connected Members Only', 'Connected Only', 'Hidden'],
        default: 'Connected Members Only'
      },
      photoVisibility: {
        type: String,
        enum: ['Visible to All', 'All Members', 'Visible to Connected', 'Connected Only', 'Request Access'],
        default: 'Visible to All'
      }
    },

    // 7. Media
    profilePicture: {
      type: String,
      trim: true,
      default: ''
    },
    gallery: {
      type: [galleryPhotoSchema],
      default: [],
      validate: {
        validator: function (val) {
          return !val || val.length <= 6;
        },
        message: 'A maximum of 6 gallery photos are allowed'
      }
    },

    // 8. Badges & System Metrics
    verified: {
      type: Boolean,
      default: false,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    // Excluded from match discovery and search. Mirrors the owning account's
    // Deactivated/Suspended state so discovery queries stay a single lookup.
    isHidden: {
      type: Boolean,
      default: false,
      index: true
    },
    // What this candidate is looking for. Used to bias and filter discovery.
    partnerPreferences: {
      minAge: { type: Number, default: null },
      maxAge: { type: Number, default: null },
      minHeightCm: { type: Number, default: null },
      maxHeightCm: { type: Number, default: null },
      maritalStatus: { type: [String], default: [] },
      manglik: { type: String, default: '' },
      educationLevels: { type: [String], default: [] },
      occupations: { type: [String], default: [] },
      minIncomeLakh: { type: Number, default: null },
      cities: { type: [String], default: [] },
      states: { type: [String], default: [] },
      diet: { type: [String], default: [] },
      excludeGotras: { type: [String], default: [] },
      verifiedOnly: { type: Boolean, default: false }
    },
    completionPercentage: {
      type: Number,
      default: 0
    },
    matchScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Virtual for galleryPhotos alias
profileSchema.virtual('galleryPhotos').get(function () {
  return this.gallery;
}).set(function (val) {
  this.gallery = val;
});

// Pre-save middleware for Gotra normalization and profileId generation
profileSchema.pre('save', function (next) {
  // Normalize Gotra to canonical English name
  if (this.gotra) {
    const canonicalGotra = normalizeGotra(this.gotra);
    if (canonicalGotra) {
      this.gotra = canonicalGotra;
    }
  }

  // Normalize Mother Gotra if present
  if (this.motherGotra && this.motherGotra.trim() !== '') {
    const canonicalMotherGotra = normalizeGotra(this.motherGotra);
    if (canonicalMotherGotra) {
      this.motherGotra = canonicalMotherGotra;
    }
  }

  // Generate unique profileId if not already present
  if (!this.profileId) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.profileId = `PRF-${randomSuffix}`;
  }

  // Normalize profileFor
  if (this.profileFor === 'Myself') {
    this.profileFor = 'Self';
  }

  next();
});

module.exports = mongoose.model('Profile', profileSchema);
