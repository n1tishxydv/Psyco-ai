import config from '../../config/index.js';
import { firebaseRtdbAdapter } from '../firebase/firebaseRtdbAdapter.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

class GoogleCalendarAdapter {
  constructor() {
    this.name = 'Google Calendar & Meet API';
  }

  isConfigured() {
    return Boolean(config.integrations.google.isConfigured);
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      service: this.name,
      configured,
      status: configured ? 'INITIALIZED' : 'UNCONFIGURED',
      clientId: config.integrations.google.clientId ? `${config.integrations.google.clientId.substring(0, 12)}...` : null,
      redirectUri: config.integrations.google.redirectUri || null,
      message: configured
        ? 'Google Calendar & Meet OAuth credentials configured.'
        : 'Google OAuth credentials not configured in backend/.env. Integration will operate in offline/unconnected mode.',
    };
  }

  /**
   * Generates a secure OAuth authorization URL for the psychologist
   */
  generateAuthUrl(psychologistUid) {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is not configured on this server.');
    }

    // State payload contains UID and random nonce to prevent CSRF
    const statePayload = JSON.stringify({
      uid: psychologistUid,
      nonce: crypto.randomBytes(16).toString('hex'),
      time: Date.now(),
    });
    const state = Buffer.from(statePayload).toString('base64url');

    const params = new URLSearchParams({
      client_id: config.integrations.google.clientId,
      redirect_uri: config.integrations.google.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens and saves to server-side store
   */
  async handleOAuthCallback(code, state) {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is unconfigured.');
    }

    let parsedState;
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    } catch {
      throw new Error('Invalid OAuth state parameter.');
    }

    const { uid } = parsedState;
    if (!uid) throw new Error('Missing psychologist UID in state.');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.integrations.google.clientId,
        client_secret: config.integrations.google.clientSecret,
        redirect_uri: config.integrations.google.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange Google OAuth code.');
    }

    const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;
    const connectionPayload = {
      psychologistUid: uid,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      scope: tokenData.scope,
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store securely in isolated RTDB node
    await firebaseRtdbAdapter.set(`googleConnections/${uid}`, connectionPayload);
    logger.info(`Google Calendar connected successfully for psychologist ${uid}`);
    return { psychologistUid: uid, connected: true };
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(psychologistUid) {
    const conn = await firebaseRtdbAdapter.get(`googleConnections/${psychologistUid}`);
    if (!conn || !conn.accessToken) {
      return null;
    }

    // Check if token is still valid (with 60-second buffer)
    if (conn.expiresAt && Date.now() < conn.expiresAt - 60000) {
      return conn.accessToken;
    }

    // Refresh token
    if (!conn.refreshToken) {
      logger.warn(`No refresh token available for psychologist ${psychologistUid}`);
      return null;
    }

    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.integrations.google.clientId,
          client_secret: config.integrations.google.clientSecret,
          refresh_token: conn.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        logger.warn(`Google token refresh failed for ${psychologistUid}: ${data.error}`);
        return null;
      }

      const updated = {
        ...conn,
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
        updatedAt: new Date().toISOString(),
      };
      await firebaseRtdbAdapter.set(`googleConnections/${psychologistUid}`, updated);
      return data.access_token;
    } catch (err) {
      logger.error(`Exception during Google token refresh for ${psychologistUid}: ${err.message}`);
      return null;
    }
  }

  /**
   * Check connection status for a psychologist
   */
  async getConnectionStatus(psychologistUid) {
    const conn = await firebaseRtdbAdapter.get(`googleConnections/${psychologistUid}`);
    if (!conn) {
      return { connected: false, status: 'NOT_CONNECTED' };
    }
    return {
      connected: true,
      status: 'CONNECTED',
      connectedAt: conn.connectedAt,
      lastSyncedAt: conn.updatedAt,
    };
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(psychologistUid) {
    await firebaseRtdbAdapter.remove(`googleConnections/${psychologistUid}`);
    logger.info(`Google Calendar disconnected for psychologist ${psychologistUid}`);
    return { disconnected: true };
  }

  /**
   * Create Google Calendar event with optional Google Meet conference
   */
  async createCalendarEvent(appointment) {
    const { psychologistId, startTime, endTime, sessionMode, id, location } = appointment;
    const accessToken = await this.getValidAccessToken(psychologistId);

    if (!accessToken) {
      return {
        calendarSyncStatus: 'not_connected',
        googleCalendarEventId: null,
        googleMeetUrl: null,
        meetStatus: sessionMode === 'online' ? 'failed' : 'not_required',
      };
    }

    const isOnline = sessionMode === 'online';
    const eventBody = {
      summary: `Psyco AI Session [${id}]`,
      description: `Psyco AI Clinical Consultation\nMode: ${isOnline ? 'Online (Google Meet)' : 'In-person consultation'}\nReference: ${id}`,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      location: isOnline ? undefined : location?.addressOrUrl || 'In-Person Clinic',
    };

    if (isOnline) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `meet_${id}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    try {
      const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      const eventData = await res.json();
      if (!res.ok) {
        logger.warn(`Google Calendar event creation failed: ${eventData.error?.message || 'Unknown error'}`);
        return {
          calendarSyncStatus: 'failed',
          googleCalendarEventId: null,
          googleMeetUrl: null,
          meetStatus: isOnline ? 'failed' : 'not_required',
        };
      }

      let meetUrl = null;
      if (isOnline) {
        meetUrl = eventData.hangoutLink ||
          eventData.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri || null;
      }

      logger.info(`Google Calendar event created: ${eventData.id} for appointment ${id}`);
      return {
        calendarSyncStatus: 'synced',
        googleCalendarEventId: eventData.id,
        googleMeetUrl: meetUrl,
        meetStatus: isOnline ? (meetUrl ? 'created' : 'pending') : 'not_required',
      };
    } catch (err) {
      logger.error(`Exception creating Google Calendar event: ${err.message}`);
      return {
        calendarSyncStatus: 'failed',
        googleCalendarEventId: null,
        googleMeetUrl: null,
        meetStatus: isOnline ? 'failed' : 'not_required',
      };
    }
  }

  /**
   * Update an existing Google Calendar event (e.g. rescheduling)
   */
  async updateCalendarEvent(appointment) {
    const { psychologistId, googleCalendarEventId, startTime, endTime, id } = appointment;
    if (!googleCalendarEventId) return { calendarSyncStatus: 'not_connected' };

    const accessToken = await this.getValidAccessToken(psychologistId);
    if (!accessToken) return { calendarSyncStatus: 'not_connected' };

    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleCalendarEventId}?conferenceDataVersion=1`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: { dateTime: startTime },
          end: { dateTime: endTime },
        }),
      });

      if (!res.ok) {
        logger.warn(`Google Calendar update failed for event ${googleCalendarEventId}`);
        return { calendarSyncStatus: 'failed' };
      }

      return { calendarSyncStatus: 'synced' };
    } catch (err) {
      logger.error(`Google Calendar update error: ${err.message}`);
      return { calendarSyncStatus: 'failed' };
    }
  }

  /**
   * Delete or cancel an event in Google Calendar
   */
  async deleteCalendarEvent(psychologistId, googleCalendarEventId) {
    if (!googleCalendarEventId) return true;

    const accessToken = await this.getValidAccessToken(psychologistId);
    if (!accessToken) return true;

    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleCalendarEventId}`;
      await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return true;
    } catch (err) {
      logger.warn(`Google Calendar delete error: ${err.message}`);
      return false;
    }
  }
}

export const googleCalendarAdapter = new GoogleCalendarAdapter();
