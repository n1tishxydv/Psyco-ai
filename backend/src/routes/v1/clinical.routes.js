import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { validateBody } from '../../middleware/validate.js';
import {
  getAssignedPatients,
  getPatientChart,
  createOrGetSession,
  getSessionById,
  startSession,
  completeSession,
  finalizeSession,
  saveNoteDraft,
  finalizeNote,
  amendNote,
  createTreatmentPlan,
  updateTreatmentPlan,
  updatePlanGoal,
  createTask,
  updateTaskStatus,
  createRecommendation,
  createPrescription,
  generateReport,
  getPatientCarePortalData,
} from '../../controllers/clinical.controller.js';
import {
  sessionNoteSchema,
  amendNoteSchema,
  treatmentPlanSchema,
  goalUpdateSchema,
  followUpTaskSchema,
  updateTaskStatusSchema,
  clinicalRecommendationSchema,
  prescriptionRequestSchema,
  generateReportSchema,
} from '../../validators/clinical.validators.js';

const router = Router();

router.use(authenticateToken);

// ==========================================
// PATIENT PORTAL ROUTE (Patient Only)
// ==========================================
router.get(
  '/patient-portal/records',
  requireRole(ROLES.PATIENT),
  getPatientCarePortalData
);

// Patient task status update (e.g. marking homework completed)
router.patch(
  '/tasks/:taskId/status',
  requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST),
  validateBody(updateTaskStatusSchema.body),
  updateTaskStatus
);

// ==========================================
// PSYCHOLOGIST CLINICAL WORKSPACE ROUTES
// (Strictly blocked from administrators)
// ==========================================
router.use(blockAdminFromClinicalRecords());
router.use(requireRole(ROLES.PSYCHOLOGIST));

// Patients & Chart
router.get('/patients', getAssignedPatients);
router.get('/patients/:patientId/chart', getPatientChart);

// Sessions
router.post('/sessions/appointment/:appointmentId', createOrGetSession);
router.get('/sessions/:sessionId', getSessionById);
router.post('/sessions/:sessionId/start', startSession);
router.post('/sessions/:sessionId/complete', completeSession);
router.post('/sessions/:sessionId/finalize', finalizeSession);

// Notes (General, SOAP, DAP, BIRP)
router.post('/notes/draft', validateBody(sessionNoteSchema.body), saveNoteDraft);
router.post('/notes/:noteId/finalize', finalizeNote);
router.post('/notes/:noteId/amend', validateBody(amendNoteSchema.body), amendNote);

// Treatment Plans & Goals
router.post('/treatment-plans', validateBody(treatmentPlanSchema.body), createTreatmentPlan);
router.put('/treatment-plans/:planId', updateTreatmentPlan);
router.patch('/treatment-plans/:planId/goals/:goalId', validateBody(goalUpdateSchema.body), updatePlanGoal);

// Tasks & Homework
router.post('/tasks', validateBody(followUpTaskSchema.body), createTask);

// Recommendations & Prescription Guard
router.post('/recommendations', validateBody(clinicalRecommendationSchema.body), createRecommendation);
router.post('/prescriptions', validateBody(prescriptionRequestSchema.body), createPrescription);

// Reports
router.post('/reports/generate', validateBody(generateReportSchema.body), generateReport);

export default router;
