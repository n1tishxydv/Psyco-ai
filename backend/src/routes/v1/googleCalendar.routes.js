import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, ROLES } from '../../middleware/authorization.js';
import {
  getConnectionStatus,
  getAuthUrl,
  handleOAuthCallback,
  disconnect,
} from '../../controllers/googleCalendar.controller.js';

const router = Router();

// Public OAuth callback (Google redirects the user here with ?code=...&state=...)
router.get('/callback', handleOAuthCallback);

// Protected Calendar Endpoints (Accessible to both Patients and Psychologists)
router.get(
  '/status',
  authenticateToken,
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST),
  getConnectionStatus
);

router.get(
  '/auth-url',
  authenticateToken,
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST),
  getAuthUrl
);

router.post(
  '/disconnect',
  authenticateToken,
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST),
  disconnect
);

export default router;
