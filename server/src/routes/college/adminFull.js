const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { Course, Section, Lesson, User, Department, Batch, CollegeEvent, Enrollment, Attendance, Quiz, LiveClass } = require('../../models');
const Notification = require('../../models/Notification');
const socketService = require('../../services/socketService');

// All routes require org_admin role
router.use(authMiddleware, requireRole(['org_admin']));

// ===== DASHBOARD =====
// GET /api/college/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    const [
      totalStudents,
      totalInstructors,
      totalDepartments,
      totalCourses,
      totalBatches,
      upcomingEvents
    ] = await Promise.all([
      User.countDocuments({ organization_id: orgId, role: 'student', isActive: true }),
      User.countDocuments({ organization_id: orgId, role: 'instructor', isActive: true }),
      Department.countDocuments({ organization_id: orgId, isActive: true }),
      Course.countDocuments({ organization_id: orgId, isActive: true }),
      Batch.countDocuments({ organization_id: orgId, isActive: true }),
      CollegeEvent.find({ 
        organization_id: orgId, 
        date: { $gte: new Date() },
        isActive: true 
      }).sort({ date: 1 }).limit(5)
    ]);

    // Calculate attendance rate
    const attendanceStats = await Attendance.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const totalAttendance = attendanceStats.reduce((acc, curr) => acc + curr.count, 0);
    const presentCount = attendanceStats.find(s => s._id === 'present')?.count || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    res.success({
      stats: {
        totalStudents,
        totalInstructors,
        totalDepartments,
        totalCourses,
        totalBatches,
        attendanceRate
      },
      upcomingEvents
    }, 'Dashboard data retrieved');
  } catch (error) {
    console.error('Dashboard error:', error);
    res.error(error.message, 'Failed to load dashboard', 500);
  }
});

// ===== DEPARTMENTS =====
// GET /api/college/admin/departments
router.get('/departments', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const departments = await Department.find({ organization_id: orgId, isActive: true })
      .populate('headInstructor', 'profile.firstName profile.lastName email')
      .sort({ name: 1 });
    res.success({ departments }, 'Departments retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load departments', 500);
  }
});

// POST /api/college/admin/departments
router.post('/departments', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { name, code, description, headInstructor } = req.body;

    const department = new Department({
      organization_id: orgId,
      organizationType: req.user.organization_type || 'college',
      name,
      code,
      description,
      headInstructor,
      createdBy: req.user._id
    });
    await department.save();

    res.success({ department }, 'Department created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create department', 500);
  }
});

// GET /api/college/admin/departments/:id
router.get('/departments/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const department = await Department.findOne({ _id: req.params.id, organization_id: orgId })
      .populate('headInstructor', 'profile.firstName profile.lastName email');

    if (!department) {
      return res.error('Department not found', null, 404);
    }

    // Get related data
    const [instructors, students, courses, batches] = await Promise.all([
      User.find({ organization_id: orgId, role: 'instructor', 'profile.department': department._id }),
      User.find({ organization_id: orgId, role: 'student', 'profile.department': department._id }),
      Course.find({ organization_id: orgId, departmentId: department._id, isActive: true }),
      Batch.find({ organization_id: orgId, departmentId: department._id, isActive: true })
    ]);

    res.success({ 
      department, 
      instructors, 
      students, 
      courses, 
      batches 
    }, 'Department details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load department', 500);
  }
});

// PUT /api/college/admin/departments/:id
router.put('/departments/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { name, code, description, headInstructor } = req.body;

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, organization_id: orgId },
      { name, code, description, headInstructor },
      { new: true }
    );

    if (!department) {
      return res.error('Department not found', null, 404);
    }

    res.success({ department }, 'Department updated successfully');
  } catch (error) {
    res.error(error.message, 'Failed to update department', 500);
  }
});

// ===== BATCHES =====
// GET /api/college/admin/batches
router.get('/batches', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { departmentId, year, semester } = req.query;

    let query = { organization_id: orgId, isActive: true };
    if (departmentId) query.departmentId = departmentId;
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);

    const batches = await Batch.find(query)
      .populate('departmentId', 'name code')
      .populate('students', 'profile.firstName profile.lastName email')
      .populate('instructor_ids', 'profile.firstName profile.lastName email')
      .sort({ year: -1, semester: 1 });

    res.success({ batches }, 'Batches retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load batches', 500);
  }
});

// POST /api/college/admin/batches
router.post('/batches', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { name, code, departmentId, year, semester, startDate, endDate } = req.body;

    const batch = new Batch({
      organization_id: orgId,
      organizationType: req.user.organization_type || 'college',
      name,
      code,
      departmentId,
      year,
      semester,
      startDate,
      endDate
    });
    await batch.save();

    res.success({ batch }, 'Batch created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create batch', 500);
  }
});

// GET /api/college/admin/batches/:id
router.get('/batches/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const batch = await Batch.findOne({ _id: req.params.id, organization_id: orgId })
      .populate('departmentId', 'name code')
      .populate('students', 'profile.firstName profile.lastName email rollNumber')
      .populate('instructor_ids', 'profile.firstName profile.lastName email');

    if (!batch) {
      return res.error('Batch not found', null, 404);
    }

    // Get attendance stats
    const attendanceStats = await Attendance.aggregate([
      { $match: { batchId: batch._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get courses for this batch
    const courses = await Course.find({ batchId: batch._id, isActive: true });

    res.success({ 
      batch, 
      attendanceStats,
      courses
    }, 'Batch details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load batch', 500);
  }
});

// PUT /api/college/admin/batches/:id
router.put('/batches/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { name, code, departmentId, year, semester, students, instructor_ids } = req.body;

    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, organization_id: orgId },
      { name, code, departmentId, year, semester, students, instructor_ids },
      { new: true }
    );

    if (!batch) {
      return res.error('Batch not found', null, 404);
    }

    res.success({ batch }, 'Batch updated successfully');
  } catch (error) {
    res.error(error.message, 'Failed to update batch', 500);
  }
});

// ===== STUDENTS =====
// GET /api/college/admin/students
router.get('/students', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { department, batch, year, search } = req.query;

    let query = { organization_id: orgId, role: 'student', isActive: true };
    if (department) query['profile.department'] = department;
    if (batch) query['profile.batch'] = batch;
    if (year) query['profile.year'] = parseInt(year);
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.rollNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .populate('profile.department', 'name code')
      .populate('profile.batch', 'name code')
      .sort({ 'profile.firstName': 1 });

    res.success({ students }, 'Students retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load students', 500);
  }
});

// POST /api/college/admin/students
router.post('/students', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { firstName, lastName, email, phone, departmentId, batchId, rollNumber, year } = req.body;

    const student = new User({
      email,
      role: 'student',
      organization_id: orgId,
      organizationType: req.user.organization_type || 'college',
      profile: {
        firstName,
        lastName,
        phone,
        department: departmentId,
        batch: batchId,
        rollNumber,
        year
      }
    });
    await student.save();

    // Add student to batch
    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: student._id } });
    }

    res.success({ student }, 'Student created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create student', 500);
  }
});

// GET /api/college/admin/students/:id
router.get('/students/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const student = await User.findOne({ _id: req.params.id, organization_id: orgId, role: 'student' })
      .populate('profile.department', 'name code')
      .populate('profile.batch', 'name code year semester');

    if (!student) {
      return res.error('Student not found', null, 404);
    }

    // Get enrolled courses
    const enrollments = await Enrollment.find({ student_id: student._id })
      .populate('course_id', 'title category level status');

    // Get attendance summary
    const attendanceSummary = await Attendance.aggregate([
      { $match: { student_id: student._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get quiz attempts
    const quizAttempts = await require('../models').QuizAttempt.find({ student_id: student._id })
      .populate('quiz_id', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.success({ 
      student, 
      enrollments,
      attendanceSummary,
      quizAttempts
    }, 'Student details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load student', 500);
  }
});

// ===== INSTRUCTORS =====
// GET /api/college/admin/instructors
router.get('/instructors', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { department, search } = req.query;

    let query = { organization_id: orgId, role: 'instructor', isActive: true };
    if (department) query['profile.department'] = department;
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const instructors = await User.find(query)
      .populate('profile.department', 'name code')
      .sort({ 'profile.firstName': 1 });

    res.success({ instructors }, 'Instructors retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load instructors', 500);
  }
});

// POST /api/college/admin/instructors
router.post('/instructors', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { firstName, lastName, email, phone, departmentId, bio } = req.body;

    const instructor = new User({
      email,
      role: 'instructor',
      organization_id: orgId,
      organizationType: req.user.organization_type || 'college',
      profile: {
        firstName,
        lastName,
        phone,
        department: departmentId,
        bio
      }
    });
    await instructor.save();

    res.success({ instructor }, 'Instructor created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create instructor', 500);
  }
});

// GET /api/college/admin/instructors/:id
router.get('/instructors/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const instructor = await User.findOne({ _id: req.params.id, organization_id: orgId, role: 'instructor' })
      .populate('profile.department', 'name code');

    if (!instructor) {
      return res.error('Instructor not found', null, 404);
    }

    // Get courses taught
    const courses = await Course.find({ instructor_id: instructor._id, isActive: true });

    // Get students taught (from enrollments of their courses)
    const courseIds = courses.map(c => c._id);
    const enrollments = await Enrollment.find({ course_id: { $in: courseIds } });
    const studentIds = [...new Set(enrollments.map(e => e.student_id.toString()))];

    // Get upcoming live classes
    const upcomingClasses = await LiveClass.find({
      instructor_id: instructor._id,
      startTime: { $gte: new Date() },
      status: 'scheduled'
    }).sort({ startTime: 1 }).limit(5);

    // Get quizzes created
    const quizzes = await Quiz.find({ createdBy: instructor._id }).sort({ createdAt: -1 }).limit(10);

    res.success({ 
      instructor, 
      courses,
      totalStudents: studentIds.length,
      upcomingClasses,
      quizzes
    }, 'Instructor details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load instructor', 500);
  }
});

// ===== COURSES =====
// GET /api/college/admin/courses
router.get('/courses', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { department, batch, status } = req.query;

    let query = { organization_id: orgId, isActive: true };
    if (department) query.departmentId = department;
    if (batch) query.batchId = batch;
    if (status) query.status = status;

    const courses = await Course.find(query)
      .populate('instructor_id', 'profile.firstName profile.lastName email')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code')
      .sort({ createdAt: -1 });

    res.success({ courses }, 'Courses retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load courses', 500);
  }
});

// GET /api/college/admin/courses/:id
router.get('/courses/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const course = await Course.findOne({ _id: req.params.id, organization_id: orgId })
      .populate('instructor_id', 'profile.firstName profile.lastName email')
      .populate('departmentId', 'name code')
      .populate('batchId', 'name code');

    if (!course) {
      return res.error('Course not found', null, 404);
    }

    // Get modules
    const modules = await Section.find({ course_id: course._id, isActive: true })
      .sort({ order: 1 });

    // Get enrolled students
    const enrollments = await Enrollment.find({ course_id: course._id })
      .populate('student_id', 'profile.firstName profile.lastName email');

    // Get quizzes
    const quizzes = await Quiz.find({ courseId: course._id }).sort({ createdAt: -1 });

    // Get live classes
    const liveClasses = await LiveClass.find({ course_id: course._id })
      .sort({ startTime: -1 })
      .limit(10);

    res.success({ 
      course, 
      modules, 
      students: enrollments.map(e => e.student_id),
      quizzes,
      liveClasses
    }, 'Course details retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load course', 500);
  }
});

// ===== ATTENDANCE =====
// GET /api/college/admin/attendance
router.get('/attendance', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { course, department, batch, date } = req.query;

    let query = { organization_id: orgId };
    if (course) query.course_id = course;
    if (batch) query.batchId = batch;
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.date = { $gte: startOfDay, $lt: endOfDay };
    }

    const attendance = await Attendance.find(query)
      .populate('student_id', 'profile.firstName profile.lastName rollNumber')
      .populate('course_id', 'title')
      .sort({ date: -1 })
      .limit(100);

    res.success({ attendance }, 'Attendance records retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance', 500);
  }
});

// ===== EVENTS =====
// GET /api/college/admin/events
router.get('/events', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { department, upcoming } = req.query;

    let query = { organization_id: orgId, isActive: true };
    if (department) query.departmentId = department;
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await CollegeEvent.find(query)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'profile.firstName profile.lastName')
      .sort({ date: 1 });

    res.success({ events }, 'Events retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load events', 500);
  }
});

// POST /api/college/admin/events
router.post('/events', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { title, description, date, endDate, location, departmentId, batchId, eventType } = req.body;

    const event = new CollegeEvent({
      organization_id: orgId,
      organizationType: req.user.organization_type || 'college',
      title,
      description,
      date,
      endDate,
      location,
      departmentId,
      batchId,
      eventType,
      createdBy: req.user._id
    });
    await event.save();

    // Notify instructors + students in the same organization
    try {
      const recipients = await User.find({ organization_id: orgId, role: { $in: ['student', 'instructor'] }, isActive: true })
        .select('_id')
        .lean();

      const notifications = recipients.map((u) => ({
        organization_id: orgId,
        recipient_id: u._id,
        sender_id: req.user._id,
        type: 'general',
        title: `New Event: ${title}`,
        message: description ? String(description).slice(0, 900) : 'A new event has been posted for your organization.',
        data: { eventId: event._id, scope: 'college_event' },
        priority: 'low',
        status: 'pending',
        action_url: '/student/events',
        action_text: 'View Event'
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications, { ordered: false });
      }

      socketService.broadcastToOrganization(String(orgId), 'event:new', { event });
    } catch (notifyErr) {
      // do not fail event creation if notifications fail
      console.warn('[CollegeAdminEvents] notify failed:', notifyErr.message);
    }

    res.success({ event }, 'Event created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create event', 500);
  }
});

// PUT /api/college/admin/events/:id
router.put('/events/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { id } = req.params;

    const event = await CollegeEvent.findOne({ _id: id, organization_id: orgId, isActive: true });
    if (!event) {
      return res.error('Event not found', 'Not found', 404);
    }

    const { title, description, date, endDate, location, departmentId, batchId, eventType, isActive } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (endDate !== undefined) event.endDate = endDate;
    if (location !== undefined) event.location = location;
    if (departmentId !== undefined) event.departmentId = departmentId;
    if (batchId !== undefined) event.batchId = batchId;
    if (eventType !== undefined) event.eventType = eventType;
    if (isActive !== undefined) event.isActive = isActive;

    await event.save();

    try {
      socketService.broadcastToOrganization(String(orgId), 'event:updated', { event });
    } catch (broadcastErr) {
      console.warn('[CollegeAdminEvents] broadcast update failed:', broadcastErr.message);
    }

    res.success({ event }, 'Event updated successfully');
  } catch (error) {
    res.error(error.message, 'Failed to update event', 500);
  }
});

// DELETE /api/college/admin/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { id } = req.params;

    const event = await CollegeEvent.findOne({ _id: id, organization_id: orgId, isActive: true });
    if (!event) {
      return res.error('Event not found', 'Not found', 404);
    }

    event.isActive = false;
    await event.save();

    try {
      socketService.broadcastToOrganization(String(orgId), 'event:deleted', { eventId: id });
    } catch (broadcastErr) {
      console.warn('[CollegeAdminEvents] broadcast delete failed:', broadcastErr.message);
    }

    res.success({ eventId: id }, 'Event deleted successfully');
  } catch (error) {
    res.error(error.message, 'Failed to delete event', 500);
  }
});

// ===== ANALYTICS =====
// GET /api/college/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;

    // Student growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const studentGrowth = await User.aggregate([
      { $match: { organization_id: orgId, role: 'student', createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Course enrollments
    const courseEnrollments = await Enrollment.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: '$course_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Department stats
    const departments = await Department.find({ organization_id: orgId, isActive: true });
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const [studentCount, instructorCount, courseCount] = await Promise.all([
          User.countDocuments({ organization_id: orgId, role: 'student', 'profile.department': dept._id }),
          User.countDocuments({ organization_id: orgId, role: 'instructor', 'profile.department': dept._id }),
          Course.countDocuments({ organization_id: orgId, departmentId: dept._id, isActive: true })
        ]);
        return {
          department: dept.name,
          students: studentCount,
          instructors: instructorCount,
          courses: courseCount
        };
      })
    );

    // Attendance rate
    const attendanceStats = await Attendance.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const total = attendanceStats.reduce((acc, curr) => acc + curr.count, 0);
    const present = attendanceStats.find(s => s._id === 'present')?.count || 0;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    // Quiz performance
    const quizPerformance = await require('../models').QuizAttempt.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: null, avgScore: { $avg: '$score' }, totalAttempts: { $sum: 1 } } }
    ]);

    res.success({
      studentGrowth,
      courseEnrollments,
      departmentStats,
      attendanceRate,
      quizPerformance: quizPerformance[0] || { avgScore: 0, totalAttempts: 0 }
    }, 'Analytics retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load analytics', 500);
  }
});

// ===== ACADEMIC PROGRAMS =====
// GET /api/college/admin/programs
router.get('/programs', async (req, res) => {
  try {
    const { AcademicProgram, Department } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const programs = await AcademicProgram.find({ organizationId: orgId, isActive: true })
      .populate('departmentId', 'name code')
      .sort({ name: 1 });
    res.success({ programs }, 'Programs retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load programs', 500);
  }
});

// POST /api/college/admin/programs
router.post('/programs', async (req, res) => {
  try {
    const { AcademicProgram } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { name, code, duration, durationUnit, departmentId, description } = req.body;

    const program = new AcademicProgram({
      name,
      code: code.toUpperCase(),
      duration,
      durationUnit: durationUnit || 'years',
      departmentId,
      description,
      organizationId: orgId,
      organizationType: req.user.organization_type || 'college'
    });
    await program.save();

    res.success({ program }, 'Program created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create program', 500);
  }
});

// GET /api/college/admin/programs/:id
router.get('/programs/:id', async (req, res) => {
  try {
    const { AcademicProgram, Subject, Batch } = require('../../models');
    const program = await AcademicProgram.findById(req.params.id)
      .populate('departmentId', 'name code');
    if (!program) return res.error('Program not found', 'Not found', 404);

    const subjects = await Subject.find({ programId: req.params.id, isActive: true });
    const batches = await Batch.find({ programId: req.params.id, isActive: true });

    res.success({ program, subjects, batches }, 'Program retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load program', 500);
  }
});

// PUT /api/college/admin/programs/:id
router.put('/programs/:id', async (req, res) => {
  try {
    const { AcademicProgram } = require('../../models');
    const updates = req.body;
    const program = await AcademicProgram.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    res.success({ program }, 'Program updated successfully');
  } catch (error) {
    res.error(error.message, 'Failed to update program', 500);
  }
});

// DELETE /api/college/admin/programs/:id
router.delete('/programs/:id', async (req, res) => {
  try {
    const { AcademicProgram } = require('../../models');
    await AcademicProgram.findByIdAndUpdate(req.params.id, { isActive: false });
    res.success({}, 'Program deleted successfully');
  } catch (error) {
    res.error(error.message, 'Failed to delete program', 500);
  }
});

// ===== SUBJECTS =====
// GET /api/college/admin/subjects
router.get('/subjects', async (req, res) => {
  try {
    const { Subject, AcademicProgram, Department } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { programId, semester } = req.query;

    let query = { organizationId: orgId, isActive: true };
    if (programId) query.programId = programId;
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query)
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .populate('instructorId', 'profile.firstName profile.lastName email')
      .sort({ semester: 1, name: 1 });
    res.success({ subjects }, 'Subjects retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load subjects', 500);
  }
});

// POST /api/college/admin/subjects
router.post('/subjects', async (req, res) => {
  try {
    const { Subject } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { name, code, programId, departmentId, semester, credits, description } = req.body;

    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      programId,
      departmentId,
      semester,
      credits: credits || 3,
      description,
      organizationId: orgId,
      organizationType: req.user.organization_type || 'college'
    });
    await subject.save();

    res.success({ subject }, 'Subject created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create subject', 500);
  }
});

// PUT /api/college/admin/subjects/:id/assign-instructor
router.put('/subjects/:id/assign-instructor', async (req, res) => {
  try {
    const { Subject } = require('../../models');
    const { instructorId } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { instructorId },
      { new: true }
    ).populate('instructorId', 'profile.firstName profile.lastName email');
    res.success({ subject }, 'Instructor assigned successfully');
  } catch (error) {
    res.error(error.message, 'Failed to assign instructor', 500);
  }
});

// ===== TIMETABLE =====
// GET /api/college/admin/timetable
router.get('/timetable', async (req, res) => {
  try {
    const { Timetable, Subject, User, Batch, AcademicProgram } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { batchId, day, programId } = req.query;

    let query = { organizationId: orgId, isActive: true };
    if (batchId) query.batchId = batchId;
    if (day) query.day = day;
    if (programId) query.programId = programId;

    const entries = await Timetable.find(query)
      .populate('programId', 'name code')
      .populate('batchId', 'name code')
      .populate('subjectId', 'name code')
      .populate('instructorId', 'profile.firstName profile.lastName email')
      .sort({ day: 1, startTime: 1 });

    res.success({ entries }, 'Timetable entries retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load timetable', 500);
  }
});

// POST /api/college/admin/timetable
router.post('/timetable', async (req, res) => {
  try {
    const { Timetable } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { programId, batchId, subjectId, instructorId, day, startTime, endTime, room } = req.body;

    const entry = new Timetable({
      programId,
      batchId,
      subjectId,
      instructorId,
      day,
      startTime,
      endTime,
      room,
      organizationId: orgId,
      organizationType: req.user.organization_type || 'college'
    });
    await entry.save();

    res.success({ entry }, 'Timetable entry created successfully');
  } catch (error) {
    res.error(error.message, 'Failed to create timetable entry', 500);
  }
});

// DELETE /api/college/admin/timetable/:id
router.delete('/timetable/:id', async (req, res) => {
  try {
    const { Timetable } = require('../../models');
    await Timetable.findByIdAndUpdate(req.params.id, { isActive: false });
    res.success({}, 'Timetable entry deleted successfully');
  } catch (error) {
    res.error(error.message, 'Failed to delete timetable entry', 500);
  }
});

// ===== ATTENDANCE =====
// GET /api/college/admin/attendance
router.get('/attendance', async (req, res) => {
  try {
    const { Attendance, Subject, Batch, User } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { programId, batchId, subjectId, date, studentId } = req.query;

    let query = { organizationId: orgId };
    if (batchId) query.batchId = batchId;
    if (subjectId) query.subjectId = subjectId;
    if (date) query.date = new Date(date);
    if (studentId) query.studentId = studentId;

    const records = await Attendance.find(query)
      .populate('studentId', 'profile.firstName profile.lastName email')
      .populate('subjectId', 'name code')
      .populate('batchId', 'name code')
      .populate('markedBy', 'profile.firstName profile.lastName')
      .sort({ date: -1 });

    res.success({ records }, 'Attendance records retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance', 500);
  }
});

// GET /api/college/admin/attendance/summary
router.get('/attendance/summary', async (req, res) => {
  try {
    const { Attendance, Subject } = require('../../models');
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const { batchId, subjectId, startDate, endDate } = req.query;

    let matchQuery = { organizationId: orgId };
    if (batchId) matchQuery.batchId = batchId;
    if (subjectId) matchQuery.subjectId = subjectId;
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const summary = await Attendance.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    const total = summary.reduce((acc, curr) => acc + curr.count, 0);
    const present = summary.find(s => s._id === 'present')?.count || 0;
    const absent = summary.find(s => s._id === 'absent')?.count || 0;
    const late = summary.find(s => s._id === 'late')?.count || 0;

    res.success({
      summary: { total, present, absent, late },
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0
    }, 'Attendance summary retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load attendance summary', 500);
  }
});

// ===== INSTRUCTOR COURSE APPROVAL =====
// GET /api/college/admin/courses/pending
router.get('/courses/pending', async (req, res) => {
  try {
    const orgId = req.user.organization_id?._id || req.user.organization_id;
    const courses = await Course.find({ 
      organization_id: orgId, 
      status: 'pending',
      isActive: true 
    })
      .populate('instructor_id', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 });
    res.success({ courses }, 'Pending courses retrieved');
  } catch (error) {
    res.error(error.message, 'Failed to load pending courses', 500);
  }
});

// PATCH /api/college/admin/courses/:id/approve
router.patch('/courses/:id/approve', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const update = { 
      status: status || 'published',
      approvedBy: req.user._id,
      approvedAt: new Date()
    };
    if (status === 'rejected' && rejectionReason) {
      update.rejectionReason = rejectionReason;
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!course) return res.error('Course not found', 'Not found', 404);

    // Notify instructor
    // TODO: Add notification system

    res.success({ course }, `Course ${status || 'published'} successfully`);
  } catch (error) {
    res.error(error.message, 'Failed to update course status', 500);
  }
});

module.exports = router;
