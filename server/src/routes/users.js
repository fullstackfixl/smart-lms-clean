const express = require('express');
const { User, Enrollment, Course } = require('../models');
const { authMiddleware, requireRole, parentAccessMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('organization_id', 'name domain')
      .populate('linkedStudents', 'profile.firstName profile.lastName email')
      .select('-password');

    if (!user) {
      return res.error('User not found', 'User profile not available', 404);
    }

    res.success({ user }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get profile error:', error);
    res.error(error.message, 'Failed to get profile', 500);
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, bio } = req.body;

    const updateData = {};
    if (firstName) updateData['profile.firstName'] = firstName;
    if (lastName) updateData['profile.lastName'] = lastName;
    if (phone) updateData['profile.phone'] = phone;
    if (dateOfBirth) updateData['profile.dateOfBirth'] = dateOfBirth;
    if (bio) updateData['profile.bio'] = bio;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.success({ user }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    res.error(error.message, 'Failed to update profile', 500);
  }
});

// Link student to parent (org_admin only)
router.post('/link-student', authMiddleware, requireRole(['admin', 'platform_admin']), async (req, res) => {
  try {
    const { parentId, studentId } = req.body;

    if (!parentId || !studentId) {
      return res.error('Missing data', 'Parent ID and Student ID are required', 400);
    }

    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);

    if (!parent || !student) {
      return res.error('User not found', 'Parent or student not found', 404);
    }

    if (parent.role !== 'parent') {
      return res.error('Invalid role', 'User must have parent role', 400);
    }

    if (student.role !== 'student') {
      return res.error('Invalid role', 'Target user must be a student', 400);
    }

    // Check organization match
    if (req.user.role !== 'platform_admin') {
      if (!parent.organization_id || !student.organization_id) {
        return res.error('Organization required', 'Both users must belong to an organization', 400);
      }

      if (parent.organization_id.toString() !== student.organization_id.toString()) {
        return res.error('Organization mismatch', 'Parent and student must be in same organization', 400);
      }

      if (req.user.organization_id.toString() !== parent.organization_id.toString()) {
        return res.error('Access denied', 'You can only manage users in your organization', 403);
      }
    }

    // Add student to parent's linked students
    await User.findByIdAndUpdate(parentId, {
      $addToSet: { linkedStudents: studentId }
    });

    res.success(null, 'Student linked to parent successfully');

  } catch (error) {
    console.error('Link student error:', error);
    res.error(error.message, 'Failed to link student', 500);
  }
});

// Get linked students (parent only)
router.get('/linked-students', authMiddleware, requireRole(['parent']), parentAccessMiddleware, async (req, res) => {
  try {
    const students = await User.find({
      _id: { $in: req.allowedStudents }
    }).select('profile.firstName profile.lastName email');

    // Get student progress
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.find({
          student_id: student._id,
          isActive: true
        }).populate('course_id', 'title');

        return {
          student: student,
          enrollments: enrollments.map(e => ({
            course: e.course_id.title,
            progress: e.progress,
            enrolledAt: e.enrolledAt
          }))
        };
      })
    );

    res.success({ students: studentsWithProgress }, 'Linked students retrieved successfully');

  } catch (error) {
    console.error('Get linked students error:', error);
    res.error(error.message, 'Failed to get linked students', 500);
  }
});

// Get student progress (parent access)
router.get('/student/:studentId/progress', authMiddleware, requireRole(['parent', 'admin', 'platform_admin']), parentAccessMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check parent access
    if (req.user.role === 'parent' && !req.allowedStudents.includes(studentId)) {
      return res.error('Access denied', 'You can only view linked students progress', 403);
    }

    const student = await User.findById(studentId).select('profile.firstName profile.lastName email');
    if (!student) {
      return res.error('Student not found', 'Student does not exist', 404);
    }

    const enrollments = await Enrollment.find({
      student_id: studentId,
      isActive: true
    }).populate('course_id', 'title description');

    const progress = enrollments.map(enrollment => ({
      course: {
        _id: enrollment.course_id._id,
        title: enrollment.course_id.title,
        description: enrollment.course_id.description
      },
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt
    }));

    res.success({
      student,
      progress
    }, 'Student progress retrieved successfully');

  } catch (error) {
    console.error('Get student progress error:', error);
    res.error(error.message, 'Failed to get student progress', 500);
  }
});

module.exports = router;