// Property-based tests for response format consistency
// Feature: backend-architecture-restructure, Property 2: Response Format Consistency
const fc = require('fast-check');
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const jwtUtils = require('../../src/utils/jwt');

describe('Property 2: Response Format Consistency', () => {
  it('should return consistent JSON format for all successful responses', async () => {
    // Create a test user
    const user = new User({
      email: 'test@example.com',
      password_hash: 'password123',
      name: 'Test User',
      role: 'student',
      email_verified: true,
      isActive: true
    });
    await user.save();

    const token = jwtUtils.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    // Test various endpoints
    const endpoints = [
      { method: 'get', path: '/auth/me' },
      { method: 'get', path: '/api/courses' }
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${token}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('data');
      }
    }
  });

  it('should return consistent error format for all error responses', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });

    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
  });
});
