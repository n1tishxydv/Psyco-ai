import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { aiController } from '../../controllers/ai.controller.js';

const router = Router();

// All AI Copilot endpoints require authentication
router.use(authenticateToken);

// ==========================================
// CLINICAL PRIVACY BARRIER
// Administrators are strictly prohibited from clinical drafts, AI jobs, and transcript text
// ==========================================
router.use(blockAdminFromClinicalRecords());

// Operational status
router.get('/status', requireRole(ROLES.PSYCHOLOGIST), aiController.getStatus);

// Job Lifecycle Endpoints
router.post('/jobs', requireRole(ROLES.PSYCHOLOGIST), aiController.createJob);
router.get('/jobs/:jobId', requireRole(ROLES.PSYCHOLOGIST), aiController.getJob);
router.get('/jobs/session/:sessionId', requireRole(ROLES.PSYCHOLOGIST), aiController.listJobsForSession);
router.post('/jobs/:jobId/retry', requireRole(ROLES.PSYCHOLOGIST), aiController.retryJob);
router.post('/jobs/:jobId/cancel', requireRole(ROLES.PSYCHOLOGIST), aiController.cancelJob);

// Draft Management Endpoints
router.get('/drafts/:draftId', requireRole(ROLES.PSYCHOLOGIST), aiController.getDraft);
router.get('/drafts/session/:sessionId', requireRole(ROLES.PSYCHOLOGIST), aiController.listDraftsForSession);
router.put('/drafts/:draftId', requireRole(ROLES.PSYCHOLOGIST), aiController.updateDraft);
router.post('/drafts/:draftId/reject', requireRole(ROLES.PSYCHOLOGIST), aiController.rejectDraft);
router.post('/drafts/:draftId/approve', requireRole(ROLES.PSYCHOLOGIST), aiController.approveDraft);

export default router;
