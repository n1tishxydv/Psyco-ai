import { apiRequest } from './apiClient.js';

export const systemService = {
  checkHealth: async () => {
    return await apiRequest('/health');
  },
};
