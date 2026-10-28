process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import config from '../config/index.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { seedStagingEnvironment } from '../../scripts/seedStagingEnvironment.js';

test('PSYCO AI STAGING COMPLETE E2E UAT VALIDATION SUITE', async (suite) => {

  // Test Identities matching Staging Seeded Fixtures
  const adminUid = 'fOA2tu4QflesR0uQHcTOywP8DDs1'; // Nitish Yadav (Admin)
  const adminToken = `Bearer test-token-admin-${adminUid}`;

  const psychUid = 'psych_staging_01'; // Dr. Sarah Jenkins (Approved Clinician)
  const psychToken = `Bearer test-token-psychologist-${psychUid}`;

  const patientUid = 'patient_staging_01'; // Alex Mercer (Assigned Patient)
  const patientToken = `Bearer test-token-patient-${patientUid}`;

  const otherPatientUid = 'patient_unrelated_01'; // Unrelated Patient
  const otherPatientToken = `Bearer test-token-patient-${otherPatientUid}`;

  const unassignedPsychUid = 'psych_unassigned_01'; // Unassigned Clinician
  const unassignedPsychToken = `Bearer test-token-psychologist-${unassignedPsychUid}`;

  const sessionId = 'ses_uat_staging_001';

  // Seed test in-memory state for isolated test execution
  await firebaseRtdbAdapter.set(`users/${adminUid}`, {
    uid: adminUid,
    role: 'admin',
    email: 'admin.staging@psyco.clinic',
    fullName: 'Staging Administrator',
    accountStatus: 'active',
  });

  await firebaseRtdbAdapter.set(`users/${psychUid}`, {
    uid: psychUid,
    role: 'psychologist',
    email: 'dr.staging.clinician@psyco.clinic',
    accountStatus: 'active',
  });
  await firebaseRtdbAdapter.set(`psychologists/${psychUid}`, {
    id: psychUid,
    approvalStatus: 'approved',
    fullName: 'Dr. Sarah Jenkins, PsyD',
  });

  await firebaseRtdbAdapter.set(`users/${patientUid}`, {
    uid: patientUid,
    role: 'patient',
    email: 'staging.patient@example.com',
    accountStatus: 'active',
  });
  await firebaseRtdbAdapter.set(`patients/${patientUid}`, {
    id: patientUid,
    fullName: 'Alex Mercer',
    assignedPsychologistIds: { [psychUid]: true },
  });

  await firebaseRtdbAdapter.set(`users/${otherPatientUid}`, {
    uid: otherPatientUid,
    role: 'patient',
    email: 'other@example.com',
    accountStatus: 'active',
  });
  await firebaseRtdbAdapter.set(`patients/${otherPatientUid}`, {
    id: otherPatientUid,
    fullName: 'Other Patient',
    assignedPsychologistIds: {},
  });

  await firebaseRtdbAdapter.set(`users/${unassignedPsychUid}`, {
    uid: unassignedPsychUid,
    role: 'psychologist',
    email: 'unassigned@example.com',
    accountStatus: 'active',
  });
  await firebaseRtdbAdapter.set(`psychologists/${unassignedPsychUid}`, {
    id: unassignedPsychUid,
    approvalStatus: 'approved',
  });

  // Seed existing confirmed appointment for conflict detection
  await firebaseRtdbAdapter.set('appointments/apt_staging_001', {
    id: 'apt_staging_001',
    patientId: patientUid,
    psychologistId: psychUid,
    startTime: '2026-11-04T10:00:00Z',
    endTime: '2026-11-04T10:50:00Z',
    status: 'confirmed',
  });

  // Seed session record for clinical notes
  await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, {
    id: sessionId,
    appointmentId: 'apt_staging_001',
    patientId: patientUid,
    psychologistId: psychUid,
    status: 'in_progress',
    startTime: '2026-11-04T10:00:00Z',
  });

  // =========================================================================
  // PHASE 1: ENVIRONMENT INTEGRITY & PRODUCTION SHIELD
  // =========================================================================
  await suite.test('Phase 1: Environment Integrity & Health Diagnostic', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'HEALTHY');
    assert.equal(res.body.data.storagePolicy.database, 'Firebase Realtime Database (Fixed)');
    assert.equal(res.body.data.storagePolicy.binaryMediaAllowed, false);
    assert.equal(res.body.data.storagePolicy.persistentAudioSaved, false);

    // Verify Production Target Guard rejects psyco-9c13d
    const origProject = config.firebase.projectId;
    const origDb = config.firebase.databaseURL;
    try {
      config.firebase.projectId = 'psyco-9c13d';
      config.firebase.databaseURL = 'https://psyco-9c13d-default-rtdb.firebaseio.com';
      await assert.rejects(
        async () => { await seedStagingEnvironment({ dryRun: false }); },
        /Refusing to seed synthetic staging data into primary\/production database/
      );
    } finally {
      config.firebase.projectId = origProject;
      config.firebase.databaseURL = origDb;
    }
  });

  // =========================================================================
  // PHASE 2: AUTHENTICATION & ACCESS GATES
  // =========================================================================
  await suite.test('Phase 2: Authentication & Token Security', async () => {
    // 2.1 Unauthenticated request is rejected
    const unauthRes = await request(app).get('/api/v1/profile/me');
    assert.equal(unauthRes.status, 401);
    assert.equal(unauthRes.body.error.code, 'UNAUTHORIZED');

    // 2.2 Invalid token signature is rejected
    const badTokenRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', 'Bearer invalid-token-sig');
    assert.equal(badTokenRes.status, 401);

    // 2.3 Verify admin account role in RTDB is strictly admin
    const adminUser = await firebaseRtdbAdapter.get(`users/${adminUid}`);
    assert.equal(adminUser.role, 'admin');
    assert.equal(adminUser.email, 'admin.staging@psyco.clinic');
  });

  // =========================================================================
  // PHASE 3: PATIENT PORTAL WORKFLOWS
  // =========================================================================
  await suite.test('Phase 3: Patient Portal Functionality & Isolation', async () => {
    // 3.1 Patient loads own profile
    const profileRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', patientToken);
    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.data.role, 'patient');

    // 3.2 Patient views own appointments
    const aptRes = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', patientToken);
    assert.equal(aptRes.status, 200);
    assert.ok(Array.isArray(aptRes.body.data.appointments));

    // 3.3 Cross-Patient Privacy: Patient A cannot access Patient B's chart
    const crossRes = await request(app)
      .get(`/api/v1/clinical/patients/${otherPatientUid}/chart`)
      .set('Authorization', patientToken);
    assert.equal(crossRes.status, 403);

    // 3.4 Patient cannot access Admin Metrics
    const adminGateRes = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', patientToken);
    assert.equal(adminGateRes.status, 403);
  });

  // =========================================================================
  // PHASE 4: PSYCHOLOGIST PORTAL WORKFLOWS
  // =========================================================================
  await suite.test('Phase 4: Psychologist Portal & Clinical Workflows', async () => {
    // 4.1 Clinician views own practice profile
    const psychProfile = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', psychToken);
    assert.equal(psychProfile.status, 200);
    assert.equal(psychProfile.body.data.role, 'psychologist');

    // 4.2 Clinician views authorized appointments
    const aptList = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', psychToken);
    assert.equal(aptList.status, 200);

    // 4.3 Clinician creates SOAP note draft
    const noteDraft = {
      sessionId: sessionId,
      patientId: patientUid,
      format: 'SOAP',
      content: {
        subjective: 'Patient reports mild stress at work.',
        objective: 'Calm, cooperative.',
        assessment: 'Situational stress.',
        plan: 'Practice mindfulness exercise.',
      },
    };
    const draftRes = await request(app)
      .post('/api/v1/clinical/notes/draft')
      .set('Authorization', psychToken)
      .send(noteDraft);
    assert.equal(draftRes.status, 201);
    assert.equal(draftRes.body.data.note.status, 'draft');

    // 4.4 Unassigned clinician blocked from patient chart
    const unassignedRes = await request(app)
      .get(`/api/v1/clinical/patients/${patientUid}/chart`)
      .set('Authorization', unassignedPsychToken);
    assert.equal(unassignedRes.status, 403);
    assert.match(unassignedRes.body.error.message, /Access denied/);
  });

  // =========================================================================
  // PHASE 5: ADMINISTRATOR PORTAL & CLINICAL PRIVACY BARRIER
  // =========================================================================
  await suite.test('Phase 5: Administrator Portal & Privacy Lockout', async () => {
    // 5.1 Admin accesses operational metrics
    const adminMetrics = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', adminToken);
    assert.equal(adminMetrics.status, 200);
    assert.equal(adminMetrics.body.success, true);
    assert.ok(adminMetrics.body.data.systemUptimeSeconds !== undefined || adminMetrics.body.data.totalUsers !== undefined);

    // 5.2 CRITICAL INVARIANT: Admin barred from reading psychotherapy notes
    const chartAttempt = await request(app)
      .get(`/api/v1/clinical/patients/${patientUid}/chart`)
      .set('Authorization', adminToken);
    assert.equal(chartAttempt.status, 403);
    assert.match(chartAttempt.body.error.message, /Administrative accounts are barred/);
  });

  // =========================================================================
  // PHASE 6: SCHEDULING ENGINE & CONFLICT PREVENTION
  // =========================================================================
  await suite.test('Phase 6: Scheduling Conflict Engine & Lead-Time Rules', async () => {
    // 6.1 Conflict Engine: Rejects overlapping appointment
    const conflictRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken)
      .send({
        psychologistId: psychUid,
        startTime: '2026-11-04T10:00:00Z',
        endTime: '2026-11-04T10:50:00Z',
        sessionMode: 'online',
        type: 'individual_therapy',
      });
    // Should be conflict (409) since apt_staging_001 is confirmed in that slot
    assert.equal(conflictRes.status, 409);
    assert.equal(conflictRes.body.error.code, 'SLOT_ALREADY_RESERVED');

    // 6.2 Schema validation: Invalid session mode is rejected with 400
    const invalidModeRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken)
      .send({
        psychologistId: psychUid,
        startTime: '2026-11-10T14:00:00Z',
        endTime: '2026-11-10T14:50:00Z',
        sessionMode: 'invalid_telepathy_mode',
      });
    assert.equal(invalidModeRes.status, 400);
    assert.equal(invalidModeRes.body.error.code, 'VALIDATION_ERROR');
  });

  // =========================================================================
  // PHASE 7: CLINICAL SAFETY & CRITICAL RISK SIGNAL GATING
  // =========================================================================
  await suite.test('Phase 7: Clinical Safety & Q9 Suicide Risk Gate', async () => {
    // Create session for risk testing
    const testSessionId = `ses_risk_test_${Date.now()}`;
    await firebaseRtdbAdapter.set(`sessionRecords/${testSessionId}`, {
      id: testSessionId,
      psychologistId: psychUid,
      patientId: patientUid,
      status: 'in_progress',
      startTime: new Date().toISOString(),
    });

    // Create active unreviewed risk flag
    const testFlagId = `flg_test_${Date.now()}`;
    await firebaseRtdbAdapter.set(`riskReviewFlags/${testFlagId}`, {
      id: testFlagId,
      sessionId: testSessionId,
      psychologistId: psychUid,
      patientId: patientUid,
      category: 'suicide_risk_q9',
      severity: 'critical',
      reviewStatus: 'pending_review',
    });

    // Clinician attempts to finalize session without acknowledging critical risk flag
    const finalizeBlocked = await request(app)
      .post(`/api/v1/clinical/sessions/${testSessionId}/finalize`)
      .set('Authorization', psychToken);
    assert.equal(finalizeBlocked.status, 412);
    assert.match(finalizeBlocked.body.error.message, /active clinical risk-review flags require clinician acknowledgment/);

    // Clinician acknowledges risk flag
    const ackRes = await request(app)
      .post(`/api/v1/risk-review/flags/${testFlagId}/acknowledge`)
      .set('Authorization', psychToken)
      .send({ clinicalAction: 'Safety plan implemented and emergency contact notified.' });
    assert.equal(ackRes.status, 200);

    // Finalize now succeeds and marks session finalized
    const finalizeSuccess = await request(app)
      .post(`/api/v1/clinical/sessions/${testSessionId}/finalize`)
      .set('Authorization', psychToken);
    assert.equal(finalizeSuccess.status, 200);
    assert.equal(finalizeSuccess.body.data.session.status, 'finalized');
  });

  // =========================================================================
  // PHASE 8: STORAGE POLICY INVARIANTS (TEXT ONLY)
  // =========================================================================
  await suite.test('Phase 8: Text-Only Invariant & Binary Media Denial', () => {
    // Assert base64 audio payload rejected
    assert.throws(
      () => {
        firebaseRtdbAdapter.assertValidPayload({
          data: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
        });
      },
      /Base64-encoded binary media is strictly forbidden/
    );

    // Assert base64 image payload rejected
    assert.throws(
      () => {
        firebaseRtdbAdapter.assertValidPayload({
          avatar: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
        });
      },
      /Base64-encoded binary media is strictly forbidden/
    );

    // Assert oversized payload (>5MB) rejected
    assert.throws(
      () => {
        firebaseRtdbAdapter.assertValidPayload({
          largeData: 'A'.repeat(6 * 1024 * 1024),
        });
      },
      /Payload exceeds 5MB limit/
    );
  });
});
