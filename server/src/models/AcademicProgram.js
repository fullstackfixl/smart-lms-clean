const mongoose = require('mongoose');

const academicProgramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  durationUnit: {
    type: String,
    enum: ['years', 'semesters'],
    default: 'years'
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  organizationType: {
    type: String,
    default: 'college'
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for uniqueness within organization
academicProgramSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('AcademicProgram', academicProgramSchema);
