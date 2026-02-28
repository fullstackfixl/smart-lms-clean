const OrganizationEvent = require('../models/OrganizationEvent');

/**
 * Record an event for an organization dashboard
 * @param {string} organizationId - The ID of the organization
 * @param {string} type - Event type (NEW_COURSE, NEW_QUIZ, QUIZ_PUBLISHED, NEW_STUDENT, NEW_INSTRUCTOR, LIVE_CLASS_SCHEDULED)
 * @param {string} message - Descriptive message
 * @param {string} [relatedId] - Optional ID of the related entity
 */
const recordOrgEvent = async (orgInput, type, message, relatedId = null) => {
    try {
        const organizationId = orgInput?._id || orgInput;

        if (!organizationId) {
            console.warn('⚠️ [recordOrgEvent] No organizationId found in input:', orgInput);
            return null;
        }

        console.log(`✅ [recordOrgEvent] Recorded: ${type} - ${message}`);
        const event = await OrganizationEvent.create({
            organizationId,
            type,
            message,
            relatedId
        });
        return event;
    } catch (error) {
        console.error('❌ [recordOrgEvent] Failed to record event:', error.message);
        return null;
    }

};

module.exports = {
    recordOrgEvent,
    EVENT_TYPES: {
        NEW_COURSE: 'NEW_COURSE',
        NEW_QUIZ: 'NEW_QUIZ',
        QUIZ_PUBLISHED: 'QUIZ_PUBLISHED',
        NEW_STUDENT: 'NEW_STUDENT',
        NEW_INSTRUCTOR: 'NEW_INSTRUCTOR',
        LIVE_CLASS_SCHEDULED: 'LIVE_CLASS_SCHEDULED'
    }
};
