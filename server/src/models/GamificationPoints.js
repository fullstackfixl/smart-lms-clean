const mongoose = require('mongoose');

const gamificationPointsSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false, // Allow null for public students
    default: null,
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
    required: false,
    index: true
  },
  lesson_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false,
    index: true
  },
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false,
    index: true
  },
  activity_type: {
    type: String,
    required: true,
    enum: ['lesson_completion', 'quiz_pass', 'course_completion', 'bonus_activity'],
    index: true
  },
  points_earned: {
    type: Number,
    required: true,
    min: 0
  },
  activity_title: {
    type: String,
    required: true,
    trim: true
  },
  activity_description: {
    type: String,
    trim: true
  },
  earned_at: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  metadata: {
    quiz_score: Number,
    quiz_percentage: Number,
    lesson_duration_minutes: Number,
    course_completion_percentage: Number,
    additional_data: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
gamificationPointsSchema.index({ organization_id: 1, user_id: 1 });
gamificationPointsSchema.index({ user_id: 1, earned_at: -1 });
gamificationPointsSchema.index({ course_id: 1, user_id: 1 });
gamificationPointsSchema.index({ organization_id: 1, activity_type: 1 });
gamificationPointsSchema.index({ user_id: 1, activity_type: 1, earned_at: -1 });

// Unique constraint to prevent duplicate point awards for same activity
gamificationPointsSchema.index({ 
  user_id: 1, 
  activity_type: 1, 
  lesson_id: 1 
}, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { lesson_id: { $exists: true } }
});

gamificationPointsSchema.index({ 
  user_id: 1, 
  activity_type: 1, 
  quiz_id: 1 
}, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { quiz_id: { $exists: true } }
});

// Static method to award points for lesson completion
gamificationPointsSchema.statics.awardLessonPoints = async function(userId, lessonId, courseId, organizationId, lessonTitle) {
  const LESSON_POINTS = 10;
  
  try {
    // Check if points already awarded for this lesson
    const existingPoints = await this.findOne({
      user_id: userId,
      lesson_id: lessonId,
      activity_type: 'lesson_completion',
      is_active: true
    });
    
    if (existingPoints) {
      return { success: false, message: 'Points already awarded for this lesson' };
    }
    
    // Award points
    const pointsRecord = new this({
      organization_id: organizationId,
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      activity_type: 'lesson_completion',
      points_earned: LESSON_POINTS,
      activity_title: `Completed: ${lessonTitle}`,
      activity_description: `Earned ${LESSON_POINTS} points for completing lesson`
    });
    
    await pointsRecord.save();
    
    return { 
      success: true, 
      points_earned: LESSON_POINTS,
      total_points: await this.getUserTotalPoints(userId, organizationId)
    };
    
  } catch (error) {
    if (error.code === 11000) {
      return { success: false, message: 'Points already awarded for this lesson' };
    }
    throw error;
  }
};

// Static method to award points for quiz pass
gamificationPointsSchema.statics.awardQuizPoints = async function(userId, quizId, courseId, organizationId, quizTitle, score, percentage) {
  const QUIZ_POINTS = 50;
  
  try {
    // Check if points already awarded for this quiz
    const existingPoints = await this.findOne({
      user_id: userId,
      quiz_id: quizId,
      activity_type: 'quiz_pass',
      is_active: true
    });
    
    if (existingPoints) {
      return { success: false, message: 'Points already awarded for this quiz' };
    }
    
    // Award points
    const pointsRecord = new this({
      organization_id: organizationId,
      user_id: userId,
      course_id: courseId,
      quiz_id: quizId,
      activity_type: 'quiz_pass',
      points_earned: QUIZ_POINTS,
      activity_title: `Passed: ${quizTitle}`,
      activity_description: `Earned ${QUIZ_POINTS} points for passing quiz with ${percentage}%`,
      metadata: {
        quiz_score: score,
        quiz_percentage: percentage
      }
    });
    
    await pointsRecord.save();
    
    return { 
      success: true, 
      points_earned: QUIZ_POINTS,
      total_points: await this.getUserTotalPoints(userId, organizationId)
    };
    
  } catch (error) {
    if (error.code === 11000) {
      return { success: false, message: 'Points already awarded for this quiz' };
    }
    throw error;
  }
};

// Static method to get user's total points
gamificationPointsSchema.statics.getUserTotalPoints = async function(userId, organizationId) {
  const result = await this.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: null,
        total_points: { $sum: '$points_earned' }
      }
    }
  ]);
  
  return result[0] ? result[0].total_points : 0;
};

// Static method to get user's points by activity type
gamificationPointsSchema.statics.getUserPointsByActivity = async function(userId, organizationId) {
  const result = await this.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: '$activity_type',
        points: { $sum: '$points_earned' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const pointsByActivity = {
    lesson_completion: { points: 0, count: 0 },
    quiz_pass: { points: 0, count: 0 },
    course_completion: { points: 0, count: 0 },
    bonus_activity: { points: 0, count: 0 }
  };
  
  result.forEach(item => {
    pointsByActivity[item._id] = {
      points: item.points,
      count: item.count
    };
  });
  
  return pointsByActivity;
};

// Static method to get course leaderboard
gamificationPointsSchema.statics.getCourseLeaderboard = async function(courseId, organizationId, limit = 10) {
  const result = await this.aggregate([
    {
      $match: {
        course_id: new mongoose.Types.ObjectId(courseId),
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: '$user_id',
        total_points: { $sum: '$points_earned' },
        activities_count: { $sum: 1 },
        last_activity: { $max: '$earned_at' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user_id: '$_id',
        user_name: '$user.full_name',
        user_email: '$user.email',
        total_points: 1,
        activities_count: 1,
        last_activity: 1
      }
    },
    {
      $sort: { total_points: -1, last_activity: -1 }
    },
    {
      $limit: limit
    }
  ]);
  
  // Add ranking
  return result.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
};

// Static method to get organization leaderboard
gamificationPointsSchema.statics.getOrganizationLeaderboard = async function(organizationId, limit = 10) {
  const result = await this.aggregate([
    {
      $match: {
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: '$user_id',
        total_points: { $sum: '$points_earned' },
        activities_count: { $sum: 1 },
        last_activity: { $max: '$earned_at' },
        courses_participated: { $addToSet: '$course_id' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user_id: '$_id',
        user_name: '$user.full_name',
        user_email: '$user.email',
        total_points: 1,
        activities_count: 1,
        last_activity: 1,
        courses_count: { $size: '$courses_participated' }
      }
    },
    {
      $sort: { total_points: -1, last_activity: -1 }
    },
    {
      $limit: limit
    }
  ]);
  
  // Add ranking
  return result.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
};

// Static method to get user's recent activities
gamificationPointsSchema.statics.getUserRecentActivities = async function(userId, organizationId, limit = 10) {
  return this.find({
    user_id: userId,
    organization_id: organizationId,
    is_active: true
  })
  .sort({ earned_at: -1 })
  .limit(limit)
  .populate('course_id', 'title')
  .populate('lesson_id', 'title')
  .populate('quiz_id', 'title');
};

// Pre-save middleware to validate organization consistency
gamificationPointsSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Verify user belongs to same organization
      const User = mongoose.model('User');
      const user = await User.findById(this.user_id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Skip validation for public students (organization_id = null)
      if (this.organization_id === null && user.organization_id === null) {
        return next();
      }
      
      if (!user.organization_id || !this.organization_id) {
        return next(new Error('Organization mismatch'));
      }
      
      if (user.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('User must belong to the same organization'));
      }
      
      // Verify course belongs to same organization (if provided)
      if (this.course_id) {
        const Course = mongoose.model('Course');
        const course = await Course.findById(this.course_id);
        
        if (!course) {
          return next(new Error('Course not found'));
        }
        
        if (course.organization_id && this.organization_id && 
            course.organization_id.toString() !== this.organization_id.toString()) {
          return next(new Error('Course must belong to the same organization'));
        }
      }
      
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

const GamificationPoints = mongoose.model('GamificationPoints', gamificationPointsSchema);

module.exports = GamificationPoints;