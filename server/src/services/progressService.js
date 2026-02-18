const BaseService = require('../core/BaseService');

class ProgressService extends BaseService {
  async updateProgress(courseId, lessonId, userId, organizationId) {
    let progress = await this.repository.findAll(
      { user_id: userId, course_id: courseId },
      {},
      organizationId
    );

    if (progress.data.length === 0) {
      return await this.repository.create({
        user_id: userId,
        course_id: courseId,
        completed_lessons: [lessonId],
        last_accessed: new Date()
      }, organizationId);
    }

    const existing = progress.data[0];
    if (!existing.completed_lessons.includes(lessonId)) {
      existing.completed_lessons.push(lessonId);
    }
    existing.last_accessed = new Date();

    return await this.repository.update(existing._id, existing, organizationId);
  }

  async getCourseProgress(courseId, userId, organizationId) {
    const progress = await this.repository.findAll(
      { user_id: userId, course_id: courseId },
      {},
      organizationId
    );
    return progress.data[0] || null;
  }
}

module.exports = new ProgressService();
