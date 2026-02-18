const BaseService = require('../core/BaseService');

class TimetableService extends BaseService {
  async createEntry(entryData, organizationId) {
    return await this.repository.create(entryData, organizationId);
  }

  async getOrgTimetable(orgId) {
    return await this.repository.findAll({}, {}, orgId);
  }

  async getUserTimetable(userId, organizationId) {
    return await this.repository.findAll({ instructor_id: userId }, {}, organizationId);
  }

  async updateEntry(entryId, updates, organizationId) {
    return await this.repository.update(entryId, updates, organizationId);
  }

  async deleteEntry(entryId, organizationId) {
    return await this.repository.delete(entryId, organizationId);
  }

  async checkConflicts(entryData, organizationId) {
    const entries = await this.repository.findAll({
      day_of_week: entryData.day_of_week,
      instructor_id: entryData.instructor_id
    }, {}, organizationId);

    const conflicts = entries.data.filter(e => {
      return e.start_time < entryData.end_time && e.end_time > entryData.start_time;
    });

    return conflicts;
  }
}

module.exports = new TimetableService();
