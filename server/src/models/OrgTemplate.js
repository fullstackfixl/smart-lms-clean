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
        enum: ['SCHOOL', 'COLLEGE', 'INSTITUTE', 'ONLINE_ACADEMY', 'COACHING'],
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


module.exports = mongoose.model('OrgTemplate', orgTemplateSchema);
