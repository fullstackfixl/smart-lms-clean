const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    organizationType: {
        type: String,
        enum: ['college', 'school', 'coaching', 'corporate', 'university'],
        default: 'college',
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    location: {
        type: String,
        trim: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        index: true
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        index: true
    },
    eventType: {
        type: String,
        enum: ['academic', 'cultural', 'sports', 'seminar', 'workshop', 'exam', 'holiday', 'other'],
        default: 'other'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

eventSchema.index({ organization_id: 1, date: -1 });
eventSchema.index({ departmentId: 1, date: -1 });

module.exports = mongoose.model('CollegeEvent', eventSchema);
