const mongoose = require('mongoose');

const instructorAssignmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
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
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

instructorAssignmentSchema.index(
  { organizationId: 1, batchId: 1, subjectId: 1 },
  { unique: true }
);

instructorAssignmentSchema.index({ organizationId: 1, instructorId: 1, isActive: 1 });

module.exports = mongoose.model('InstructorAssignment', instructorAssignmentSchema);
