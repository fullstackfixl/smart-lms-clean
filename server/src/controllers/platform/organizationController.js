const organizationService = require('../../services/platform/organizationService');
const auditLogService = require('../../services/platform/auditLogService');

exports.getOrganizations = async (req, res) => {
  try {
    const result = await organizationService.listOrganizations(req.query);
    res.status(200).json({
      success: true,
      data: result
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

exports.getOrganizationInstructors = async (req, res) => {
  try {
    const result = await organizationService.listOrganizationUsers(req.params.orgId, 'instructor', req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_INSTRUCTORS_ERROR'
    });
  }
};

exports.getOrganizationStudents = async (req, res) => {
  try {
    const result = await organizationService.listOrganizationUsers(req.params.orgId, 'student', req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_STUDENTS_ERROR'
    });
  }
};

exports.getOrganizationStats = async (req, res) => {
  try {
    const stats = await organizationService.getOrganizationStats(req.params.orgId);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_STATS_ERROR'
    });
  }
};

exports.getOrganizationCourses = async (req, res) => {
  try {
    const result = await organizationService.listOrganizationCourses(req.params.orgId, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_COURSES_ERROR'
    });
  }
};

exports.getOrganizationActivity = async (req, res) => {
  try {
    const result = await organizationService.getOrganizationActivity(req.params.orgId, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_ACTIVITY_ERROR'
    });
  }
};

exports.getOrganizationLiveClasses = async (req, res) => {
  try {
    const result = await organizationService.listOrganizationLiveClasses(req.params.orgId, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_LIVE_CLASSES_ERROR'
    });
  }
};

exports.getOrganizationQuizzes = async (req, res) => {
  try {
    const result = await organizationService.listOrganizationQuizzes(req.params.orgId, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_QUIZZES_ERROR'
    });
  }
};

exports.getOrganizationCertificates = async (req, res) => {
  try {
    const result = await organizationService.listOrganizationCertificates(req.params.orgId, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_CERTIFICATES_ERROR'
    });
  }
};

exports.getOrganizationAttendance = async (req, res) => {
  try {
    const result = await organizationService.listOrganizationAttendance(req.params.orgId, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_ATTENDANCE_ERROR'
    });
  }
};

exports.resetAdminPassword = async (req, res) => {
  try {
    const result = await organizationService.resetAdminPassword(req.params.orgId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'ORG_RESET_PASSWORD_ERROR'
    });
  }
};
