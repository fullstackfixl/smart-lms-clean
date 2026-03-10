const mongoose = require('mongoose');

const platformReportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['users', 'organizations', 'courses', 'enrollments'],
    required: true
  },
  format: {
    type: String,
    enum: ['CSV', 'PDF'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  filePath: {
    type: String
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  filters: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlatformReport', platformReportSchema);
