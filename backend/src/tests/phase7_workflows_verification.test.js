process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { assessmentScoringService } from '../services/assessmentScoring.service.js';
import { INSTRUMENT_DEFINITIONS } from '../constants/assessments.js';

test('PSYCO AI Phase 7: End-to-End Workflows & Safety Verification', async (suite) => {
  // Test authentication tokens & IDs
  const psychId = 'psych_workflow_test_01';
  const psychToken = `Bearer test-token-psychologist-${psychId}`;

  const patientId = 'patient_workflow_test_01';
  const patientToken = `Bearer test-token-patient-${patientId}`;

  const otherPatientId = 'patient_unrelated_01';
  const otherPatientToken = `Bearer test-token-patient-${otherPatientId}`;

  const otherPsychId = 'psych_unrelated_02';
  const otherPsychToken = `Bearer test-token-psychologist-${otherPsychId}`;

  const adminToken = 'Bearer test-token-admin-admin_workflow_01';

  // Seed patient, psychologist, and therapeutic relationships
  await firebaseRtdbAdapter.set(`users/${psychId}`, { uid: psychId, role: 'psychologist', email: 'psych@workflow.test' });
  await firebaseRtdbAdapter.set(`users/${patientId}`, { uid: patientId, role: 'patient', email: 'patient@workflow.test' });
  await firebaseRtdbAdapter.set(`users/${otherPatientId}`, { uid: otherPatientId, role: 'patient', email: 'other@workflow.test' });
  await firebaseRtdbAdapter.set(`users/${otherPsychId}`, { uid: otherPsychId, role: 'psychologist', email: 'otherpsych@workflow.test' });

  await firebaseRtdbAdapter.set(`psychologists/${psychId}`, { id: psychId, fullName: 'Dr. Sarah Workflow, PhD', approvalStatus: 'approved' });
  await firebaseRtdbAdapter.set(`patients/${patientId}`, {
    id: patientId,
    fullName: 'Synthetic Patient One',
    gender: 'female',
    age: 29,
    assignedPsychologistIds: { [psychId]: true },
  });
  await firebaseRtdbAdapter.set(`patients/${otherPatientId}`, {
    id: otherPatientId,
    fullName: 'Synthetic Patient Two',
    gender: 'male',
    age: 41,
    assignedPsychologistIds: { [otherPsychId]: true },
  });

  // Seed appointment to establish therapeutic relationship
  const aptId = 'apt_workflow_test_01';
  await firebaseRtdbAdapter.set(`appointments/${aptId}`, {
    id: aptId,
    patientId,
    psychologistId: psychId,
    startTime: '2026-10-25T10:00:00Z',
    endTime: '2026-10-25T10:50:00Z',
    status: 'confirmed',
  });

  // =========================================================================
  // WORKFLOW ONE: PHQ-9 ASSESSMENT AND SCORE VERIFICATION
  // =========================================================================
  await suite.test('Workflow 1.1: Verify Official PHQ-9 Definition & Scoring Brackets', async () => {
    const phq9Def = INSTRUMENT_DEFINITIONS['phq-9'];
    assert.ok(phq9Def, 'PHQ-9 instrument definition must exist');
    assert.equal(phq9Def.id, 'phq-9');
    assert.equal(phq9Def.version, '1.0.0');
    assert.equal(phq9Def.items.length, 9);
    assert.equal(phq9Def.scoringRange.max, 27);

    // Verify exact DSM-IV item prompts are present
    assert.match(phq9Def.items[0].text, /little interest or pleasure/i);
    assert.match(phq9Def.items[8].text, /better off dead|hurting yourself/i);

    // Verify response options 0, 1, 2, 3
    assert.equal(phq9Def.options.length, 4);
    assert.deepEqual(phq9Def.options.map((o) => o.value), [0, 1, 2, 3]);

    // Verify 5 official severity brackets
    assert.equal(phq9Def.severityCategories.length, 5);
    assert.deepEqual(
      phq9Def.severityCategories.map((b) => b.label),
      [
        'None-minimal depression',
        'Mild depression',
        'Moderate depression',
        'Moderately severe depression',
        'Severe depression',
      ]
    );
  });

  await suite.test('Workflow 1.2: Independent Scoring Engine Unit Scenarios', async () => {
    // 1. Minimum valid score (all 0s) -> 0, None-minimal
    const minResp = {
      phq9_1: 0, phq9_2: 0, phq9_3: 0, phq9_4: 0, phq9_5: 0,
      phq9_6: 0, phq9_7: 0, phq9_8: 0, phq9_9: 0,
    };
    const minResult = assessmentScoringService.scorePhq9(minResp);
    assert.equal(minResult.totalScore, 0);
    assert.equal(minResult.severityCategory, 'None-minimal depression');
    assert.equal(minResult.hasCriticalSafetySignal, false);

    // 2. Maximum valid score (all 3s) -> 27, Severe, Safety Signal Triggered
    const maxResp = {
      phq9_1: 3, phq9_2: 3, phq9_3: 3, phq9_4: 3, phq9_5: 3,
      phq9_6: 3, phq9_7: 3, phq9_8: 3, phq9_9: 3,
    };
    const maxResult = assessmentScoringService.scorePhq9(maxResp);
    assert.equal(maxResult.totalScore, 27);
    assert.equal(maxResult.severityCategory, 'Severe depression');
    assert.equal(maxResult.hasCriticalSafetySignal, true);
    assert.equal(maxResult.safetyReviewFlag.severity, 'high_priority');

    // 3. Representative intermediate totals & boundary transitions
    // Score 4 -> None-minimal boundary
    const resp4 = { phq9_1: 1, phq9_2: 1, phq9_3: 1, phq9_4: 1, phq9_5: 0, phq9_6: 0, phq9_7: 0, phq9_8: 0, phq9_9: 0 };
    assert.equal(assessmentScoringService.scorePhq9(resp4).severityCategory, 'None-minimal depression');

    // Score 5 -> Mild boundary
    const resp5 = { ...resp4, phq9_5: 1 };
    assert.equal(assessmentScoringService.scorePhq9(resp5).severityCategory, 'Mild depression');

    // Score 9 -> Mild boundary
    const resp9 = { phq9_1: 1, phq9_2: 2, phq9_3: 1, phq9_4: 0, phq9_5: 2, phq9_6: 1, phq9_7: 1, phq9_8: 0, phq9_9: 1 };
    assert.equal(assessmentScoringService.scorePhq9(resp9).severityCategory, 'Mild depression');

    // Score 10 -> Moderate boundary
    const resp10 = { phq9_1: 2, phq9_2: 2, phq9_3: 2, phq9_4: 2, phq9_5: 2, phq9_6: 0, phq9_7: 0, phq9_8: 0, phq9_9: 0 };
    assert.equal(assessmentScoringService.scorePhq9(resp10).severityCategory, 'Moderate depression');

    // Score 14 -> Moderate boundary
    const resp14 = { phq9_1: 2, phq9_2: 2, phq9_3: 2, phq9_4: 2, phq9_5: 2, phq9_6: 2, phq9_7: 2, phq9_8: 0, phq9_9: 0 };
    assert.equal(assessmentScoringService.scorePhq9(resp14).severityCategory, 'Moderate depression');

    // Score 15 -> Moderately Severe boundary
    const resp15 = { ...resp14, phq9_8: 1 };
    assert.equal(assessmentScoringService.scorePhq9(resp15).severityCategory, 'Moderately severe depression');

    // Score 19 -> Moderately Severe boundary
    const resp19 = { phq9_1: 3, phq9_2: 3, phq9_3: 3, phq9_4: 3, phq9_5: 3, phq9_6: 2, phq9_7: 2, phq9_8: 0, phq9_9: 0 };
    assert.equal(assessmentScoringService.scorePhq9(resp19).severityCategory, 'Moderately severe depression');

    // Score 20 -> Severe boundary
    const resp20 = { ...resp19, phq9_8: 1 };
    assert.equal(assessmentScoringService.scorePhq9(resp20).severityCategory, 'Severe depression');
  });

  await suite.test('Workflow 1.3: Scoring Validation and Rejection of Malformed Submissions', async () => {
    // Missing required answer (only 8 items submitted)
    const incompleteResp = {
      phq9_1: 1, phq9_2: 1, phq9_3: 1, phq9_4: 1, phq9_5: 1,
      phq9_6: 1, phq9_7: 1, phq9_8: 1, // Missing phq9_9
    };
    assert.throws(
      () => assessmentScoringService.scorePhq9(incompleteResp),
      (err) => err.code === 'MISSING_ASSESSMENT_ITEM' && err.status === 400
    );

    // Out-of-bounds response value (value = 4 on a 0-3 scale)
    const outOfBoundsResp = { ...incompleteResp, phq9_9: 4 };
    assert.throws(
      () => assessmentScoringService.scorePhq9(outOfBoundsResp),
      (err) => err.code === 'INVALID_ITEM_VALUE' && err.status === 400
    );

    // Non-numeric value
    const nonNumericResp = { ...incompleteResp, phq9_9: 'invalid_string' };
    assert.throws(
      () => assessmentScoringService.scorePhq9(nonNumericResp),
      (err) => err.code === 'INVALID_ITEM_VALUE'
    );
  });

  let assignedPhq9Id = null;
  let submittedResultId = null;

  await suite.test('Workflow 1.4: End-to-End Assignment, Submission, Persistence & Retrieval', async () => {
    // Step 1: Psychologist assigns PHQ-9 to patient
    const assignRes = await request(app)
      .post('/api/v1/assessments/assignments')
      .set('Authorization', psychToken)
      .send({
        patientId,
        instrumentId: 'phq-9',
        instructions: 'Please complete this symptom survey before our next consultation.',
      });

    assert.equal(assignRes.status, 201);
    assert.equal(assignRes.body.success, true);
    assignedPhq9Id = assignRes.body.assignment.id;
    assert.ok(assignedPhq9Id);
    assert.equal(assignRes.body.assignment.status, 'assigned');
    assert.equal(assignRes.body.assignment.instrumentVersion, '1.0.0');

    // Step 2: Patient retrieves their assigned assessment
    const getAssignRes = await request(app)
      .get(`/api/v1/assessments/assignments/${assignedPhq9Id}`)
      .set('Authorization', patientToken);

    assert.equal(getAssignRes.status, 200);
    assert.equal(getAssignRes.body.assignment.instrumentId, 'phq-9');
    assert.equal(getAssignRes.body.assignment.instrument.items.length, 9);

    // Step 3: Patient completes and submits valid responses
    // Expected score: 1+2+1+0+2+1+1+0+1 = 9 (Mild depression, Q9=1 -> Safety Alert triggered)
    const responsesPayload = {
      phq9_1: 1,
      phq9_2: 2,
      phq9_3: 1,
      phq9_4: 0,
      phq9_5: 2,
      phq9_6: 1,
      phq9_7: 1,
      phq9_8: 0,
      phq9_9: 1, // Affirmative Q9
    };

    const submitRes = await request(app)
      .post(`/api/v1/assessments/assignments/${assignedPhq9Id}/submit`)
      .set('Authorization', patientToken)
      .send({ responses: responsesPayload });

    assert.equal(submitRes.status, 200);
    assert.equal(submitRes.body.success, true);
    assert.equal(submitRes.body.score, 9);
    assert.equal(submitRes.body.severity, 'Mild depression');
    assert.equal(submitRes.body.safetyTriggered, true);

    submittedResultId = submitRes.body.resultId;
    assert.ok(submittedResultId);

    // Step 4: Verify persistence in database directly
    const storedResult = await firebaseRtdbAdapter.get(`assessmentResults/${submittedResultId}`);
    assert.ok(storedResult, 'Authoritative result record must exist in RTDB');
    assert.equal(storedResult.id, submittedResultId);
    assert.equal(storedResult.patientId, patientId);
    assert.equal(storedResult.psychologistId, psychId);
    assert.equal(storedResult.instrumentId, 'phq-9');
    assert.equal(storedResult.instrumentVersion, '1.0.0');
    assert.equal(storedResult.scoringAlgorithmVersion, '1.0.0');
    assert.equal(storedResult.totalScore, 9);
    assert.equal(storedResult.severityCategory, 'Mild depression');
    assert.equal(storedResult.hasCriticalSafetySignal, true);
    assert.equal(storedResult.reviewStatus, 'pending_review');
    assert.equal(Object.keys(storedResult.itemScores).length, 9);

    // Step 5: Psychologist retrieves authoritative result
    const psychGetRes = await request(app)
      .get(`/api/v1/assessments/results/${submittedResultId}`)
      .set('Authorization', psychToken);

    assert.equal(psychGetRes.status, 200);
    assert.equal(psychGetRes.body.result.totalScore, storedResult.totalScore);
    assert.equal(psychGetRes.body.result.severityCategory, storedResult.severityCategory);
    assert.equal(psychGetRes.body.result.hasCriticalSafetySignal, storedResult.hasCriticalSafetySignal);

    // Step 6: Idempotency & duplicate submission rejection
    const duplicateSubmitRes = await request(app)
      .post(`/api/v1/assessments/assignments/${assignedPhq9Id}/submit`)
      .set('Authorization', patientToken)
      .send({ responses: responsesPayload });

    assert.equal(duplicateSubmitRes.status, 409); // Conflict
    assert.match(duplicateSubmitRes.body.error.message, /already been submitted/i);
  });

  await suite.test('Workflow 1.5: Clinician Review & Notes Recording', async () => {
    const reviewRes = await request(app)
      .post(`/api/v1/assessments/results/${submittedResultId}/review`)
      .set('Authorization', psychToken)
      .send({
        notes: 'Mild depressive symptoms noted with passive ideation (Q9=1). Discussed safety plan in session.',
        actionTaken: 'Safety plan reviewed and agreed upon.',
      });

    assert.equal(reviewRes.status, 200);

    // Check RTDB persistence of review
    const updatedResult = await firebaseRtdbAdapter.get(`assessmentResults/${submittedResultId}`);
    assert.equal(updatedResult.reviewStatus, 'reviewed');
    assert.equal(updatedResult.reviewedBy, psychId);
    assert.ok(updatedResult.reviewedAt);
    assert.equal(updatedResult.notes, 'Mild depressive symptoms noted with passive ideation (Q9=1). Discussed safety plan in session.');
    assert.equal(updatedResult.actionTaken, 'Safety plan reviewed and agreed upon.');
  });

  // =========================================================================
  // WORKFLOW TWO: HISTORICAL ASSESSMENT ANALYTICS
  // =========================================================================
  await suite.test('Workflow 2.1: Seed and Verify Chronological History Traced 1:1 to Records', async () => {
    // Seed an earlier baseline PHQ-9 (Date: 2 weeks ago, Score: 16 -> Moderately Severe)
    const baselinePhq9Id = 'res_phq9_baseline_wk01';
    await firebaseRtdbAdapter.set(`assessmentResults/${baselinePhq9Id}`, {
      id: baselinePhq9Id,
      resultId: baselinePhq9Id,
      patientId,
      psychologistId: psychId,
      instrumentId: 'phq-9',
      instrumentVersion: '1.0.0',
      scoringAlgorithmVersion: '1.0.0',
      totalScore: 16,
      maxScore: 27,
      severityCategory: 'Moderately severe depression',
      severityCode: 'moderately_severe',
      submittedAt: '2026-10-08T10:00:00Z',
      createdAt: '2026-10-08T10:00:00Z',
      reviewStatus: 'reviewed',
    });

    // Seed a GAD-7 record to verify instrument separation (must NOT pollute PHQ-9 trends)
    const gad7Id = 'res_gad7_wk02';
    await firebaseRtdbAdapter.set(`assessmentResults/${gad7Id}`, {
      id: gad7Id,
      resultId: gad7Id,
      patientId,
      psychologistId: psychId,
      instrumentId: 'gad-7',
      instrumentVersion: '1.0.0',
      scoringAlgorithmVersion: '1.0.0',
      totalScore: 11,
      maxScore: 21,
      severityCategory: 'Moderate anxiety',
      severityCode: 'moderate',
      submittedAt: '2026-10-15T10:00:00Z',
      createdAt: '2026-10-15T10:00:00Z',
      reviewStatus: 'reviewed',
    });

    // Request longitudinal progress analytics
    const analyticsRes = await request(app)
      .get(`/api/v1/analytics/patient/${patientId}/progress`)
      .set('Authorization', psychToken);

    assert.equal(analyticsRes.status, 200);
    const { analytics } = analyticsRes.body;

    // Verify PHQ-9 trajectory
    const phq9Metrics = analytics.instrumentMetrics['phq-9'];
    assert.ok(phq9Metrics, 'PHQ-9 metrics must exist');
    assert.equal(phq9Metrics.baselineScore, 16);
    assert.equal(phq9Metrics.latestScore, 9);
    assert.equal(phq9Metrics.delta, -7); // 9 - 16 = -7 (Improvement)
    assert.equal(phq9Metrics.trend, 'improving');
    assert.equal(phq9Metrics.history.length, 2);

    // Verify chronological ordering: Oct 8 baseline first, then later submission
    assert.equal(phq9Metrics.history[0].id, baselinePhq9Id);
    assert.equal(phq9Metrics.history[0].score, 16);
    assert.equal(phq9Metrics.history[1].id, submittedResultId);
    assert.equal(phq9Metrics.history[1].score, 9);

    // Verify GAD-7 is kept strictly separate
    const gad7Metrics = analytics.instrumentMetrics['gad-7'];
    assert.ok(gad7Metrics, 'GAD-7 metrics must exist separately');
    assert.equal(gad7Metrics.history.length, 1);
    assert.equal(gad7Metrics.history[0].id, gad7Id);
    assert.equal(gad7Metrics.history[0].score, 11);
  });

  await suite.test('Workflow 2.2: Empty State Verification for Patient with Zero Records', async () => {
    const emptyPatientId = 'patient_zero_assessments_01';
    await firebaseRtdbAdapter.set(`users/${emptyPatientId}`, { uid: emptyPatientId, role: 'patient', email: 'empty@test.com' });
    await firebaseRtdbAdapter.set(`patients/${emptyPatientId}`, {
      id: emptyPatientId,
      fullName: 'Zero Records Patient',
      assignedPsychologistIds: { [psychId]: true },
    });

    const res = await request(app)
      .get(`/api/v1/analytics/patient/${emptyPatientId}/progress`)
      .set('Authorization', psychToken);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.analytics.assessmentsByInstrument, {});
    assert.deepEqual(res.body.analytics.instrumentMetrics, {});
    assert.equal(res.body.analytics.careTimeline.length, 0);
  });

  await suite.test('Workflow 2.3: ReBAC Authorization on Analytics Endpoints', async () => {
    // Patient attempting to query another patient's analytics -> 403 Forbidden
    const unauthPatientRes = await request(app)
      .get(`/api/v1/analytics/patient/${patientId}/progress`)
      .set('Authorization', otherPatientToken);
    assert.equal(unauthPatientRes.status, 403);

    // Unrelated psychologist attempting to query patient analytics -> 403 Forbidden
    const unauthPsychRes = await request(app)
      .get(`/api/v1/analytics/patient/${patientId}/progress`)
      .set('Authorization', otherPsychToken);
    assert.equal(unauthPsychRes.status, 403);

    // Administrator barred from clinical analytics -> 403 Forbidden
    const adminRes = await request(app)
      .get(`/api/v1/analytics/patient/${patientId}/progress`)
      .set('Authorization', adminToken);
    assert.equal(adminRes.status, 403);
  });

  // =========================================================================
  // WORKFLOW THREE: SYNTHETIC TRANSCRIPT AND CLINICAL RISK-REVIEW FLAG
  // =========================================================================
  const testSessionId = 'ses_workflow_risk_01';
  const testTranscriptId = `trx_workflow_risk_01`;

  await suite.test('Workflow 3.1: Seed Session & Synthetic Transcripts', async () => {
    await firebaseRtdbAdapter.set(`sessionRecords/${testSessionId}`, {
      id: testSessionId,
      sessionId: testSessionId,
      appointmentId: aptId,
      patientId,
      psychologistId: psychId,
      sessionStatus: 'completed',
      status: 'completed',
    });

    // Synthetic transcript with explicit safety-critical concern
    const syntheticTranscriptText = `
[00:01] Psychologist: Good afternoon, how are you feeling today?
[00:02] Patient: Honestly, things have gotten unbearable lately.
[00:03] Psychologist: What has felt unbearable?
[00:04] Patient: I feel like everyone would be better off dead and I want to die so the pain stops.
[00:05] Psychologist: I am here with you. Let's talk about what is causing this overwhelming pain right now.
[00:06] Patient: Work has been stressful, but I had dinner with my sister yesterday which was nice.
`;

    await firebaseRtdbAdapter.set(`sessionTranscripts/${testTranscriptId}`, {
      id: testTranscriptId,
      sessionId: testSessionId,
      fullText: syntheticTranscriptText,
      version: 1,
      format: 'ambient_stream',
      createdAt: new Date().toISOString(),
    });
  });

  let generatedFlagId = null;

  await suite.test('Workflow 3.2: Scan Transcript, Extract Source Excerpt & Verify Evidence', async () => {
    const scanRes = await request(app)
      .post(`/api/v1/risk-review/scan/session/${testSessionId}`)
      .set('Authorization', psychToken);

    assert.equal(scanRes.status, 200);
    assert.ok(scanRes.body.count >= 1);
    const flag = scanRes.body.flags[0];

    assert.ok(flag.id);
    generatedFlagId = flag.id;
    assert.equal(flag.sessionId, testSessionId);
    assert.equal(flag.patientId, patientId);
    assert.equal(flag.category, 'suicidal_ideation');
    assert.equal(flag.severity, 'high_priority');
    assert.equal(flag.reviewStatus, 'pending_review');

    // Verify that the evidence excerpt matches the exact verbatim line in the transcript
    assert.match(flag.evidenceExcerpt, /better off dead and I want to die/i);
    assert.equal(flag.lineReference, 5); // Line 5 in transcript array

    // Verify stored record in Firebase RTDB
    const storedFlag = await firebaseRtdbAdapter.get(`riskReviewFlags/${generatedFlagId}`);
    assert.ok(storedFlag);
    assert.equal(storedFlag.evidenceExcerpt, flag.evidenceExcerpt);
  });

  await suite.test('Workflow 3.3: Mandatory Clinical-Action Boundary (Unreviewed Flag Rejection)', async () => {
    // Attempt to execute clinical care action before flag is acknowledged
    const unreviewedActionRes = await request(app)
      .post(`/api/v1/risk-review/session/${testSessionId}/clinical-action`)
      .set('Authorization', psychToken)
      .send({
        actionType: 'discharge_planning',
        clinicalNotes: 'Attempting routine discharge without reviewing acute ideation.',
      });

    // MUST be rejected with HTTP 412 (Precondition Failed)
    assert.equal(unreviewedActionRes.status, 412);
    assert.equal(unreviewedActionRes.body.error.code, 'UNREVIEWED_RISK_FLAGS_EXIST');
    assert.match(unreviewedActionRes.body.error.message, /unreviewed risk-review flag/i);

    // Attempting to finalize session also MUST be rejected with 412
    const unreviewedFinalizeRes = await request(app)
      .post(`/api/v1/clinical/sessions/${testSessionId}/finalize`)
      .set('Authorization', psychToken);

    assert.equal(unreviewedFinalizeRes.status, 412);
    assert.equal(unreviewedFinalizeRes.body.error.code, 'UNREVIEWED_RISK_FLAGS_EXIST');
  });

  await suite.test('Workflow 3.4: Psychologist Review & Acknowledgment Execution', async () => {
    // Psychologist inspects evidence and acknowledges flag with documented safety plan
    const ackRes = await request(app)
      .post(`/api/v1/risk-review/flags/${generatedFlagId}/acknowledge`)
      .set('Authorization', psychToken)
      .send({
        actionTaken: 'Completed comprehensive suicide risk assessment. Crisis contacts verified; established written safety plan with patient and confirmed next day check-in.',
        clinicianNotes: 'Patient expressed acute hopelessness due to workplace crisis; contracted for safety and scheduled follow-up consultation in 48 hours.',
      });

    assert.equal(ackRes.status, 200);
    assert.equal(ackRes.body.flag.reviewStatus, 'acknowledged');
    assert.equal(ackRes.body.flag.acknowledgedBy, psychId);
    assert.ok(ackRes.body.flag.acknowledgedAt);

    // Verify flag in RTDB preserves acknowledgment history and verbatim excerpt
    const ackFlag = await firebaseRtdbAdapter.get(`riskReviewFlags/${generatedFlagId}`);
    assert.equal(ackFlag.reviewStatus, 'acknowledged');
    assert.match(ackFlag.actionTaken, /safety plan/i);
    assert.match(ackFlag.evidenceExcerpt, /better off dead/i);
  });

  await suite.test('Workflow 3.5: Clinical Action Execution Permitted Following Review', async () => {
    // Now that all risk review flags for this session are acknowledged, clinical action succeeds
    const actionRes = await request(app)
      .post(`/api/v1/risk-review/session/${testSessionId}/clinical-action`)
      .set('Authorization', psychToken)
      .send({
        actionType: 'safety_plan_finalized',
        clinicalNotes: 'Safety plan finalized and reviewed following clinician risk assessment.',
      });

    assert.equal(actionRes.status, 200);
    assert.equal(actionRes.body.success, true);
    assert.equal(actionRes.body.action.status, 'executed');
    assert.equal(actionRes.body.action.psychologistId, psychId);

    // Check RTDB persistence of clinical action
    const storedAction = await firebaseRtdbAdapter.get(`clinicalActions/${actionRes.body.action.id}`);
    assert.ok(storedAction);
    assert.equal(storedAction.sessionId, testSessionId);
    assert.equal(storedAction.actionType, 'safety_plan_finalized');

    // Finalizing session also now succeeds
    const finalizeRes = await request(app)
      .post(`/api/v1/clinical/sessions/${testSessionId}/finalize`)
      .set('Authorization', psychToken);

    assert.equal(finalizeRes.status, 200);
    const finalizedSession = finalizeRes.body.session || finalizeRes.body.data?.session;
    assert.ok(finalizedSession);
    assert.equal(finalizedSession.status, 'finalized');
  });

  await suite.test('Workflow 3.6: Risk-Review Negative and Authorization Tests', async () => {
    // 1. Patient attempting to acknowledge clinical risk flag -> 403 Forbidden
    const patientAckRes = await request(app)
      .post(`/api/v1/risk-review/flags/${generatedFlagId}/acknowledge`)
      .set('Authorization', patientToken)
      .send({ actionTaken: 'Patient self-dismissal' });
    assert.equal(patientAckRes.status, 403);

    // 2. Unrelated psychologist attempting to access or acknowledge -> 403 Forbidden
    const unauthAckRes = await request(app)
      .post(`/api/v1/risk-review/flags/${generatedFlagId}/acknowledge`)
      .set('Authorization', otherPsychToken)
      .send({ actionTaken: 'Tampering attempt' });
    assert.equal(unauthAckRes.status, 403);

    // 3. Scanning nonexistent session -> 404
    const notFoundScan = await request(app)
      .post('/api/v1/risk-review/scan/session/ses_nonexistent_99')
      .set('Authorization', psychToken);
    assert.equal(notFoundScan.status, 404);
  });
});
