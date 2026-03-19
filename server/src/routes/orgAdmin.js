const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { Course, Section, Lesson, User } = require('../models');
const { AcademicEnrollment, InstructorAssignment, Subject: AcademicSubject, Batch: AcademicBatch } = require('../models');
const { AcademicProgram, Timetable, Notification } = require('../models');
const academicEnrollmentEngine = require('../services/academicEnrollmentEngine');

const router = express.Router();

function buildMeetingLink({ organizationId, programId, batchId, subjectId, day, startTime }) {
  const safe = (v) => String(v || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-]/g, '');

  const safeStart = safe(String(startTime || '').replace(':', ''));
  return `https://meet.jit.si/${safe(organizationId)}-${safe(programId)}-${safe(batchId)}-${safe(subjectId)}-${safe(day)}-${safeStart}`;
}

// ==================== LEARNERS (ENROLLMENT ENGINE) ====================
// POST /org-admin/learners/assign
router.post('/learners/assign', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { studentId, programId, batchId } = req.body || {};

    if (!studentId || !programId || !batchId) {
      return res.error('studentId, programId and batchId are required', 'Validation failed', 400);
    }

    const result = await academicEnrollmentEngine.assignStudentToProgramBatch({
      actorUser: req.user,
      studentId,
      programId,
      batchId
    });

    return res.success({ assignment: result }, 'Student assigned successfully');
  } catch (error) {
    return res.error(error.message, 'Failed to assign student', error.statusCode || 500);
  }
});

// ==================== TIMETABLE (BATCH-BASED) ====================
// POST /org-admin/timetable
router.post('/timetable', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const organizationId = req.user.organization_id?._id || req.user.organization_id;
    const {
      programId,
      batchId,
      subjectId,
      instructorId,
      day,
      startTime,
      endTime,
      room
    } = req.body || {};

    if (!programId || !batchId || !subjectId || !instructorId || !day || !startTime || !endTime) {
      return res.error('programId, batchId, subjectId, instructorId, day, startTime and endTime are required', 'Validation failed', 400);
    }

    const [program, batch, subject, mapping] = await Promise.all([
      AcademicProgram.findOne({ _id: programId, organizationId, isActive: true }).select('_id').lean(),
      AcademicBatch.findOne({ _id: batchId, organizationId, isActive: true }).select('_id programId').lean(),
      AcademicSubject.findOne({ _id: subjectId, organizationId, isActive: true }).select('_id programId name code').lean(),
      InstructorAssignment.findOne({ organizationId, batchId, subjectId, instructorId, isActive: true }).select('_id').lean()
    ]);

    if (!program) return res.error('Program not found', 'Not found', 404);
    if (!batch) return res.error('Batch not found', 'Not found', 404);
    if (!subject) return res.error('Subject not found', 'Not found', 404);

    if (String(batch.programId) !== String(programId)) {
      return res.error('Batch does not belong to program', 'Validation failed', 400);
    }
    if (String(subject.programId) !== String(programId)) {
      return res.error('Subject does not belong to program', 'Validation failed', 400);
    }
    if (!mapping) {
      return res.error('Instructor is not assigned to this batch + subject', 'Validation failed', 400);
    }

    const meetingLink = buildMeetingLink({ organizationId, programId, batchId, subjectId, day, startTime });

    const entry = await Timetable.create({
      organizationId,
      organizationType: req.user.organization_type || 'college',
      programId,
      batchId,
      subjectId,
      instructorId,
      day,
      startTime,
      endTime,
      room,
      meetingLink,
      isActive: true
    });

    const populated = await Timetable.findById(entry._id)
      .populate('programId', 'name code')
      .populate('batchId', 'name code year semester')
      .populate('subjectId', 'name code')
      .populate('instructorId', 'name email profile.firstName profile.lastName')
      .lean();

    setImmediate(async () => {
      try {
        const socketService = require('../services/socketService');

        const enrollments = await AcademicEnrollment.find({
          organizationId,
          batchId
        }).select('studentId').lean();

        const studentIds = [...new Set(enrollments.map(e => String(e.studentId)).filter(Boolean))];
        if (!studentIds.length) return;

        const users = await User.find({ _id: { $in: studentIds }, organization_id: organizationId, role: 'student', isActive: true })
          .select('_id')
          .lean();

        const recipientIds = users.map(u => u._id);
        if (!recipientIds.length) return;

        const title = 'New class scheduled';
        const message = `${subject.name || 'Class'} ${day} ${startTime}`;

        const docs = recipientIds.map(rid => ({
          organization_id: organizationId,
          recipient_id: rid,
          sender_id: req.user._id,
          type: 'general',
          title,
          message,
          data: { timetableId: entry._id, batchId, subjectId },
          priority: 'medium',
          action_url: '/student/timetable',
          action_text: 'View'
        }));

        const created = await Notification.insertMany(docs, { ordered: false });
        created.forEach(n => socketService.sendNotification(n.recipient_id, n));
      } catch (_) {
        return;
      }
    });

    return res.success({ entry: populated }, 'Timetable entry created successfully');
  } catch (error) {
    return res.error(error.message, 'Failed to create timetable entry', 500);
  }
});

// GET /org-admin/timetable
router.get('/timetable', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const organizationId = req.user.organization_id?._id || req.user.organization_id;
    const { programId, batchId, day, instructorId, subjectId } = req.query;

    const query = { organizationId, isActive: true };
    if (programId) query.programId = programId;
    if (batchId) query.batchId = batchId;
    if (subjectId) query.subjectId = subjectId;
    if (instructorId) query.instructorId = instructorId;
    if (day) query.day = day;

    const entries = await Timetable.find(query)
      .populate('programId', 'name code')
      .populate('batchId', 'name code year semester')
      .populate('subjectId', 'name code')
      .populate('instructorId', 'name email profile.firstName profile.lastName')
      .sort({ day: 1, startTime: 1 })
      .lean();

    return res.success({ entries }, 'Timetable entries retrieved');
  } catch (error) {
    return res.error(error.message, 'Failed to load timetable', 500);
  }
});

// PUT /org-admin/timetable/:id
router.put('/timetable/:id', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const organizationId = req.user.organization_id?._id || req.user.organization_id;
    const entry = await Timetable.findOne({ _id: req.params.id, organizationId, isActive: true });
    if (!entry) return res.error('Timetable entry not found', 'Not found', 404);

    const { programId, batchId, subjectId, instructorId, day, startTime, endTime, room, isActive } = req.body || {};

    const nextProgramId = programId !== undefined ? programId : entry.programId;
    const nextBatchId = batchId !== undefined ? batchId : entry.batchId;
    const nextSubjectId = subjectId !== undefined ? subjectId : entry.subjectId;
    const nextInstructorId = instructorId !== undefined ? instructorId : entry.instructorId;
    const nextDay = day !== undefined ? day : entry.day;
    const nextStartTime = startTime !== undefined ? startTime : entry.startTime;

    const [batch, subject, mapping] = await Promise.all([
      AcademicBatch.findOne({ _id: nextBatchId, organizationId, isActive: true }).select('_id programId').lean(),
      AcademicSubject.findOne({ _id: nextSubjectId, organizationId, isActive: true }).select('_id programId name code').lean(),
      InstructorAssignment.findOne({ organizationId, batchId: nextBatchId, subjectId: nextSubjectId, instructorId: nextInstructorId, isActive: true }).select('_id').lean()
    ]);

    if (!batch) return res.error('Batch not found', 'Not found', 404);
    if (!subject) return res.error('Subject not found', 'Not found', 404);

    if (String(batch.programId) !== String(nextProgramId)) {
      return res.error('Batch does not belong to program', 'Validation failed', 400);
    }
    if (String(subject.programId) !== String(nextProgramId)) {
      return res.error('Subject does not belong to program', 'Validation failed', 400);
    }
    if (!mapping) {
      return res.error('Instructor is not assigned to this batch + subject', 'Validation failed', 400);
    }

    if (programId !== undefined) entry.programId = programId;
    if (batchId !== undefined) entry.batchId = batchId;
    if (subjectId !== undefined) entry.subjectId = subjectId;
    if (instructorId !== undefined) entry.instructorId = instructorId;
    if (day !== undefined) entry.day = day;
    if (startTime !== undefined) entry.startTime = startTime;
    if (endTime !== undefined) entry.endTime = endTime;
    if (room !== undefined) entry.room = room;
    if (isActive !== undefined) entry.isActive = isActive;

    entry.meetingLink = buildMeetingLink({
      organizationId,
      programId: nextProgramId,
      batchId: nextBatchId,
      subjectId: nextSubjectId,
      day: nextDay,
      startTime: nextStartTime
    });

    await entry.save();

    const populated = await Timetable.findById(entry._id)
      .populate('programId', 'name code')
      .populate('batchId', 'name code year semester')
      .populate('subjectId', 'name code')
      .populate('instructorId', 'name email profile.firstName profile.lastName')
      .lean();

    setImmediate(async () => {
      try {
        const socketService = require('../services/socketService');

        const enrollments = await AcademicEnrollment.find({ organizationId, batchId: nextBatchId })
          .select('studentId')
          .lean();
        const studentIds = [...new Set(enrollments.map(e => String(e.studentId)).filter(Boolean))];
        if (!studentIds.length) return;

        const users = await User.find({ _id: { $in: studentIds }, organization_id: organizationId, role: 'student', isActive: true })
          .select('_id')
          .lean();
        const recipientIds = users.map(u => u._id);
        if (!recipientIds.length) return;

        const title = 'Timetable updated';
        const message = `${subject.name || 'Class'} ${nextDay} ${nextStartTime}`;

        const docs = recipientIds.map(rid => ({
          organization_id: organizationId,
          recipient_id: rid,
          sender_id: req.user._id,
          type: 'general',
          title,
          message,
          data: { timetableId: entry._id, batchId: nextBatchId, subjectId: nextSubjectId },
          priority: 'medium',
          action_url: '/student/timetable',
          action_text: 'View'
        }));

        const created = await Notification.insertMany(docs, { ordered: false });
        created.forEach(n => socketService.sendNotification(n.recipient_id, n));
      } catch (_) {
        return;
      }
    });

    return res.success({ entry: populated }, 'Timetable entry updated successfully');
  } catch (error) {
    return res.error(error.message, 'Failed to update timetable entry', 500);
  }
});

// DELETE /org-admin/timetable/:id
router.delete('/timetable/:id', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const organizationId = req.user.organization_id?._id || req.user.organization_id;
    const entry = await Timetable.findOne({ _id: req.params.id, organizationId, isActive: true }).lean();
    if (!entry) return res.error('Timetable entry not found', 'Not found', 404);

    await Timetable.findByIdAndUpdate(entry._id, { isActive: false });

    setImmediate(async () => {
      try {
        const socketService = require('../services/socketService');
        const subject = await AcademicSubject.findOne({ _id: entry.subjectId, organizationId }).select('name').lean();

        const enrollments = await AcademicEnrollment.find({ organizationId, batchId: entry.batchId }).select('studentId').lean();
        const studentIds = [...new Set(enrollments.map(e => String(e.studentId)).filter(Boolean))];
        if (!studentIds.length) return;

        const users = await User.find({ _id: { $in: studentIds }, organization_id: organizationId, role: 'student', isActive: true })
          .select('_id')
          .lean();
        const recipientIds = users.map(u => u._id);
        if (!recipientIds.length) return;

        const title = 'Class cancelled';
        const message = `${subject?.name || 'Class'} ${entry.day} ${entry.startTime}`;

        const docs = recipientIds.map(rid => ({
          organization_id: organizationId,
          recipient_id: rid,
          sender_id: req.user._id,
          type: 'general',
          title,
          message,
          data: { batchId: entry.batchId, subjectId: entry.subjectId },
          priority: 'medium',
          action_url: '/student/timetable',
          action_text: 'View'
        }));

        const created = await Notification.insertMany(docs, { ordered: false });
        created.forEach(n => socketService.sendNotification(n.recipient_id, n));
      } catch (_) {
        return;
      }
    });

    return res.success({}, 'Timetable entry deleted successfully');
  } catch (error) {
    return res.error(error.message, 'Failed to delete timetable entry', 500);
  }
});

// ==================== INSTRUCTOR ASSIGNMENTS (BATCH + SUBJECT) ====================
// POST /org-admin/instructor-assignments
// Body: { subjectId, batchId, instructorId }
router.post('/instructor-assignments', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const organizationId = req.user.organization_id?._id || req.user.organization_id;
    const { subjectId, batchId, instructorId } = req.body || {};

    if (!subjectId || !batchId || !instructorId) {
      return res.error('subjectId, batchId and instructorId are required', 'Validation failed', 400);
    }

    const [subject, batch, instructor] = await Promise.all([
      AcademicSubject.findOne({ _id: subjectId, organizationId, isActive: true }).select('_id programId').lean(),
      AcademicBatch.findOne({ _id: batchId, organizationId, isActive: true }).select('_id programId').lean(),
      User.findOne({ _id: instructorId, organization_id: organizationId, role: 'instructor', isActive: true }).select('_id').lean()
    ]);

    if (!subject) return res.error('Subject not found', 'Not found', 404);
    if (!batch) return res.error('Batch not found', 'Not found', 404);
    if (!instructor) return res.error('Instructor not found', 'Not found', 404);
    if (String(subject.programId) !== String(batch.programId)) {
      return res.error('Subject program does not match batch program', 'Validation failed', 400);
    }

    const mapping = await InstructorAssignment.findOneAndUpdate(
      { organizationId, subjectId, batchId },
      { $set: { organizationId, subjectId, batchId, programId: subject.programId, instructorId, isActive: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const syncResult = await AcademicEnrollment.updateMany(
      { organizationId, subjectId, batchId },
      { $set: { instructorId } }
    );

    return res.success(
      {
        instructorAssignment: mapping,
        enrollmentsUpdated: syncResult.modifiedCount || syncResult.nModified || 0
      },
      'Instructor assignment updated successfully'
    );
  } catch (error) {
    return res.error(error.message, 'Failed to assign instructor', 500);
  }
});

// Get pending course applications (pending_review status)
router.get('/applications', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    
    const courses = await Course.find({
      organization_id: orgId,
      status: 'pending_review',
      isActive: true
    }).populate('instructor_id', 'profile.firstName profile.lastName email');

    // Get modules (sections) and lessons for each course
    const applications = await Promise.all(
      courses.map(async (course) => {
        const sections = await Section.find({
          course_id: course._id,
          isActive: true
        }).sort({ order: 1 });

        const modulesWithLessons = await Promise.all(
          sections.map(async (section) => {
            const lessons = await Lesson.find({
              section_id: section._id,
              isActive: true
            }).sort({ order: 1 }).select('title description type duration order isPreview');

            return {
              _id: section._id,
              title: section.title,
              description: section.description,
              lessons: lessons.map(l => ({
                _id: l._id,
                title: l.title,
                type: l.type,
                duration: l.duration,
                content: l.content
              }))
            };
          })
        );

        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          status: course.status,
          instructor_id: course.instructor_id,
          modules: modulesWithLessons,
          submittedAt: course.updatedAt
        };
      })
    );

    res.success({ applications }, 'Pending applications retrieved successfully');
  } catch (error) {
    console.error('Get applications error:', error);
    res.error(error.message, 'Failed to load applications', 500);
  }
});

// Approve and publish course
router.post('/applications/:courseId/approve', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      status: 'pending_review'
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not pending review', 404);
    }

    course.status = 'published';
    await course.save();

    res.success({ course }, 'Course approved and published successfully');
  } catch (error) {
    console.error('Approve course error:', error);
    res.error(error.message, 'Failed to approve course', 500);
  }
});

// Reject course
router.post('/applications/:courseId/reject', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      status: 'pending_review'
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not pending review', 404);
    }

    course.status = 'draft';
    course.rejectionReason = reason;
    await course.save();

    res.success({ course }, 'Course rejected and returned to instructor');
  } catch (error) {
    console.error('Reject course error:', error);
    res.error(error.message, 'Failed to reject course', 500);
  }
});

// Update course details (before approval)
router.put('/applications/:courseId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, category, level, price } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const course = await Course.findOne({
      _id: courseId,
      organization_id: orgId,
      status: 'pending_review'
    });

    if (!course) {
      return res.error('Course not found', 'Course does not exist or is not pending review', 404);
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (level) course.level = level;
    if (price !== undefined) course.price = price;

    await course.save();

    res.success({ course }, 'Course updated successfully');
  } catch (error) {
    console.error('Update application error:', error);
    res.error(error.message, 'Failed to update course', 500);
  }
});

// Update module
router.put('/applications/modules/:moduleId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const section = await Section.findOne({ _id: moduleId });
    if (!section) {
      return res.error('Module not found', 'Module does not exist', 404);
    }

    // Verify the course belongs to this org
    const course = await Course.findOne({
      _id: section.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to edit this module', 403);
    }

    if (title) section.title = title;
    if (description) section.description = description;
    await section.save();

    res.success({ section }, 'Module updated successfully');
  } catch (error) {
    console.error('Update module error:', error);
    res.error(error.message, 'Failed to update module', 500);
  }
});

// Delete module
router.delete('/applications/modules/:moduleId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { moduleId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const section = await Section.findOne({ _id: moduleId });
    if (!section) {
      return res.error('Module not found', 'Module does not exist', 404);
    }

    // Verify the course belongs to this org
    const course = await Course.findOne({
      _id: section.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to delete this module', 403);
    }

    // Soft delete
    section.isActive = false;
    await section.save();

    res.success({}, 'Module deleted successfully');
  } catch (error) {
    console.error('Delete module error:', error);
    res.error(error.message, 'Failed to delete module', 500);
  }
});

// Delete lesson
router.delete('/applications/lessons/:lessonId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const lesson = await Lesson.findOne({ _id: lessonId });
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Verify the course belongs to this org
    const section = await Section.findOne({ _id: lesson.section_id });
    const course = await Course.findOne({
      _id: section?.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to delete this lesson', 403);
    }

    // Soft delete
    lesson.isActive = false;
    await lesson.save();

    res.success({}, 'Lesson deleted successfully');
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.error(error.message, 'Failed to delete lesson', 500);
  }
});

// Update lesson
router.put('/lessons/:lessonId', authMiddleware, requireRole(['org_admin']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, content, duration } = req.body;
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const lesson = await Lesson.findOne({ _id: lessonId });
    if (!lesson) {
      return res.error('Lesson not found', 'Lesson does not exist', 404);
    }

    // Verify the course belongs to this org
    const section = await Section.findOne({ _id: lesson.section_id });
    const course = await Course.findOne({
      _id: section?.course_id,
      organization_id: orgId
    });

    if (!course) {
      return res.error('Access denied', 'You do not have permission to edit this lesson', 403);
    }

    // Update lesson fields
    if (title) lesson.title = title;
    if (duration !== undefined) lesson.duration = duration;
    if (content) lesson.content = content;

    await lesson.save();

    res.success({ lesson }, 'Lesson updated successfully');
  } catch (error) {
    console.error('Update lesson error:', error);
    res.error(error.message, 'Failed to update lesson', 500);
  }
});

module.exports = router;
