/* eslint-disable no-console */

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-jwt-secret';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '7d';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const { Organization, User, Course } = require('../src/models');
const Notification = require('../src/models/Notification');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });
    return { type: 'real', uri: mongoUri };
  }

  const mongo = await MongoMemoryServer.create({
    binary: { version: '4.4.29' }
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000
  });
  return { type: 'memory', mongo, uri };
}

async function login(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  if (!res.body?.success) {
    throw new Error(`Login failed for ${email}: ${res.body?.error || res.body?.message || res.text}`);
  }
  return res.body.data.token;
}

async function api(method, path, token, body) {
  let r = request(app)[method](path).set('Authorization', `Bearer ${token}`);
  if (body) r = r.send(body);
  const res = await r;
  if (!res.body?.success) {
    const details = res.body?.error || res.body?.message || res.text;
    throw new Error(`${method.toUpperCase()} ${path} failed: ${details}`);
  }
  return res.body.data;
}

async function main() {
  const dbInfo = await connectDB();

  const passwords = {
    orgAdmin: 'Password123!A',
    instructor: 'Password123!B',
    student: 'Password123!C'
  };

  const emails = {
    orgAdmin: 'orgadmin+routes@test.com',
    instructor: 'instructor+routes@test.com',
    student: 'student+routes@test.com'
  };

  try {
    await Notification.deleteMany({});
    await User.deleteMany({ email: { $in: Object.values(emails) } });
    await Organization.deleteMany({ name: 'Routes Test College' });

    const collegeOrg = await Organization.create({
      name: 'Routes Test College',
      type: 'college',
      organizationType: 'college',
      subdomain: 'routes-test-college',
      email: 'routes-test-college@test.com',
      status: 'active',
      modulesEnabled: ['DEPARTMENTS', 'BATCHES', 'SUBJECTS', 'SEMESTERS']
    });

    await User.create({
      name: 'Routes Org Admin',
      email: emails.orgAdmin,
      password_hash: passwords.orgAdmin,
      role: 'org_admin',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: collegeOrg._id,
      organization_code: collegeOrg.code,
      organizationType: 'college'
    });

    await User.create({
      name: 'Routes Instructor',
      email: emails.instructor,
      password_hash: passwords.instructor,
      role: 'instructor',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: collegeOrg._id,
      organization_code: collegeOrg.code,
      organizationType: 'college'
    });

    await User.create({
      name: 'Routes Student',
      email: emails.student,
      password_hash: passwords.student,
      role: 'student',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: collegeOrg._id,
      organization_code: collegeOrg.code,
      organizationType: 'college'
    });

    const orgAdminToken = await login(emails.orgAdmin, passwords.orgAdmin);
    const instructorToken = await login(emails.instructor, passwords.instructor);
    const studentToken = await login(emails.student, passwords.student);

    const instructor = await User.findOne({ email: emails.instructor }).lean();
    const student = await User.findOne({ email: emails.student }).lean();

    // Create academic hierarchy
    const dept = (await api('post', '/api/college/admin/departments', orgAdminToken, {
      name: 'Computer Science',
      code: 'CSE',
      description: 'CSE Department'
    })).department;

    const program = (await api('post', '/api/college/admin/programs', orgAdminToken, {
      name: 'BCA',
      code: 'BCA',
      duration: 3,
      durationUnit: 'years',
      departmentId: dept._id,
      description: 'BCA Program'
    })).program;

    const batch = (await api('post', '/api/college/admin/batches', orgAdminToken, {
      name: 'BCA-2024',
      code: 'BCA-2024',
      programId: program._id,
      departmentId: dept._id,
      year: 2024,
      semester: 1
    })).batch;

    // Create a course (existing module) and link to Subject via contentCourseId
    const course = await Course.create({
      organization_id: collegeOrg._id,
      title: 'Programming Fundamentals - Content',
      description: 'Content course for subject',
      price: 0,
      category: 'Academic',
      level: 'beginner',
      status: 'published',
      instructor_id: instructor._id,
      isActive: true
    });

    const subject = (await api('post', '/api/college/admin/subjects', orgAdminToken, {
      name: 'Programming Fundamentals',
      code: 'PF',
      programId: program._id,
      departmentId: dept._id,
      batchId: batch._id,
      semester: 1,
      credits: 3,
      instructorId: instructor._id,
      contentCourseId: course._id
    })).subject;

    await api('post', '/api/college/admin/subjects/assign-instructor', orgAdminToken, {
      subjectId: subject._id,
      instructorId: instructor._id
    });

    await api('post', '/api/college/admin/timetable', orgAdminToken, {
      programId: program._id,
      batchId: batch._id,
      subjectId: subject._id,
      instructorId: instructor._id,
      day: 'Monday',
      startTime: '10:00',
      endTime: '11:00',
      room: 'Room-101'
    });

    await api('post', '/api/college/admin/batches/assign-students', orgAdminToken, {
      batchId: batch._id,
      studentIds: [student._id]
    });

    // Instructor: my-subjects
    const mySubjects = await api('get', '/api/college/instructor/my-subjects', instructorToken);
    if (!mySubjects?.subjects?.length) throw new Error('Instructor my-subjects returned empty');

    // Student: subjects + timetable
    const studSubjects = await api('get', '/api/college/student/subjects', studentToken);
    if (!studSubjects?.subjects?.length) throw new Error('Student subjects returned empty');

    const studTimetable = await api('get', '/api/college/student/timetable', studentToken);
    if (!studTimetable?.entries?.length) throw new Error('Student timetable returned empty');

    // Create quiz (existing module) => should broadcast to batch via contentCourseId
    await api('post', '/api/quizzes', instructorToken, {
      course_id: course._id,
      title: 'Quiz 1',
      description: 'Test quiz',
      questions: [{ question: '1+1?', options: ['1', '2', '3', '4'], correct_answer: 1 }],
      timer_minutes: 10,
      pass_percentage: 60,
      max_attempts: 3
    });

    // Create live class (existing module) => should broadcast to batch via contentCourseId
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + 1);
    await api('post', '/api/live-classes', instructorToken, {
      course_id: course._id,
      title: 'Live Session 1',
      description: 'Intro',
      scheduled_date: scheduled.toISOString(),
      start_time: '10:00',
      duration_minutes: 30,
      recording_enabled: false,
      max_participants: 50,
      timezone: 'UTC'
    });

    // Create event (existing module) => should broadcast to batch via contentCourseId
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 2);
    await api('post', '/api/events', instructorToken, {
      title: 'Exam Notice',
      description: 'Mid-term exam announced',
      event_date: eventDate.toISOString(),
      all_day: false,
      start_time: '10:00',
      end_time: '11:00',
      course_specific: course._id
    });

    // Create assignment (new module) => should broadcast to batch via contentCourseId
    const due = new Date();
    due.setDate(due.getDate() + 5);
    const createdAssignment = (await api('post', '/api/assignments', instructorToken, {
      course_id: course._id,
      title: 'Assignment 1',
      description: 'Write a simple program',
      due_date: due.toISOString(),
      max_score: 100
    })).assignment;
    if (!createdAssignment?._id) throw new Error('Assignment creation failed');

    // Student: list assignments
    const assignmentsList = await api('get', `/api/assignments?course_id=${course._id}`, studentToken);
    if (!assignmentsList?.assignments?.length) throw new Error('Student assignments list returned empty');

    // Student: submit assignment
    const createdSubmission = (await api('post', '/api/submissions', studentToken, {
      assignment_id: createdAssignment._id,
      content: 'My submission text',
      attachments: []
    })).submission;
    if (!createdSubmission?._id) throw new Error('Submission creation failed');

    // Instructor: list submissions for assignment
    const submissionsList = await api('get', `/api/submissions?assignment_id=${createdAssignment._id}`, instructorToken);
    if (!submissionsList?.submissions?.length) throw new Error('Instructor submissions list returned empty');

    // Instructor: grade submission
    await api('patch', `/api/submissions/${createdSubmission._id}/grade`, instructorToken, {
      earned_score: 80,
      comments: 'Good job'
    });

    // Allow setImmediate broadcasts to complete
    await new Promise(r => setTimeout(r, 200));

    const studentNotifs = await Notification.find({
      organization_id: collegeOrg._id,
      recipient_id: student._id
    }).lean();

    if (studentNotifs.length < 3) {
      throw new Error(`Expected broadcast notifications for student, found ${studentNotifs.length}`);
    }

    console.log('✅ testCollegeRoutes.js PASSED');
  } finally {
    await mongoose.disconnect();
    if (dbInfo?.type === 'memory' && dbInfo?.mongo) await dbInfo.mongo.stop();
  }
}

main().catch((err) => {
  console.error('❌ testCollegeRoutes.js FAILED');
  console.error(err);
  process.exit(1);
});
