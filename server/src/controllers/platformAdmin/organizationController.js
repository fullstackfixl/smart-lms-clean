const organizationService = require('../../services/platform/organizationService');
const BaseController = require('../../core/BaseController');

/**
 * Platform Organization Controller
 */
class OrganizationController extends BaseController {
  constructor() {
    super(organizationService);
  }

  /**
   * POST /api/platform/organizations
   */
  create = async (req, res, next) => {
    try {
      const organization = await organizationService.createOrganization(req.body, req.user);
      return this.sendSuccess(res, organization, 'Organization provisioned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/platform/organizations/invite
   */
  invite = async (req, res, next) => {
    try {
      const result = await organizationService.inviteOrganization(req.body, req.user);
      return this.sendSuccess(res, result, 'Institution invitation dispatched', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/platform/organizations
   */
  list = async (req, res, next) => {
    try {
      const result = await organizationService.listOrganizations(req.query);
      return this.sendSuccess(res, result, 'Institutional registry retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/platform/organizations/:orgId
   */
  getDetails = async (req, res, next) => {
    try {
      const organization = await organizationService.getDetails(req.params.orgId);
      return this.sendSuccess(res, organization, 'Organization telemetry retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/platform/organizations/:orgId
   */
  update = async (req, res, next) => {
    try {
      const organization = await organizationService.updateOrganization(req.params.orgId, req.body, req.user);
      return this.sendSuccess(res, organization, 'Organization protocol updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/platform/organizations/:orgId/suspend
   */
  suspend = async (req, res, next) => {
    try {
      const organization = await organizationService.updateStatus(req.params.orgId, 'suspended', req.user);
      return this.sendSuccess(res, organization, 'Organization status: SUSPENDED');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/platform/organizations/:orgId/activate
   */
  activate = async (req, res, next) => {
    try {
      const organization = await organizationService.updateStatus(req.params.orgId, 'active', req.user);
      return this.sendSuccess(res, organization, 'Organization status: ACTIVE');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/platform/organizations/:orgId
   */
  delete = async (req, res, next) => {
    try {
      const organization = await organizationService.deleteOrganization(req.params.orgId, req.user);
      return this.sendSuccess(res, organization, 'Organization node decommissioned');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrganizationController();
