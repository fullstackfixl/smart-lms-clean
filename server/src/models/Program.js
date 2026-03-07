const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
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
    duration_years: {
        type: Number,
        required: true,
        default: 3
    },
    total_semesters: {
        type: Number,
        required: true,
        default: 6
    },
    description: String,
    status: {
        type: String,
        enum: ['ACTIVE', 'DRAFT'],
        default: 'ACTIVE'
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

programSchema.index({ organization_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Program', programSchema);
