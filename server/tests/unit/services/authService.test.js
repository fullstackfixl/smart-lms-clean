// Unit tests for AuthService
const authService = require('../../../src/services/authService');
const User = require('../../../src/models/User');
const { ValidationError, AuthenticationError } = require('../../../src/core/errors');

describe('AuthService', () => {
  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(authService.validateEmail('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(authService.validateEmail('invalid-email')).toBe(false);
      expect(authService.validateEmail('test@')).toBe(false);
      expect(authService.validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should not throw for valid data', () => {
      const data = { email: 'test@example.com', password: 'password123' };
      expect(() => authService.validateRequiredFields(data, ['email', 'password'])).not.toThrow();
    });

    it('should throw ValidationError for missing fields', () => {
      const data = { email: 'test@example.com' };
      expect(() => authService.validateRequiredFields(data, ['email', 'password']))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string fields', () => {
      const data = { email: '  ', password: 'password123' };
      expect(() => authService.validateRequiredFields(data, ['email', 'password']))
        .toThrow(ValidationError);
    });
  });

  describe('register', () => {
    it('should throw ValidationError for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User'
      };

      await expect(authService.register(userData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'short',
        fullName: 'Test User'
      };

      await expect(authService.register(userData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        registrationType: 'public'
      };

      await authService.register(userData);
      await expect(authService.register(userData)).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const userData = {
        email: 'login@example.com',
        password: 'password123',
        fullName: 'Login User',
        registrationType: 'public'
      };
      await authService.register(userData);
    });

    it('should throw ValidationError for missing email', async () => {
      await expect(authService.login('', 'password123')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing password', async () => {
      await expect(authService.login('login@example.com', '')).rejects.toThrow(ValidationError);
    });

    it('should throw AuthenticationError for invalid email', async () => {
      await expect(authService.login('wrong@example.com', 'password123'))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for invalid password', async () => {
      await expect(authService.login('login@example.com', 'wrongpassword'))
        .rejects.toThrow(AuthenticationError);
    });

    it('should return user and token for valid credentials', async () => {
      const result = await authService.login('login@example.com', 'password123');
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('login@example.com');
    });
  });
});
