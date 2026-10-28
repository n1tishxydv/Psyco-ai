import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { assessmentScoringService } from '../services/assessmentScoring.service.js';
import { INSTRUMENT_DEFINITIONS } from '../constants/assessments.js';

test('Phase 7: Standardized Assessments, Progress Analytics, Risk Review & Documentation Quality', async (t) => {
  const psychToken = 'Bearer test-token-psychologist-psych_p7_01';
  const psychUid = 'psych_p7_01';

  const patientToken = 'Bearer test-token-patient-patient_p7_01';
  const patientUid = 'patient_p7_01';

  const patient2Token = 'Bearer test-token-patient-patient_p7_02';
  const patient2Uid = 'patient_p7_02';

  const otherPsychToken = 'Bearer test-token-psychologist-other_psych_p7';
  const otherPsychUid = 'other_psych_p7';

  const adminToken = 'Bearer test-token-admin-admin_p7_01';
  const adminUid = 'admin_p7_01';

  const sessionId = 'ses_p7_test_01';
  const appointmentId = 'apt_p7_test_01';
  let phq9AssignmentId = null;
  let phq9ResultId = null;

  await t.test('1. Setup test harness: users, patient chart, appointment, session, and treatment plan', async () => {
    // 1. Seed psychologists
    await firebaseRtdbAdapter.set(`users/${psychUid}`, {
      uid: psychUid,
      email: 'dr.watson.p7@psyco.health',
      role: 'psychologist',
      accountStatus: 'active',
      onboardingStatus: 'complete',
      fullName: 'Dr. John Watson',
    });
    await firebaseRtdbAdapter.set(`psychologists/${psychUid}`, {
      uid: psychUid,
      fullName: 'Dr. John Watson',
      licenseNumber: 'PSY-P7-123',
      approvalStatus: 'approved',
    });

    await firebaseRtdbAdapter.set(`users/${otherPsychUid}`, {
      uid: otherPsychUid,
      email: 'dr.other.p7@psyco.health',
      role: 'psychologist',
      accountStatus: 'active',
      fullName: 'Dr. Other Clinician',
    });

    // 2. Seed patients
    await firebaseRtdbAdapter.set(`users/${patientUid}`, {
      uid: patientUid,
      email: 'maya.p7@example.com',
      role: 'patient',
      accountStatus: 'active',
      fullName: 'Maya Lin',
    });
    await firebaseRtdbAdapter.set(`patients/${patientUid}`, {
      uid: patientUid,
      fullName: 'Maya Lin',
      gender: 'female',
      age: 32,
    });

    await firebaseRtdbAdapter.set(`users/${patient2Uid}`, {
      uid: patient2Uid,
      email: 'bob.p7@example.com',
      role: 'patient',
      accountStatus: 'active',
      fullName: 'Bob Patient',
    });
    await firebaseRtdbAdapter.set(`patients/${patient2Uid}`, {
      uid: patient2Uid,
      fullName: 'Bob Patient',
      gender: 'male',
      age: 45,
    });

    // 3. Seed admin
    await firebaseRtdbAdapter.set(`users/${adminUid}`, {
      uid: adminUid,
      email: 'admin.p7@psyco.health',
      role: 'admin',
      accountStatus: 'active',
      fullName: 'System Admin',
    });

    // 4. Seed appointment & session with therapeutic relationship
    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, {
      id: appointmentId,
      appointmentId,
      patientId: patientUid,
      psychologistId: psychUid,
      status: 'completed',
      date: '2026-10-22',
      startTime: '2026-10-22T14:00:00Z',
      endTime: '2026-10-22T14:50:00Z',
    });

    await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, {
      id: sessionId,
      sessionId,
      appointmentId,
      patientId: patientUid,
      psychologistId: psychUid,
      sessionStatus: 'completed',
      sessionMode: 'in_person',
      notesFinalized: false, // Intentionally unfinalized to test documentation quality scanner
      scheduledAt: '2026-10-22T14:00:00Z',
      actualStartTime: '2026-10-22T14:02:00Z',
    });

    // 5. Seed treatment plan with measurable goals
    const planId = 'tp_p7_test_01';
    await firebaseRtdbAdapter.set(`treatmentPlans/${planId}`, {
      id: planId,
      planId,
      patientId: patientUid,
      psychologistId: psychUid,
      title: 'Cognitive Behavioral Therapy for Major Depression',
      status: 'active',
      goals: [
        { id: 'goal_1', description: 'Complete 3 thought records weekly', status: 'achieved' },
        { id: 'goal_2', description: 'Engage in 20 minutes daily aerobic walking', status: 'active' },
        { id: 'goal_3', description: 'Reduce PHQ-9 score to under 10', status: 'active' },
      ],
      createdAt: '2026-10-01T10:00:00Z',
      approvedAt: '2026-10-01T10:00:00Z',
    });
  });

  await t.test('2. Instrument Definitions & Catalog Verification', async () => {
    // 1. Fetch available instruments
    const res = await request(app)
      .get('/api/v1/assessments/instruments')
      .set('Authorization', psychToken);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.instruments.length >= 3);

    const ids = res.body.instruments.map((i) => i.id);
    assert.ok(ids.includes('phq-9'));
    assert.ok(ids.includes('gad-7'));
    assert.ok(ids.includes('cssrs-screener'));

    // 2. Fetch PHQ-9 full definition
    const phq9Res = await request(app)
      .get('/api/v1/assessments/instruments/phq-9')
      .set('Authorization', psychToken);

    assert.equal(phq9Res.status, 200);
    const inst = phq9Res.body.instrument;
    assert.equal(inst.id, 'phq-9');
    assert.equal(inst.items.length, 9);
    assert.equal(inst.options.length, 4);
    assert.ok(inst.disclaimer.includes('not a standalone diagnostic instrument'));
  });

  await t.test('3. PHQ-9 Deterministic Scoring Algorithm & Severity Boundaries', () => {
    // Minimum score: all 0
    const minResponses = {
      phq9_1: 0, phq9_2: 0, phq9_3: 0, phq9_4: 0, phq9_5: 0,
      phq9_6: 0, phq9_7: 0, phq9_8: 0, phq9_9: 0,
    };
    const minScore = assessmentScoringService.scorePhq9(minResponses);
    assert.equal(minScore.totalScore, 0);
    assert.equal(minScore.severityCategory, 'None-minimal depression');
    assert.equal(minScore.hasCriticalSafetySignal, false);

    // Maximum score: all 3
    const maxResponses = {
      phq9_1: 3, phq9_2: 3, phq9_3: 3, phq9_4: 3, phq9_5: 3,
      phq9_6: 3, phq9_7: 3, phq9_8: 3, phq9_9: 3,
    };
    const maxScore = assessmentScoringService.scorePhq9(maxResponses);
    assert.equal(maxScore.totalScore, 27);
    assert.equal(maxScore.severityCategory, 'Severe depression');
    assert.equal(maxScore.hasCriticalSafetySignal, true);
    assert.equal(maxScore.safetyReviewFlag.severity, 'high_priority');

    // Severity boundary: Score 14 = Moderate, Score 15 = Moderately severe
    const score14 = assessmentScoringService.scorePhq9({
      phq9_1: 2, phq9_2: 2, phq9_3: 2, phq9_4: 2, phq9_5: 2,
      phq9_6: 2, phq9_7: 2, phq9_8: 0, phq9_9: 0,
    });
    assert.equal(score14.totalScore, 14);
    assert.equal(score14.severityCategory, 'Moderate depression');

    const score15 = assessmentScoringService.scorePhq9({
      phq9_1: 2, phq9_2: 2, phq9_3: 2, phq9_4: 2, phq9_5: 2,
      phq9_6: 2, phq9_7: 2, phq9_8: 1, phq9_9: 0,
    });
    assert.equal(score15.totalScore, 15);
    assert.equal(score15.severityCategory, 'Moderately severe depression');

    // Missing answers are NOT treated as zero: throws error
    assert.throws(
      () => assessmentScoringService.scorePhq9({ phq9_1: 1, phq9_2: 1 }),
      /Missing response for required item/
    );

    // Out-of-bounds value rejection
    assert.throws(
      () => assessmentScoringService.scorePhq9({ ...minResponses, phq9_1: 4 }),
      /Invalid response value/
    );
  });

  await t.test('4. GAD-7 Deterministic Scoring Algorithm & Severity Boundaries', () => {
    // Minimum score: 0
    const minResponses = {
      gad7_1: 0, gad7_2: 0, gad7_3: 0, gad7_4: 0, gad7_5: 0, gad7_6: 0, gad7_7: 0,
    };
    const minScore = assessmentScoringService.scoreGad7(minResponses);
    assert.equal(minScore.totalScore, 0);
    assert.equal(minScore.severityCategory, 'Minimal anxiety');

    // Score 10 (Moderate boundary)
    const score10 = assessmentScoringService.scoreGad7({
      gad7_1: 2, gad7_2: 2, gad7_3: 2, gad7_4: 2, gad7_5: 2, gad7_6: 0, gad7_7: 0,
    });
    assert.equal(score10.totalScore, 10);
    assert.equal(score10.severityCategory, 'Moderate anxiety');

    // Score 15 (Severe boundary)
    const score15 = assessmentScoringService.scoreGad7({
      gad7_1: 3, gad7_2: 3, gad7_3: 3, gad7_4: 2, gad7_5: 2, gad7_6: 1, gad7_7: 1,
    });
    assert.equal(score15.totalScore, 15);
    assert.equal(score15.severityCategory, 'Severe anxiety');
  });

  await t.test('5. C-SSRS Screener Triage Rules', () => {
    // All No = none identified
    const negative = assessmentScoringService.scoreCssrsScreener({
      cssrs_1: 0, cssrs_2: 0, cssrs_6: 0,
    });
    assert.equal(negative.triageLevel, 'none_identified');
    assert.equal(negative.hasCriticalSafetySignal, false);

    // Q1 Yes, Q2 No = Low risk passive thoughts
    const passive = assessmentScoringService.scoreCssrsScreener({
      cssrs_1: 1, cssrs_2: 0, cssrs_6: 0,
    });
    assert.equal(passive.triageLevel, 'low_risk');
    assert.equal(passive.hasCriticalSafetySignal, true);
    assert.equal(passive.safetyReviewFlag.severity, 'advisory');

    // Q2 Yes + Q4 Yes = High risk active ideation with intent
    const highRisk = assessmentScoringService.scoreCssrsScreener({
      cssrs_1: 1, cssrs_2: 1, cssrs_3: 1, cssrs_4: 1, cssrs_5: 0, cssrs_6: 0,
    });
    assert.equal(highRisk.triageLevel, 'high_risk');
    assert.equal(highRisk.safetyReviewFlag.severity, 'high_priority');
  });

  await t.test('6. Assessment Assignment & Submission Workflow', async () => {
    // 1. Psychologist assigns PHQ-9 to patient
    const assignRes = await request(app)
      .post('/api/v1/assessments/assign')
      .set('Authorization', psychToken)
      .send({
        patientId: patientUid,
        instrumentId: 'phq-9',
        instructions: 'Please complete before our Friday appointment.',
      });

    assert.equal(assignRes.status, 201);
    assert.equal(assignRes.body.success, true);
    assert.ok(assignRes.body.assignment.id);
    phq9AssignmentId = assignRes.body.assignment.id;

    // 2. Patient retrieves assigned assessment
    const getRes = await request(app)
      .get(`/api/v1/assessments/assignments/${phq9AssignmentId}`)
      .set('Authorization', patientToken);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.assignment.status, 'assigned');
    assert.equal(getRes.body.assignment.instrument.items.length, 9);

    // 3. Patient submits responses with affirmative Q9 (thoughts of death)
    const submitRes = await request(app)
      .post(`/api/v1/assessments/assignments/${phq9AssignmentId}/submit`)
      .set('Authorization', patientToken)
      .send({
        responses: {
          phq9_1: 2, phq9_2: 2, phq9_3: 2, phq9_4: 2, phq9_5: 2,
          phq9_6: 2, phq9_7: 2, phq9_8: 1, phq9_9: 2, // 17 = Moderately severe, Q9=2
        },
      });

    assert.equal(submitRes.status, 200);
    assert.equal(submitRes.body.success, true);
    assert.equal(submitRes.body.totalScore, 17);
    assert.equal(submitRes.body.severityCategory, 'Moderately severe depression');
    phq9ResultId = submitRes.body.resultId;

    // 4. Duplicate submission is rejected (409 Conflict)
    const duplicateRes = await request(app)
      .post(`/api/v1/assessments/assignments/${phq9AssignmentId}/submit`)
      .set('Authorization', patientToken)
      .send({ responses: { phq9_1: 0 } });

    assert.equal(duplicateRes.status, 409);
    assert.equal(duplicateRes.body.error?.code, 'ASSESSMENT_ALREADY_COMPLETED');

    // 5. Psychologist reviews result and records clinical notes
    const reviewRes = await request(app)
      .post(`/api/v1/assessments/results/${phq9ResultId}/review`)
      .set('Authorization', psychToken)
      .send({
        clinicalInterpretation: 'Confirmed elevated depressive symptoms with situational sleep disturbance.',
        actionTaken: 'Reviewed safety plan in session; patient contracted for safety with emergency contacts.',
      });

    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.body.result.reviewStatus, 'reviewed');
    assert.equal(reviewRes.body.result.reviewedBy, psychUid);
  });

  await t.test('7. Role Authorization & Administrative Clinical Access Barrier', async () => {
    // 1. Patient B cannot access Patient A's assessment result
    const unauthorizedPatientRes = await request(app)
      .get(`/api/v1/assessments/results/${phq9ResultId}`)
      .set('Authorization', patient2Token);

    assert.equal(unauthorizedPatientRes.status, 403);

    // 2. Unrelated psychologist cannot access patient's assessment
    const otherPsychRes = await request(app)
      .get(`/api/v1/assessments/results/${phq9ResultId}`)
      .set('Authorization', otherPsychToken);

    assert.equal(otherPsychRes.status, 403);

    // 3. Admin is strictly blocked from clinical assessment results & progress analytics
    const adminRes = await request(app)
      .get(`/api/v1/assessments/results/${phq9ResultId}`)
      .set('Authorization', adminToken);

    assert.equal(adminRes.status, 403);
    assert.equal(adminRes.body.error?.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');

    const adminAnalyticsRes = await request(app)
      .get(`/api/v1/analytics/patient/${patientUid}/progress`)
      .set('Authorization', adminToken);

    assert.equal(adminAnalyticsRes.status, 403);
    assert.equal(adminAnalyticsRes.body.error?.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
  });

  await t.test('8. Longitudinal Progress Analytics Calculations', async () => {
    // Seed a second earlier PHQ-9 result (Score: 21, Severe) to test delta calculation
    const earlierResultId = 'res_phq-9_earlier_01';
    await firebaseRtdbAdapter.set(`assessmentResults/${earlierResultId}`, {
      id: earlierResultId,
      resultId: earlierResultId,
      patientId: patientUid,
      psychologistId: psychUid,
      instrumentId: 'phq-9',
      instrumentName: 'Patient Health Questionnaire-9 (PHQ-9)',
      instrumentVersion: '1.0.0',
      totalScore: 21,
      maxScore: 27,
      severityCategory: 'Severe depression',
      severityCode: 'severe',
      reviewStatus: 'reviewed',
      submittedAt: '2026-10-01T10:00:00Z',
    });

    const analyticsRes = await request(app)
      .get(`/api/v1/analytics/patient/${patientUid}/progress`)
      .set('Authorization', psychToken);

    assert.equal(analyticsRes.status, 200);
    const data = analyticsRes.body.analytics;

    // 1. Assessment trajectory: baseline (21) -> latest (17) => delta = -4 (improving)
    const phqMetrics = data.assessments['phq-9'];
    assert.ok(phqMetrics);
    assert.equal(phqMetrics.baselineScore, 21);
    assert.equal(phqMetrics.latestScore, 17);
    assert.equal(phqMetrics.delta, -4);
    assert.equal(phqMetrics.trend, 'improving');
    assert.equal(phqMetrics.datapointsCount, 2);

    // 2. Goals progress metrics
    assert.equal(data.goals.totalGoals, 3);
    assert.equal(data.goals.achievedGoals, 1);
    assert.equal(data.goals.completionRate, 33); // 1 of 3 = 33%

    // 3. Attendance metrics
    assert.equal(data.attendance.completedSessions, 1);
    assert.equal(data.attendance.attendanceRate, 100);

    // 4. Unified clinical timeline
    assert.ok(data.timeline.length >= 3);
    assert.ok(data.timeline.some((t) => t.type === 'session'));
    assert.ok(data.timeline.some((t) => t.type === 'assessment'));
    assert.ok(data.timeline.some((t) => t.type === 'treatment_plan'));
  });

  await t.test('9. Clinical Risk-Review Support & Transparent Evidence Excerpt', async () => {
    // 1. Verify automatic safety flag created from PHQ-9 Q9 affirmative answer
    const flagsRes = await request(app)
      .get('/api/v1/risk-review/flags')
      .set('Authorization', psychToken);

    assert.equal(flagsRes.status, 200);
    assert.ok(flagsRes.body.flags.length >= 1);

    const flag = flagsRes.body.flags.find((f) => f.patientId === patientUid);
    assert.ok(flag);
    assert.equal(flag.category, 'suicidal_ideation');
    assert.equal(flag.severity, 'high_priority');
    assert.equal(flag.reviewStatus, 'pending_review');
    assert.ok(flag.evidenceExcerpt);

    // 2. Clinician acknowledges flag with documented clinical action
    const ackRes = await request(app)
      .post(`/api/v1/risk-review/flags/${flag.id}/acknowledge`)
      .set('Authorization', psychToken)
      .send({
        actionTaken: 'Conducted Columbia Suicide Severity interview; established no imminent intent or plan.',
        clinicianNotes: 'Patient has strong protective factors including supportive family.',
      });

    assert.equal(ackRes.status, 200);
    assert.equal(ackRes.body.flag.reviewStatus, 'acknowledged');
    assert.equal(ackRes.body.flag.acknowledgedBy, psychUid);
    assert.ok(ackRes.body.flag.acknowledgedAt);

    // 3. Test transcript scanning for safety signals
    const scanSessionId = 'ses_p7_transcript_test';
    const scanTranscriptId = 'trx_p7_transcript_test';
    await firebaseRtdbAdapter.set(`sessionRecords/${scanSessionId}`, {
      id: scanSessionId,
      sessionId: scanSessionId,
      patientId: patientUid,
      psychologistId: psychUid,
    });
    await firebaseRtdbAdapter.set(`sessionTranscripts/${scanTranscriptId}`, {
      id: scanTranscriptId,
      sessionId: scanSessionId,
      patientId: patientUid,
      psychologistId: psychUid,
      fullText: '[Psychologist]: How are things?\n[Patient]: Honestly, sometimes I feel like I just want to end my life.\n[Psychologist]: Thank you for sharing that.',
    });

    const scanRes = await request(app)
      .post(`/api/v1/risk-review/scan/session/${scanSessionId}`)
      .set('Authorization', psychToken);

    assert.equal(scanRes.status, 200);
    assert.equal(scanRes.body.count, 1);
    assert.equal(scanRes.body.flags[0].category, 'suicidal_ideation');
    assert.ok(scanRes.body.flags[0].evidenceExcerpt.includes('want to end my life'));
  });

  await t.test('10. Documentation Quality Engine: Scanning & Gap Resolution', async () => {
    // 1. Scan practice documentation: should detect unfinalized note on session ses_p7_test_01
    const scanRes = await request(app)
      .post('/api/v1/documentation-quality/scan')
      .set('Authorization', psychToken);

    assert.equal(scanRes.status, 200);
    assert.ok(scanRes.body.totalFindings >= 1);

    const noteFinding = scanRes.body.findings.find(
      (f) => f.ruleId === 'SESSION_NOTE_UNFINALIZED' && f.sessionId === sessionId
    );
    assert.ok(noteFinding, 'Scanner must detect unfinalized session note');
    assert.equal(noteFinding.status, 'open');

    // 2. Resolve finding
    const resolveRes = await request(app)
      .post(`/api/v1/documentation-quality/findings/${noteFinding.id}/resolve`)
      .set('Authorization', psychToken)
      .send({ resolutionNotes: 'Documentation finalized under separate clinical supervision.' });

    assert.equal(resolveRes.status, 200);
    assert.equal(resolveRes.body.finding.status, 'resolved');
    assert.equal(resolveRes.body.finding.resolvedBy, psychUid);
  });
});
