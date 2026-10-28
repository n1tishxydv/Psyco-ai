import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, ROLES } from '../../middleware/authorization.js';
import { validateRequest } from '../../validators/validateRequest.js';
import {
  createAppointmentSchema,
  rejectAppointmentSchema,
  proposeAlternativeSlotSchema,
  respondToAlternativeSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
} from '../../validators/appointment.validators.js';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  acceptAppointment,
  rejectAppointment,
  proposeAlternativeSlot,
  respondToAlternative,
  rescheduleAppointment,
  cancelAppointment,
} from '../../controllers/appointment.controller.js';

const router = Router();

router.use(authenticateToken);

// List and single retrieval
router.get('/', requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST, ROLES.ADMIN), getAppointments);
router.get('/:appointmentId', requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST, ROLES.ADMIN), getAppointmentById);

// Create appointment (Patient booking, Psychologist walk-in, or Admin scheduling)
router.post(
  '/',
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST, ROLES.ADMIN),
  validateRequest(createAppointmentSchema),
  createAppointment
);

// Psychologist & Admin management actions
router.post(
  '/:appointmentId/accept',
  requireRole(ROLES.PSYCHOLOGIST, ROLES.ADMIN),
  acceptAppointment
);

router.post(
  '/:appointmentId/reject',
  requireRole(ROLES.PSYCHOLOGIST, ROLES.ADMIN),
  validateRequest(rejectAppointmentSchema),
  rejectAppointment
);

router.post(
  '/:appointmentId/propose-alternative',
  requireRole(ROLES.PSYCHOLOGIST, ROLES.ADMIN),
  validateRequest(proposeAlternativeSlotSchema),
  proposeAlternativeSlot
);

// Patient & Admin actions
router.post(
  '/:appointmentId/respond-alternative',
  requireRole(ROLES.PATIENT, ROLES.ADMIN),
  validateRequest(respondToAlternativeSchema),
  respondToAlternative
);

// Shared actions (Patient, Psychologist, or Admin with policy checks)
router.post(
  '/:appointmentId/reschedule',
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST, ROLES.ADMIN),
  validateRequest(rescheduleAppointmentSchema),
  rescheduleAppointment
);

router.post(
  '/:appointmentId/cancel',
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST, ROLES.ADMIN),
  validateRequest(cancelAppointmentSchema),
  cancelAppointment
);

export default router;
