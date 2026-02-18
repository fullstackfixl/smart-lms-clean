const BaseService = require('../core/BaseService');

class ParentService extends BaseService {
  async getLinkedChildren(parentId, organizationId) {
    const User = require('../models/User');
    const parent = await User.findById(parentId);
    return parent.linkedStudents || [];
  }

  async linkChild(parentId, studentData, organizationId) {
    const User = require('../models/User');
    const parent = await User.findById(parentId);
    
    if (!parent.linkedStudents) {
      parent.linkedStudents = [];
    }
    
    parent.linkedStudents.push({
      studentId: studentData.student_id,
      organizationId: organizationId
    });
    
    await parent.save();
    return { success: true };
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
