const BaseController = require('../core/BaseController');
const aiService = require('../services/aiService');
const gamificationService = require('../services/gamificationService');

class AIController extends BaseController {
  constructor() {
    super(aiService);
  }

  async askLessonQuestion(req, res) {
    const { lessonId, message } = req.body;
    const userId = req.user._id;
    const organizationId = req.user.organization_id;

    if (!lessonId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Lesson ID and message are required'
      });
    }

    const result = await aiService.askLessonQuestion(userId, lessonId, message, organizationId);
    this.sendSuccess(res, result, 'AI response generated successfully');
  }

  async getLessonChatHistory(req, res) {
    const { lessonId } = req.params;
    const userId = req.user._id;
    const organizationId = req.user.organization_id;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Lesson ID is required'
      });
    }

    const history = await aiService.getLessonChatHistory(userId, lessonId, organizationId);
    this.sendSuccess(res, history, 'Chat history retrieved successfully');
  }

  async generateQuiz(req, res) {
    const quiz = await aiService.generateQuiz(req.body);
    this.sendSuccess(res, quiz, 'Quiz generated successfully');
  }

  async explainTopic(req, res) {
    const explanation = await aiService.explainTopic(req.body);
    this.sendSuccess(res, explanation, 'Topic explanation generated successfully');
  }

  async predictPerformance(req, res) {
    const prediction = await aiService.predictPerformance(req.params.user_id, req.query.course_id, req.user.organization_id);
    this.sendSuccess(res, prediction, 'Performance prediction generated successfully');
  }

  async updatePoints(req, res) {
    const result = await gamificationService.updatePoints(req.body.user_id, req.body.points, req.user.organization_id);
    this.sendSuccess(res, result, 'Points updated successfully');
  }

  async getLeaderboard(req, res) {
    const leaderboard = await gamificationService.getLeaderboard(req.params.course_id, req.user.organization_id);
    this.sendSuccess(res, leaderboard, 'Leaderboard retrieved successfully');
  }

  async getUserBadges(req, res) {
    const badges = await gamificationService.getUserBadges(req.params.user_id, req.user.organization_id);
    this.sendSuccess(res, badges, 'User badges retrieved successfully');
  }
}


module.exports = new AIController();
