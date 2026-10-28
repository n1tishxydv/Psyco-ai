import { apiRequest } from './apiClient.js';

export const adminService = {
  // Telemetry & Metrics
  getMetrics: async () => {
    const res = await apiRequest('/admin/metrics');
    return res?.data || res;
  },
  getPlatformMetrics: async () => {
    const res = await apiRequest('/admin/metrics');
    return res?.data || res;
  },

  // Psychologist Registrations & Approvals
  getPsychologists: async () => {
    const res = await apiRequest('/admin/psychologists');
    return res?.data || res;
  },
  getPsychologistApprovals: async () => {
    const res = await apiRequest('/admin/psychologists');
    return res?.data || res;
  },

  approvePsychologist: async (psychologistUid) => {
    return apiRequest(`/admin/psychologists/${psychologistUid}/review`, {
      method: 'POST',
      body: JSON.stringify({
        approved: true,
        reason: 'Approved by practice administration',
      }),
    });
  },

  rejectPsychologist: async (psychologistUid, reason = '') => {
    return apiRequest(`/admin/psychologists/${psychologistUid}/review`, {
      method: 'POST',
      body: JSON.stringify({
        approved: false,
        reason: reason || 'Application credentials could not be verified',
      }),
    });
  },

  reviewPsychologist: async (psychologistUid, data) => {
    const payload = {
      approved: typeof data.approved === 'boolean' ? data.approved : data.status === 'approved',
      reason: data.reason || data.notes || '',
    };
    return apiRequest(`/admin/psychologists/${psychologistUid}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // User Directory & Account Governance
  getUsers: async (search = '', role = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest(`/admin/users${query}`);
    return res?.data || res;
  },

  listUsers: async (search = '', role = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest(`/admin/users${query}`);
    return res?.data || res;
  },

  updateUserStatus: async (targetUid, statusOrData, maybeReason = '') => {
    let payload;
    if (typeof statusOrData === 'object' && statusOrData !== null) {
      payload = {
        status: statusOrData.status || statusOrData.accountStatus || 'active',
        reason: statusOrData.reason || 'Administrative status change',
      };
    } else {
      payload = {
        status: statusOrData || 'active',
        reason: maybeReason || 'Administrative status update',
      };
    }

    return apiRequest(`/admin/users/${targetUid}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // FAQ Moderation & Publishing
  getFaqs: async () => {
    const res = await apiRequest('/admin/faqs');
    return res?.data?.faqs || res?.data || res || [];
  },

  getFaqSubmissions: async () => {
    const res = await apiRequest('/admin/faqs');
    return res?.data?.faqs || res?.data || res || [];
  },

  publishFaq: async (faqDataOrId, maybeData) => {
    let payload;
    if (typeof faqDataOrId === 'object' && faqDataOrId !== null) {
      payload = faqDataOrId;
    } else {
      // Called as (submissionId, { answer, category, question })
      payload = {
        question: maybeData?.question || 'General Practice Question',
        answer: maybeData?.answer || '',
        category: maybeData?.category || 'General Practice',
        order: maybeData?.order || 1,
        published: true,
      };
    }

    return apiRequest('/admin/faqs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  toggleFaqPublish: async (faqId, published) => {
    return apiRequest(`/admin/faqs/${faqId}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published }),
    });
  },

  // Contact Submissions
  getContactSubmissions: async () => {
    const res = await apiRequest('/admin/contact-submissions');
    return res?.data?.submissions || res?.data || res || [];
  },

  updateContactStatus: async (contactId, data) => {
    return apiRequest(`/admin/contact-submissions/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/admin/audit-logs?${query}` : '/admin/audit-logs';
    const res = await apiRequest(endpoint);
    return res?.data || res;
  },
};
