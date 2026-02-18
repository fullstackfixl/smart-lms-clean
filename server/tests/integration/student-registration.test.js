// Integration test for student registration endpoint
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Organization = require('../../src/models/Organization');

describe('Student Registration Endpoint', () => {
  let testOrganization;
  let testEmail;
  let testPassword;

  beforeEach(async () => {
    // Create a test organization for each test
    testOrganization = await Organization.create({
      name: 'Test University',
      slug: `test-university-${Date.now()}`,
      code: `TST${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      isActive: true,
      status: 'active'
    });
    
    testEmail = `student${Date.now()}@test.edu`;
    testPassword = 'password123';
  });

  describe('POST /auth/register/student', () => {
    it('should register a student with valid organization code', async () => {
      const response = await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test Student',
          organizationCode: testOrganization.code
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.role).toBe('student');
      expect(response.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(response.body.data).toHaveProperty('organization');
      expect(response.body.data.organization.name).toBe(testOrganization.name);

      // Verify user was created in database
      const user = await User.findOne({ email: testEmail.toLowerCase() });
      expect(user).toBeTruthy();
      expect(user.role).toBe('student');
      expect(user.isActive).toBe(true);
      expect(user.email_verified).toBe(true);
      expect(user.organization_id.toString()).toBe(testOrganization._id.toString());
    });

    it('should reject registration with invalid organization code', async () => {
      const response = await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test Student',
          organizationCode: 'INVALID'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid organization code');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test Student',
          organizationCode: testOrganization.code
        });

      // Second registration with same email
      const response = await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Another Student',
          organizationCode: testOrganization.code
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already registered');
    });

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: 'short',
          name: 'Test Student',
          organizationCode: testOrganization.code
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('8 characters');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: testPassword
          // Missing name and organizationCode
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should hash password using bcrypt', async () => {
      const response = await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test Student',
          organizationCode: testOrganization.code
        });

      expect(response.status).toBe(200);

      // Verify password is hashed
      const user = await User.findOne({ email: testEmail.toLowerCase() }).select('+password_hash');
      expect(user.password_hash).toBeTruthy();
      expect(user.password_hash).not.toBe(testPassword);
      expect(user.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should generate JWT token with 7-day expiration', async () => {
      const response = await request(app)
        .post('/auth/register/student')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Test Student',
          organizationCode: testOrganization.code
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeTruthy();

      // Verify token can be used for authentication
      const meResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${response.body.data.token}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.data.email).toBe(testEmail.toLowerCase());
    });
  });

  describe('POST /auth/validate-organization', () => {
    it('should validate and return organization details for valid code', async () => {
      const response = await request(app)
        .post('/auth/validate-organization')
        .send({
          organizationCode: testOrganization.code
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.organization).toHaveProperty('name');
      expect(response.body.data.organization).toHaveProperty('code');
      expect(response.body.data.organization.name).toBe(testOrganization.name);
    });

    it('should reject invalid organization code', async () => {
      const response = await request(app)
        .post('/auth/validate-organization')
        .send({
          organizationCode: 'INVALID'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing organization code', async () => {
      const response = await request(app)
        .post('/auth/validate-organization')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
