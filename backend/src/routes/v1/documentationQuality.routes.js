import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { documentationQualityController } from '../../controllers/documentationQuality.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(blockAdminFromClinicalRecords());

// Only psychologists access clinical documentation completeness audits
router.use(requireRole(ROLES.PSYCHOLOGIST));

router.post('/scan', documentationQualityController.scanDocumentation);
router.get('/findings', documentationQualityController.listFindings);
router.post('/findings/:findingId/resolve', documentationQualityController.resolveFinding);

export default router;
