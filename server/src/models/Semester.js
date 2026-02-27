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
    academic_year_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },
    startDate: Date,
    endDate: Date,
    isCurrent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Semester', semesterSchema);
