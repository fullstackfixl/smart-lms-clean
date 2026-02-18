const BaseController = require('../core/BaseController');
const attendanceService = require('../services/attendanceService');

class AttendanceController extends BaseController {
  constructor() {
    super(attendanceService);
  }

  markAttendance = this.asyncHandler(async (req, res) => {
    const attendance = await attendanceService.markAttendance(req.body, req.user._id, req.user.organization_id);
    this.sendSuccess(res, attendance, 'Attendance marked successfully', 201);
  });

  bulkMarkAttendance = this.asyncHandler(async (req, res) => {
    const results = await attendanceService.bulkMarkAttendance(req.body.attendance_list, req.user._id, req.user.organization_id);
    this.sendSuccess(res, results, 'Bulk attendance marked successfully');
  });

  getAttendanceReport = this.asyncHandler(async (req, res) => {
    const report = await attendanceService.getAttendanceReport(req.params.user_id, req.user.organization_id);
    this.sendSuccess(res, report, 'Attendance report retrieved successfully');
  });

  getClassAttendance = this.asyncHandler(async (req, res) => {
    const attendance = await attendanceService.getClassAttendance(req.params.class_id, req.user.organization_id);
    this.sendSuccess(res, attendance, 'Class attendance retrieved successfully');
  });

  getAttendanceSummary = this.asyncHandler(async (req, res) => {
    const summary = await attendanceService.getAttendanceSummary(req.params.user_id, req.user.organization_id);
    this.sendSuccess(res, summary, 'Attendance summary retrieved successfully');
  });
}

module.exports = new AttendanceController();
