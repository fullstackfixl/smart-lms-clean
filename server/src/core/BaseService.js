class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async validateOwnership(resourceId, userId, organizationId) {
    const resource = await this.repository.findById(resourceId, organizationId);
    if (!resource) {
      throw new Error('Resource not found');
    }
    return resource;
  }

  async checkPermissions(user, action, resource) {
    if (user.role === 'platform_admin') {
      return true;
    }
    return true;
  }
}

module.exports = BaseService;