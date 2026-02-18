const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
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
  enrollmentType: {
    type: String,
    enum: ['free', 'paid'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'suspended', 'cancelled'],
    default: 'active'
  },
  progress: {
    completedLessons: [{
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: {
        type: Number,
        default: 0 // in seconds
      },
      score: Number // for quiz lessons
    }],
    totalLessons: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in seconds
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  payment: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    paymentId: String,
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe']
    },
    paymentDate: Date,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    razorpayOrderId: String,
    razorpaySignature: String
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateUrl: String,
    certificateId: String
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  expiresAt: Date, // for time-limited courses
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
enrollmentSchema.index({ student_id: 1, course_id: 1 }, { unique: true });
enrollmentSchema.index({ organization_id: 1, student_id: 1 });
enrollmentSchema.index({ organization_id: 1, course_id: 1, status: 1 });
enrollmentSchema.index({ course_id: 1, status: 1 });
enrollmentSchema.index({ student_id: 1, status: 1 });

// Update completion percentage and other metrics when lessons are completed
enrollmentSchema.methods.updateProgress = function() {
  if (this.progress.totalLessons > 0) {
    this.progress.completionPercentage = Math.round(
      (this.progress.completedLessons.length / this.progress.totalLessons) * 100
    );
    
    // Calculate average score for quiz lessons
    const quizLessons = this.progress.completedLessons.filter(lesson => lesson.score !== undefined);
    if (quizLessons.length > 0) {
      this.progress.averageScore = Math.round(
        quizLessons.reduce((sum, lesson) => sum + lesson.score, 0) / quizLessons.length
      );
    }
    
    // Mark as completed if 100%
    if (this.progress.completionPercentage === 100 && this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
};

// Method to mark lesson as completed
enrollmentSchema.methods.completeLesson = function(lessonId, timeSpent = 0, score = null) {
  // Check if lesson is already completed
  const existingIndex = this.progress.completedLessons.findIndex(
    cl => cl.lessonId.toString() === lessonId.toString()
  );
  
  if (existingIndex === -1) {
    // Add new completed lesson
    const completedLesson = {
      lessonId: lessonId,
      completedAt: new Date(),
      timeSpent: timeSpent
    };
    
    if (score !== null) {
      completedLesson.score = score;
    }
    
    this.progress.completedLessons.push(completedLesson);
    this.progress.totalTimeSpent += timeSpent;
  } else {
    // Update existing completed lesson
    const existingLesson = this.progress.completedLessons[existingIndex];
    this.progress.totalTimeSpent -= existingLesson.timeSpent;
    this.progress.totalTimeSpent += timeSpent;
    
    existingLesson.timeSpent = timeSpent;
    existingLesson.completedAt = new Date();
    
    if (score !== null) {
      existingLesson.score = score;
    }
  }
  
  this.progress.lastAccessedLesson = lessonId;
  this.lastAccessedAt = new Date();
  this.updateProgress();
};

// Method to check if lesson is completed
enrollmentSchema.methods.isLessonCompleted = function(lessonId) {
  return this.progress.completedLessons.some(
    cl => cl.lessonId.toString() === lessonId.toString()
  );
};

// Method to get lesson completion data
enrollmentSchema.methods.getLessonCompletion = function(lessonId) {
  return this.progress.completedLessons.find(
    cl => cl.lessonId.toString() === lessonId.toString()
  );
};

// Static method to get enrollment statistics for a course
enrollmentSchema.statics.getCourseStats = async function(courseId) {
  const stats = await this.aggregate([
    { $match: { course_id: mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProgress: { $avg: '$progress.completionPercentage' },
        avgTimeSpent: { $avg: '$progress.totalTimeSpent' }
      }
    }
  ]);
  
  const totalEnrollments = await this.countDocuments({ course_id: courseId });
  
  return {
    totalEnrollments,
    statusBreakdown: stats,
    completionRate: stats.find(s => s._id === 'completed')?.count / totalEnrollments * 100 || 0
  };
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);