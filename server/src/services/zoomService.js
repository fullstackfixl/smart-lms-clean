const axios = require('axios');
const jwt = require('jsonwebtoken');

class ZoomService {
  constructor() {
    this.apiKey = process.env.ZOOM_API_KEY;
    this.apiSecret = process.env.ZOOM_API_SECRET;
    this.baseURL = 'https://api.zoom.us/v2';
  }

  // Generate JWT token for Zoom API
  generateToken() {
    const payload = {
      iss: this.apiKey,
      exp: Date.now() + 5000
    };
    return jwt.sign(payload, this.apiSecret);
  }

  // Create Zoom meeting
  async createMeeting(options) {
    try {
      const {
        topic,
        type = 2, // 1: Instant, 2: Scheduled, 3: Recurring with no fixed time, 8: Recurring with fixed time
        startTime,
        duration = 60,
        timezone = 'UTC',
        password,
        agenda,
        settings = {}
      } = options;

      const token = this.generateToken();

      const meetingData = {
        topic,
        type,
        start_time: startTime,
        duration,
        timezone,
        password,
        agenda,
        settings: {
          host_video: settings.hostVideo !== undefined ? settings.hostVideo : true,
          participant_video: settings.participantVideo !== undefined ? settings.participantVideo : true,
          join_before_host: settings.joinBeforeHost !== undefined ? settings.joinBeforeHost : false,
          mute_upon_entry: settings.muteUponEntry !== undefined ? settings.muteUponEntry : true,
          watermark: settings.watermark !== undefined ? settings.watermark : false,
          audio: settings.audio || 'both',
          auto_recording: settings.autoRecording || 'none',
          waiting_room: settings.waitingRoom !== undefined ? settings.waitingRoom : true,
          ...settings
        }
      };

      const response = await axios.post(
        `${this.baseURL}/users/me/meetings`,
        meetingData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        meetingId: response.data.id,
        meetingNumber: response.data.id,
        topic: response.data.topic,
        startTime: response.data.start_time,
        duration: response.data.duration,
        timezone: response.data.timezone,
        joinUrl: response.data.join_url,
        startUrl: response.data.start_url,
        password: response.data.password,
        hostEmail: response.data.host_email
      };

    } catch (error) {
      console.error('Zoom create meeting error:', error.response?.data || error.message);
      throw new Error(`Failed to create Zoom meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get meeting details
  async getMeeting(meetingId) {
    try {
      const token = this.generateToken();

      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        meetingId: response.data.id,
        topic: response.data.topic,
        startTime: response.data.start_time,
        duration: response.data.duration,
        timezone: response.data.timezone,
        joinUrl: response.data.join_url,
        status: response.data.status,
        hostEmail: response.data.host_email
      };

    } catch (error) {
      console.error('Zoom get meeting error:', error.response?.data || error.message);
      throw new Error(`Failed to get Zoom meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  // Update meeting
  async updateMeeting(meetingId, updates) {
    try {
      const token = this.generateToken();

      const response = await axios.patch(
        `${this.baseURL}/meetings/${meetingId}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, message: 'Meeting updated successfully' };

    } catch (error) {
      console.error('Zoom update meeting error:', error.response?.data || error.message);
      throw new Error(`Failed to update Zoom meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  // Delete meeting
  async deleteMeeting(meetingId) {
    try {
      const token = this.generateToken();

      await axios.delete(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return { success: true, message: 'Meeting deleted successfully' };

    } catch (error) {
      console.error('Zoom delete meeting error:', error.response?.data || error.message);
      throw new Error(`Failed to delete Zoom meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  // List meetings
  async listMeetings(type = 'scheduled') {
    try {
      const token = this.generateToken();

      const response = await axios.get(
        `${this.baseURL}/users/me/meetings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            type,
            page_size: 30
          }
        }
      );

      return response.data.meetings.map(meeting => ({
        meetingId: meeting.id,
        topic: meeting.topic,
        startTime: meeting.start_time,
        duration: meeting.duration,
        timezone: meeting.timezone,
        joinUrl: meeting.join_url
      }));

    } catch (error) {
      console.error('Zoom list meetings error:', error.response?.data || error.message);
      throw new Error(`Failed to list Zoom meetings: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get meeting recordings
  async getMeetingRecordings(meetingId) {
    try {
      const token = this.generateToken();

      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        meetingId: response.data.id,
        topic: response.data.topic,
        startTime: response.data.start_time,
        recordings: response.data.recording_files.map(file => ({
          id: file.id,
          type: file.recording_type,
          startTime: file.recording_start,
          endTime: file.recording_end,
          downloadUrl: file.download_url,
          playUrl: file.play_url,
          fileSize: file.file_size,
          fileType: file.file_type
        }))
      };

    } catch (error) {
      console.error('Zoom get recordings error:', error.response?.data || error.message);
      throw new Error(`Failed to get Zoom recordings: ${error.response?.data?.message || error.message}`);
    }
  }

  // Generate meeting signature for Zoom SDK
  generateSignature(meetingNumber, role = 0) {
    try {
      const timestamp = new Date().getTime() - 30000;
      const msg = Buffer.from(this.apiKey + meetingNumber + timestamp + role).toString('base64');
      const hash = require('crypto')
        .createHmac('sha256', this.apiSecret)
        .update(msg)
        .digest('base64');

      const signature = Buffer.from(`${this.apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

      return signature;

    } catch (error) {
      console.error('Generate signature error:', error);
      throw new Error('Failed to generate Zoom signature');
    }
  }

  // Get meeting participants
  async getMeetingParticipants(meetingId) {
    try {
      const token = this.generateToken();

      const response = await axios.get(
        `${this.baseURL}/metrics/meetings/${meetingId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data.participants.map(participant => ({
        id: participant.id,
        userId: participant.user_id,
        name: participant.name,
        email: participant.user_email,
        joinTime: participant.join_time,
        leaveTime: participant.leave_time,
        duration: participant.duration
      }));

    } catch (error) {
      console.error('Zoom get participants error:', error.response?.data || error.message);
      throw new Error(`Failed to get meeting participants: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new ZoomService();
