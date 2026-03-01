const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correct_answer: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (value) {
        return value < this.options.length;
      },
      message: 'Correct answer index must be within options range'
    }
  },
  explanation: {
    type: String,
    trim: true
  }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    maxlength: 1000
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function (questions) {
        return questions && questions.length > 0;
      },
      message: 'Quiz must have at least one question'
    }
  },
  total_marks: {
    type: Number,
    required: true,
    min: 1,
    default: 10
  },
  timer_minutes: {
    type: Number,
    min: 1,
    max: 180, // 3 hours max
    default: null
  },
  pass_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 60
  },
  max_attempts: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 3
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'DRAFT'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  required_for_completion: {
    type: Boolean,
    default: true // Student must pass this quiz to complete the course
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
quizSchema.index({ organization_id: 1, course_id: 1 });
quizSchema.index({ organization_id: 1, instructor_id: 1 });
quizSchema.index({ course_id: 1, is_active: 1 });
quizSchema.index({ lesson_id: 1, is_active: 1 });

// Virtual for total questions count
quizSchema.virtual('total_questions').get(function () {
  return this.questions ? this.questions.length : 0;
});

// Virtual for pass score
quizSchema.virtual('pass_score').get(function () {
  const totalQuestions = this.total_questions;
  return Math.ceil((totalQuestions * this.pass_percentage) / 100);
});

// Instance method to check if user can access quiz
quizSchema.methods.canUserAccess = async function (user) {
  // Check if user belongs to same organization
  if (this.organization_id.toString() !== user.organization_id.toString()) {
    return { canAccess: false, reason: 'organization_mismatch' };
  }

  // Check if user is instructor or admin
  if (user.role === 'admin' || this.instructor_id.toString() === user._id.toString()) {
    return { canAccess: true, reason: 'instructor_access' };
  }

  // Check if user is enrolled in the course
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({
    student_id: user._id,
    course_id: this.course_id,
    status: 'active'
  });

  if (!enrollment) {
    return { canAccess: false, reason: 'not_enrolled' };
  }

  return { canAccess: true, reason: 'enrolled' };
};

// Instance method to get quiz for student (without correct answers)
quizSchema.methods.getStudentVersion = function () {
  const quizObj = this.toObject();

  // Remove correct answers and explanations for students
  quizObj.questions = quizObj.questions.map(q => ({
    question: q.question,
    options: q.options
  }));

  return quizObj;
};

// Static method to find quizzes by course with organization isolation
quizSchema.statics.findByCourse = function (courseId, organizationId, options = {}) {
  const query = {
    course_id: courseId,
    organization_id: organizationId,
    is_active: true
  };

  return this.find(query, null, options);
};

// Static method to find quizzes by instructor with organization isolation
quizSchema.statics.findByInstructor = function (instructorId, organizationId, options = {}) {
  const query = {
    instructor_id: instructorId,
    organization_id: organizationId,
    is_active: true
  };

  return this.find(query, null, options);
};

// Pre-save middleware to validate organization consistency
quizSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('course_id') || this.isModified('instructor_id')) {
    try {
      const fs = require('fs');
      const logPath = 'C:\\Users\\Lenovo\\projectlms\\server\\debug_quiz.log';
      const quizOrgId = this.organization_id._id || this.organization_id;

      // Verify course belongs to same organization
      const Course = mongoose.model('Course');
      const course = await Course.findById(this.course_id);

      if (!course) {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] Course not found: ${this.course_id}\n`);
        return next(new Error('Course not found'));
      }

      const courseOrgId = course.organization_id._id || course.organization_id;

      fs.appendFileSync(logPath, `[${new Date().toISOString()}] Comparing Orgs:\n   Quiz Org: ${quizOrgId} (Type: ${typeof quizOrgId})\n   Course Org: ${courseOrgId} (Type: ${typeof courseOrgId})\n`);

      if (courseOrgId.toString() !== quizOrgId.toString()) {
        fs.appendFileSync(logPath, `❌ Mismatch! ${courseOrgId.toString()} !== ${quizOrgId.toString()}\n`);
        return next(new Error('Course must belong to the same organization'));
      }

      // Verify instructor belongs to same organization
      const User = mongoose.model('User');
      const instructor = await User.findById(this.instructor_id);

      if (!instructor) {
        return next(new Error('Instructor not found'));
      }

      const instructorOrgId = instructor.organization_id._id || instructor.organization_id;

      if (instructorOrgId.toString() !== quizOrgId.toString()) {
        return next(new Error('Instructor must belong to the same organization'));
      }

      // Verify instructor has teacher or admin role
      if (!['instructor', 'teacher', 'admin', 'org_admin'].includes(instructor.role)) {
        return next(new Error('User must be an instructor, teacher, or admin to create quizzes'));
      }

    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Pre-save middleware to validate questions
quizSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    for (let i = 0; i < this.questions.length; i++) {
      const question = this.questions[i];

      // Validate options count
      if (!question.options || question.options.length < 2) {
        return next(new Error(`Question ${i + 1} must have at least 2 options`));
      }

      if (question.options.length > 6) {
        return next(new Error(`Question ${i + 1} cannot have more than 6 options`));
      }

      // Validate correct answer index
      if (question.correct_answer < 0 || question.correct_answer >= question.options.length) {
        return next(new Error(`Question ${i + 1} has invalid correct answer index`));
      }

      // Validate no empty options
      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j] || question.options[j].trim().length === 0) {
          return next(new Error(`Question ${i + 1}, option ${j + 1} cannot be empty`));
        }
      }
    }
  }

  next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;