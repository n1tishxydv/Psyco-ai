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

const isDevMode = Boolean(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
const rawEnvUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : ''
).trim();

// Runtime configuration resolved for the current application instance
const runtimeConfig = resolveApiConfiguration({
  rawUrl: rawEnvUrl || DEV_DEFAULT_URL,
  isDev: isDevMode,
});

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

/**
 * Centralized API request wrapper.
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

  // If token is stored or available from AuthContext, attach it
  const token = localStorage.getItem('psyco_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      let message = data.error?.message || `HTTP ${res.status}`;
      if (Array.isArray(data.error?.details) && data.error.details.length > 0) {
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
      error.code = data.error?.code || 'API_ERROR';
      error.details = data.error?.details || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      err.code = 'NETWORK_ERROR';
      err.message = 'Unable to reach the Psyco AI backend service. Please verify network connectivity or service status.';
    }
    throw err;
  }
}
