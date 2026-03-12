const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
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
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  room: {
    type: String,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  organizationType: {
    type: String,
    default: 'college'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
timetableSchema.index({ organizationId: 1, batchId: 1, day: 1 });
timetableSchema.index({ instructorId: 1, day: 1 });
timetableSchema.index({ programId: 1, batchId: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
