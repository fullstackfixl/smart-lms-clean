const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
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
  section_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['video', 'text', 'pdf', 'quiz'],
    required: true
  },
  content: {
    // For video lessons
    videoUrl: String,
    videoDuration: Number, // in seconds
    videoSize: Number, // in bytes
    videoPublicId: String, // Cloudinary public ID
    
    // For text lessons
    textContent: String,
    
    // For PDF lessons
    pdfUrl: String,
    pdfSize: Number,
    pdfPublicId: String, // Cloudinary public ID
    
    // For quiz lessons
    questions: [{
      question: {
        type: String,
        required: true
      },
      options: [{
        type: String,
        required: true
      }],
      correctAnswer: {
        type: Number,
        required: true,
        min: 0
      },
      explanation: String,
      points: {
        type: Number,
        default: 1,
        min: 0
      }
    }],
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    }
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  duration: {
    type: Number, // estimated completion time in minutes
    default: 0
  },
  isPreview: {
    type: Boolean,
    default: false // true means accessible without enrollment
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
lessonSchema.index({ organization_id: 1, course_id: 1, section_id: 1, order: 1 });
lessonSchema.index({ course_id: 1, section_id: 1, order: 1 });
lessonSchema.index({ section_id: 1, order: 1 });

// Pre-save hook to auto-increment order if not provided
lessonSchema.pre('save', async function(next) {
  if (this.isNew && !this.order) {
    const maxOrderLesson = await this.constructor
      .findOne({ section_id: this.section_id })
      .sort({ order: -1 })
      .select('order');
    
    this.order = maxOrderLesson ? maxOrderLesson.order + 1 : 1;
  }
  next();
});

// Pre-save validation for content based on lesson type
lessonSchema.pre('save', function(next) {
  switch (this.type) {
    case 'video':
      // Accept either videoUrl OR videoPublicId (from file upload)
      if (!this.content.videoUrl && !this.content.videoPublicId) {
        return next(new Error('Video URL or uploaded video file is required for video lessons'));
      }
      break;
    case 'text':
      if (!this.content.textContent) {
        return next(new Error('Text content is required for text lessons'));
      }
      break;
    case 'pdf':
      // Accept either pdfUrl OR pdfPublicId (from file upload)
      if (!this.content.pdfUrl && !this.content.pdfPublicId) {
        return next(new Error('PDF URL or uploaded PDF file is required for PDF lessons'));
      }
      break;
    case 'quiz':
      if (!this.content.questions || this.content.questions.length === 0) {
        return next(new Error('Questions are required for quiz lessons'));
      }
      // Validate each question
      for (let question of this.content.questions) {
        if (!question.options || question.options.length < 2) {
          return next(new Error('Each question must have at least 2 options'));
        }
        if (question.correctAnswer >= question.options.length) {
          return next(new Error('Correct answer index is invalid'));
        }
      }
      break;
  }
  next();
});

// Pre-save validation for prerequisites (prevent circular dependencies)
lessonSchema.pre('save', async function(next) {
  if (this.prerequisites && this.prerequisites.length > 0) {
    // Check for circular dependencies
    const checkCircular = async (lessonId, visited = new Set()) => {
      if (visited.has(lessonId.toString())) {
        return true; // Circular dependency found
      }
      
      visited.add(lessonId.toString());
      
      const lesson = await this.constructor.findById(lessonId).select('prerequisites');
      if (lesson && lesson.prerequisites) {
        for (let prereqId of lesson.prerequisites) {
          if (await checkCircular(prereqId, new Set(visited))) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    for (let prereqId of this.prerequisites) {
      if (await checkCircular(prereqId)) {
        return next(new Error('Circular dependency detected in prerequisites'));
      }
    }
  }
  next();
});

// Method to check if user can access this lesson
lessonSchema.methods.canUserAccess = async function(user) {
  // Preview lessons are accessible to everyone
  if (this.isPreview) {
    return { canAccess: true, reason: 'preview' };
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
  
  // Check prerequisites
  if (this.prerequisites && this.prerequisites.length > 0) {
    const completedLessons = enrollment.progress.completedLessons.map(cl => cl.lessonId.toString());
    const prerequisitesMet = this.prerequisites.every(prereq => 
      completedLessons.includes(prereq.toString())
    );
    
    if (!prerequisitesMet) {
      return { canAccess: false, reason: 'prerequisites_not_met' };
    }
  }
  
  return { canAccess: true, reason: 'enrolled' };
};

// Static method to reorder lessons within a section
lessonSchema.statics.reorderLessons = async function(sectionId, lessonOrders) {
  const bulkOps = lessonOrders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, section_id: sectionId },
      update: { $set: { order } }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

// Method to get next lesson in sequence
lessonSchema.methods.getNextLesson = async function() {
  return this.constructor.findOne({
    section_id: this.section_id,
    order: { $gt: this.order },
    isActive: true
  }).sort({ order: 1 });
};

// Method to get previous lesson in sequence
lessonSchema.methods.getPreviousLesson = async function() {
  return this.constructor.findOne({
    section_id: this.section_id,
    order: { $lt: this.order },
    isActive: true
  }).sort({ order: -1 });
};

module.exports = mongoose.model('Lesson', lessonSchema);