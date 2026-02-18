const mongoose = require('mongoose');

const riskFactorSchema = new mongoose.Schema({
  factor_type: {
    type: String,
    required: true,
    enum: ['attendance', 'quiz_performance', 'lesson_completion', 'engagement', 'time_spent']
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.2
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, { _id: false });

const riskAssessmentSchema = new mongoose.Schema({
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
  risk_score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  risk_level: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    index: true
  },
  factors: [riskFactorSchema],
  suggestions: [{
    type: String,
    trim: true
  }],
  confidence_level: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  data_points_used: {
    type: Number,
    min: 0,
    default: 0
  },
  last_calculated: {
    type: Date,
    default: Date.now,
    index: true
  },
  calculation_method: {
    type: String,
    enum: ['rule_based', 'ml_model', 'hybrid'],
    default: 'rule_based'
  },
  notification_sent: {
    type: Boolean,
    default: false
  },
  notification_sent_at: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
riskAssessmentSchema.index({ organization_id: 1, student_id: 1, course_id: 1 });
riskAssessmentSchema.index({ organization_id: 1, risk_level: 1 });
riskAssessmentSchema.index({ organization_id: 1, last_calculated: -1 });
riskAssessmentSchema.index({ student_id: 1, last_calculated: -1 });

// Unique constraint to prevent duplicate assessments
riskAssessmentSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

// Virtual for risk percentage display
riskAssessmentSchema.virtual('risk_percentage').get(function() {
  return `${this.risk_score}%`;
});

// Virtual for days since last calculation
riskAssessmentSchema.virtual('days_since_calculation').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.last_calculated);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to determine risk level from score
riskAssessmentSchema.methods.calculateRiskLevel = function() {
  if (this.risk_score >= 70) {
    return 'high';
  } else if (this.risk_score >= 40) {
    return 'medium';
  } else {
    return 'low';
  }
};

// Instance method to check if assessment needs update
riskAssessmentSchema.methods.needsUpdate = function() {
  const daysSinceUpdate = this.days_since_calculation;
  
  // High risk students: update daily
  if (this.risk_level === 'high' && daysSinceUpdate >= 1) {
    return true;
  }
  
  // Medium risk students: update every 3 days
  if (this.risk_level === 'medium' && daysSinceUpdate >= 3) {
    return true;
  }
  
  // Low risk students: update weekly
  if (this.risk_level === 'low' && daysSinceUpdate >= 7) {
    return true;
  }
  
  return false;
};

// Instance method to generate intervention suggestions
riskAssessmentSchema.methods.generateSuggestions = function() {
  const suggestions = [];
  
  // Analyze factors and generate specific suggestions
  this.factors.forEach(factor => {
    switch (factor.factor_type) {
      case 'attendance':
        if (factor.score < 50) {
          suggestions.push('Schedule one-on-one meeting to discuss attendance issues');
          suggestions.push('Send attendance reminders before live classes');
        }
        break;
        
      case 'quiz_performance':
        if (factor.score < 60) {
          suggestions.push('Provide additional practice quizzes and study materials');
          suggestions.push('Offer tutoring sessions for difficult concepts');
        }
        break;
        
      case 'lesson_completion':
        if (factor.score < 70) {
          suggestions.push('Check in with student about course difficulty');
          suggestions.push('Provide deadline extensions if needed');
        }
        break;
        
      case 'engagement':
        if (factor.score < 40) {
          suggestions.push('Encourage participation in discussion forums');
          suggestions.push('Assign peer study groups or mentorship');
        }
        break;
        
      case 'time_spent':
        if (factor.score < 30) {
          suggestions.push('Discuss time management strategies');
          suggestions.push('Provide study schedule template');
        }
        break;
    }
  });
  
  // General suggestions based on risk level
  if (this.risk_level === 'high') {
    suggestions.push('Consider immediate intervention - contact student within 24 hours');
    suggestions.push('Review course prerequisites and student background');
  } else if (this.risk_level === 'medium') {
    suggestions.push('Monitor progress closely and provide additional support');
    suggestions.push('Send encouraging messages and progress updates');
  }
  
  // Remove duplicates and limit to 5 suggestions
  return [...new Set(suggestions)].slice(0, 5);
};

// Static method to find assessments by organization with filtering
riskAssessmentSchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  return this.find(query)
    .populate('student_id', 'full_name email')
    .populate('course_id', 'title')
    .sort({ risk_score: -1, last_calculated: -1 });
};

// Static method to find high-risk students
riskAssessmentSchema.statics.findHighRiskStudents = function(organizationId, courseId = null) {
  const query = {
    organization_id: organizationId,
    risk_level: 'high',
    is_active: true
  };
  
  if (courseId) {
    query.course_id = courseId;
  }
  
  return this.find(query)
    .populate('student_id', 'full_name email')
    .populate('course_id', 'title')
    .sort({ risk_score: -1 });
};

// Static method to get risk statistics for organization
riskAssessmentSchema.statics.getOrganizationStats = async function(organizationId) {
  const stats = await this.aggregate([
    {
      $match: {
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: '$risk_level',
        count: { $sum: 1 },
        avg_score: { $avg: '$risk_score' }
      }
    }
  ]);
  
  const result = {
    low: { count: 0, avg_score: 0 },
    medium: { count: 0, avg_score: 0 },
    high: { count: 0, avg_score: 0 },
    total: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = {
      count: stat.count,
      avg_score: Math.round(stat.avg_score)
    };
    result.total += stat.count;
  });
  
  return result;
};

// Static method to get course risk overview
riskAssessmentSchema.statics.getCourseRiskOverview = async function(courseId, organizationId) {
  const assessments = await this.find({
    course_id: courseId,
    organization_id: organizationId,
    is_active: true
  }).populate('student_id', 'full_name email');
  
  const overview = {
    total_students: assessments.length,
    risk_distribution: {
      low: assessments.filter(a => a.risk_level === 'low').length,
      medium: assessments.filter(a => a.risk_level === 'medium').length,
      high: assessments.filter(a => a.risk_level === 'high').length
    },
    avg_risk_score: assessments.length > 0 ? 
      Math.round(assessments.reduce((sum, a) => sum + a.risk_score, 0) / assessments.length) : 0,
    high_risk_students: assessments
      .filter(a => a.risk_level === 'high')
      .map(a => ({
        student_id: a.student_id._id,
        student_name: a.student_id.full_name,
        risk_score: a.risk_score,
        last_calculated: a.last_calculated
      }))
  };
  
  return overview;
};

// Pre-save middleware to validate organization consistency
riskAssessmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Verify student belongs to same organization
      const User = mongoose.model('User');
      const student = await User.findById(this.student_id);
      
      if (!student) {
        return next(new Error('Student not found'));
      }
      
      if (student.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Student must belong to the same organization'));
      }
      
      // Verify course belongs to same organization
      const Course = mongoose.model('Course');
      const course = await Course.findById(this.course_id);
      
      if (!course) {
        return next(new Error('Course not found'));
      }
      
      if (course.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Course must belong to the same organization'));
      }
      
    } catch (error) {
      return next(error);
    }
  }
  
  // Auto-calculate risk level from score
  this.risk_level = this.calculateRiskLevel();
  
  // Auto-generate suggestions if not provided
  if (!this.suggestions || this.suggestions.length === 0) {
    this.suggestions = this.generateSuggestions();
  }
  
  next();
});

// Pre-save middleware to update last_calculated timestamp
riskAssessmentSchema.pre('save', function(next) {
  if (this.isModified('risk_score') || this.isModified('factors')) {
    this.last_calculated = new Date();
  }
  next();
});

const RiskAssessment = mongoose.model('RiskAssessment', riskAssessmentSchema);

module.exports = RiskAssessment;