const express = require('express');
const router = express.Router();

const adminRoutes = require('./adminFull');
const instructorRoutes = require('./instructorFull');
const studentRoutes = require('./studentFull');
const instructorAttendanceRoutes = require('./instructorAttendance');
const studentAttendanceRoutes = require('./studentAttendance');
const adminAttendanceRoutes = require('./adminAttendance');

router.use('/admin', adminRoutes);
router.use('/instructor', instructorRoutes);
router.use('/student', studentRoutes);

// Attendance routes
router.use('/instructor/attendance', instructorAttendanceRoutes);
router.use('/student/attendance', studentAttendanceRoutes);
router.use('/admin/attendance', adminAttendanceRoutes);

// Messaging routes
const messagesRoutes = require('./messages');
router.use('/messages', messagesRoutes);

module.exports = router;
