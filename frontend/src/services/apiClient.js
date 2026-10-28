/**
 * Psyco AI API Client
 * Centralized fetch wrapper handling base URL, authorization headers, and error normalization.
 */

/**
 * Resolve the API Base URL.
 * In development mode, falls back to http://localhost:5000/api/v1 for convenience.
 * In a deployed/production build, VITE_API_BASE_URL is strictly required; falling back
 * to localhost is prohibited to prevent silent connection failures.
 */
function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  // Allow localhost fallback only in local development
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api/v1';
  }

  // Deployed build without configured API endpoint
  return null;
}

const BASE_URL = getApiBaseUrl();

export async function apiRequest(endpoint, options = {}) {
  if (!BASE_URL) {
    const error = new Error(
      'Psyco AI API Configuration Error: VITE_API_BASE_URL is not configured for this deployed environment. Please configure the backend API endpoint in your build settings.'
    );
    error.status = 500;
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  const url = `${BASE_URL}${endpoint}`;
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
    // If backend server is unreachable
    if (!err.status) {
      err.code = 'NETWORK_ERROR';
      err.message = import.meta.env.DEV
        ? 'Unable to reach the Psyco AI backend server. Please verify the local server is running on port 5000.'
        : 'Unable to reach the Psyco AI backend service. Please check your network connection or verify the backend service is operational.';
    }
    throw err;
  }
}
