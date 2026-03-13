/* eslint-disable no-console */

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-jwt-secret';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '7d';

let shuttingDown = false;

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('./src/app');
const { Organization, User } = require('./src/models');

// The app bootstrapping registers its own unhandledRejection handler that
// turns shutdown-time MongoClientClosedError into a process failure.
// For this standalone script we override that behavior.
process.removeAllListeners('unhandledRejection');
process.on('unhandledRejection', (err) => {
  const msg = String(err?.message || err);
  if (msg.includes('MongoClientClosedError')) return;
  console.error('Unhandled promise rejection:', err);
  process.exitCode = 1;
});

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
    throw new Error(`Login failed for ${email}: ${res.body?.message || res.text}`);
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
    orgAdmin: 'orgadmin+e2e@test.com',
    instructor: 'instructor+e2e@test.com',
    student: 'student+e2e@test.com'
  };

  try {
    await User.deleteMany({ email: { $in: Object.values(emails) } });
    await Organization.deleteMany({ name: 'E2E College' });

    const collegeOrg = await Organization.create({
      name: 'E2E College',
      type: 'college',
      organizationType: 'college',
      subdomain: 'e2e-college',
      email: 'e2e-college@test.com',
      status: 'active',
      modulesEnabled: [
        'DEPARTMENTS',
        'BATCHES',
        'SUBJECTS',
        'SEMESTERS'
      ]
    });

    await User.create({
      name: 'E2E Org Admin',
      email: emails.orgAdmin,
      password_hash: passwords.orgAdmin,
      role: 'org_admin',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: collegeOrg._id,
      organization_code: collegeOrg.code,
      organizationType: 'COLLEGE'
    });

    await User.create({
      name: 'E2E Instructor',
      email: emails.instructor,
      password_hash: passwords.instructor,
      role: 'instructor',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: collegeOrg._id,
      organization_code: collegeOrg.code,
      organizationType: 'COLLEGE'
    });

    await User.create({
      name: 'E2E Student',
      email: emails.student,
      password_hash: passwords.student,
      role: 'student',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: collegeOrg._id,
      organization_code: collegeOrg.code,
      organizationType: 'COLLEGE'
    });

    const orgAdminToken = await login(emails.orgAdmin, passwords.orgAdmin);
    const instructorToken = await login(emails.instructor, passwords.instructor);
    const studentToken = await login(emails.student, passwords.student);

    // 1) Department
    const dept = (await api('post', '/api/college/admin/departments', orgAdminToken, {
      name: 'Computer Science',
      code: 'CSE',
      description: 'CSE Department'
    })).department;

    // 2) Program
    const program = (await api('post', '/api/college/admin/programs', orgAdminToken, {
      name: 'BCA',
      code: 'BCA',
      duration: 3,
      durationUnit: 'years',
      departmentId: dept._id,
      description: 'BCA Program'
    })).program;

    // 3) Batch
    const batch = (await api('post', '/api/college/admin/batches', orgAdminToken, {
      name: 'BCA-2024',
      code: 'BCA-2024',
      programId: program._id,
      departmentId: dept._id,
      year: 2024,
      semester: 1
    })).batch;

    // 4) Subject
    const subject = (await api('post', '/api/college/admin/subjects', orgAdminToken, {
      name: 'Programming Fundamentals',
      code: 'PF',
      programId: program._id,
      departmentId: dept._id,
      semester: 1,
      credits: 3
    })).subject;

    // 5) Assign instructor to subject
    const instructor = await User.findOne({ email: emails.instructor }).lean();
    await api('post', '/api/college/admin/subjects/assign-instructor', orgAdminToken, {
      subjectId: subject._id,
      instructorId: instructor._id
    });

    // 6) Assign student to batch
    const student = await User.findOne({ email: emails.student }).lean();
    await api('put', `/api/college/admin/batches/${batch._id}/assign-students`, orgAdminToken, {
      studentIds: [student._id]
    });

    // 7) Timetable
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

    // 8) Instructor dashboard should show academic info
    const instructorDash = await api('get', '/api/college/instructor/dashboard', instructorToken);
    if (!instructorDash?.academic?.subjectsTeaching?.length) {
      throw new Error('Instructor dashboard academic.subjectsTeaching is empty');
    }

    // 9) Student dashboard should show academic info
    const studentDash = await api('get', '/api/college/student/dashboard', studentToken);
    if (!studentDash?.academic?.subjects?.length) {
      throw new Error('Student dashboard academic.subjects is empty');
    }
    if (!studentDash?.academic?.timetable?.length) {
      throw new Error('Student dashboard academic.timetable is empty');
    }

    // 10) Mark attendance for today (academic)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await api('post', '/api/college/instructor/attendance', instructorToken, {
      subjectId: subject._id,
      batchId: batch._id,
      studentId: student._id,
      date: today.toISOString(),
      status: 'present',
      startTime: '10:00',
      endTime: '11:00'
    });

    // 11) Student attendance should include at least 1 record
    const studentAttendance = await api('get', '/api/college/student/attendance', studentToken);
    if (!studentAttendance?.records?.length) {
      throw new Error('Student attendance records is empty after marking attendance');
    }

    console.log('✅ E2E college academic flow PASSED');
    console.log(JSON.stringify({
      departmentId: dept._id,
      programId: program._id,
      batchId: batch._id,
      subjectId: subject._id
    }, null, 2));
  } finally {
    shuttingDown = true;
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore shutdown errors
    }
    if (dbInfo?.type === 'memory' && dbInfo?.mongo) {
      try {
        await dbInfo.mongo.stop();
      } catch (e) {
        // ignore shutdown errors
      }
    }
  }
}

main().catch((err) => {
  console.error('❌ E2E flow FAILED');
  console.error(err);
  process.exit(1);
});
