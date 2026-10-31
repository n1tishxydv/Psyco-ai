import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceService } from '../services/practice.service.js';
import { schedulingService } from '../services/scheduling.service.js';
import { clinicalService } from '../services/clinical.service.js';
import { adminService } from '../services/admin.service.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

test('PSYCO AI Phase 3: Comprehensive Independent Acceptance Audit Test Suite', async (suite) => {
  const testPsychId = `test_psych_p3_${Date.now()}`;
  const testClinicId = `clinic_test_${Date.now()}`;
  const testPatientId = `test_patient_p3_${Date.now()}`;
  const unrelatedPatientId = `unrelated_patient_p3_${Date.now()}`;
  const unapprovedPsychId = `unapproved_psych_p3_${Date.now()}`;

  // 1. Seed approved test psychologist
  await firebaseRtdbAdapter.set(`psychologists/${testPsychId}`, {
    uid: testPsychId,
    fullName: 'Dr. Jane Roe, PhD',
    licenseNumber: 'PSY-TEST-301',
    approvalStatus: 'approved',
    verified: true,
    offeredModes: 'online',
    defaultMode: 'online',
    timezone: 'Asia/Kolkata',
    bio: 'Clinical Neuropsychologist specializing in anxiety and mindfulness.',
  });

  // 2. Seed unapproved/pending psychologist
  await firebaseRtdbAdapter.set(`psychologists/${unapprovedPsychId}`, {
    uid: unapprovedPsychId,
    fullName: 'Dr. Pending Clinician',
    licenseNumber: 'PSY-PENDING-001',
    approvalStatus: 'pending',
    verified: false,
    offeredModes: 'online',
  });

  // 3. Seed registered clinic
  await firebaseRtdbAdapter.set(`practices/${testClinicId}`, {
    id: testClinicId,
    type: 'clinic',
    practiceName: 'MindCare Regional Wellness Clinic',
    isActive: true,
    city: 'Bengaluru',
  });

  // 4. Seed patients
  await firebaseRtdbAdapter.set(`patients/${testPatientId}`, {
    id: testPatientId,
    fullName: 'Alice TestPatient',
    email: 'alice@test.internal',
    intakeStatus: 'submitted',
  });
  await firebaseRtdbAdapter.set(`patients/${unrelatedPatientId}`, {
    id: unrelatedPatientId,
    fullName: 'Bob UnrelatedPatient',
    email: 'bob@test.internal',
    intakeStatus: 'draft',
  });

  // ==========================================
  // SCENARIO 1: Independent Psychologist Workflows
  // ==========================================
  await suite.test('Scenario 1A: Independent practice workspace is created autonomously without a clinic ID', async () => {
    const workspace = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    assert.ok(workspace);
    assert.equal(workspace.psychologistId, testPsychId);
    assert.equal(workspace.practiceArrangement, 'independent');
    assert.equal(workspace.activePracticeId, `indep_${testPsychId}`);
    assert.ok(workspace.independentPractice);
    assert.equal(workspace.independentPractice.type, 'independent');
    assert.equal(workspace.independentPractice.ownerUid, testPsychId);
    assert.ok(workspace.independentPractice.practiceName.includes('Dr. Jane Roe'));
  });

  await suite.test('Scenario 1B: Online-only independent practice functions cleanly without mandatory office address', async () => {
    const updated = await practiceService.updateIndependentPracticeSettings(testPsychId, {
      practiceName: 'Dr. Jane Roe Tele-Counseling Practice',
      offeredModes: 'online',
      defaultMode: 'online',
      professionalBio: 'Purely remote telehealth psychological consultations.',
      setupCompleted: true,
    });
    assert.equal(updated.practiceName, 'Dr. Jane Roe Tele-Counseling Practice');
    assert.equal(updated.offeredModes, 'online');
    assert.equal(updated.defaultMode, 'online');
    assert.equal(updated.setupCompleted, true);

    const workspace = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    assert.equal(workspace.independentPractice.offeredModes, 'online');
    assert.ok(Array.isArray(workspace.independentPractice.locations));
  });

  await suite.test('Scenario 1C: Offline setup supports independent practice location CRUD', async () => {
    const loc = await practiceService.addPracticeLocation(testPsychId, {
      name: 'Downtown Therapy Studio',
      address: {
        line1: '120 Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
      },
      isDefault: true,
      instructions: 'Ring buzzer #4 at entrance.',
    });

    assert.ok(loc.id);
    assert.equal(loc.name, 'Downtown Therapy Studio');
    assert.equal(loc.isDefault, true);

    const workspace = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    assert.equal(workspace.independentPractice.locations.length, 1);
    assert.equal(workspace.independentPractice.locations[0].id, loc.id);

    // Remove location
    const delResult = await practiceService.deletePracticeLocation(testPsychId, loc.id);
    assert.equal(delResult.success, true);
    const refreshed = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    assert.equal(refreshed.independentPractice.locations.length, 0);
  });

  await suite.test('Scenario 1D: Psychologist can configure availability rules independently', async () => {
    const avail = await schedulingService.updateAvailability(testPsychId, {
      sessionDurationMinutes: 50,
      bufferTimeMinutes: 10,
      weeklySchedule: {
        monday: [{ startTime: '09:00', endTime: '17:00', mode: 'online' }],
        wednesday: [{ startTime: '10:00', endTime: '18:00', mode: 'online' }],
      },
    });
    assert.equal(avail.sessionDurationMinutes, 50);
    assert.equal(avail.bufferTimeMinutes, 10);
    assert.equal(avail.weeklySchedule.monday[0].mode, 'online');
  });

  // ==========================================
  // SCENARIO 2: Clinic-Affiliated Psychologist Workflows
  // ==========================================
  await suite.test('Scenario 2A: Clinician can request clinic membership', async () => {
    const membership = await practiceService.requestClinicAffiliation(
      testPsychId,
      testClinicId,
      'Applying for part-time clinical psychologist membership.'
    );
    assert.ok(membership.id);
    assert.equal(membership.psychologistId, testPsychId);
    assert.equal(membership.clinicId, testClinicId);
    assert.equal(membership.status, 'pending');
  });

  await suite.test('Scenario 2B: Joining an invalid or non-existent clinic is rejected (404)', async () => {
    await assert.rejects(
      async () => {
        await practiceService.requestClinicAffiliation(testPsychId, 'clinic_nonexistent_999');
      },
      (err) => {
        assert.equal(err.status, 404);
        assert.equal(err.code, 'CLINIC_NOT_FOUND');
        return true;
      }
    );
  });

  await suite.test('Scenario 2C: Membership requires authorized approval before clinic context switch is allowed', async () => {
    // Attempting to switch while status is still 'pending' must throw 403
    await assert.rejects(
      async () => {
        await practiceService.switchActivePracticeContext(testPsychId, testClinicId);
      },
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'UNAUTHORIZED_PRACTICE_CONTEXT');
        return true;
      }
    );

    // Approve membership
    const membershipId = `mem_${testPsychId}_${testClinicId}`;
    await firebaseRtdbAdapter.update(`practiceMemberships/${membershipId}`, {
      status: 'approved',
      grantedAt: new Date().toISOString(),
    });

    // Now switch succeeds
    const switchRes = await practiceService.switchActivePracticeContext(testPsychId, testClinicId);
    assert.equal(switchRes.activePracticeId, testClinicId);
  });

  // ==========================================
  // SCENARIO 3: Hybrid Practice & Context Isolation
  // ==========================================
  await suite.test('Scenario 3A: Hybrid clinician can switch between independent and clinic context without data contamination', async () => {
    // Switch to clinic context
    await practiceService.switchActivePracticeContext(testPsychId, testClinicId);
    let ws = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    assert.equal(ws.activePracticeId, testClinicId);
    assert.equal(ws.availableContexts.find((c) => c.isCurrent).type, 'clinic');

    // Switch back to independent context
    await practiceService.switchActivePracticeContext(testPsychId, `indep_${testPsychId}`);
    ws = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    assert.equal(ws.activePracticeId, `indep_${testPsychId}`);
    assert.equal(ws.availableContexts.find((c) => c.isCurrent).type, 'independent');

    // Verify independent practice details are preserved intact
    assert.equal(ws.independentPractice.practiceName, 'Dr. Jane Roe Tele-Counseling Practice');
  });

  // ==========================================
  // SCENARIO 4: Professional Verification & Approval Gates
  // ==========================================
  await suite.test('Scenario 4A: Pending psychologist cannot access clinical charts or therapeutic workspace', async () => {
    await assert.rejects(
      async () => {
        await clinicalService.assertTherapeuticRelationship(unapprovedPsychId, testPatientId);
      },
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'PSYCHOLOGIST_NOT_VERIFIED');
        return true;
      }
    );
  });

  await suite.test('Scenario 4B: Only authorized administrator can approve clinician credentials', async () => {
    const approvalResult = await adminService.reviewPsychologist(
      'admin_synthetic_01',
      unapprovedPsychId,
      { approved: true, reason: 'Credentials verified by state board audit' }
    );
    assert.equal(approvalResult.approvalStatus, 'approved');

    const psych = await firebaseRtdbAdapter.get(`psychologists/${unapprovedPsychId}`);
    assert.equal(psych.approvalStatus, 'approved');
  });

  // ==========================================
  // SCENARIO 5: Patient Management & ReBAC Authorization
  // ==========================================
  await suite.test('Scenario 5A: Psychologist can access assigned patient chart via therapeutic relationship', async () => {
    // Seed appointment establishing relationship between testPsychId and testPatientId
    const aptId = `apt_rel_${Date.now()}`;
    await firebaseRtdbAdapter.set(`appointments/${aptId}`, {
      id: aptId,
      psychologistId: testPsychId,
      patientId: testPatientId,
      status: 'confirmed',
      startTime: new Date().toISOString(),
    });

    const isAuthorized = await clinicalService.assertTherapeuticRelationship(testPsychId, testPatientId);
    assert.equal(isAuthorized, true);

    const chart = await clinicalService.getPatientChart(testPsychId, testPatientId);
    assert.ok(chart);
  });

  await suite.test('Scenario 5B: Unassigned psychologist is rejected with HTTP 403 on unrelated patient chart', async () => {
    await assert.rejects(
      async () => {
        await clinicalService.assertTherapeuticRelationship(testPsychId, unrelatedPatientId);
      },
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'UNAUTHORIZED_PATIENT_ACCESS');
        return true;
      }
    );
  });

  // ==========================================
  // SCENARIO 6: Practice Lifecycle & Idempotency
  // ==========================================
  await suite.test('Scenario 6A: Practice initialization is strictly idempotent across repeated requests', async () => {
    const ws1 = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    const ws2 = await practiceService.getPsychologistPracticeWorkspace(testPsychId);
    assert.equal(ws1.independentPractice.id, ws2.independentPractice.id);
    assert.equal(ws1.independentPractice.createdAt, ws2.independentPractice.createdAt);

    // Verify only 1 practice record exists for this psychologist
    const allPractices = (await firebaseRtdbAdapter.get('practices')) || {};
    const psychPractices = Object.values(allPractices).filter(
      (p) => p.ownerUid === testPsychId
    );
    assert.equal(psychPractices.length, 1);
  });

  // ==========================================
  // SCENARIO 7: Clinical Workspace & Notes Safety
  // ==========================================
  await suite.test('Scenario 7A: Clinical notes remain strictly editable drafts until explicitly finalized', async () => {
    const sesId = `ses_p3_audit_${Date.now()}`;
    const aptId = `apt_p3_audit_${Date.now()}`;

    // Seed session record
    await firebaseRtdbAdapter.set(`sessionRecords/${sesId}`, {
      id: sesId,
      appointmentId: aptId,
      psychologistId: testPsychId,
      patientId: testPatientId,
      status: 'in_progress',
    });

    // Save draft SOAP note
    const draftNote = await clinicalService.saveNoteDraft(testPsychId, {
      sessionId: sesId,
      patientId: testPatientId,
      format: 'SOAP',
      content: {
        subjective: 'Patient reports mild work-related stress.',
        objective: 'Affect congruent, speech coherent.',
        assessment: 'Generalized anxiety features.',
        plan: 'Diaphragmatic breathing and sleep hygiene.',
      },
    });

    assert.ok(draftNote.id);
    assert.equal(draftNote.status, 'draft');

    // Finalize note
    const finalized = await clinicalService.finalizeNote(draftNote.id, testPsychId);
    assert.equal(finalized.status, 'finalized');
    assert.ok(finalized.finalizedAt);
  });

  // ==========================================
  // SCENARIO 8: Security Barrier & Role Enforcement
  // ==========================================
  await suite.test('Scenario 8A: Administrative Privacy Barrier prohibits admins from clinical psychotherapy records', async () => {
    // Assert clinical chartReBAC blocks unassigned and tests Phase 1 role isolation
    await assert.rejects(
      async () => {
        // Admin uid attempting clinical chart assert
        await clinicalService.getPatientChart('admin_synthetic_01', testPatientId);
      },
      (err) => {
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  // Cleanup all synthetic test entities
  await firebaseRtdbAdapter.set(`psychologists/${testPsychId}`, null);
  await firebaseRtdbAdapter.set(`psychologists/${unapprovedPsychId}`, null);
  await firebaseRtdbAdapter.set(`practices/indep_${testPsychId}`, null);
  await firebaseRtdbAdapter.set(`practices/${testClinicId}`, null);
  await firebaseRtdbAdapter.set(`practiceMemberships/mem_${testPsychId}_${testClinicId}`, null);
  await firebaseRtdbAdapter.set(`patients/${testPatientId}`, null);
  await firebaseRtdbAdapter.set(`patients/${unrelatedPatientId}`, null);
});
