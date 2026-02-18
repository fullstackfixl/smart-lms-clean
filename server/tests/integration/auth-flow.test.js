// Integration test for authentication flow
// Tests: register → login → access protected resource → logout
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Authentication Flow Integration Test', () => {
  let testEmail;
  let testPassword;
  let authToken;

  beforeEach(() => {
    testEmail = `test${Date.now()}@example.com`;
    testPassword = 'password123';
  });

  it('should complete full authentication flow', async () => {
    // Step 1: Register
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        role: 'public_student'
      });

    expect(registerResponse.status).toBe(200);
    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.data).toHaveProperty('token');
    
    authToken = registerResponse.body.data.token;

    // Step 2: Login
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data).toHaveProperty('user');
    
    authToken = loginResponse.body.data.token || authToken;

    // Step 3: Access protected resource
    const meResponse = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.success).toBe(true);
    expect(meResponse.body.data.email).toBe(testEmail);

    // Step 4: Logout
    const logoutResponse = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body.success).toBe(false);
  });

  it('should reject access without token', async () => {
    const meResponse = await request(app)
      .get('/auth/me');

    expect(meResponse.status).toBe(401);
  });
});
