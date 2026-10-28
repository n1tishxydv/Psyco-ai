import { apiRequest } from './apiClient.js';

export const analyticsService = {
  /**
   * Retrieves longitudinal progress analytics for a patient
   */
  getPatientProgress: async (patientId) => {
    return await apiRequest(`/analytics/patient/${patientId}/progress`);
  },

  /**
   * Retrieves practice-wide metrics for psychologist dashboard
   */
  getPracticeAnalytics: async () => {
    return await apiRequest('/analytics/practice');
  },

  /**
   * Scans a session transcript for clinical distress and safety signals
   */
  scanTranscriptForSafety: async (sessionId) => {
    return await apiRequest(`/risk-review/scan/session/${sessionId}`, {
      method: 'POST',
    });
  },

  /**
   * Lists clinical risk review flags
   */
  listRiskFlags: async (params = {}) => {
    let queryParams = params;
    if (typeof params === 'string') {
      queryParams = { patientId: params };
    }
    const query = new URLSearchParams(queryParams).toString();
    return await apiRequest(`/risk-review/flags${query ? `?${query}` : ''}`);
  },

  /**
   * Alias for listRiskFlags supporting (patientId, status) or object
   */
  getRiskFlags: async (patientIdOrParams, maybeStatus) => {
    let params = {};
    if (typeof patientIdOrParams === 'object' && patientIdOrParams !== null) {
      params = patientIdOrParams;
    } else {
      if (patientIdOrParams) params.patientId = patientIdOrParams;
      if (maybeStatus) params.status = maybeStatus;
    }
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/risk-review/flags${query ? `?${query}` : ''}`);
  },

  /**
   * Acknowledges or dismisses a clinical risk review flag
   */
  acknowledgeRiskFlag: async (flagId, payload) => {
    return await apiRequest(`/risk-review/flags/${flagId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Scans practice documentation completeness gaps
   */
  scanDocumentation: async (patientId) => {
    const body = patientId ? JSON.stringify({ patientId }) : undefined;
    return await apiRequest('/documentation-quality/scan', {
      method: 'POST',
      body,
    });
  },

  scanDocumentationQuality: async (patientId) => {
    const body = patientId ? JSON.stringify({ patientId }) : undefined;
    return await apiRequest('/documentation-quality/scan', {
      method: 'POST',
      body,
    });
  },

  /**
   * Lists documentation completeness findings
   */
  listDocFindings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/documentation-quality/findings${query ? `?${query}` : ''}`);
  },

  getDocumentationFindings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/documentation-quality/findings${query ? `?${query}` : ''}`);
  },

  /**
   * Resolves a documentation quality gap
   */
  resolveDocFinding: async (findingId, payload) => {
    return await apiRequest(`/documentation-quality/findings/${findingId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  resolveDocumentationFinding: async (findingId, payload) => {
    return await apiRequest(`/documentation-quality/findings/${findingId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Records an authorized clinical action on a session (requires safety flags reviewed)
   */
  recordClinicalAction: async (sessionId, payload) => {
    return await apiRequest(`/risk-review/session/${sessionId}/clinical-action`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Granular helper methods for dashboard components
   */
  getAssessmentTrends: async (patientId, instrumentId = 'phq-9') => {
    const normId = instrumentId === 'phq9' ? 'phq-9' : instrumentId === 'gad7' ? 'gad-7' : instrumentId;
    const res = await apiRequest(`/analytics/patient/${patientId}/progress`);
    const metrics = res.analytics?.instrumentMetrics?.[normId] || res.data?.analytics?.instrumentMetrics?.[normId] || null;
    return { data: { data: metrics } };
  },

  getTreatmentGoalProgress: async (patientId) => {
    const res = await apiRequest(`/analytics/patient/${patientId}/progress`);
    const goals = res.analytics?.goalMetrics || res.data?.analytics?.goalMetrics || null;
    return { data: { data: goals } };
  },

  getAttendanceMetrics: async (patientId) => {
    const res = await apiRequest(`/analytics/patient/${patientId}/progress`);
    const attendance = res.analytics?.attendanceMetrics || res.data?.analytics?.attendanceMetrics || null;
    return { data: { data: attendance } };
  },

  getPatientTimeline: async (patientId) => {
    const res = await apiRequest(`/analytics/patient/${patientId}/progress`);
    const timeline = res.analytics?.careTimeline || res.data?.analytics?.careTimeline || [];
    return { data: { data: { timeline } } };
  },
};
