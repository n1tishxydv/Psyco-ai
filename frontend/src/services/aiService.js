import { apiRequest } from './apiClient.js';

export const aiService = {
  /**
   * Retrieves Gemini Clinical Copilot & background queue operational status
   */
  getStatus: async () => {
    return await apiRequest('/ai/status');
  },

  /**
   * Enqueues an asynchronous AI clinical documentation job
   * @param {object} payload - { sessionId, jobType, format, idempotencyKey, notes }
   */
  createJob: async (payload) => {
    return await apiRequest('/ai/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves the current processing status of an AI job
   */
  getJob: async (jobId) => {
    return await apiRequest(`/ai/jobs/${jobId}`);
  },

  /**
   * Lists all AI jobs associated with a clinical session
   */
  listJobsForSession: async (sessionId) => {
    return await apiRequest(`/ai/jobs/session/${sessionId}`);
  },

  /**
   * Retries an eligible failed or retrying AI job
   */
  retryJob: async (jobId) => {
    return await apiRequest(`/ai/jobs/${jobId}/retry`, {
      method: 'POST',
    });
  },

  /**
   * Cancels a queued AI job
   */
  cancelJob: async (jobId) => {
    return await apiRequest(`/ai/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Retrieves an AI-generated clinical draft
   */
  getDraft: async (draftId) => {
    return await apiRequest(`/ai/drafts/${draftId}`);
  },

  /**
   * Lists all AI drafts created for a clinical session
   */
  listDraftsForSession: async (sessionId) => {
    return await apiRequest(`/ai/drafts/session/${sessionId}`);
  },

  /**
   * Saves clinician edits to an AI-generated draft
   */
  updateDraft: async (draftId, updates) => {
    return await apiRequest(`/ai/drafts/${draftId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Discards / rejects an AI draft with a clear reason
   */
  rejectDraft: async (draftId, reason) => {
    return await apiRequest(`/ai/drafts/${draftId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Explicit Human Clinician Approval: commits AI draft into authoritative clinical records
   */
  approveDraft: async (draftId, approvalPayload = {}) => {
    return await apiRequest(`/ai/drafts/${draftId}/approve`, {
      method: 'POST',
      body: JSON.stringify(approvalPayload),
    });
  },
};
