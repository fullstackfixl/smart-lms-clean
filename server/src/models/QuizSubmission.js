const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    answers: [{
        questionIndex: Number,
        selectedOption: Number,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        required: true,
        min: 0
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 0
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    attemptNumber: {
        type: Number,
        required: true,
        min: 1
    },
    passed: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    gradedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for finding student's attempts for a specific quiz
quizSubmissionSchema.index({ quizId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });

// Index for instructor board
quizSubmissionSchema.index({ instructorId: 1, organizationId: 1, submittedAt: -1 });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);
