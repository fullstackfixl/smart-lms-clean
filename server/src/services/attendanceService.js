const BaseService = require('../core/BaseService');

class AttendanceService extends BaseService {
  async markAttendance(attendanceData, markedBy, organizationId) {
    attendanceData.marked_by = markedBy;
    attendanceData.date = attendanceData.date || new Date();
    return await this.repository.create(attendanceData, organizationId);
  }

  async bulkMarkAttendance(attendanceList, markedBy, organizationId) {
    const results = [];
    for (const data of attendanceList) {
      const record = await this.markAttendance(data, markedBy, organizationId);
      results.push(record);
    }
    return results;
  }

  async getAttendanceReport(userId, organizationId) {
    return await this.repository.findAll({ user_id: userId }, {}, organizationId);
  }

  async getClassAttendance(classId, organizationId) {
    return await this.repository.findAll({ class_id: classId }, {}, organizationId);
  }

  async getAttendanceSummary(userId, organizationId) {
    const records = await this.repository.findAll({ user_id: userId }, {}, organizationId);
    const total = records.data.length;
    const present = records.data.filter(r => r.status === 'present').length;
    
    return {
      total_classes: total,
      present: present,
      absent: total - present,
      percentage: total > 0 ? (present / total) * 100 : 0
    };
  }
}

module.exports = new AttendanceService();
