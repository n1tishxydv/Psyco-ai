/**
 * Psyco AI API Client
 * Centralized fetch wrapper handling base URL, authorization headers, and error normalization.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export async function apiRequest(endpoint, options = {}) {
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
      err.message = 'Unable to reach the Psyco AI backend server. Please verify the server is running on port 5000.';
    }
    throw err;
  }
}
