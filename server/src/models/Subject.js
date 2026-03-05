const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
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
    department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    semester_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester'
    },
    credits: {
        type: Number,
        default: 0
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

subjectSchema.index({ organization_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
