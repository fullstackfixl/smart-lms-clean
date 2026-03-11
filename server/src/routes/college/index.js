const express = require('express');
const router = express.Router();

const adminRoutes = require('./adminFull');
const instructorRoutes = require('./instructorFull');
const studentRoutes = require('./studentFull');

router.use('/admin', adminRoutes);
router.use('/instructor', instructorRoutes);
router.use('/student', studentRoutes);

module.exports = router;
