const mongoose = require('mongoose');

const studentCourseEnrollmentSchema = new mongoose.Schema({
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
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program', // Linked to Program model
        required: true,
        index: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Alias for organizationId for legacy compat if needed via virtuals
studentCourseEnrollmentSchema.virtual('organization_id').get(function () { return this.organizationId; });
studentCourseEnrollmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StudentCourseEnrollment', studentCourseEnrollmentSchema);
