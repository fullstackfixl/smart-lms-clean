// Unit tests for CourseService
const courseService = require('../../../src/services/courseService');
const Course = require('../../../src/models/Course');
const mongoose = require('mongoose');
const { NotFoundError, AuthorizationError } = require('../../../src/core/errors');

describe('CourseService', () => {
  let orgId;
  let userId;
  let courseId;

  beforeEach(async () => {
    orgId = new mongoose.Types.ObjectId();
    userId = new mongoose.Types.ObjectId();
  });

  describe('createCourse', () => {
    it('should create a course with organization_id and instructor_id', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description',
        level: 'beginner'
      };

      const course = await courseService.createCourse(courseData, userId, orgId);

      expect(course).toBeDefined();
      expect(course.title).toBe('Test Course');
      expect(course.instructor_id.toString()).toBe(userId.toString());
      expect(course.organization_id.toString()).toBe(orgId.toString());
      expect(course.status).toBe('draft');

      courseId = course._id;
    });
  });

  describe('getCourseById', () => {
    beforeEach(async () => {
      const courseData = {
        title: 'Test Course',
        description: 'Test Description'
      };
      const course = await courseService.createCourse(courseData, userId, orgId);
      courseId = course._id;
    });

    it('should return course by id', async () => {
      const course = await courseService.getCourseById(courseId, orgId);

      expect(course).toBeDefined();
      expect(course._id.toString()).toBe(courseId.toString());
    });

    it('should throw NotFoundError for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(courseService.getCourseById(fakeId, orgId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for course from different organization', async () => {
      const otherOrgId = new mongoose.Types.ObjectId();
      await expect(courseService.getCourseById(courseId, otherOrgId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateCourse', () => {
    beforeEach(async () => {
      const courseData = {
        title: 'Original Title',
        description: 'Original Description'
      };
      const course = await courseService.createCourse(courseData, userId, orgId);
      courseId = course._id;
    });

    it('should update course by instructor', async () => {
      const updates = { title: 'Updated Title' };
      const updated = await courseService.updateCourse(courseId, updates, userId, orgId);

      expect(updated.title).toBe('Updated Title');
    });

    it('should throw AuthorizationError for non-instructor', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const updates = { title: 'Updated Title' };

      await expect(courseService.updateCourse(courseId, updates, otherUserId, orgId))
        .rejects.toThrow(AuthorizationError);
    });
  });

  describe('deleteCourse', () => {
    beforeEach(async () => {
      const courseData = {
        title: 'To Delete',
        description: 'Will be deleted'
      };
      const course = await courseService.createCourse(courseData, userId, orgId);
      courseId = course._id;
    });

    it('should delete course by instructor', async () => {
      await courseService.deleteCourse(courseId, userId, orgId);

      await expect(courseService.getCourseById(courseId, orgId)).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError for non-instructor', async () => {
      const otherUserId = new mongoose.Types.ObjectId();

      await expect(courseService.deleteCourse(courseId, otherUserId, orgId))
        .rejects.toThrow(AuthorizationError);
    });
  });

  describe('publishCourse', () => {
    beforeEach(async () => {
      const courseData = {
        title: 'To Publish',
        description: 'Will be published'
      };
      const course = await courseService.createCourse(courseData, userId, orgId);
      courseId = course._id;
    });

    it('should publish course', async () => {
      const published = await courseService.publishCourse(courseId, userId, orgId);

      expect(published.status).toBe('published');
    });
  });
});
