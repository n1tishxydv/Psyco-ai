import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';
import { firebase } from '../database/firebase.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';
import { googleMeetAdapter } from '../integrations/googleMeet/googleMeetAdapter.js';
import { geminiAdapter } from '../integrations/gemini/geminiAdapter.js';
import { assemblyaiAdapter } from '../integrations/assemblyai/assemblyaiAdapter.js';
import { jobQueue } from '../jobs/index.js';
import config from '../config/index.js';

export const adminService = {
  /**
   * Retrieves high-level operational platform metrics and pending action queues
   * strictly without exposing identifiable clinical notes or patient records.
   */
  getDashboardMetrics: async () => {
    const allUsers = (await firebaseRtdbAdapter.get('users')) || {};
    const allPatients = (await firebaseRtdbAdapter.get('patients')) || {};
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};
    const allAppointments = (await firebaseRtdbAdapter.get('appointments')) || {};
    const allPractices = (await firebaseRtdbAdapter.get('practices')) || {};
    const allClinics = (await firebaseRtdbAdapter.get('clinics')) || {};
    const allMemberships = (await firebaseRtdbAdapter.get('practiceMemberships')) || {};
    const allSupportTickets = (await firebaseRtdbAdapter.get('supportTickets')) || {};
    const allContactSubmissions = (await firebaseRtdbAdapter.get('contactSubmissions')) || {};
    const allFaqs = (await firebaseRtdbAdapter.get('faqs')) || {};

    const usersList = Object.values(allUsers);
    const psychList = Object.values(allPsychologists);
    const practiceList = Object.values(allPractices);
    const clinicList = [...Object.values(allClinics), ...practiceList.filter((p) => p.type === 'clinic')];
    // Deduplicate clinics by id
    const uniqueClinicsMap = new Map();
    clinicList.forEach((c) => {
      const cId = c.id || c.clinicId;
      if (cId && !uniqueClinicsMap.has(cId)) uniqueClinicsMap.set(cId, c);
    });
    const uniqueClinics = Array.from(uniqueClinicsMap.values());

    const pendingApprovals = psychList.filter(
      (p) =>
        p.approvalStatus === 'pending' ||
        (!p.verified && p.approvalStatus !== 'approved' && p.approvalStatus !== 'rejected') ||
        p.accountStatus === 'pending_verification'
    ).length;

    const verifiedPsychologists = psychList.filter(
      (p) => p.approvalStatus === 'approved' || p.verified === true
    ).length;

    const suspendedAccounts = usersList.filter(
      (u) => u.accountStatus === 'suspended' || u.status === 'suspended'
    ).length;
    const activeAccounts = usersList.filter(
      (u) => u.accountStatus === 'active' || u.status === 'active'
    ).length;

    const pendingClinics = uniqueClinics.filter((c) => c.status === 'pending').length;
    const activeClinics = uniqueClinics.filter((c) => c.status === 'active' || (!c.status && c.type === 'clinic')).length;

    const independentPractices = practiceList.filter((p) => p.type === 'independent');
    const activePracticesCount = independentPractices.filter((p) => p.status !== 'suspended').length;

    // Support tickets count
    const ticketsList = Object.values(allSupportTickets);
    const openTicketsCount = ticketsList.filter(
      (t) => t.status === 'new' || t.status === 'open' || t.status === 'in_progress'
    ).length;
    const newContactCount = Object.values(allContactSubmissions).filter(
      (c) => c.status === 'new' || !c.status
    ).length;
    const totalPendingSupport = openTicketsCount + newContactCount;

    // Pending membership requests
    const pendingMemberships = Object.values(allMemberships).filter((m) => m.status === 'pending').length;

    // Collect pending action items for direct navigation
    const pendingActions = [];
    psychList
      .filter((p) => p.approvalStatus === 'pending' || (!p.verified && p.approvalStatus !== 'approved' && p.approvalStatus !== 'rejected'))
      .slice(0, 5)
      .forEach((p) => {
        pendingActions.push({
          type: 'psychologist_verification',
          id: p.id || p.psychologistId || p.uid,
          title: `Clinician Verification: ${p.fullName || p.email || 'Applicant'}`,
          subtitle: `License: ${p.licenseNumber || 'Pending'} • Exp: ${p.yearsOfExperience || 0} yrs`,
          submittedAt: p.createdAt || p.updatedAt || new Date().toISOString(),
          targetTab: 'psychologists',
        });
      });

    uniqueClinics
      .filter((c) => c.status === 'pending')
      .slice(0, 5)
      .forEach((c) => {
        pendingActions.push({
          type: 'clinic_approval',
          id: c.id,
          title: `Clinic Registration: ${c.name || c.practiceName || 'Clinic'}`,
          subtitle: `Contact: ${c.primaryContact || c.email || 'N/A'}`,
          submittedAt: c.createdAt || new Date().toISOString(),
          targetTab: 'clinics',
        });
      });

    Object.values(allMemberships)
      .filter((m) => m.status === 'pending')
      .slice(0, 5)
      .forEach((m) => {
        pendingActions.push({
          type: 'clinic_membership',
          id: m.id,
          title: `Membership Request: ${m.psychologistName || 'Clinician'} -> ${m.clinicName || 'Clinic'}`,
          subtitle: `Status: Pending Review`,
          submittedAt: m.requestedAt || new Date().toISOString(),
          targetTab: 'clinics',
        });
      });

    ticketsList
      .filter((t) => t.status === 'new' || t.status === 'open')
      .slice(0, 5)
      .forEach((t) => {
        pendingActions.push({
          type: 'support_ticket',
          id: t.id,
          title: `Support: ${t.subject || 'Inquiry'}`,
          subtitle: `From: ${t.userEmail || t.userName || 'User'} [${t.priority || 'normal'}]`,
          submittedAt: t.createdAt || new Date().toISOString(),
          targetTab: 'support',
        });
      });

    const pendingFaqCount = Object.values(allFaqs).filter((f) => !f.published || f.status === 'draft').length;

    const stats = {
      totalUsers: usersList.length,
      patientCount: Object.keys(allPatients).length,
      totalPatients: Object.keys(allPatients).length,
      psychologistCount: psychList.length,
      totalPsychologists: psychList.length,
      verifiedPsychologists,
      pendingApprovals,
      pendingPsychologistApprovals: pendingApprovals,
      totalClinics: uniqueClinics.length,
      pendingClinics,
      activeClinics,
      activePractices: activePracticesCount,
      independentPracticesCount: independentPractices.length,
      activeAccounts,
      suspendedAccounts,
      totalAppointments: Object.keys(allAppointments).length,
      pendingSupportRequests: totalPendingSupport,
      pendingSupportTickets: totalPendingSupport,
      pendingMemberships,
      pendingFaqSubmissions: pendingFaqCount,
      pendingContactSubmissions: newContactCount,
      newContactSubmissions: newContactCount,
    };

    return {
      ...stats,
      metrics: stats,
      pendingActions,
    };
  },

  /**
   * Administrative User Directory with search, role filter, status filter, and pagination
   */
  getUserDirectory: async (search = '', roleFilter = '', statusFilter = '') => {
    const allUsers = (await firebaseRtdbAdapter.get('users')) || {};
    const allPatients = (await firebaseRtdbAdapter.get('patients')) || {};
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};

    let users = Object.entries(allUsers).map(([uid, u]) => {
      let displayName = u.fullName || u.email;
      let verificationStatus = null;

      if (u.role === 'patient' && allPatients[uid]) {
        displayName = allPatients[uid].fullName || allPatients[uid].preferredName || displayName;
      } else if (u.role === 'psychologist' && allPsychologists[uid]) {
        displayName = allPsychologists[uid].fullName || displayName;
        verificationStatus = allPsychologists[uid].approvalStatus || (allPsychologists[uid].verified ? 'approved' : 'pending');
      }

      return {
        uid,
        email: u.email,
        fullName: displayName,
        role: u.role || 'patient',
        status: u.accountStatus || u.status || 'active',
        accountStatus: u.accountStatus || u.status || 'active',
        verificationStatus,
        statusReason: u.statusReason || null,
        statusUpdatedAt: u.statusUpdatedAt || null,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    if (roleFilter && roleFilter !== 'all') {
      users = users.filter((u) => u.role === roleFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      users = users.filter((u) => u.status === statusFilter || u.accountStatus === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.uid || '').toLowerCase().includes(q)
      );
    }

    return users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Suspend or reactivate user account with self-suspension guard
   */
  updateUserStatus: async (adminUid, targetUid, { status, reason }) => {
    if (adminUid === targetUid && status === 'suspended') {
      const err = new Error('Self-suspension prohibited. You cannot suspend your own administrative account.');
      err.status = 400;
      err.code = 'SELF_SUSPENSION_PROHIBITED';
      throw err;
    }

    const user = await firebaseRtdbAdapter.get(`users/${targetUid}`);
    if (!user) {
      const err = new Error('User account not found.');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
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
        psych.statusReason = reason;
        psych.updatedAt = now;
        await firebaseRtdbAdapter.set(`psychologists/${targetUid}`, psych);
      }
    }

    await auditService.record({
      action: status === 'suspended' ? 'USER_SUSPENDED' : status === 'active' ? 'USER_REACTIVATED' : 'USER_STATUS_UPDATED',
      userId: adminUid,
      details: { targetUid, role: user.role, status, reason },
    });

    return user;
  },

  /**
   * List psychologists for credential review and verification management
   */
  getPsychologistRegistrations: async (statusFilter = '', search = '') => {
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};
    const allUsers = (await firebaseRtdbAdapter.get('users')) || {};

    let list = Object.entries(allPsychologists).map(([uid, p]) => {
      const u = allUsers[uid] || {};
      const approvalStatus = p.approvalStatus || (p.verified ? 'approved' : 'pending');
      const isApproved = approvalStatus === 'approved';
      return {
        uid,
        psychologistId: p.psychologistId || p.id || uid,
        id: p.id || p.psychologistId || uid,
        fullName: p.fullName || u.fullName || 'Clinician Applicant',
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
        reviewedBy: p.reviewedBy || null,
        reviewedAt: p.reviewedAt || null,
        accountStatus: u.accountStatus || u.status || (isApproved ? 'active' : 'pending_verification'),
        createdAt: p.createdAt || u.createdAt || null,
      };
    });

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((p) => p.approvalStatus === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.fullName || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.licenseNumber || '').toLowerCase().includes(q) ||
          (p.uid || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Professional credential verification review workflow
   */
  reviewPsychologist: async (adminUid, psychologistUid, { approved, status, reason }) => {
    const psych = await firebaseRtdbAdapter.get(`psychologists/${psychologistUid}`);
    if (!psych) {
      const err = new Error('Psychologist record not found.');
      err.status = 404;
      err.code = 'PSYCHOLOGIST_NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();
    let isApproved;
    let newStatus;
    let newApprovalStatus;

    if (status) {
      if (status === 'approved') {
        isApproved = true;
        newStatus = 'active';
        newApprovalStatus = 'approved';
      } else if (status === 'suspended') {
        isApproved = false;
        newStatus = 'suspended';
        newApprovalStatus = 'suspended';
      } else {
        isApproved = false;
        newStatus = 'suspended';
        newApprovalStatus = 'rejected';
      }
    } else {
      isApproved = Boolean(approved);
      newStatus = isApproved ? 'active' : 'suspended';
      newApprovalStatus = isApproved ? 'approved' : 'rejected';
    }

    if (!isApproved && !reason && newApprovalStatus === 'rejected') {
      const err = new Error('A documented reason is required when rejecting clinician verification.');
      err.status = 400;
      err.code = 'REASON_REQUIRED';
      throw err;
    }

    psych.verified = isApproved;
    psych.accountStatus = newStatus;
    psych.approvalStatus = newApprovalStatus;
    psych.reviewedBy = adminUid;
    psych.reviewedAt = now;
    psych.reviewReason = reason || (isApproved ? 'Credentials verified by platform administration' : 'Application declined');
    psych.updatedAt = now;

    await firebaseRtdbAdapter.set(`psychologists/${psychologistUid}`, psych);

    // Synchronize to core user record
    const user = (await firebaseRtdbAdapter.get(`users/${psychologistUid}`)) || {};
    user.accountStatus = newStatus;
    user.status = newStatus;
    user.verified = isApproved;
    user.approvalStatus = newApprovalStatus;
    user.statusReason = reason || psych.reviewReason;
    user.updatedAt = now;
    await firebaseRtdbAdapter.set(`users/${psychologistUid}`, user);

    const action =
      newApprovalStatus === 'approved'
        ? 'PSYCHOLOGIST_APPROVED'
        : newApprovalStatus === 'suspended'
        ? 'PSYCHOLOGIST_SUSPENDED'
        : 'PSYCHOLOGIST_REJECTED';

    await auditService.record({
      action,
      userId: adminUid,
      details: {
        psychologistUid,
        approvalStatus: newApprovalStatus,
        approved: isApproved,
        reason: psych.reviewReason,
      },
    });

    return {
      psychologist: psych,
      status: newStatus,
      approvalStatus: newApprovalStatus,
      verified: isApproved,
    };
  },

  /**
   * Clinic Management: List registered clinics
   */
  getClinics: async (statusFilter = '', search = '') => {
    const allClinics = (await firebaseRtdbAdapter.get('clinics')) || {};
    const allPractices = (await firebaseRtdbAdapter.get('practices')) || {};
    const allMemberships = (await firebaseRtdbAdapter.get('practiceMemberships')) || {};

    const clinicsMap = new Map();

    // Ingest clinics table
    Object.entries(allClinics).forEach(([id, c]) => {
      clinicsMap.set(id, {
        id,
        name: c.name || c.practiceName || 'Clinic Organization',
        organizationType: c.organizationType || 'private_group',
        primaryContact: c.primaryContact || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || {},
        status: c.status || 'active',
        description: c.description || '',
        registeredBy: c.registeredBy || null,
        reviewedBy: c.reviewedBy || null,
        locationsCount: Array.isArray(c.locations) ? c.locations.length : 1,
        createdAt: c.createdAt || null,
        updatedAt: c.updatedAt || null,
      });
    });

    // Ingest practices of type 'clinic'
    Object.entries(allPractices).forEach(([id, p]) => {
      if (p.type === 'clinic' && !clinicsMap.has(id)) {
        clinicsMap.set(id, {
          id,
          name: p.practiceName || p.name || 'Registered Clinic',
          organizationType: p.organizationType || 'private_group',
          primaryContact: p.primaryContact || p.contactEmail || '',
          email: p.contactEmail || '',
          phone: p.contactPhone || '',
          address: p.locations?.[0]?.address || {},
          status: p.status || (p.isActive !== false ? 'active' : 'suspended'),
          description: p.professionalBio || p.description || '',
          registeredBy: p.ownerUid || null,
          reviewedBy: null,
          locationsCount: Array.isArray(p.locations) ? p.locations.length : 0,
          createdAt: p.createdAt || null,
          updatedAt: p.updatedAt || null,
        });
      }
    });

    // Calculate membership counts
    const membershipList = Object.values(allMemberships);
    clinicsMap.forEach((clinic, id) => {
      clinic.membershipCount = membershipList.filter(
        (m) => m.clinicId === id && m.status === 'approved'
      ).length;
      clinic.pendingMembershipCount = membershipList.filter(
        (m) => m.clinicId === id && m.status === 'pending'
      ).length;
    });

    let list = Array.from(clinicsMap.values());

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.primaryContact || '').toLowerCase().includes(q) ||
          (c.id || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Clinic Management: Create a new clinic organization
   */
  createClinic: async (adminUid, clinicData) => {
    const clinicId = `clinic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record = {
      id: clinicId,
      name: clinicData.name.trim(),
      organizationType: clinicData.organizationType || 'private_group',
      primaryContact: clinicData.primaryContact.trim(),
      email: clinicData.email.trim(),
      phone: clinicData.phone?.trim() || '',
      address: clinicData.address || {},
      description: clinicData.description?.trim() || '',
      status: 'active',
      registeredBy: adminUid,
      createdAt: now,
      updatedAt: now,
    };

    // Save to clinics table
    await firebaseRtdbAdapter.set(`clinics/${clinicId}`, record);

    // Also register in practices table so clinicians can associate with it
    const practiceRecord = {
      id: clinicId,
      type: 'clinic',
      practiceName: record.name,
      professionalBio: record.description,
      contactEmail: record.email,
      contactPhone: record.phone,
      locations: [
        {
          id: `loc_${clinicId}_primary`,
          name: 'Main Clinic Facility',
          address: record.address,
          isDefault: true,
          isActive: true,
        },
      ],
      isActive: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await firebaseRtdbAdapter.set(`practices/${clinicId}`, practiceRecord);

    await auditService.record({
      action: 'CLINIC_CREATED',
      userId: adminUid,
      details: { clinicId, name: record.name },
    });

    return record;
  },

  /**
   * Clinic Management: Update clinic status (approve, suspend, reject)
   */
  updateClinicStatus: async (adminUid, clinicId, { status, reason }) => {
    let clinic = await firebaseRtdbAdapter.get(`clinics/${clinicId}`);
    const now = new Date().toISOString();

    if (!clinic) {
      // Check if it exists in practices table
      const practice = await firebaseRtdbAdapter.get(`practices/${clinicId}`);
      if (!practice) {
        const err = new Error('Clinic not found.');
        err.status = 404;
        err.code = 'CLINIC_NOT_FOUND';
        throw err;
      }
      clinic = {
        id: clinicId,
        name: practice.practiceName || practice.name,
        organizationType: 'private_group',
        status: practice.status || 'active',
        createdAt: practice.createdAt || now,
      };
    }

    clinic.status = status;
    clinic.statusReason = reason;
    clinic.reviewedBy = adminUid;
    clinic.updatedAt = now;

    await firebaseRtdbAdapter.set(`clinics/${clinicId}`, clinic);

    // Sync status to practices table
    const practice = (await firebaseRtdbAdapter.get(`practices/${clinicId}`)) || {};
    practice.status = status;
    practice.isActive = status === 'active';
    practice.updatedAt = now;
    await firebaseRtdbAdapter.set(`practices/${clinicId}`, practice);

    await auditService.record({
      action: 'CLINIC_STATUS_UPDATED',
      userId: adminUid,
      details: { clinicId, status, reason },
    });

    return clinic;
  },

  /**
   * Clinic Membership Management: List membership requests
   */
  getClinicMemberships: async (clinicId = '') => {
    const allMemberships = (await firebaseRtdbAdapter.get('practiceMemberships')) || {};
    let list = Object.values(allMemberships);

    if (clinicId) {
      list = list.filter((m) => m.clinicId === clinicId);
    }

    return list.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
  },

  /**
   * Clinic Membership Management: Approve, reject, or revoke membership
   */
  reviewClinicMembership: async (adminUid, membershipId, { status, reason }) => {
    const membership = await firebaseRtdbAdapter.get(`practiceMemberships/${membershipId}`);
    if (!membership) {
      const err = new Error('Membership request not found.');
      err.status = 404;
      err.code = 'MEMBERSHIP_NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();
    membership.status = status;
    membership.reviewReason = reason || '';
    membership.reviewedBy = adminUid;
    membership.updatedAt = now;

    await firebaseRtdbAdapter.set(`practiceMemberships/${membershipId}`, membership);

    await auditService.record({
      action: 'CLINIC_MEMBERSHIP_REVIEWED',
      userId: adminUid,
      details: { membershipId, clinicId: membership.clinicId, psychologistId: membership.psychologistId, status, reason },
    });

    return membership;
  },

  /**
   * Independent Practice Oversight: List independent practices
   */
  getIndependentPractices: async (statusFilter = '', search = '') => {
    const allPractices = (await firebaseRtdbAdapter.get('practices')) || {};
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};
    const allUsers = (await firebaseRtdbAdapter.get('users')) || {};

    let list = Object.values(allPractices)
      .filter((p) => p.type === 'independent')
      .map((p) => {
        const psych = allPsychologists[p.ownerUid] || {};
        const user = allUsers[p.ownerUid] || {};
        return {
          id: p.id,
          practiceName: p.practiceName,
          ownerUid: p.ownerUid,
          clinicianName: psych.fullName || user.fullName || 'Clinician',
          clinicianEmail: psych.email || user.email || '',
          offeredModes: p.offeredModes || 'both',
          defaultMode: p.defaultMode || 'in_person',
          locationsCount: Array.isArray(p.locations) ? p.locations.length : 0,
          appointmentDurationMinutes: p.appointmentDurationMinutes || 50,
          bufferTimeMinutes: p.bufferTimeMinutes || 10,
          setupCompleted: Boolean(p.setupCompleted),
          status: p.status || 'active',
          statusReason: p.statusReason || null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      });

    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.practiceName || '').toLowerCase().includes(q) ||
          (p.clinicianName || '').toLowerCase().includes(q) ||
          (p.clinicianEmail || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Independent Practice Oversight: Suspend or reinstate practice
   */
  updatePracticeStatus: async (adminUid, practiceId, { status, reason }) => {
    const practice = await firebaseRtdbAdapter.get(`practices/${practiceId}`);
    if (!practice) {
      const err = new Error('Practice record not found.');
      err.status = 404;
      err.code = 'PRACTICE_NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();
    practice.status = status;
    practice.statusReason = reason;
    practice.statusUpdatedAt = now;
    practice.statusUpdatedBy = adminUid;
    practice.updatedAt = now;

    await firebaseRtdbAdapter.set(`practices/${practiceId}`, practice);

    await auditService.record({
      action: 'INDEPENDENT_PRACTICE_STATUS_UPDATED',
      userId: adminUid,
      details: { practiceId, status, reason },
    });

    return practice;
  },

  /**
   * Support Tickets: List tickets with category, priority, and status filters
   */
  getSupportTickets: async ({ status = '', category = '', priority = '', search = '' } = {}) => {
    const allTickets = (await firebaseRtdbAdapter.get('supportTickets')) || {};
    const allContacts = (await firebaseRtdbAdapter.get('contactSubmissions')) || {};

    const tickets = [];

    // Ingest formal support tickets
    Object.values(allTickets).forEach((t) => {
      tickets.push({
        id: t.id,
        ticketNumber: t.ticketNumber || `TKT-${t.id.slice(-4).toUpperCase()}`,
        userUid: t.userUid || null,
        userEmail: t.userEmail || '',
        userName: t.userName || 'User',
        category: t.category || 'general_assistance',
        priority: t.priority || 'normal',
        status: t.status || 'open',
        subject: t.subject || 'Platform Inquiry',
        message: t.message || '',
        assignedTo: t.assignedTo || null,
        repliesCount: Array.isArray(t.replies) ? t.replies.length : 0,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
    });

    // Ingest legacy contact submissions as support tickets
    Object.values(allContacts).forEach((c) => {
      const isAlreadyIn = tickets.some((t) => t.id === c.id);
      if (!isAlreadyIn) {
        let mappedStatus = 'new';
        if (c.status === 'in_review') mappedStatus = 'in_progress';
        else if (c.status === 'responded') mappedStatus = 'resolved';
        else if (c.status === 'closed' || c.status === 'spam') mappedStatus = 'closed';

        tickets.push({
          id: c.id,
          ticketNumber: `INQ-${c.id.slice(-4).toUpperCase()}`,
          userUid: null,
          userEmail: c.email || '',
          userName: c.name || 'Visitor',
          category: 'general_assistance',
          priority: 'normal',
          status: mappedStatus,
          subject: c.subject || 'Website Inquiry',
          message: c.message || '',
          assignedTo: c.reviewedBy || null,
          adminNotes: c.adminNotes || '',
          repliesCount: 0,
          createdAt: c.createdAt,
          updatedAt: c.reviewedAt || c.createdAt,
        });
      }
    });

    let filtered = tickets;

    if (status && status !== 'all') {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((t) => t.category === category);
    }

    if (priority && priority !== 'all') {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.subject || '').toLowerCase().includes(q) ||
          (t.userName || '').toLowerCase().includes(q) ||
          (t.userEmail || '').toLowerCase().includes(q) ||
          (t.ticketNumber || '').toLowerCase().includes(q) ||
          (t.message || '').toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Support Tickets: Get single ticket details with replies
   */
  getSupportTicketDetails: async (ticketId) => {
    let ticket = await firebaseRtdbAdapter.get(`supportTickets/${ticketId}`);
    if (!ticket) {
      // Check contact submissions
      const contact = await firebaseRtdbAdapter.get(`contactSubmissions/${ticketId}`);
      if (!contact) {
        const err = new Error('Support ticket not found.');
        err.status = 404;
        err.code = 'TICKET_NOT_FOUND';
        throw err;
      }
      ticket = {
        id: contact.id,
        ticketNumber: `INQ-${contact.id.slice(-4).toUpperCase()}`,
        userEmail: contact.email,
        userName: contact.name,
        category: 'general_assistance',
        priority: 'normal',
        status: contact.status === 'responded' ? 'resolved' : contact.status === 'in_review' ? 'in_progress' : 'new',
        subject: contact.subject || 'Website Inquiry',
        message: contact.message || '',
        assignedTo: contact.reviewedBy || null,
        replies: contact.adminNotes ? [{ id: 'reply_1', senderRole: 'admin', message: contact.adminNotes, createdAt: contact.reviewedAt }] : [],
        createdAt: contact.createdAt,
      };
    }

    return ticket;
  },

  /**
   * Support Tickets: Update status, priority, or assignment
   */
  updateSupportTicket: async (adminUid, ticketId, { status, priority, assignedTo, adminNotes }) => {
    let ticket = await firebaseRtdbAdapter.get(`supportTickets/${ticketId}`);
    const now = new Date().toISOString();

    if (!ticket) {
      // Convert legacy contact submission to full support ticket if needed
      const contact = await firebaseRtdbAdapter.get(`contactSubmissions/${ticketId}`);
      if (!contact) {
        const err = new Error('Support ticket not found.');
        err.status = 404;
        err.code = 'TICKET_NOT_FOUND';
        throw err;
      }
      ticket = {
        id: ticketId,
        ticketNumber: `TKT-${ticketId.slice(-4).toUpperCase()}`,
        userEmail: contact.email,
        userName: contact.name,
        category: 'general_assistance',
        subject: contact.subject,
        message: contact.message,
        createdAt: contact.createdAt,
        replies: [],
      };
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    if (adminNotes) ticket.adminNotes = adminNotes;
    ticket.updatedAt = now;
    ticket.lastUpdatedBy = adminUid;

    await firebaseRtdbAdapter.set(`supportTickets/${ticketId}`, ticket);

    await auditService.record({
      action: 'SUPPORT_TICKET_UPDATED',
      userId: adminUid,
      details: { ticketId, status, priority, assignedTo },
    });

    return ticket;
  },

  /**
   * Support Tickets: Add reply or internal note
   */
  addSupportReply: async (adminUid, ticketId, { message, isInternal = false }) => {
    let ticket = await firebaseRtdbAdapter.get(`supportTickets/${ticketId}`);
    const now = new Date().toISOString();

    if (!ticket) {
      const contact = await firebaseRtdbAdapter.get(`contactSubmissions/${ticketId}`);
      if (!contact) {
        const err = new Error('Support ticket not found.');
        err.status = 404;
        err.code = 'TICKET_NOT_FOUND';
        throw err;
      }
      ticket = {
        id: ticketId,
        ticketNumber: `TKT-${ticketId.slice(-4).toUpperCase()}`,
        userEmail: contact.email,
        userName: contact.name,
        category: 'general_assistance',
        subject: contact.subject,
        message: contact.message,
        status: 'open',
        createdAt: contact.createdAt,
        replies: [],
      };
    }

    const replies = Array.isArray(ticket.replies) ? [...ticket.replies] : [];
    const newReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderUid: adminUid,
      senderRole: 'admin',
      message: message.trim(),
      isInternal: Boolean(isInternal),
      createdAt: now,
    };

    replies.push(newReply);
    ticket.replies = replies;
    ticket.status = isInternal ? ticket.status : 'waiting_user';
    ticket.updatedAt = now;

    await firebaseRtdbAdapter.set(`supportTickets/${ticketId}`, ticket);

    await auditService.record({
      action: 'SUPPORT_TICKET_REPLIED',
      userId: adminUid,
      details: { ticketId, replyId: newReply.id, isInternal },
    });

    return newReply;
  },

  /**
   * FAQ Moderation: Publish an FAQ
   */
  publishFaq: async (adminUid, { id, question, answer, category = 'General Practice', order = 1, published = true }) => {
    let finalQuestion = question;
    let finalCategory = category;

    if (!finalQuestion && id) {
      const submission = await firebaseRtdbAdapter.get(`faqSubmissions/${id}`);
      if (submission) {
        finalQuestion = submission.question;
        finalCategory = category || submission.category || 'General Practice';
        submission.status = 'published';
        submission.publishedAt = new Date().toISOString();
        await firebaseRtdbAdapter.set(`faqSubmissions/${id}`, submission);
      } else {
        const existingFaq = await firebaseRtdbAdapter.get(`faqs/${id}`);
        if (existingFaq) {
          finalQuestion = existingFaq.question;
          finalCategory = category || existingFaq.category || 'General Practice';
        }
      }
    }

    if (!finalQuestion) {
      finalQuestion = 'General Practice Question';
    }

    const faqId = id || `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const faq = {
      id: faqId,
      question: (finalQuestion || '').trim(),
      answer: (answer || '').trim(),
      category: (finalCategory || 'General Practice').trim(),
      order: Number(order) || 1,
      published: Boolean(published),
      status: published ? 'published' : 'draft',
      publishedBy: adminUid,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`faqs/${faqId}`, faq);

    await auditService.record({
      action: 'FAQ_PUBLISHED',
      userId: adminUid,
      details: { faqId, question: faq.question },
    });

    return faq;
  },

  /**
   * FAQ Moderation: List FAQs
   */
  getAllFaqs: async (category = '') => {
    const all = (await firebaseRtdbAdapter.get('faqs')) || {};
    let list = Object.values(all);

    if (category && category !== 'all') {
      list = list.filter((f) => f.category === category);
    }

    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  /**
   * FAQ Moderation: Update FAQ
   */
  updateFaq: async (adminUid, faqId, updates) => {
    const faq = await firebaseRtdbAdapter.get(`faqs/${faqId}`);
    if (!faq) {
      const err = new Error('FAQ not found.');
      err.status = 404;
      err.code = 'FAQ_NOT_FOUND';
      throw err;
    }

    const now = new Date().toISOString();
    if (updates.question !== undefined) faq.question = updates.question.trim();
    if (updates.answer !== undefined) faq.answer = updates.answer.trim();
    if (updates.category !== undefined) faq.category = updates.category.trim();
    if (updates.order !== undefined) faq.order = Number(updates.order);
    if (updates.published !== undefined) {
      faq.published = Boolean(updates.published);
      faq.status = faq.published ? 'published' : 'draft';
    }
    faq.updatedAt = now;
    faq.updatedBy = adminUid;

    await firebaseRtdbAdapter.set(`faqs/${faqId}`, faq);

    await auditService.record({
      action: 'FAQ_UPDATED',
      userId: adminUid,
      details: { faqId, question: faq.question },
    });

    return faq;
  },

  /**
   * FAQ Moderation: Delete FAQ
   */
  deleteFaq: async (adminUid, faqId) => {
    const faq = await firebaseRtdbAdapter.get(`faqs/${faqId}`);
    if (!faq) {
      const err = new Error('FAQ not found.');
      err.status = 404;
      err.code = 'FAQ_NOT_FOUND';
      throw err;
    }

    await firebaseRtdbAdapter.remove(`faqs/${faqId}`);

    await auditService.record({
      action: 'FAQ_DELETED',
      userId: adminUid,
      details: { faqId, question: faq.question },
    });

    return { success: true, faqId };
  },

  /**
   * FAQ Moderation: Toggle publish state
   */
  toggleFaqPublish: async (adminUid, faqId, published) => {
    const faq = await firebaseRtdbAdapter.get(`faqs/${faqId}`);
    if (!faq) {
      const err = new Error('FAQ not found.');
      err.status = 404;
      err.code = 'FAQ_NOT_FOUND';
      throw err;
    }

    faq.published = Boolean(published);
    faq.status = faq.published ? 'published' : 'draft';
    faq.updatedAt = new Date().toISOString();
    faq.updatedBy = adminUid;

    await firebaseRtdbAdapter.set(`faqs/${faqId}`, faq);

    await auditService.record({
      action: 'FAQ_STATUS_TOGGLED',
      userId: adminUid,
      details: { faqId, published: faq.published },
    });

    return faq;
  },

  /**
   * Public CMS Content: Get managed sections
   */
  getPublicContent: async () => {
    const all = (await firebaseRtdbAdapter.get('publicContent')) || {};
    return all;
  },

  /**
   * Public CMS Content: Update section
   */
  updatePublicContent: async (adminUid, sectionKey, { title, content }) => {
    const now = new Date().toISOString();

    const record = {
      sectionKey,
      title: title || '',
      content,
      updatedAt: now,
      updatedBy: adminUid,
    };

    await firebaseRtdbAdapter.set(`publicContent/${sectionKey}`, record);

    await auditService.record({
      action: 'PUBLIC_CONTENT_UPDATED',
      userId: adminUid,
      details: { sectionKey, title },
    });

    return record;
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
      err.code = 'SUBMISSION_NOT_FOUND';
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
   * Audit Logs: Query operational logs with filter and search
   */
  getAuditLogs: async ({ actorUid = '', action = '', limit = 100 } = {}) => {
    const all = (await firebaseRtdbAdapter.get('auditLogs')) || {};
    let logs = Object.values(all);

    if (actorUid) {
      logs = logs.filter((l) => l.userId === actorUid || l.actorUid === actorUid);
    }

    if (action) {
      logs = logs.filter((l) => l.action === action);
    }

    return logs
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, Number(limit) || 100);
  },

  /**
   * System Health: Diagnostic inspection of all services without leaking secrets
   */
  getSystemHealth: async () => {
    const memoryUsage = process.memoryUsage();
    const rtdbStatus = firebase.getStatus().database;
    const authStatus = firebase.getStatus().auth;
    const workerStatus = jobQueue.getStatus();
    const calendarStatus = googleCalendarAdapter.getStatus();
    const meetStatus = googleMeetAdapter.getStatus();
    const geminiStatus = geminiAdapter.getStatus();
    const assemblyaiStatus = assemblyaiAdapter.getStatus();

    const isAlignmentOk = rtdbStatus.alignmentValid !== false && rtdbStatus.status !== 'PROJECT_MISMATCH';
    const isKeyOk = rtdbStatus.status !== 'INVALID_PRIVATE_KEY';
    const isHealthy = isAlignmentOk && isKeyOk;

    const mapStatus = (configured, operational = true) => {
      if (!configured) return 'NOT_CONFIGURED';
      return operational ? 'HEALTHY' : 'DEGRADED';
    };

    return {
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
      process: {
        nodeVersion: process.version,
        memoryUsageMb: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
      },
      services: {
        backendServer: {
          name: 'Express Backend Core',
          status: 'HEALTHY',
          uptime: `${Math.floor(process.uptime() / 60)} mins`,
        },
        firebaseRtdb: {
          name: 'Firebase Realtime Database',
          status: isAlignmentOk && isKeyOk && rtdbStatus.configured ? 'HEALTHY' : 'DEGRADED',
          mode: rtdbStatus.status,
          alignment: isAlignmentOk ? 'PASS' : 'FAIL',
        },
        firebaseAuth: {
          name: 'Firebase Authentication',
          status: mapStatus(authStatus.configured),
        },
        geminiAi: {
          name: 'Google Gemini Clinical Copilot',
          status: mapStatus(geminiStatus.configured),
        },
        assemblyAi: {
          name: 'AssemblyAI Ambient Transcription',
          status: mapStatus(assemblyaiStatus.configured),
        },
        googleCalendar: {
          name: 'Google Calendar API',
          status: mapStatus(calendarStatus.configured),
        },
        googleMeet: {
          name: 'Google Meet Provisioning',
          status: mapStatus(meetStatus.configured),
        },
        backgroundWorker: {
          name: 'Background Asynchronous Worker',
          status: workerStatus.running ? 'HEALTHY' : 'STANDBY',
        },
      },
      storagePolicy: {
        database: 'Firebase Realtime Database (Text/JSON Only)',
        binaryMediaForbidden: true,
      },
    };
  },

  /**
   * Platform Settings: Retrieve current settings
   */
  getPlatformSettings: async () => {
    const current = (await firebaseRtdbAdapter.get('platformSettings')) || {};

    const defaults = {
      platformName: 'Psyco AI',
      supportEmail: 'support@psyco.ai',
      supportPhone: '+91 (0) 80 4123 4567',
      defaultTimezone: 'Asia/Kolkata',
      defaultAppointmentDuration: 50,
      defaultBufferTime: 10,
      allowPatientRegistration: true,
      allowClinicianRegistration: true,
      requireCredentialVerification: true,
      maintenanceMode: false,
      maintenanceAnnouncement: '',
      updatedAt: new Date().toISOString(),
    };

    return {
      ...defaults,
      ...current,
    };
  },

  /**
   * Platform Settings: Update settings
   */
  updatePlatformSettings: async (adminUid, updates) => {
    const current = await adminService.getPlatformSettings();
    const now = new Date().toISOString();

    const merged = {
      ...current,
      ...updates,
      updatedAt: now,
      updatedBy: adminUid,
    };

    await firebaseRtdbAdapter.set('platformSettings', merged);

    await auditService.record({
      action: 'PLATFORM_SETTINGS_UPDATED',
      userId: adminUid,
      details: { updatedKeys: Object.keys(updates) },
    });

    return merged;
  },
};
