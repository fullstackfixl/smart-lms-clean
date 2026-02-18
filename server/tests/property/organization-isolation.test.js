// Property-based tests for organization isolation
// Feature: backend-architecture-restructure, Property 6: Organization Isolation
const fc = require('fast-check');
const mongoose = require('mongoose');
const Course = require('../../src/models/Course');
const User = require('../../src/models/User');
const Organization = require('../../src/models/Organization');
const courseService = require('../../src/services/courseService');
const { NotFoundError } = require('../../src/core/errors');

describe('Property 6: Organization Isolation', () => {
  // Arbitraries for generating test data
  const organizationArbitrary = () => fc.record({
    name: fc.string({ minLength: 3, maxLength: 50 }),
    domain: fc.domain(),
    isActive: fc.constant(true)
  });

  const userArbitrary = (orgId) => fc.record({
    email: fc.emailAddress(),
    password_hash: fc.string({ minLength: 8, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    role: fc.constantFrom('student', 'instructor', 'org_admin'),
    organization_id: fc.constant(orgId),
    email_verified: fc.constant(true),
    isActive: fc.constant(true)
  });

  const courseArbitrary = (instructorId, orgId) => fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    level: fc.constantFrom('beginner', 'intermediate', 'advanced'),
    category: fc.constantFrom('programming', 'design', 'business'),
    instructor_id: fc.constant(instructorId),
    organization_id: fc.constant(orgId),
    status: fc.constant('published')
  });

  it('should prevent cross-organization resource access', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        organizationArbitrary(),
        async (org1Data, org2Data) => {
          // Create two organizations
          const org1 = new Organization(org1Data);
          await org1.save();
          
          const org2 = new Organization(org2Data);
          await org2.save();

          // Create users in each organization
          const user1Data = await fc.sample(userArbitrary(org1._id), 1)[0];
          const user1 = new User(user1Data);
          await user1.save();

          const user2Data = await fc.sample(userArbitrary(org2._id), 1)[0];
          const user2 = new User(user2Data);
          await user2.save();

          // Create course in org1
          const courseData = await fc.sample(courseArbitrary(user1._id, org1._id), 1)[0];
          const course = new Course(courseData);
          await course.save();

          // Attempt to access from org2 - should fail
          await expect(courseService.getCourseById(course._id, org2._id))
            .rejects.toThrow(NotFoundError);
        }
      ),
      { numRuns: 10 } // Reduced for faster tests
    );
  });

  it('should only return resources from user organization', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        organizationArbitrary(),
        fc.integer({ min: 1, max: 5 }),
        async (org1Data, org2Data, courseCount) => {
          // Create two organizations
          const org1 = new Organization(org1Data);
          await org1.save();
          
          const org2 = new Organization(org2Data);
          await org2.save();

          // Create user in org1
          const user1Data = await fc.sample(userArbitrary(org1._id), 1)[0];
          const user1 = new User(user1Data);
          await user1.save();

          // Create courses in both organizations
          for (let i = 0; i < courseCount; i++) {
            const course1Data = await fc.sample(courseArbitrary(user1._id, org1._id), 1)[0];
            const course1 = new Course(course1Data);
            await course1.save();

            const course2Data = await fc.sample(courseArbitrary(user1._id, org2._id), 1)[0];
            const course2 = new Course(course2Data);
            await course2.save();
          }

          // Get courses for org1
          const result = await courseService.getCourses({}, { limit: 100, offset: 0 }, org1._id);

          // Should only return courses from org1
          expect(result.data.length).toBe(courseCount);
          result.data.forEach(course => {
            expect(course.organization_id.toString()).toBe(org1._id.toString());
          });
        }
      ),
      { numRuns: 5 }
    );
  });
});
