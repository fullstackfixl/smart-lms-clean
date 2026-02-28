const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { User, Invite } = require('../models');
const emailService = require('../services/email.service');
const { generateInvitationTemplate } = emailService;
const crypto = require('crypto');
const { recordOrgEvent, EVENT_TYPES } = require('../utils/orgEvents');


const router = express.Router();

// All routes require ORG_ADMIN
router.use(authMiddleware, requireRole(['org_admin']));

// Create Instructor (invite flow)
router.post('/users/create-instructor', async (req, res) => {
  try {
    console.log('--- CREATE INSTRUCTOR DEBUG ---');
    console.log('REQ BODY:', JSON.stringify(req.body, null, 2));
    console.log('USER:', req.user ? { id: req.user._id, email: req.user.email, org: req.user.organization_id } : 'NONE');

    const orgId = (req.user.organization_id && req.user.organization_id._id) ? req.user.organization_id._id : req.user.organization_id;
    const { name, email } = req.body || {};
    if (!orgId) {
      return res.error('Organization not found', 'Authentication error: missing organization', 401);
    }
    if (!name || !email) {
      return res.error('Name and email are required', 'Validation failed', 400);
    }
    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(email)) {
      return res.error('Invalid email', 'Validation failed', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase(), organization_id: orgId }).lean();
    if (existing) {
      return res.error('User already exists in this organization', 'Conflict', 409);
    }

    let invite = await Invite.findOne({
      email: email.toLowerCase(),
      organization_id: orgId,
      role: 'instructor',
      used: false,
      expires_at: { $gt: new Date() }
    }).lean();
    if (!invite) {
      const token = crypto.randomBytes(32).toString('hex');
      invite = await Invite.create({
        email: email.toLowerCase(),
        role: 'instructor',
        organization_id: orgId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const setupLink = `${baseUrl}/accept-invite?token=${invite.token}`;
    try {
      const html = generateInvitationTemplate(req.user.organization_id?.name || 'Your Organization', setupLink);
      await emailService.sendEmail({
        to: email,
        subject: 'Smart LMS Instructor Invitation',
        html
      });
    } catch (mailErr) {
      console.warn('Mail send failed, continuing:', mailErr.message);
    }

    res.success({ invite: { token: invite.token, expires_at: invite.expires_at } }, 'Invitation email sent');

    // Record Event
    await recordOrgEvent(orgId, EVENT_TYPES.NEW_INSTRUCTOR, `New instructor invited: ${name} (${email})`);

  } catch (error) {
    console.error('❌ [CREATE INSTRUCTOR ERROR]:', error);
    if (error.stack) console.error(error.stack);
    res.error(error.message, 'Failed to create instructor', 500);
  }
});

// Create Student (invite flow)
router.post('/users/create-student', async (req, res) => {
  try {
    const orgId = (req.user.organization_id && req.user.organization_id._id) ? req.user.organization_id._id : req.user.organization_id;
    const { name, email, admissionNumber } = req.body || {};
    if (!orgId) {
      return res.error('Organization not found', 'Authentication error: missing organization', 401);
    }
    if (!name || !email) {
      return res.error('Name and email are required', 'Validation failed', 400);
    }
    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!emailPattern.test(email)) {
      return res.error('Invalid email', 'Validation failed', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase(), organization_id: orgId }).lean();
    if (existing) {
      return res.error('User already exists in this organization', 'Conflict', 409);
    }

    let invite = await Invite.findOne({
      email: email.toLowerCase(),
      organization_id: orgId,
      role: 'student',
      used: false,
      expires_at: { $gt: new Date() }
    }).lean();
    if (!invite) {
      const token = crypto.randomBytes(32).toString('hex');
      invite = await Invite.create({
        email: email.toLowerCase(),
        role: 'student',
        organization_id: orgId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const setupLink = `${baseUrl}/accept-invite?token=${invite.token}`;
    try {
      const html = generateInvitationTemplate(req.user.organization_id?.name || 'Your Organization', setupLink);
      await emailService.sendEmail({
        to: email,
        subject: 'Smart LMS Student Invitation',
        html
      });
    } catch (mailErr) {
      console.warn('Mail send failed, continuing:', mailErr.message);
    }

    res.success({ invite: { token: invite.token, expires_at: invite.expires_at }, admissionNumber }, 'Invitation email sent');

    // Record Event
    await recordOrgEvent(orgId, EVENT_TYPES.NEW_STUDENT, `New student invited: ${name} (${email})`);

  } catch (error) {
    console.error('❌ [CREATE STUDENT ERROR]:', error);
    if (error.stack) console.error(error.stack);
    res.error(error.message, 'Failed to create student', 500);
  }
});

// List instructors for org
router.get('/users/instructors', async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const users = await User.find({ organization_id: orgId, role: 'instructor' })
      .select('_id name email status email_verified createdAt');
    res.success({ users }, 'Instructors retrieved successfully');
  } catch (error) {
    res.error(error.message, 'Failed to fetch instructors', 500);
  }
});

// List students for org
router.get('/users/students', async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const users = await User.find({ organization_id: orgId, role: 'student' })
      .select('_id name email status email_verified createdAt');
    res.success({ users }, 'Students retrieved successfully');
  } catch (error) {
    res.error(error.message, 'Failed to fetch students', 500);
  }
});

module.exports = router;
