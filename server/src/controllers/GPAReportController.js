const BaseController = require('../core/BaseController');
const GradeSummary = require('../models/GradeSummary');
const User = require('../models/User');

class GPAReportController extends BaseController {
    async getOrganizationGPA(req, res) {
        try {
            const stats = await GradeSummary.getOrganizationGradeStats(req.user.organization_id);
            return this.sendSuccess(res, stats);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getStudentGPA(req, res) {
        try {
            const { studentId } = req.params;
            const gpaData = await GradeSummary.getStudentGPA(studentId, req.user.organization_id);
            return this.sendSuccess(res, gpaData);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getAtRiskStudents(req, res) {
        try {
            const { threshold = 60 } = req.query;
            const students = await GradeSummary.findAtRiskStudents(req.user.organization_id, threshold);
            return this.sendSuccess(res, students);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getDepartmentWiseGPA(req, res) {
        try {
            const stats = await GradeSummary.aggregate([
                { $match: { organization_id: req.user.organization_id, is_active: true } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'student_id',
                        foreignField: '_id',
                        as: 'student'
                    }
                },
                { $unwind: '$student' },
                {
                    $group: {
                        _id: '$student.profile.department',
                        avg_gpa: { $avg: '$grade_points' },
                        student_count: { $sum: 1 }
                    }
                },
                { $sort: { avg_gpa: -1 } }
            ]);
            return this.sendSuccess(res, stats);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
}

module.exports = new GPAReportController();
