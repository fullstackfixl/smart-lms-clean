// Unit tests for custom error classes
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
} = require('../../../src/core/errors');

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message, status code, and error code', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should have default values', () => {
      const error = new AppError('Test error');

      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('INTERNAL_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const fields = { email: 'Invalid email format' };
      const error = new ValidationError('Validation failed', fields);

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.fields).toEqual(fields);
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with 401 status', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('AUTHENTICATION_ERROR');
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error.message).toBe('Invalid token');
    });
  });

  describe('AuthorizationError', () => {
    it('should create authorization error with 403 status', () => {
      const error = new AuthorizationError();

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.errorCode).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with 404 status', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with 409 status', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.errorCode).toBe('CONFLICT_ERROR');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with 429 status', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe('RATE_LIMIT_ERROR');
    });
  });
});
