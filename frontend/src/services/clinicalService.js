import { apiRequest } from './apiClient.js';

/**
 * Normalizes a patients response across array formats, envelope formats, and key-wrapped payloads.
 * Returns an Array while preserving backward-compatible properties (.data.patients) for existing callers.
 */
function normalizePatientList(res) {
  let list = [];
  if (Array.isArray(res)) {
    list = res;
  } else if (res && typeof res === 'object') {
    if (Array.isArray(res.data?.patients)) {
      list = res.data.patients;
    } else if (Array.isArray(res.patients)) {
      list = res.patients;
    } else if (Array.isArray(res.data)) {
      list = res.data;
    }
  }

  const safeArray = Array.isArray(list) ? [...list] : [];
  // Backward compatibility for callers doing res.data?.patients or res.patients
  safeArray.data = { patients: safeArray };
  safeArray.patients = safeArray;
  return safeArray;
}

export const clinicalService = {
  // Patient Management & Chart
  getPatients: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiRequest(`/clinical/patients${query}`);
    return normalizePatientList(res);
  },

  getAssignedPatients: async (search = '') => {
    return clinicalService.getPatients(search);
  },

  getPatientChart: async (patientId) => {
    const res = await apiRequest(`/clinical/patients/${patientId}/chart`);
    const chart = res?.data?.chart || res?.chart || res?.data || res;
    if (chart && typeof chart === 'object' && !chart.data) {
      chart.data = { chart };
    }
    return chart;
  },

  // Sessions
  getSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}`);
    return res?.data?.session || res?.session || res?.data || res;
  },

  createOrGetSession: async (appointmentId) => {
    const res = await apiRequest(`/clinical/sessions/appointment/${appointmentId}`, {
      method: 'POST',
    });
    return res?.data?.session || res?.session || res?.data || res;
  },

  startSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}/start`, {
      method: 'POST',
    });
    return res?.data?.session || res?.session || res?.data || res;
  },

  completeSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
    return res?.data?.session || res?.session || res?.data || res;
  },

  finalizeSession: async (sessionId) => {
    const res = await apiRequest(`/clinical/sessions/${sessionId}/finalize`, {
      method: 'POST',
    });
    return res?.data?.session || res?.session || res?.data || res;
  },

  // Notes
  saveNoteDraft: async (data) => {
    const res = await apiRequest('/clinical/notes/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data?.note || res?.note || res?.data || res;
  },

  finalizeNote: async (noteId, signatureData = {}) => {
    const res = await apiRequest(`/clinical/notes/${noteId}/finalize`, {
      method: 'POST',
      body: JSON.stringify(signatureData),
    });
    return res?.data?.note || res?.note || res?.data || res;
  },

  amendNote: async (noteId, data) => {
    const res = await apiRequest(`/clinical/notes/${noteId}/amend`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data?.note || res?.note || res?.data || res;
  },

  // Treatment Plans & Goals
  createTreatmentPlan: async (data) => {
    const res = await apiRequest('/clinical/treatment-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data?.plan || res?.plan || res?.data || res;
  },

  updateTreatmentPlan: async (planId, data) => {
    const res = await apiRequest(`/clinical/treatment-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.data?.plan || res?.plan || res?.data || res;
  },

  updatePlanGoal: async (planId, goalId, data) => {
    const res = await apiRequest(`/clinical/treatment-plans/${planId}/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res?.data?.plan || res?.plan || res?.data || res;
  },

  // Tasks & Homework
  createTask: async (data) => {
    const res = await apiRequest('/clinical/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data?.task || res?.task || res?.data || res;
  },

  updateTaskStatus: async (taskId, data) => {
    const res = await apiRequest(`/clinical/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(typeof data === 'string' ? { status: data } : data),
    });
    return res?.data?.task || res?.task || res?.data || res;
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
    return res?.data?.recommendation || res?.recommendation || res?.data || res;
  },

  createPrescriptionRecord: async (data) => {
    const res = await apiRequest('/clinical/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data?.prescription || res?.prescription || res?.data || res;
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
    return res?.data?.report || res?.report || res?.data || res;
  },

  // Patient Care Portal
  getPatientCarePortalData: async () => {
    const res = await apiRequest('/clinical/patient-portal/records');
    return res?.data || res;
  },

  getPatientPortalRecords: async () => {
    return clinicalService.getPatientCarePortalData();
  },
};
