const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['SCHOOL', 'COLLEGE', 'INSTITUTE', 'ONLINE_ACADEMY', 'CORPORATE', 'school', 'college', 'institute', 'corporate'],
    required: [true, 'Organization type is required'],
    set: function(v) { return v.toLowerCase(); }
  },
  organizationType: {
    type: String,
    enum: ['school', 'college', 'institute', 'corporate'],
    required: false
  },
  modulesEnabled: [{
    type: String,
    trim: true
  }],
  templateVersion: {
    type: String,
    default: 'v1'
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  plan: {
    type: String,
    enum: {
      values: ['free', 'basic', 'premium', 'pro', 'enterprise'],
      message: 'Plan must be free, basic, premium, pro, or enterprise'
    },
    default: 'free'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, 'Contact email is required']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'suspended', 'deleted', 'pending'],
      message: 'Status must be active, suspended, deleted, or pending'
    },
    default: 'active'
  },
  code: {
    type: String,
    uppercase: true,
    trim: true,
    unique: true
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true
  },
  emailDomains: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  is_deleted: {
    type: Boolean,
    default: false,
    select: false
  },
  deleted_at: {
    type: Date,
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  description: {
    type: String,
    trim: true
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
      default: function () {
        if (this.plan === 'enterprise') return 10000;
        if (this.plan === 'pro') return 1000;
        if (this.plan === 'basic') return 100;
        return 50; // free
      }
    },
    max_courses: {
      type: Number,
      default: function () {
        if (this.plan === 'enterprise') return 1000;
        if (this.plan === 'pro') return 100;
        if (this.plan === 'basic') return 20;
        return 5; // free
      }
    },
    max_students: {
      type: Number,
      default: function () {
        if (this.plan === 'enterprise') return 10000;
        if (this.plan === 'pro') return 1000;
        if (this.plan === 'basic') return 200;
        return 50; // free
      }
    },
    max_instructors: {
      type: Number,
      default: function () {
        if (this.plan === 'enterprise') return 500;
        if (this.plan === 'pro') return 50;
        if (this.plan === 'basic') return 10;
        return 2; // free
      }
    }
  },
  // Usage tracking
  usage: {
    current_users: { type: Number, default: 0 },
    current_courses: { type: Number, default: 0 }
  },
  settings: {
    require_email_verification: { type: Boolean, default: true },
    require_phone_verification: { type: Boolean, default: false },
    mfa_required: { type: Boolean, default: false },
    allow_public_registration: { type: Boolean, default: true }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
organizationSchema.index({ status: 1 });
organizationSchema.index({ is_deleted: 1 });

// Virtual alias for organization_code to match API
organizationSchema.virtual('organization_code')
  .get(function () {
    return this.code;
  })
  .set(function (val) {
    this.code = (val || '').toString().toUpperCase().trim();
  });

// Pre-save middleware to generate code and slug if missing
organizationSchema.pre('save', async function (next) {
  if (this.isNew || !this.code || !this.slug) {
    if (!this.code) {
      const words = this.name.split(' ');
      let code = words.length > 1
        ? words.map(w => w[0]).join('').toUpperCase()
        : this.name.substring(0, 3).toUpperCase();

      // Add random suffix to ensure uniqueness
      code = `${code}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      this.code = code;
    }

    if (!this.slug) {
      this.slug = this.subdomain || this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  }
  next();
});

// Query middleware to exclude soft-deleted documents
organizationSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

// Instance methods
organizationSchema.methods.softDelete = function (userId) {
  this.is_deleted = true;
  this.deleted_at = new Date();
  this.deleted_by = userId;
  this.status = 'deleted';
  return this.save();
};

organizationSchema.methods.restore = function () {
  this.is_deleted = false;
  this.deleted_at = null;
  this.deleted_by = null;
  this.status = 'active';
  return this.save();
};

// Virtual for user count
organizationSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization_id',
  count: true
});

module.exports = mongoose.model('Organization', organizationSchema);
