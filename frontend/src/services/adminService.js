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

  // Psychologist Registrations & Credential Verification
  getPsychologists: async (status = '', search = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest(`/admin/psychologists${query}`);
    return res?.data || res;
  },
  getPsychologistApprovals: async (status = '', search = '') => {
    return adminService.getPsychologists(status, search);
  },

  approvePsychologist: async (psychologistUid) => {
    return apiRequest(`/admin/psychologists/${psychologistUid}/review`, {
      method: 'POST',
      body: JSON.stringify({
        approved: true,
        status: 'approved',
        reason: 'Credentials reviewed and verified by platform administration',
      }),
    });
  },

  rejectPsychologist: async (psychologistUid, reason = '') => {
    return apiRequest(`/admin/psychologists/${psychologistUid}/review`, {
      method: 'POST',
      body: JSON.stringify({
        approved: false,
        status: 'rejected',
        reason: reason || 'Application credentials could not be verified',
      }),
    });
  },

  suspendPsychologist: async (psychologistUid, reason = '') => {
    return apiRequest(`/admin/psychologists/${psychologistUid}/review`, {
      method: 'POST',
      body: JSON.stringify({
        approved: false,
        status: 'suspended',
        reason: reason || 'Practitioner account suspended by administration',
      }),
    });
  },

  reviewPsychologist: async (psychologistUid, data) => {
    const payload = {
      approved: typeof data.approved === 'boolean' ? data.approved : data.status === 'approved',
      status: data.status || (data.approved ? 'approved' : 'rejected'),
      reason: data.reason || data.notes || '',
    };
    return apiRequest(`/admin/psychologists/${psychologistUid}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // User Directory & Account Governance
  getUsers: async (search = '', role = '', status = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    if (status && status !== 'all') params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest(`/admin/users${query}`);
    return res?.data || res;
  },

  listUsers: async (search = '', role = '', status = '') => {
    return adminService.getUsers(search, role, status);
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

  // Clinic Management
  getClinics: async (status = '', search = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest(`/admin/clinics${query}`);
    return res?.data?.clinics || res?.data || res || [];
  },

  createClinic: async (clinicData) => {
    return apiRequest('/admin/clinics', {
      method: 'POST',
      body: JSON.stringify(clinicData),
    });
  },

  updateClinicStatus: async (clinicId, status, reason = '') => {
    return apiRequest(`/admin/clinics/${clinicId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason: reason || 'Administrative clinic status review' }),
    });
  },

  getClinicMemberships: async (clinicId = '') => {
    const query = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : '';
    const res = await apiRequest(`/admin/clinics/memberships${query}`);
    return res?.data?.memberships || res?.data || res || [];
  },

  reviewClinicMembership: async (membershipId, status, reason = '') => {
    return apiRequest(`/admin/clinics/memberships/${membershipId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  // Independent Practice Oversight
  getIndependentPractices: async (status = '', search = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest(`/admin/practices${query}`);
    return res?.data?.practices || res?.data || res || [];
  },

  updatePracticeStatus: async (practiceId, status, reason = '') => {
    return apiRequest(`/admin/practices/${practiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason: reason || 'Practice oversight update' }),
    });
  },

  // Support Tickets & Inquiries
  getSupportTickets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/admin/support/tickets?${query}` : '/admin/support/tickets';
    const res = await apiRequest(endpoint);
    return res?.data?.tickets || res?.data || res || [];
  },

  getSupportTicketDetails: async (ticketId) => {
    const res = await apiRequest(`/admin/support/tickets/${ticketId}`);
    return res?.data?.ticket || res?.data || res;
  },

  updateSupportTicket: async (ticketId, data) => {
    return apiRequest(`/admin/support/tickets/${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  addSupportReply: async (ticketId, message, isInternal = false) => {
    return apiRequest(`/admin/support/tickets/${ticketId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ message, isInternal }),
    });
  },

  // Legacy Contact Submissions
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

  // FAQ Moderation & Publishing
  getFaqs: async (category = '') => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiRequest(`/admin/faqs${query}`);
    return res?.data?.faqs || res?.data || res || [];
  },

  getFaqSubmissions: async () => {
    return adminService.getFaqs();
  },

  publishFaq: async (faqDataOrId, maybeData) => {
    let payload;
    let endpoint = '/admin/faqs';
    if (typeof faqDataOrId === 'object' && faqDataOrId !== null) {
      payload = faqDataOrId;
    } else {
      endpoint = `/admin/faqs/${faqDataOrId}/publish`;
      payload = {
        question: maybeData?.question || 'General Practice Question',
        answer: maybeData?.answer || '',
        category: maybeData?.category || 'General Practice',
        order: maybeData?.order || 1,
        published: true,
      };
    }

    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateFaq: async (faqId, data) => {
    return apiRequest(`/admin/faqs/${faqId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteFaq: async (faqId) => {
    return apiRequest(`/admin/faqs/${faqId}`, {
      method: 'DELETE',
    });
  },

  toggleFaqPublish: async (faqId, published) => {
    return apiRequest(`/admin/faqs/${faqId}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ published }),
    });
  },

  // Public CMS Content
  getPublicContent: async () => {
    const res = await apiRequest('/admin/content');
    return res?.data?.content || res?.data || res || {};
  },

  updatePublicContent: async (sectionKey, data) => {
    return apiRequest(`/admin/content/${sectionKey}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Compliance Audit Logs
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/admin/audit-logs?${query}` : '/admin/audit-logs';
    const res = await apiRequest(endpoint);
    return res?.data || res;
  },

  // System Health & Monitoring Telemetry
  getSystemHealth: async () => {
    const res = await apiRequest('/admin/system-health');
    return res?.data || res;
  },

  // Platform Operational Settings
  getPlatformSettings: async () => {
    const res = await apiRequest('/admin/settings');
    return res?.data?.settings || res?.data || res;
  },

  updatePlatformSettings: async (settings) => {
    return apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
