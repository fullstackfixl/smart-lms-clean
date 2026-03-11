const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  organizationType: {
    type: String,
    required: true,
    enum: ['college'],
    default: 'college',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

activityLogSchema.index({ organizationId: 1, createdAt: -1 });
activityLogSchema.index({ organizationId: 1, role: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
