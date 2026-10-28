import { apiRequest } from './apiClient.js';

export const intakeService = {
  // Get current patient intake
  getMyIntake: async () => {
    return apiRequest('/intake/my-intake');
  },

  // Save draft intake
  saveDraft: async (data) => {
    return apiRequest('/intake/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Submit complete intake
  submitIntake: async (data) => {
    return apiRequest('/intake/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Psychologist views patient intake
  getPatientIntake: async (patientId) => {
    return apiRequest(`/intake/patient/${patientId}`);
  },

  // Get custom intake template
  getTemplate: async (psychologistId) => {
    const endpoint = psychologistId ? `/intake/template/${psychologistId}` : '/intake/template';
    return apiRequest(endpoint);
  },

  // Update psychologist custom template
  updateTemplate: async (data) => {
    return apiRequest('/intake/template', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
