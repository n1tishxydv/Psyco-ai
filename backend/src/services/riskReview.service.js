import crypto from 'crypto';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { clinicalService } from './clinical.service.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';

export const riskReviewService = {
  /**
   * Scans an authorized session transcript for potential safety concerns
   * Uses evidence-grounded passage identification.
   */
  scanTranscriptForSafetySignals: async (sessionId, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    const allTranscripts = (await firebaseRtdbAdapter.get('sessionTranscripts')) || {};
    const transcript = Object.values(allTranscripts).find((t) => t.sessionId === sessionId);
    if (!transcript || !transcript.fullText) {
      return { count: 0, flags: [] };
    }

    const text = transcript.fullText;
    const generatedFlags = [];

    // Transparent, deterministic keyword and phrase detection for safety-critical indicators
    // Detects explicit statements of self-harm or suicidal intent in transcript turns
    const safetyPatterns = [
      {
        regex: /(kill myself|end my life|better off dead|want to die|suicide|commit suicide|hang myself|take all my pills)/i,
        category: 'suicidal_ideation',
        severity: 'high_priority',
        summary: 'Explicit verbal statement regarding suicidal thoughts or self-termination in session dialogue.',
        recommendedAction: 'Immediate clinical risk assessment, lethality exploration, and review of safety plan.',
      },
      {
        regex: /(cutting myself|burn myself|hurting myself|self-harm|scratching my arms until)/i,
        category: 'self_harm',
        severity: 'elevated',
        summary: 'Verbal statement referencing active self-injurious behavior.',
        recommendedAction: 'Explore emotional distress tolerance, coping strategies, and physical wound assessment if indicated.',
      },
    ];

    const lines = text.split('\n');
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      // Only inspect patient statements (avoid flagging therapist psychoeducation or questions)
      if (/psychologist|therapist|dr\./i.test(line)) continue;

      for (const pattern of safetyPatterns) {
        if (pattern.regex.test(line)) {
          const flagId = `flg_trx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          const now = new Date().toISOString();

          const flag = {
            id: flagId,
            flagId,
            patientId: session.patientId,
            psychologistId,
            sessionId,
            sourceType: 'transcript',
            sourceRecordId: transcript.id,
            category: pattern.category,
            severity: pattern.severity,
            summary: pattern.summary,
            recommendedAction: pattern.recommendedAction,
            evidenceExcerpt: line.trim(),
            lineReference: idx + 1,
            detectionMethod: 'transparent_rule_pattern',
            reviewStatus: 'pending_review',
            acknowledgedBy: null,
            acknowledgedAt: null,
            createdAt: now,
            updatedAt: now,
          };

          await firebaseRtdbAdapter.set(`riskReviewFlags/${flagId}`, flag);
          generatedFlags.push(flag);
          break; // Avoid duplicate flags on the exact same line
        }
      }
    }

    return {
      count: generatedFlags.length,
      flags: generatedFlags,
    };
  },

  /**
   * Lists risk review flags for psychologist's assigned patients
   */
  listRiskFlags: async (psychologistId, userRole, filters = {}) => {
    if (userRole === 'admin') {
      const err = new Error('Administrative accounts are barred from accessing clinical risk-review data.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    if (userRole !== 'psychologist') {
      const err = new Error('Access denied. Psychologist role required.');
      err.status = 403;
      throw err;
    }

    const allFlags = (await firebaseRtdbAdapter.get('riskReviewFlags')) || {};
    let flags = Object.values(allFlags).filter((f) => f.psychologistId === psychologistId);

    if (filters.patientId) {
      flags = flags.filter((f) => f.patientId === filters.patientId);
    }
    if (filters.status) {
      flags = flags.filter((f) => f.reviewStatus === filters.status);
    }

    return flags.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  /**
   * Acknowledges or dismisses a risk review flag with documented clinician rationale
   */
  acknowledgeRiskFlag: async (flagId, psychologistId, userRole, payload = {}) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Only licensed psychologists can acknowledge clinical risk review items.');
      err.status = 403;
      throw err;
    }

    const flag = await firebaseRtdbAdapter.get(`riskReviewFlags/${flagId}`);
    if (!flag) {
      const err = new Error('Risk review flag not found.');
      err.status = 404;
      throw err;
    }

    if (flag.psychologistId !== psychologistId) {
      const err = new Error('Access denied. You do not own this patient record.');
      err.status = 403;
      throw err;
    }

    const now = new Date().toISOString();
    const isDismissal = Boolean(payload.dismissAsNonApplicable);

    flag.reviewStatus = isDismissal ? 'dismissed' : 'acknowledged';
    flag.acknowledgedBy = psychologistId;
    flag.acknowledgedAt = now;
    flag.actionTaken = payload.actionTaken || (isDismissal ? 'Dismissed as clinically non-applicable' : 'Evaluated in clinical session');
    flag.clinicianNotes = payload.clinicianNotes || '';
    flag.updatedAt = now;

    await firebaseRtdbAdapter.set(`riskReviewFlags/${flagId}`, flag);

    await auditService.log({
      action: isDismissal ? 'CLINICAL_RISK_FLAG_DISMISSED' : 'CLINICAL_RISK_FLAG_ACKNOWLEDGED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: flagId,
      details: {
        patientId: flag.patientId,
        category: flag.category,
        actionTaken: flag.actionTaken,
      },
    });

    return flag;
  },

  /**
   * Enforces mandatory psychologist review before recording a clinical action.
   * Rejects if unreviewed risk flags exist for the session.
   */
  executeClinicalAction: async (sessionId, psychologistId, userRole, payload = {}) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Only licensed psychologists can execute clinical care actions.');
      err.status = 403;
      throw err;
    }

    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    // Check for any unreviewed risk flags for this session
    const allFlags = (await firebaseRtdbAdapter.get('riskReviewFlags')) || {};
    const unreviewedFlags = Object.values(allFlags).filter(
      (f) => f.sessionId === sessionId && f.reviewStatus === 'pending_review'
    );

    if (unreviewedFlags.length > 0) {
      const err = new Error(
        `Cannot execute clinical action: ${unreviewedFlags.length} unreviewed risk-review flag(s) exist for this session. A licensed psychologist must review and acknowledge all active safety flags before proceeding.`
      );
      err.status = 412; // Precondition Failed
      err.code = 'UNREVIEWED_RISK_FLAGS_EXIST';
      err.unreviewedFlagIds = unreviewedFlags.map((f) => f.id);
      throw err;
    }

    const actionId = `act_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const actionRecord = {
      id: actionId,
      actionId,
      sessionId,
      patientId: session.patientId,
      psychologistId,
      actionType: payload.actionType || 'session_safety_plan_finalized',
      clinicalNotes: payload.clinicalNotes || 'Clinical care action authorized following full evidence review.',
      status: 'executed',
      executedAt: now,
      createdAt: now,
    };

    await firebaseRtdbAdapter.set(`clinicalActions/${actionId}`, actionRecord);

    await auditService.log({
      action: 'CLINICAL_ACTION_RECORDED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: actionId,
      details: {
        sessionId,
        patientId: session.patientId,
        actionType: actionRecord.actionType,
      },
    });

    return actionRecord;
  },
};

