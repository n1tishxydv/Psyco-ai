import crypto from 'crypto';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { INSTRUMENT_DEFINITIONS } from '../constants/assessments.js';
import { assessmentScoringService } from './assessmentScoring.service.js';
import { clinicalService } from './clinical.service.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

export const assessmentService = {
  /**
   * Retrieves the catalog of available, verified psychometric instruments
   */
  getAvailableInstruments: () => {
    return Object.values(INSTRUMENT_DEFINITIONS).map((inst) => ({
      id: inst.id,
      name: inst.name,
      shortName: inst.shortName,
      version: inst.version,
      intendedPopulation: inst.intendedPopulation,
      timeframe: inst.timeframe,
      scoringRange: inst.scoringRange,
      itemCount: inst.items.length,
      disclaimer: inst.disclaimer,
    }));
  },

  /**
   * Retrieves instrument definition with full items and options
   */
  getInstrumentDefinition: (instrumentId) => {
    const inst = INSTRUMENT_DEFINITIONS[instrumentId];
    if (!inst) {
      const err = new Error(`Instrument "${instrumentId}" not found in catalog.`);
      err.status = 404;
      err.code = 'INSTRUMENT_NOT_FOUND';
      throw err;
    }
    return inst;
  },

  /**
   * Assigns an assessment to a verified patient
   */
  assignAssessment: async (psychologistId, userRole, payload) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Only licensed psychologists can assign clinical assessments.');
      err.status = 403;
      err.code = 'PSYCHOLOGIST_ROLE_REQUIRED';
      throw err;
    }

    const { patientId, instrumentId, instructions, dueDate } = payload;
    if (!patientId || !instrumentId) {
      const err = new Error('patientId and instrumentId are mandatory for assignment.');
      err.status = 400;
      throw err;
    }

    // Verify active therapeutic relationship
    await clinicalService.assertTherapeuticRelationship(psychologistId, patientId);

    // Verify instrument exists
    const instrument = assessmentService.getInstrumentDefinition(instrumentId);

    const assignmentId = `asg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const assignmentRecord = {
      id: assignmentId,
      assignmentId,
      patientId,
      psychologistId,
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      instrumentVersion: instrument.version,
      status: 'assigned', // 'assigned' | 'completed' | 'expired' | 'cancelled'
      instructions: instructions || instrument.instructions,
      dueDate: dueDate || null,
      assignedAt: now,
      completedAt: null,
      resultId: null,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`assessmentAssignments/${assignmentId}`, assignmentRecord);

    // Notify patient
    try {
      await notificationService.notify({
        recipientUid: patientId,
        title: `Clinical Assessment Assigned: ${instrument.shortName}`,
        message: `Your psychologist has assigned the ${instrument.name} for your upcoming review.`,
        type: 'assessment_assignment',
        actionUrl: `/assessments/run/${assignmentId}`,
      });
    } catch (notifErr) {
      logger.warn(`Could not dispatch assignment notification: ${notifErr.message}`);
    }

    // Audit log
    await auditService.log({
      action: 'ASSESSMENT_ASSIGNED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: assignmentId,
      details: {
        patientId,
        instrumentId: instrument.id,
        dueDate,
      },
    });

    return assignmentRecord;
  },

  /**
   * Retrieves an assignment by ID with authorization checks
   */
  getAssignment: async (assignmentId, requesterUid, requesterRole) => {
    if (requesterRole === 'admin') {
      const err = new Error('Administrative accounts are barred from accessing patient clinical assessments.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    const assignment = await firebaseRtdbAdapter.get(`assessmentAssignments/${assignmentId}`);
    if (!assignment) {
      const err = new Error('Assessment assignment not found.');
      err.status = 404;
      err.code = 'ASSIGNMENT_NOT_FOUND';
      throw err;
    }

    if (requesterRole === 'patient' && assignment.patientId !== requesterUid) {
      const err = new Error('Access denied. You can only access assessments assigned to you.');
      err.status = 403;
      throw err;
    }

    if (requesterRole === 'psychologist' && assignment.psychologistId !== requesterUid) {
      const err = new Error('Access denied. You did not assign this assessment.');
      err.status = 403;
      throw err;
    }

    // Attach instrument item details so patient can render questionnaire
    const instrument = assessmentService.getInstrumentDefinition(assignment.instrumentId);
    return {
      ...assignment,
      instrument,
    };
  },

  /**
   * Lists assignments for a specific patient
   */
  listPatientAssignments: async (patientId, requesterUid, requesterRole) => {
    if (requesterRole === 'admin') {
      const err = new Error('Administrative accounts are barred from accessing clinical assessments.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    if (requesterRole === 'patient' && patientId !== requesterUid) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }

    if (requesterRole === 'psychologist') {
      await clinicalService.assertTherapeuticRelationship(requesterUid, patientId);
    }

    const allAssignments = (await firebaseRtdbAdapter.get('assessmentAssignments')) || {};
    const patientAssignments = Object.values(allAssignments)
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => (b.assignedAt || '').localeCompare(a.assignedAt || ''));

    return patientAssignments;
  },

  /**
   * Submits patient responses, performs deterministic scoring, and checks safety thresholds
   */
  submitResponses: async (patientId, userRole, assignmentId, responses) => {
    if (userRole !== 'patient') {
      const err = new Error('Only patients can submit their assessment responses.');
      err.status = 403;
      throw err;
    }

    const assignment = await firebaseRtdbAdapter.get(`assessmentAssignments/${assignmentId}`);
    if (!assignment) {
      const err = new Error('Assessment assignment not found.');
      err.status = 404;
      throw err;
    }

    if (assignment.patientId !== patientId) {
      const err = new Error('Access denied. This assignment belongs to a different patient.');
      err.status = 403;
      throw err;
    }

    if (assignment.status === 'completed') {
      const err = new Error('This assessment has already been submitted and finalized.');
      err.status = 409;
      err.code = 'ASSESSMENT_ALREADY_COMPLETED';
      throw err;
    }

    // 1. Perform deterministic scoring & item-level validation
    const scoringResult = assessmentScoringService.calculateScore(assignment.instrumentId, responses);

    const resultId = `res_${assignment.instrumentId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    // 2. Persist result record
    const resultRecord = {
      id: resultId,
      resultId,
      assignmentId,
      patientId,
      psychologistId: assignment.psychologistId,
      instrumentId: assignment.instrumentId,
      instrumentName: assignment.instrumentName,
      instrumentVersion: scoringResult.instrumentVersion,
      responses, // Full item-level responses preserved
      totalScore: scoringResult.totalScore,
      maxScore: scoringResult.maxScore,
      severityCategory: scoringResult.severityCategory,
      severityCode: scoringResult.severityCode,
      triageLevel: scoringResult.triageLevel || null,
      triageLabel: scoringResult.triageLabel || null,
      itemScores: scoringResult.itemScores,
      hasCriticalSafetySignal: Boolean(scoringResult.hasCriticalSafetySignal),
      safetyReviewFlag: scoringResult.safetyReviewFlag || null,
      scoringAlgorithmVersion: scoringResult.scoringAlgorithmVersion,
      reviewStatus: 'pending_review', // 'pending_review' | 'reviewed'
      reviewedBy: null,
      reviewedAt: null,
      clinicalInterpretation: null,
      actionTaken: null,
      notes: null,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`assessmentResults/${resultId}`, resultRecord);

    // 3. Mark assignment completed
    assignment.status = 'completed';
    assignment.completedAt = now;
    assignment.resultId = resultId;
    assignment.updatedAt = now;
    await firebaseRtdbAdapter.set(`assessmentAssignments/${assignmentId}`, assignment);

    // 4. If critical safety signal triggered (e.g. PHQ-9 Q9 or C-SSRS positive), register clinical risk review flag
    if (scoringResult.hasCriticalSafetySignal && scoringResult.safetyReviewFlag) {
      const flagId = `flg_risk_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const riskFlagRecord = {
        id: flagId,
        flagId,
        patientId,
        psychologistId: assignment.psychologistId,
        sourceType: 'assessment',
        sourceRecordId: resultId,
        instrumentId: assignment.instrumentId,
        category: 'suicidal_ideation',
        severity: scoringResult.safetyReviewFlag.severity,
        summary: scoringResult.safetyReviewFlag.summary,
        recommendedAction: scoringResult.safetyReviewFlag.recommendedAction,
        evidenceExcerpt: `Standardized item response: ${JSON.stringify(scoringResult.safetyReviewFlag)}`,
        detectionMethod: 'deterministic_assessment_threshold',
        reviewStatus: 'pending_review', // 'pending_review' | 'acknowledged' | 'dismissed'
        acknowledgedBy: null,
        acknowledgedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await firebaseRtdbAdapter.set(`riskReviewFlags/${flagId}`, riskFlagRecord);

      // Alert psychologist
      try {
        await notificationService.notify({
          recipientUid: assignment.psychologistId,
          title: `CRITICAL CLINICAL REVIEW: ${assignment.instrumentName}`,
          message: `Elevated safety signal detected on ${assignment.instrumentName} for patient ${patientId}. Immediate clinician evaluation requested.`,
          type: 'clinical_risk_alert',
          actionUrl: `/risk-review/${flagId}`,
        });
      } catch (notifErr) {
        logger.warn(`Could not dispatch risk alert notification: ${notifErr.message}`);
      }
    }

    // 5. Audit log
    await auditService.log({
      action: 'ASSESSMENT_COMPLETED',
      userId: patientId,
      userRole: 'patient',
      targetId: resultId,
      details: {
        assignmentId,
        instrumentId: assignment.instrumentId,
        totalScore: scoringResult.totalScore,
        severityCategory: scoringResult.severityCategory,
        hasCriticalSafetySignal: scoringResult.hasCriticalSafetySignal,
      },
    });

    return {
      success: true,
      resultId,
      instrumentId: assignment.instrumentId,
      totalScore: scoringResult.totalScore,
      score: scoringResult.totalScore,
      severityCategory: scoringResult.severityCategory,
      severity: scoringResult.severityCategory,
      safetyTriggered: scoringResult.hasCriticalSafetySignal,
      hasCriticalSafetySignal: scoringResult.hasCriticalSafetySignal,
      submittedAt: now,
      message: 'Assessment completed and securely recorded for your psychologist.',
    };
  },

  /**
   * Retrieves an assessment result record
   */
  getResult: async (resultId, requesterUid, requesterRole) => {
    if (requesterRole === 'admin') {
      const err = new Error('Administrative accounts are barred from accessing clinical assessment results.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    const result = await firebaseRtdbAdapter.get(`assessmentResults/${resultId}`);
    if (!result) {
      const err = new Error('Assessment result not found.');
      err.status = 404;
      err.code = 'RESULT_NOT_FOUND';
      throw err;
    }

    if (requesterRole === 'patient' && result.patientId !== requesterUid) {
      const err = new Error('Access denied. You can only view your own assessment results.');
      err.status = 403;
      throw err;
    }

    if (requesterRole === 'psychologist' && result.psychologistId !== requesterUid) {
      const err = new Error('Access denied. You do not own this patient record.');
      err.status = 403;
      throw err;
    }

    const instrument = assessmentService.getInstrumentDefinition(result.instrumentId);
    return {
      ...result,
      instrument,
    };
  },

  /**
   * Clinician reviews assessment result and enters clinical formulation
   */
  reviewResult: async (resultId, psychologistId, userRole, reviewPayload) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Only licensed psychologists can review clinical assessment results.');
      err.status = 403;
      throw err;
    }

    const result = await firebaseRtdbAdapter.get(`assessmentResults/${resultId}`);
    if (!result) {
      const err = new Error('Assessment result not found.');
      err.status = 404;
      throw err;
    }

    if (result.psychologistId !== psychologistId) {
      const err = new Error('Access denied. You do not have clinical jurisdiction over this assessment.');
      err.status = 403;
      throw err;
    }

    const now = new Date().toISOString();
    result.reviewStatus = 'reviewed';
    result.reviewedBy = psychologistId;
    result.reviewedAt = now;
    result.clinicalInterpretation = reviewPayload.clinicalInterpretation || result.clinicalInterpretation;
    result.actionTaken = reviewPayload.actionTaken || result.actionTaken;
    result.notes = reviewPayload.notes || result.notes;
    result.updatedAt = now;

    await firebaseRtdbAdapter.set(`assessmentResults/${resultId}`, result);

    await auditService.log({
      action: 'ASSESSMENT_REVIEWED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: resultId,
      details: {
        patientId: result.patientId,
        instrumentId: result.instrumentId,
        totalScore: result.totalScore,
      },
    });

    return result;
  },

  /**
   * Retrieves complete chronological assessment history for an authorized patient
   */
  getPatientHistory: async (patientId, requesterUid, requesterRole, instrumentId = null) => {
    if (requesterRole === 'admin') {
      const err = new Error('Administrative accounts are barred from accessing clinical assessment histories.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    if (requesterRole === 'patient' && patientId !== requesterUid) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }

    if (requesterRole === 'psychologist') {
      await clinicalService.assertTherapeuticRelationship(requesterUid, patientId);
    }

    const allResults = (await firebaseRtdbAdapter.get('assessmentResults')) || {};
    let patientResults = Object.values(allResults)
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || '')); // Chronological order

    if (instrumentId) {
      patientResults = patientResults.filter((r) => r.instrumentId === instrumentId);
    }

    return patientResults;
  },
};
