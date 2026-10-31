import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { adminService } from '../services/admin.service.js';

// Dashboard Overview Telemetry
export async function getDashboardMetrics(req, res, next) {
  try {
    const data = await adminService.getDashboardMetrics();
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}

// User Governance
export async function getUserDirectory(req, res, next) {
  try {
    const { search = '', role = '', status = '' } = req.query;
    const users = await adminService.getUserDirectory(search, role, status);
    return successResponse(res, { users });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { targetUid } = req.params;
    const user = await adminService.updateUserStatus(adminUid, targetUid, req.body);
    return successResponse(res, {
      message: `User status updated to ${user.accountStatus}.`,
      user,
      accountStatus: user.accountStatus,
      status: user.status,
    });
  } catch (err) {
    next(err);
  }
}

// Clinician Credential Verification
export async function getPsychologistRegistrations(req, res, next) {
  try {
    const { status = '', search = '' } = req.query;
    const registrations = await adminService.getPsychologistRegistrations(status, search);
    return successResponse(res, registrations);
  } catch (err) {
    next(err);
  }
}

export async function reviewPsychologist(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { psychologistUid } = req.params;
    const result = await adminService.reviewPsychologist(adminUid, psychologistUid, req.body);
    return successResponse(res, {
      message: `Psychologist status successfully updated to ${result.approvalStatus}.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

// Clinic Management
export async function getClinics(req, res, next) {
  try {
    const { status = '', search = '' } = req.query;
    const clinics = await adminService.getClinics(status, search);
    return successResponse(res, { clinics });
  } catch (err) {
    next(err);
  }
}

export async function createClinic(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const clinic = await adminService.createClinic(adminUid, req.body);
    return successResponse(res, { clinic, message: 'Clinic organization registered successfully.' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateClinicStatus(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { clinicId } = req.params;
    const clinic = await adminService.updateClinicStatus(adminUid, clinicId, req.body);
    return successResponse(res, { clinic, message: `Clinic status updated to ${clinic.status}.` });
  } catch (err) {
    next(err);
  }
}

export async function getClinicMemberships(req, res, next) {
  try {
    const { clinicId = '' } = req.query;
    const memberships = await adminService.getClinicMemberships(clinicId);
    return successResponse(res, { memberships });
  } catch (err) {
    next(err);
  }
}

export async function reviewClinicMembership(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { membershipId } = req.params;
    const membership = await adminService.reviewClinicMembership(adminUid, membershipId, req.body);
    return successResponse(res, { membership, message: `Membership status set to ${membership.status}.` });
  } catch (err) {
    next(err);
  }
}

// Independent Practice Oversight
export async function getIndependentPractices(req, res, next) {
  try {
    const { status = '', search = '' } = req.query;
    const practices = await adminService.getIndependentPractices(status, search);
    return successResponse(res, { practices });
  } catch (err) {
    next(err);
  }
}

export async function updatePracticeStatus(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { practiceId } = req.params;
    const practice = await adminService.updatePracticeStatus(adminUid, practiceId, req.body);
    return successResponse(res, { practice, message: `Practice status set to ${practice.status}.` });
  } catch (err) {
    next(err);
  }
}

// Support Tickets & Inquiries
export async function getSupportTickets(req, res, next) {
  try {
    const tickets = await adminService.getSupportTickets(req.query);
    return successResponse(res, { tickets });
  } catch (err) {
    next(err);
  }
}

export async function getSupportTicketDetails(req, res, next) {
  try {
    const { ticketId } = req.params;
    const ticket = await adminService.getSupportTicketDetails(ticketId);
    return successResponse(res, { ticket });
  } catch (err) {
    next(err);
  }
}

export async function updateSupportTicket(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { ticketId } = req.params;
    const ticket = await adminService.updateSupportTicket(adminUid, ticketId, req.body);
    return successResponse(res, { ticket, message: 'Support ticket updated.' });
  } catch (err) {
    next(err);
  }
}

export async function addSupportReply(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { ticketId } = req.params;
    const reply = await adminService.addSupportReply(adminUid, ticketId, req.body);
    return successResponse(res, { reply, message: 'Reply sent successfully.' }, 201);
  } catch (err) {
    next(err);
  }
}

// FAQ Moderation
export async function getAllFaqs(req, res, next) {
  try {
    const { category = '' } = req.query;
    const faqs = await adminService.getAllFaqs(category);
    return successResponse(res, { faqs });
  } catch (err) {
    next(err);
  }
}

export async function publishFaq(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { faqId } = req.params;
    const payload = { ...req.body, id: faqId || req.body.id };
    const faq = await adminService.publishFaq(adminUid, payload);
    return successResponse(res, { faq, ...faq, message: 'FAQ published successfully.' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateFaq(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { faqId } = req.params;
    const faq = await adminService.updateFaq(adminUid, faqId, req.body);
    return successResponse(res, { faq, message: 'FAQ updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteFaq(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { faqId } = req.params;
    const result = await adminService.deleteFaq(adminUid, faqId);
    return successResponse(res, { ...result, message: 'FAQ removed successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function toggleFaqPublish(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { faqId } = req.params;
    const { published } = req.body;
    const faq = await adminService.toggleFaqPublish(adminUid, faqId, published);
    return successResponse(res, { faq, message: `FAQ publication status set to ${published}.` });
  } catch (err) {
    next(err);
  }
}

// Public Content CMS
export async function getPublicContent(req, res, next) {
  try {
    const content = await adminService.getPublicContent();
    return successResponse(res, { content });
  } catch (err) {
    next(err);
  }
}

export async function updatePublicContent(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { sectionKey } = req.params;
    const updated = await adminService.updatePublicContent(adminUid, sectionKey, req.body);
    return successResponse(res, { content: updated, message: `Section '${sectionKey}' updated.` });
  } catch (err) {
    next(err);
  }
}

// Legacy Contact Submissions
export async function getContactSubmissions(req, res, next) {
  try {
    const submissions = await adminService.getContactSubmissions();
    return successResponse(res, { submissions });
  } catch (err) {
    next(err);
  }
}

export async function updateContactStatus(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const { contactId } = req.params;
    const contact = await adminService.updateContactStatus(adminUid, contactId, req.body);
    return successResponse(res, { contact, message: 'Contact submission status updated.' });
  } catch (err) {
    next(err);
  }
}

// Compliance Audit Logs
export async function getAuditLogs(req, res, next) {
  try {
    const logs = await adminService.getAuditLogs(req.query);
    return successResponse(res, logs);
  } catch (err) {
    next(err);
  }
}

// System Health Telemetry
export async function getSystemHealth(req, res, next) {
  try {
    const health = await adminService.getSystemHealth();
    return successResponse(res, health);
  } catch (err) {
    next(err);
  }
}

// Platform Settings
export async function getPlatformSettings(req, res, next) {
  try {
    const settings = await adminService.getPlatformSettings();
    return successResponse(res, { settings });
  } catch (err) {
    next(err);
  }
}

export async function updatePlatformSettings(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const settings = await adminService.updatePlatformSettings(adminUid, req.body);
    return successResponse(res, { settings, message: 'Platform settings updated successfully.' });
  } catch (err) {
    next(err);
  }
}
