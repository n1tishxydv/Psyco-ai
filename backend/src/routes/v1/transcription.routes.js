import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, blockAdminFromClinicalRecords, ROLES } from '../../middleware/authorization.js';
import { validateBody } from '../../middleware/validate.js';
import {
  getConsentStatus,
  recordConsent,
  withdrawConsent,
  requestStreamingToken,
  saveTranscriptTurn,
  finalizeTranscript,
  importGoogleMeetTranscript,
  importManualTextTranscript,
  getTranscript,
  searchTranscript,
  correctTranscriptEntry,
  updateReviewStatus,
} from '../../controllers/transcription.controller.js';
import {
  requestTokenSchema,
  consentRecordSchema,
  consentWithdrawalSchema,
  saveTranscriptTurnSchema,
  finalizeTranscriptSchema,
  meetImportSchema,
  manualImportSchema,
  correctEntrySchema,
  updateReviewStatusSchema,
} from '../../validators/transcription.validators.js';

const router = Router();

// All transcription routes require authentication
router.use(authenticateToken);

// ==========================================
// CLINICAL PRIVACY BARRIER
// (Administrators are strictly prohibited from clinical psychotherapy transcripts)
// ==========================================
router.use(blockAdminFromClinicalRecords());

// ==========================================
// 1. TRANSCRIPT RETRIEVAL (Patient & Psychologist)
// ==========================================
router.get(
  '/sessions/:sessionIdOrTranscriptId',
  requireRole(ROLES.PSYCHOLOGIST, ROLES.PATIENT),
  getTranscript
);

// ==========================================
// 2. PSYCHOLOGIST TRANSCRIPTION WORKSPACE
// ==========================================
router.use(requireRole(ROLES.PSYCHOLOGIST));

// Consent Workflow
router.get('/consent/:sessionId', getConsentStatus);
router.post('/consent', validateBody(consentRecordSchema.body), recordConsent);
router.post('/consent/withdraw', validateBody(consentWithdrawalSchema.body), withdrawConsent);

// In-Person Streaming & Turn Ingestion
router.post('/token', validateBody(requestTokenSchema.body), requestStreamingToken);
router.post('/turns', validateBody(saveTranscriptTurnSchema.body), saveTranscriptTurn);
router.post('/finalize', validateBody(finalizeTranscriptSchema.body), finalizeTranscript);

// Online Google Meet Import
router.post('/google-meet/import', validateBody(meetImportSchema.body), importGoogleMeetTranscript);

// Manual Text Import Fallback
router.post('/manual-import', validateBody(manualImportSchema.body), importManualTextTranscript);

// Search, Inline Corrections & Review Status
router.get('/:transcriptId/search', searchTranscript);
router.patch(
  '/:transcriptId/entries/:entryId',
  validateBody(correctEntrySchema.body),
  correctTranscriptEntry
);
router.patch(
  '/:transcriptId/review-status',
  validateBody(updateReviewStatusSchema.body),
  updateReviewStatus
);

export default router;
