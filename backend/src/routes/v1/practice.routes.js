import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { validateBody } from '../../middleware/validate.js';
import {
  getPracticeWorkspace,
  updatePracticeSettings,
  addLocation,
  deleteLocation,
  getClinics,
  requestAffiliation,
  switchContext,
} from '../../controllers/practice.controller.js';
import {
  updatePracticeSettingsSchema,
  addLocationSchema,
  requestAffiliationSchema,
  switchContextSchema,
} from '../../validators/practice.validators.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(ROLES.PSYCHOLOGIST));

// Practice Workspace & Settings
router.get('/mine', getPracticeWorkspace);
router.put('/mine', validateBody(updatePracticeSettingsSchema.body), updatePracticeSettings);

// Location Management (Optional for online-only clinicians, multi-location supported)
router.post('/locations', validateBody(addLocationSchema.body), addLocation);
router.delete('/locations/:locationId', deleteLocation);

// Clinic Affiliation & Discovery
router.get('/clinics', getClinics);
router.post('/affiliations/request', validateBody(requestAffiliationSchema.body), requestAffiliation);

// Hybrid Practice Context Switcher
router.post('/switch-context', validateBody(switchContextSchema.body), switchContext);

export default router;
