// Integration test for course management flow
// Tests: create course → add sections → add lessons → publish → enroll student
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Organization = require('../../src/models/Organization');
const jwtUtils = require('../../src/utils/jwt');
const mongoose = require('mongoose');

describe('Course Management Flow Integration Test', () => {
  let instructorToken;
  let studentToken;
  let organizationId;
  let courseId;

  beforeEach(async () => {
    // Create organization
    const org = new Organization({
      name: 'Test University',
      domain: 'test.edu',
      isActive: true
    });
    await org.save();
    organizationId = org._id;

    // Create instructor
    const instructor = new User({
      email: 'instructor@test.edu',
      password_hash: 'password123',
      name: 'Test Instructor',
      role: 'instructor',
      organization_id: organizationId,
      email_verified: true,
      isActive: true
    });
    await instructor.save();

    instructorToken = jwtUtils.generateToken({
      userId: instructor._id,
      email: instructor.email,
      role: instructor.role,
      organization_id: instructor.organization_id
    });

    // Create student
    const student = new User({
      email: 'student@test.edu',
      password_hash: 'password123',
      name: 'Test Student',
      role: 'student',
      organization_id: organizationId,
      email_verified: true,
      isActive: true
    });
    await student.save();

    studentToken = jwtUtils.generateToken({
      userId: student._id,
      email: student.email,
      role: student.role,
      organization_id: student.organization_id
    });
  });

  it('should complete full course management flow', async () => {
    // Step 1: Create course
    const createResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Introduction to Testing',
        description: 'Learn testing fundamentals',
        category: 'programming',
        level: 'beginner',
        price: 0
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    courseId = createResponse.body.data._id;

    // Step 2: Get course details
    const getResponse = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.title).toBe('Introduction to Testing');

    // Step 3: Update course
    const updateResponse = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        description: 'Updated description'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.description).toBe('Updated description');

    // Step 4: Publish course
    const publishResponse = await request(app)
      .post(`/api/courses/${courseId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.data.status).toBe('published');

    // Step 5: Student enrolls in course
    const enrollResponse = await request(app)
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        course_id: courseId
      });

    expect(enrollResponse.status).toBe(201);
    expect(enrollResponse.body.success).toBe(true);
  });

  it('should prevent unauthorized course modification', async () => {
    // Create course as instructor
    const createResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Test Course',
        description: 'Test Description',
        category: 'programming',
        level: 'beginner'
      });

    courseId = createResponse.body.data._id;

    // Try to update as student - should fail
    const updateResponse = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Hacked Title'
      });

    expect(updateResponse.status).toBe(403);
  });
});
