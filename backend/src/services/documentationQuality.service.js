import crypto from 'crypto';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { clinicalService } from './clinical.service.js';
import { auditService } from './audit.service.js';

export const documentationQualityService = {
  /**
   * Deterministically scans clinician's patient records for documentation completeness gaps
   */
  scanPracticeDocumentation: async (psychologistId, userRole) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Access denied. Psychologist role required.');
      err.status = 403;
      throw err;
    }

    const assignedPatients = await clinicalService.getAssignedPatients(psychologistId);
    const patientIds = new Set(assignedPatients.map((p) => p.id));
    const now = new Date();
    const findings = [];

    // 1. Check Sessions: completed sessions missing finalized clinical notes
    const allSessions = (await firebaseRtdbAdapter.get('sessionRecords')) || {};
    const psychSessions = Object.values(allSessions).filter(
      (s) => s.psychologistId === psychologistId && patientIds.has(s.patientId)
    );

    for (const session of psychSessions) {
      if ((session.sessionStatus === 'completed' || session.status === 'documentation_review') && !session.notesFinalized) {
        const findingId = `fnd_doc_${session.id || session.sessionId}_note`;
        findings.push({
          id: findingId,
          findingId,
          patientId: session.patientId,
          sessionId: session.id || session.sessionId,
          ruleId: 'SESSION_NOTE_UNFINALIZED',
          severity: 'advisory',
          description: `Clinical consultation on ${session.scheduledAt || session.actualStartTime?.split('T')[0] || 'recent date'} lacks a signed/finalized clinical note.`,
          recommendedAction: 'Complete note draft in Session Workspace and execute digital signature.',
          status: 'open',
          detectedAt: now.toISOString(),
        });
      }
    }

    // 2. Check Treatment Plans: active plans with 0 goals or overdue review
    const allPlans = (await firebaseRtdbAdapter.get('treatmentPlans')) || {};
    const psychPlans = Object.values(allPlans).filter(
      (p) => p.psychologistId === psychologistId && patientIds.has(p.patientId)
    );

    for (const plan of psychPlans) {
      if (plan.status === 'active' && (!plan.goals || plan.goals.length === 0)) {
        const findingId = `fnd_tp_${plan.id}_no_goals`;
        findings.push({
          id: findingId,
          findingId,
          patientId: plan.patientId,
          ruleId: 'TREATMENT_PLAN_NO_GOALS',
          severity: 'critical',
          description: `Treatment plan "${plan.title}" is currently active without documented measurable therapeutic goals.`,
          recommendedAction: 'Add at least one short-term measurable objective with target dates.',
          status: 'open',
          detectedAt: now.toISOString(),
        });
      }
    }

    // 3. Check Assessments: unreviewed completed assessments
    const allResults = (await firebaseRtdbAdapter.get('assessmentResults')) || {};
    const unreviewedResults = Object.values(allResults).filter(
      (r) => r.psychologistId === psychologistId && r.reviewStatus === 'pending_review'
    );

    for (const res of unreviewedResults) {
      const findingId = `fnd_ast_${res.id}_unreviewed`;
      findings.push({
        id: findingId,
        findingId,
        patientId: res.patientId,
        ruleId: 'ASSESSMENT_UNREVIEWED',
        severity: res.hasCriticalSafetySignal ? 'critical' : 'advisory',
        description: `Patient submitted ${res.instrumentName} on ${res.submittedAt?.split('T')[0]} (Score: ${res.totalScore}) awaiting clinician review.`,
        recommendedAction: 'Open Assessment Result and document clinical formulation and action taken.',
        status: 'open',
        detectedAt: now.toISOString(),
      });
    }

    // Save/update findings in RTDB
    for (const f of findings) {
      await firebaseRtdbAdapter.set(`documentationFindings/${psychologistId}/${f.findingId}`, f);
    }

    return {
      totalFindings: findings.length,
      findings,
    };
  },

  /**
   * Lists documentation findings for psychologist
   */
  listFindings: async (psychologistId, userRole, filters = {}) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Access denied. Psychologist role required.');
      err.status = 403;
      throw err;
    }

    // Run active scan first to ensure current findings
    await documentationQualityService.scanPracticeDocumentation(psychologistId, userRole);

    const allFindings = (await firebaseRtdbAdapter.get(`documentationFindings/${psychologistId}`)) || {};
    let findings = Object.values(allFindings);

    if (filters.patientId) {
      findings = findings.filter((f) => f.patientId === filters.patientId);
    }
    if (filters.status) {
      findings = findings.filter((f) => f.status === filters.status);
    }
    if (filters.severity) {
      findings = findings.filter((f) => f.severity === filters.severity);
    }

    return findings;
  },

  /**
   * Resolves a documentation quality finding
   */
  resolveFinding: async (findingId, psychologistId, userRole, payload = {}) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Access denied. Psychologist role required.');
      err.status = 403;
      throw err;
    }

    const finding = await firebaseRtdbAdapter.get(`documentationFindings/${psychologistId}/${findingId}`);
    if (!finding) {
      const err = new Error('Documentation finding not found.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    finding.status = 'resolved';
    finding.resolvedAt = now;
    finding.resolvedBy = psychologistId;
    finding.resolutionNotes = payload.resolutionNotes || 'Documented and addressed by clinician.';
    finding.updatedAt = now;

    await firebaseRtdbAdapter.set(`documentationFindings/${psychologistId}/${findingId}`, finding);

    await auditService.log({
      action: 'DOCUMENTATION_FINDING_RESOLVED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: findingId,
      details: {
        ruleId: finding.ruleId,
        patientId: finding.patientId,
      },
    });

    return finding;
  },
};
