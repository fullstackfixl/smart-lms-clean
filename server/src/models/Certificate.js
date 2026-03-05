const mongoose = require('mongoose');
const crypto = require('crypto');

// Generate UUID v4 compatible string
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const certificateSchema = new mongoose.Schema({
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
  enrollment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
    index: true
  },
  certificate_id: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      return `CERT-${Date.now()}-${generateUUID().substring(0, 8).toUpperCase()}`;
    }
  },
  student_name: {
    type: String,
    required: true,
    trim: true
  },
  course_title: {
    type: String,
    required: true,
    trim: true
  },
  instructor_name: {
    type: String,
    required: true,
    trim: true
  },
  organization_name: {
    type: String,
    required: true,
    trim: true
  },
  completion_date: {
    type: Date,
    required: true
  },
  issued_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  course_duration_hours: {
    type: Number,
    min: 0
  },
  final_grade_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  total_lessons_completed: {
    type: Number,
    required: true,
    min: 0
  },
  total_quizzes_passed: {
    type: Number,
    required: true,
    min: 0
  },
  pdf_file_path: {
    type: String,
    trim: true
  },
  pdf_file_url: {
    type: String,
    trim: true
  },
  pdf_generated: {
    type: Boolean,
    default: false
  },
  pdf_generation_error: {
    type: String,
    trim: true
  },
  verification_code: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      return `VER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  metadata: {
    course_category: String,
    course_level: String,
    organization_logo_url: String,
    instructor_signature_url: String,
    additional_notes: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
certificateSchema.index({ organization_id: 1, student_id: 1 });
certificateSchema.index({ student_id: 1, issued_date: -1 });
certificateSchema.index({ course_id: 1, issued_date: -1 });
certificateSchema.index({ certificate_id: 1, verification_code: 1 });

// Unique constraint to prevent duplicate certificates
certificateSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

// Virtual for certificate display name
certificateSchema.virtual('display_name').get(function () {
  return `Certificate of Completion - ${this.course_title}`;
});

// Virtual for certificate validity period (certificates are valid for 2 years)
certificateSchema.virtual('expires_at').get(function () {
  const expiryDate = new Date(this.issued_date);
  expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  return expiryDate;
});

// Virtual for certificate status
certificateSchema.virtual('status').get(function () {
  if (!this.is_active) return 'revoked';
  if (!this.pdf_generated) return 'pending';
  if (this.pdf_generation_error) return 'error';
  if (new Date() > this.expires_at) return 'expired';
  return 'valid';
});

// Instance method to check if user can access certificate
certificateSchema.methods.canUserAccess = function (user) {
  // Check if user belongs to same organization
  if (this.organization_id.toString() !== user.organization_id.toString()) {
    return { canAccess: false, reason: 'organization_mismatch' };
  }

  // Check if user is the certificate owner
  if (this.student_id.toString() === user._id.toString()) {
    return { canAccess: true, reason: 'certificate_owner' };
  }

  // Check if user is admin
  if (user.role === 'org_admin') {
    return { canAccess: true, reason: 'admin_access' };
  }

  // Check if user is the course instructor
  if (user.role === 'instructor') {
    return { canAccess: true, reason: 'instructor_access' };
  }

  return { canAccess: false, reason: 'access_denied' };
};

// Instance method to generate certificate data for PDF
certificateSchema.methods.getCertificateData = function () {
  return {
    certificate_id: this.certificate_id,
    verification_code: this.verification_code,
    student_name: this.student_name,
    course_title: this.course_title,
    instructor_name: this.instructor_name,
    organization_name: this.organization_name,
    completion_date: this.completion_date,
    issued_date: this.issued_date,
    course_duration_hours: this.course_duration_hours,
    final_grade_percentage: this.final_grade_percentage,
    total_lessons_completed: this.total_lessons_completed,
    total_quizzes_passed: this.total_quizzes_passed,
    metadata: this.metadata
  };
};

// Instance method to mark PDF as generated
certificateSchema.methods.markPdfGenerated = function (filePath, fileUrl) {
  this.pdf_file_path = filePath;
  this.pdf_file_url = fileUrl;
  this.pdf_generated = true;
  this.pdf_generation_error = null;
  return this.save();
};

// Instance method to mark PDF generation as failed
certificateSchema.methods.markPdfGenerationFailed = function (error) {
  this.pdf_generated = false;
  this.pdf_generation_error = error;
  return this.save();
};

// Static method to find certificates by student with organization isolation
certificateSchema.statics.findByStudent = function (studentId, organizationId, options = {}) {
  const query = {
    student_id: studentId,
    organization_id: organizationId,
    is_active: true
  };

  return this.find(query, null, options).sort({ issued_date: -1 });
};

// Static method to find certificates by course with organization isolation
certificateSchema.statics.findByCourse = function (courseId, organizationId, options = {}) {
  const query = {
    course_id: courseId,
    organization_id: organizationId,
    is_active: true
  };

  return this.find(query, null, options).sort({ issued_date: -1 });
};

// Static method to verify certificate authenticity
certificateSchema.statics.verifyCertificate = function (certificateId, verificationCode) {
  return this.findOne({
    certificate_id: certificateId,
    verification_code: verificationCode,
    is_active: true
  });
};

// Static method to get certificate statistics for organization
certificateSchema.statics.getOrganizationStats = async function (organizationId) {
  const stats = await this.aggregate([
    {
      $match: {
        organization_id: new mongoose.Types.ObjectId(organizationId),
        is_active: true
      }
    },
    {
      $group: {
        _id: null,
        total_certificates: { $sum: 1 },
        certificates_this_month: {
          $sum: {
            $cond: [
              {
                $gte: ['$issued_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1)]
              },
              1,
              0
            ]
          }
        },
        avg_grade: { $avg: '$final_grade_percentage' },
        unique_students: { $addToSet: '$student_id' },
        unique_courses: { $addToSet: '$course_id' }
      }
    },
    {
      $project: {
        total_certificates: 1,
        certificates_this_month: 1,
        avg_grade: { $round: ['$avg_grade', 2] },
        unique_students_count: { $size: '$unique_students' },
        unique_courses_count: { $size: '$unique_courses' }
      }
    }
  ]);

  return stats[0] || {
    total_certificates: 0,
    certificates_this_month: 0,
    avg_grade: 0,
    unique_students_count: 0,
    unique_courses_count: 0
  };
};

// Pre-save middleware to validate organization consistency
certificateSchema.pre('save', async function (next) {
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

      // Verify enrollment exists and belongs to same organization
      const Enrollment = mongoose.model('Enrollment');
      const enrollment = await Enrollment.findById(this.enrollment_id);

      if (!enrollment) {
        return next(new Error('Enrollment not found'));
      }

      if (enrollment.organization_id.toString() !== this.organization_id.toString()) {
        return next(new Error('Enrollment must belong to the same organization'));
      }

      // Verify enrollment matches student and course
      if (enrollment.student_id.toString() !== this.student_id.toString() ||
        enrollment.course_id.toString() !== this.course_id.toString()) {
        return next(new Error('Enrollment must match student and course'));
      }

    } catch (error) {
      return next(error);
    }
  }

  next();
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;