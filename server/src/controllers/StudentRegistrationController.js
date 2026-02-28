const studentRegistrationService = require('../services/studentRegistrationService');
const jwtUtils = require('../utils/jwt');

class StudentRegistrationController {
  async validateOrganization(req, res) {
    try {
      const { organization_code } = req.body;
      const org = await studentRegistrationService.validateOrganization(organization_code);
      return res.status(200).json({ success: true, data: org, message: 'Organization validated' });
    } catch (error) {
      const status = error.statusCode || (error.message?.includes('not found') ? 404 : 400);
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async sendVerification(req, res) {
    try {
      const { name, email, organization_code } = req.body;
      const result = await studentRegistrationService.sendVerification({ name, email, organization_code });
      return res.status(200).json({
        success: true,
        message: 'Verification code sent to your email',
        data: result
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async completeRegistration(req, res) {
    try {
      const { name, email, password, organization_code, otp } = req.body;
      const { token, user } = await studentRegistrationService.completeRegistration({
        name, email, password, organization_code, otp
      });

      // Also set token cookie for convenience
      try {
        jwtUtils.setTokenCookie(res, token);
      } catch { }

      // Create Organization Event
      const OrganizationEvent = require('../models/OrganizationEvent');
      const event = await OrganizationEvent.create({
        organizationId: user.organization_id,
        type: 'NEW_STUDENT',
        message: `New student registered: ${user.name}`,
        relatedId: user._id
      });

      // Emit real-time update
      if (global.io) {
        global.io.to(`organization_${user.organization_id}`).emit('new_event', event);
      }

      return res.status(201).json({
        success: true,
        message: 'Registration complete',
        data: { token, user, organization_code: (organization_code || '').toString().toUpperCase() }
      });
    } catch (error) {
      const status = error.statusCode || 400;
      // Map errors to specific statuses if needed
      if (error.message?.toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message?.toLowerCase().includes('not active')) {
        return res.status(403).json({ success: false, message: error.message });
      }
      if (error.statusCode === 409) {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

module.exports = new StudentRegistrationController();
