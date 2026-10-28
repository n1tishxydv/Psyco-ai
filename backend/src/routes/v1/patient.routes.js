import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, requirePatientOwnership, ROLES } from '../../middleware/authorization.js';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();

// Retrieve patient profile (Self or assigned psychologist)
router.get(
  '/:patientId',
  authenticateToken,
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST),
  requirePatientOwnership('patientId'),
  (req, res) => {
    return successResponse(res, {
      patientId: req.params.patientId,
      status: 'Endpoint scaffolded for Phase 2 (Profiles & Intake).',
    });
  }
);

// Submit intake questionnaire (Patient only)
router.post(
  '/:patientId/intake',
  authenticateToken,
  requireRole(ROLES.PATIENT),
  requirePatientOwnership('patientId'),
  (req, res) => {
    return successResponse(
      res,
      {
        message: 'Intake submission endpoint scaffolded for Phase 2.',
        patientId: req.params.patientId,
        status: 'submitted',
      },
      201
    );
  }
);

export default router;
