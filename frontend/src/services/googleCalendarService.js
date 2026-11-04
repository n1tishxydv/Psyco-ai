import { apiRequest } from './apiClient.js';

export const googleCalendarService = {
  getConnectionStatus: async () => {
    return apiRequest('/integrations/google/status');
  },

  getAuthUrl: async (returnTo = '') => {
    const query = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    return apiRequest(`/integrations/google/auth-url${query}`);
  },

  disconnect: async () => {
    return apiRequest('/integrations/google/disconnect', {
      method: 'POST',
    });
  },
};
