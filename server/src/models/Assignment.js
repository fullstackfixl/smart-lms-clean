const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  due_date: {
    type: Date,
    index: true
  },
  max_score: {
    type: Number,
    required: true,
    min: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

assignmentSchema.index({ organization_id: 1, course_id: 1, is_active: 1, createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
