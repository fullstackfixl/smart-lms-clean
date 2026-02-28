const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const OrganizationEvent = require('../models/OrganizationEvent');

// GET /api/org/events - Fetch recent activities for organization admins
router.get('/events', auth, async (req, res) => {
    try {
        // Only Org Admins or Platform Admins
        if (!['admin', 'org_admin', 'platform_admin', 'superAdmin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const events = await OrganizationEvent.find({ organizationId: req.user.organization_id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
