import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { riskReviewController } from '../../controllers/riskReview.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(blockAdminFromClinicalRecords());

// Only psychologists have jurisdiction over clinical risk reviews
router.use(requireRole(ROLES.PSYCHOLOGIST));

router.post('/scan/session/:sessionId', riskReviewController.scanTranscript);
router.get('/flags', riskReviewController.listFlags);
router.post('/flags/:flagId/acknowledge', riskReviewController.acknowledgeFlag);
router.post('/session/:sessionId/clinical-action', riskReviewController.executeAction);

export default router;
