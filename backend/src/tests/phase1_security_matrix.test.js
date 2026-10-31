import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import crypto from 'crypto';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';

test('Phase 1: Security, Authorization, Patient Privacy & ReBAC Matrix Suite', async (t) => {
  const patientA_Uid = 'patient_p1_sec_01';
  const patientB_Uid = 'patient_p1_sec_02';
  const psychPending_Uid = 'psych_p1_pending_01';
  const psychApproved_Uid = 'psych_p1_approved_01';
  const psychUnassigned_Uid = 'psych_p1_unassigned_01';
  const admin_Uid = 'admin_p1_sec_01';

  const patientA_Token = `Bearer test-token-patient-${patientA_Uid}`;
  const patientB_Token = `Bearer test-token-patient-${patientB_Uid}`;
  const psychPending_Token = `Bearer test-token-psychologist-${psychPending_Uid}`;
  const psychApproved_Token = `Bearer test-token-psychologist-${psychApproved_Uid}`;
  const psychUnassigned_Token = `Bearer test-token-psychologist-${psychUnassigned_Uid}`;
  const admin_Token = `Bearer test-token-admin-${admin_Uid}`;

  // -------------------------------------------------------------
  // Test Setup: Seed users and records
  // -------------------------------------------------------------
  await t.test('0. Setup: Seed fixture accounts', async () => {
    // Admin user
    await firebaseRtdbAdapter.set(`users/${admin_Uid}`, {
      uid: admin_Uid,
      email: 'admin@psyco-ai.internal',
      role: 'admin',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });

    // Patient A onboard
    const pARes = await request(app)
      .post('/api/v1/profile/onboard/patient')
      .set('Authorization', patientA_Token)
      .send({
        fullName: 'Patient Alpha',
        gender: 'female',
        age: 28,
        phone: '+1 555-0101',
        role: 'admin', // Privilege escalation attempt: must be ignored by server
      });
    assert.equal(pARes.status, 201);
    assert.equal(pARes.body.data.user.role, 'patient', 'Server must enforce patient role on patient onboarding');

    // Submit intake for Patient A
    const intakeRes = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', patientA_Token)
      .send({
        sectionA: {
          occupation: 'Engineer',
          maritalStatus: 'Married',
          emergencyContactName: 'Bob Alpha',
          emergencyContactPhone: '+1 555-0199',
          emergencyContactRelationship: 'Spouse',
        },
        sectionB: {
          primaryReasons: ['Generalized Anxiety'],
          symptomDuration: '1-6 months',
          severityRating: 6,
          therapyGoals: 'Manage work stress',
        },
        sectionC: {
          previousTherapy: false,
          previousDiagnoses: 'None',
          currentMedications: 'None',
          familyMentalHealthHistory: 'None',
          medicalConditions: 'None',
        },
        sectionD: {
          sleepQuality: 'fair',
          exerciseFrequency: 'occasional',
          supportSystemRating: 4,
          substanceUseDetails: 'None',
        },
        sectionE: {
          suicidalIdeationPastMonth: false,
          selfHarmHistory: false,
          immediateRiskAcknowledged: false,
          safetyNotes: 'None',
        },
        sectionF: {
          consentToTreatment: true,
          aiAssistanceAcknowledged: true,
          telehealthConsent: true,
          privacyNoticeAcknowledged: true,
          signatureName: 'Patient Alpha',
        },
      });
    assert.equal(intakeRes.status, 201);

    // Patient B onboard
    const pBRes = await request(app)
      .post('/api/v1/profile/onboard/patient')
      .set('Authorization', patientB_Token)
      .send({
        fullName: 'Patient Beta',
        gender: 'male',
        age: 35,
        phone: '+1 555-0102',
      });
    assert.equal(pBRes.status, 201);

    // Psychologist 1: Pending Verification
    const psychPendingRes = await request(app)
      .post('/api/v1/profile/onboard/psychologist')
      .set('Authorization', psychPending_Token)
      .send({
        fullName: 'Dr. Pending Clinician',
        licenseNumber: 'PSY-PENDING-001',
        specializations: ['CBT'],
        offeredModes: 'online',
        approvalStatus: 'approved', // Privilege escalation attempt: must be ignored by server
        verified: true,
      });
    assert.equal(psychPendingRes.status, 201);
    assert.equal(psychPendingRes.body.data.profile.approvalStatus, 'pending', 'Onboarded psychologist must default to pending');
    assert.equal(psychPendingRes.body.data.profile.verified, false, 'Onboarded psychologist must not be auto-verified');

    // Psychologist 2: Approved Clinician
    const psychApprovedRes = await request(app)
      .post('/api/v1/profile/onboard/psychologist')
      .set('Authorization', psychApproved_Token)
      .send({
        fullName: 'Dr. Approved Clinician',
        licenseNumber: 'PSY-APPROVED-001',
        specializations: ['CBT', 'Anxiety'],
        offeredModes: 'both',
      });
    assert.equal(psychApprovedRes.status, 201);
    await firebaseRtdbAdapter.set(`psychologists/${psychApproved_Uid}/approvalStatus`, 'approved');
    await firebaseRtdbAdapter.set(`psychologists/${psychApproved_Uid}/verified`, true);
    await firebaseRtdbAdapter.set(`users/${psychApproved_Uid}/accountStatus`, 'active');

    // Psychologist 3: Unassigned Approved Clinician
    const psychUnassignedRes = await request(app)
      .post('/api/v1/profile/onboard/psychologist')
      .set('Authorization', psychUnassigned_Token)
      .send({
        fullName: 'Dr. Unassigned Clinician',
        licenseNumber: 'PSY-UNASSIGNED-001',
        specializations: ['Trauma'],
        offeredModes: 'both',
      });
    assert.equal(psychUnassignedRes.status, 201);
    await firebaseRtdbAdapter.set(`psychologists/${psychUnassigned_Uid}/approvalStatus`, 'approved');
    await firebaseRtdbAdapter.set(`psychologists/${psychUnassigned_Uid}/verified`, true);
    await firebaseRtdbAdapter.set(`users/${psychUnassigned_Uid}/accountStatus`, 'active');

    // Establish therapeutic relationship between psychApproved and patientA via an appointment
    const aptRecord = {
      id: 'apt_sec_test_001',
      patientId: patientA_Uid,
      psychologistId: psychApproved_Uid,
      date: '2026-11-20',
      startTime: '10:00',
      endTime: '11:00',
      mode: 'online',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    await firebaseRtdbAdapter.set('appointments/apt_sec_test_001', aptRecord);
  });

  // -------------------------------------------------------------
  // Category 1: Patient Isolation & Privilege Escalation Defense
  // -------------------------------------------------------------
  await t.test('1.1 Patient cannot tamper with role or access clinician profile modification', async () => {
    // Attempting to access psychologist profile update as patient returns 403 INSUFFICIENT_ROLE_PERMISSIONS
    const res = await request(app)
      .put('/api/v1/profile/psychologist')
      .set('Authorization', patientA_Token)
      .send({
        bio: 'Hacked clinician profile',
      });
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INSUFFICIENT_ROLE_PERMISSIONS');

    // Patient updating their own profile cannot change role in database
    await request(app)
      .put('/api/v1/profile/patient')
      .set('Authorization', patientA_Token)
      .send({
        preferredName: 'Patient Alpha Updated',
        role: 'admin',
      });
    const userInDb = await firebaseRtdbAdapter.get(`users/${patientA_Uid}`);
    assert.equal(userInDb.role, 'patient', 'User role must remain patient');
  });

  await t.test('1.2 Patient A cannot read Patient B intake form via psychologist route', async () => {
    const res = await request(app)
      .get(`/api/v1/intake/patient/${patientB_Uid}`)
      .set('Authorization', patientA_Token);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('1.3 Patient A can read their own intake form via /my-intake', async () => {
    const res = await request(app)
      .get('/api/v1/intake/my-intake')
      .set('Authorization', patientA_Token);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.patientId, patientA_Uid);
    assert.equal(res.body.data.intake.sectionB.therapyGoals, 'Manage work stress');
  });

  await t.test('1.4 Patient cannot access clinical patient chart endpoint', async () => {
    const res = await request(app)
      .get(`/api/v1/clinical/patients/${patientA_Uid}/chart`)
      .set('Authorization', patientA_Token);
    assert.equal(res.status, 403);
  });

  // -------------------------------------------------------------
  // Category 2: Clinician Verification & ReBAC Relationship Boundaries
  // -------------------------------------------------------------
  await t.test('2.1 Pending psychologist cannot access clinical endpoints', async () => {
    const res = await request(app)
      .get(`/api/v1/clinical/patients/${patientA_Uid}/chart`)
      .set('Authorization', psychPending_Token);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'PSYCHOLOGIST_NOT_VERIFIED');
  });

  await t.test('2.2 Pending psychologist cannot read patient intake form', async () => {
    const res = await request(app)
      .get(`/api/v1/intake/patient/${patientA_Uid}`)
      .set('Authorization', psychPending_Token);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'PSYCHOLOGIST_NOT_VERIFIED');
  });

  await t.test('2.3 Pending psychologist is NOT visible in public directory', async () => {
    const res = await request(app).get('/api/v1/psychologists');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const directory = res.body.data.psychologists;
    const foundPending = directory.find((p) => p.uid === psychPending_Uid);
    assert.equal(foundPending, undefined, 'Pending clinician must not appear in public directory');
    const foundApproved = directory.find((p) => p.uid === psychApproved_Uid);
    assert.ok(foundApproved, 'Approved clinician must appear in public directory');
  });

  await t.test('2.4 Unassigned verified psychologist is denied patient chart access (ReBAC)', async () => {
    const res = await request(app)
      .get(`/api/v1/clinical/patients/${patientA_Uid}/chart`)
      .set('Authorization', psychUnassigned_Token);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('2.5 Unassigned verified psychologist is denied patient intake form (ReBAC)', async () => {
    const res = await request(app)
      .get(`/api/v1/intake/patient/${patientA_Uid}`)
      .set('Authorization', psychUnassigned_Token);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('2.6 Assigned verified psychologist can read patient chart and intake', async () => {
    const chartRes = await request(app)
      .get(`/api/v1/clinical/patients/${patientA_Uid}/chart`)
      .set('Authorization', psychApproved_Token);
    assert.equal(chartRes.status, 200);
    assert.equal(chartRes.body.success, true);
    assert.equal(chartRes.body.data.chart.patient.id, patientA_Uid);

    const intakeRes = await request(app)
      .get(`/api/v1/intake/patient/${patientA_Uid}`)
      .set('Authorization', psychApproved_Token);
    assert.equal(intakeRes.status, 200);
    assert.equal(intakeRes.body.success, true);
    assert.equal(intakeRes.body.data.patientId, patientA_Uid);
    assert.equal(intakeRes.body.data.intake.sectionB.therapyGoals, 'Manage work stress');
  });

  // -------------------------------------------------------------
  // Category 3: Admin Clinical Privacy Barrier
  // -------------------------------------------------------------
  await t.test('3.1 Admin is strictly blocked from clinical patient chart', async () => {
    const res = await request(app)
      .get(`/api/v1/clinical/patients/${patientA_Uid}/chart`)
      .set('Authorization', admin_Token);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
  });

  await t.test('3.2 Admin is strictly blocked from clinical notes drafting', async () => {
    const res = await request(app)
      .post('/api/v1/clinical/notes/draft')
      .set('Authorization', admin_Token)
      .send({
        patientId: patientA_Uid,
        content: 'Unauthorized administrative clinical note',
      });
    assert.equal(res.status, 403);
  });

  await t.test('3.3 Admin is strictly blocked from patient intake record', async () => {
    const res = await request(app)
      .get(`/api/v1/intake/patient/${patientA_Uid}`)
      .set('Authorization', admin_Token);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
  });

  await t.test('3.4 Admin can review and approve a pending psychologist', async () => {
    const reviewRes = await request(app)
      .post(`/api/v1/admin/psychologists/${psychPending_Uid}/review`)
      .set('Authorization', admin_Token)
      .send({
        approved: true,
        reason: 'Credentials and state license verified successfully.',
      });
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.body.success, true);
    assert.equal(reviewRes.body.data.approvalStatus, 'approved');

    // Verify database reflects approval in both nodes
    const psychNode = await firebaseRtdbAdapter.get(`psychologists/${psychPending_Uid}`);
    const userNode = await firebaseRtdbAdapter.get(`users/${psychPending_Uid}`);
    assert.equal(psychNode.approvalStatus, 'approved');
    assert.equal(userNode.approvalStatus, 'approved');
  });

  // -------------------------------------------------------------
  // Category 4: Google Calendar OAuth State Cryptographic Verification
  // -------------------------------------------------------------
  await t.test('4.1 OAuth state rejects tampered HMAC signature', async () => {
    const secret = googleCalendarAdapter.getStateSecret();
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 600000;
    const uid = psychApproved_Uid;

    // Tampered signature
    const forgedSig = '0000000000000000000000000000000000000000000000000000000000000000';
    const statePayload = JSON.stringify({ uid, nonce, expiresAt, sig: forgedSig });
    const encodedState = Buffer.from(statePayload).toString('base64url');

    await assert.rejects(
      async () => {
        await googleCalendarAdapter.handleOAuthCallback('fake-code', encodedState);
      },
      (err) => {
        assert.match(err.message, /signature verification failed/i);
        return true;
      }
    );
  });

  await t.test('4.2 OAuth state rejects expired states', async () => {
    const secret = googleCalendarAdapter.getStateSecret();
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiredAt = Date.now() - 10000; // In the past
    const uid = psychApproved_Uid;

    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${uid}:${nonce}:${expiredAt}`)
      .digest('hex');

    const statePayload = JSON.stringify({ uid, nonce, expiresAt: expiredAt, sig });
    const encodedState = Buffer.from(statePayload).toString('base64url');

    await assert.rejects(
      async () => {
        await googleCalendarAdapter.handleOAuthCallback('fake-code', encodedState);
      },
      (err) => {
        assert.match(err.message, /expired/i);
        return true;
      }
    );
  });

  await t.test('4.3 OAuth state rejects replay/reused states', async () => {
    const secret = googleCalendarAdapter.getStateSecret();
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 600000;
    const uid = psychApproved_Uid;

    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${uid}:${nonce}:${expiresAt}`)
      .digest('hex');

    // Register state as already used in RTDB
    await firebaseRtdbAdapter.set(`googleOAuthStates/${nonce}`, {
      uid,
      nonce,
      expiresAt,
      used: true, // Already consumed!
      createdAt: new Date().toISOString(),
    });

    const statePayload = JSON.stringify({ uid, nonce, expiresAt, sig });
    const encodedState = Buffer.from(statePayload).toString('base64url');

    await assert.rejects(
      async () => {
        await googleCalendarAdapter.handleOAuthCallback('fake-code', encodedState);
      },
      (err) => {
        assert.match(err.message, /already been used/i);
        return true;
      }
    );
  });

  // -------------------------------------------------------------
  // Category 5: Health & Liveness Probes Non-Leakage
  // -------------------------------------------------------------
  await t.test('5.1 GET /api/v1/health/liveness returns 200 UP without secrets', async () => {
    const res = await request(app).get('/api/v1/health/liveness');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'UP');
    assert.ok(res.body.data.uptimeSeconds >= 0);

    const bodyStr = JSON.stringify(res.body);
    assert.ok(!bodyStr.includes('BEGIN PRIVATE KEY'), 'Liveness must never leak private keys');
  });

  await t.test('5.2 GET /api/v1/health/readiness returns structured readiness checks', async () => {
    const res = await request(app).get('/api/v1/health/readiness');
    // In test environment, returns 200 or 503 depending on live credentials, but must return valid envelope
    assert.ok(res.status === 200 || res.status === 503);
    const body = res.body;
    assert.ok(body.data?.checks || body.error);
    const bodyStr = JSON.stringify(body);
    assert.ok(!bodyStr.includes('BEGIN PRIVATE KEY'), 'Readiness must never leak private keys');
  });
});
