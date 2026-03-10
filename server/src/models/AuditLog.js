/**
 * Audit Log Model
 * Tracks all sensitive operations for compliance and security auditing
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false, // Optional for platform_admin global logs
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_email: {
    type: String,
    required: true
  },
  user_role: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'RESTORE',
      'SUSPEND', 'ACTIVATE', 'APPROVE', 'REJECT',
      'LOGIN', 'LOGOUT', 'PASSWORD_RESET',
      'ROLE_CHANGE', 'PERMISSION_CHANGE',
      'EXPORT', 'IMPORT', 'BULK_UPDATE', 'INVITE'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'organization', 'user', 'course', 'enrollment',
      'subscription', 'payment', 'config', 'admin',
      'report', 'analytics'
    ]
  },
  resource_id: {
    type: String
  },
  details: {
    method: String,
    path: String,
    body: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We use custom timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resource_id: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // For time-based queries

// TTL index - automatically delete logs older than 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to get audit trail for a resource
auditLogSchema.statics.getResourceAuditTrail = function (organizationId, resource, resourceId, limit = 50) {
  const query = { resource, resource_id: resourceId };
  if (organizationId) query.organization_id = organizationId;

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function (organizationId, userId, limit = 100) {
  const query = { user_id: userId };
  if (organizationId) query.organization_id = organizationId;

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Static method to get recent sensitive operations
auditLogSchema.statics.getRecentSensitiveOperations = function (organizationId, limit = 100) {
  const sensitiveActions = ['DELETE', 'SUSPEND', 'ROLE_CHANGE', 'PERMISSION_CHANGE'];
  const query = { action: { $in: sensitiveActions } };
  if (organizationId) query.organization_id = organizationId;

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
