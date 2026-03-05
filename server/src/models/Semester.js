const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true, // e.g., "Fall 2024", "Semester 1"
        trim: true
    },
    startDate: Date,
    endDate: Date,
    number: {
        type: Number,
        required: true,
        default: 1
    },
    isCurrent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Semester', semesterSchema);
