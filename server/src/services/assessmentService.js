const BaseService = require('../core/BaseService');
const { NotFoundError } = require('../core/errors');

class AssessmentService extends BaseService {
  async createQuiz(quizData, userId, organizationId) {
    quizData.created_by = userId;
    return await this.repository.create(quizData, organizationId);
  }

  async getQuizById(quizId, organizationId) {
    const quiz = await this.repository.findById(quizId, organizationId);
    if (!quiz) throw new NotFoundError('Quiz not found');
    return quiz;
  }

  async updateQuiz(quizId, updates, organizationId) {
    return await this.repository.update(quizId, updates, organizationId);
  }

  async deleteQuiz(quizId, organizationId) {
    return await this.repository.delete(quizId, organizationId);
  }

  async submitQuiz(quizId, answers, userId, organizationId) {
    const quiz = await this.getQuizById(quizId, organizationId);
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach((q, idx) => {
      totalPoints += q.points || 1;
      if (answers[idx] === q.correct_answer) {
        score += q.points || 1;
      }
    });

    const attempt = {
      quiz_id: quizId,
      user_id: userId,
      answers,
      score,
      total_points: totalPoints,
      percentage: (score / totalPoints) * 100,
      submitted_at: new Date()
    };

    return attempt;
  }
}

module.exports = new AssessmentService();
