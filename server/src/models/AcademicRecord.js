const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema({
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
    semester_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true,
        index: true
    },
    internal_marks: {
        type: Number,
        default: 0,
        min: 0
    },
    exam_marks: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        default: 0
    },
    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'F', 'I', 'W'],
        default: 'I'
    },
    gpa_points: {
        type: Number,
        default: 0.0
    },
    credits: {
        type: Number,
        default: 0
    },
    is_finalized: {
        type: Boolean,
        default: false
    },
    finalized_at: Date,
    finalized_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Calculate total and grade before saving
academicRecordSchema.pre('save', function (next) {
    this.total = this.internal_marks + this.exam_marks;

    // Basic grade calculation based on percentage (assuming 100 max for demonstration)
    // In a real scenario, this would depend on the course's max marks
    const percentage = this.total; // Simplified for now

    if (percentage >= 90) { this.grade = 'A'; this.gpa_points = 4.0; }
    else if (percentage >= 80) { this.grade = 'B'; this.gpa_points = 3.0; }
    else if (percentage >= 70) { this.grade = 'C'; this.gpa_points = 2.0; }
    else if (percentage >= 60) { this.grade = 'D'; this.gpa_points = 1.0; }
    else { this.grade = 'F'; this.gpa_points = 0.0; }

    next();
});

// Ensure unique record per student per course per semester
academicRecordSchema.index({ student_id: 1, course_id: 1, semester_id: 1 }, { unique: true });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
