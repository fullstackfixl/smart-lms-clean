class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data, organizationId) {
    if (organizationId) {
      data.organization_id = organizationId;
    }
    const document = new this.model(data);
    return await document.save();
  }

  async findById(id, organizationId) {
    const filter = { _id: id };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.findOne(filter);
  }

  async findAll(filters = {}, pagination = {}, organizationId) {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    
    const query = { ...filters };
    if (organizationId) {
      query.organization_id = organizationId;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const documents = await this.model
      .find(query)
      .sort(sort)
      .limit(limit)
      .skip(offset);

    const total = await this.model.countDocuments(query);

    return {
      data: documents,
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit)
    };
  }

  async update(id, updates, organizationId) {
    const filter = { _id: id };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.findOneAndUpdate(filter, updates, { new: true });
  }

  async delete(id, organizationId) {
    const filter = { _id: id };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.findOneAndDelete(filter);
  }

  async count(filters = {}, organizationId) {
    const query = { ...filters };
    if (organizationId) {
      query.organization_id = organizationId;
    }
    return await this.model.countDocuments(query);
  }

  buildOrgFilter(organizationId) {
    return organizationId ? { organization_id: organizationId } : {};
  }
}

module.exports = BaseRepository;
