process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import config from '../config/index.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { geminiAdapter } from '../integrations/gemini/geminiAdapter.js';
import { assemblyaiAdapter } from '../integrations/assemblyai/assemblyaiAdapter.js';
import { mockAiAdapter } from '../integrations/ai/mockAiAdapter.js';
import { aiJobService } from '../services/aiJob.service.js';
import { transcriptionService } from '../services/transcription.service.js';
import { validateAiSandboxConfig, resolveAiSandboxConfig } from '../config/aiSandboxConfig.js';

test('Phase 6.3: AI Sandbox & Vendor Privacy Safeguards Regression Suite', async (t) => {
  const psychToken = 'Bearer test-token-psychologist-psych_sandbox_01';
  const psychUid = 'psych_sandbox_01';

  const patientToken = 'Bearer test-token-patient-patient_sandbox_01';
  const patientUid = 'patient_sandbox_01';
  const patientId = patientUid;

  const adminToken = 'Bearer test-token-admin-admin_sandbox_01';
  const adminUid = 'admin_sandbox_01';

  const sessionId = 'ses_sandbox_test_01';
  const appointmentId = 'apt_sandbox_test_01';
  const transcriptId = `trx_${sessionId.replace(/^ses_/, '')}`;

  let createdJobId = null;
  let createdDraftId = null;

  await t.test('1. Setup Clinical Sandbox Test Harness', async () => {
    // 1. Seed psychologist
    await firebaseRtdbAdapter.set(`users/${psychUid}`, {
      uid: psychUid,
      email: 'dr.sandbox@psyco.health',
      role: 'psychologist',
      accountStatus: 'active',
      onboardingStatus: 'complete',
      fullName: 'Dr. Sandbox Tester',
    });

    await firebaseRtdbAdapter.set(`psychologists/${psychUid}`, {
      uid: psychUid,
      fullName: 'Dr. Sandbox Tester',
      licenseNumber: 'PSY-SBX-001',
      approvalStatus: 'approved',
    });

    // 2. Seed patient
    await firebaseRtdbAdapter.set(`users/${patientUid}`, {
      uid: patientUid,
      email: 'patient.sandbox@example.com',
      role: 'patient',
      accountStatus: 'active',
      onboardingStatus: 'complete',
      fullName: 'Alex Sandbox',
    });

    await firebaseRtdbAdapter.set(`patients/${patientUid}`, {
      uid: patientUid,
      fullName: 'Alex Sandbox',
      email: 'patient.sandbox@example.com',
      assignedPsychologistId: psychUid,
      assignedPsychologistIds: { [psychUid]: true },
      status: 'active',
    });

    // 3. Seed admin
    await firebaseRtdbAdapter.set(`users/${adminUid}`, {
      uid: adminUid,
      email: 'admin.sandbox@psyco.health',
      role: 'admin',
      accountStatus: 'active',
      onboardingStatus: 'complete',
    });

    // 4. Seed appointment & session record
    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, {
      id: appointmentId,
      appointmentId,
      patientId,
      psychologistId: psychUid,
      status: 'completed',
      date: '2026-11-01',
      startTime: '2026-11-01T10:00:00Z',
      endTime: '2026-11-01T10:50:00Z',
    });

    await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, {
      id: sessionId,
      sessionId,
      appointmentId,
      patientId,
      psychologistId: psychUid,
      sessionMode: 'in_person',
      sessionStatus: 'completed',
      scheduledStartTime: '2026-11-01T10:00:00Z',
      scheduledEndTime: '2026-11-01T10:50:00Z',
      createdAt: '2026-11-01T10:00:00Z',
    });

    // 5. Seed consent record
    await firebaseRtdbAdapter.set(`consentRecords/cst_${sessionId}`, {
      id: `cst_${sessionId}`,
      sessionId,
      patientId,
      psychologistId: psychUid,
      status: 'granted',
      consentType: 'in_person_ambient',
      confirmedAt: '2026-11-01T09:55:00Z',
    });

    // 6. Seed source transcript with structured turn dialogue
    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcriptId}`, {
      id: transcriptId,
      transcriptId,
      sessionId,
      appointmentId,
      patientId,
      psychologistId: psychUid,
      sessionMode: 'in_person',
      source: 'assemblyai',
      status: 'completed',
      completeness: 'completed',
      version: 1,
      fullText:
        '[Speaker 1]: Hello Alex, how has your stress level been this past week?\n\n[Speaker 2]: I have been feeling quite overwhelmed with work deadlines and having trouble falling asleep.\n\n[Speaker 1]: Let us examine those thoughts and practice progressive muscle relaxation.',
    });

    await firebaseRtdbAdapter.set(`transcriptEntries/${transcriptId}/ent_001`, {
      id: 'ent_001',
      transcriptId,
      sessionId,
      turnOrder: 1,
      speaker: 'Psychologist',
      text: 'Hello Alex, how has your stress level been this past week?',
    });

    await firebaseRtdbAdapter.set(`transcriptEntries/${transcriptId}/ent_002`, {
      id: 'ent_002',
      transcriptId,
      sessionId,
      turnOrder: 2,
      speaker: 'Patient',
      text: 'I have been feeling quite overwhelmed with work deadlines and having trouble falling asleep.',
    });

    assert.ok(true, 'Test harness seeded successfully.');
  });

  await t.test('2. Feature Flag Validation & Fail-Closed Startup Enforcements', () => {
    // A. Valid sandbox config resolves safely
    const validConfig = {
      geminiProvider: 'mock',
      geminiClinicalLiveEnabled: false,
      assemblyaiLiveEnabled: false,
      sandboxMode: true,
    };
    assert.strictEqual(validateAiSandboxConfig(validConfig), true);

    // B. Inconsistent config: GEMINI_PROVIDER=live in sandbox fails closed
    assert.throws(
      () => {
        validateAiSandboxConfig({
          geminiProvider: 'live',
          geminiClinicalLiveEnabled: true,
          assemblyaiLiveEnabled: false,
          sandboxMode: true,
        });
      },
      /\[FAIL-CLOSED SECURITY VIOLATION\] GEMINI_PROVIDER must be 'mock' when AI_SANDBOX_MODE is true/
    );

    // C. Inconsistent config: GEMINI_CLINICAL_LIVE_ENABLED=true in sandbox fails closed
    assert.throws(
      () => {
        validateAiSandboxConfig({
          geminiProvider: 'mock',
          geminiClinicalLiveEnabled: true,
          assemblyaiLiveEnabled: false,
          sandboxMode: true,
        });
      },
      /\[FAIL-CLOSED SECURITY VIOLATION\] GEMINI_CLINICAL_LIVE_ENABLED must be false when AI_SANDBOX_MODE is true/
    );

    // D. Inconsistent config: ASSEMBLYAI_LIVE_ENABLED=true in sandbox fails closed
    assert.throws(
      () => {
        validateAiSandboxConfig({
          geminiProvider: 'mock',
          geminiClinicalLiveEnabled: false,
          assemblyaiLiveEnabled: true,
          sandboxMode: true,
        });
      },
      /\[FAIL-CLOSED SECURITY VIOLATION\] ASSEMBLYAI_LIVE_ENABLED must be false when AI_SANDBOX_MODE is true/
    );

    // E. Invalid provider fails closed
    assert.throws(
      () => {
        validateAiSandboxConfig({
          geminiProvider: 'unsupported_vendor',
          geminiClinicalLiveEnabled: false,
          assemblyaiLiveEnabled: false,
          sandboxMode: true,
        });
      },
      /Invalid GEMINI_PROVIDER 'unsupported_vendor'/
    );

    // F. Safe defaults when env vars are absent
    const resolvedDefault = resolveAiSandboxConfig({});
    assert.strictEqual(resolvedDefault.geminiProvider, 'mock');
    assert.strictEqual(resolvedDefault.geminiClinicalLiveEnabled, false);
    assert.strictEqual(resolvedDefault.assemblyaiLiveEnabled, false);
    assert.strictEqual(resolvedDefault.sandboxMode, true);
  });

  await t.test('3. Mock AI Provider: Deterministic Synthetic Documentation', async () => {
    const context = {
      transcriptText: '[Patient]: I feel anxious about my job.\n[Psychologist]: Let us try cognitive reframing.',
      transcriptVersion: 1,
      patient: { id: patientUid, name: 'Alex Sandbox' },
    };

    // Test SOAP generation
    const soapResult = await mockAiAdapter.generateClinicalDocumentation('GENERATE_SOAP', context);
    assert.strictEqual(soapResult.provider, 'mock');
    assert.strictEqual(soapResult.isSynthetic, true);
    assert.strictEqual(soapResult.isMock, true);
    assert.strictEqual(soapResult.sandboxMode, true);
    assert.strictEqual(soapResult.isSimulated, true);
    assert.ok(soapResult.output.subjective.includes('[SYNTHETIC TEST DRAFT]'));
    assert.ok(soapResult.output.objective.includes('[SYNTHETIC TEST DRAFT]'));
    assert.ok(soapResult.output.assessment.includes('[SYNTHETIC TEST DRAFT]'));
    assert.ok(soapResult.output.plan.includes('[SYNTHETIC TEST DRAFT]'));

    // Test Treatment Plan generation
    const planResult = await mockAiAdapter.generateClinicalDocumentation('GENERATE_TREATMENT_PLAN_DRAFT', context);
    assert.strictEqual(planResult.isSynthetic, true);
    assert.ok(planResult.output.title.includes('[SYNTHETIC TEST DRAFT]'));
    assert.ok(Array.isArray(planResult.output.shortTermObjectives));
    assert.ok(Array.isArray(planResult.output.proposedInterventions));

    // Test Completeness check
    const checkResult = await mockAiAdapter.generateClinicalDocumentation('CHECK_DOCUMENTATION_COMPLETENESS', context);
    assert.strictEqual(checkResult.isSynthetic, true);
    assert.ok(checkResult.output.overallCompletenessScore > 0);
  });

  await t.test('4. Gemini Adapter Sandbox Delegation: Zero Outbound Gemini Calls', async () => {
    const status = geminiAdapter.getStatus();
    assert.strictEqual(status.status, 'SANDBOX_MOCK_ACTIVE');
    assert.strictEqual(status.providerMode, 'mock');
    assert.strictEqual(status.sandboxMode, true);
    assert.strictEqual(status.externalCallsBlocked, true);
    assert.strictEqual(status.storagePolicy, 'ZERO_EXTERNAL_TRANSMISSION');

    // Generating documentation through geminiAdapter routes directly to mockAiAdapter
    const context = {
      transcriptText: '[Patient]: Working on grounding exercises.\n[Psychologist]: Good progress.',
      transcriptVersion: 1,
    };
    const result = await geminiAdapter.generateClinicalDocumentation('GENERATE_SOAP', context);
    assert.strictEqual(result.provider, 'mock');
    assert.strictEqual(result.isSynthetic, true);
    assert.strictEqual(result.isMock, true);
    assert.strictEqual(result.modelUsed, 'mock-deterministic-clinical-v1');
  });

  await t.test('5. AssemblyAI Sandbox Controls: Zero Outbound Calls & Synthetic Token Only', async () => {
    const status = assemblyaiAdapter.getStatus();
    assert.strictEqual(status.status, 'SANDBOX_MOCK_ACTIVE');
    assert.strictEqual(status.liveEnabled, false);
    assert.strictEqual(status.sandboxMode, true);
    assert.strictEqual(status.zeroAudioPersistenceEnforced, true);

    // Requesting a token produces a synthetic sandbox token with zero external fetch
    const tokenRes = await assemblyaiAdapter.createStreamingToken(60);
    assert.strictEqual(tokenRes.isSimulated, true);
    assert.strictEqual(tokenRes.isSandbox, true);
    assert.strictEqual(tokenRes.sandboxMode, true);
    assert.strictEqual(tokenRes.provider, 'mock');
    assert.ok(tokenRes.token.startsWith('sandbox_mock_token_'));
    assert.ok(tokenRes.wsUrl.includes('wss://streaming.assemblyai.com/v3/ws'));
  });

  await t.test('6. Transcription Service: Issues Sandbox Token with Audit Record', async () => {
    const tokenData = await transcriptionService.requestStreamingToken(sessionId, psychUid);
    assert.strictEqual(tokenData.isSimulated, true);
    assert.strictEqual(tokenData.isSandbox, true);
    assert.strictEqual(tokenData.sandboxMode, true);
    assert.strictEqual(tokenData.provider, 'mock');

    // Verify audit record contains sandbox indicators without private tokens
    const allAudit = (await firebaseRtdbAdapter.get('auditLogs')) || {};
    const issuedLogs = Object.values(allAudit).filter((l) => l.action === 'TRANSCRIPTION_TOKEN_ISSUED');
    assert.ok(issuedLogs.length > 0);
    const latest = issuedLogs[issuedLogs.length - 1];
    const meta = latest.metadata || latest.details || {};
    assert.strictEqual(meta.isSandbox, true);
    assert.strictEqual(meta.sandboxMode, true);
    assert.strictEqual(meta.providerMode, 'mock');
    assert.strictEqual(meta.token, undefined, 'Private token must NOT be logged in audit trail');
  });

  await t.test('7. AI Job Creation & Processing: Draft-Only State and Synthetic Tagging', async () => {
    // Create Job
    const createRes = await request(app)
      .post(`${config.apiPrefix}/ai/jobs`)
      .set('Authorization', psychToken)
      .send({
        sessionId,
        jobType: 'GENERATE_SOAP',
      })
      .expect(202);

    createdJobId = createRes.body.jobId;
    assert.ok(createdJobId);

    // Process Job synchronously via worker
    await aiJobService.processJob(createdJobId);

    const completedJob = await firebaseRtdbAdapter.get(`aiJobs/${createdJobId}`);
    assert.strictEqual(completedJob.status, 'completed');
    createdDraftId = completedJob.draftId;
    assert.ok(createdDraftId);

    // Verify draft properties in RTDB
    const draft = await firebaseRtdbAdapter.get(`aiDrafts/${createdDraftId}`);
    assert.strictEqual(draft.isDraft, true, 'Draft must be in draft status');
    assert.strictEqual(draft.approvalStatus, 'pending_approval', 'Approval status must strictly be pending_approval');
    assert.strictEqual(draft.isSynthetic, true, 'isSynthetic flag must be true');
    assert.strictEqual(draft.isMock, true, 'isMock flag must be true');
    assert.strictEqual(draft.provider, 'mock', 'provider must be mock');
    assert.strictEqual(draft.sandboxMode, true, 'sandboxMode must be true');
    assert.strictEqual(draft.approvedAt, null, 'Must never be auto-approved');
    assert.strictEqual(draft.approvedBy, null, 'Must have no approvedBy clinician before approval');
  });

  await t.test('8. Audit Logging: Provider Mode & Sandbox Indicator (No Raw Content Leaks)', async () => {
    const allAudit = (await firebaseRtdbAdapter.get('auditLogs')) || {};
    const jobLogs = Object.values(allAudit).filter((l) => l.action === 'AI_JOB_COMPLETED');
    assert.ok(jobLogs.length > 0);
    const latest = jobLogs[jobLogs.length - 1];
    const meta = latest.metadata || latest.details || {};

    assert.strictEqual(meta.providerMode, 'mock');
    assert.strictEqual(meta.sandboxMode, true);
    assert.strictEqual(meta.isSynthetic, true);
    assert.strictEqual(meta.status, 'success');
    assert.strictEqual(meta.transcriptText, undefined, 'Must not leak raw transcript text');
    assert.strictEqual(meta.content, undefined, 'Must not leak full clinical content');
    assert.strictEqual(meta.prompt, undefined, 'Must not leak private prompts');
  });

  await t.test('9. Admin Clinical Access Prohibition: HTTP 403 Forbidden', async () => {
    // Admin cannot create AI jobs
    await request(app)
      .post(`${config.apiPrefix}/ai/jobs`)
      .set('Authorization', adminToken)
      .send({ sessionId, jobType: 'GENERATE_SOAP' })
      .expect(403);

    // Admin cannot get AI draft
    await request(app)
      .get(`${config.apiPrefix}/ai/drafts/${createdDraftId}`)
      .set('Authorization', adminToken)
      .expect(403);

    // Admin cannot view clinical transcripts
    await request(app)
      .get(`${config.apiPrefix}/transcription/sessions/${sessionId}`)
      .set('Authorization', adminToken)
      .expect(403);
  });

  await t.test('10. Psychologist Approval Workflow: Requires Clinician Review & Commits Record', async () => {
    // Attempt approval from non-psychologist (patient) fails 403
    await request(app)
      .post(`${config.apiPrefix}/ai/drafts/${createdDraftId}/approve`)
      .set('Authorization', patientToken)
      .send({ finalizeImmediately: true })
      .expect(403);

    // Legitimate approval by assigned psychologist
    const approveRes = await request(app)
      .post(`${config.apiPrefix}/ai/drafts/${createdDraftId}/approve`)
      .set('Authorization', psychToken)
      .send({ finalizeImmediately: true, sharedWithPatient: false })
      .expect(200);

    assert.strictEqual(approveRes.body.approvalStatus, 'approved');
    assert.ok(approveRes.body.approvedAt);

    // Verify draft is now marked approved
    const approvedDraft = await firebaseRtdbAdapter.get(`aiDrafts/${createdDraftId}`);
    assert.strictEqual(approvedDraft.approvalStatus, 'approved');
    assert.strictEqual(approvedDraft.isDraft, false);
    assert.strictEqual(approvedDraft.approvedBy, psychUid);

    // Verify committed clinical record was created in sessionNotes
    const committedId = approvedDraft.committedRecordId;
    assert.ok(committedId);
    const officialNote = await firebaseRtdbAdapter.get(`sessionNotes/${committedId}`);
    assert.ok(officialNote);
    assert.strictEqual(officialNote.psychologistId, psychUid);
  });

  await t.test('11. Zero Binary Persistence Invariant: RTDB Text/JSON Only', async () => {
    const allTranscripts = (await firebaseRtdbAdapter.get('sessionTranscripts')) || {};
    const allDrafts = (await firebaseRtdbAdapter.get('aiDrafts')) || {};

    // Check all transcripts in RTDB: no binary buffers or base64 audio
    for (const trx of Object.values(allTranscripts)) {
      assert.strictEqual(typeof trx.fullText, 'string');
      assert.strictEqual(trx.audioBuffer, undefined, 'No audio buffer in sessionTranscripts');
      assert.strictEqual(trx.audioBinary, undefined, 'No audio binary in sessionTranscripts');
      assert.strictEqual(trx.audioBlob, undefined, 'No audio blob in sessionTranscripts');
    }

    // Check all drafts in RTDB: purely structured clinical JSON
    for (const draft of Object.values(allDrafts)) {
      assert.strictEqual(typeof draft.content, 'object');
      assert.strictEqual(draft.audioBinary, undefined);
    }
  });

  await t.test('12. AI Status Endpoint: Correctly Reports Active Sandbox Mode', async () => {
    const statusRes = await request(app)
      .get(`${config.apiPrefix}/ai/status`)
      .set('Authorization', psychToken)
      .expect(200);

    assert.strictEqual(statusRes.body.copilot.status, 'SANDBOX_MOCK_ACTIVE');
    assert.strictEqual(statusRes.body.copilot.sandboxMode, true);
    assert.strictEqual(statusRes.body.copilot.providerMode, 'mock');
    assert.strictEqual(statusRes.body.copilot.externalCallsBlocked, true);
  });
});
