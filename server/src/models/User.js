const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLE_PERMISSION_MATRIX } = require('../config/platformAccessCatalog');
const bcryptRegex = /^\$2[aby]\$/;

const userSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true,
    required: function () {
      return this.role !== 'platform_admin' && this.role !== 'platform_staff' && this.role !== 'platformAdmin' && this.role !== 'student';
    }
  },

  organization_code: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: false,
    select: false
  },
  profilePicture: {
    type: String, // base64 encoded image string
    default: null
  },
  permissions: [{
    type: String,
    trim: true
  }],
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['platform_admin', 'platform_staff', 'org_admin', 'organization_admin', 'instructor', 'student', 'parent', 'support_staff', 'public_student'],
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    rollNumber: {
      type: String,
      trim: true
    },
    year: {
      type: Number
    },
    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program'
    },
    current_semester: {
      type: Number
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
  lastLogin: {
    type: Date,
    default: null
  },
  lastActive: {
    type: Date,
    default: null
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
  },
  socialProvider: {
    name: { type: String, enum: ['google', 'facebook', 'auth0'] },
    id: { type: String }
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
userSchema.index({ organization_id: 1, role: 1, status: 1 });
userSchema.index({ created_at: -1 });
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
  // Only run if password_hash was explicitly modified
  if (!this.isModified('password_hash')) {
    // console.log(`[User Model] password_hash not modified for user: ${this.email}`);
    return next();
  }

  try {
    const val = this.password_hash;
    if (bcryptRegex.test(val)) {
      return next();
    }

    // Plain text password — hash it
    const saltRounds = Math.max(parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10), 10);
    this.password_hash = await bcrypt.hash(val, saltRounds);
    next();
  } catch (error) {
    console.error(`[User Model] Hashing error for user ${this.email}:`, error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password_hash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password_hash);
};

userSchema.methods.isPlatformSuperAdmin = function () {
  return ['platform_admin', 'platformAdmin', 'superAdmin'].includes(this.role);
};

userSchema.methods.hasPermission = function (permission) {
  if (!permission) {
    return false;
  }

  if (this.isPlatformSuperAdmin()) {
    return true;
  }

  const explicitPermissions = Array.isArray(this.permissions) ? this.permissions : [];
  if (explicitPermissions.includes('*') || explicitPermissions.includes(permission)) {
    return true;
  }

  const rolePermissions = ROLE_PERMISSION_MATRIX[this.role] || [];
  return rolePermissions.includes(permission);
};

// Get public user data (exclude sensitive fields)
userSchema.methods.toPublicJSON = function () {
  const userObj = {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
    permissions: this.permissions || [],
    profilePicture: this.profilePicture,
    organization_id: this.organization_id?._id || this.organization_id,
    organization_code: this.organization_code,
    profile: this.profile,
    preferences: this.preferences,
    email_verified: this.email_verified,
    phone_verified: this.phone_verified,
    lastLogin: this.lastLogin,
    lastActive: this.lastActive,
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
