const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true, // e.g., "2023-2024"
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isCurrent: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'upcoming'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Ensure only one current academic year per organization
academicYearSchema.pre('save', async function (next) {
    if (this.isCurrent) {
        await this.constructor.updateMany(
            { organization_id: this.organization_id, _id: { $ne: this._id } },
            { $set: { isCurrent: false } }
        );
    }
    next();
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);
