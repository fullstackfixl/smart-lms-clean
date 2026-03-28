const staffService = require('../../services/platform/staffService');
const auditLogService = require('../../services/platform/auditLogService');
const { PlatformAuditLog } = require('../../models');

exports.getStaffList = async (req, res) => {
  try {
    const result = await staffService.listStaff(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_LIST_ERROR'
    });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const staff = await staffService.createStaff(req.body, req.user);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'staff_created',
      entityType: 'User',
      entityId: staff._id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_CREATE_ERROR'
    });
  }
};

exports.inviteStaff = async (req, res) => {
  try {
    const result = await staffService.inviteStaff(req.body, req.user);

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Staff invitation sent successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_INVITE_ERROR'
    });
  }
};

exports.verifyInvite = async (req, res) => {
  try {
    const result = await staffService.verifyInvite(req.query.token);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_INVITE_VERIFY_ERROR'
    });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const result = await staffService.acceptInvite(req.body);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Staff account activated successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_INVITE_ACCEPT_ERROR'
    });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await staffService.updateStaff(req.params.staffId, req.body);
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_UPDATE_ERROR'
    });
  }
};

exports.disableStaff = async (req, res) => {
  try {
    const staff = await staffService.disableStaff(req.params.staffId);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'staff_disabled',
      entityType: 'User',
      entityId: staff._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_DISABLE_ERROR'
    });
  }
};

exports.enableStaff = async (req, res) => {
  try {
    const staff = await staffService.enableStaff(req.params.staffId);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'staff_enabled',
      entityType: 'User',
      entityId: staff._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_ENABLE_ERROR'
    });
  }
};

exports.deactivateStaff = async (req, res) => {
  try {
    const staff = await staffService.deactivateStaff(req.params.staffId, req.user);
    return res.status(200).json({
      success: true,
      data: staff,
      message: 'Staff deactivated successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_DEACTIVATE_ERROR'
    });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = {
      actorRole: 'platform_staff'
    };

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await PlatformAuditLog.find(query)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10))
      .lean();

    const total = await PlatformAuditLog.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'STAFF_ACTIVITY_LOGS_ERROR'
    });
  }
};
