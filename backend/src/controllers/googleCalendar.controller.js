import config from '../config/index.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';
import { auditService } from '../services/audit.service.js';
import { logger } from '../utils/logger.js';

export const ALLOWED_CALENDAR_REDIRECTS = {
  patient: '/patient/settings?tab=integrations',
  psychologist: '/psychologist/settings?tab=integrations',
};

const ALLOWED_PATH_PREFIXES = [
  '/patient/settings',
  '/psychologist/settings',
  '/patient/profile',
  '/psychologist/calendar',
  '/psychologist/availability',
  '/settings',
];

/**
 * Validates and resolves a safe post-OAuth return path.
 * Strictly prevents open-redirect vulnerabilities, external domains, and obsolete routes like /clinical/reports.
 *
 * @param {string|undefined} requestedPath - Requested returnTo parameter
 * @param {string} role - Authenticated user role ('patient' | 'psychologist')
 * @returns {string} Sanitized, server-controlled return path
 */
export function resolveSafeReturnPath(requestedPath, role) {
  const normalizedRole = role === 'psychologist' ? 'psychologist' : 'patient';
  const defaultPath = ALLOWED_CALENDAR_REDIRECTS[normalizedRole];

  if (!requestedPath || typeof requestedPath !== 'string') {
    return defaultPath;
  }

  const trimmed = requestedPath.trim();

  // Reject protocol-relative or external URLs (e.g. //evil.com, https://...)
  if (trimmed.startsWith('//') || trimmed.includes('://')) {
    logger.warn(`Blocked suspicious OAuth returnTo attempt: ${trimmed}`);
    return defaultPath;
  }

  // Reject deprecated or obsolete routes (e.g. /clinical/reports)
  if (trimmed.includes('/reports') || trimmed.includes('clinical/reports')) {
    logger.warn(`Blocked obsolete returnTo destination: ${trimmed}`);
    return defaultPath;
  }

  // Must start with a known authenticated workspace prefix
  const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
  if (!isAllowed) {
    logger.warn(`Unlisted returnTo prefix rejected: ${trimmed}`);
    return defaultPath;
  }

  return trimmed;
}

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

    const activeRole = req.user.activeRole || req.user.role || 'patient';
    const safeReturnTo = resolveSafeReturnPath(req.query.returnTo, activeRole);

    const authUrl = await googleCalendarAdapter.generateAuthUrl(
      req.user.uid,
      activeRole,
      safeReturnTo
    );

    return successResponse(res, { url: authUrl, authUrl });
  } catch (err) {
    next(err);
  }
}

export async function handleOAuthCallback(req, res, next) {
  let parsedState = null;
  const { code, state, error, error_description } = req.query;

  if (state && typeof state === 'string') {
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    } catch {
      // Ignored - state format validated in adapter
    }
  }

  const fallbackRole = parsedState?.activeRole || 'patient';
  const targetPath = resolveSafeReturnPath(parsedState?.returnTo, fallbackRole);
  const separator = targetPath.includes('?') ? '&' : '?';

  // 1. Handle OAuth Provider Error (e.g. user cancelled or testing access denied)
  if (error) {
    logger.warn(`Google OAuth error received on callback: ${error} (${error_description || 'No description'})`);
    return res.redirect(
      `${config.frontendUrl}${targetPath}${separator}calendar_error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`
    );
  }

  // 2. Handle missing parameters
  if (!code || !state) {
    logger.warn('Google OAuth callback invoked without code or state parameter.');
    return res.redirect(
      `${config.frontendUrl}${targetPath}${separator}calendar_error=missing_code_or_state`
    );
  }

  // 3. Process Code Exchange & Credential Storage
  try {
    const result = await googleCalendarAdapter.handleOAuthCallback(code, state);
    const resolvedPath = resolveSafeReturnPath(result.returnTo, result.activeRole);
    const safeSeparator = resolvedPath.includes('?') ? '&' : '?';

    await auditService.record({
      action: 'GOOGLE_CALENDAR_CONNECTED',
      userId: result.uid,
      metadata: {
        role: result.activeRole,
        connectedEmail: result.connectedEmail,
      },
    });

    return res.redirect(`${config.frontendUrl}${resolvedPath}${safeSeparator}calendar_connected=true`);
  } catch (err) {
    logger.error(`Exception in handleOAuthCallback: ${err.message}`);
    const safeSeparator = targetPath.includes('?') ? '&' : '?';
    return res.redirect(
      `${config.frontendUrl}${targetPath}${safeSeparator}calendar_error=${encodeURIComponent(err.message)}`
    );
  }
}

export async function disconnect(req, res, next) {
  try {
    await googleCalendarAdapter.disconnect(req.user.uid);

    await auditService.record({
      action: 'GOOGLE_CALENDAR_DISCONNECTED',
      userId: req.user.uid,
      metadata: { role: req.user.activeRole || req.user.role },
    });

    return successResponse(res, { message: 'Google Calendar successfully disconnected.' });
  } catch (err) {
    next(err);
  }
}
