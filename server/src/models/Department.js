const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
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
    description: String,
    headInstructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

departmentSchema.index({ organization_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
