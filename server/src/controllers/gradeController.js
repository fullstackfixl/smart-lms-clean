const BaseController = require('../core/BaseController');
const gradeService = require('../services/gradeService');

class GradeController extends BaseController {
  constructor() {
    super(gradeService);
  }

  updateGrade = this.asyncHandler(async (req, res) => {
    const grade = await gradeService.updateGrade(req.body, req.user._id, req.user.organization_id);
    this.sendSuccess(res, grade, 'Grade updated successfully');
  });

  getStudentGrades = this.asyncHandler(async (req, res) => {
    const grades = await gradeService.getStudentGrades(req.params.user_id, req.user.organization_id);
    this.sendSuccess(res, grades, 'Student grades retrieved successfully');
  });

  getCourseGrades = this.asyncHandler(async (req, res) => {
    const grades = await gradeService.getCourseGrades(req.params.course_id, req.user.organization_id);
    this.sendSuccess(res, grades, 'Course grades retrieved successfully');
  });

  exportGrades = this.asyncHandler(async (req, res) => {
    const fileUrl = await gradeService.exportGrades(req.body, req.user.organization_id);
    this.sendSuccess(res, { url: fileUrl }, 'Grades exported successfully');
  });

  getGradeAnalytics = this.asyncHandler(async (req, res) => {
    const analytics = await gradeService.getGradeAnalytics(req.params.course_id, req.user.organization_id);
    this.sendSuccess(res, analytics, 'Grade analytics retrieved successfully');
  });
}

module.exports = new GradeController();
