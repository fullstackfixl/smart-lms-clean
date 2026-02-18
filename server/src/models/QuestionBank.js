const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
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
    required: true,
    index: true
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
  category: {
    type: String,
    enum: ['general', 'midterm', 'final', 'practice', 'homework'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  questions: [{
    question_text: {
      type: String,
      required: true
    },
    question_type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching'],
      required: true
    },
    options: [{
      text: String,
      is_correct: Boolean
    }],
    correct_answer: String,
    points: {
      type: Number,
      default: 1
    },
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [String],
    media: {
      type: String,
      url: String
    },
    time_limit: Number, // in seconds
    hints: [String]
  }],
  is_public: {
    type: Boolean,
    default: false
  },
  usage_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
questionBankSchema.index({ course_id: 1, organization_id: 1 });
questionBankSchema.index({ created_by: 1 });
questionBankSchema.index({ category: 1, difficulty: 1 });
questionBankSchema.index({ tags: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
