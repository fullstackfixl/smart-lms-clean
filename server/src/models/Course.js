const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false, // Allow null for public courses
    default: null
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date
  },
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thumbnail: String,
  duration: Number, // in minutes
  language: {
    type: String,
    default: 'en'
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false   // only platform_admin manually sets this for legacy compat
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Set by platform admin to show this course on the public landing page
  isGloballyPublished: {
    type: Boolean,
    default: false
  },
  globallyPublishedAt: {
    type: Date,
    default: null
  },
  globallyPublishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Marketplace fields
  isPublishedToMarketplace: {
    type: Boolean,
    default: false
  },
  marketplacePrice: {
    type: Number,
    default: 0,
    min: 0
  },
  marketplaceStatus: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'DRAFT'
  },
  publishedByPlatformAdmin: {
    type: Boolean,
    default: false
  },
  // Academic fields for COLLEGE
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  semester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  course_credits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for organization isolation and search
courseSchema.index({ organization_id: 1, status: 1 });
courseSchema.index({ organization_id: 1, title: 1 }, { unique: true });
courseSchema.index({ status: 1, isPublic: 1, isActive: 1 });
courseSchema.index({ isGloballyPublished: 1, status: 1, isActive: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ instructor_id: 1 });

// Text index for search functionality
courseSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Query middleware to exclude soft-deleted courses by default
courseSchema.pre(/^find/, function (next) {
  // Only apply if not explicitly including deleted
  if (!this.getOptions().includeDeleted) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

// Instance method to soft delete
courseSchema.methods.softDelete = function (userId) {
  this.is_deleted = true;
  this.status = 'archived';
  this.deleted_at = new Date();
  this.deleted_by = userId;
  return this.save();
};

// Instance method to restore
courseSchema.methods.restore = function () {
  this.is_deleted = false;
  this.status = 'draft';
  this.deleted_at = null;
  this.deleted_by = null;
  return this.save();
};

// Virtual for total lessons count
courseSchema.virtual('totalLessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course_id',
  count: true
});

// Virtual for total sections count
courseSchema.virtual('totalSections', {
  ref: 'Section',
  localField: '_id',
  foreignField: 'course_id',
  count: true
});

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

// Pre-save validation for duplicate titles within organization
courseSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('title')) {
    const existingCourse = await this.constructor.findOne({
      organization_id: this.organization_id,
      title: this.title,
      _id: { $ne: this._id }
    });

    if (existingCourse) {
      const error = new Error('Course title already exists in this organization');
      error.code = 'DUPLICATE_TITLE';
      return next(error);
    }
  }
  next();
});

// Method to check if user can access this course
courseSchema.methods.canUserAccess = function (user) {
  // Platform admin can access everything
  if (user.role === 'platform_admin') {
    return true;
  }

  // Organization members can access their org courses
  const userOrgId = user.organization_id?._id || user.organization_id;
  const courseOrgId = this.organization_id?._id || this.organization_id;

  if (userOrgId && courseOrgId && userOrgId.toString() === courseOrgId.toString()) {
    return true;
  }

  // Students can access if enrolled in the organization
  if (user.role === 'student' && user.enrolledOrganizations) {
    return user.enrolledOrganizations.some(
      enrollment => enrollment.organizationId.toString() === this.organization_id.toString()
    );
  }

  // Public courses are accessible to everyone
  return this.isPublic && this.status === 'published';
};

module.exports = mongoose.model('Course', courseSchema);