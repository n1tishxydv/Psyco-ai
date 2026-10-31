import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import {
  requireRole,
  blockAdminFromClinicalRecords,
  requireVerifiedPsychologist,
  ROLES,
} from '../../middleware/authorization.js';
import { assessmentController } from '../../controllers/assessment.controller.js';

const router = Router();

router.use(authenticateToken);
router.use(blockAdminFromClinicalRecords());

// Public within authenticated users (catalog)
router.get('/instruments', assessmentController.getInstruments);
router.get('/instruments/:instrumentId', assessmentController.getInstrument);

// Assignment & Submissions
router.post(
  '/assign',
  requireRole(ROLES.PSYCHOLOGIST),
  requireVerifiedPsychologist(),
  assessmentController.assignAssessment
);
router.post(
  '/assignments',
  requireRole(ROLES.PSYCHOLOGIST),
  requireVerifiedPsychologist(),
  assessmentController.assignAssessment
);
router.get('/assignments/:assignmentId', assessmentController.getAssignment);
router.get('/patient/:patientId/assignments', assessmentController.listPatientAssignments);
router.post('/assignments/:assignmentId/submit', requireRole(ROLES.PATIENT), assessmentController.submitResponses);

// Results & Review
router.get('/results/:resultId', assessmentController.getResult);
router.post(
  '/results/:resultId/review',
  requireRole(ROLES.PSYCHOLOGIST),
  requireVerifiedPsychologist(),
  assessmentController.reviewResult
);
router.get('/patient/:patientId/history', assessmentController.getPatientHistory);

export default router;
