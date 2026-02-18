const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question_index: {
    type: Number,
    required: true,
    min: 0
  },
  selected_option: {
    type: Number,
    required: true,
    min: 0
  },
  is_correct: {
    type: Boolean,
    required: true
  },
  time_spent_seconds: {
    type: Number,
    min: 0,
    default: 0
  }
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  student_id: {
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
  attempt_number: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  answers: {
    type: [answerSchema],
    required: true,
    validate: {
      validator: function(answers) {
        return answers && answers.length > 0;
      },
      message: 'Quiz attempt must have at least one answer'
    }
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  total_questions: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  started_at: {
    type: Date,
    required: true
  },
  submitted_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  time_taken_seconds: {
    type: Number,
    required: true,
    min: 0
  },
  ip_address: {
    type: String,
    trim: true
  },
  user_agent: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
quizAttemptSchema.index({ organization_id: 1, student_id: 1 });
quizAttemptSchema.index({ quiz_id: 1, student_id: 1 });
quizAttemptSchema.index({ course_id: 1, student_id: 1 });
quizAttemptSchema.index({ student_id: 1, submitted_at: -1 });
quizAttemptSchema.index({ quiz_id: 1, attempt_number: 1, student_id: 1 }, { unique: true });

// Virtual for correct answers count
quizAttemptSchema.virtual('correct_answers').get(function() {
  return this.answers ? this.answers.filter(answer => answer.is_correct).length : 0;
});

// Virtual for incorrect answers count
quizAttemptSchema.virtual('incorrect_answers').get(function() {
  return this.answers ? this.answers.filter(answer => !answer.is_correct).length : 0;
});

// Virtual for average time per question
quizAttemptSchema.virtual('avg_time_per_question').get(function() {
  return this.total_questions > 0 ? Math.round(this.time_taken_seconds / this.total_questions) : 0;
});

// Instance method to check if user can access attempt
quizAttemptSchema.methods.canUserAccess = function(user) {
  // Check if user belongs to same organization
  if (this.organization_id.toString() !== user.organization_id.toString()) {
    return { canAccess: false, reason: 'organization_mismatch' };
  }

  // Check if user is the student who made the attempt
  if (this.student_id.toString() === user._id.toString()) {
    return { canAccess: true, reason: 'own_attempt' };
  }

  // Check if user is instructor or admin
  if (user.role === 'admin') {
    return { canAccess: true, reason: 'admin_access' };
  }

  // For instructors, they can access attempts for their courses
  if (user.role === 'teacher') {
    return { canAccess: true, reason: 'instructor_access' };
  }

  return { canAccess: false, reason: 'access_denied' };
};

// Instance method to get detailed results
quizAttemptSchema.methods.getDetailedResults = async function() {
  const Quiz = mongoose.model('Quiz');
  const quiz = await Quiz.findById(this.quiz_id);
  
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  const results = {
    attempt_info: {
      attempt_number: this.attempt_number,
      score: this.score,
      total_questions: this.total_questions,
      percentage: this.percentage,
      passed: this.passed,
      time_taken: this.time_taken_seconds,
      submitted_at: this.submitted_at
    },
    questions_review: []
  };

  // Build detailed question review
  for (let i = 0; i < this.answers.length; i++) {
    const answer = this.answers[i];
    const question = quiz.questions[answer.question_index];
    
    if (question) {
      results.questions_review.push({
        question_number: i + 1,
        question_text: question.question,
        options: question.options,
        selected_option: answer.selected_option,
        correct_option: question.correct_answer,
        is_correct: answer.is_correct,
        explanation: question.explanation,
        time_spent: answer.time_spent_seconds
      });
    }
  }

  return results;
};

// Static method to get user's attempts for a quiz
quizAttemptSchema.statics.getUserAttempts = function(quizId, studentId, organizationId) {
  return this.find({
    quiz_id: quizId,
    student_id: studentId,
    organization_id: organizationId,
    is_active: true
  }).sort({ attempt_number: -1 });
};

// Static method to get best attempt for a quiz
quizAttemptSchema.statics.getBestAttempt = function(quizId, studentId, organizationId) {
  return this.findOne({
    quiz_id: quizId,
    student_id: studentId,
    organization_id: organizationId,
    is_active: true
  }).sort({ score: -1, submitted_at: -1 });
};

// Static method to get quiz statistics
quizAttemptSchema.statics.getQuizStatistics = async function(quizId, organizationId) {
  const stats = await this.aggregate([
    {
      $match: {
        quiz_id: new mongoose.Types.ObjectId(quizId),
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: '$student_id',
        best_score: { $max: '$score' },
        best_percentage: { $max: '$percentage' },
        attempts_count: { $sum: 1 },
        passed: { $max: '$passed' }
      }
    },
    {
      $group: {
        _id: null,
        total_students: { $sum: 1 },
        passed_students: { $sum: { $cond: ['$passed', 1, 0] } },
        average_score: { $avg: '$best_score' },
        average_percentage: { $avg: '$best_percentage' },
        total_attempts: { $sum: '$attempts_count' }
      }
    }
  ]);

  return stats[0] || {
    total_students: 0,
    passed_students: 0,
    average_score: 0,
    average_percentage: 0,
    total_attempts: 0
  };
};

// Pre-save middleware to calculate derived fields
quizAttemptSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate percentage
    this.percentage = this.total_questions > 0 ? 
      Math.round((this.score / this.total_questions) * 100) : 0;
    
    // Calculate time taken
    if (this.started_at && this.submitted_at) {
      this.time_taken_seconds = Math.floor((this.submitted_at - this.started_at) / 1000);
    }
  }
  
  next();
});

// Pre-save middleware to validate organization consistency
quizAttemptSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Verify quiz belongs to same organization
      const Quiz = mongoose.model('Quiz');
      const quiz = await Quiz.findById(this.quiz_id);
      
      if (!quiz) {
        return next(new Error('Quiz not found'));
      }
      
      if (quiz.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Quiz must belong to the same organization'));
      }
      
      // Verify student belongs to same organization
      const User = mongoose.model('User');
      const student = await User.findById(this.student_id);
      
      if (!student) {
        return next(new Error('Student not found'));
      }
      
      if (student.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Student must belong to the same organization'));
      }
      
      // Set course_id from quiz if not provided
      if (!this.course_id) {
        this.course_id = quiz.course_id;
      }
      
      // Validate answers against quiz questions
      if (this.answers.length !== quiz.questions.length) {
        return next(new Error('Number of answers must match number of questions'));
      }
      
      // Calculate score and determine pass/fail
      let correctCount = 0;
      for (let i = 0; i < this.answers.length; i++) {
        const answer = this.answers[i];
        const question = quiz.questions[answer.question_index];
        
        if (!question) {
          return next(new Error(`Invalid question index: ${answer.question_index}`));
        }
        
        // Check if answer is correct
        answer.is_correct = (answer.selected_option === question.correct_answer);
        if (answer.is_correct) {
          correctCount++;
        }
      }
      
      this.score = correctCount;
      this.total_questions = quiz.questions.length;
      this.percentage = Math.round((correctCount / quiz.questions.length) * 100);
      this.passed = this.percentage >= quiz.pass_percentage;
      
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = QuizAttempt;