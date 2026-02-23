const BaseService = require('../core/BaseService');

class ParentService extends BaseService {
  async getLinkedChildren(parentId, organizationId) {
    const User = require('../models/User');
    const parent = await User.findById(parentId);
    return parent.linkedStudents || [];
  }

  async generateVerificationCode(studentId, organizationId) {
    const VerificationCode = require('../models/VerificationCode');

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete any existing codes of same type for user
    await VerificationCode.deleteMany({ user_id: studentId, type: 'parent_link' });

    const verificationCode = new VerificationCode({
      user_id: studentId,
      code,
      type: 'parent_link',
      expires_at: expiresAt
    });

    await verificationCode.save();
    return { code, expires_at: expiresAt };
  }

  async linkChildByCode(parentId, code, organizationId) {
    const VerificationCode = require('../models/VerificationCode');
    const { User } = require('../models');

    // Find valid code
    const verificationRecord = await VerificationCode.findOne({
      code,
      type: 'parent_link',
      expires_at: { $gt: new Date() },
      used: false
    });

    if (!verificationRecord) {
      throw new Error('Invalid or expired verification code');
    }

    // Find student
    const student = await User.findById(verificationRecord.user_id);
    if (!student) {
      throw new Error('Student not found');
    }

    // Ensure they are in the same organization
    if (student.organization_id.toString() !== organizationId.toString()) {
      throw new Error('Student does not belong to your organization');
    }

    // Update parent
    const parent = await User.findById(parentId);
    if (!parent.parent_link) parent.parent_link = [];

    if (!parent.parent_link.includes(student._id)) {
      parent.parent_link.push(student._id);
      await parent.save();
    }

    // Mark code as used
    verificationRecord.used = true;
    await verificationRecord.save();

    return { success: true, studentName: student.name };
  }

  async getChildProgress(studentId, organizationId) {
    const progressService = require('./progressService');
    return await progressService.repository.findAll({ user_id: studentId }, {}, organizationId);
  }

  async getChildAttendance(studentId, organizationId) {
    const attendanceService = require('./attendanceService');
    return await attendanceService.getAttendanceReport(studentId, organizationId);
  }

  async getChildGrades(studentId, organizationId) {
    const gradeService = require('./gradeService');
    return await gradeService.getStudentGrades(studentId, organizationId);
  }

  async getChildFees(studentId, organizationId) {
    const feeService = require('./feeService');
    return await feeService.getFeeDetails(studentId, organizationId);
  }
}

module.exports = new ParentService();
