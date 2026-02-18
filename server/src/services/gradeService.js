const BaseService = require('../core/BaseService');

class GradeService extends BaseService {
  async updateGrade(gradeData, gradedBy, organizationId) {
    gradeData.graded_by = gradedBy;
    gradeData.graded_at = new Date();
    
    const existing = await this.repository.findAll({
      user_id: gradeData.user_id,
      assessment_id: gradeData.assessment_id
    }, {}, organizationId);

    if (existing.data.length > 0) {
      return await this.repository.update(existing.data[0]._id, gradeData, organizationId);
    }

    return await this.repository.create(gradeData, organizationId);
  }

  async getStudentGrades(userId, organizationId) {
    return await this.repository.findAll({ user_id: userId }, {}, organizationId);
  }

  async getCourseGrades(courseId, organizationId) {
    return await this.repository.findAll({ course_id: courseId }, {}, organizationId);
  }

  async getGradeAnalytics(courseId, organizationId) {
    const grades = await this.repository.findAll({ course_id: courseId }, {}, organizationId);
    const scores = grades.data.map(g => g.score);
    
    return {
      total_students: grades.data.length,
      average_score: scores.reduce((a, b) => a + b, 0) / scores.length || 0,
      highest_score: Math.max(...scores, 0),
      lowest_score: Math.min(...scores, 100)
    };
  }
}

module.exports = new GradeService();
