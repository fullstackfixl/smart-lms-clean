const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const Event = require('../models/Event');
const Course = require('../models/Course');
const User = require('../models/User');
const { localUpload } = require('../middleware/upload');

// Create event
router.post('/', auth, localUpload.array('attachments', 5), async (req, res) => {
  try {
    // Only org_admin and instructors can create events
    if (!['org_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators and instructors can create events'
      });
    }

    const {
      title,
      description,
      event_type,
      event_date,
      start_time,
      end_time,
      all_day,
      location,
      virtual_link,
      is_virtual,
      max_attendees,
      rsvp_enabled,
      rsvp_deadline,
      target_audience,
      course_specific,
      grade_specific,
      tags,
      priority,
      organizers,
      feedback_enabled,
      feedback_questions
    } = req.body;

    // Validate required fields
    if (!title || !event_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Title and event date are required'
      });
    }

    if (!all_day && (!start_time || !end_time)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Start time and end time are required for non-all-day events'
      });
    }

    // Verify course belongs to organization if course_specific
    if (course_specific) {
      const course = await Course.findOne({
        _id: course_specific,
        organization_id: req.user.organization_id
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found',
          message: 'Course not found in your organization'
        });
      }
    }

    // Process attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          original_name: file.originalname,
          url: `/uploads/${file.filename}`,
          file_type: file.mimetype,
          file_size: file.size,
          uploaded_by: req.user._id
        });
      }
    }

    // Create event
    const event = new Event({
      organization_id: req.user.organization_id,
      title,
      description,
      event_type: event_type || 'academic',
      event_date: new Date(event_date),
      start_time: all_day ? null : start_time,
      end_time: all_day ? null : end_time,
      all_day: all_day || false,
      location,
      virtual_link,
      is_virtual: is_virtual || false,
      max_attendees: max_attendees ? parseInt(max_attendees) : null,
      rsvp_enabled: rsvp_enabled !== false,
      rsvp_deadline: rsvp_deadline ? new Date(rsvp_deadline) : null,
      target_audience: Array.isArray(target_audience) ? target_audience : (target_audience ? [target_audience] : ['all']),
      course_specific,
      grade_specific: Array.isArray(grade_specific) ? grade_specific : (grade_specific ? [grade_specific] : []),
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      priority: priority || 'medium',
      created_by: req.user._id,
      organizers: Array.isArray(organizers) ? organizers : (organizers ? [organizers] : [req.user._id]),
      attachments,
      feedback_enabled: feedback_enabled || false,
      feedback_questions: feedback_questions || []
    });

    await event.save();

    // Populate for response
    await event.populate([
      { path: 'created_by', select: 'full_name email' },
      { path: 'course_specific', select: 'title' },
      { path: 'organizers', select: 'full_name email' }
    ]);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error creating event'
    });
  }
});

// Get events
router.get('/', auth, async (req, res) => {
  try {
    const {
      event_type,
      status,
      target_audience,
      course_specific,
      start_date,
      end_date,
      upcoming_only,
      my_events_only,
      limit = 50,
      page = 1
    } = req.query;

    const filters = {};
    if (event_type) filters.event_type = event_type;
    if (status) filters.status = status;
    if (course_specific) filters.course_specific = course_specific;

    // Date filtering
    if (start_date || end_date || upcoming_only === 'true') {
      filters.event_date = {};
      if (start_date) filters.event_date.$gte = new Date(start_date);
      if (end_date) filters.event_date.$lte = new Date(end_date);
      if (upcoming_only === 'true') filters.event_date.$gte = new Date();
    }

    // Target audience filtering
    if (target_audience) {
      filters.target_audience = { $in: [target_audience, 'all'] };
    } else {
      // Filter based on user role
      filters.target_audience = { $in: [req.user.role, 'all'] };
    }

    // My events only (created by or organized by user)
    if (my_events_only === 'true') {
      filters.$or = [
        { created_by: req.user._id },
        { organizers: req.user._id }
      ];
    }

    const skip = (page - 1) * limit;

    const events = await Event.findByOrganization(req.user.organization_id, filters)
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await Event.countDocuments({
      organization_id: req.user.organization_id,
      is_active: true,
      ...filters
    });

    // Add RSVP status for current user
    const eventsWithRSVP = events.map(event => {
      const userRSVP = event.rsvps.find(rsvp => rsvp.user_id.toString() === req.user._id.toString());
      
      return {
        id: event._id,
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day,
        location: event.location,
        virtual_link: event.virtual_link,
        is_virtual: event.is_virtual,
        max_attendees: event.max_attendees,
        rsvp_enabled: event.rsvp_enabled,
        rsvp_deadline: event.rsvp_deadline,
        target_audience: event.target_audience,
        course_specific: event.course_specific,
        tags: event.tags,
        priority: event.priority,
        status: event.status,
        current_status: event.current_status,
        created_by: event.created_by,
        organizers: event.organizers,
        rsvp_summary: event.rsvp_summary,
        user_rsvp: userRSVP ? {
          response: userRSVP.response,
          waitlisted: userRSVP.waitlisted,
          waitlist_position: userRSVP.waitlist_position,
          responded_at: userRSVP.responded_at
        } : null,
        can_rsvp: event.canUserRSVP(req.user),
        attachments: event.attachments.map(att => ({
          filename: att.filename,
          original_name: att.original_name,
          url: att.url,
          file_type: att.file_type,
          file_size: att.file_size
        })),
        created_at: event.created_at
      };
    });

    res.json({
      success: true,
      data: {
        events: eventsWithRSVP,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / limit),
          total_records: totalRecords,
          has_next: page * limit < totalRecords,
          has_prev: page > 1
        }
      },
      message: 'Events retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving events'
    });
  }
});

// Get specific event
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    }).populate([
      { path: 'created_by', select: 'full_name email' },
      { path: 'course_specific', select: 'title description' },
      { path: 'organizers', select: 'full_name email' },
      { path: 'rsvps.user_id', select: 'full_name email role' }
    ]);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event not found in your organization'
      });
    }

    // Check if user can view this event
    const canView = event.target_audience.includes('all') || 
                   event.target_audience.includes(req.user.role) ||
                   event.created_by._id.toString() === req.user._id.toString() ||
                   event.organizers.some(org => org._id.toString() === req.user._id.toString());

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view this event'
      });
    }

    const userRSVP = event.rsvps.find(rsvp => rsvp.user_id._id.toString() === req.user._id.toString());

    const eventData = {
      ...event.toObject(),
      current_status: event.current_status,
      rsvp_summary: event.rsvp_summary,
      user_rsvp: userRSVP ? {
        response: userRSVP.response,
        notes: userRSVP.notes,
        waitlisted: userRSVP.waitlisted,
        waitlist_position: userRSVP.waitlist_position,
        responded_at: userRSVP.responded_at
      } : null,
      can_rsvp: event.canUserRSVP(req.user),
      duration_minutes: event.duration_minutes
    };

    res.json({
      success: true,
      data: eventData,
      message: 'Event retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving event'
    });
  }
});

// Update event
router.put('/:id', auth, localUpload.array('attachments', 5), async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event not found in your organization'
      });
    }

    // Check if user can update this event
    const canUpdate = req.user.role === 'org_admin' ||
                     event.created_by.toString() === req.user._id.toString() ||
                     event.organizers.includes(req.user._id);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to update this event'
      });
    }

    const {
      title,
      description,
      event_type,
      event_date,
      start_time,
      end_time,
      all_day,
      location,
      virtual_link,
      is_virtual,
      max_attendees,
      rsvp_enabled,
      rsvp_deadline,
      target_audience,
      course_specific,
      grade_specific,
      tags,
      priority,
      organizers,
      status,
      cancellation_reason,
      feedback_enabled,
      feedback_questions
    } = req.body;

    // Update fields
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (event_type) event.event_type = event_type;
    if (event_date) event.event_date = new Date(event_date);
    if (start_time !== undefined) event.start_time = start_time;
    if (end_time !== undefined) event.end_time = end_time;
    if (all_day !== undefined) event.all_day = all_day;
    if (location !== undefined) event.location = location;
    if (virtual_link !== undefined) event.virtual_link = virtual_link;
    if (is_virtual !== undefined) event.is_virtual = is_virtual;
    if (max_attendees !== undefined) event.max_attendees = max_attendees ? parseInt(max_attendees) : null;
    if (rsvp_enabled !== undefined) event.rsvp_enabled = rsvp_enabled;
    if (rsvp_deadline !== undefined) event.rsvp_deadline = rsvp_deadline ? new Date(rsvp_deadline) : null;
    if (target_audience) event.target_audience = Array.isArray(target_audience) ? target_audience : [target_audience];
    if (course_specific !== undefined) event.course_specific = course_specific;
    if (grade_specific) event.grade_specific = Array.isArray(grade_specific) ? grade_specific : [grade_specific];
    if (tags) event.tags = Array.isArray(tags) ? tags : [tags];
    if (priority) event.priority = priority;
    if (organizers) event.organizers = Array.isArray(organizers) ? organizers : [organizers];
    if (status) event.status = status;
    if (cancellation_reason !== undefined) event.cancellation_reason = cancellation_reason;
    if (feedback_enabled !== undefined) event.feedback_enabled = feedback_enabled;
    if (feedback_questions) event.feedback_questions = feedback_questions;

    // Process new attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        event.attachments.push({
          filename: file.filename,
          original_name: file.originalname,
          url: `/uploads/${file.filename}`,
          file_type: file.mimetype,
          file_size: file.size,
          uploaded_by: req.user._id
        });
      }
    }

    await event.save();

    // Populate for response
    await event.populate([
      { path: 'created_by', select: 'full_name email' },
      { path: 'course_specific', select: 'title' },
      { path: 'organizers', select: 'full_name email' }
    ]);

    res.json({
      success: true,
      data: event,
      message: 'Event updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error updating event'
    });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event not found in your organization'
      });
    }

    // Check if user can delete this event
    const canDelete = req.user.role === 'org_admin' ||
                     event.created_by.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to delete this event'
      });
    }

    event.is_active = false;
    await event.save();

    res.json({
      success: true,
      data: { id: event._id },
      message: 'Event deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error deleting event'
    });
  }
});

// RSVP to event
router.post('/:id/rsvp', auth, async (req, res) => {
  try {
    const { response, notes } = req.body;

    if (!response || !['attending', 'not_attending', 'maybe'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response',
        message: 'Response must be attending, not_attending, or maybe'
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event not found in your organization'
      });
    }

    // Check if user can RSVP
    const canRSVP = event.canUserRSVP(req.user);
    if (!canRSVP.can_rsvp) {
      return res.status(403).json({
        success: false,
        error: 'RSVP not allowed',
        message: canRSVP.reason
      });
    }

    await event.addRSVP(req.user._id, response, notes || '');

    res.json({
      success: true,
      data: {
        event_id: event._id,
        user_rsvp: {
          response,
          notes,
          responded_at: new Date()
        },
        rsvp_summary: event.rsvp_summary
      },
      message: 'RSVP submitted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error submitting RSVP'
    });
  }
});

// Update RSVP
router.put('/:id/rsvp', auth, async (req, res) => {
  try {
    const { response, notes } = req.body;

    if (!response || !['attending', 'not_attending', 'maybe'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response',
        message: 'Response must be attending, not_attending, or maybe'
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id,
      is_active: true
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event not found in your organization'
      });
    }

    await event.updateRSVP(req.user._id, response, notes || '');

    const userRSVP = event.rsvps.find(rsvp => rsvp.user_id.toString() === req.user._id.toString());

    res.json({
      success: true,
      data: {
        event_id: event._id,
        user_rsvp: {
          response: userRSVP.response,
          notes: userRSVP.notes,
          waitlisted: userRSVP.waitlisted,
          waitlist_position: userRSVP.waitlist_position,
          responded_at: userRSVP.responded_at
        },
        rsvp_summary: event.rsvp_summary
      },
      message: 'RSVP updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error updating RSVP'
    });
  }
});

// Cancel event
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason, notify_attendees = true } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Cancellation reason required',
        message: 'Please provide a reason for cancellation'
      });
    }

    const event = await Event.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event not found in your organization'
      });
    }

    // Check if user can cancel this event
    const canCancel = req.user.role === 'org_admin' ||
                     event.created_by.toString() === req.user._id.toString() ||
                     event.organizers.includes(req.user._id);

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to cancel this event'
      });
    }

    await event.cancelEvent(reason, notify_attendees);

    res.json({
      success: true,
      data: {
        id: event._id,
        status: event.status,
        cancellation_reason: event.cancellation_reason
      },
      message: 'Event cancelled successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error cancelling event'
    });
  }
});

// Get event attendees (for organizers)
router.get('/:id/attendees', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    }).populate('rsvps.user_id', 'full_name email role phone');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        message: 'Event not found in your organization'
      });
    }

    // Check if user can view attendees
    const canView = req.user.role === 'org_admin' ||
                   event.created_by.toString() === req.user._id.toString() ||
                   event.organizers.includes(req.user._id);

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view attendees'
      });
    }

    const attendees = event.rsvps.map(rsvp => ({
      user: {
        id: rsvp.user_id._id,
        name: rsvp.user_id.full_name,
        email: rsvp.user_id.email,
        role: rsvp.user_id.role,
        phone: rsvp.user_id.phone
      },
      response: rsvp.response,
      notes: rsvp.notes,
      waitlisted: rsvp.waitlisted,
      waitlist_position: rsvp.waitlist_position,
      responded_at: rsvp.responded_at
    }));

    const summary = {
      total_rsvps: attendees.length,
      attending: attendees.filter(a => a.response === 'attending' && !a.waitlisted).length,
      maybe: attendees.filter(a => a.response === 'maybe').length,
      not_attending: attendees.filter(a => a.response === 'not_attending').length,
      waitlisted: attendees.filter(a => a.waitlisted).length
    };

    res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          event_date: event.event_date,
          max_attendees: event.max_attendees
        },
        attendees,
        summary
      },
      message: 'Event attendees retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving event attendees'
    });
  }
});

// Get event statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    if (!['org_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators and instructors can view event statistics'
      });
    }

    const { start_date, end_date, event_type } = req.query;

    const filters = {};
    if (start_date || end_date) {
      filters.event_date = {};
      if (start_date) filters.event_date.$gte = new Date(start_date);
      if (end_date) filters.event_date.$lte = new Date(end_date);
    }
    if (event_type) filters.event_type = event_type;

    const stats = await Event.getEventStatistics(req.user.organization_id, filters);

    res.json({
      success: true,
      data: stats,
      message: 'Event statistics retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving event statistics'
    });
  }
});

module.exports = router;