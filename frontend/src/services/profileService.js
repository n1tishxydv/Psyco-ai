import { apiRequest } from './apiClient.js';

export const profileService = {
  // Get current user, role, profile data, and preferences
  getMe: async () => {
    return apiRequest('/profile/me');
  },

  // Patient onboarding
  onboardPatient: async (data) => {
    return apiRequest('/profile/onboard/patient', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Psychologist onboarding
  onboardPsychologist: async (data) => {
    return apiRequest('/profile/onboard/psychologist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update patient profile
  updatePatientProfile: async (data) => {
    return apiRequest('/profile/patient', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Update psychologist profile
  updatePsychologistProfile: async (data) => {
    return apiRequest('/profile/psychologist', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Preferences
  getPreferences: async () => {
    return apiRequest('/profile/preferences');
  },

  updatePreferences: async (data) => {
    return apiRequest('/profile/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Danger zone: delete account
  deleteAccount: async (confirmation, reason) => {
    return apiRequest('/profile/delete-account', {
      method: 'POST',
      body: JSON.stringify({ confirmation, reason }),
    });
  },
};
