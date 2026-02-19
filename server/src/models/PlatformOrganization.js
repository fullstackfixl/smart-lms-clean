const mongoose = require('mongoose');

/**
 * Platform Organization Schema
 * For platform admin management of organizations
 */
const platformOrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Organization email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  plan: {
    type: String,
    enum: {
      values: ['basic', 'premium'],
      message: 'Plan must be either basic or premium'
    },
    default: 'basic'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'suspended'],
      message: 'Status must be either active or suspended'
    },
    default: 'active'
  },
  is_deleted: {
    type: Boolean,
    default: false,
    select: false // Don't include in queries by default
  },
  deleted_at: {
    type: Date,
    default: null,
    select: false
  },
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false
  },
  // Additional metadata
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    uppercase: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true
  },
  logo_url: {
    type: String,
    trim: true
  },
  admin_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Plan limits
  limits: {
    max_users: {
      type: Number,
      default: function() {
        return this.plan === 'premium' ? 1000 : 100;
      }
    },
    max_courses: {
      type: Number,
      default: function() {
        return this.plan === 'premium' ? 500 : 50;
      }
    },
    max_storage_gb: {
      type: Number,
      default: function() {
        return this.plan === 'premium' ? 100 : 10;
      }
    }
  },
  // Usage tracking
  usage: {
    current_users: { type: Number, default: 0 },
    current_courses: { type: Number, default: 0 },
    current_storage_gb: { type: Number, default: 0 }
  },
  // Settings
  settings: {
    require_email_verification: { type: Boolean, default: true },
    require_phone_verification: { type: Boolean, default: false },
    mfa_required: { type: Boolean, default: false },
    allow_public_courses: { type: Boolean, default: false }
  },
  // Billing
  billing: {
    subscription_start: { type: Date },
    subscription_end: { type: Date },
    last_payment_date: { type: Date },
    next_payment_date: { type: Date },
    payment_method: { type: String }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
platformOrganizationSchema.index({ email: 1 }, { unique: true });
platformOrganizationSchema.index({ slug: 1 }, { unique: true, sparse: true });
platformOrganizationSchema.index({ code: 1 }, { unique: true, sparse: true });
platformOrganizationSchema.index({ status: 1 });
platformOrganizationSchema.index({ plan: 1 });
platformOrganizationSchema.index({ is_deleted: 1 });
platformOrganizationSchema.index({ created_at: -1 });

// Virtual for full address
platformOrganizationSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode,
    this.address.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for user count
platformOrganizationSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization_id',
  count: true
});

// Pre-save middleware to generate slug and code
platformOrganizationSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    // Generate slug from name
    if (!this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Ensure uniqueness
      let slugExists = await this.constructor.findOne({ slug: this.slug });
      let counter = 1;
      while (slugExists) {
        this.slug = `${this.slug}-${counter}`;
        slugExists = await this.constructor.findOne({ slug: this.slug });
        counter++;
      }
    }
    
    // Generate code from name
    if (!this.code) {
      const words = this.name.split(' ');
      let code = words.length > 1 
        ? words.map(w => w[0]).join('').toUpperCase()
        : this.name.substring(0, 3).toUpperCase();
      
      // Ensure uniqueness
      let codeExists = await this.constructor.findOne({ code });
      let counter = 1;
      while (codeExists) {
        code = `${code}${counter}`;
        codeExists = await this.constructor.findOne({ code });
        counter++;
      }
      this.code = code;
    }
  }
  next();
});

// Query middleware to exclude soft-deleted documents
platformOrganizationSchema.pre(/^find/, function(next) {
  // Only apply if not explicitly including deleted
  if (!this.getOptions().includeDeleted) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

// Instance method to soft delete
platformOrganizationSchema.methods.softDelete = function(userId) {
  this.is_deleted = true;
  this.deleted_at = new Date();
  this.deleted_by = userId;
  this.status = 'suspended';
  return this.save();
};

// Instance method to restore
platformOrganizationSchema.methods.restore = function() {
  this.is_deleted = false;
  this.deleted_at = null;
  this.deleted_by = null;
  return this.save();
};

// Instance method to check if within limits
platformOrganizationSchema.methods.isWithinLimits = function() {
  return {
    users: this.usage.current_users < this.limits.max_users,
    courses: this.usage.current_courses < this.limits.max_courses,
    storage: this.usage.current_storage_gb < this.limits.max_storage_gb
  };
};

// Static method to get active organizations
platformOrganizationSchema.statics.getActive = function() {
  return this.find({ status: 'active', is_deleted: false });
};

// Static method to get suspended organizations
platformOrganizationSchema.statics.getSuspended = function() {
  return this.find({ status: 'suspended', is_deleted: false });
};

module.exports = mongoose.model('PlatformOrganization', platformOrganizationSchema);
