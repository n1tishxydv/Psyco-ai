import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { clinicalService } from '../services/clinical.service.js';

// ==========================================
// PATIENT DIRECTORY & CHART
// ==========================================

export async function getAssignedPatients(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const search = req.query.search || '';
    const patients = await clinicalService.getAssignedPatients(psychologistId, search);
    return successResponse(res, { patients });
  } catch (err) {
    next(err);
  }
}

export async function getPatientChart(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { patientId } = req.params;
    const chart = await clinicalService.getPatientChart(psychologistId, patientId);
    return successResponse(res, { chart });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// SESSIONS
// ==========================================

export async function createOrGetSession(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { appointmentId } = req.params;
    const session = await clinicalService.createOrGetSession(appointmentId, psychologistId);
    return successResponse(res, { session });
  } catch (err) {
    next(err);
  }
}

export async function getSessionById(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { sessionId } = req.params;
    const session = await clinicalService.getSessionById(sessionId, psychologistId);
    return successResponse(res, { session });
  } catch (err) {
    next(err);
  }
}

export async function startSession(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { sessionId } = req.params;
    const session = await clinicalService.startSession(sessionId, psychologistId);
    return successResponse(res, { session, message: 'Clinical session is now in progress.' });
  } catch (err) {
    next(err);
  }
}

export async function completeSession(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { sessionId } = req.params;
    const session = await clinicalService.completeSession(sessionId, psychologistId);
    return successResponse(res, { session, message: 'Session concluded. Ready for documentation review.' });
  } catch (err) {
    next(err);
  }
}

export async function finalizeSession(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { sessionId } = req.params;
    const session = await clinicalService.finalizeSession(sessionId, psychologistId);
    return successResponse(res, { session, message: 'Session locked and finalized.' });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// CLINICAL NOTES
// ==========================================

export async function saveNoteDraft(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const note = await clinicalService.saveNoteDraft(psychologistId, req.body);
    return successResponse(res, { note, message: 'Clinical note draft saved.' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function finalizeNote(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { noteId } = req.params;
    const note = await clinicalService.finalizeNote(noteId, psychologistId);
    return successResponse(res, { note, message: 'Clinical note signed and finalized.' });
  } catch (err) {
    next(err);
  }
}

export async function amendNote(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { noteId } = req.params;
    const note = await clinicalService.amendNote(noteId, psychologistId, req.body);
    return successResponse(res, { note, message: 'Clinical note amended. Previous version preserved.' });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// TREATMENT PLANS
// ==========================================

export async function createTreatmentPlan(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const plan = await clinicalService.createTreatmentPlan(psychologistId, req.body);
    return successResponse(res, { plan, message: 'Treatment plan created.' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTreatmentPlan(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { planId } = req.params;
    const plan = await clinicalService.updateTreatmentPlan(planId, psychologistId, req.body);
    return successResponse(res, { plan, message: 'Treatment plan updated.' });
  } catch (err) {
    next(err);
  }
}

export async function updatePlanGoal(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { planId, goalId } = req.params;
    const plan = await clinicalService.updatePlanGoal(planId, goalId, psychologistId, req.body);
    return successResponse(res, { plan, message: 'Goal updated.' });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// HOMEWORK & TASKS
// ==========================================

export async function createTask(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const task = await clinicalService.createTask(psychologistId, req.body);
    return successResponse(res, { task, message: 'Task assigned.' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role;
    const { taskId } = req.params;
    const task = await clinicalService.updateTaskStatus(taskId, userId, userRole, req.body);
    return successResponse(res, { task, message: 'Task status updated.' });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// RECOMMENDATIONS & PRESCRIPTION GUARD
// ==========================================

export async function createRecommendation(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const recommendation = await clinicalService.createRecommendation(psychologistId, req.body);
    return successResponse(res, { recommendation, message: 'Recommendation recorded.' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function createPrescription(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const prescription = await clinicalService.createPrescriptionRecord(psychologistId, req.body);
    return successResponse(res, { prescription, message: 'Prescription recorded.' }, 201);
  } catch (err) {
    next(err);
  }
}

// ==========================================
// REPORTS
// ==========================================

export async function generateReport(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const report = await clinicalService.generateReport(psychologistId, req.body);
    return successResponse(res, { report, message: 'Report generated successfully.' }, 201);
  } catch (err) {
    next(err);
  }
}

// ==========================================
// PATIENT PORTAL RECORDS
// ==========================================

export async function getPatientCarePortalData(req, res, next) {
  try {
    const patientId = req.user.uid;
    const data = await clinicalService.getPatientCarePortalData(patientId);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}
