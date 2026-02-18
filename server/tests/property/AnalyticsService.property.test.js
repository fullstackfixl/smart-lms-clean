const fc = require('fast-check');
const AnalyticsService = require('../../src/services/analyticsService');

// Feature: platform-admin-management, Property tests for AnalyticsService
describe('AnalyticsService Property Tests', () => {
  // Property 12: Growth percentage calculation
  test('Property 12: Growth percentage calculation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          organizations: fc.nat({ max: 10000 }),
          users: fc.nat({ max: 100000 }),
          courses: fc.nat({ max: 50000 })
        }),
        fc.record({
          organizations: fc.nat({ max: 10000 }),
          users: fc.nat({ max: 100000 }),
          courses: fc.nat({ max: 50000 })
        }),
        async (currentStats, previousStats) => {
          const growth = AnalyticsService.calculateGrowthPercentages(currentStats, previousStats);

          // Verify growth object structure
          expect(growth).toHaveProperty('organizations');
          expect(growth).toHaveProperty('users');
          expect(growth).toHaveProperty('courses');

          // Verify growth calculations
          if (previousStats.organizations === 0) {
            expect(growth.organizations).toBe(currentStats.organizations > 0 ? 100 : 0);
          } else {
            const expected = Number((((currentStats.organizations - previousStats.organizations) / previousStats.organizations) * 100).toFixed(2));
            expect(growth.organizations).toBe(expected);
          }

          if (previousStats.users === 0) {
            expect(growth.users).toBe(currentStats.users > 0 ? 100 : 0);
          } else {
            const expected = Number((((currentStats.users - previousStats.users) / previousStats.users) * 100).toFixed(2));
            expect(growth.users).toBe(expected);
          }

          if (previousStats.courses === 0) {
            expect(growth.courses).toBe(currentStats.courses > 0 ? 100 : 0);
          } else {
            const expected = Number((((currentStats.courses - previousStats.courses) / previousStats.courses) * 100).toFixed(2));
            expect(growth.courses).toBe(expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test division by zero handling
  test('Property 12: Division by zero handling', () => {
    const currentStats = { organizations: 10, users: 100, courses: 50 };
    const previousStats = { organizations: 0, users: 0, courses: 0 };

    const growth = AnalyticsService.calculateGrowthPercentages(currentStats, previousStats);

    expect(growth.organizations).toBe(100);
    expect(growth.users).toBe(100);
    expect(growth.courses).toBe(100);
  });

  // Test zero to zero
  test('Property 12: Zero to zero returns 0%', () => {
    const currentStats = { organizations: 0, users: 0, courses: 0 };
    const previousStats = { organizations: 0, users: 0, courses: 0 };

    const growth = AnalyticsService.calculateGrowthPercentages(currentStats, previousStats);

    expect(growth.organizations).toBe(0);
    expect(growth.users).toBe(0);
    expect(growth.courses).toBe(0);
  });
});
