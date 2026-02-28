const mongoose = require('mongoose');

const organizationEventSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    type: {
        type: String,
        enum: [
            'NEW_COURSE',
            'NEW_QUIZ',
            'QUIZ_PUBLISHED',
            'NEW_STUDENT',
            'NEW_INSTRUCTOR',
            'LIVE_CLASS_SCHEDULED'
        ],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Index for efficient dashboard queries
organizationEventSchema.index({ organizationId: 1, createdAt: -1 });

const OrganizationEvent = mongoose.model('OrganizationEvent', organizationEventSchema);

module.exports = OrganizationEvent;
