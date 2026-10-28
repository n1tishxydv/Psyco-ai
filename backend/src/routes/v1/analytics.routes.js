import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { analyticsController } from '../../controllers/analytics.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(blockAdminFromClinicalRecords());

// Patient Longitudinal Progress
router.get('/patient/:patientId/progress', analyticsController.getPatientProgressAnalytics);

// Practice Wide Metrics (Psychologist only)
router.get('/practice', requireRole(ROLES.PSYCHOLOGIST), analyticsController.getPracticeAnalytics);

export default router;
