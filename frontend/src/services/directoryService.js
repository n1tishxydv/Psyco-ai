import { apiRequest } from './apiClient.js';

export const directoryService = {
  getPsychologists: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.mode && filters.mode !== 'all') params.append('mode', filters.mode);
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.language) params.append('language', filters.language);

    const query = params.toString();
    return apiRequest(`/psychologists${query ? `?${query}` : ''}`);
  },

  getPsychologistById: async (psychologistId) => {
    return apiRequest(`/psychologists/${psychologistId}`);
  },
};
