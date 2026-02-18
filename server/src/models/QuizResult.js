const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  lecture_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  answers: [{
    question_index: {
      type: Number,
      required: true
    },
    selected_answer: {
      type: Number,
      required: true
    },
    is_correct: {
      type: Boolean,
      required: true
    },
    points_earned: {
      type: Number,
      default: 0
    }
  }],
  total_questions: {
    type: Number,
    required: true,
    min: 1
  },
  correct_answers: {
    type: Number,
    required: true,
    min: 0
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  total_points: {
    type: Number,
    required: true,
    min: 0
  },
  earned_points: {
    type: Number,
    required: true,
    min: 0
  },
  passing_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  attempt_number: {
    type: Number,
    default: 1,
    min: 1
  },
  time_taken: {
    type: Number, // in seconds
    default: 0
  },
  submitted_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
quizResultSchema.index({ user_id: 1, lecture_id: 1 });
quizResultSchema.index({ user_id: 1, course_id: 1 });
quizResultSchema.index({ course_id: 1, lecture_id: 1 });
quizResultSchema.index({ organization_id: 1, user_id: 1 });
quizResultSchema.index({ submitted_at: -1 });

// Static method to get user's best score for a quiz
quizResultSchema.statics.getBestScore = async function(userId, lectureId) {
  const result = await this.findOne({
    user_id: userId,
    lecture_id: lectureId
  }).sort({ score: -1, submitted_at: -1 }).lean();
  
  return result;
};

// Static method to get user's quiz attempts
quizResultSchema.statics.getUserAttempts = async function(userId, lectureId) {
  return this.find({
    user_id: userId,
    lecture_id: lectureId
  }).sort({ submitted_at: -1 }).lean();
};

// Static method to get quiz statistics
quizResultSchema.statics.getQuizStats = async function(lectureId) {
  const stats = await this.aggregate([
    { $match: { lecture_id: mongoose.Types.ObjectId(lectureId) } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score' },
        passRate: {
          $avg: { $cond: ['$passed', 1, 0] }
        },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' }
      }
    }
  ]);
  
  return stats[0] || {
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    highestScore: 0,
    lowestScore: 0
  };
};

module.exports = mongoose.model('QuizResult', quizResultSchema);
