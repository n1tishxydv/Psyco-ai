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
  publishFaq,
  getAllFaqs,
  toggleFaqPublish,
  getContactSubmissions,
  updateContactStatus,
  getAuditLogs,
} from '../../controllers/admin.controller.js';
import {
  psychologistApprovalSchema,
  updateUserStatusSchema,
  publishFaqSchema,
  updateContactStatusSchema,
} from '../../validators/admin.validators.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(ROLES.ADMIN));

// Operational Dashboard Metrics
router.get('/metrics', getDashboardMetrics);

// Psychologist Approvals
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

// User Directory & Account Status
router.get('/users', getUserDirectory);
router.patch(
  '/users/:targetUid/status',
  validateBody(updateUserStatusSchema.body),
  updateUserStatus
);

// FAQ Moderation
router.get('/faqs', getAllFaqs);
router.post('/faqs', validateBody(publishFaqSchema.body), publishFaq);
router.post('/faqs/:faqId/publish', (req, res, next) => {
  return publishFaq(req, res, next);
});
router.patch('/faqs/:faqId/publish', toggleFaqPublish);

// Contact Submissions Inbox
router.get('/contact-submissions', getContactSubmissions);
router.patch(
  '/contact-submissions/:contactId',
  validateBody(updateContactStatusSchema.body),
  updateContactStatus
);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
