const organizationService = require('../../services/platform/organizationService');
const auditLogService = require('../../services/platform/auditLogService');

exports.getOrganizations = async (req, res) => {
  try {
    const result = await organizationService.listOrganizations(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_LIST_ERROR'
    });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const organization = await organizationService.createOrganization(req.body, req.user._id);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'organization_created',
      entityType: 'Organization',
      entityId: organization._id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_CREATE_ERROR'
    });
  }
};

exports.getOrganizationDetails = async (req, res) => {
  try {
    const organization = await organizationService.getOrganizationById(req.params.orgId);
    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_NOT_FOUND'
    });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const organization = await organizationService.updateOrganization(req.params.orgId, req.body);
    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_UPDATE_ERROR'
    });
  }
};

exports.suspendOrganization = async (req, res) => {
  try {
    const organization = await organizationService.suspendOrganization(req.params.orgId);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'organization_suspended',
      entityType: 'Organization',
      entityId: organization._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_SUSPEND_ERROR'
    });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    await organizationService.deleteOrganization(req.params.orgId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_DELETE_ERROR'
    });
  }
};
