const Fee = require('../models/Fee');
const User = require('../models/User');
const Course = require('../models/Course');
const mailer = require('../services/mailer');
const mongoose = require('mongoose');

// Set fees (Individual or Bulk)
exports.setFee = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const {
            student_id,
            course_id,
            title,
            description,
            amount,
            due_date,
            fee_type,
            academic_year,
            semester
        } = req.body;

        // Validate common fields
        if (!title || !amount || !due_date || !fee_type) {
            return res.error('Missing required fields', 'Validation failed', 400);
        }

        if (student_id) {
            // Create single fee
            const fee = new Fee({
                organization_id: organizationId,
                student_id,
                course_id,
                title,
                description,
                amount,
                due_date,
                fee_type,
                academic_year,
                semester,
                created_by: req.user._id
            });
            await fee.save();
            return res.success({ fee }, 'Fee created successfully');
        } else if (course_id) {
            // Create bulk fees for course
            const fees = await Fee.createBulkCourseFees(
                course_id,
                organizationId,
                {
                    title,
                    description,
                    amount,
                    due_date,
                    academic_year,
                    semester
                },
                req.user._id
            );
            return res.success({ count: fees.length, fees }, 'Bulk fees created successfully for course');
        } else {
            return res.error('Either student_id or course_id is required', 'Validation failed', 400);
        }

    } catch (error) {
        console.error('Set fee error:', error);
        res.error(error.message, 'Failed to set fee', 500);
    }
};

// Get pending fees
exports.getPendingFees = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { page = 1, limit = 20, student_id } = req.query;

        const query = {
            organization_id: organizationId,
            status: { $in: ['pending', 'partially_paid', 'overdue'] },
            is_active: true
        };

        if (student_id) query.student_id = student_id;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const fees = await Fee.find(query)
            .populate('student_id', 'profile.fullName email')
            .populate('course_id', 'title')
            .sort({ due_date: 1 }) // Urgency first
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Fee.countDocuments(query);

        res.success({
            fees,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, 'Pending fees retrieved');
    } catch (error) {
        console.error('Get pending fees error:', error);
        res.error(error.message, 'Failed to fetch pending fees', 500);
    }
};

// Get fee history (paid)
exports.getFeeHistory = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { page = 1, limit = 20, student_id, start_date, end_date } = req.query;

        const query = {
            organization_id: organizationId,
            status: 'paid', // Intentionally strictly paid for "History" context usually, or could include all. Let's stick to paid/history.
            is_active: true
        };

        if (student_id) query.student_id = student_id;

        if (start_date && end_date) {
            query['payment_details.payment_date'] = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const fees = await Fee.find(query)
            .populate('student_id', 'profile.fullName email')
            .populate('course_id', 'title')
            .sort({ 'payment_details.payment_date': -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Fee.countDocuments(query);

        res.success({
            fees,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        }, 'Fee history retrieved');
    } catch (error) {
        console.error('Get fee history error:', error);
        res.error(error.message, 'Failed to fetch fee history', 500);
    }
};

// Send reminder
exports.sendReminder = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { fee_id } = req.body;

        const fee = await Fee.findOne({ _id: fee_id, organization_id: organizationId })
            .populate('student_id', 'profile.fullName email');

        if (!fee) {
            return res.error('Fee record not found', 'Not found', 404);
        }

        if (fee.status === 'paid') {
            return res.error('Fee is already paid', 'Invalid action', 400);
        }

        if (!fee.student_id || !fee.student_id.email) {
            return res.error('Student email not found', 'Validation failed', 400);
        }

        const emailResult = await mailer.sendEmail(fee.student_id.email, `Fee Reminder: ${fee.title}`, `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Fee Reminder</h2>
                <p>Dear ${fee.student_id.profile.fullName},</p>
                <p>This is a reminder regarding the pending fee payment for <strong>"${fee.title}"</strong>.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Amount:</strong> ${fee.currency} ${fee.amount}</p>
                    <p><strong>Due Date:</strong> ${new Date(fee.due_date).toLocaleDateString()}</p>
                </div>
                <p>Please ensure payment is made before the due date to avoid any late fees.</p>
                <p>Regards,<br/>Smart LMS Admin</p>
            </div>
        `);

        if (emailResult) {
            await fee.markReminderSent('due_soon', null);
            return res.success({ emailResult }, 'Reminder sent successfully');
        } else {
            return res.error('Failed to send email', 'Email Error', 500);
        }

    } catch (error) {
        console.error('Send reminder error:', error);
        res.error(error.message, 'Failed to send reminder', 500);
    }
};

// Get revenue
exports.getRevenue = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const stats = await Fee.getFeeStatistics(organizationId);
        res.success({ stats }, 'Revenue statistics retrieved');
    } catch (error) {
        console.error('Get revenue error:', error);
        res.error(error.message, 'Failed to fetch revenue', 500);
    }
};
