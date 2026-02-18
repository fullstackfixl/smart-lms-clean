const TimetableEntry = require('../models/TimetableEntry');
const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new timetable entry
exports.createTimetableEntry = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const {
            course_id,
            instructor_id,
            day_of_week,
            start_time,
            end_time,
            room_number,
            building,
            session_type,
            effective_from,
            effective_until
        } = req.body;

        // Validate required fields
        if (!course_id || !instructor_id || day_of_week === undefined || !start_time || !end_time) {
            return res.error('Missing required fields', 'Validation failed', 400);
        }

        // Check for conflicts before creation
        const instructorConflicts = await TimetableEntry.findInstructorConflicts(
            instructor_id,
            day_of_week,
            start_time,
            end_time,
            organizationId
        );

        if (instructorConflicts.length > 0) {
            return res.error('Instructor has a conflict at this time', 'Conflict detected', 409, { conflicts: instructorConflicts });
        }

        const roomConflicts = await TimetableEntry.findRoomConflicts(
            room_number,
            building,
            day_of_week,
            start_time,
            end_time,
            organizationId
        );

        if (roomConflicts.length > 0) {
            return res.error('Room is already booked at this time', 'Conflict detected', 409, { conflicts: roomConflicts });
        }

        const entry = new TimetableEntry({
            organization_id: organizationId,
            course_id,
            instructor_id,
            day_of_week,
            start_time,
            end_time,
            room_number,
            building,
            session_type,
            effective_from: effective_from || new Date(),
            effective_until,
            created_by: req.user._id
        });

        await entry.save();
        await entry.populate(['course_id', 'instructor_id']);

        res.success({ entry }, 'Timetable entry created successfully', 201);
    } catch (error) {
        console.error('Create timetable entry error:', error);
        res.error(error.message, 'Failed to create timetable entry', 500);
    }
};

// Get timetable (all or filtered)
exports.getTimetable = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { course_id, instructor_id, day_of_week, room_number } = req.query;

        const filters = {};
        if (course_id) filters.course_id = course_id;
        if (instructor_id) filters.instructor_id = instructor_id;
        if (day_of_week !== undefined) filters.day_of_week = day_of_week;
        if (room_number) filters.room_number = room_number;

        const timetable = await TimetableEntry.findByOrganization(organizationId, filters);

        res.success({ timetable }, 'Timetable retrieved successfully');
    } catch (error) {
        console.error('Get timetable error:', error);
        res.error(error.message, 'Failed to fetch timetable', 500);
    }
};

// Check for conflicts
exports.checkConflicts = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { instructor_id, room_number, building, day_of_week, start_time, end_time, exclude_id } = req.body;

        const conflicts = {};

        if (instructor_id) {
            conflicts.instructor = await TimetableEntry.findInstructorConflicts(
                instructor_id, day_of_week, start_time, end_time, organizationId, exclude_id
            );
        }

        if (room_number) {
            conflicts.room = await TimetableEntry.findRoomConflicts(
                room_number, building, day_of_week, start_time, end_time, organizationId, exclude_id
            );
        }

        const hasConflicts = (conflicts.instructor && conflicts.instructor.length > 0) ||
            (conflicts.room && conflicts.room.length > 0);

        res.success({
            hasConflicts,
            conflicts
        }, hasConflicts ? 'Conflicts detected' : 'No conflicts found');
    } catch (error) {
        console.error('Check conflicts error:', error);
        res.error(error.message, 'Failed to check conflicts', 500);
    }
};

// Assign rooms/instructors (resolve conflicts or update)
exports.assignResources = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { entry_id, room_number, building, instructor_id } = req.body;

        const entry = await TimetableEntry.findOne({ _id: entry_id, organization_id: organizationId });
        if (!entry) {
            return res.error('Timetable entry not found', 'Not found', 404);
        }

        // Check conflicts for new values
        if (instructor_id) {
            const instructorConflicts = await TimetableEntry.findInstructorConflicts(
                instructor_id, entry.day_of_week, entry.start_time, entry.end_time, organizationId, entry_id
            );
            if (instructorConflicts.length > 0) {
                return res.error('New instructor has a conflict', 'Conflict detected', 409);
            }
            entry.instructor_id = instructor_id;
        }

        if (room_number) {
            const roomConflicts = await TimetableEntry.findRoomConflicts(
                room_number, building || entry.building, entry.day_of_week, entry.start_time, entry.end_time, organizationId, entry_id
            );
            if (roomConflicts.length > 0) {
                return res.error('New room is already booked', 'Conflict detected', 409);
            }
            entry.room_number = room_number;
            if (building) entry.building = building;
        }

        await entry.save();
        await entry.populate(['course_id', 'instructor_id']);

        res.success({ entry }, 'Resources assigned successfully');
    } catch (error) {
        console.error('Assign resources error:', error);
        res.error(error.message, 'Failed to assign resources', 500);
    }
};
