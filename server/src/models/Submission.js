const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false,  // Made optional for college subjects without linked courses
    default: null,
    index: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  attachments: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'resubmitted'],
    default: 'submitted',
    index: true
  },
  submitted_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  graded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  graded_at: {
    type: Date,
    index: true
  },
  earned_score: {
    type: Number,
    min: 0
  },
  comments: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

submissionSchema.index({ organization_id: 1, assignment_id: 1, student_id: 1, is_active: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
