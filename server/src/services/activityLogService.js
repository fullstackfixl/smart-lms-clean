const { ActivityLog, Organization } = require('../models');

let socketService = null;
try {
  socketService = require('./socketService');
} catch (_) {
  socketService = null;
}

async function createActivityLog({ organizationId, userId, role, action, metadata }) {
  if (!organizationId) {
    const err = new Error('organizationId is required');
    err.statusCode = 400;
    throw err;
  }
  if (!userId) {
    const err = new Error('userId is required');
    err.statusCode = 400;
    throw err;
  }
  if (!action) {
    const err = new Error('action is required');
    err.statusCode = 400;
    throw err;
  }

  const org = await Organization.findById(organizationId).select('type is_deleted');
  if (!org || org.is_deleted) {
    const err = new Error('Organization not found');
    err.statusCode = 404;
    throw err;
  }

  const orgType = String(org.type || '').toLowerCase();
  if (orgType !== 'college') {
    const err = new Error('ActivityLog is only supported for college tenants');
    err.statusCode = 400;
    throw err;
  }

  const log = await ActivityLog.create({
    organizationId,
    organizationType: 'college',
    userId,
    role: role || 'unknown',
    action,
    metadata: metadata || null,
    createdAt: new Date()
  });

  if (socketService && socketService.io) {
    const payload = {
      organizationId: String(organizationId),
      action,
      timestamp: new Date().toISOString()
    };

    socketService.broadcastToOrganization(String(organizationId), 'organization_activity', payload);
    socketService.io.emit('organization_activity', payload);
  }

  return log;
}

module.exports = {
  createActivityLog
};
