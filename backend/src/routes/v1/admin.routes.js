import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, ROLES } from '../../middleware/authorization.js';
import { validateBody } from '../../middleware/validate.js';
import {
  getDashboardMetrics,
  getPsychologistRegistrations,
  reviewPsychologist,
  getUserDirectory,
  updateUserStatus,
  getClinics,
  createClinic,
  updateClinicStatus,
  getClinicMemberships,
  reviewClinicMembership,
  getIndependentPractices,
  updatePracticeStatus,
  getSupportTickets,
  getSupportTicketDetails,
  updateSupportTicket,
  addSupportReply,
  publishFaq,
  getAllFaqs,
  updateFaq,
  deleteFaq,
  toggleFaqPublish,
  getPublicContent,
  updatePublicContent,
  getContactSubmissions,
  updateContactStatus,
  getAuditLogs,
  getSystemHealth,
  getPlatformSettings,
  updatePlatformSettings,
} from '../../controllers/admin.controller.js';
import {
  psychologistApprovalSchema,
  updateUserStatusSchema,
  publishFaqSchema,
  updateFaqSchema,
  updateContactStatusSchema,
  createClinicSchema,
  updateClinicStatusSchema,
  reviewClinicMembershipSchema,
  updatePracticeStatusSchema,
  updateSupportTicketSchema,
  addSupportReplySchema,
  updatePublicContentSchema,
  updatePlatformSettingsSchema,
} from '../../validators/admin.validators.js';

const router = Router();

// Enforce strict administrative authentication and role check across all endpoints
router.use(authenticateToken);
router.use(requireRole(ROLES.ADMIN));

// Operational Dashboard Metrics
router.get('/metrics', getDashboardMetrics);

// Psychologist Approvals & Credential Review
router.get('/psychologists', getPsychologistRegistrations);
router.post(
  '/psychologists/:psychologistUid/review',
  validateBody(psychologistApprovalSchema.body),
  reviewPsychologist
);
router.post(
  '/psychologists/:psychologistUid/approve',
  (req, res, next) => {
    req.body = { status: 'approved' };
    return reviewPsychologist(req, res, next);
  }
);

// User Directory & Account Governance
router.get('/users', getUserDirectory);
router.patch(
  '/users/:targetUid/status',
  validateBody(updateUserStatusSchema.body),
  updateUserStatus
);

// Clinic Management
router.get('/clinics', getClinics);
router.post('/clinics', validateBody(createClinicSchema.body), createClinic);
router.patch(
  '/clinics/:clinicId/status',
  validateBody(updateClinicStatusSchema.body),
  updateClinicStatus
);
router.get('/clinics/memberships', getClinicMemberships);
router.patch(
  '/clinics/memberships/:membershipId',
  validateBody(reviewClinicMembershipSchema.body),
  reviewClinicMembership
);

// Independent Practice Oversight
router.get('/practices', getIndependentPractices);
router.patch(
  '/practices/:practiceId/status',
  validateBody(updatePracticeStatusSchema.body),
  updatePracticeStatus
);

// Support Ticket Management
router.get('/support/tickets', getSupportTickets);
router.get('/support/tickets/:ticketId', getSupportTicketDetails);
router.patch(
  '/support/tickets/:ticketId',
  validateBody(updateSupportTicketSchema.body),
  updateSupportTicket
);
router.post(
  '/support/tickets/:ticketId/replies',
  validateBody(addSupportReplySchema.body),
  addSupportReply
);

// Legacy Contact Submissions
router.get('/contact-submissions', getContactSubmissions);
router.patch(
  '/contact-submissions/:contactId',
  validateBody(updateContactStatusSchema.body),
  updateContactStatus
);

// FAQ Moderation & Publishing
router.get('/faqs', getAllFaqs);
router.post('/faqs', validateBody(publishFaqSchema.body), publishFaq);
router.put('/faqs/:faqId', validateBody(updateFaqSchema.body), updateFaq);
router.delete('/faqs/:faqId', deleteFaq);
router.post('/faqs/:faqId/publish', (req, res, next) => {
  return publishFaq(req, res, next);
});
router.patch('/faqs/:faqId/publish', toggleFaqPublish);

// Public CMS Content
router.get('/content', getPublicContent);
router.put(
  '/content/:sectionKey',
  validateBody(updatePublicContentSchema.body),
  updatePublicContent
);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// System Health & Monitoring
router.get('/system-health', getSystemHealth);

// Platform Operational Settings
router.get('/settings', getPlatformSettings);
router.put(
  '/settings',
  validateBody(updatePlatformSettingsSchema.body),
  updatePlatformSettings
);

export default router;
