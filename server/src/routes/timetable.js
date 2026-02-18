const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/auth');
const TimetableEntry = require('../models/TimetableEntry');
const Course = require('../models/Course');
const User = require('../models/User');

// Create timetable entry
router.post('/', auth, async (req, res) => {
  try {
    // Only org_admin and instructors can create timetable entries
    if (!['org_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators and instructors can create timetable entries'
      });
    }

    const {
      course_id,
      instructor_id,
      day_of_week,
      start_time,
      end_time,
      room_number,
      building,
      location_details,
      session_type,
      recurring,
      effective_from,
      effective_until,
      max_capacity,
      equipment_required,
      notes,
      academic_year,
      semester
    } = req.body;

    // Validate required fields
    if (!course_id || !instructor_id || day_of_week === undefined || !start_time || !end_time || !effective_from) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Course, instructor, day, times, and effective date are required'
      });
    }

    // Verify course and instructor belong to same organization
    const course = await Course.findOne({
      _id: course_id,
      organization_id: req.user.organization_id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: 'Course not found in your organization'
      });
    }

    const instructor = await User.findOne({
      _id: instructor_id,
      organization_id: req.user.organization_id,
      role: 'instructor'
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        error: 'Instructor not found',
        message: 'Instructor not found in your organization'
      });
    }

    // Check for instructor conflicts
    const instructorConflicts = await TimetableEntry.findInstructorConflicts(
      instructor_id,
      day_of_week,
      start_time,
      end_time,
      req.user.organization_id
    );

    if (instructorConflicts.length > 0) {
      const conflictDetails = instructorConflicts.map(conflict => ({
        course: conflict.course_id,
        time_slot: `${conflict.start_time} - ${conflict.end_time}`,
        room: conflict.room_number
      }));

      return res.status(409).json({
        success: false,
        error: 'Instructor conflict detected',
        message: 'Instructor has conflicting schedule',
        data: {
          conflicts: conflictDetails,
          suggestions: await TimetableEntry.suggestAlternativeSlots(
            instructor_id,
            day_of_week,
            TimetableEntry.timeToMinutes(end_time) - TimetableEntry.timeToMinutes(start_time),
            req.user.organization_id
          )
        }
      });
    }

    // Check for room conflicts (informational)
    let roomConflicts = [];
    if (room_number) {
      roomConflicts = await TimetableEntry.findRoomConflicts(
        room_number,
        building,
        day_of_week,
        start_time,
        end_time,
        req.user.organization_id
      );
    }

    // Create timetable entry
    const timetableEntry = new TimetableEntry({
      organization_id: req.user.organization_id,
      course_id,
      instructor_id,
      day_of_week,
      start_time,
      end_time,
      room_number,
      building,
      location_details,
      session_type: session_type || 'lecture',
      recurring: recurring !== false,
      effective_from: new Date(effective_from),
      effective_until: effective_until ? new Date(effective_until) : null,
      max_capacity,
      equipment_required: equipment_required || [],
      notes,
      created_by: req.user._id,
      academic_year,
      semester
    });

    await timetableEntry.save();

    // Populate for response
    await timetableEntry.populate([
      { path: 'course_id', select: 'title' },
      { path: 'instructor_id', select: 'full_name email' },
      { path: 'created_by', select: 'full_name' }
    ]);

    const response = {
      success: true,
      data: timetableEntry,
      message: 'Timetable entry created successfully'
    };

    // Add room conflict warning if any
    if (roomConflicts.length > 0) {
      response.warnings = [{
        type: 'room_conflict',
        message: 'Room has conflicting bookings',
        conflicts: roomConflicts.map(conflict => ({
          course: conflict.course_id,
          instructor: conflict.instructor_id,
          time_slot: `${conflict.start_time} - ${conflict.end_time}`
        }))
      }];
    }

    res.status(201).json(response);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error creating timetable entry'
    });
  }
});

// Get timetable entries
router.get('/', auth, async (req, res) => {
  try {
    const {
      course_id,
      instructor_id,
      day_of_week,
      room_number,
      session_type,
      academic_year,
      semester,
      active_only = true,
      limit = 50,
      page = 1
    } = req.query;

    const filters = {};
    if (course_id) filters.course_id = course_id;
    if (instructor_id) filters.instructor_id = instructor_id;
    if (day_of_week !== undefined) filters.day_of_week = parseInt(day_of_week);
    if (room_number) filters.room_number = room_number;
    if (session_type) filters.session_type = session_type;
    if (academic_year) filters.academic_year = academic_year;
    if (semester) filters.semester = semester;
    if (active_only === 'true') filters.is_active = true;

    const skip = (page - 1) * limit;

    const timetableEntries = await TimetableEntry.findByOrganization(req.user.organization_id, filters)
      .limit(parseInt(limit))
      .skip(skip);

    const totalRecords = await TimetableEntry.countDocuments({
      organization_id: req.user.organization_id,
      ...filters
    });

    // Group by day for better organization
    const groupedByDay = {};
    timetableEntries.forEach(entry => {
      const day = entry.day_of_week;
      if (!groupedByDay[day]) {
        groupedByDay[day] = {
          day_number: day,
          day_name: entry.day_name,
          entries: []
        };
      }
      groupedByDay[day].entries.push({
        id: entry._id,
        course: {
          id: entry.course_id._id,
          title: entry.course_id.title
        },
        instructor: {
          id: entry.instructor_id._id,
          name: entry.instructor_id.full_name,
          email: entry.instructor_id.email
        },
        time_slot: entry.time_slot,
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration_minutes: entry.duration_minutes,
        location: entry.location_display,
        room_number: entry.room_number,
        building: entry.building,
        session_type: entry.session_type,
        recurring: entry.recurring,
        effective_from: entry.effective_from,
        effective_until: entry.effective_until,
        current_status: entry.current_status,
        max_capacity: entry.max_capacity,
        equipment_required: entry.equipment_required,
        notes: entry.notes,
        academic_year: entry.academic_year,
        semester: entry.semester,
        next_occurrence: entry.getNextOccurrence()
      });
    });

    // Convert to array and sort by day
    const schedule = Object.values(groupedByDay).sort((a, b) => a.day_number - b.day_number);

    res.json({
      success: true,
      data: {
        schedule,
        flat_entries: timetableEntries.map(entry => ({
          id: entry._id,
          course_title: entry.course_id.title,
          instructor_name: entry.instructor_id.full_name,
          day_name: entry.day_name,
          time_slot: entry.time_slot,
          location: entry.location_display,
          session_type: entry.session_type,
          current_status: entry.current_status
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRecords / limit),
          total_records: totalRecords,
          has_next: page * limit < totalRecords,
          has_prev: page > 1
        }
      },
      message: 'Timetable entries retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving timetable entries'
    });
  }
});

// Get specific timetable entry
router.get('/:id', auth, async (req, res) => {
  try {
    const timetableEntry = await TimetableEntry.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    }).populate([
      { path: 'course_id', select: 'title description' },
      { path: 'instructor_id', select: 'full_name email phone' },
      { path: 'created_by', select: 'full_name' }
    ]);

    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        error: 'Timetable entry not found',
        message: 'Timetable entry not found in your organization'
      });
    }

    res.json({
      success: true,
      data: {
        ...timetableEntry.toObject(),
        day_name: timetableEntry.day_name,
        time_slot: timetableEntry.time_slot,
        location_display: timetableEntry.location_display,
        current_status: timetableEntry.current_status,
        next_occurrence: timetableEntry.getNextOccurrence()
      },
      message: 'Timetable entry retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving timetable entry'
    });
  }
});

// Update timetable entry
router.put('/:id', auth, async (req, res) => {
  try {
    // Only org_admin and instructors can update timetable entries
    if (!['org_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators and instructors can update timetable entries'
      });
    }

    const timetableEntry = await TimetableEntry.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    });

    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        error: 'Timetable entry not found',
        message: 'Timetable entry not found in your organization'
      });
    }

    const {
      day_of_week,
      start_time,
      end_time,
      room_number,
      building,
      location_details,
      session_type,
      recurring,
      effective_until,
      max_capacity,
      equipment_required,
      notes,
      academic_year,
      semester
    } = req.body;

    // Check for conflicts if time or day changed
    if (day_of_week !== undefined || start_time || end_time) {
      const newDayOfWeek = day_of_week !== undefined ? day_of_week : timetableEntry.day_of_week;
      const newStartTime = start_time || timetableEntry.start_time;
      const newEndTime = end_time || timetableEntry.end_time;

      const instructorConflicts = await TimetableEntry.findInstructorConflicts(
        timetableEntry.instructor_id,
        newDayOfWeek,
        newStartTime,
        newEndTime,
        req.user.organization_id,
        timetableEntry._id
      );

      if (instructorConflicts.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Instructor conflict detected',
          message: 'Instructor has conflicting schedule',
          data: {
            conflicts: instructorConflicts.map(conflict => ({
              course: conflict.course_id,
              time_slot: `${conflict.start_time} - ${conflict.end_time}`,
              room: conflict.room_number
            }))
          }
        });
      }
    }

    // Update fields
    if (day_of_week !== undefined) timetableEntry.day_of_week = day_of_week;
    if (start_time) timetableEntry.start_time = start_time;
    if (end_time) timetableEntry.end_time = end_time;
    if (room_number !== undefined) timetableEntry.room_number = room_number;
    if (building !== undefined) timetableEntry.building = building;
    if (location_details !== undefined) timetableEntry.location_details = location_details;
    if (session_type) timetableEntry.session_type = session_type;
    if (recurring !== undefined) timetableEntry.recurring = recurring;
    if (effective_until !== undefined) {
      timetableEntry.effective_until = effective_until ? new Date(effective_until) : null;
    }
    if (max_capacity !== undefined) timetableEntry.max_capacity = max_capacity;
    if (equipment_required !== undefined) timetableEntry.equipment_required = equipment_required;
    if (notes !== undefined) timetableEntry.notes = notes;
    if (academic_year) timetableEntry.academic_year = academic_year;
    if (semester) timetableEntry.semester = semester;

    await timetableEntry.save();

    // Populate for response
    await timetableEntry.populate([
      { path: 'course_id', select: 'title' },
      { path: 'instructor_id', select: 'full_name email' },
      { path: 'created_by', select: 'full_name' }
    ]);

    res.json({
      success: true,
      data: timetableEntry,
      message: 'Timetable entry updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error updating timetable entry'
    });
  }
});

// Delete timetable entry
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only org_admin can delete timetable entries
    if (req.user.role !== 'org_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can delete timetable entries'
      });
    }

    const timetableEntry = await TimetableEntry.findOneAndUpdate(
      {
        _id: req.params.id,
        organization_id: req.user.organization_id
      },
      { is_active: false },
      { new: true }
    );

    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        error: 'Timetable entry not found',
        message: 'Timetable entry not found in your organization'
      });
    }

    res.json({
      success: true,
      data: { id: timetableEntry._id },
      message: 'Timetable entry deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error deleting timetable entry'
    });
  }
});

// Add exception to timetable entry
router.post('/:id/exceptions', auth, async (req, res) => {
  try {
    if (!['org_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators and instructors can add exceptions'
      });
    }

    const { date, reason, replacement_scheduled, replacement_date, replacement_time } = req.body;

    if (!date || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Date and reason are required'
      });
    }

    const timetableEntry = await TimetableEntry.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    });

    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        error: 'Timetable entry not found',
        message: 'Timetable entry not found in your organization'
      });
    }

    const replacementInfo = {
      scheduled: replacement_scheduled || false,
      date: replacement_date || null,
      time: replacement_time || null
    };

    await timetableEntry.addException(date, reason, replacementInfo);

    res.json({
      success: true,
      data: timetableEntry,
      message: 'Exception added successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error adding exception'
    });
  }
});

// Remove exception from timetable entry
router.delete('/:id/exceptions/:date', auth, async (req, res) => {
  try {
    if (!['org_admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators and instructors can remove exceptions'
      });
    }

    const timetableEntry = await TimetableEntry.findOne({
      _id: req.params.id,
      organization_id: req.user.organization_id
    });

    if (!timetableEntry) {
      return res.status(404).json({
        success: false,
        error: 'Timetable entry not found',
        message: 'Timetable entry not found in your organization'
      });
    }

    await timetableEntry.removeException(req.params.date);

    res.json({
      success: true,
      data: timetableEntry,
      message: 'Exception removed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error removing exception'
    });
  }
});

// Get instructor workload
router.get('/instructor/:instructor_id/workload', auth, async (req, res) => {
  try {
    const { academic_year, semester } = req.query;

    // Verify instructor belongs to organization
    const instructor = await User.findOne({
      _id: req.params.instructor_id,
      organization_id: req.user.organization_id,
      role: 'instructor'
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        error: 'Instructor not found',
        message: 'Instructor not found in your organization'
      });
    }

    const filters = {};
    if (academic_year) filters.academic_year = academic_year;
    if (semester) filters.semester = semester;

    const workload = await TimetableEntry.getInstructorWorkload(
      req.params.instructor_id,
      req.user.organization_id,
      filters
    );

    res.json({
      success: true,
      data: {
        instructor: {
          id: instructor._id,
          name: instructor.full_name,
          email: instructor.email
        },
        workload
      },
      message: 'Instructor workload retrieved successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error retrieving instructor workload'
    });
  }
});

// Get conflict suggestions
router.post('/check-conflicts', auth, async (req, res) => {
  try {
    const { instructor_id, day_of_week, start_time, end_time, exclude_id } = req.body;

    if (!instructor_id || day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Instructor, day, and times are required'
      });
    }

    // Check instructor conflicts
    const instructorConflicts = await TimetableEntry.findInstructorConflicts(
      instructor_id,
      day_of_week,
      start_time,
      end_time,
      req.user.organization_id,
      exclude_id
    );

    // Get alternative suggestions if conflicts exist
    let suggestions = [];
    if (instructorConflicts.length > 0) {
      const durationMinutes = TimetableEntry.timeToMinutes(end_time) - TimetableEntry.timeToMinutes(start_time);
      suggestions = await TimetableEntry.suggestAlternativeSlots(
        instructor_id,
        day_of_week,
        durationMinutes,
        req.user.organization_id
      );
    }

    res.json({
      success: true,
      data: {
        has_conflicts: instructorConflicts.length > 0,
        conflicts: instructorConflicts.map(conflict => ({
          id: conflict._id,
          course: conflict.course_id,
          time_slot: `${conflict.start_time} - ${conflict.end_time}`,
          room: conflict.room_number,
          session_type: conflict.session_type
        })),
        suggestions
      },
      message: 'Conflict check completed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error checking conflicts'
    });
  }
});

module.exports = router;