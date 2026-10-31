import config from '../config/index.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';
import { auditService } from '../services/audit.service.js';

export async function getConnectionStatus(req, res, next) {
  try {
    const status = await googleCalendarAdapter.getConnectionStatus(req.user.uid);
    const adapterInfo = googleCalendarAdapter.getStatus();
    return successResponse(res, {
      ...status,
      isConfigured: adapterInfo.configured,
      message: adapterInfo.message,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuthUrl(req, res, next) {
  try {
    if (!googleCalendarAdapter.isConfigured()) {
      return errorResponse(
        res,
        'Google OAuth client credentials are not configured on this server.',
        503,
        'GOOGLE_OAUTH_UNCONFIGURED'
      );
    }

    const authUrl = await googleCalendarAdapter.generateAuthUrl(req.user.uid);
    return successResponse(res, { url: authUrl, authUrl });
  } catch (err) {
    next(err);
  }
}

export async function handleOAuthCallback(req, res, next) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${config.frontendUrl}/settings?calendar_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${config.frontendUrl}/settings?calendar_error=missing_code_or_state`);
    }

    await googleCalendarAdapter.handleOAuthCallback(code, state);

    return res.redirect(`${config.frontendUrl}/settings?calendar_connected=true`);
  } catch (err) {
    return res.redirect(`${config.frontendUrl}/settings?calendar_error=${encodeURIComponent(err.message)}`);
  }
}

export async function disconnect(req, res, next) {
  try {
    await googleCalendarAdapter.disconnect(req.user.uid);

    await auditService.record({
      action: 'GOOGLE_CALENDAR_DISCONNECTED',
      userId: req.user.uid,
    });

    return successResponse(res, { message: 'Google Calendar successfully disconnected.' });
  } catch (err) {
    next(err);
  }
}
