const BaseController = require('../core/BaseController');
const timetableService = require('../services/timetableService');

class TimetableController extends BaseController {
  constructor() {
    super(timetableService);
  }

  createEntry = this.asyncHandler(async (req, res) => {
    const entry = await timetableService.createEntry(req.body, req.user.organization_id);
    this.sendSuccess(res, entry, 'Timetable entry created successfully', 201);
  });

  getOrgTimetable = this.asyncHandler(async (req, res) => {
    const timetable = await timetableService.getOrgTimetable(req.params.org_id);
    this.sendSuccess(res, timetable, 'Organization timetable retrieved successfully');
  });

  getUserTimetable = this.asyncHandler(async (req, res) => {
    const timetable = await timetableService.getUserTimetable(req.params.user_id, req.user.organization_id);
    this.sendSuccess(res, timetable, 'User timetable retrieved successfully');
  });

  updateEntry = this.asyncHandler(async (req, res) => {
    const entry = await timetableService.updateEntry(req.params.id, req.body, req.user.organization_id);
    this.sendSuccess(res, entry, 'Timetable entry updated successfully');
  });

  deleteEntry = this.asyncHandler(async (req, res) => {
    await timetableService.deleteEntry(req.params.id, req.user.organization_id);
    this.sendSuccess(res, null, 'Timetable entry deleted successfully');
  });

  checkConflicts = this.asyncHandler(async (req, res) => {
    const conflicts = await timetableService.checkConflicts(req.body, req.user.organization_id);
    this.sendSuccess(res, conflicts, 'Conflicts checked successfully');
  });
}

module.exports = new TimetableController();
