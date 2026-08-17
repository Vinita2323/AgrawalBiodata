/**
 * CMS Model: Static Pages & Banners Schema
 * Agrawal Matrimony Platform
 */

const mongoose = require('mongoose');

// CMS Static Page Schema
const cmsPageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Page key is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    points: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    metaDescription: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    updatedByName: {
      type: String,
      trim: true,
      default: ''
    },
    lastUpdated: {
      type: Date,
      default: Date.now
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

// CMS Banner Schema
const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true
    },
    subtitle: {
      type: String,
      trim: true,
      default: ''
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true
    },
    targetUrl: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
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

const CMSPage = mongoose.model('CMSPage', cmsPageSchema);
const Banner = mongoose.model('Banner', bannerSchema);

module.exports = {
  CMSPage,
  Banner,
  Page: CMSPage
};
