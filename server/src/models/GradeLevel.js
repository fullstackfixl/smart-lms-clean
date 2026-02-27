const mongoose = require('mongoose');

const gradeLevelSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    name: {
        type: String, // e.g., Grade 1, Grade 10, Year 1
        required: true,
        trim: true
    },
    code: {
        type: String, // e.g., G1, G10
        required: true,
        trim: true
    },
    description: String,
    order: {
        type: Number,
        required: true,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

gradeLevelSchema.index({ organization_id: 1, code: 1 }, { unique: true });
gradeLevelSchema.index({ organization_id: 1, order: 1 });

module.exports = mongoose.model('GradeLevel', gradeLevelSchema);
