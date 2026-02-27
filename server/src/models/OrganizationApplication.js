const mongoose = require('mongoose');

const organizationApplicationSchema = new mongoose.Schema({
    organization_name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    subdomain: {
        type: String,
        required: [true, 'Subdomain is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    admin_name: {
        type: String,
        required: [true, 'Admin name is required'],
        trim: true
    },
    admin_email: {
        type: String,
        required: [true, 'Admin email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    selected_plan: {
        type: String,
        enum: ['basic', 'pro', 'enterprise'],
        required: true
    },
    organization_type: {
        type: String,
        enum: ['SCHOOL', 'COLLEGE', 'INSTITUTE', 'ONLINE_ACADEMY'],
        required: [true, 'Organization type is required']
    },
    modulesEnabled: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
organizationApplicationSchema.index({ subdomain: 1 }, { unique: true });
organizationApplicationSchema.index({ admin_email: 1 });
organizationApplicationSchema.index({ status: 1 });

module.exports = mongoose.model('OrganizationApplication', organizationApplicationSchema);
