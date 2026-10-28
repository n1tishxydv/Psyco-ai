import { apiRequest } from './apiClient.js';

export const googleCalendarService = {
  getConnectionStatus: async () => {
    return apiRequest('/integrations/google/status');
  },

  getAuthUrl: async () => {
    return apiRequest('/integrations/google/auth-url');
  },

  disconnect: async () => {
    return apiRequest('/integrations/google/disconnect', {
      method: 'POST',
    });
  },
};
