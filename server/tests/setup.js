// Jest setup file

// Ensure required env vars have safe defaults for test runtime.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.NODE_ENV = 'test';

// Reduce noisy logs during tests.
jest.spyOn(console, 'log').mockImplementation(() => {});

// Keep console.error visible to avoid hiding failures.
