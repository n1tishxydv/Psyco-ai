import { Router } from 'express';
import {
  getIntake,
  saveDraftIntake,
  submitIntake,
  getPsychologistTemplate,
  updatePsychologistTemplate,
} from '../../controllers/intake.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import {
  requireRole,
  blockAdminFromClinicalRecords,
  requireVerifiedPsychologist,
  ROLES,
} from '../../middleware/authorization.js';
import { validateRequest } from '../../validators/validateRequest.js';
import { saveDraftIntakeSchema, submitIntakeSchema } from '../../validators/intake.validators.js';
import { intakeTemplateSchema } from '../../validators/template.validators.js';

const router = Router();

// Patient intake endpoints
router.get(
  '/my-intake',
  authenticateToken,
  blockAdminFromClinicalRecords(),
  requireRole(ROLES.PATIENT),
  getIntake
);
router.post(
  '/draft',
  authenticateToken,
  blockAdminFromClinicalRecords(),
  requireRole(ROLES.PATIENT),
  validateRequest(saveDraftIntakeSchema),
  saveDraftIntake
);
router.post(
  '/submit',
  authenticateToken,
  blockAdminFromClinicalRecords(),
  requireRole(ROLES.PATIENT),
  validateRequest(submitIntakeSchema),
  submitIntake
);

// Psychologist viewing patient intake
router.get(
  '/patient/:patientId',
  authenticateToken,
  blockAdminFromClinicalRecords(),
  requireRole(ROLES.PSYCHOLOGIST),
  requireVerifiedPsychologist(),
  getIntake
);

// Psychologist template management
router.get(
  '/template',
  authenticateToken,
  requireRole(ROLES.PSYCHOLOGIST),
  getPsychologistTemplate
);
router.get(
  '/template/:psychologistId',
  authenticateToken,
  getPsychologistTemplate
);
router.put(
  '/template',
  authenticateToken,
  requireRole(ROLES.PSYCHOLOGIST),
  validateRequest(intakeTemplateSchema),
  updatePsychologistTemplate
);

export default router;
