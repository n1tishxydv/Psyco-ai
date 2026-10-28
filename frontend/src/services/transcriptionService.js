import { apiRequest } from './apiClient.js';

export const transcriptionService = {
  // Consent
  getConsentStatus: async (sessionId) => {
    return apiRequest(`/transcription/consent/${sessionId}`, { method: 'GET' });
  },

  recordConsent: async (data) => {
    return apiRequest('/transcription/consent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  withdrawConsent: async (data) => {
    return apiRequest('/transcription/consent/withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Streaming & Turn Ingestion
  requestStreamingToken: async (sessionId) => {
    return apiRequest('/transcription/token', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  saveTranscriptTurn: async (data) => {
    return apiRequest('/transcription/turns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  finalizeTranscript: async (data) => {
    return apiRequest('/transcription/finalize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Meet & Manual Import
  importGoogleMeetTranscript: async (data) => {
    return apiRequest('/transcription/google-meet/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  importManualTextTranscript: async (data) => {
    return apiRequest('/transcription/manual-import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Retrieval & Search
  getTranscript: async (sessionIdOrTranscriptId) => {
    return apiRequest(`/transcription/sessions/${sessionIdOrTranscriptId}`, { method: 'GET' });
  },

  searchTranscript: async (transcriptId, query) => {
    const q = encodeURIComponent(query || '');
    return apiRequest(`/transcription/${transcriptId}/search?q=${q}`, { method: 'GET' });
  },

  // Inline Corrections & Review Status
  correctTranscriptEntry: async (transcriptId, entryId, updates) => {
    return apiRequest(`/transcription/${transcriptId}/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  updateReviewStatus: async (transcriptId, reviewStatus) => {
    return apiRequest(`/transcription/${transcriptId}/review-status`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus }),
    });
  },
};
