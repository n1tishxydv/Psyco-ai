import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { googleMeetAdapter } from '../integrations/googleMeet/googleMeetAdapter.js';

test('Phase 5: Session Transcription, Ambient Capture, Meet Import & Zero-Audio Persistence', async (t) => {
  const psychToken = 'Bearer test-token-psychologist-psych_p5_01';
  const psychUid = 'psych_p5_01';

  const patientToken = 'Bearer test-token-patient-patient_p5_01';
  const patientUid = 'patient_p5_01';

  const otherPsychToken = 'Bearer test-token-psychologist-other_psych_p5';
  const otherPsychUid = 'other_psych_p5';

  const adminToken = 'Bearer test-token-admin-admin_p5_01';
  const adminUid = 'admin_p5_01';

  let appointmentId = 'apt_p5_test_01';
  let sessionId = 'ses_p5_test_01';
  let transcriptId = null;
  let firstEntryId = null;

  await t.test('1. Setup test session and verified therapeutic relationship', async () => {
    // 1. Seed users
    await firebaseRtdbAdapter.set(`users/${psychUid}`, {
      uid: psychUid,
      email: 'dr.watson.p5@psyco.health',
      role: 'psychologist',
      accountStatus: 'active',
      onboardingStatus: 'complete',
      fullName: 'Dr. John Watson',
    });

    await firebaseRtdbAdapter.set(`psychologists/${psychUid}`, {
      uid: psychUid,
      fullName: 'Dr. John Watson',
      licenseNumber: 'PSY-P5-777',
      approvalStatus: 'approved',
      canPrescribe: false,
    });

    await firebaseRtdbAdapter.set(`users/${patientUid}`, {
      uid: patientUid,
      email: 'alice.p5@example.com',
      role: 'patient',
      accountStatus: 'active',
      onboardingStatus: 'complete',
      fullName: 'Alice Walker',
    });

    await firebaseRtdbAdapter.set(`patients/${patientUid}`, {
      uid: patientUid,
      fullName: 'Alice Walker',
      gender: 'female',
      age: 29,
    });

    await firebaseRtdbAdapter.set(`users/${otherPsychUid}`, {
      uid: otherPsychUid,
      email: 'dr.stranger.p5@psyco.health',
      role: 'psychologist',
      accountStatus: 'active',
      onboardingStatus: 'complete',
      fullName: 'Dr. Stephen Stranger',
    });

    await firebaseRtdbAdapter.set(`users/${adminUid}`, {
      uid: adminUid,
      email: 'admin.p5@psyco.health',
      role: 'admin',
      accountStatus: 'active',
      onboardingStatus: 'complete',
      fullName: 'Governance Admin',
    });

    // 2. Seed confirmed appointment and session
    const startTime = new Date(Date.now() + 3600000).toISOString();
    const endTime = new Date(Date.now() + 6600000).toISOString();

    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, {
      id: appointmentId,
      patientId: patientUid,
      patientName: 'Alice Walker',
      psychologistId: psychUid,
      psychologistName: 'Dr. John Watson',
      startTime,
      endTime,
      sessionMode: 'in_person',
      status: 'confirmed',
      sessionPin: '654321',
      createdAt: new Date().toISOString(),
    });

    // Create session via clinical API
    const sesRes = await request(app)
      .post(`/api/v1/clinical/sessions/appointment/${appointmentId}`)
      .set('Authorization', psychToken);

    assert.ok([200, 201].includes(sesRes.status));
    sessionId = sesRes.body.data.session.id;
    assert.ok(sessionId);
  });

  await t.test('2. Consent Enforcement Guard prior to streaming token issuance', async () => {
    // Check initial consent state (should be not_recorded)
    const checkRes = await request(app)
      .get(`/api/v1/transcription/consent/${sessionId}`)
      .set('Authorization', psychToken);

    assert.equal(checkRes.status, 200);
    assert.equal(checkRes.body.data.consentStatus, 'not_recorded');

    // Attempting to request streaming token without consent MUST fail with 400
    const tokenFailRes = await request(app)
      .post('/api/v1/transcription/token')
      .set('Authorization', psychToken)
      .send({ sessionId });

    assert.equal(tokenFailRes.status, 400);
    assert.ok((tokenFailRes.body.error?.message || '').toLowerCase().includes('consent'));

    // Record valid informed patient consent
    const consentRes = await request(app)
      .post('/api/v1/transcription/consent')
      .set('Authorization', psychToken)
      .send({
        sessionId,
        patientId: patientUid,
        consentType: 'in_person_ambient',
        confirmed: true,
        patientInformed: true,
        zeroAudioRetentionAcknowledged: true,
        notes: 'Patient verbally acknowledged zero-audio retention policy.',
      });

    assert.equal(consentRes.status, 201);
    assert.equal(consentRes.body.data.consent.status, 'granted');

    // Verify consent status is now granted
    const checkGrantedRes = await request(app)
      .get(`/api/v1/transcription/consent/${sessionId}`)
      .set('Authorization', psychToken);

    assert.equal(checkGrantedRes.status, 200);
    assert.equal(checkGrantedRes.body.data.consentStatus, 'granted');
  });

  await t.test('3. AssemblyAI v3 Token Issuance with ownership and role boundaries', async () => {
    // Unassigned psychologist attempting to request token for this session -> 404 or 403
    const unauthorizedRes = await request(app)
      .post('/api/v1/transcription/token')
      .set('Authorization', otherPsychToken)
      .send({ sessionId });

    assert.equal(unauthorizedRes.status, 404);

    // Patient attempting to request token -> 403 Forbidden
    const patientForbiddenRes = await request(app)
      .post('/api/v1/transcription/token')
      .set('Authorization', patientToken)
      .send({ sessionId });

    assert.equal(patientForbiddenRes.status, 403);

    // Legitimate assigned psychologist requests token -> 200 OK
    const tokenRes = await request(app)
      .post('/api/v1/transcription/token')
      .set('Authorization', psychToken)
      .send({ sessionId });

    assert.equal(tokenRes.status, 200);
    assert.ok(tokenRes.body.data.token);
    assert.ok(tokenRes.body.data.wsUrl.includes('wss://streaming.assemblyai.com/v3/ws'));
    assert.ok(tokenRes.body.data.transcriptId);
    transcriptId = tokenRes.body.data.transcriptId;
  });

  await t.test('4. Ingest Ambient Finalized Speech Turns & Zero-Duplication Invariant', async () => {
    // Turn 1: Patient speaks
    const turn1Res = await request(app)
      .post('/api/v1/transcription/turns')
      .set('Authorization', psychToken)
      .send({
        sessionId,
        transcriptId,
        turnOrder: 0,
        transcript: 'I have been experiencing severe fatigue and difficulty concentrating on work.',
        speaker: 'Patient',
        audioStart: 1000,
        audioEnd: 4800,
        endOfTurn: true,
      });

    assert.equal(turn1Res.status, 201);
    assert.ok(turn1Res.body.data.entry.id);
    firstEntryId = turn1Res.body.data.entry.id;

    // Turn 2: Psychologist replies
    const turn2Res = await request(app)
      .post('/api/v1/transcription/turns')
      .set('Authorization', psychToken)
      .send({
        sessionId,
        transcriptId,
        turnOrder: 1,
        transcript: 'How long have these concentration challenges been impacting your daily tasks?',
        speaker: 'Dr. Watson',
        audioStart: 5200,
        audioEnd: 9100,
        endOfTurn: true,
      });

    assert.equal(turn2Res.status, 201);
    assert.equal(turn2Res.body.data.turnCount, 2);

    // Finalize the transcript
    const finRes = await request(app)
      .post('/api/v1/transcription/finalize')
      .set('Authorization', psychToken)
      .send({
        sessionId,
        transcriptId,
        completeness: 'completed',
      });

    assert.equal(finRes.status, 200);
    assert.equal(finRes.body.data.transcript.status, 'completed');
    assert.equal(finRes.body.data.transcript.turnCount, 2);
    assert.ok(finRes.body.data.transcript.fullText.includes('severe fatigue'));
  });

  await t.test('5. Transcript Search and In-Memory Text Filtering', async () => {
    const searchRes = await request(app)
      .get(`/api/v1/transcription/${transcriptId}/search?q=fatigue`)
      .set('Authorization', psychToken);

    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.data.matches.length, 1);
    assert.equal(searchRes.body.data.matches[0].speaker, 'Patient');

    const emptySearchRes = await request(app)
      .get(`/api/v1/transcription/${transcriptId}/search?q=nonexistentkeyword`)
      .set('Authorization', psychToken);

    assert.equal(emptySearchRes.status, 200);
    assert.equal(emptySearchRes.body.data.matches.length, 0);
  });

  await t.test('6. Inline Correction & Immutable Version History Snapshotting', async () => {
    // Attempting correction without clinical rationale MUST fail with 400
    const failCorrectionRes = await request(app)
      .patch(`/api/v1/transcription/${transcriptId}/entries/${firstEntryId}`)
      .set('Authorization', psychToken)
      .send({
        text: 'I have been experiencing mild fatigue.',
        reason: '', // missing reason
      });

    assert.equal(failCorrectionRes.status, 400);

    // Valid correction with clinical justification
    const correctRes = await request(app)
      .patch(`/api/v1/transcription/${transcriptId}/entries/${firstEntryId}`)
      .set('Authorization', psychToken)
      .send({
        text: 'I have been experiencing moderate episodic fatigue and difficulty focusing.',
        speaker: 'Alice (Patient)',
        reason: 'Patient refined severity description from severe to moderate episodic.',
      });

    assert.equal(correctRes.status, 200);
    assert.equal(correctRes.body.data.entry.text, 'I have been experiencing moderate episodic fatigue and difficulty focusing.');
    assert.equal(correctRes.body.data.newVersion, 2);

    // Verify snapshot in version history
    assert.ok(correctRes.body.data.versionSnapshot);
    assert.equal(
      correctRes.body.data.versionSnapshot.previousText,
      'I have been experiencing severe fatigue and difficulty concentrating on work.'
    );

    // Retrieve transcript and verify versions array
    const getRes = await request(app)
      .get(`/api/v1/transcription/sessions/${sessionId}`)
      .set('Authorization', psychToken);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.transcript.version, 2);
    assert.equal(getRes.body.data.versions.length, 1);
    assert.equal(getRes.body.data.versions[0].previousVersion, 1);
  });

  await t.test('7. Clinical Review Status Progression', async () => {
    const reviewRes = await request(app)
      .patch(`/api/v1/transcription/${transcriptId}/review-status`)
      .set('Authorization', psychToken)
      .send({ reviewStatus: 'reviewed' });

    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.body.data.transcript.reviewStatus, 'reviewed');
  });

  await t.test('8. Google Meet Official API v2 Discovery & Idempotent Normalization', async () => {
    // Setup online session
    const onlineAptId = 'apt_p5_online_01';
    const onlineSesId = 'ses_p5_online_01';

    await firebaseRtdbAdapter.set(`appointments/${onlineAptId}`, {
      id: onlineAptId,
      patientId: patientUid,
      patientName: 'Alice Walker',
      psychologistId: psychUid,
      sessionMode: 'online',
      googleMeetUrl: 'https://meet.google.com/xyz-pqrs-tuv',
      status: 'confirmed',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
    });

    await firebaseRtdbAdapter.set(`sessionRecords/${onlineSesId}`, {
      id: onlineSesId,
      sessionId: onlineSesId,
      appointmentId: onlineAptId,
      patientId: patientUid,
      psychologistId: psychUid,
      sessionMode: 'online',
      sessionStatus: 'in_progress',
    });

    // Mock Google Meet adapter responses for testing API normalization
    const originalDiscover = googleMeetAdapter.discoverConferenceRecord;
    const originalList = googleMeetAdapter.listTranscripts;
    const originalEntries = googleMeetAdapter.fetchTranscriptEntries;

    googleMeetAdapter.discoverConferenceRecord = async () => ({
      success: true,
      status: 'RECORD_FOUND',
      conferenceRecord: { name: 'conferenceRecords/conf_p5_123', startTime: new Date().toISOString() },
    });

    googleMeetAdapter.listTranscripts = async () => ({
      success: true,
      status: 'TRANSCRIPTS_FOUND',
      transcripts: [{ name: 'conferenceRecords/conf_p5_123/transcripts/trans_987' }],
    });

    googleMeetAdapter.fetchTranscriptEntries = async () => ({
      success: true,
      status: 'ENTRIES_RETRIEVED',
      entries: [
        {
          name: 'conferenceRecords/conf_p5_123/transcripts/trans_987/entries/e1',
          participant: 'conferenceRecords/conf_p5_123/participants/part_01',
          text: 'Good morning Dr. Watson, connecting remotely from my office.',
          startTime: '2026-10-22T03:00:00Z',
          endTime: '2026-10-22T03:00:04Z',
        },
        {
          name: 'conferenceRecords/conf_p5_123/transcripts/trans_987/entries/e2',
          participant: 'conferenceRecords/conf_p5_123/participants/part_02',
          text: 'Good morning Alice, glad you could join via Google Meet.',
          startTime: '2026-10-22T03:00:05Z',
          endTime: '2026-10-22T03:00:09Z',
        },
      ],
      isTruncated: false,
    });

    try {
      // Execute Meet import
      const importRes = await request(app)
        .post('/api/v1/transcription/google-meet/import')
        .set('Authorization', psychToken)
        .send({
          sessionId: onlineSesId,
          meetingCode: 'xyz-pqrs-tuv',
        });

      assert.equal(importRes.status, 200);
      assert.equal(importRes.body.data.transcript.source, 'google_meet');
      assert.equal(importRes.body.data.transcript.turnCount, 2);
      assert.ok(importRes.body.data.transcript.fullText.includes('connecting remotely'));

      // Test idempotency: repeat import
      const repeatRes = await request(app)
        .post('/api/v1/transcription/google-meet/import')
        .set('Authorization', psychToken)
        .send({
          sessionId: onlineSesId,
          meetingCode: 'xyz-pqrs-tuv',
        });

      assert.equal(repeatRes.status, 200);
      assert.equal(repeatRes.body.data.transcript.id, importRes.body.data.transcript.id);
      assert.equal(repeatRes.body.data.transcript.turnCount, 2);
    } finally {
      // Restore adapter
      googleMeetAdapter.discoverConferenceRecord = originalDiscover;
      googleMeetAdapter.listTranscripts = originalList;
      googleMeetAdapter.fetchTranscriptEntries = originalEntries;
    }
  });

  await t.test('9. Manual Plain-Text Import Fallback', async () => {
    const manualSesId = 'ses_p5_manual_01';
    await firebaseRtdbAdapter.set(`sessionRecords/${manualSesId}`, {
      id: manualSesId,
      sessionId: manualSesId,
      appointmentId: appointmentId,
      patientId: patientUid,
      psychologistId: psychUid,
      sessionMode: 'in_person',
    });

    const manualDialogue = `[Alice]: I practiced the progressive muscle relaxation over the weekend.

[Dr. Watson]: Excellent. What physical sensations did you notice during the relaxation phase?

[Alice]: My shoulders were much less tense than usual.`;

    const manualRes = await request(app)
      .post('/api/v1/transcription/manual-import')
      .set('Authorization', psychToken)
      .send({
        sessionId: manualSesId,
        text: manualDialogue,
        source: 'manual_dictation_log',
      });

    assert.equal(manualRes.status, 201);
    assert.equal(manualRes.body.data.transcript.source, 'manual_dictation_log');
    assert.equal(manualRes.body.data.transcript.turnCount, 3);
    assert.ok(manualRes.body.data.transcript.fullText.includes('progressive muscle relaxation'));
  });

  await t.test('10. Clinical Privacy Boundary: Administrative Prohibited Access', async () => {
    // Administrator attempt to access clinical transcript MUST return 403 ADMIN_CLINICAL_ACCESS_PROHIBITED
    const adminBlockedRes = await request(app)
      .get(`/api/v1/transcription/sessions/${sessionId}`)
      .set('Authorization', adminToken);

    assert.equal(adminBlockedRes.status, 403);
    assert.equal(adminBlockedRes.body.error?.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
    assert.ok((adminBlockedRes.body.error?.message || '').includes('barred from accessing direct patient clinical notes and transcripts'));
  });

  await t.test('11. Strict Text-Only Persistence Verification', async () => {
    // Verify that sessionTranscripts and transcriptEntries contain ONLY text/numbers/JSON, zero audio/binary
    const storedTranscript = await firebaseRtdbAdapter.get(`sessionTranscripts/${transcriptId}`);
    assert.ok(storedTranscript);
    assert.equal(typeof storedTranscript.fullText, 'string');
    assert.equal(typeof storedTranscript.turnCount, 'number');

    // Confirm no audio URLs, binary blobs, base64 strings
    const jsonStr = JSON.stringify(storedTranscript);
    assert.equal(jsonStr.includes('data:audio/'), false, 'No base64 audio in stored transcript');
    assert.equal(jsonStr.includes('blob:'), false, 'No blob URLs in stored transcript');
    assert.equal(jsonStr.includes('storage.googleapis.com'), false, 'No Firebase Storage in stored transcript');

    const storedEntries = await firebaseRtdbAdapter.get(`transcriptEntries/${transcriptId}`);
    assert.ok(storedEntries);
    for (const entry of Object.values(storedEntries)) {
      assert.equal(typeof entry.text, 'string');
      assert.equal(typeof entry.speaker, 'string');
      const entryJson = JSON.stringify(entry);
      assert.equal(entryJson.includes('data:audio/'), false, 'No base64 audio in transcript entries');
    }
  });
});
