const BaseController = require('../core/BaseController');
const assessmentService = require('../services/assessmentService');

class AssessmentController extends BaseController {
  constructor() {
    super(assessmentService);
  }

  createQuiz = this.asyncHandler(async (req, res) => {
    const quiz = await assessmentService.createQuiz(req.body, req.user._id, req.user.organization_id);
    this.sendSuccess(res, quiz, 'Quiz created successfully', 201);
  });

  getQuizById = this.asyncHandler(async (req, res) => {
    const quiz = await assessmentService.getQuizById(req.params.id, req.user.organization_id);
    this.sendSuccess(res, quiz, 'Quiz retrieved successfully');
  });

  updateQuiz = this.asyncHandler(async (req, res) => {
    const quiz = await assessmentService.updateQuiz(req.params.id, req.body, req.user.organization_id);
    this.sendSuccess(res, quiz, 'Quiz updated successfully');
  });

  deleteQuiz = this.asyncHandler(async (req, res) => {
    await assessmentService.deleteQuiz(req.params.id, req.user.organization_id);
    this.sendSuccess(res, null, 'Quiz deleted successfully');
  });

  submitQuiz = this.asyncHandler(async (req, res) => {
    const result = await assessmentService.submitQuiz(req.params.id, req.body.answers, req.user._id, req.user.organization_id);
    this.sendSuccess(res, result, 'Quiz submitted successfully');
  });

  getQuizAttempts = this.asyncHandler(async (req, res) => {
    const attempts = await assessmentService.getQuizAttempts(req.params.id, req.user._id, req.user.organization_id);
    this.sendSuccess(res, attempts, 'Quiz attempts retrieved successfully');
  });

  getAttemptById = this.asyncHandler(async (req, res) => {
    const attempt = await assessmentService.getAttemptById(req.params.id, req.user.organization_id);
    this.sendSuccess(res, attempt, 'Attempt retrieved successfully');
  });
}

module.exports = new AssessmentController();
