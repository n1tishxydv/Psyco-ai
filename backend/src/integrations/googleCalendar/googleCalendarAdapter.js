import config from '../../config/index.js';
import { firebaseRtdbAdapter } from '../firebase/firebaseRtdbAdapter.js';
import { logger } from '../../utils/logger.js';
import { encryptToken, decryptToken } from '../../utils/tokenEncryption.js';
import crypto from 'crypto';

// Preferred scope: calendar.events.owned (Task D scope minimization)
export const DEFAULT_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned';
export const FALLBACK_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

class GoogleCalendarAdapter {
  constructor() {
    this.name = 'Google Calendar & Meet API';
  }

  isConfigured() {
    return Boolean(config.integrations?.google?.isConfigured);
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      service: this.name,
      configured,
      status: configured ? 'INITIALIZED' : 'UNCONFIGURED',
      clientId: config.integrations?.google?.clientId
        ? `${config.integrations.google.clientId.substring(0, 16)}...`
        : null,
      redirectUri: config.integrations?.google?.redirectUri || null,
      scope: DEFAULT_CALENDAR_SCOPE,
      message: configured
        ? 'Google Calendar & Meet OAuth credentials configured.'
        : 'Google OAuth credentials not configured in backend/.env. Integration will operate in offline/unconnected mode.',
    };
  }

  /**
   * Derives a cryptographic secret key for OAuth state signing
   */
  getStateSecret() {
    return (
      (process.env.TOKEN_ENCRYPTION_KEY && process.env.TOKEN_ENCRYPTION_KEY.trim()) ||
      (process.env.CALENDAR_TOKEN_ENCRYPTION_KEY && process.env.CALENDAR_TOKEN_ENCRYPTION_KEY.trim()) ||
      config.firebase?.privateKey ||
      process.env.JWT_SECRET ||
      process.env.SESSION_SECRET ||
      'psyco_oauth_state_hmac_secret_2026'
    );
  }

  /**
   * Generates a cryptographically random, signed, single-use OAuth authorization URL
   *
   * @param {string} uid - Authenticated user Firebase UID
   * @param {string} activeRole - Current authorized role (patient / psychologist)
   * @param {string} returnTo - Frontend return path after callback
   */
  async generateAuthUrl(uid, activeRole = 'patient', returnTo = null) {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is not configured on this server.');
    }

    if (!uid) {
      throw new Error('User UID is required to initiate Google Calendar authorization.');
    }

    const defaultReturn =
      activeRole === 'psychologist'
        ? '/psychologist/settings?tab=integrations'
        : '/patient/settings?tab=integrations';
    const targetReturn = returnTo || defaultReturn;

    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry window

    const secret = this.getStateSecret();
    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${uid}:${activeRole}:${nonce}:${expiresAt}`)
      .digest('hex');

    // Store state in Firebase RTDB to guarantee single-use and prevent replay attacks
    const stateRecord = {
      uid,
      activeRole,
      returnTo: targetReturn,
      nonce,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    };
    await firebaseRtdbAdapter.set(`googleOAuthStates/${nonce}`, stateRecord);

    const statePayload = JSON.stringify({
      uid,
      activeRole,
      returnTo: targetReturn,
      nonce,
      expiresAt,
      sig,
    });
    const state = Buffer.from(statePayload).toString('base64url');

    const params = new URLSearchParams({
      client_id: config.integrations.google.clientId,
      redirect_uri: config.integrations.google.redirectUri,
      response_type: 'code',
      scope: `${DEFAULT_CALENDAR_SCOPE} https://www.googleapis.com/auth/userinfo.email`,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens after validating signed, single-use state.
   * Encrypts tokens with AES-256-GCM before saving to RTDB.
   */
  async handleOAuthCallback(code, state) {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is unconfigured.');
    }

    if (!state || typeof state !== 'string') {
      throw new Error('Missing OAuth state parameter.');
    }

    let parsedState;
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    } catch {
      throw new Error('Invalid OAuth state parameter format.');
    }

    const { uid, activeRole, returnTo, nonce, expiresAt, sig } = parsedState;
    if (!uid || !nonce || !expiresAt || !sig) {
      throw new Error('Malformed OAuth state parameter.');
    }

    // 1. Verify cryptographic HMAC signature (supports both role-scoped and legacy signatures)
    const secret = this.getStateSecret();
    const sigWithRole = crypto
      .createHmac('sha256', secret)
      .update(`${uid}:${activeRole || 'patient'}:${nonce}:${expiresAt}`)
      .digest('hex');
    const sigLegacy = crypto
      .createHmac('sha256', secret)
      .update(`${uid}:${nonce}:${expiresAt}`)
      .digest('hex');

    const sigBuffer = Buffer.from(sig);
    const bufWithRole = Buffer.from(sigWithRole);
    const bufLegacy = Buffer.from(sigLegacy);

    const matchesWithRole =
      sigBuffer.length === bufWithRole.length && crypto.timingSafeEqual(sigBuffer, bufWithRole);
    const matchesLegacy =
      sigBuffer.length === bufLegacy.length && crypto.timingSafeEqual(sigBuffer, bufLegacy);

    if (!matchesWithRole && !matchesLegacy) {
      throw new Error('OAuth state cryptographic signature verification failed.');
    }

    // 2. Verify state expiration (10 min lifetime)
    if (Date.now() > Number(expiresAt)) {
      throw new Error('OAuth state has expired. Please initiate connection again.');
    }

    // 3. Enforce single-use via server-side state registry
    const storedState = await firebaseRtdbAdapter.get(`googleOAuthStates/${nonce}`);
    if (!storedState || storedState.used || storedState.uid !== uid) {
      throw new Error('OAuth state has already been used or was not generated by this server.');
    }

    // Invalidate state immediately to prevent replay
    await firebaseRtdbAdapter.set(`googleOAuthStates/${nonce}/used`, true);

    // 4. Exchange code for access & refresh tokens
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
      const errMsg = tokenData.error_description || tokenData.error || 'Failed to exchange Google OAuth code.';
      logger.error(`Google OAuth token exchange failed: ${errMsg}`);
      throw new Error(errMsg);
    }

    // 5. Retrieve connected user identity (email) for non-sensitive UI display
    let connectedEmail = null;
    try {
      if (tokenData.access_token) {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          connectedEmail = userInfo.email || null;
        }
      }
    } catch (userInfoErr) {
      logger.warn(`Could not fetch connected Google userinfo: ${userInfoErr.message}`);
    }

    // 6. Check existing connection to preserve refresh token if Google didn't return a new one
    const existingConn = await firebaseRtdbAdapter.get(`googleCalendarConnections/${uid}`);
    let finalRefreshToken = tokenData.refresh_token;

    if (!finalRefreshToken && existingConn?.encryptedRefreshToken) {
      finalRefreshToken = decryptToken(existingConn.encryptedRefreshToken);
    }

    const tokenExpiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

    // Encrypt sensitive tokens with AES-256-GCM
    const encryptedAccessToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = encryptToken(finalRefreshToken);

    const connectionPayload = {
      uid,
      role: activeRole || 'patient',
      connectedEmail: connectedEmail || existingConn?.connectedEmail || null,
      status: 'CONNECTED',
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt: tokenExpiresAt,
      scope: tokenData.scope || DEFAULT_CALENDAR_SCOPE,
      connectedAt: existingConn?.connectedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncStatus: 'OK',
    };

    // Store in both paths for compatibility
    await firebaseRtdbAdapter.set(`googleCalendarConnections/${uid}`, connectionPayload);
    await firebaseRtdbAdapter.set(`googleConnections/${uid}`, {
      ...connectionPayload,
      psychologistUid: uid,
      // Note: plain fields avoided; kept for adapter backward compatibility
      accessToken: null,
      refreshToken: null,
    });

    logger.info(`Google Calendar connected and encrypted successfully for user ${uid} (${connectedEmail || 'unspecified'})`);
    return { uid, activeRole, returnTo: returnTo || '/settings', connected: true, connectedEmail };
  }

  /**
   * Get valid access token for a user, refreshing if expired.
   * Decrypts encrypted tokens and re-encrypts updated tokens.
   */
  async getValidAccessToken(uid) {
    if (!uid) return null;

    let conn = await firebaseRtdbAdapter.get(`googleCalendarConnections/${uid}`);
    if (!conn) {
      conn = await firebaseRtdbAdapter.get(`googleConnections/${uid}`);
    }

    if (!conn) {
      return null;
    }

    // If access token is still valid (with 60-second safety window)
    if (conn.expiresAt && Date.now() < conn.expiresAt - 60000) {
      const token = conn.encryptedAccessToken ? decryptToken(conn.encryptedAccessToken) : conn.accessToken;
      if (token) return token;
    }

    // Access token expired, attempt refresh
    const refreshToken = conn.encryptedRefreshToken ? decryptToken(conn.encryptedRefreshToken) : conn.refreshToken;
    if (!refreshToken) {
      logger.warn(`No refresh token available for user ${uid}. Marking reauth required.`);
      await this.markReauthRequired(uid);
      return null;
    }

    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.integrations.google.clientId,
          client_secret: config.integrations.google.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        logger.warn(`Google token refresh failed for ${uid}: ${data.error || 'Unknown error'}`);
        if (data.error === 'invalid_grant' || data.error === 'unauthorized_client') {
          await this.markReauthRequired(uid);
        }
        return null;
      }

      // Check if a rotated refresh token was returned
      const newRefreshToken = data.refresh_token || refreshToken;
      const updatedExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

      const updatedPayload = {
        ...conn,
        status: 'CONNECTED',
        encryptedAccessToken: encryptToken(data.access_token),
        encryptedRefreshToken: encryptToken(newRefreshToken),
        expiresAt: updatedExpiresAt,
        updatedAt: new Date().toISOString(),
      };

      await firebaseRtdbAdapter.set(`googleCalendarConnections/${uid}`, updatedPayload);
      await firebaseRtdbAdapter.set(`googleConnections/${uid}`, {
        ...updatedPayload,
        psychologistUid: uid,
        accessToken: null,
        refreshToken: null,
      });

      return data.access_token;
    } catch (err) {
      logger.error(`Exception during Google token refresh for ${uid}: ${err.message}`);
      return null;
    }
  }

  async markReauthRequired(uid) {
    try {
      await firebaseRtdbAdapter.update(`googleCalendarConnections/${uid}`, {
        status: 'REAUTH_REQUIRED',
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Best-effort status update
    }
  }

  /**
   * Check connection status for any authenticated user.
   * Returns sanitized, non-sensitive metadata only (tokens never exposed).
   */
  async getConnectionStatus(uid) {
    if (!uid) {
      return { connected: false, status: 'NOT_CONNECTED' };
    }

    let conn = await firebaseRtdbAdapter.get(`googleCalendarConnections/${uid}`);
    if (!conn) {
      conn = await firebaseRtdbAdapter.get(`googleConnections/${uid}`);
    }

    if (!conn) {
      return { connected: false, status: 'NOT_CONNECTED' };
    }

    const isConnected = conn.status === 'CONNECTED';
    return {
      connected: isConnected,
      status: conn.status || 'CONNECTED',
      connectedEmail: conn.connectedEmail || null,
      connectedAt: conn.connectedAt || null,
      lastSyncedAt: conn.updatedAt || null,
      scope: conn.scope || DEFAULT_CALENDAR_SCOPE,
    };
  }

  /**
   * Disconnect Google Calendar cleanly.
   * Revokes the token with Google servers and invalidates stored records.
   */
  async disconnect(uid) {
    if (!uid) return { disconnected: false };

    let conn = await firebaseRtdbAdapter.get(`googleCalendarConnections/${uid}`);
    if (!conn) {
      conn = await firebaseRtdbAdapter.get(`googleConnections/${uid}`);
    }

    if (conn) {
      // Attempt token revocation with Google
      const tokenToRevoke =
        (conn.encryptedRefreshToken ? decryptToken(conn.encryptedRefreshToken) : conn.refreshToken) ||
        (conn.encryptedAccessToken ? decryptToken(conn.encryptedAccessToken) : conn.accessToken);

      if (tokenToRevoke) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
          logger.info(`Google OAuth token revoked successfully for user ${uid}`);
        } catch (revokeErr) {
          logger.warn(`Google token revocation request failed for user ${uid}: ${revokeErr.message}`);
        }
      }
    }

    await firebaseRtdbAdapter.remove(`googleCalendarConnections/${uid}`);
    await firebaseRtdbAdapter.remove(`googleConnections/${uid}`);
    logger.info(`Google Calendar connection removed from RTDB for user ${uid}`);

    return { disconnected: true };
  }

  /**
   * Create Google Calendar event with strict clinical privacy safeguards and idempotency.
   *
   * @param {object} appointment - The canonical appointment object
   * @param {string|null} targetUid - Explicit user to sync for (defaults to psychologistId)
   */
  async createCalendarEvent(appointment, targetUid = null) {
    const { id, startTime, endTime, sessionMode, location, timezone } = appointment;
    const syncUid = targetUid || appointment.psychologistId;
    if (!syncUid) {
      return { calendarSyncStatus: 'not_connected', googleCalendarEventId: null };
    }

    // 1. Check idempotency mapping to prevent duplicate event creation
    const existingMapping = await firebaseRtdbAdapter.get(`googleCalendarEventMappings/${syncUid}/${id}`);
    if (existingMapping?.googleCalendarEventId) {
      logger.info(`Calendar event already exists for appointment ${id} (Event: ${existingMapping.googleCalendarEventId}). Skipping duplicate insert.`);
      return {
        calendarSyncStatus: 'synced',
        googleCalendarEventId: existingMapping.googleCalendarEventId,
        googleMeetUrl: existingMapping.googleMeetUrl || null,
        meetStatus: sessionMode === 'online' ? 'created' : 'not_required',
      };
    }

    const accessToken = await this.getValidAccessToken(syncUid);
    if (!accessToken) {
      return {
        calendarSyncStatus: 'not_connected',
        googleCalendarEventId: null,
        googleMeetUrl: null,
        meetStatus: sessionMode === 'online' ? 'failed' : 'not_required',
      };
    }

    const isOnline = sessionMode === 'online';
    const eventTimezone = timezone || config.defaults?.timezone || 'UTC';

    // Privacy-preserving generic event payload:
    // STRICT RULE: ZERO clinical data, ZERO patient symptoms, ZERO notes, ZERO diagnostic codes.
    const eventBody = {
      summary: 'Psyco AI Appointment',
      description: `Psyco AI Consultation\nMode: ${isOnline ? 'Online (Google Meet)' : 'In-person consultation'}\nStatus: Confirmed`,
      start: {
        dateTime: startTime,
        timeZone: eventTimezone,
      },
      end: {
        dateTime: endTime,
        timeZone: eventTimezone,
      },
      location: isOnline ? undefined : (location?.addressOrUrl || 'In-Person Clinic'),
    };

    if (isOnline) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `meet_${id}_${Date.now()}`,
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
        meetUrl =
          eventData.hangoutLink ||
          eventData.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ||
          null;
      }

      // Persist idempotency mapping
      const mapping = {
        appointmentId: id,
        googleCalendarEventId: eventData.id,
        googleMeetUrl: meetUrl,
        syncedAt: new Date().toISOString(),
      };
      await firebaseRtdbAdapter.set(`googleCalendarEventMappings/${syncUid}/${id}`, mapping);

      logger.info(`Google Calendar event created: ${eventData.id} for appointment ${id} (user: ${syncUid})`);
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
   * Update an existing Google Calendar event upon appointment rescheduling
   */
  async updateCalendarEvent(appointment, targetUid = null) {
    const { id, startTime, endTime, timezone } = appointment;
    const syncUid = targetUid || appointment.psychologistId;
    if (!syncUid) return { calendarSyncStatus: 'not_connected' };

    // Resolve event ID from mapping or appointment object
    let eventId = appointment.googleCalendarEventId;
    if (!eventId) {
      const mapping = await firebaseRtdbAdapter.get(`googleCalendarEventMappings/${syncUid}/${id}`);
      eventId = mapping?.googleCalendarEventId;
    }

    if (!eventId) return { calendarSyncStatus: 'not_connected' };

    const accessToken = await this.getValidAccessToken(syncUid);
    if (!accessToken) return { calendarSyncStatus: 'not_connected' };

    const eventTimezone = timezone || config.defaults?.timezone || 'UTC';

    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: { dateTime: startTime, timeZone: eventTimezone },
          end: { dateTime: endTime, timeZone: eventTimezone },
        }),
      });

      if (!res.ok) {
        logger.warn(`Google Calendar update failed for event ${eventId}`);
        return { calendarSyncStatus: 'failed' };
      }

      logger.info(`Google Calendar event ${eventId} successfully rescheduled.`);
      return { calendarSyncStatus: 'synced' };
    } catch (err) {
      logger.error(`Google Calendar update error: ${err.message}`);
      return { calendarSyncStatus: 'failed' };
    }
  }

  /**
   * Delete or cancel an event in Google Calendar upon appointment cancellation
   */
  async deleteCalendarEvent(syncUid, eventId, appointmentId = null) {
    if (!syncUid || !eventId) return true;

    const accessToken = await this.getValidAccessToken(syncUid);
    if (!accessToken) return true;

    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
      await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (appointmentId) {
        await firebaseRtdbAdapter.remove(`googleCalendarEventMappings/${syncUid}/${appointmentId}`);
      }

      logger.info(`Google Calendar event ${eventId} deleted for user ${syncUid}`);
      return true;
    } catch (err) {
      logger.warn(`Google Calendar delete error: ${err.message}`);
      return false;
    }
  }
}

export const googleCalendarAdapter = new GoogleCalendarAdapter();
