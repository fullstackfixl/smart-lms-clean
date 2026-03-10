const staffService = require('../../services/platform/staffService');
const auditLogService = require('../../services/platform/auditLogService');

exports.getStaffList = async (req, res) => {
  try {
    const result = await staffService.listStaff(req.query);
    res.status(200).json({
      success: true,
      ...result
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
    const staff = await staffService.createStaff(req.body);
    
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
