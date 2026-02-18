const BaseService = require('../core/BaseService');

class LiveClassService extends BaseService {
  async scheduleClass(classData, organizationId) {
    classData.status = 'scheduled';
    classData.meeting_url = `https://meet.example.com/${Date.now()}`;
    return await this.repository.create(classData, organizationId);
  }

  async getJoinLink(classId, organizationId) {
    const liveClass = await this.repository.findById(classId, organizationId);
    if (!liveClass) throw new Error('Live class not found');
    return { meeting_url: liveClass.meeting_url };
  }

  async updateClass(classId, updates, organizationId) {
    return await this.repository.update(classId, updates, organizationId);
  }

  async cancelClass(classId, organizationId) {
    return await this.repository.update(classId, { status: 'cancelled' }, organizationId);
  }

  async getUpcomingClasses(userId, organizationId) {
    return await this.repository.findAll({
      scheduled_at: { $gte: new Date() },
      status: 'scheduled'
    }, {}, organizationId);
  }

  async uploadRecording(classId, recordingUrl, organizationId) {
    return await this.repository.update(classId, { 
      recording_url: recordingUrl,
      status: 'completed'
    }, organizationId);
  }
}

module.exports = new LiveClassService();
