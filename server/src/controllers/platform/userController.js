const userService = require('../../services/platform/userService');
const auditLogService = require('../../services/platform/auditLogService');

exports.getUsers = async (req, res) => {
  try {
    const result = await userService.listUsers(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'USER_LIST_ERROR'
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await userService.getUserDetails(req.params.userId);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
      errorCode: 'USER_NOT_FOUND'
    });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await userService.suspendUser(req.params.userId);
    
    await auditLogService.logAction({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'user_suspended',
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'USER_SUSPEND_ERROR'
    });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const result = await userService.resetUserPassword(req.params.userId, req.body.password);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'USER_PASSWORD_RESET_ERROR'
    });
  }
};
