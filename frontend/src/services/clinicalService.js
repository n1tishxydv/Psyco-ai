import { apiRequest } from './apiClient.js';

export const clinicalService = {
  // Patient Management & Chart
  getPatients: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiRequest(`/clinical/patients${query}`);
    return res?.patients || res || [];
  },

  getAssignedPatients: async (search = '') => {
    return clinicalService.getPatients(search);
  },

  getPatientChart: async (patientId) => {
    const res = await apiRequest(`/clinical/patients/${patientId}/chart`);
    return res?.chart || res;
  },

  // Sessions
  getSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}`);
    return res?.session || res;
  },

  createOrGetSession: async (appointmentId) => {
    const res = await apiRequest(`/clinical/sessions/appointment/${appointmentId}`, {
      method: 'POST',
    });
    return res?.session || res;
  },

  startSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}/start`, {
      method: 'POST',
    });
    return res?.session || res;
  },

  completeSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
    return res?.session || res;
  },

  finalizeSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}/finalize`, {
      method: 'POST',
    });
    return res?.session || res;
  },

  // Notes
  saveNoteDraft: async (data) => {
    const res = await apiRequest('/clinical/notes/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.note || res;
  },

  finalizeNote: async (noteId, signatureData = {}) => {
    const res = await apiRequest(`/clinical/notes/${noteId}/finalize`, {
      method: 'POST',
      body: JSON.stringify(signatureData),
    });
    return res?.note || res;
  },

  amendNote: async (noteId, data) => {
    const res = await apiRequest(`/clinical/notes/${noteId}/amend`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.note || res;
  },

  // Treatment Plans & Goals
  createTreatmentPlan: async (data) => {
    const res = await apiRequest('/clinical/treatment-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.plan || res;
  },

  updateTreatmentPlan: async (planId, data) => {
    const res = await apiRequest(`/clinical/treatment-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.plan || res;
  },

  updatePlanGoal: async (planId, goalId, data) => {
    const res = await apiRequest(`/clinical/treatment-plans/${planId}/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res?.plan || res;
  },

  // Tasks & Homework
  createTask: async (data) => {
    const res = await apiRequest('/clinical/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.task || res;
  },

  updateTaskStatus: async (taskId, data) => {
    const res = await apiRequest(`/clinical/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(typeof data === 'string' ? { status: data } : data),
    });
    return res?.task || res;
  },

  toggleHomeworkStatus: async (taskId, isCompleted) => {
    return clinicalService.updateTaskStatus(taskId, {
      status: isCompleted ? 'completed' : 'in_progress',
    });
  },

  // Recommendations & Prescriptions
  createRecommendation: async (data) => {
    const res = await apiRequest('/clinical/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.recommendation || res;
  },

  createPrescriptionRecord: async (data) => {
    const res = await apiRequest('/clinical/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.prescription || res;
  },

  // Reports
  generateReport: async (arg1, arg2) => {
    const payload = typeof arg1 === 'string'
      ? { patientId: arg1, ...(arg2 || {}) }
      : arg1;
    const res = await apiRequest('/clinical/reports/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.report || res;
  },

  // Patient Care Portal
  getPatientCarePortalData: async () => {
    return apiRequest('/clinical/patient-portal/records');
  },

  getPatientPortalRecords: async () => {
    return clinicalService.getPatientCarePortalData();
  },
};
