const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const { Organization, User } = require('../src/models');

async function login(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res;
}

// Helper to determine database connection strategy
async function connectTestDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    console.log('Using provided MONGODB_URI from environment');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });
    return { type: 'real', uri: mongoUri };
  }
  console.log('No MONGODB_URI found, falling back to MongoMemoryServer');
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

async function cleanupTestData() {
  // Clean up only test data (users and org created during tests)
  const emails = ['orgadmin@test.com', 'instructor@test.com', 'student@test.com'];
  await User.deleteMany({ email: { $in: emails } });
  await Organization.deleteMany({ name: 'Test College' });
}

describe('API smoke tests', () => {
  let dbInfo;

  const passwords = {
    orgAdmin: 'Password123!A',
    instructor: 'Password123!B',
    student: 'Password123!C'
  };

  const emails = {
    orgAdmin: 'orgadmin@test.com',
    instructor: 'instructor@test.com',
    student: 'student@test.com'
  };

  beforeAll(async () => {
    // Increase timeout for potential network DB connections
    jest.setTimeout(60000);
    
    dbInfo = await connectTestDB();
    
    // Clean any stale test data first
    await cleanupTestData();

    // Create test organization
    const collegeOrg = await Organization.create({
      name: 'Test College',
      type: 'college',
      organizationType: 'college',
      subdomain: 'test-college',
      email: 'college@test.com',
      status: 'active',
      modulesEnabled: [
        'DEPARTMENTS',
        'SEMESTERS',
        'SUBJECTS',
        'BATCHES',
        'ACADEMIC_YEAR',
        'TEST_SERIES',
        'GRADES_SECTIONS',
        'GPA_REPORTS',
        'TRAINERS',
        'LEADERBOARDS'
      ]
    });

    // Create test users
    await User.create({
      name: 'Org Admin',
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
      name: 'Instructor',
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
      name: 'Student',
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
  }, 60000);

  afterAll(async () => {
    try {
      // Clean up test data
      await cleanupTestData();
      await mongoose.disconnect();
      // Stop memory server if we used it
      if (dbInfo?.type === 'memory' && dbInfo?.mongo) {
        await dbInfo.mongo.stop();
      }
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  }, 30000);

  test('login works for org_admin and returns token + organization', async () => {
    const res = await login(emails.orgAdmin, passwords.orgAdmin);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body?.data?.token).toBeTruthy();
    expect(res.body?.data?.role).toBe('org_admin');
    expect(res.body?.data?.organization).toBeTruthy();
  });

  test('college org-admin dashboard endpoint works', async () => {
    const loginRes = await login(emails.orgAdmin, passwords.orgAdmin);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/college/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('college instructor dashboard endpoint works', async () => {
    const loginRes = await login(emails.instructor, passwords.instructor);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/college/instructor/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('college student dashboard endpoint works', async () => {
    const loginRes = await login(emails.student, passwords.student);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/college/student/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('org-features departments list works for org_admin', async () => {
    const loginRes = await login(emails.orgAdmin, passwords.orgAdmin);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/org-features/departments')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('org-features academic-years list works for org_admin', async () => {
    const loginRes = await login(emails.orgAdmin, passwords.orgAdmin);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/org-features/academic-years')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('org-features batches list works for org_admin', async () => {
    const loginRes = await login(emails.orgAdmin, passwords.orgAdmin);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/org-features/batches')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
