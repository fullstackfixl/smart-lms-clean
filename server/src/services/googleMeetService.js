const { google } = require('googleapis');
const { OAuth2 } = google.auth;

class GoogleMeetService {
  constructor() {
    this.oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials if refresh token is available
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });
    }
  }

  // Generate OAuth URL for authorization
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to get Google tokens');
    }
  }

  // Create Google Meet meeting
  async createMeeting(options) {
    try {
      const {
        summary,
        description,
        startTime,
        endTime,
        attendees = [],
        timezone = 'UTC'
      } = options;

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary,
        description,
        start: {
          dateTime: startTime,
          timeZone: timezone
        },
        end: {
          dateTime: endTime,
          timeZone: timezone
        },
        attendees: attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      const meetingData = response.data;
      const meetLink = meetingData.conferenceData?.entryPoints?.find(
        ep => ep.entryPointType === 'video'
      )?.uri;

      return {
        eventId: meetingData.id,
        summary: meetingData.summary,
        description: meetingData.description,
        startTime: meetingData.start.dateTime,
        endTime: meetingData.end.dateTime,
        meetLink: meetLink,
        hangoutLink: meetingData.hangoutLink,
        htmlLink: meetingData.htmlLink,
        status: meetingData.status
      };

    } catch (error) {
      console.error('Google Meet create meeting error:', error);
      throw new Error(`Failed to create Google Meet: ${error.message}`);
    }
  }

  // Get meeting details
  async getMeeting(eventId) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      const meetingData = response.data;
      const meetLink = meetingData.conferenceData?.entryPoints?.find(
        ep => ep.entryPointType === 'video'
      )?.uri;

      return {
        eventId: meetingData.id,
        summary: meetingData.summary,
        description: meetingData.description,
        startTime: meetingData.start.dateTime,
        endTime: meetingData.end.dateTime,
        meetLink: meetLink,
        hangoutLink: meetingData.hangoutLink,
        htmlLink: meetingData.htmlLink,
        status: meetingData.status,
        attendees: meetingData.attendees
      };

    } catch (error) {
      console.error('Google Meet get meeting error:', error);
      throw new Error(`Failed to get Google Meet: ${error.message}`);
    }
  }

  // Update meeting
  async updateMeeting(eventId, updates) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Get existing event first
      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      const updatedEvent = {
        ...existingEvent.data,
        ...updates
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all'
      });

      return {
        success: true,
        message: 'Meeting updated successfully',
        event: response.data
      };

    } catch (error) {
      console.error('Google Meet update meeting error:', error);
      throw new Error(`Failed to update Google Meet: ${error.message}`);
    }
  }

  // Delete meeting
  async deleteMeeting(eventId) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });

      return {
        success: true,
        message: 'Meeting deleted successfully'
      };

    } catch (error) {
      console.error('Google Meet delete meeting error:', error);
      throw new Error(`Failed to delete Google Meet: ${error.message}`);
    }
  }

  // List upcoming meetings
  async listMeetings(maxResults = 10) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items.map(event => {
        const meetLink = event.conferenceData?.entryPoints?.find(
          ep => ep.entryPointType === 'video'
        )?.uri;

        return {
          eventId: event.id,
          summary: event.summary,
          startTime: event.start.dateTime || event.start.date,
          endTime: event.end.dateTime || event.end.date,
          meetLink: meetLink,
          hangoutLink: event.hangoutLink,
          status: event.status
        };
      });

    } catch (error) {
      console.error('Google Meet list meetings error:', error);
      throw new Error(`Failed to list Google Meets: ${error.message}`);
    }
  }

  // Add attendees to meeting
  async addAttendees(eventId, attendeeEmails) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      const existingAttendees = event.data.attendees || [];
      const newAttendees = attendeeEmails.map(email => ({ email }));

      event.data.attendees = [...existingAttendees, ...newAttendees];

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event.data,
        sendUpdates: 'all'
      });

      return {
        success: true,
        message: 'Attendees added successfully',
        attendees: response.data.attendees
      };

    } catch (error) {
      console.error('Google Meet add attendees error:', error);
      throw new Error(`Failed to add attendees: ${error.message}`);
    }
  }
}

module.exports = new GoogleMeetService();
