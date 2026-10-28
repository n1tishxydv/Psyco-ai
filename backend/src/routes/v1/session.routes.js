import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();

// Retrieve session notes (Assigned Psychologist only; Admin blocked)
router.get(
  '/:sessionId/notes',
  authenticateToken,
  blockAdminFromClinicalRecords(),
  requireRole(ROLES.PSYCHOLOGIST),
  (req, res) => {
    return successResponse(res, {
      sessionId: req.params.sessionId,
      message: 'Session notes retrieval scaffolded for Phase 4.',
      notes: null,
    });
  }
);

// Create or update clinical note draft (Psychologist only)
router.post(
  '/:sessionId/notes',
  authenticateToken,
  blockAdminFromClinicalRecords(),
  requireRole(ROLES.PSYCHOLOGIST),
  (req, res) => {
    return successResponse(
      res,
      {
        message: 'Clinical note draft endpoint scaffolded for Phase 4.',
        sessionId: req.params.sessionId,
        isDraft: true,
      },
      201
    );
  }
);

export default router;
