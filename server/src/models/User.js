const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { log } = require('handlebars');

const userSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function () {
      return this.role !== 'platform_admin' && this.role !== 'platformAdmin' && this.role !== 'student';
    }
  },
  organization_code: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: false,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['platform_admin', 'org_admin', 'instructor', 'student', 'parent', 'support_staff'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending', 'inactive'],
    default: 'active',
    required: true
  },
  parent_link: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  profile: {
    phone: {
      type: String
    },
    dob: {
      type: Date
    },
    address: {
      type: String
    },
    pic_url: {
      type: String
    },
    class_grade: {
      type: String
    },
    expertise: {
      type: String
    },
    bio: {
      type: String,
      maxlength: 500
    },
    department: {
      type: String
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  phone_verified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date
  },
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mfa_enabled: {
    type: Boolean,
    default: false
  },
  mfa_secret: {
    type: String,
    select: false // Don't include in queries by default
  },
  mfa_backup_codes: {
    type: [String],
    select: false // Don't include in queries by default
  },
  inviteToken: {
    type: String,
    select: false
  },
  inviteTokenExpiry: {
    type: Date,
    select: false
  },
  // Multi-tenant fields (hydrated by middleware or virtual)
  modulesEnabled: [{
    type: String
  }],
  organizationType: {
    type: String
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
// For platform admins (no organization), email must be unique
// For org users, email + organization_id must be unique
userSchema.index({ email: 1 }, {
  unique: true,
  partialFilterExpression: { organization_id: { $eq: null } }
});
userSchema.index({ email: 1, organization_id: 1 }, {
  unique: true,
  partialFilterExpression: { organization_id: { $ne: null } }
});
userSchema.index({ role: 1 });
userSchema.index({ organization_id: 1 });
userSchema.index({ is_deleted: 1 });
userSchema.index({ isActive: 1 });

// Query middleware to exclude soft-deleted records by default
userSchema.pre(/^find/, function (next) {
  // Only apply if not explicitly including deleted
  if (!this.getOptions().includeDeleted) {
    this.where({ is_deleted: { $ne: true } });
  }
  next();
});

// Instance method to soft delete
userSchema.methods.softDelete = function (userId) {
  this.is_deleted = true;
  this.isActive = false;
  this.deleted_at = new Date();
  this.deleted_by = userId;
  return this.save();
};

// Instance method to restore
userSchema.methods.restore = function () {
  this.is_deleted = false;
  this.isActive = true;
  this.deleted_at = null;
  this.deleted_by = null;
  return this.save();
};


// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();

  try {
    // Check if password is already hashed or if it's empty/null
    if (!this.password_hash) {
      return next();
    }

    if (this.password_hash.match(/^\$2[aby]\$/)) {
      // Password is already hashed, skip hashing
      return next();
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Get public user data (exclude sensitive fields)
userSchema.methods.toPublicJSON = function () {
  const userObj = {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    organization_id: this.organization_id?._id || this.organization_id,
    organization_code: this.organization_code,
    profile: this.profile,
    preferences: this.preferences,
    email_verified: this.email_verified,
    phone_verified: this.phone_verified,
    created_at: this.created_at,
    updated_at: this.updated_at
  };

  // Include organization-specific fields if populated
  if (this.organization_id && typeof this.organization_id === 'object') {
    userObj.modulesEnabled = this.organization_id.modulesEnabled;
    userObj.organizationType = this.organization_id.type;
  } else if (this.modulesEnabled) {
    // Fallback if modulesEnabled was attached but org not populated
    userObj.modulesEnabled = this.modulesEnabled;
  }

  return userObj;
};

// Check if user is parent of another user
userSchema.methods.isParentOf = function (studentId) {
  return this.parent_link.some(
    childId => childId.toString() === studentId.toString()
  );
};

// Add linked child for parent
userSchema.methods.linkChild = function (studentId) {
  if (!this.isParentOf(studentId)) {
    this.parent_link.push(studentId);
  }
};

// Get full name (for backward compatibility)
userSchema.virtual('fullName').get(function () {
  return this.name;
});
userSchema.virtual('full_name').get(function () {
  return this.name;
});
// console.log("hello");

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password_hash;
    // Ensure modulesEnabled and organizationType are included if they were attached
    if (doc.modulesEnabled) ret.modulesEnabled = doc.modulesEnabled;
    if (doc.organizationType) ret.organizationType = doc.organizationType;
    return ret;
  }
});

// Prevent organization_id changes after creation
userSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('organization_id')) {
    return next(new Error('Cannot change organization affiliation after registration'));
  }
  next();
});

module.exports = mongoose.model('User', userSchema);