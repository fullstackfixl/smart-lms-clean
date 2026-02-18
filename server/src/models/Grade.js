const mongoose = require('mongoose');

const rubricScoreSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  max_points: {
    type: Number,
    required: true,
    min: 0
  },
  earned_points: {
    type: Number,
    required: true,
    min: 0
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { _id: false });

const gradeSchema = new mongoose.Schema({
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
  assignment_type: {
    type: String,
    enum: ['assignment', 'quiz', 'exam', 'project', 'participation', 'lab_work', 'presentation', 'other'],
    required: true,
    index: true
  },
  assignment_title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  assignment_description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  max_score: {
    type: Number,
    required: true,
    min: 0
  },
  earned_score: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  grade_category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  due_date: {
    type: Date,
    index: true
  },
  submitted_date: Date,
  graded_date: {
    type: Date,
    default: Date.now,
    index: true
  },
  graded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  rubric_scores: [rubricScoreSchema],
  is_extra_credit: {
    type: Boolean,
    default: false
  },
  late_submission: {
    type: Boolean,
    default: false
  },
  late_penalty: {
    type: Number,
    default: 0,
    min: 0
  },
  academic_year: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', 'summer'],
    trim: true
  },
  quiz_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
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
gradeSchema.index({ organization_id: 1, course_id: 1, student_id: 1 });
gradeSchema.index({ organization_id: 1, student_id: 1, graded_date: -1 });
gradeSchema.index({ course_id: 1, assignment_type: 1, graded_date: -1 });
gradeSchema.index({ organization_id: 1, course_id: 1, assignment_type: 1 });

// Virtual for letter grade
gradeSchema.virtual('letter_grade').get(function() {
  const percentage = this.percentage || (this.earned_score / this.max_score) * 100;
  
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
});

// Virtual for grade points (4.0 scale)
gradeSchema.virtual('grade_points').get(function() {
  const percentage = this.percentage || (this.earned_score / this.max_score) * 100;
  
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.0;
  if (percentage >= 70) return 2.0;
  if (percentage >= 60) return 1.0;
  return 0.0;
});

// Virtual for weighted score
gradeSchema.virtual('weighted_score').get(function() {
  const percentage = this.percentage || (this.earned_score / this.max_score) * 100;
  return (percentage * this.weight) / 100;
});

// Pre-save middleware to calculate percentage
gradeSchema.pre('save', function(next) {
  // Calculate percentage if not provided
  if (!this.percentage && this.max_score > 0) {
    this.percentage = Math.round((this.earned_score / this.max_score) * 100 * 100) / 100; // Round to 2 decimal places
  }
  
  // Validate earned score doesn't exceed max score
  if (this.earned_score > this.max_score && !this.is_extra_credit) {
    return next(new Error('Earned score cannot exceed maximum score unless it is extra credit'));
  }
  
  // Apply late penalty if applicable
  if (this.late_submission && this.late_penalty > 0) {
    this.earned_score = Math.max(0, this.earned_score - this.late_penalty);
    this.percentage = Math.round((this.earned_score / this.max_score) * 100 * 100) / 100;
  }
  
  next();
});

// Instance method to calculate rubric total
gradeSchema.methods.calculateRubricTotal = function() {
  if (this.rubric_scores.length === 0) return { earned: 0, max: 0 };
  
  const earned = this.rubric_scores.reduce((sum, score) => sum + score.earned_points, 0);
  const max = this.rubric_scores.reduce((sum, score) => sum + score.max_points, 0);
  
  return { earned, max };
};

// Instance method to update from rubric scores
gradeSchema.methods.updateFromRubric = function() {
  const rubricTotal = this.calculateRubricTotal();
  
  if (rubricTotal.max > 0) {
    this.max_score = rubricTotal.max;
    this.earned_score = rubricTotal.earned;
    this.percentage = Math.round((rubricTotal.earned / rubricTotal.max) * 100 * 100) / 100;
  }
  
  return this.save();
};

// Static method to find grades by organization
gradeSchema.statics.findByOrganization = function(organizationId, filters = {}) {
  const query = {
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  return this.find(query)
    .populate('student_id', 'full_name email')
    .populate('course_id', 'title')
    .populate('graded_by', 'full_name')
    .sort({ graded_date: -1 });
};

// Static method to get student grades summary
gradeSchema.statics.getStudentGradesSummary = async function(studentId, organizationId, filters = {}) {
  const matchQuery = {
    student_id: studentId,
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  const grades = await this.find(matchQuery)
    .populate('course_id', 'title')
    .sort({ graded_date: -1 });
  
  // Group by course
  const courseGrades = {};
  grades.forEach(grade => {
    const courseId = grade.course_id._id.toString();
    if (!courseGrades[courseId]) {
      courseGrades[courseId] = {
        course_title: grade.course_id.title,
        grades: [],
        total_weighted_score: 0,
        total_weight: 0,
        current_percentage: 0
      };
    }
    
    courseGrades[courseId].grades.push(grade);
    courseGrades[courseId].total_weighted_score += grade.weighted_score;
    courseGrades[courseId].total_weight += grade.weight;
  });
  
  // Calculate current percentage for each course
  Object.keys(courseGrades).forEach(courseId => {
    const course = courseGrades[courseId];
    if (course.total_weight > 0) {
      course.current_percentage = Math.round((course.total_weighted_score / course.total_weight) * 100 * 100) / 100;
    }
  });
  
  return courseGrades;
};

// Static method to get course grade statistics
gradeSchema.statics.getCourseGradeStats = async function(courseId, organizationId, filters = {}) {
  const matchQuery = {
    course_id: courseId,
    organization_id: organizationId,
    is_active: true,
    ...filters
  };
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$assignment_type',
        count: { $sum: 1 },
        avg_percentage: { $avg: '$percentage' },
        max_percentage: { $max: '$percentage' },
        min_percentage: { $min: '$percentage' },
        total_weight: { $sum: '$weight' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  const overallStats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        total_assignments: { $sum: 1 },
        avg_percentage: { $avg: '$percentage' },
        total_weight_used: { $sum: '$weight' },
        grade_distribution: {
          $push: {
            $switch: {
              branches: [
                { case: { $gte: ['$percentage', 90] }, then: 'A' },
                { case: { $gte: ['$percentage', 80] }, then: 'B' },
                { case: { $gte: ['$percentage', 70] }, then: 'C' },
                { case: { $gte: ['$percentage', 60] }, then: 'D' }
              ],
              default: 'F'
            }
          }
        }
      }
    }
  ]);
  
  return {
    by_assignment_type: stats,
    overall: overallStats[0] || {
      total_assignments: 0,
      avg_percentage: 0,
      total_weight_used: 0,
      grade_distribution: []
    }
  };
};

// Static method to validate grade weights for a course
gradeSchema.statics.validateCourseWeights = async function(courseId, organizationId, excludeGradeId = null) {
  const matchQuery = {
    course_id: courseId,
    organization_id: organizationId,
    is_active: true
  };
  
  if (excludeGradeId) {
    matchQuery._id = { $ne: excludeGradeId };
  }
  
  const totalWeight = await this.aggregate([
    { $match: matchQuery },
    { $group: { _id: null, total: { $sum: '$weight' } } }
  ]);
  
  return totalWeight[0]?.total || 0;
};

// Static method to recalculate grade summaries for a course
gradeSchema.statics.recalculateCourseSummaries = async function(courseId, organizationId) {
  const GradeSummary = mongoose.model('GradeSummary');
  
  // Get all students with grades in this course
  const studentGrades = await this.aggregate([
    {
      $match: {
        course_id: courseId,
        organization_id: organizationId,
        is_active: true
      }
    },
    {
      $group: {
        _id: '$student_id',
        grades: { $push: '$$ROOT' },
        total_weighted_score: { $sum: '$weighted_score' },
        total_weight: { $sum: '$weight' }
      }
    }
  ]);
  
  // Update or create grade summaries
  const summaryPromises = studentGrades.map(async (studentData) => {
    const currentPercentage = studentData.total_weight > 0 ? 
      Math.round((studentData.total_weighted_score / studentData.total_weight) * 100 * 100) / 100 : 0;
    
    const letterGrade = this.calculateLetterGrade(currentPercentage);
    
    // Group grades by category
    const gradeCategories = {};
    studentData.grades.forEach(grade => {
      const category = grade.grade_category || grade.assignment_type;
      if (!gradeCategories[category]) {
        gradeCategories[category] = {
          category,
          weight: 0,
          earned_points: 0,
          possible_points: 0,
          percentage: 0
        };
      }
      
      gradeCategories[category].weight += grade.weight;
      gradeCategories[category].earned_points += grade.earned_score;
      gradeCategories[category].possible_points += grade.max_score;
    });
    
    // Calculate percentage for each category
    Object.values(gradeCategories).forEach(category => {
      if (category.possible_points > 0) {
        category.percentage = Math.round((category.earned_points / category.possible_points) * 100 * 100) / 100;
      }
    });
    
    return GradeSummary.findOneAndUpdate(
      {
        student_id: studentData._id,
        course_id: courseId,
        organization_id: organizationId
      },
      {
        total_weighted_score: studentData.total_weighted_score,
        total_possible_score: studentData.total_weight,
        current_percentage: currentPercentage,
        letter_grade: letterGrade,
        grade_categories: Object.values(gradeCategories),
        last_updated: new Date()
      },
      { upsert: true, new: true }
    );
  });
  
  return Promise.all(summaryPromises);
};

// Static method to calculate letter grade from percentage
gradeSchema.statics.calculateLetterGrade = function(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

// Pre-save middleware to validate organization consistency
gradeSchema.pre('save', async function(next) {
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

// Post-save middleware to update grade summary
gradeSchema.post('save', async function() {
  try {
    await this.constructor.recalculateCourseSummaries(this.course_id, this.organization_id);
  } catch (error) {
    console.error('Error updating grade summary:', error);
  }
});

const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;