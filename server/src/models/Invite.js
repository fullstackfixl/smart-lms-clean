const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['instructor', 'support_staff', 'org_admin', 'student'],
        required: true
    },
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expires_at: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Index for expiring tokens
inviteSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
inviteSchema.index({ email: 1, organization_id: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
