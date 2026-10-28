import { apiRequest } from './apiClient.js';

export const assessmentService = {
  /**
   * Retrieves catalog of verified psychometric instruments
   */
  getInstruments: async () => {
    return await apiRequest('/assessments/instruments');
  },

  /**
   * Retrieves single instrument definition with full items
   */
  getInstrument: async (instrumentId) => {
    return await apiRequest(`/assessments/instruments/${instrumentId}`);
  },

  /**
   * Assigns an assessment to an authorized patient
   */
  assignAssessment: async (payload) => {
    return await apiRequest('/assessments/assign', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves an assignment by ID
   */
  getAssignment: async (assignmentId) => {
    return await apiRequest(`/assessments/assignments/${assignmentId}`);
  },

  /**
   * Lists assignments for a specific patient
   */
  listPatientAssignments: async (patientId) => {
    return await apiRequest(`/assessments/patient/${patientId}/assignments`);
  },

  /**
   * Alias for listPatientAssignments
   */
  getPatientAssignments: async (patientId) => {
    return await apiRequest(`/assessments/patient/${patientId}/assignments`);
  },

  /**
   * Submits patient responses to calculate deterministic score
   */
  submitResponses: async (assignmentId, responses) => {
    return await apiRequest(`/assessments/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    });
  },

  /**
   * Retrieves an assessment result
   */
  getResult: async (resultId) => {
    return await apiRequest(`/assessments/results/${resultId}`);
  },

  /**
   * Reviews an assessment result with clinician formulation
   */
  reviewResult: async (resultId, payload) => {
    return await apiRequest(`/assessments/results/${resultId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves chronological assessment history for an authorized patient
   */
  getPatientHistory: async (patientId, instrumentId = null) => {
    const query = instrumentId ? `?instrumentId=${instrumentId}` : '';
    return await apiRequest(`/assessments/patient/${patientId}/history${query}`);
  },
};
