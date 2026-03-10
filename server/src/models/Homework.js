const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GradeLevel',
    required: true,
    index: true
  },
  section_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GradeSection',
    required: true
  },
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  dueDate: {
    type: Date,
    required: true
  },
  attachments: [String],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'assigned', 'closed'],
    default: 'assigned'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Homework', homeworkSchema);
