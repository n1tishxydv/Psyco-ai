import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';

export const adminService = {
  /**
   * Retrieves high-level operational platform metrics without exposing clinical notes
   */
  getDashboardMetrics: async () => {
    const allUsers = (await firebaseRtdbAdapter.get('users')) || {};
    const allPatients = (await firebaseRtdbAdapter.get('patients')) || {};
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};
    const allAppointments = (await firebaseRtdbAdapter.get('appointments')) || {};
    const allFaqSubmissions = (await firebaseRtdbAdapter.get('faqSubmissions')) || {};
    const allContactSubmissions = (await firebaseRtdbAdapter.get('contactSubmissions')) || {};

    const usersList = Object.values(allUsers);
    const psychList = Object.values(allPsychologists);

    const pendingApprovals = psychList.filter(
      (p) => p.approvalStatus === 'pending' || (!p.verified && p.approvalStatus !== 'approved') || p.accountStatus === 'pending_verification'
    ).length;

    const suspendedAccounts = usersList.filter((u) => u.accountStatus === 'suspended' || u.status === 'suspended').length;
    const activeAccounts = usersList.filter((u) => u.accountStatus === 'active' || u.status === 'active').length;

    const newContactCount = Object.values(allContactSubmissions).filter(
      (c) => c.status === 'new' || !c.status
    ).length;

    const pendingFaqCount = Object.values(allFaqSubmissions).filter(
      (f) => !f.published
    ).length;

    const stats = {
      totalUsers: usersList.length,
      patientCount: Object.keys(allPatients).length,
      totalPatients: Object.keys(allPatients).length,
      psychologistCount: psychList.length,
      totalPsychologists: psychList.length,
      pendingApprovals,
      pendingPsychologistApprovals: pendingApprovals,
      activeAccounts,
      suspendedAccounts,
      totalAppointments: Object.keys(allAppointments).length,
      pendingFaqSubmissions: pendingFaqCount,
      pendingContactSubmissions: newContactCount,
      newContactSubmissions: newContactCount,
    };

    return {
      ...stats,
      metrics: stats,
    };
  },

  /**
   * List psychologists for administrative credential verification
   */
  getPsychologistRegistrations: async () => {
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};
    const allUsers = (await firebaseRtdbAdapter.get('users')) || {};

    return Object.entries(allPsychologists).map(([uid, p]) => {
      const u = allUsers[uid] || {};
      const approvalStatus = p.approvalStatus || (p.verified ? 'approved' : 'pending');
      const isApproved = approvalStatus === 'approved';
      return {
        uid,
        psychologistId: p.psychologistId || p.id || uid,
        id: p.id || p.psychologistId || uid,
        fullName: p.fullName || u.fullName || 'Clinician',
        email: p.email || u.email,
        licenseNumber: p.licenseNumber || 'Pending verification',
        specializations: p.specializations || p.specialization || [],
        qualifications: p.qualifications || [],
        yearsOfExperience: p.yearsOfExperience || null,
        bio: p.bio || '',
        canPrescribe: Boolean(p.canPrescribe),
        clinicAddress: p.clinicAddress || null,
        verified: isApproved,
        approvalStatus,
        rejectionReason: p.rejectionReason || p.reviewReason || null,
        accountStatus: u.accountStatus || u.status || (isApproved ? 'active' : 'pending_verification'),
        createdAt: p.createdAt,
      };
    });
  },

  /**
   * Approve or reject a psychologist account
   */
  reviewPsychologist: async (adminUid, psychologistUid, { approved, status, reason }) => {
    const psych = await firebaseRtdbAdapter.get(`psychologists/${psychologistUid}`);
    if (!psych) {
      const err = new Error('Psychologist record not found.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    const isApproved = approved !== undefined ? Boolean(approved) : status === 'approved';
    const newStatus = isApproved ? 'active' : 'suspended';

    psych.verified = isApproved;
    psych.accountStatus = newStatus;
    psych.approvalStatus = isApproved ? 'approved' : 'rejected';
    psych.reviewedBy = adminUid;
    psych.reviewedAt = now;
    psych.reviewReason = reason || (isApproved ? 'Credentials verified' : 'Application declined');
    psych.updatedAt = now;

    await firebaseRtdbAdapter.set(`psychologists/${psychologistUid}`, psych);

    // Sync to user record
    const user = (await firebaseRtdbAdapter.get(`users/${psychologistUid}`)) || {};
    user.accountStatus = newStatus;
    user.status = newStatus;
    user.verified = isApproved;
    user.updatedAt = now;
    await firebaseRtdbAdapter.set(`users/${psychologistUid}`, user);

    await auditService.record({
      action: isApproved ? 'PSYCHOLOGIST_APPROVED' : 'PSYCHOLOGIST_REJECTED',
      userId: adminUid,
      details: { psychologistUid, approved: isApproved, reason },
    });

    return { psychologist: psych, status: newStatus, approvalStatus: isApproved ? 'approved' : 'rejected' };
  },

  /**
   * Administrative user directory
   */
  getUserDirectory: async (search = '', roleFilter = '') => {
    const allUsers = (await firebaseRtdbAdapter.get('users')) || {};
    const allPatients = (await firebaseRtdbAdapter.get('patients')) || {};
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};

    let users = Object.entries(allUsers).map(([uid, u]) => {
      let displayName = u.fullName || u.email;
      if (u.role === 'patient' && allPatients[uid]) {
        displayName = allPatients[uid].fullName || allPatients[uid].preferredName || displayName;
      } else if (u.role === 'psychologist' && allPsychologists[uid]) {
        displayName = allPsychologists[uid].fullName || displayName;
      }

      return {
        uid,
        email: u.email,
        fullName: displayName,
        role: u.role || 'patient',
        status: u.accountStatus || u.status || 'active',
        createdAt: u.createdAt,
      };
    });

    if (roleFilter) {
      users = users.filter((u) => u.role === roleFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      );
    }

    return users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Suspend or reactivate user account
   */
  updateUserStatus: async (adminUid, targetUid, { status, reason }) => {
    const user = await firebaseRtdbAdapter.get(`users/${targetUid}`);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    user.accountStatus = status;
    user.status = status;
    user.statusReason = reason;
    user.statusUpdatedAt = now;
    user.statusUpdatedBy = adminUid;

    await firebaseRtdbAdapter.set(`users/${targetUid}`, user);

    // If psychologist, update psychologist profile as well
    if (user.role === 'psychologist') {
      const psych = await firebaseRtdbAdapter.get(`psychologists/${targetUid}`);
      if (psych) {
        psych.accountStatus = status;
        await firebaseRtdbAdapter.set(`psychologists/${targetUid}`, psych);
      }
    }

    await auditService.record({
      action: 'USER_STATUS_UPDATED',
      userId: adminUid,
      details: { targetUid, status, reason },
    });

    return user;
  },

  /**
   * FAQ Moderation: Publish an FAQ
   */
  publishFaq: async (adminUid, { question, answer, category = 'General Practice', order = 1, published = true }) => {
    const faqId = `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const faq = {
      id: faqId,
      question,
      answer,
      category,
      order,
      published,
      status: published ? 'published' : 'draft',
      publishedBy: adminUid,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`faqs/${faqId}`, faq);

    await auditService.record({
      action: 'FAQ_PUBLISHED',
      userId: adminUid,
      details: { faqId, question },
    });

    return faq;
  },

  /**
   * FAQ Moderation: List FAQs
   */
  getAllFaqs: async () => {
    const all = (await firebaseRtdbAdapter.get('faqs')) || {};
    return Object.values(all).sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  /**
   * FAQ Moderation: Toggle publish state
   */
  toggleFaqPublish: async (adminUid, faqId, published) => {
    const faq = await firebaseRtdbAdapter.get(`faqs/${faqId}`);
    if (!faq) {
      const err = new Error('FAQ not found.');
      err.status = 404;
      throw err;
    }

    faq.published = Boolean(published);
    faq.updatedAt = new Date().toISOString();

    await firebaseRtdbAdapter.set(`faqs/${faqId}`, faq);
    return faq;
  },

  /**
   * Contact Submissions: List
   */
  getContactSubmissions: async () => {
    const all = (await firebaseRtdbAdapter.get('contactSubmissions')) || {};
    return Object.values(all).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Contact Submissions: Update status
   */
  updateContactStatus: async (adminUid, contactId, { status, adminNotes }) => {
    const contact = await firebaseRtdbAdapter.get(`contactSubmissions/${contactId}`);
    if (!contact) {
      const err = new Error('Contact submission not found.');
      err.status = 404;
      throw err;
    }

    contact.status = status;
    if (adminNotes !== undefined) {
      contact.adminNotes = adminNotes;
    }
    contact.reviewedBy = adminUid;
    contact.reviewedAt = new Date().toISOString();

    await firebaseRtdbAdapter.set(`contactSubmissions/${contactId}`, contact);
    return contact;
  },

  /**
   * Audit Logs: Query operational logs
   */
  getAuditLogs: async () => {
    const all = (await firebaseRtdbAdapter.get('auditLogs')) || {};
    return Object.values(all).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  },
};
