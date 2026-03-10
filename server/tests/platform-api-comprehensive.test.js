const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { User, Organization, Course, SystemConfig } = require('../src/models');

let mongoServer;

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};

beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Platform Backend Comprehensive Verification', () => {
  let platformAdmin, platformStaff, orgAdmin;
  let adminToken, staffToken, orgToken;
  let testOrgId, testCourseId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Course.deleteMany({});
    await SystemConfig.deleteMany({});

    // Create Platform Admin
    platformAdmin = await User.create({
      name: 'Platform Admin',
      email: 'admin@platform.com',
      password_hash: 'hashed',
      role: 'platform_admin',
      status: 'active',
      isActive: true,
      email_verified: true
    });
    adminToken = generateToken(platformAdmin);

    // Create Platform Staff
    platformStaff = await User.create({
      name: 'Platform Staff',
      email: 'staff@platform.com',
      password_hash: 'hashed',
      role: 'platform_staff',
      status: 'active',
      isActive: true,
      email_verified: true
    });
    staffToken = generateToken(platformStaff);

    // Create Organization and Org Admin
    const org = await Organization.create({
      name: 'Test University',
      subdomain: 'testuni',
      email: 'contact@testuni.com',
      type: 'COLLEGE',
      status: 'active'
    });
    testOrgId = org._id;

    orgAdmin = await User.create({
      name: 'Org Admin',
      email: 'admin@testuni.com',
      password_hash: 'hashed',
      role: 'org_admin',
      organization_id: testOrgId,
      status: 'active',
      isActive: true,
      email_verified: true
    });
    orgToken = generateToken(orgAdmin);

    // Create Course
    const course = await Course.create({
      title: 'Intro to Platform Testing',
      description: 'Comprehensive testing for the platform overhaul',
      category: 'Engineering',
      instructor_id: orgAdmin._id,
      organization_id: testOrgId,
      status: 'published'
    });
    testCourseId = course._id;
  });

  describe('RBAC & Auth Verification', () => {
    it('should block unauthorized users (no token)', async () => {
      const res = await request(app).get('/api/platform/dashboard');
      expect(res.status).toBe(401);
    });

    it('should block non-platform roles from platform APIs', async () => {
      const res = await request(app)
        .get('/api/platform/dashboard')
        .set('Authorization', `Bearer ${orgToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Platform access required');
    });

    it('should allow platform staff to access dashboard', async () => {
      const res = await request(app)
        .get('/api/platform/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Dashboard Module', () => {
    it('should get ecosystem-wide stats', async () => {
      const res = await request(app)
        .get('/api/platform/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalOrganizations).toBe(1);
      expect(res.body.data.systemHealth.status).toBe('optimal');
    });
  });

  describe('Organization Management', () => {
    it('should list all organizations for staff', async () => {
      const res = await request(app)
        .get('/api/platform/organizations')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.organizations).toHaveLength(1);
    });

    it('should allow admin to create new organization', async () => {
      const res = await request(app)
        .post('/api/platform/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Academy',
          subdomain: 'newacademy',
          email: 'admin@newacademy.com',
          type: 'COLLEGE'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Academy');
    });

    it('should block staff from creating new organization', async () => {
      const res = await request(app)
        .post('/api/platform/organizations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Should Fail' });
      expect(res.status).toBe(403);
    });

    it('should allow staff to suspend organization', async () => {
      const res = await request(app)
        .patch(`/api/platform/organizations/${testOrgId}/suspend`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      const updatedOrg = await Organization.findById(testOrgId);
      expect(updatedOrg.status).toBe('suspended');
    });
  });

  describe('User Management', () => {
    it('should list all platform users for staff', async () => {
      const res = await request(app)
        .get('/api/platform/users')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(3); // admin, staff, orgAdmin
    });

    it('should get user details', async () => {
      const res = await request(app)
        .get(`/api/platform/users/${orgAdmin._id}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(orgAdmin.email);
    });

    it('should allow staff to suspend a user', async () => {
      const res = await request(app)
        .patch(`/api/platform/users/${orgAdmin._id}/suspend`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      const updatedUser = await User.findById(orgAdmin._id);
      expect(updatedUser.status).toBe('suspended');
    });
  });

  describe('Course Management', () => {
    it('should list all ecosystem courses', async () => {
      const res = await request(app)
        .get('/api/platform/courses')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.courses).toHaveLength(1);
    });

    it('should allow staff to suspend a course', async () => {
      const res = await request(app)
        .patch(`/api/platform/courses/${testCourseId}/suspend`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      const updatedCourse = await Course.findById(testCourseId);
      expect(updatedCourse.status).toBe('draft');
    });
  });

  describe('Staff Management', () => {
    it('should allow admin to list staff', async () => {
      const res = await request(app)
        .get('/api/platform/staff')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1); // The platformStaff we created in beforeEach
    });

    it('should block staff from listing other staff', async () => {
      const res = await request(app)
        .get('/api/platform/staff')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Analytics & Intelligence', () => {
    it('should get ecosystem overview', async () => {
      const res = await request(app)
        .get('/api/platform/analytics/overview')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.organizationsCount).toBe(1);
    });

    it('should get growth vectors', async () => {
      const res = await request(app)
        .get('/api/platform/analytics/growth')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.userGrowth).toBeInstanceOf(Array);
    });
  });

  describe('Settings & Configuration', () => {
    it('should list settings for admin', async () => {
      const res = await request(app)
        .get('/api/platform/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.maintenanceMode).toBe(false);
    });

    it('should allow admin to update settings', async () => {
      const res = await request(app)
        .put('/api/platform/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maintenanceMode: true });
      expect(res.status).toBe(200);
      expect(res.body.data.maintenanceMode).toBe(true);
    });

    it('should block staff from updating settings', async () => {
      const res = await request(app)
        .put('/api/platform/settings')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ maintenanceMode: true });
      expect(res.status).toBe(403);
    });
  });
});
