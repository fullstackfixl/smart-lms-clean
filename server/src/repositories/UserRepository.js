const BaseRepository = require('../core/BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, organizationId) {
    const filter = { email: email.toLowerCase() };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.findOne(filter);
  }

  async findByRole(role, organizationId) {
    const filter = { role };
    if (organizationId) {
      filter.organization_id = organizationId;
    }
    return await this.model.find(filter);
  }
}

module.exports = new UserRepository();
