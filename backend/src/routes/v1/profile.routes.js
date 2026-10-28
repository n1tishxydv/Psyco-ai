import { Router } from 'express';
import {
  getMe,
  onboardPatient,
  onboardPsychologist,
  updatePatientProfile,
  updatePsychologistProfile,
  getPreferences,
  updatePreferences,
  deleteAccount,
} from '../../controllers/profile.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, ROLES } from '../../middleware/authorization.js';
import { validateRequest } from '../../validators/validateRequest.js';
import {
  patientOnboardingSchema,
  psychologistOnboardingSchema,
  updatePatientProfileSchema,
  updatePsychologistProfileSchema,
  updatePreferencesSchema,
  accountDeletionSchema,
} from '../../validators/profile.validators.js';

const router = Router();

// Current user profile and status (any authenticated user)
router.get('/me', authenticateToken, getMe);

// Onboarding endpoints
router.post('/onboard/patient', authenticateToken, validateRequest(patientOnboardingSchema), onboardPatient);
router.post('/onboard/psychologist', authenticateToken, validateRequest(psychologistOnboardingSchema), onboardPsychologist);

// Profile updates
router.put(
  '/patient',
  authenticateToken,
  requireRole(ROLES.PATIENT),
  validateRequest(updatePatientProfileSchema),
  updatePatientProfile
);

router.put(
  '/psychologist',
  authenticateToken,
  requireRole(ROLES.PSYCHOLOGIST),
  validateRequest(updatePsychologistProfileSchema),
  updatePsychologistProfile
);

// User preferences
router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', authenticateToken, validateRequest(updatePreferencesSchema), updatePreferences);

// Account deletion / deactivation
router.post('/delete-account', authenticateToken, validateRequest(accountDeletionSchema), deleteAccount);

export default router;
