const fc = require('fast-check');
const mongoose = require('mongoose');
const crypto = require('crypto');
const OrganizationService = require('../../src/services/organizationService');
const Organization = require('../../src/models/Organization');

// Feature: platform-admin-management, Property tests for OrganizationService
describe('OrganizationService Property Tests', () => {
  // Arbitrary for generating valid organization data
  const organizationArbitrary = () => {
    return fc.tuple(
      fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      fc.option(fc.string({ maxLength: 500 }), { nil: null })
    ).map(([name, description]) => {
      const uuid = crypto.randomUUID();
      return {
        name,
        slug: `org-${uuid}`,
        code: `ORG${uuid.substring(0, 8).toUpperCase().replace(/-/g, '')}`,
        description
      };
    });
  };

  // Property 2: Organization update persistence
  test('Property 2: Organization update persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        fc.string({ maxLength: 500 }),
        fc.string({ maxLength: 200 }),
        async (orgData, newDescription, newAddress) => {
          // Create organization
          const org = await OrganizationService.create(orgData);

          // Update organization (not updating name/slug/code to avoid uniqueness issues)
          const updateData = {
            description: newDescription.trim() || null,
            address: newAddress.trim() || null
          };
          const updated = await OrganizationService.update(org._id.toString(), updateData);

          // Verify update persisted
          expect(updated.description).toBe(updateData.description);
          expect(updated.address).toBe(updateData.address);

          // Verify retrievable
          const retrieved = await OrganizationService.findById(org._id.toString());
          expect(retrieved).not.toBeNull();
          expect(retrieved.description).toBe(updateData.description);
          expect(retrieved.address).toBe(updateData.address);
        }
      ),
      { numRuns: 50, endOnFailure: true }
    );
  });

  // Property 3: Organization suspension state transition
  test('Property 3: Organization suspension state transition', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        async (orgData) => {
          // Create organization (defaults to active)
          const org = await OrganizationService.create(orgData);
          expect(org.status).toBe('active');

          // Suspend it
          const suspended = await OrganizationService.suspend(org._id.toString());

          // Verify status changed to suspended
          expect(suspended.status).toBe('suspended');
          expect(suspended.isActive).toBe(false);

          // Verify persisted
          const retrieved = await Organization.findById(org._id).setOptions({ includeDeleted: true });
          expect(retrieved.status).toBe('suspended');
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 4: Suspend-activate round trip
  test('Property 4: Suspend-activate round trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        async (orgData) => {
          // Create organization
          const org = await OrganizationService.create(orgData);

          // Suspend then activate
          await OrganizationService.suspend(org._id.toString());
          const activated = await OrganizationService.activate(org._id.toString());

          // Verify status restored to active
          expect(activated.status).toBe('active');
          expect(activated.isActive).toBe(true);

          // Verify persisted
          const retrieved = await OrganizationService.findById(org._id.toString());
          expect(retrieved.status).toBe('active');
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 5: Soft delete behavior
  test('Property 5: Soft delete behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        organizationArbitrary(),
        async (orgData) => {
          // Create organization
          const org = await OrganizationService.create(orgData);
          const orgId = org._id.toString();

          // Soft delete it
          const deleted = await OrganizationService.softDelete(orgId, new mongoose.Types.ObjectId());

          // Verify is_deleted set to true
          expect(deleted.is_deleted).toBe(true);
          expect(deleted.status).toBe('deleted');

          // Should not appear in normal queries
          const normalQuery = await OrganizationService.findById(orgId);
          expect(normalQuery).toBeNull();

          // Should still exist with explicit query
          const explicitQuery = await Organization.findById(orgId).setOptions({ includeDeleted: true });
          expect(explicitQuery).not.toBeNull();
          expect(explicitQuery.is_deleted).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 7: Organization query filtering
  test('Property 7: Organization query filtering', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(organizationArbitrary(), { minLength: 2, maxLength: 5 }),
        async (orgsData) => {
          // Create multiple organizations
          const orgs = await Promise.all(
            orgsData.map(data => OrganizationService.create(data))
          );

          // Soft delete one of them
          await OrganizationService.softDelete(orgs[0]._id.toString(), new mongoose.Types.ObjectId());

          // Query all organizations
          const result = await OrganizationService.findAll();

          // Verify soft-deleted org is not in results
          const ids = result.organizations.map(o => o._id.toString());
          expect(ids).not.toContain(orgs[0]._id.toString());

          // Verify other orgs are in results
          for (let i = 1; i < orgs.length; i++) {
            expect(ids).toContain(orgs[i]._id.toString());
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
