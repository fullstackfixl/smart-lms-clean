const mongoose = require('mongoose');

const applicationNoteSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Note cannot exceed 2000 characters']
    },
    type: {
        type: String,
        enum: ['note', 'call', 'email', 'follow_up', 'status_change'],
        default: 'note'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    created_by_role: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const applicationActivitySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    created_by_role: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const organizationApplicationSchema = new mongoose.Schema({
    // Required fields from /apply form
    organization_name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true,
        alias: 'orgName',
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
        trim: true,
        alias: 'contactPerson'
    },
    contact_email: {
        type: String,
        required: [true, 'Contact email is required'],
        trim: true,
        lowercase: true,
        alias: 'email',
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    contact_phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
        alias: 'phone'
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
    // Status lifecycle: pending -> contacted -> negotiation -> ready_for_approval -> approved/rejected
    status: {
        type: String,
        enum: ['pending', 'contacted', 'negotiation', 'ready_for_approval', 'approved', 'rejected', 'account_created', 'active'],
        default: 'pending'
    },
    // Staff assignment
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        alias: 'assignedTo'
    },
    assigned_at: {
        type: Date,
        default: null
    },
    priority: {
        type: String,
        enum: ['hot', 'warm', 'cold'],
        default: 'warm'
    },
    // Staff follow-up fields
    contact_notes: {
        type: String,
        trim: true,
        default: ''
    },
    follow_up_date: {
        type: Date,
        default: null,
        alias: 'followUpAt'
    },
    notes: {
        type: [applicationNoteSchema],
        default: []
    },
    activityLog: {
        type: [applicationActivitySchema],
        default: []
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
organizationApplicationSchema.index({ priority: 1 });
organizationApplicationSchema.index({ follow_up_date: 1 });

module.exports = mongoose.model('OrganizationApplication', organizationApplicationSchema);
