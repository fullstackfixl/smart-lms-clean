const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  is_locked: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['general', 'question', 'announcement', 'discussion'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  replies_count: {
    type: Number,
    default: 0
  },
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
forumSchema.index({ course_id: 1, organization_id: 1 });
forumSchema.index({ created_by: 1 });
forumSchema.index({ last_activity: -1 });

module.exports = mongoose.model('Forum', forumSchema);
