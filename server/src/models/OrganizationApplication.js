const mongoose = require('mongoose');

const organizationApplicationSchema = new mongoose.Schema({
    // Required fields from /apply form
    organization_name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    organization_type: {
        type: String,
        enum: ['college', 'school', 'institute', 'corporate'],
        required: [true, 'Organization type is required']
    },
    contact_person_name: {
        type: String,
        required: [true, 'Contact person name is required'],
        trim: true
    },
    contact_email: {
        type: String,
        required: [true, 'Contact email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    contact_phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    expected_users: {
        type: Number,
        required: [true, 'Expected users is required'],
        min: [1, 'Expected users must be at least 1']
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },
    // Legacy fields for backward compatibility
    subdomain: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        sparse: true
    },
    admin_name: {
        type: String,
        trim: true
    },
    admin_email: {
        type: String,
        trim: true,
        lowercase: true
    },
    selected_plan: {
        type: String,
        enum: ['basic', 'pro', 'enterprise'],
        default: 'basic'
    },
    modulesEnabled: [{
        type: String,
        trim: true
    }],
    // Status lifecycle: pending -> contacted -> approved -> account_created -> active
    // OR: pending -> contacted -> rejected
    status: {
        type: String,
        enum: ['pending', 'contacted', 'approved', 'account_created', 'active', 'rejected'],
        default: 'pending'
    },
    // Staff assignment
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Staff follow-up fields
    contact_notes: {
        type: String,
        trim: true,
        default: ''
    },
    follow_up_date: {
        type: Date,
        default: null
    },
    // Admin approval fields
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approved_at: {
        type: Date,
        default: null
    },
    rejection_reason: {
        type: String,
        trim: true,
        default: ''
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
organizationApplicationSchema.index({ contact_email: 1 });
organizationApplicationSchema.index({ status: 1 });
organizationApplicationSchema.index({ assigned_to: 1 });

module.exports = mongoose.model('OrganizationApplication', organizationApplicationSchema);
