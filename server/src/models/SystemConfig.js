const mongoose = require('mongoose');

/**
 * System Configuration Schema
 * Stores global platform-wide settings
 */
const systemConfigSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    platformName: {
        type: String,
        default: 'Smart LMS'
    },
    supportEmail: {
        type: String,
        default: 'support@smartlms.com'
    },
    defaultPlan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'pro', 'enterprise'],
        default: 'free'
    },
    registrationEnabled: {
        type: Boolean,
        default: true
    },
    emailVerificationRequired: {
        type: Boolean,
        default: true
    },
    maxOrganizations: {
        type: Number,
        default: null // null means unlimited
    },
    features: {
        liveClasses: { type: Boolean, default: true },
        assessments: { type: Boolean, default: true },
        certificates: { type: Boolean, default: true },
        gamification: { type: Boolean, default: true },
        aiTools: { type: Boolean, default: true }
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Ensure only one config document exists
systemConfigSchema.statics.getOrCreate = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
