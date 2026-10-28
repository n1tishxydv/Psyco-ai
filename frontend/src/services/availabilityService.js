import { apiRequest } from './apiClient.js';

export const availabilityService = {
  // Psychologist: Get own schedule and availability settings
  getOwnAvailability: async () => {
    return apiRequest('/availability/mine');
  },

  // Psychologist: Update schedule, duration, buffer, and policies
  updateOwnAvailability: async (data) => {
    return apiRequest('/availability/mine', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Psychologist: Add blocked date
  addBlockedDate: async (data) => {
    return apiRequest('/availability/blocked-dates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Psychologist: Remove blocked date
  removeBlockedDate: async (blockId) => {
    return apiRequest(`/availability/blocked-dates/${blockId}`, {
      method: 'DELETE',
    });
  },

  // Psychologist: Add leave period
  addLeavePeriod: async (data) => {
    return apiRequest('/availability/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Psychologist: Remove leave period
  removeLeavePeriod: async (leaveId) => {
    return apiRequest(`/availability/leave/${leaveId}`, {
      method: 'DELETE',
    });
  },

  // Patient / Public: Get calculated available slots for date and mode
  getAvailableSlots: async (psychologistId, date, mode = null) => {
    const query = new URLSearchParams({ date });
    if (mode && mode !== 'both') query.append('mode', mode);
    return apiRequest(`/psychologists/${psychologistId}/available-slots?${query.toString()}`);
  },
};
