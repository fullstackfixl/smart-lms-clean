const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  metadata: {
    audience: {
      type: String,
      enum: ['all', 'active', 'completed'],
      default: 'all'
    },
    tags: [String]
  }
}, {
  timestamps: true
});

announcementSchema.index({ organization_id: 1, course_id: 1, is_active: 1 });
announcementSchema.index({ instructor_id: 1, is_active: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);

