const mongoose = require('mongoose');

const orgTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Organization type is required'],
        enum: ['School', 'College', 'Institute', 'Online Academy', 'Coaching'],
        unique: true
    },
    modulesEnabled: [{
        type: String,
        trim: true
    }],
    defaultRoles: [{
        type: String,
        trim: true
    }],
    dashboardConfig: {
        widgets: [{ type: String }],
        sidebarItems: [{ type: String }]
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

orgTemplateSchema.index({ type: 1 }, { unique: true });

module.exports = mongoose.model('OrgTemplate', orgTemplateSchema);
