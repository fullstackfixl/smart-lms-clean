const BaseService = require('../core/BaseService');

class GamificationService extends BaseService {
  async updatePoints(userId, points, organizationId) {
    const existing = await this.repository.findAll({ user_id: userId }, {}, organizationId);
    
    if (existing.data.length > 0) {
      const current = existing.data[0];
      return await this.repository.update(current._id, {
        points: current.points + points
      }, organizationId);
    }
    
    return await this.repository.create({
      user_id: userId,
      points: points
    }, organizationId);
  }

  async getLeaderboard(courseId, organizationId) {
    const points = await this.repository.findAll({ course_id: courseId }, {}, organizationId);
    return points.data.sort((a, b) => b.points - a.points).slice(0, 10);
  }

  async getUserBadges(userId, organizationId) {
    return await this.repository.findAll({ user_id: userId }, {}, organizationId);
  }
}

module.exports = new GamificationService();
