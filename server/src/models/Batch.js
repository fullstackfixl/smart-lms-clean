const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
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
    startDate: Date,
    endDate: Date,
    instructor_ids: [{
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

batchSchema.index({ organization_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
