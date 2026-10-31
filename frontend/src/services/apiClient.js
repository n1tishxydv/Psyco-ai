/**
 * Psyco AI API Client
 * Centralized fetch wrapper handling base URL resolution, loopback rejection in deployed builds,
 * authorization headers, and error normalization.
 */

/**
 * Checks whether a given URL points to a loopback/local address.
 * Matches localhost, 127.0.0.1, 0.0.0.0, [::1], and *.localhost domains.
 */
export function isLoopbackUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `http://${trimmed}`
    );
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.endsWith('.localhost')
    );
  } catch {
    return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(:\d+)?(\/.*)?$/i.test(trimmed);
  }
}

/**
 * Resolve the API Base URL with strict environment safeguards.
 * - In local dev (isDev === true): defaults to development endpoint if unset.
 * - In deployed builds (isDev === false):
 *     - If missing or empty -> not configured.
 *     - If loopback/localhost -> rejected and treated as not configured.
 *     - If valid remote URL -> configured.
 */
// In deployed builds, Vite dead-code eliminates DEV-only branches when DEV is false
const DEV_DEFAULT_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV)
  ? 'http://localhost:5000/api/v1'
  : '';

/**
 * Resolve the API Base URL with strict environment safeguards.
 * - In local dev (isDev === true): defaults to development endpoint if unset.
 * - In deployed builds (isDev === false):
 *     - If missing or empty -> not configured.
 *     - If loopback/localhost -> rejected and treated as not configured.
 *     - If valid remote URL -> configured.
 */
export function resolveApiConfiguration({ rawUrl, isDev, defaultDevUrl = DEV_DEFAULT_URL } = {}) {
  const envUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const devMode = Boolean(isDev);

  // Local development mode
  if (devMode) {
    if (envUrl) {
      return {
        isConfigured: true,
        baseUrl: envUrl.replace(/\/$/, ''),
        status: 'configured',
        message: 'API endpoint configured for local development.',
      };
    }
    const resolvedDefault = defaultDevUrl ? defaultDevUrl.replace(/\/$/, '') : null;
    return {
      isConfigured: Boolean(resolvedDefault),
      baseUrl: resolvedDefault,
      status: resolvedDefault ? 'configured' : 'unconfigured',
      message: resolvedDefault
        ? 'Using default local development API endpoint.'
        : 'Development API endpoint is not configured.',
    };
  }

  // Deployed / Production / Staging build
  if (!envUrl) {
    return {
      isConfigured: false,
      baseUrl: null,
      status: 'unconfigured',
      message: 'Backend API service is not configured for this deployed build.',
    };
  }

  if (isLoopbackUrl(envUrl)) {
    return {
      isConfigured: false,
      baseUrl: null,
      status: 'rejected_loopback',
      message: 'Deployed builds cannot connect to localhost or loopback API addresses.',
    };
  }

  return {
    isConfigured: true,
    baseUrl: envUrl.replace(/\/$/, ''),
    status: 'configured',
    message: 'Backend API endpoint configured.',
  };
}

const isDevMode = Boolean(
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test')
);
const nodeEnvUrl = typeof process !== 'undefined' && process.env ? (process.env.VITE_API_BASE_URL || '') : '';
const rawEnvUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : nodeEnvUrl
).trim();

// Runtime configuration resolved for the current application instance
const runtimeConfig = resolveApiConfiguration({
  rawUrl: rawEnvUrl || DEV_DEFAULT_URL,
  isDev: isDevMode,
});

/**
 * Configure runtime base URL (used in testing and mock environments).
 */
export function setRuntimeApiBaseUrl(url) {
  if (url) {
    runtimeConfig.baseUrl = url.replace(/\/$/, '');
    runtimeConfig.isConfigured = true;
    runtimeConfig.status = 'configured';
  }
}

/**
 * Returns true if a valid backend endpoint is configured and safe for the current environment.
 */
export function isBackendConfigured() {
  return runtimeConfig.isConfigured;
}

/**
 * Returns the current runtime configuration status object.
 */
export function getBackendConfigStatus() {
  return { ...runtimeConfig };
}

import { auth } from './firebase.js';

let customTokenRefresher = null;
let customSessionExpiredHandler = null;
let customCurrentUserGetter = null;
let activeRefreshPromise = null;

/**
 * Configure a custom token refresher (primarily for testing and mock environments).
 */
export function setTokenRefresher(fn) {
  customTokenRefresher = fn;
}

/**
 * Reset the token refresher to default Firebase Auth behavior.
 */
export function resetTokenRefresher() {
  customTokenRefresher = null;
}

/**
 * Configure a custom session-expired handler.
 */
export function setSessionExpiredHandler(fn) {
  customSessionExpiredHandler = fn;
}

/**
 * Reset the session-expired handler to default.
 */
export function resetSessionExpiredHandler() {
  customSessionExpiredHandler = null;
}

/**
 * Configure a custom current user getter for testing.
 */
export function setCurrentUserGetter(fn) {
  customCurrentUserGetter = fn;
}

/**
 * Reset the custom current user getter.
 */
export function resetCurrentUserGetter() {
  customCurrentUserGetter = null;
}

/**
 * Helper to get the current Firebase user.
 */
function getCurrentUser() {
  if (customCurrentUserGetter) {
    return customCurrentUserGetter();
  }
  return auth?.currentUser || null;
}

/**
 * Default token refresher using the Firebase Authentication SDK.
 * Calls getIdToken(true) to force a cryptographic refresh from Google's auth servers.
 */
async function defaultTokenRefresher() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('No active user session found to renew token.');
  }
  const token = await user.getIdToken(true);
  return token;
}

/**
 * Centralized session-expired trigger:
 * Clears stored credentials, fires the custom window event, and optionally redirects to login.
 */
export function handleSessionExpired(reason = 'SESSION_EXPIRED', message = 'Your session has expired.') {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('psyco_token');
  }

  if (customSessionExpiredHandler) {
    customSessionExpiredHandler({ reason, message });
    return;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('psyco:session-expired', {
        detail: { reason, message, timestamp: Date.now() },
      })
    );

    const path = window.location.pathname || '';
    const publicPaths = [
      '/',
      '/about',
      '/services',
      '/faq',
      '/contact',
      '/get-started',
      '/privacy-policy',
      '/privacy',
      '/terms',
      '/data-privacy',
      '/for-patients',
      '/patient-portal',
      '/for-psychologists',
      '/psychologist-portal',
      '/find-psychologist',
    ];
    const isPublic = publicPaths.includes(path);
    const isAuthRoute = ['/login', '/register'].includes(path);

    if (!isPublic && !isAuthRoute) {
      const returnUrl = encodeURIComponent(path + (window.location.search || ''));
      window.location.href = `/login?sessionExpired=true&returnUrl=${returnUrl}`;
    }
  }
}

/**
 * Obtain a fresh token via Firebase Auth SDK, deduplicating concurrent refresh attempts.
 */
export async function refreshAuthToken() {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const refresher = customTokenRefresher || defaultTokenRefresher;
      const newToken = await refresher();
      if (!newToken || typeof newToken !== 'string') {
        throw new Error('Token refresher returned an invalid or empty token.');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('psyco_token', newToken);
      }
      return newToken;
    } catch (err) {
      handleSessionExpired('REFRESH_FAILED', err.message);
      throw err;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Returns a valid token for outgoing requests, checking Firebase currentUser first.
 */
export async function getValidAuthToken() {
  const user = getCurrentUser();
  if (user && typeof user.getIdToken === 'function') {
    try {
      const token = await user.getIdToken(false);
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('psyco_token', token);
      }
      return token;
    } catch {
      // Fallback to localStorage if Firebase in-memory fetch encounters an issue
    }
  }

  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('psyco_token');
  }
  return null;
}

/**
 * Build a normalized Error object from an API response.
 */
function buildApiError(res, data) {
  let message = data?.error?.message || `HTTP ${res.status}`;
  if (Array.isArray(data?.error?.details) && data.error.details.length > 0) {
    const detailList = data.error.details
      .map((d) => d.message || d.field)
      .filter(Boolean)
      .join('; ');
    if (detailList) {
      message = `${message}: ${detailList}`;
    }
  }
  const error = new Error(message);
  error.status = res.status;
  error.code = data?.error?.code || 'API_ERROR';
  error.details = data?.error?.details || null;
  return error;
}

/**
 * Centralized API request wrapper with automated token renewal and single-retry defense.
 */
export async function apiRequest(endpoint, options = {}) {
  if (!runtimeConfig.isConfigured || !runtimeConfig.baseUrl) {
    const error = new Error(
      runtimeConfig.message || 'Psyco AI backend service is currently not connected.'
    );
    error.status = 503;
    error.code = 'BACKEND_NOT_CONFIGURED';
    error.isBackendUnavailable = true;
    throw error;
  }

  const url = `${runtimeConfig.baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach token if not already explicitly set in custom headers
  if (!headers['Authorization']) {
    const token = await getValidAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    // If HTTP 401 received: attempt token renewal and retry at most once
    if (res.status === 401 && !options._retry && !options.noRetry) {
      try {
        const renewedToken = await refreshAuthToken();
        const retryHeaders = {
          ...headers,
          Authorization: `Bearer ${renewedToken}`,
        };

        const retryRes = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        const retryData = await retryRes.json().catch(() => ({}));

        if (!retryRes.ok) {
          throw buildApiError(retryRes, retryData);
        }

        return retryData;
      } catch (renewalOrRetryErr) {
        if (renewalOrRetryErr.status) {
          throw renewalOrRetryErr;
        }
        throw buildApiError(res, data);
      }
    }

    if (!res.ok) {
      throw buildApiError(res, data);
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.code = 'NETWORK_ERROR';
      err.message = err.message || 'Unable to reach the Psyco AI backend service. Please verify network connectivity or service status.';
    }
    throw err;
  }
}
