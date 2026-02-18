const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  emailDomains: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active',
    index: true
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deleted_at: {
    type: Date
  },
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  address: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  logo_url: {
    type: String
  },
  admin_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  admin_count: {
    type: Number,
    default: 0
  },
  user_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  settings: {
    require_email_verification: {
      type: Boolean,
      default: true
    },
    require_phone_verification: {
      type: Boolean,
      default: false
    },
    mfa_required: {
      type: Boolean,
      default: false
    },
    max_users: {
      type: Number
    },
    features: [{
      type: String
    }]
  }
});

// Indexes
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ status: 1 });
organizationSchema.index({ is_deleted: 1 });
organizationSchema.index({ is_deleted: 1, status: 1 });

// Query middleware to exclude soft-deleted organizations by default
organizationSchema.pre(/^find/, function(next) {
  // Only apply if not explicitly including deleted
  if (!this.getOptions().includeDeleted) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

// Instance method to soft delete
organizationSchema.methods.softDelete = function(userId) {
  this.is_deleted = true;
  this.status = 'deleted';
  this.isActive = false;
  this.deleted_at = new Date();
  this.deleted_by = userId;
  return this.save();
};

// Instance method to restore
organizationSchema.methods.restore = function() {
  this.is_deleted = false;
  this.status = 'active';
  this.isActive = true;
  this.deleted_at = null;
  this.deleted_by = null;
  return this.save();
};

// Instance method to suspend
organizationSchema.methods.suspend = function() {
  this.status = 'suspended';
  this.isActive = false;
  return this.save();
};

// Instance method to activate
organizationSchema.methods.activate = function() {
  this.status = 'active';
  this.isActive = true;
  return this.save();
};

// Update updated_at timestamp before saving
organizationSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Virtual for user count
organizationSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization_id',
  count: true
});

module.exports = mongoose.model('Organization', organizationSchema);