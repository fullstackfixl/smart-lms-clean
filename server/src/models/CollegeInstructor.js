const mongoose = require('mongoose');

const collegeInstructorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  department: { type: String, trim: true },
  profilePhoto: { type: String, trim: true },
  bio: { type: String, trim: true },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  organizationType: {
    type: String,
    required: true,
    enum: ['college'],
    default: 'college',
    index: true
  },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  studentsCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
    index: true
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

collegeInstructorSchema.index({ organizationId: 1, email: 1 });

module.exports = mongoose.model('CollegeInstructor', collegeInstructorSchema);
