/**
 * Audit Log Model for Administrative and System Actions
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      unique: true,
      index: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    adminName: {
      type: String,
      required: true,
      default: 'System'
    },
    adminRole: {
      type: String,
      default: 'Super Admin'
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      index: true
    },
    target: {
      type: String,
      default: ''
    },
    details: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
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
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Auto-assign human-readable logId (e.g. LOG-1001) before save
auditLogSchema.pre('save', async function (next) {
  if (!this.logId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    this.logId = `LOG-${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
