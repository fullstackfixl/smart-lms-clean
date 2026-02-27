const mongoose = require('mongoose');

const gradeSectionSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    grade_level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeLevel',
        required: true,
        index: true
    },
    name: {
        type: String, // e.g., Section A, Blue House
        required: true,
        trim: true
    },
    room_number: String,
    capacity: {
        type: Number,
        min: 1
    },
    class_teacher_id: {
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

gradeSectionSchema.index({ organization_id: 1, grade_level_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('GradeSection', gradeSectionSchema);
