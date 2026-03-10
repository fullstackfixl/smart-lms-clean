const express = require('express');
const router = express.Router();

const dashboardRoutes = require('./dashboard');
const collegeRoutes = require('./college');
const schoolRoutes = require('./school');
const instituteRoutes = require('./institute');
const corporateRoutes = require('./corporate');

// Organization Dashboard (Dynamic)
router.use('/dashboard', dashboardRoutes);

// Specialized Features
router.use('/college', collegeRoutes);
router.use('/school', schoolRoutes);
router.use('/institute', instituteRoutes);
router.use('/corporate', corporateRoutes);

module.exports = router;
