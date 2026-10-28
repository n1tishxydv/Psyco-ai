import { transcriptionService } from '../services/transcription.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getConsentStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await transcriptionService.getConsentStatus(sessionId, req.user.uid);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const recordConsent = async (req, res, next) => {
  try {
    const result = await transcriptionService.recordConsent(req.body, req.user.uid);
    return successResponse(res, { consent: result }, 201);
  } catch (err) {
    next(err);
  }
};

export const withdrawConsent = async (req, res, next) => {
  try {
    const { sessionId, reason } = req.body;
    const result = await transcriptionService.withdrawConsent(sessionId, reason, req.user.uid);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const requestStreamingToken = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const result = await transcriptionService.requestStreamingToken(sessionId, req.user.uid);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const saveTranscriptTurn = async (req, res, next) => {
  try {
    const result = await transcriptionService.saveTranscriptTurn(req.body, req.user.uid);
    return successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const finalizeTranscript = async (req, res, next) => {
  try {
    const result = await transcriptionService.finalizeTranscript(req.body, req.user.uid);
    return successResponse(res, { transcript: result });
  } catch (err) {
    next(err);
  }
};

export const importGoogleMeetTranscript = async (req, res, next) => {
  try {
    const { sessionId, meetingCode } = req.body;
    const result = await transcriptionService.importGoogleMeetTranscript(sessionId, req.user.uid, meetingCode);
    return successResponse(res, { transcript: result }, 200);
  } catch (err) {
    next(err);
  }
};

export const importManualTextTranscript = async (req, res, next) => {
  try {
    const result = await transcriptionService.importManualTextTranscript(req.body, req.user.uid);
    return successResponse(res, { transcript: result }, 201);
  } catch (err) {
    next(err);
  }
};

export const getTranscript = async (req, res, next) => {
  try {
    const { sessionIdOrTranscriptId } = req.params;
    const result = await transcriptionService.getTranscript(sessionIdOrTranscriptId, req.user.uid, req.user.role);
    if (!result) {
      return errorResponse(res, 'Transcript not found for this session.', 404);
    }
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const searchTranscript = async (req, res, next) => {
  try {
    const { transcriptId } = req.params;
    const { q } = req.query;
    const results = await transcriptionService.searchTranscript(transcriptId, q, req.user.uid);
    return successResponse(res, { matches: results });
  } catch (err) {
    next(err);
  }
};

export const correctTranscriptEntry = async (req, res, next) => {
  try {
    const { transcriptId, entryId } = req.params;
    const result = await transcriptionService.correctTranscriptEntry(transcriptId, entryId, req.body, req.user.uid);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const updateReviewStatus = async (req, res, next) => {
  try {
    const { transcriptId } = req.params;
    const { reviewStatus } = req.body;
    const result = await transcriptionService.updateReviewStatus(transcriptId, reviewStatus, req.user.uid);
    return successResponse(res, { transcript: result });
  } catch (err) {
    next(err);
  }
};
