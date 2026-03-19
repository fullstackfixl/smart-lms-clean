const mongoose = require('mongoose');

const academicEnrollmentSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicProgram',
    required: true,
    index: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
    index: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  }
}, {
  timestamps: true
});

academicEnrollmentSchema.index(
  { organizationId: 1, studentId: 1, batchId: 1, subjectId: 1 },
  { unique: true }
);

module.exports = mongoose.model('AcademicEnrollment', academicEnrollmentSchema);
