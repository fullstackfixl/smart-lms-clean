const mongoose = require('mongoose');

const gradeCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  earned_points: {
    type: Number,
    required: true,
    min: 0
  },
  possible_points: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: false });

const gradeSummarySchema = new mongoose.Schema({
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
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  total_weighted_score: {
    type: Number,
    default: 0,
    min: 0
  },
  total_possible_score: {
    type: Number,
    default: 0,
    min: 0
  },
  current_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  letter_grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F', 'I', 'W'],
    default: 'F'
  },
  grade_points: {
    type: Number,
    default: 0.0,
    min: 0.0,
    max: 4.0
  },
  grade_categories: [gradeCategorySchema],
  academic_year: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', 'summer'],
    trim: true
  },
  last_updated: {
    type: Date,
    default: Date.now,
    index: true
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

// Unique constraint to prevent duplicate summaries
gradeSummarySchema.index({ 
  organization_id: 1, 
  course_id: 1, 
  student_id: 1 
}, { unique: true });

// Additional indexes for efficient queries
gradeSummarySchema.index({ organization_id: 1, student_id: 1, last_updated: -1 });
gradeSummarySchema.index({ organization_id: 1, course_id: 1, current_percentage: -1 });
gradeSummarySchema.index({ course_id: 1, letter_grade: 1 });

// Virtual for GPA calculation
gradeSummarySchema.virtual('gpa').get(function() {
  switch (this.letter_grade) {
    case 'A': return 4.0;
    case 'B': return 3.0;
    case 'C': return 2.0;
    case 'D': return 1.0;
    case 'F': return 0.0;
    case 'I': return 0.0; // Incomplete
    case 'W': return 0.0; // Withdrawn
    default: return 0.0;
  }
});

// Virtual for grade status
gradeSummarySchema.virtual('grade_status').get(function() {
  if (this.current_percentage >= 90) return 'excellent';
  if (this.current_percentage >= 80) return 'good';
  if (this.current_percentage >= 70) return 'satisfactory';
  if (this.current_percentage >= 60) return 'needs_improvement';
  return 'failing';
});

// Virtual for completion percentage (based on total possible score)
gradeSummarySchema.virtual('completion_percentage').get(function() {
  if (this.total_possible_score === 0) return 0;
  return Math.round((this.total_weighted_score / this.total_possible_score) * 100 * 100) / 100;
});

// Instance method to update grade points based on letter grade
gradeSummarySchema.methods.updateGradePoints = function() {
  this.grade_points = this.gpa;
  return this.save();
};

// Instance method to get category breakdown
gradeSummarySchema.methods.getCategoryBreakdown = function() {
  return this.grade_categories.map(category => ({
    category: category.category,
    weight: category.weight,
    percentage: category.percentage,
    points_earned: category.earned_points,
    points_possible: category.possible_points,
    weighted_contribution: (category.percentage * category.weight) / 100
  }));
};

// Instance method to calculate trend (requires historical data)
gradeSummarySchema.methods.calculateTrend = async function(days = 30) {
  const Grade = mongoose.model('Grade');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentGrades = await Grade.find({
    student_id: this.student_id,
    course_id: this.course_id,
    organization_id: this.organization_id,
    graded_date: { $gte: cutoffDate },
    is_active: true
  }).sort({ graded_date: 1 });
  
  if (recentGrades.length < 2) {
    return { trend: 'stable', change: 0, message: 'Insufficient data for trend analysis' };
  }
  
  const firstHalf = recentGrades.slice(0, Math.floor(recentGrades.length / 2));
  const secondHalf = recentGrades.slice(Math.floor(recentGrades.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, grade) => sum + grade.percentage, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, grade) => sum + grade.percentage, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  
  let trend = 'stable';
  if (change > 5) trend = 'improving';
  else if (change < -5) trend = 'declining';
  
  return {
    trend,
    change: Math.round(change * 100) / 100,
    message: this.getTrendMessage(trend, change)
  };
};

// Helper method to get trend message
gradeSummarySchema.methods.getTrendMessage = function(trend, change) {
  switch (trend) {
    case 'improving':
      return `Performance is improving by ${Math.abs(change).toFixed(1)} percentage points`;
    case 'declining':
      return `Performance is declining by ${Math.abs(change).toFixed(1)} percentage points`;
    default:
      return 'Performance is stable';
  }
};

// Static method to find summaries by organization
gradeSummarySchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  return this.find(query)
    .populate('student_id', 'full_name email profile_picture')
    .populate('course_id', 'title')
    .sort({ current_percentage: -1, last_updated: -1 });
};

// Static method to get course grade distribution
gradeSummarySchema.statics.getCourseGradeDistribution = async function(courseId, organizationId) {
  const distribution = await this.aggregate([
    {
      $match: {
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      }
    },
    {
      $group: {
        _id: '$letter_grade',
        count: { $sum: 1 },
        avg_percentage: { $avg: '$current_percentage' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  const totalStudents = await this.countDocuments({
    course_id: courseId,
    organization_id: organizationId,
    is_active: true
  });
  
  return {
    distribution: distribution.map(item => ({
      grade: item._id,
      count: item.count,
      percentage: totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0,
      avg_score: Math.round(item.avg_percentage * 100) / 100
    })),
    total_students: totalStudents
  };
};

// Static method to get student GPA across all courses
gradeSummarySchema.statics.getStudentGPA = async function(studentId, organizationId, filters = {}) {
  const matchQuery = {
    student_id: studentId,
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  const summaries = await this.find(matchQuery)
    .populate('course_id', 'title credit_hours')
    .sort({ last_updated: -1 });
  
  if (summaries.length === 0) {
    return {
      gpa: 0.0,
      total_courses: 0,
      total_credit_hours: 0,
      grade_distribution: {}
    };
  }
  
  let totalGradePoints = 0;
  let totalCreditHours = 0;
  const gradeDistribution = {};
  
  summaries.forEach(summary => {
    const creditHours = summary.course_id.credit_hours || 1; // Default to 1 if not specified
    totalGradePoints += summary.gpa * creditHours;
    totalCreditHours += creditHours;
    
    gradeDistribution[summary.letter_grade] = (gradeDistribution[summary.letter_grade] || 0) + 1;
  });
  
  const gpa = totalCreditHours > 0 ? totalGradePoints / totalCreditHours : 0;
  
  return {
    gpa: Math.round(gpa * 100) / 100,
    total_courses: summaries.length,
    total_credit_hours: totalCreditHours,
    grade_distribution: gradeDistribution,
    courses: summaries.map(summary => ({
      course_id: summary.course_id._id,
      course_title: summary.course_id.title,
      letter_grade: summary.letter_grade,
      percentage: summary.current_percentage,
      gpa: summary.gpa,
      last_updated: summary.last_updated
    }))
  };
};

// Static method to find students at risk (low grades)
gradeSummarySchema.statics.findAtRiskStudents = async function(organizationId, threshold = 60, filters = {}) {
  const matchQuery = {
    organization_id: organizationId,
    current_percentage: { $lt: threshold },
    is_active: true,
    ...filters
  };
  
  const atRiskStudents = await this.find(matchQuery)
    .populate('student_id', 'full_name email')
    .populate('course_id', 'title')
    .sort({ current_percentage: 1 });
  
  return atRiskStudents.map(summary => ({
    student_id: summary.student_id._id,
    student_name: summary.student_id.full_name,
    student_email: summary.student_id.email,
    course_id: summary.course_id._id,
    course_title: summary.course_id.title,
    current_percentage: summary.current_percentage,
    letter_grade: summary.letter_grade,
    grade_status: summary.grade_status,
    last_updated: summary.last_updated,
    categories_needing_improvement: summary.grade_categories
      .filter(cat => cat.percentage < threshold)
      .map(cat => ({
        category: cat.category,
        percentage: cat.percentage,
        weight: cat.weight
      }))
  }));
};

// Static method to get organization grade statistics
gradeSummarySchema.statics.getOrganizationGradeStats = async function(organizationId, filters = {}) {
  const matchQuery = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total_students: { $sum: 1 },
        avg_percentage: { $avg: '$current_percentage' },
        avg_gpa: { $avg: '$grade_points' },
        grade_distribution: {
          $push: '$letter_grade'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total_students: 0,
      avg_percentage: 0,
      avg_gpa: 0,
      grade_distribution: {}
    };
  }
  
  const stat = stats[0];
  const gradeDistribution = {};
  
  stat.grade_distribution.forEach(grade => {
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  });
  
  return {
    total_students: stat.total_students,
    avg_percentage: Math.round(stat.avg_percentage * 100) / 100,
    avg_gpa: Math.round(stat.avg_gpa * 100) / 100,
    grade_distribution: gradeDistribution
  };
};

// Pre-save middleware to update grade points
gradeSummarySchema.pre('save', function(next) {
  // Update grade points based on letter grade
  this.grade_points = this.gpa;
  
  // Update last_updated timestamp
  this.last_updated = new Date();
  
  next();
});

// Pre-save middleware to validate organization consistency
gradeSummarySchema.pre('save', async function(next) {
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
  
  next();
});

const GradeSummary = mongoose.model('GradeSummary', gradeSummarySchema);

module.exports = GradeSummary;