const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const moduleGuard = require('../middleware/moduleGuard');

const router = express.Router();

router.use(auth, moduleGuard('SUBJECTS'));

router.get('/', [
  auth,
  query('course_id').optional().isMongoId(),
  query('active').optional().isIn(['true', 'false'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Please check your query parameters', details: errors.array() });
    }

    const { Assignment } = require('../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { course_id, active } = req.query;

    const filters = {
      organization_id: orgId
    };

    if (course_id) filters.course_id = course_id;
    if (active === 'true') filters.is_active = true;
    if (active === 'false') filters.is_active = false;

    const assignments = await Assignment.find(filters)
      .populate('course_id', 'title')
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: { assignments }, message: 'Assignments retrieved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to retrieve assignments' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { Assignment } = require('../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const assignment = await Assignment.findOne({ _id: req.params.id, organization_id: orgId })
      .populate('course_id', 'title')
      .populate('created_by', 'name email')
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found', message: 'Assignment not found' });
    }

    return res.json({ success: true, data: { assignment }, message: 'Assignment retrieved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to retrieve assignment' });
  }
});

router.post('/', [
  auth,
  body('course_id').optional().isMongoId(),
  body('subjectId').isMongoId(),
  body('batchId').isMongoId(),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('due_date').optional().isISO8601(),
  body('max_score').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Please check your input', details: errors.array() });
    }

    const { Assignment, Course, Subject, AcademicEnrollment, InstructorAssignment, User, Notification } = require('../models');
    const socketService = require('../services/socketService');

    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions', message: 'Only instructors and administrators can create assignments' });
    }

    const { course_id, title, description, due_date, max_score, subjectId, batchId } = req.body;

    // Resolve course from subject mapping (subjectId -> contentCourseId)
    const subject = await Subject.findOne({
      _id: subjectId,
      organizationId: orgId,
      isActive: true
    }).select('_id contentCourseId programId').lean();

    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found', message: 'Subject not found in your organization' });
    }

    const resolvedCourseId = subject.contentCourseId || course_id;
    if (!resolvedCourseId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Course mapping missing', 
        message: 'This subject is not linked to a content course. Please link the subject to a course in the subject settings, or provide a course_id in the request.' 
      });
    }

    // Validate instructor is assigned to subject + batch
    if (role === 'instructor') {
      const mapping = await InstructorAssignment.findOne({
        organizationId: orgId,
        instructorId: userId,
        subjectId,
        batchId,
        isActive: true
      }).select('_id').lean();

      if (!mapping) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'You are not assigned to this subject and batch' });
      }
    }

    // Ensure resolved course exists
    const course = await Course.findOne({
      _id: resolvedCourseId,
      organization_id: orgId,
      $or: [{ is_active: true }, { isActive: true }]
    }).select('_id').lean();
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found', message: 'Linked content course not found in your organization' });
    }

    const assignment = await Assignment.create({
      organization_id: orgId,
      course_id: resolvedCourseId,
      subjectId,
      batchId,
      instructor_id: role === 'instructor' ? userId : null,
      title,
      description,
      due_date: due_date ? new Date(due_date) : undefined,
      max_score,
      created_by: userId,
      is_active: true
    });

    setImmediate(async () => {
      try {
        const academicEnrollments = await AcademicEnrollment.find({
          organizationId: orgId,
          subjectId,
          batchId
        }).select('studentId').lean();

        const studentIds = [...new Set(academicEnrollments.map(e => String(e.studentId)).filter(Boolean))];
        if (!studentIds.length) return;

        const users = await User.find({ _id: { $in: studentIds }, organization_id: orgId, role: 'student' }).select('_id').lean();
        const recipientIds = users.map(u => u._id);
        if (!recipientIds.length) return;

        const docs = recipientIds.map(rid => ({
          organization_id: orgId,
          recipient_id: rid,
          sender_id: userId,
          type: 'general',
          title: 'New Assignment',
          message: `${title}`,
          data: { assignment_id: assignment._id, course_id: resolvedCourseId, subjectId, batchId },
          priority: 'medium',
          action_url: '/student/assignments',
          action_text: 'View'
        }));

        const created = await Notification.insertMany(docs);
        created.forEach(n => socketService.sendNotification(n.recipient_id, n));
      } catch (e) {
        return;
      }
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('course_id', 'title')
      .populate('created_by', 'name email')
      .lean();

    return res.json({ success: true, data: { assignment: populated }, message: 'Assignment created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to create assignment' });
  }
});

router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('due_date').optional().isISO8601(),
  body('max_score').optional().isFloat({ min: 0 }),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Please check your input', details: errors.array() });
    }

    const { Assignment, Course } = require('../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;

    const assignment = await Assignment.findOne({ _id: req.params.id, organization_id: orgId });
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found', message: 'Assignment not found' });
    }

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions', message: 'Only instructors and administrators can update assignments' });
    }

    if (role === 'instructor') {
      const course = await Course.findOne({
        _id: assignment.course_id,
        organization_id: orgId,
        $or: [{ is_active: true }, { isActive: true }]
      });
      if (!course || String(course.instructor_id) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'You can only update assignments for your assigned courses' });
      }
    }

    const { title, description, due_date, max_score, is_active } = req.body;
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (due_date !== undefined) assignment.due_date = due_date ? new Date(due_date) : null;
    if (max_score !== undefined) assignment.max_score = max_score;
    if (is_active !== undefined) assignment.is_active = is_active;

    await assignment.save();

    const populated = await Assignment.findById(assignment._id)
      .populate('course_id', 'title')
      .populate('created_by', 'name email')
      .lean();

    return res.json({ success: true, data: { assignment: populated }, message: 'Assignment updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to update assignment' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { Assignment, Course } = require('../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { role, _id: userId } = req.user;

    const assignment = await Assignment.findOne({ _id: req.params.id, organization_id: orgId });
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found', message: 'Assignment not found' });
    }

    if (!['instructor', 'org_admin'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions', message: 'Only instructors and administrators can delete assignments' });
    }

    if (role === 'instructor') {
      const course = await Course.findOne({
        _id: assignment.course_id,
        organization_id: orgId,
        $or: [{ is_active: true }, { isActive: true }]
      });
      if (!course || String(course.instructor_id) !== String(userId)) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'You can only delete assignments for your assigned courses' });
      }
    }

    assignment.is_active = false;
    await assignment.save();

    return res.json({ success: true, data: { assignment_id: assignment._id }, message: 'Assignment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, message: 'Failed to delete assignment' });
  }
});

module.exports = router;
