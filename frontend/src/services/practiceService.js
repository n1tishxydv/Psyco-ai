import { apiRequest } from './apiClient.js';

export const practiceService = {
  // Get active practice workspace, settings, locations, and memberships
  getWorkspace: async () => {
    return apiRequest('/practice/mine');
  },

  // Update independent practice configuration
  updateSettings: async (data) => {
    return apiRequest('/practice/mine', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Add physical consultation office
  addLocation: async (locationData) => {
    return apiRequest('/practice/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  },

  // Delete physical location
  deleteLocation: async (locationId) => {
    return apiRequest(`/practice/locations/${locationId}`, {
      method: 'DELETE',
    });
  },

  // List registered clinics for affiliation
  getClinics: async () => {
    return apiRequest('/practice/clinics');
  },

  // Request clinic membership
  requestAffiliation: async (clinicId, note = '') => {
    return apiRequest('/practice/affiliations/request', {
      method: 'POST',
      body: JSON.stringify({ clinicId, note }),
    });
  },

  // Switch active practice context (hybrid clinicians)
  switchContext: async (practiceId) => {
    return apiRequest('/practice/switch-context', {
      method: 'POST',
      body: JSON.stringify({ practiceId }),
    });
  },
};
