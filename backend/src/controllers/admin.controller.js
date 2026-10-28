import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { adminService } from '../services/admin.service.js';

export async function getDashboardMetrics(req, res, next) {
  try {
    const data = await adminService.getDashboardMetrics();
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getPsychologistRegistrations(req, res, next) {
  try {
    const registrations = await adminService.getPsychologistRegistrations();
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
      message: `Psychologist status successfully updated to ${result.status}.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserDirectory(req, res, next) {
  try {
    const { search = '', role = '' } = req.query;
    const users = await adminService.getUserDirectory(search, role);
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

export async function publishFaq(req, res, next) {
  try {
    const adminUid = req.user.uid;
    const faq = await adminService.publishFaq(adminUid, req.body);
    return successResponse(res, { faq, ...faq, message: 'FAQ published successfully.' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getAllFaqs(req, res, next) {
  try {
    const faqs = await adminService.getAllFaqs();
    return successResponse(res, { faqs });
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

export async function getAuditLogs(req, res, next) {
  try {
    const logs = await adminService.getAuditLogs();
    return successResponse(res, logs);
  } catch (err) {
    next(err);
  }
}
