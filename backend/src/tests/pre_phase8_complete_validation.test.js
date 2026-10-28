process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { assessmentScoringService } from '../services/assessmentScoring.service.js';
import { INSTRUMENT_DEFINITIONS } from '../constants/assessments.js';
import { assemblyaiAdapter } from '../integrations/assemblyai/assemblyaiAdapter.js';
import { GeminiAdapter } from '../integrations/gemini/geminiAdapter.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';

test('PRE-PHASE 8 COMPLETE APPLICATION VALIDATION (Workflows A through J)', async (suite) => {
  const timestamp = Date.now();
  const testPatientId = `pat_pre8_${timestamp}_01`;
  const testPsychId = `psych_pre8_${timestamp}_01`;
  const otherPatientId = `pat_pre8_other_${timestamp}_02`;
  const unapprovedPsychId = `psych_unapproved_${timestamp}_02`;
  const adminId = `admin_pre8_${timestamp}_01`;

  const patientToken = `Bearer test-token-patient-${testPatientId}`;
  const psychToken = `Bearer test-token-psychologist-${testPsychId}`;
  const otherPatientToken = `Bearer test-token-patient-${otherPatientId}`;
  const unapprovedPsychToken = `Bearer test-token-psychologist-${unapprovedPsychId}`;
  const adminToken = `Bearer test-token-admin-${adminId}`;

  // =========================================================================
  // WORKFLOW A: PATIENT ONBOARDING & PROFILE LIFECYCLE
  // =========================================================================
  await suite.test('Workflow A: Patient Onboarding, Profile & Persistence', async () => {
    // 1. Seed user profile in RTDB
    await firebaseRtdbAdapter.set(`users/${testPatientId}`, {
      uid: testPatientId,
      email: `patient_${timestamp}@psyco.test`,
      role: 'patient',
      createdAt: new Date().toISOString(),
    });

    await firebaseRtdbAdapter.set(`patients/${testPatientId}`, {
      id: testPatientId,
      fullName: 'Synthetic Jane Doe',
      gender: 'female',
      age: 32,
      assignedPsychologistIds: { [testPsychId]: true },
      intakeStatus: 'completed',
    });

    // 2. Fetch profile via API
    const profileRes = await request(app)
      .get('/api/v1/profile/me')
      .set('Authorization', patientToken);

    assert.equal(profileRes.status, 200);
    assert.ok(profileRes.body.data?.email || profileRes.body.email);

    // 3. Update profile
    const updateRes = await request(app)
      .put('/api/v1/profile/patient')
      .set('Authorization', patientToken)
      .send({ preferredName: 'Jane D.', phone: '+15551234567' });

    assert.equal(updateRes.status, 200);

    // 4. Verify persistence in RTDB directly
    const storedPatient = await firebaseRtdbAdapter.get(`patients/${testPatientId}`);
    assert.equal(storedPatient.preferredName, 'Jane D.');
    assert.equal(storedPatient.phone, '+15551234567');
  });

  // =========================================================================
  // WORKFLOW B: PSYCHOLOGIST ONBOARDING & ADMIN APPROVAL
  // =========================================================================
  await suite.test('Workflow B: Psychologist Onboarding & Admin Approval Enforcement', async () => {
    // 1. Create newly registered psychologist (approvalStatus: pending)
    await firebaseRtdbAdapter.set(`users/${unapprovedPsychId}`, {
      uid: unapprovedPsychId,
      email: `unapproved_${timestamp}@psyco.test`,
      role: 'psychologist',
    });
    await firebaseRtdbAdapter.set(`psychologists/${unapprovedPsychId}`, {
      id: unapprovedPsychId,
      fullName: 'Dr. Pending Approval, PsyD',
      licenseNumber: 'PSY-TEST-999',
      approvalStatus: 'pending',
    });

    // 2. Unapproved psychologist cannot be queried in public directory
    const publicPsychRes = await request(app)
      .get(`/api/v1/psychologists/${unapprovedPsychId}`);
    assert.equal(publicPsychRes.status, 404);

    // 3. Admin reviews and approves psychologist
    const approveRes = await request(app)
      .post(`/api/v1/admin/psychologists/${unapprovedPsychId}/approve`)
      .set('Authorization', adminToken);
    assert.equal(approveRes.status, 200);

    // 4. Verify approved in RTDB
    const updatedPsych = await firebaseRtdbAdapter.get(`psychologists/${unapprovedPsychId}`);
    assert.equal(updatedPsych.approvalStatus, 'approved');

    // 5. Approved psychologist now visible in public directory
    const approvedPublicRes = await request(app)
      .get(`/api/v1/psychologists/${unapprovedPsychId}`);
    assert.equal(approvedPublicRes.status, 200);
  });

  // =========================================================================
  // WORKFLOW C: APPOINTMENT SCHEDULING & CONCURRENT BOOKING SAFEGUARDS
  // =========================================================================
  let testAptId = null;
  await suite.test('Workflow C: Appointment Booking & Conflict Detection', async () => {
    // Seed approved psychologist
    await firebaseRtdbAdapter.set(`users/${testPsychId}`, {
      uid: testPsychId,
      email: `psych_${timestamp}@psyco.test`,
      role: 'psychologist',
    });
    await firebaseRtdbAdapter.set(`psychologists/${testPsychId}`, {
      id: testPsychId,
      fullName: 'Dr. Verified Clinician, PhD',
      approvalStatus: 'approved',
    });

    // Configure working hours and availability
    await firebaseRtdbAdapter.set(`availability/${testPsychId}`, {
      psychologistId: testPsychId,
      weeklySchedule: {
        monday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
      },
      bufferMinutes: 10,
      sessionDuration: 50,
    });

    // Patient books appointment
    const bookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken)
      .send({
        psychologistId: testPsychId,
        startTime: '2026-11-02T10:00:00Z',
        endTime: '2026-11-02T10:50:00Z',
        type: 'individual_therapy',
        notes: 'Initial consultation request',
      });

    assert.equal(bookRes.status, 201);
    testAptId = bookRes.body.data?.appointment?.id || bookRes.body.appointment?.id;
    assert.ok(testAptId);

    // Concurrent double-booking rejection test: second booking for same slot must be rejected
    const conflictRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', otherPatientToken)
      .send({
        psychologistId: testPsychId,
        startTime: '2026-11-02T10:00:00Z',
        endTime: '2026-11-02T10:50:00Z',
        type: 'individual_therapy',
      });

    assert.equal(conflictRes.status, 409); // Conflict rejection
  });

  // =========================================================================
  // WORKFLOW D: CLINICAL SESSION WORKSPACE & NOTES
  // =========================================================================
  let testSessionId = null;
  await suite.test('Workflow D: Session Workspace, SOAP Documentation & Sign-off', async () => {
    // Create or get session from appointment
    const sessionRes = await request(app)
      .post(`/api/v1/clinical/sessions/appointment/${testAptId}`)
      .set('Authorization', psychToken);

    assert.equal(sessionRes.status, 200);
    const sessionData = sessionRes.body.data?.session || sessionRes.body.session;
    testSessionId = sessionData.id;
    assert.ok(testSessionId);

    // Start clinical session
    const startRes = await request(app)
      .post(`/api/v1/clinical/sessions/${testSessionId}/start`)
      .set('Authorization', psychToken);
    assert.equal(startRes.status, 200);

    // Create SOAP Note Draft
    const noteRes = await request(app)
      .post('/api/v1/clinical/notes/draft')
      .set('Authorization', psychToken)
      .send({
        sessionId: testSessionId,
        patientId: testPatientId,
        format: 'SOAP',
        content: {
          subjective: 'Patient reports improved sleep hygiene and adherence to bedtime relaxation exercises.',
          objective: 'Affect congruent, speech coherent, cooperative engagement observed.',
          assessment: 'Progress observed towards anxiety management goals. Symptoms stable.',
          plan: 'Continue weekly cognitive-behavioral restructuring; review journal next session.',
        },
      });

    assert.equal(noteRes.status, 201);
    const noteData = noteRes.body.data?.note || noteRes.body.note;
    assert.equal(noteData.status, 'draft');

    // Finalize the clinical note
    const finalizeNoteRes = await request(app)
      .post(`/api/v1/clinical/notes/${noteData.id}/finalize`)
      .set('Authorization', psychToken);

    assert.equal(finalizeNoteRes.status, 200);
    const finalizedNote = finalizeNoteRes.body.data?.note || finalizeNoteRes.body.note;
    assert.equal(finalizedNote.status, 'finalized');
    assert.ok(finalizedNote.finalizedAt);
  });

  // =========================================================================
  // WORKFLOW E: EXTERNAL INTEGRATIONS (HEALTH & METADATA)
  // =========================================================================
  await suite.test('Workflow E: External Integration Health Check & Offline Fallbacks', async () => {
    const healthRes = await request(app).get('/api/v1/health');
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.data.status, 'HEALTHY');
    assert.equal(healthRes.body.data.storagePolicy.database, 'Firebase Realtime Database (Fixed)');
    assert.equal(healthRes.body.data.storagePolicy.binaryMediaAllowed, false);
    assert.equal(healthRes.body.data.integrations.firebaseAuth.configured, true);
    assert.equal(healthRes.body.data.integrations.firebaseRtdb.configured, true);
    assert.equal(healthRes.body.data.integrations.geminiClinicalCopilot.configured, true);
    assert.equal(healthRes.body.data.integrations.assemblyaiTranscription.configured, true);

    // Google Calendar handled gracefully
    const gcalStatus = googleCalendarAdapter.getStatus();
    assert.equal(typeof gcalStatus.configured, 'boolean');
  });

  // =========================================================================
  // WORKFLOW F: TRANSCRIPTION STREAMING & GEMINI CLINICAL COPILOT
  // =========================================================================
  await suite.test('Workflow F: AssemblyAI Ephemeral Token & Gemini Copilot Drafts', async () => {
    // 1. AssemblyAI token generation
    const tokenRes = await assemblyaiAdapter.createStreamingToken(60);
    assert.ok(tokenRes.token);
    assert.ok(tokenRes.wsUrl.startsWith('wss://streaming.assemblyai.com/v3/ws'));

    // 2. Gemini Clinical Copilot draft generation
    const gemini = new GeminiAdapter();
    const context = {
      transcriptText: 'Patient: Sleep has been difficult with work anxiety. Psychologist: We will practice relaxation before bed.',
      transcriptVersion: 1,
      session: { id: testSessionId, type: 'individual_therapy' },
      patient: { id: testPatientId, fullName: 'Synthetic Jane Doe' },
    };

    const draftResult = await gemini.generateClinicalDocumentation('GENERATE_SOAP', context);
    assert.ok(draftResult.output);
    assert.ok(draftResult.output.subjective);
    assert.ok(draftResult.output.plan);
    assert.ok(draftResult.modelUsed);
  });

  // =========================================================================
  // WORKFLOW G: ASSESSMENTS, PROGRESS ANALYTICS & RISK-REVIEW
  // =========================================================================
  await suite.test('Workflow G: PHQ-9 Scoring, Historical Analytics & Critical Risk Gate', async () => {
    // 1. Psychologist assigns PHQ-9
    const assignRes = await request(app)
      .post('/api/v1/assessments/assign')
      .set('Authorization', psychToken)
      .send({
        patientId: testPatientId,
        instrumentId: 'phq-9',
        instructions: 'Complete symptom checklist.',
      });
    assert.equal(assignRes.status, 201);
    const assignmentId = assignRes.body.assignment.id;

    // 2. Patient submits with affirmative Item 9 (Score 9, Q9=1 -> Critical Safety Signal)
    const submitRes = await request(app)
      .post(`/api/v1/assessments/assignments/${assignmentId}/submit`)
      .set('Authorization', patientToken)
      .send({
        responses: {
          phq9_1: 1, phq9_2: 1, phq9_3: 1, phq9_4: 1,
          phq9_5: 1, phq9_6: 1, phq9_7: 1, phq9_8: 1, phq9_9: 1,
        },
      });
    assert.equal(submitRes.status, 200);
    assert.equal(submitRes.body.totalScore, 9);
    assert.equal(submitRes.body.safetyTriggered, true);

    // 3. Historical analytics retrieval
    const analyticsRes = await request(app)
      .get(`/api/v1/analytics/patient/${testPatientId}/progress`)
      .set('Authorization', psychToken);
    assert.equal(analyticsRes.status, 200);
    assert.ok(analyticsRes.body.analytics.instrumentMetrics['phq-9']);

    // 4. Create risk-review flag on session
    const flagId = `flg_test_${timestamp}`;
    await firebaseRtdbAdapter.set(`riskReviewFlags/${flagId}`, {
      id: flagId,
      sessionId: testSessionId,
      patientId: testPatientId,
      psychologistId: testPsychId,
      category: 'suicidal_ideation',
      severity: 'high',
      evidenceExcerpt: 'thoughts of being better off dead',
      reviewStatus: 'pending_review',
      createdAt: new Date().toISOString(),
    });

    // 5. Unreviewed flag blocks session finalization (HTTP 412)
    const blockedFinalize = await request(app)
      .post(`/api/v1/clinical/sessions/${testSessionId}/finalize`)
      .set('Authorization', psychToken);
    assert.equal(blockedFinalize.status, 412);

    // 6. Psychologist acknowledges flag
    const ackRes = await request(app)
      .post(`/api/v1/risk-review/flags/${flagId}/acknowledge`)
      .set('Authorization', psychToken)
      .send({ actionTaken: 'Safety plan discussed and verified with patient.' });
    assert.equal(ackRes.status, 200);

    // 7. Session finalization now permitted
    const finalFinalize = await request(app)
      .post(`/api/v1/clinical/sessions/${testSessionId}/finalize`)
      .set('Authorization', psychToken);
    assert.equal(finalFinalize.status, 200);
  });

  // =========================================================================
  // WORKFLOW H: PUBLIC & ADMINISTRATIVE WORKFLOWS
  // =========================================================================
  await suite.test('Workflow H: Public Contact Submissions & FAQ Moderation', async () => {
    // Public contact submission
    const contactRes = await request(app)
      .post('/api/v1/public/contact')
      .send({
        name: 'Prospective Client',
        email: 'prospective@example.com',
        subject: 'General Practice Inquiry',
        message: 'Looking for clinical psychology services in this area.',
      });
    assert.equal(contactRes.status, 201);

    // Public FAQ submission
    const faqSubRes = await request(app)
      .post('/api/v1/public/faq-submissions')
      .send({
        question: 'Does Psyco AI support automated billing exports in future phases?',
      });
    assert.equal(faqSubRes.status, 201);
  });

  // =========================================================================
  // WORKFLOW I: REBAC ACCESS SEPARATION & SECURITY SAFEGUARDS
  // =========================================================================
  await suite.test('Workflow I: ReBAC Authorization Boundaries & Admin Safeguards', async () => {
    // 1. Patient cannot access another patient's chart
    const unauthChartRes = await request(app)
      .get(`/api/v1/clinical/patients/${testPatientId}/chart`)
      .set('Authorization', otherPatientToken);
    assert.equal(unauthChartRes.status, 403);

    // 2. Admin barred from reading private psychotherapy notes
    const adminNotesRes = await request(app)
      .get(`/api/v1/clinical/patients/${testPatientId}/chart`)
      .set('Authorization', adminToken);
    assert.equal(adminNotesRes.status, 403);

    // 3. Unauthenticated requests strictly rejected
    const noAuthRes = await request(app).get('/api/v1/clinical/patients');
    assert.equal(noAuthRes.status, 401);
  });

  // =========================================================================
  // WORKFLOW J: STRICT TEXT-ONLY STORAGE AUDIT
  // =========================================================================
  await suite.test('Workflow J: Audit Text-Only Persistence (Zero Binary Media Invariant)', async () => {
    // Verify stored records across collections are text / structured JSON only
    const sampleResults = await firebaseRtdbAdapter.get(`patients/${testPatientId}`);
    assert.ok(sampleResults);
    assert.equal(typeof sampleResults, 'object');

    // Confirm no binary/base64 media is stored
    const jsonStr = JSON.stringify(sampleResults);
    assert.equal(jsonStr.includes('data:image/'), false);
    assert.equal(jsonStr.includes('data:audio/'), false);
    assert.equal(jsonStr.includes('data:video/'), false);
  });
});
