/* eslint-disable no-console */

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-jwt-secret';
if (!process.env.JWT_EXPIRES_IN) process.env.JWT_EXPIRES_IN = '7d';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const {
  AcademicEnrollment,
  AcademicProgram,
  Batch,
  Department,
  Notification,
  Organization,
  Subject,
  Timetable,
  User
} = require('../src/models');

async function connectDB() {
  const mongo = await MongoMemoryServer.create({
    binary: { version: '4.4.29' }
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000
  });
  return { mongo, uri };
}

async function loginOrgAdmin(email, password) {
  const res = await request(app)
    .post('/api/auth/org-admin/login')
    .send({ email, password });

  if (!res.body?.success) {
    throw new Error(`Org admin login failed: ${res.body?.message || res.text}`);
  }

  return res.body.data.token;
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function main() {
  const { mongo } = await connectDB();

  const passwords = {
    orgAdmin: 'Password123!A',
    instructor: 'Password123!B',
    student: 'Password123!C'
  };

  const emails = {
    orgAdmin: 'orgadmin+assign@test.com',
    instructor: 'instructor+assign@test.com',
    student: 'student+assign@test.com'
  };

  try {
    await Promise.all([
      AcademicEnrollment.deleteMany({}),
      Timetable.deleteMany({}),
      Subject.deleteMany({}),
      Batch.deleteMany({}),
      AcademicProgram.deleteMany({}),
      Department.deleteMany({}),
      Notification.deleteMany({}),
      User.deleteMany({ email: { $in: Object.values(emails) } }),
      Organization.deleteMany({ name: 'Enrollment Engine Org' })
    ]);

    const org = await Organization.create({
      name: 'Enrollment Engine Org',
      type: 'college',
      organizationType: 'college',
      subdomain: 'enrollment-engine-org',
      email: 'enrollment-engine-org@test.com',
      status: 'active',
      modulesEnabled: ['DEPARTMENTS', 'BATCHES', 'SUBJECTS', 'SEMESTERS']
    });

    const department = await Department.create({
      organization_id: org._id,
      name: 'Computer Science',
      code: 'CSE',
      createdBy: new mongoose.Types.ObjectId()
    });

    const orgAdmin = await User.create({
      name: 'Org Admin',
      email: emails.orgAdmin,
      password_hash: passwords.orgAdmin,
      role: 'org_admin',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: org._id,
      organization_code: org.code,
      organizationType: 'college'
    });

    const instructor = await User.create({
      name: 'Instructor',
      email: emails.instructor,
      password_hash: passwords.instructor,
      role: 'instructor',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: org._id,
      organization_code: org.code,
      organizationType: 'college'
    });

    const student = await User.create({
      name: 'Student',
      email: emails.student,
      password_hash: passwords.student,
      role: 'student',
      status: 'active',
      isActive: true,
      email_verified: true,
      organization_id: org._id,
      organization_code: org.code,
      organizationType: 'college',
      profile: {}
    });

    const program = await AcademicProgram.create({
      name: 'BCA',
      code: 'BCA',
      duration: 3,
      durationUnit: 'years',
      departmentId: department._id,
      organizationId: org._id,
      organizationType: 'college',
      isActive: true
    });

    const batch = await Batch.create({
      organizationId: org._id,
      organizationType: 'college',
      name: 'BCA 2024',
      code: 'BCA-2024',
      programId: program._id,
      departmentId: department._id,
      year: 2024,
      semester: 1,
      students: [],
      isActive: true
    });

    const subj1 = await Subject.create({
      organizationId: org._id,
      organizationType: 'college',
      departmentId: department._id,
      programId: program._id,
      name: 'Programming Fundamentals',
      code: 'PF',
      semester: 1,
      instructorId: instructor._id,
      isActive: true
    });

    const subj2 = await Subject.create({
      organizationId: org._id,
      organizationType: 'college',
      departmentId: department._id,
      programId: program._id,
      name: 'Mathematics I',
      code: 'M1',
      semester: 1,
      isActive: true
    });

    // Timetable instructor mapping fallback (for subj2)
    await Timetable.create({
      organizationId: org._id,
      organizationType: 'college',
      programId: program._id,
      batchId: batch._id,
      subjectId: subj2._id,
      instructorId: instructor._id,
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      isActive: true
    });

    const token = await loginOrgAdmin(emails.orgAdmin, passwords.orgAdmin);

    // 1) Assign student -> success
    const assignRes = await request(app)
      .post('/api/admin/learners/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId: student._id, programId: program._id, batchId: batch._id });

    assert(assignRes.status === 200, `Assign expected 200 got ${assignRes.status}: ${JSON.stringify(assignRes.body)}`);
    assert(assignRes.body?.success, `Assign expected success true: ${JSON.stringify(assignRes.body)}`);

    // 2) Check student updated
    const updatedStudent = await User.findById(student._id).lean();
    assert(String(updatedStudent.profile?.program_id) === String(program._id), 'Student program_id not updated');
    assert(String(updatedStudent.profile?.batch) === String(batch._id), 'Student batch not updated');
    assert(String(updatedStudent.profile?.department) === String(department._id), 'Student department not updated');
    assert(Number(updatedStudent.profile?.current_semester) === 1, 'Student current_semester not updated');

    // 3) Check enrollment created (2 subjects)
    const enrollments = await AcademicEnrollment.find({ organizationId: org._id, studentId: student._id }).lean();
    assert(enrollments.length === 2, `Expected 2 enrollments, got ${enrollments.length}`);

    // 4) Check instructor linked (subj1 direct, subj2 via timetable)
    const bySubject = new Map(enrollments.map((e) => [String(e.subjectId), e]));
    assert(String(bySubject.get(String(subj1._id)).instructorId) === String(instructor._id), 'Instructor mapping for subj1 incorrect');
    assert(String(bySubject.get(String(subj2._id)).instructorId) === String(instructor._id), 'Instructor mapping for subj2 incorrect');

    // 5) Check timetable visible (exists for batch)
    const timetableRows = await Timetable.find({ organizationId: org._id, batchId: batch._id, isActive: true }).lean();
    assert(timetableRows.length >= 1, 'Expected timetable rows for batch');

    // 6) Check student dashboard shows subjects (via /student/subjects)
    const studentLoginRes = await request(app).post('/api/auth/login').send({ email: emails.student, password: passwords.student });
    assert(studentLoginRes.body?.success, `Student login failed: ${JSON.stringify(studentLoginRes.body)}`);
    const studentToken = studentLoginRes.body.data.token;

    const studentSubjectsRes = await request(app)
      .get('/student/subjects')
      .set('Authorization', `Bearer ${studentToken}`);
    assert(studentSubjectsRes.body?.success, `Student subjects API failed: ${JSON.stringify(studentSubjectsRes.body)}`);
    assert((studentSubjectsRes.body.data || []).length === 2, 'Student subjects API did not return 2 subjects');

    // 7) Instructor sees student (via enrollments)
    const instructorLoginRes = await request(app).post('/api/auth/login').send({ email: emails.instructor, password: passwords.instructor });
    assert(instructorLoginRes.body?.success, `Instructor login failed: ${JSON.stringify(instructorLoginRes.body)}`);
    const instructorToken = instructorLoginRes.body.data.token;

    const instructorSubjectsRes = await request(app)
      .get('/instructor/subjects')
      .set('Authorization', `Bearer ${instructorToken}`);
    assert(instructorSubjectsRes.body?.success, `Instructor subjects API failed: ${JSON.stringify(instructorSubjectsRes.body)}`);
    assert((instructorSubjectsRes.body.data || []).length >= 1, 'Instructor subjects API returned empty');

    // Reassign edge case: new batch in same program (semester 2)
    const batch2 = await Batch.create({
      organizationId: org._id,
      organizationType: 'college',
      name: 'BCA 2024 - Sem2',
      code: 'BCA-2024-S2',
      programId: program._id,
      departmentId: department._id,
      year: 2024,
      semester: 2,
      students: [],
      isActive: true
    });

    const subjSem2 = await Subject.create({
      organizationId: org._id,
      organizationType: 'college',
      departmentId: department._id,
      programId: program._id,
      name: 'Data Structures',
      code: 'DS',
      semester: 2,
      instructorId: instructor._id,
      isActive: true
    });

    const reassignRes = await request(app)
      .post('/api/admin/learners/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId: student._id, programId: program._id, batchId: batch2._id });

    assert(reassignRes.body?.success, `Reassign failed: ${JSON.stringify(reassignRes.body)}`);

    const enrollmentsAfter = await AcademicEnrollment.find({ organizationId: org._id, studentId: student._id }).lean();
    assert(enrollmentsAfter.length === 1, `Expected 1 enrollment after reassignment (semester 2), got ${enrollmentsAfter.length}`);
    assert(String(enrollmentsAfter[0].subjectId) === String(subjSem2._id), 'Reassignment did not rebuild enrollments to semester 2 subject');

    console.log('🎉 testStudentAssignment PASSED');
  } finally {
    await mongoose.disconnect();
    await mongo.stop();
  }
}

main().catch((err) => {
  console.error('❌ testStudentAssignment FAILED:', err);
  process.exitCode = 1;
});
