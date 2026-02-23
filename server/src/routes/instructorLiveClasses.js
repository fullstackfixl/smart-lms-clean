const express = require('express');
const router = express.Router();
const LiveClass = require('../models/LiveClass');
const User = require('../models/User');
const Course = require('../models/Course');
const { authMiddleware, requireRole } = require('../middleware/auth');
const sendEmail = require('../utils/email');

// Helper: try to resolve socketService safely (it may not be initialized yet)
let socketService = null;
try { socketService = require('../services/socketService'); } catch (_) { }

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — send live class notification emails asynchronously
// ─────────────────────────────────────────────────────────────────────────────
async function notifyOrgStudents(liveClass, instructor, course) {
    try {
        const students = await User.find({
            organization_id: liveClass.organization_id,
            role: 'student',
            isActive: { $ne: false }
        }).select('name email');

        if (!students.length) return;

        const scheduledAt = new Date(liveClass.scheduled_date);
        const [h, m] = liveClass.start_time.split(':');
        scheduledAt.setHours(Number(h), Number(m), 0, 0);
        const dateStr = scheduledAt.toLocaleString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        });
        const courseName = course ? course.title : 'General';
        const meetingUrl = liveClass.meeting_url || '#';

        const emailHtml = (studentName) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">📹 New Live Class Scheduled</h1>
        </div>
        <div style="padding:28px 24px;background:#fff">
          <p style="color:#374151;font-size:15px">Hi <strong>${studentName}</strong>,</p>
          <p style="color:#374151;font-size:15px">Your instructor has scheduled a new live class. Here are the details:</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr><td style="padding:10px 14px;background:#f3f4f6;border-radius:6px 0 0 6px;color:#6b7280;font-size:13px;width:36%"><strong>Title</strong></td>
                <td style="padding:10px 14px;background:#f9fafb;color:#111827;font-size:14px">${liveClass.title}</td></tr>
            <tr><td style="padding:10px 14px;background:#f3f4f6;color:#6b7280;font-size:13px"><strong>Course</strong></td>
                <td style="padding:10px 14px;background:#f9fafb;color:#111827;font-size:14px">${courseName}</td></tr>
            <tr><td style="padding:10px 14px;background:#f3f4f6;color:#6b7280;font-size:13px"><strong>Instructor</strong></td>
                <td style="padding:10px 14px;background:#f9fafb;color:#111827;font-size:14px">${instructor.name}</td></tr>
            <tr><td style="padding:10px 14px;background:#f3f4f6;color:#6b7280;font-size:13px"><strong>Date & Time</strong></td>
                <td style="padding:10px 14px;background:#f9fafb;color:#111827;font-size:14px">${dateStr}</td></tr>
            <tr><td style="padding:10px 14px;background:#f3f4f6;color:#6b7280;font-size:13px"><strong>Duration</strong></td>
                <td style="padding:10px 14px;background:#f9fafb;color:#111827;font-size:14px">${liveClass.duration_minutes} minutes</td></tr>
          </table>
          ${liveClass.description ? `<p style="color:#374151;font-size:14px;border-left:4px solid #6366f1;padding-left:12px;margin:20px 0">${liveClass.description}</p>` : ''}
          <div style="text-align:center;margin:28px 0">
            <a href="${meetingUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">🎥 Join Live Class</a>
          </div>
          <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:24px">Smart LMS — Learning Management System</p>
        </div>
      </div>
    `;

        // Send emails asynchronously — do NOT await, failures are logged only
        const emailPromises = students.map(s =>
            sendEmail({ to: s.email, subject: `📹 New Live Class: ${liveClass.title}`, html: emailHtml(s.name) })
                .catch(err => console.error(`[LiveClass] Email failed for ${s.email}:`, err.message))
        );
        Promise.all(emailPromises).then(() =>
            console.log(`[LiveClass] Emails dispatched to ${students.length} students`)
        );

        // Socket broadcast to org room
        if (socketService && socketService.io) {
            try {
                socketService.broadcastToOrganization(liveClass.organization_id.toString(), 'live_class:new', {
                    _id: liveClass._id,
                    title: liveClass.title,
                    scheduledDate: liveClass.scheduled_date,
                    startTime: liveClass.start_time,
                    durationMinutes: liveClass.duration_minutes,
                    instructorName: instructor.name,
                    courseName,
                    meetingUrl
                });
            } catch (e) {
                console.warn('[LiveClass] Socket broadcast failed:', e.message);
            }
        }
    } catch (err) {
        console.error('[LiveClass] notifyOrgStudents error:', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /instructor/live-classes
// Instructor schedules a live class → emails all org students
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireRole(['instructor']), async (req, res) => {
    try {
        const { title, description, courseId, meetingLink, scheduledAt, duration } = req.body;
        const instructor = req.user;

        // --- Validation ---
        if (!title || !scheduledAt || !duration) {
            return res.error('Missing fields', 'title, scheduledAt, and duration are required', 400);
        }
        if (!instructor.organization_id) {
            return res.error('No organization', 'Instructor must belong to an organization', 400);
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
            return res.error('Invalid date', 'scheduledAt must be a valid future datetime', 400);
        }
        const durationMin = parseInt(duration);
        if (isNaN(durationMin) || durationMin < 15 || durationMin > 480) {
            return res.error('Invalid duration', 'duration must be between 15 and 480 minutes', 400);
        }
        if (meetingLink && !/^https?:\/\//.test(meetingLink)) {
            return res.error('Invalid URL', 'meetingLink must be a valid https:// URL', 400);
        }

        // Validate & resolve courseId
        let course = null;
        let resolvedCourseId = courseId;
        if (courseId) {
            // Validate if courseId is a valid ObjectId to prevent 500 casting error
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.error('Invalid Course ID', 'The provided Course ID is not a valid identifier', 400);
            }
            course = await Course.findOne({ _id: courseId, organization_id: instructor.organization_id });
            if (!course) {
                return res.error('Course not found', 'Course not found in your organization', 404);
            }
        } else {
            // course_id is required by LiveClass model — use a sentinel or first org course
            const fallback = await Course.findOne({ organization_id: instructor.organization_id }).select('_id');
            if (!fallback) {
                return res.error('No courses', 'Create a course first before scheduling a live class, or provide courseId', 400);
            }
            resolvedCourseId = fallback._id;
            course = fallback;
        }

        // Parse date and time from scheduledAt
        const startTimeStr = `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`;

        const liveClass = new LiveClass({
            organization_id: instructor.organization_id,
            course_id: resolvedCourseId,
            instructor_id: instructor._id,
            title: title.trim(),
            description: description?.trim() || '',
            scheduled_date: scheduledDate,
            start_time: startTimeStr,
            duration_minutes: durationMin,
            meeting_url: meetingLink || undefined,
            status: 'scheduled'
        });

        await liveClass.save();

        // Populate before responding
        await liveClass.populate('course_id', 'title');
        await liveClass.populate('instructor_id', 'name email');

        // Fire-and-forget: email all org students
        const fullInstructor = await User.findById(instructor._id).select('name email');
        notifyOrgStudents(liveClass, fullInstructor, course);

        return res.success({
            liveClass: {
                _id: liveClass._id,
                title: liveClass.title,
                description: liveClass.description,
                scheduledDate: liveClass.scheduled_date,
                startTime: liveClass.start_time,
                durationMinutes: liveClass.duration_minutes,
                meetingUrl: liveClass.meeting_url,
                status: liveClass.status,
                course: liveClass.course_id,
                instructor: liveClass.instructor_id
            }
        }, 'Live class scheduled. Email notifications sent to all students.');

    } catch (err) {
        console.error('[LiveClass POST] Error:', err.message);
        res.error(err.message, 'Failed to schedule live class', 500);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /instructor/live-classes
// Returns classes scheduled by this instructor (most recent first)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authMiddleware, requireRole(['instructor']), async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {
            instructor_id: req.user._id,
            organization_id: req.user.organization_id,
            is_active: true
        };
        if (status) query.status = status;

        const classes = await LiveClass.find(query)
            .sort({ scheduled_date: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('course_id', 'title')
            .lean();

        const total = await LiveClass.countDocuments(query);

        return res.success({ classes, total, page: Number(page) }, 'Live classes retrieved');
    } catch (err) {
        console.error('[LiveClass GET instructor] Error:', err.message);
        res.error(err.message, 'Failed to fetch live classes', 500);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /instructor/live-classes/:id  — Cancel a class
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireRole(['instructor']), async (req, res) => {
    try {
        const lc = await LiveClass.findOne({
            _id: req.params.id,
            instructor_id: req.user._id,
            organization_id: req.user.organization_id
        });
        if (!lc) return res.error('Not found', 'Live class not found', 404);

        lc.status = 'cancelled';
        lc.is_active = false;
        await lc.save();
        return res.success(null, 'Live class cancelled');
    } catch (err) {
        res.error(err.message, 'Failed to cancel live class', 500);
    }
});

module.exports = router;
