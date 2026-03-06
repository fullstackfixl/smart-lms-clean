const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        required: true
    },
    path: {
        type: String,
        required: true
    },
    target: {
        type: String,
        default: null
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    ip: {
        type: String,
        default: null
    },
    statusCode: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

adminLogSchema.index({ userId: 1 });
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
