const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
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
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        required: true
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: Number,
        required: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    credits: {
        type: Number,
        default: 3,
        min: 1,
        max: 10
    },
    contentCourseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

subjectSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
