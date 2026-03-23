const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Organization, User, Course, Enrollment, Attendance, LiveClass, Quiz, QuizAttempt, Certificate, CollegeInstructor, CollegeStudent } = require('../../models');
const emailService = require('../../services/email.service');
const { createActivityLog } = require('../../services/activityLogService');

function normalizeOrgId(user) {
  return user.organization_id?._id || user.organization_id;
}

function ensureCollegeOrg(req) {
  const orgId = req.collegeOrganizationId || normalizeOrgId(req.user);
  if (!orgId) {
    const err = new Error('Organization affiliation required');
    err.statusCode = 403;
    throw err;
  }
  return orgId;
}

function randomPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

async function sendUserCreationEmail({ to, name, email, password }) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const loginUrl = `${clientUrl}/login`;
  await emailService.sendTemplatedEmail({
    to,
    templateName: 'user_creation',
    data: { name, email, password, loginUrl }
  });
}

exports.getDashboard = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const [studentsCount, instructorsCount, coursesCount] = await Promise.all([
      User.countDocuments({ organization_id: organizationId, role: 'student', is_deleted: { $ne: true } }),
      User.countDocuments({ organization_id: organizationId, role: 'instructor', is_deleted: { $ne: true } }),
      Course.countDocuments({ organization_id: organizationId, is_deleted: { $ne: true } })
    ]);

    const recentEnrollments = await Enrollment.find({ organization_id: organizationId, status: { $ne: 'cancelled' } })
      .sort({ enrolledAt: -1 })
      .limit(10)
      .populate('student_id', 'name email')
      .populate('course_id', 'title')
      .lean();

    const liveClasses = await LiveClass.find({ organization_id: organizationId, scheduled_date: { $gte: new Date() }, is_active: true })
      .sort({ scheduled_date: 1 })
      .limit(10)
      .populate('course_id', 'title')
      .populate('instructor_id', 'name email')
      .lean();

    const ActivityLog = mongoose.model('ActivityLog');
    const activityFeed = await ActivityLog.find({ organizationId: organizationId, organizationType: 'college' })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean()
      .catch(() => []);

    return res.status(200).json({
      success: true,
      data: {
        studentsCount,
        instructorsCount,
        coursesCount,
        liveClasses,
        recentEnrollments,
        activityFeed
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.createInstructor = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const { name, email, phone, department, bio } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'name and email are required' });
    }

    const org = await Organization.findById(organizationId).select('type is_deleted');
    if (!org || org.is_deleted) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    if (String(org.type).toLowerCase() !== 'college') {
      return res.status(403).json({ success: false, message: 'College tenant access required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase(), organization_id: organizationId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Instructor email already exists' });
    }

    const password = randomPassword();
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password, // Hashed by model hook
      role: 'instructor',
      organization_id: organizationId,
      status: 'active',
      email_verified: true,
      profile: {
        phone: phone || undefined,
        department: department || undefined,
        bio: bio || undefined
      },
      organizationType: 'college'
    });

    const instructorProfile = await CollegeInstructor.create({
      userId: user._id,
      name,
      email: user.email,
      phone,
      department,
      bio,
      organizationId,
      organizationType: 'college',
      status: 'active',
      createdAt: new Date()
    });

    try {
      await sendUserCreationEmail({ to: user.email, name, email: user.email, password });
    } catch (_) {
    }

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Instructor created',
      metadata: { instructorId: user._id, email: user.email }
    });

    return res.status(201).json({
      success: true,
      data: { user: user.toPublicJSON(), instructorProfile },
      message: 'Instructor created'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.listInstructors = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const instructors = await User.find({ organization_id: organizationId, role: 'instructor', is_deleted: { $ne: true } })
      .select('-password_hash')
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({ success: true, data: instructors });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.getInstructor = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);
    const { id } = req.params;

    const instructor = await User.findOne({ _id: id, organization_id: organizationId, role: 'instructor' }).select('-password_hash');
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    const courses = await Course.find({ organization_id: organizationId, instructor_id: instructor._id }).lean();

    const courseIds = courses.map(c => c._id);

    const [students, liveClasses, quizzes, activity] = await Promise.all([
      Enrollment.find({ organization_id: organizationId, course_id: { $in: courseIds } }).populate('student_id', 'name email').lean(),
      LiveClass.find({ organization_id: organizationId, instructor_id: instructor._id }).populate('course_id', 'title').lean(),
      Quiz.find({ organization_id: organizationId, instructor_id: instructor._id }).populate('course_id', 'title').lean(),
      mongoose.model('ActivityLog').find({ organizationId: organizationId, organizationType: 'college', userId: instructor._id }).sort({ createdAt: -1 }).limit(50).lean()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        instructor: instructor.toPublicJSON(),
        courses,
        students,
        liveClasses,
        quizzes,
        activity
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.updateInstructor = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);
    const { id } = req.params;
    const { name, phone, department, bio, status } = req.body;

    const instructor = await User.findOne({ _id: id, organization_id: organizationId, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    if (name) instructor.name = name;
    if (status) instructor.status = status;

    instructor.profile = instructor.profile || {};
    if (phone !== undefined) instructor.profile.phone = phone;
    if (department !== undefined) instructor.profile.department = department;
    if (bio !== undefined) instructor.profile.bio = bio;

    await instructor.save();

    await CollegeInstructor.findOneAndUpdate(
      { userId: instructor._id },
      {
        name: instructor.name,
        phone: instructor.profile.phone,
        department: instructor.profile.department,
        bio: instructor.profile.bio,
        status: instructor.status
      },
      { upsert: true, new: true }
    );

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Instructor updated',
      metadata: { instructorId: instructor._id }
    });

    return res.status(200).json({ success: true, data: instructor.toPublicJSON(), message: 'Instructor updated' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);
    const { id } = req.params;

    const instructor = await User.findOne({ _id: id, organization_id: organizationId, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    await instructor.softDelete(req.user._id);
    await CollegeInstructor.deleteOne({ userId: instructor._id });

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Instructor deleted',
      metadata: { instructorId: instructor._id }
    });

    return res.status(200).json({ success: true, message: 'Instructor deleted' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const { name, email, phone, department, year, rollNumber } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase(), organization_id: organizationId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Student email already exists' });
    }

    const password = randomPassword();
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password, // Hashed by model hook
      role: 'student',
      organization_id: organizationId,
      status: 'active',
      email_verified: true,
      profile: {
        phone: phone || undefined,
        department: department || undefined,
        current_semester: undefined
      },
      organizationType: 'college'
    });

    const studentProfile = await CollegeStudent.create({
      userId: user._id,
      name,
      email: user.email,
      phone,
      department,
      year,
      rollNumber,
      organizationId,
      organizationType: 'college',
      status: 'active',
      createdAt: new Date()
    });

    try {
      await sendUserCreationEmail({ to: user.email, name, email: user.email, password });
    } catch (_) {
    }

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Student created',
      metadata: { studentId: user._id, email: user.email }
    });

    return res.status(201).json({
      success: true,
      data: { user: user.toPublicJSON(), studentProfile },
      message: 'Student created'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.listStudents = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const { course, department, year } = req.query;

    const userQuery = { organization_id: organizationId, role: 'student', is_deleted: { $ne: true } };

    let idsFilter = null;
    if (course) {
      const enrollments = await Enrollment.find({ organization_id: organizationId, course_id: course }).select('student_id').lean();
      idsFilter = enrollments.map(e => e.student_id);
      userQuery._id = { $in: idsFilter };
    }

    const students = await User.find(userQuery).select('-password_hash').sort({ created_at: -1 });

    const studentsArr = students.map(s => s.toPublicJSON());

    const profileQuery = { organizationId, organizationType: 'college' };
    if (department) profileQuery.department = department;
    if (year) profileQuery.year = Number(year);

    const profiles = await CollegeStudent.find(profileQuery).select('userId department year rollNumber').lean();
    const profileMap = new Map(profiles.map(p => [String(p.userId), p]));

    const merged = studentsArr
      .map(u => ({
        ...u,
        college: profileMap.get(String(u.id || u._id)) || null
      }))
      .filter(u => {
        if (department && u.college?.department !== department) return false;
        if (year && Number(u.college?.year) !== Number(year)) return false;
        return true;
      });

    return res.status(200).json({ success: true, data: merged });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);
    const { id } = req.params;

    const student = await User.findOne({ _id: id, organization_id: organizationId, role: 'student' }).select('-password_hash');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const [enrollments, attendanceSummary, certificates, activity] = await Promise.all([
      Enrollment.find({ organization_id: organizationId, student_id: student._id }).populate('course_id', 'title').lean(),
      Attendance.getStudentAttendanceSummary(student._id, organizationId).catch(() => null),
      Certificate.find({ organization_id: organizationId, user_id: student._id }).populate('course_id', 'title').lean().catch(() => []),
      mongoose.model('ActivityLog').find({ organizationId: organizationId, organizationType: 'college', userId: student._id }).sort({ createdAt: -1 }).limit(50).lean()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        student: student.toPublicJSON(),
        courses: enrollments,
        attendance: attendanceSummary,
        progress: enrollments.map(e => ({ courseId: e.course_id?._id, completion: e.progress?.completionPercentage || 0 })),
        certificates,
        activity
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.suspendStudent = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);
    const { id } = req.params;

    const student = await User.findOne({ _id: id, organization_id: organizationId, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.status = 'suspended';
    student.isActive = false;
    await student.save();

    await CollegeStudent.findOneAndUpdate({ userId: student._id }, { status: 'suspended' }, { upsert: true });

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Student suspended',
      metadata: { studentId: student._id }
    });

    return res.status(200).json({ success: true, message: 'Student suspended' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const { title, description, instructorId } = req.body;
    if (!title || !description || !instructorId) {
      return res.status(400).json({ success: false, message: 'title, description, instructorId are required' });
    }

    const instructor = await User.findOne({ _id: instructorId, organization_id: organizationId, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    const course = await Course.create({
      organization_id: organizationId,
      title,
      description,
      price: 0,
      category: 'college',
      status: 'draft',
      instructor_id: instructor._id,
      isPublic: false,
      isActive: true
    });

    await CollegeInstructor.findOneAndUpdate(
      { userId: instructor._id },
      { $addToSet: { courses: course._id }, organizationId, organizationType: 'college', email: instructor.email, name: instructor.name },
      { upsert: true }
    );

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Instructor created course',
      metadata: { courseId: course._id, instructorId: instructor._id, title: course.title }
    });

    return res.status(201).json({ success: true, data: course, message: 'Course created' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const courses = await Course.find({ organization_id: organizationId, is_deleted: { $ne: true } })
      .populate('instructor_id', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, organization_id: organizationId }).populate('instructor_id', 'name email');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const [modules, enrollments, quizzes, liveClasses] = await Promise.all([
      mongoose.model('Section').find({ course_id: course._id, organization_id: organizationId }).sort({ order: 1 }).lean().catch(() => []),
      Enrollment.find({ course_id: course._id, organization_id: organizationId }).populate('student_id', 'name email').lean(),
      Quiz.find({ course_id: course._id, organization_id: organizationId }).lean(),
      LiveClass.find({ course_id: course._id, organization_id: organizationId }).sort({ scheduled_date: -1 }).lean()
    ]);

    const analytics = {
      totalEnrollments: enrollments.length,
      attendanceRate: null,
      quizPerformance: null
    };

    return res.status(200).json({
      success: true,
      data: {
        course,
        modules,
        students: enrollments,
        quizzes,
        liveClasses,
        analytics
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.assignInstructor = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);
    const { id } = req.params;
    const { instructorId } = req.body;

    const course = await Course.findOne({ _id: id, organization_id: organizationId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const instructor = await User.findOne({ _id: instructorId, organization_id: organizationId, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    course.instructor_id = instructor._id;
    await course.save();

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Instructor assigned to course',
      metadata: { courseId: course._id, instructorId: instructor._id }
    });

    return res.status(200).json({ success: true, data: course, message: 'Instructor assigned' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.importStudents = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const text = req.file.buffer.toString('utf8');
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: 'CSV must include header and at least one row' });
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idx = (key) => header.indexOf(key);

    const requiredKeys = ['name', 'email'];
    for (const k of requiredKeys) {
      if (idx(k) === -1) {
        return res.status(400).json({ success: false, message: `Missing CSV column: ${k}` });
      }
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      rows: []
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());

      const name = cols[idx('name')] || '';
      const email = (cols[idx('email')] || '').toLowerCase();
      const phone = idx('phone') !== -1 ? (cols[idx('phone')] || '') : '';
      const department = idx('department') !== -1 ? (cols[idx('department')] || '') : '';
      const yearRaw = idx('year') !== -1 ? (cols[idx('year')] || '') : '';
      const rollNumber = idx('rollnumber') !== -1 ? (cols[idx('rollnumber')] || '') : (idx('roll_number') !== -1 ? (cols[idx('roll_number')] || '') : '');

      if (!name || !email) {
        results.errors += 1;
        results.rows.push({ row: i + 1, status: 'error', message: 'Missing name/email' });
        continue;
      }

      const existing = await User.findOne({ email, organization_id: organizationId });
      if (existing) {
        results.skipped += 1;
        results.rows.push({ row: i + 1, status: 'skipped', email, message: 'Email already exists' });
        continue;
      }

      const password = randomPassword();
      const year = yearRaw ? Number(yearRaw) : undefined;

      const user = await User.create({
        name,
        email,
        password_hash: password, // Hashed by model hook
        role: 'student',
        organization_id: organizationId,
        status: 'active',
        email_verified: true,
        profile: {
          phone: phone || undefined,
          department: department || undefined
        },
        organizationType: 'college'
      });

      await CollegeStudent.create({
        userId: user._id,
        name,
        email: user.email,
        phone,
        department,
        year,
        rollNumber,
        organizationId,
        organizationType: 'college',
        status: 'active',
        createdAt: new Date()
      });

      try {
        await sendUserCreationEmail({ to: user.email, name, email: user.email, password });
      } catch (_) {
      }

      results.created += 1;
      results.rows.push({ row: i + 1, status: 'created', email, userId: user._id });
    }

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Students imported',
      metadata: { created: results.created, skipped: results.skipped, errors: results.errors }
    });

    return res.status(200).json({ success: true, data: results, message: 'Import processed' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ success: false, message: 'studentId and courseId are required' });
    }

    const student = await User.findOne({ _id: studentId, organization_id: organizationId, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const course = await Course.findOne({ _id: courseId, organization_id: organizationId, is_deleted: { $ne: true } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { organization_id: organizationId, student_id: student._id, course_id: course._id },
      {
        $setOnInsert: {
          organization_id: organizationId,
          organizationType: 'college',
          student_id: student._id,
          course_id: course._id,
          enrollmentType: 'free',
          status: 'active',
          enrolledAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    await createActivityLog({
      organizationId,
      userId: req.user._id,
      role: req.user.role,
      action: 'Student enrolled',
      metadata: { studentId: student._id, courseId: course._id }
    });

    return res.status(200).json({ success: true, data: enrollment, message: 'Student enrolled' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const organizationId = ensureCollegeOrg(req);

    const [studentsCount, instructorsCount, coursesCount, enrollments, attendanceDocs, quizAttempts] = await Promise.all([
      User.countDocuments({ organization_id: organizationId, role: 'student', is_deleted: { $ne: true } }),
      User.countDocuments({ organization_id: organizationId, role: 'instructor', is_deleted: { $ne: true } }),
      Course.countDocuments({ organization_id: organizationId, is_deleted: { $ne: true } }),
      Enrollment.find({ organization_id: organizationId }).select('student_id course_id status enrolledAt').lean(),
      Attendance.find({ organization_id: organizationId }).select('attendance_records status session_date').lean().catch(() => []),
      QuizAttempt.find({ organization_id: organizationId }).select('percentage passed submitted_at').lean().catch(() => [])
    ]);

    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const studentGrowth = {
      last30Days: await User.countDocuments({ organization_id: organizationId, role: 'student', created_at: { $gte: last30 }, is_deleted: { $ne: true } })
    };

    const courseEnrollments = {
      total: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length
    };

    let attendanceRate = null;
    if (attendanceDocs && attendanceDocs.length > 0) {
      let total = 0;
      let presentish = 0;
      attendanceDocs.forEach(doc => {
        (doc.attendance_records || []).forEach(r => {
          total += 1;
          if (['present', 'late'].includes(r.status)) presentish += 1;
        });
      });
      attendanceRate = total > 0 ? Math.round((presentish / total) * 100) : 0;
    }

    let quizPerformance = null;
    if (quizAttempts && quizAttempts.length > 0) {
      const avg = quizAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / quizAttempts.length;
      const passRate = Math.round((quizAttempts.filter(a => a.passed).length / quizAttempts.length) * 100);
      quizPerformance = { averagePercentage: Math.round(avg), passRate, totalAttempts: quizAttempts.length };
    }

    return res.status(200).json({
      success: true,
      data: {
        studentsCount,
        instructorsCount,
        coursesCount,
        studentGrowth,
        courseEnrollments,
        attendanceRate,
        quizPerformance
      }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
