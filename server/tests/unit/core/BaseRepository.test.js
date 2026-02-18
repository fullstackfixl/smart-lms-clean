// Unit tests for BaseRepository
const BaseRepository = require('../../../src/core/BaseRepository');
const mongoose = require('mongoose');

// Create a test model
const TestSchema = new mongoose.Schema({
  name: String,
  organization_id: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const TestModel = mongoose.model('Test', TestSchema);

describe('BaseRepository', () => {
  let repository;
  let orgId1;
  let orgId2;

  beforeEach(() => {
    repository = new BaseRepository(TestModel);
    orgId1 = new mongoose.Types.ObjectId();
    orgId2 = new mongoose.Types.ObjectId();
  });

  describe('create', () => {
    it('should create a document with organization_id', async () => {
      const data = { name: 'Test Item' };
      const result = await repository.create(data, orgId1);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Item');
      expect(result.organization_id.toString()).toBe(orgId1.toString());
    });

    it('should create a document without organization_id if not provided', async () => {
      const data = { name: 'Test Item' };
      const result = await repository.create(data);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Item');
      expect(result.organization_id).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find document by id with organization filter', async () => {
      const created = await repository.create({ name: 'Test Item' }, orgId1);
      const found = await repository.findById(created._id, orgId1);

      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(created._id.toString());
    });

    it('should not find document from different organization', async () => {
      const created = await repository.create({ name: 'Test Item' }, orgId1);
      const found = await repository.findById(created._id, orgId2);

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated results with organization filter', async () => {
      await repository.create({ name: 'Item 1' }, orgId1);
      await repository.create({ name: 'Item 2' }, orgId1);
      await repository.create({ name: 'Item 3' }, orgId2);

      const result = await repository.findAll({}, { limit: 10, offset: 0 }, orgId1);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should apply pagination correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create({ name: `Item ${i}` }, orgId1);
      }

      const result = await repository.findAll({}, { limit: 2, offset: 0 }, orgId1);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.pages).toBe(3);
    });
  });

  describe('update', () => {
    it('should update document with organization filter', async () => {
      const created = await repository.create({ name: 'Original' }, orgId1);
      const updated = await repository.update(created._id, { name: 'Updated' }, orgId1);

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated');
    });

    it('should not update document from different organization', async () => {
      const created = await repository.create({ name: 'Original' }, orgId1);
      const updated = await repository.update(created._id, { name: 'Updated' }, orgId2);

      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete document with organization filter', async () => {
      const created = await repository.create({ name: 'To Delete' }, orgId1);
      const deleted = await repository.delete(created._id, orgId1);

      expect(deleted).toBeDefined();
      expect(deleted._id.toString()).toBe(created._id.toString());

      const found = await repository.findById(created._id, orgId1);
      expect(found).toBeNull();
    });

    it('should not delete document from different organization', async () => {
      const created = await repository.create({ name: 'To Delete' }, orgId1);
      const deleted = await repository.delete(created._id, orgId2);

      expect(deleted).toBeNull();

      const found = await repository.findById(created._id, orgId1);
      expect(found).toBeDefined();
    });
  });

  describe('count', () => {
    it('should count documents with organization filter', async () => {
      await repository.create({ name: 'Item 1' }, orgId1);
      await repository.create({ name: 'Item 2' }, orgId1);
      await repository.create({ name: 'Item 3' }, orgId2);

      const count = await repository.count({}, orgId1);

      expect(count).toBe(2);
    });
  });
});
