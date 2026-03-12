const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    organizationId: {
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
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        index: true
    },
    year: {
        type: Number,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    startDate: Date,
    endDate: Date,
    instructorIds: [{
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

batchSchema.index({ organizationId: 1, code: 1 }, { unique: true });
batchSchema.index({ programId: 1, year: 1, semester: 1 });

module.exports = mongoose.model('Batch', batchSchema);
