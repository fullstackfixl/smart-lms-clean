const mongoose = require('mongoose');

const meetingAttendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveClass',
        required: true,
        index: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    joinTime: {
        type: Date,
        required: true
    },
    leaveTime: {
        type: Date
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'absent'
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate duration and status before saving
meetingAttendanceSchema.pre('save', async function (next) {
    if (this.joinTime && this.leaveTime) {
        this.duration = Math.round((this.leaveTime - this.joinTime) / (1000 * 60));
    }
    next();
});

// Compound index for unique student-class record
meetingAttendanceSchema.index({ studentId: 1, classId: 1 }, { unique: true });

const MeetingAttendance = mongoose.model('MeetingAttendance', meetingAttendanceSchema);

module.exports = MeetingAttendance;
