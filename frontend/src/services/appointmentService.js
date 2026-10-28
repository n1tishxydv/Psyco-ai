import { apiRequest } from './apiClient.js';

export const appointmentService = {
  // Get all user appointments with optional filters
  getAppointments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/appointments?${query}` : '/appointments';
    return apiRequest(endpoint);
  },

  // Get single appointment
  getAppointmentById: async (appointmentId) => {
    return apiRequest(`/appointments/${appointmentId}`);
  },

  // Create an appointment request
  createAppointment: async (data) => {
    return apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Psychologist accepts request
  acceptAppointment: async (appointmentId) => {
    return apiRequest(`/appointments/${appointmentId}/accept`, {
      method: 'POST',
    });
  },

  // Psychologist rejects request
  rejectAppointment: async (appointmentId, reason) => {
    return apiRequest(`/appointments/${appointmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Psychologist proposes alternative slot
  proposeAlternativeSlot: async (appointmentId, data) => {
    return apiRequest(`/appointments/${appointmentId}/propose-alternative`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Patient responds to alternative proposal ('accept' | 'decline')
  respondToAlternative: async (appointmentId, action) => {
    return apiRequest(`/appointments/${appointmentId}/respond-alternative`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, data) => {
    return apiRequest(`/appointments/${appointmentId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    return apiRequest(`/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
