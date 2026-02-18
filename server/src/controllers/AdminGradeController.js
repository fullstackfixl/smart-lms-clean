const Grade = require('../models/Grade');
const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all grades with filtering
exports.getGrades = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { page = 1, limit = 20, course_id, student_id, type } = req.query;

        const query = { organization_id: organizationId, is_active: true };

        if (course_id) query.course_id = course_id;
        if (student_id) query.student_id = student_id;
        if (type) query.assignment_type = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const grades = await Grade.find(query)
            .populate('student_id', 'profile.fullName email')
            .populate('course_id', 'title')
            .populate('graded_by', 'profile.fullName')
            .sort({ graded_date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Grade.countDocuments(query);

        res.success({
            grades,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, 'Grades retrieved successfully');
    } catch (error) {
        console.error('Get grades error:', error);
        res.error(error.message, 'Failed to fetch grades', 500);
    }
};

// Get grades for a specific course
exports.getCourseGrades = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organization_id;

        const course = await Course.findOne({ _id: id, organization_id: organizationId });
        if (!course) {
            return res.error('Course not found', 'Not found', 404);
        }

        const grades = await Grade.find({ course_id: id, organization_id: organizationId, is_active: true })
            .populate('student_id', 'profile.fullName email')
            .sort({ student_id: 1, assignment_title: 1 });

        res.success({ grades }, 'Course grades retrieved successfully');
    } catch (error) {
        console.error('Get course grades error:', error);
        res.error(error.message, 'Failed to fetch course grades', 500);
    }
};

// Export grades (CSV)
exports.exportGrades = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { course_id } = req.body;

        const query = { organization_id: organizationId, is_active: true };
        if (course_id) query.course_id = course_id;

        const grades = await Grade.find(query)
            .populate('student_id', 'profile.fullName email')
            .populate('course_id', 'title')
            .sort({ created_at: -1 });

        // formatted for CSV export on client side
        const csvData = grades.map(g => ({
            Student: g.student_id?.profile?.fullName || 'Unknown',
            Email: g.student_id?.email || 'Unknown',
            Course: g.course_id?.title || 'Unknown',
            Assignment: g.assignment_title,
            Type: g.assignment_type,
            Score: g.earned_score,
            Max: g.max_score,
            Percentage: g.percentage + '%',
            Weight: g.weight + '%',
            Date: g.graded_date ? new Date(g.graded_date).toLocaleDateString() : 'N/A'
        }));

        res.success({ csvData }, 'Grades exported successfully');
    } catch (error) {
        console.error('Export grades error:', error);
        res.error(error.message, 'Failed to export grades', 500);
    }
};

// Audit grades - find missing entries or anomalies
exports.auditGrades = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;

        // Example audit: Find students with 0 grades in active courses
        // This is a complex query, simplified for now to finding grades with potential issues

        const anomalies = await Grade.find({
            organization_id: organizationId,
            is_active: true,
            $or: [
                { earned_score: { $gt: '$max_score', $exists: true } }, // Score > Max (if validation bypassed)
                { weight: 0 } // Zero weight assignments might be accidental
            ]
        })
            .populate('student_id', 'profile.fullName')
            .populate('course_id', 'title')
            .limit(50);

        res.success({ anomalies }, 'Grade audit completed');
    } catch (error) {
        console.error('Audit grades error:', error);
        res.error(error.message, 'Failed to audit grades', 500);
    }
};
