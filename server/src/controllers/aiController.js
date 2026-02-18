const BaseController = require('../core/BaseController');
const aiService = require('../services/aiService');
const gamificationService = require('../services/gamificationService');

class AIController extends BaseController {
  constructor() {
    super(aiService);
  }

  generateQuiz = this.asyncHandler(async (req, res) => {
    const quiz = await aiService.generateQuiz(req.body);
    this.sendSuccess(res, quiz, 'Quiz generated successfully');
  });

  explainTopic = this.asyncHandler(async (req, res) => {
    const explanation = await aiService.explainTopic(req.body);
    this.sendSuccess(res, explanation, 'Topic explanation generated successfully');
  });

  predictPerformance = this.asyncHandler(async (req, res) => {
    const prediction = await aiService.predictPerformance(req.params.user_id, req.query.course_id, req.user.organization_id);
    this.sendSuccess(res, prediction, 'Performance prediction generated successfully');
  });

  updatePoints = this.asyncHandler(async (req, res) => {
    const result = await gamificationService.updatePoints(req.body.user_id, req.body.points, req.user.organization_id);
    this.sendSuccess(res, result, 'Points updated successfully');
  });

  getLeaderboard = this.asyncHandler(async (req, res) => {
    const leaderboard = await gamificationService.getLeaderboard(req.params.course_id, req.user.organization_id);
    this.sendSuccess(res, leaderboard, 'Leaderboard retrieved successfully');
  });

  getUserBadges = this.asyncHandler(async (req, res) => {
    const badges = await gamificationService.getUserBadges(req.params.user_id, req.user.organization_id);
    this.sendSuccess(res, badges, 'User badges retrieved successfully');
  });
}

module.exports = new AIController();
