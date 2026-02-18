const fc = require('fast-check');
const mongoose = require('mongoose');
const Organization = require('../../src/models/Organization');

// Feature: platform-admin-management, Property 1: Organization creation defaults
describe('Organization Model Property Tests', () => {
  let counter = 0;

  // Arbitrary for generating valid organization data
  const organizationArbitrary = () => fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    slug: fc.string({ minLength: 3, maxLength: 40 }).filter(s => s.length >= 3).map(s => {
      counter++;
      const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40) || 'test';
      return `${cleaned}-${counter}-${Date.now()}`;
    }),
    code: fc.string({ minLength: 2, maxLength: 8 }).filter(s => s.length >= 2).map(s => {
      counter++;
      const cleaned = s.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) || 'TEST';
      return `${cleaned}${counter}`;
    }),
    domain: fc.option(fc.webUrl(), { nil: null }),
    address: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: null })
  });

  test('Property 1: Organization creation defaults - status="active" and is_deleted=false', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        async (orgData) => {
          // Create organization
          const org = new Organization(orgData);
          await org.save();

          // Verify defaults
          expect(org.status).toBe('active');
          expect(org.is_deleted).toBe(false);
          expect(org.isActive).toBe(true);
          expect(org.admin_count).toBe(0);
          expect(org.user_count).toBe(0);

          // Verify it's persisted
          const retrieved = await Organization.findById(org._id);
          expect(retrieved).not.toBeNull();
          expect(retrieved.status).toBe('active');
          expect(retrieved.is_deleted).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 6: Status value constraints - only active, suspended, deleted allowed', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        fc.constantFrom('active', 'suspended', 'deleted'),
        async (orgData, validStatus) => {
          const org = new Organization({ ...orgData, status: validStatus });
          await org.save();
          
          const retrieved = await Organization.findById(org._id).setOptions({ includeDeleted: true });
          expect(['active', 'suspended', 'deleted']).toContain(retrieved.status);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 6: Invalid status values should be rejected', async () => {
    const orgData = {
      name: 'Test Org',
      slug: 'test-org',
      code: 'TEST',
      status: 'invalid_status'
    };

    const org = new Organization(orgData);
    await expect(org.save()).rejects.toThrow();
  });
});
