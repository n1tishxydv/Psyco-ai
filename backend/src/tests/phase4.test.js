import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

test('Phase 4: Clinical Workspace, Documentation, Treatment Plans, Reports & Administration', async (t) => {
  const psychToken = 'Bearer test-token-psychologist-psych_p4_01';
  const psychUid = 'psych_p4_01';

  const patientToken = 'Bearer test-token-patient-patient_p4_01';
  const patientUid = 'patient_p4_01';

  const unassignedPsychToken = 'Bearer test-token-psychologist-unassigned_psych_01';
  const unassignedPsychUid = 'unassigned_psych_01';

  const adminToken = 'Bearer test-token-admin-admin_p4_01';
  const adminUid = 'admin_p4_01';

  let appointmentId = null;
  let sessionId = null;
  let noteId = null;
  let planId = null;
  let goalId = null;
  let taskId = null;
  let faqSubmissionId = null;

  await t.test('1. Seed test users (psychologists, patient, admin) and establish appointment', async () => {
    // 1. Onboard primary psychologist
    const psychRes = await request(app)
      .post('/api/v1/profile/onboard/psychologist')
      .set('Authorization', psychToken)
      .send({
        fullName: 'Dr. John Watson',
        licenseNumber: 'PSY-WATSON-771',
        specializations: ['Cognitive Behavioral Therapy (CBT)', 'PTSD & Trauma'],
        consultationModes: ['both'],
        phone: '+1 555-0455',
        bio: 'Clinical Psychologist specialized in clinical trauma interventions.',
      });
    assert.equal(psychRes.status, 201);
    await firebaseRtdbAdapter.set(`psychologists/${psychUid}/approvalStatus`, 'approved');
    await firebaseRtdbAdapter.set(`users/${psychUid}/accountStatus`, 'active');

    // 2. Onboard unassigned psychologist (competitor / outsider)
    const unassignedRes = await request(app)
      .post('/api/v1/profile/onboard/psychologist')
      .set('Authorization', unassignedPsychToken)
      .send({
        fullName: 'Dr. James Moriarty',
        licenseNumber: 'PSY-MORIARTY-001',
        specializations: ['Forensic Psychology'],
        consultationModes: ['telehealth'],
        phone: '+1 555-0666',
        bio: 'Consulting specialist.',
      });
    assert.equal(unassignedRes.status, 201);
    await firebaseRtdbAdapter.set(`psychologists/${unassignedPsychUid}/approvalStatus`, 'approved');
    await firebaseRtdbAdapter.set(`users/${unassignedPsychUid}/accountStatus`, 'active');

    // 3. Onboard patient
    const patientRes = await request(app)
      .post('/api/v1/profile/onboard/patient')
      .set('Authorization', patientToken)
      .send({
        fullName: 'Sherlock Holmes',
        gender: 'male',
        age: 38,
        phone: '+1 555-0221',
      });
    assert.equal(patientRes.status, 201);

    // 4. Seed admin user in RTDB
    await firebaseRtdbAdapter.set(`users/${adminUid}`, {
      uid: adminUid,
      email: 'admin@psyco.internal',
      role: 'admin',
      fullName: 'System Administrator',
      accountStatus: 'active',
      createdAt: new Date().toISOString()
    });

    // 5. Seed an appointment between Dr. Watson and Sherlock Holmes
    appointmentId = `apt_p4_${Date.now()}`;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const dateStr = targetDate.toISOString().split('T')[0];

    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, {
      appointmentId,
      patientId: patientUid,
      psychologistId: psychUid,
      date: dateStr,
      time: '10:00',
      status: 'confirmed',
      mode: 'telehealth',
      meetLink: 'https://meet.google.com/test-phase4',
      createdAt: new Date().toISOString()
    });

    assert.ok(appointmentId);
  });

  await t.test('2. Assigned Patient Directory & Comprehensive Patient Chart Retrieval', async () => {
    // Primary psychologist retrieves patient roster
    const rosterRes = await request(app)
      .get('/api/v1/clinical/patients')
      .set('Authorization', psychToken);

    assert.equal(rosterRes.status, 200);
    assert.equal(rosterRes.body.success, true);
    const patients = rosterRes.body.data.patients;
    assert.ok(Array.isArray(patients));
    const foundPatient = patients.find(p => p.patientId === patientUid);
    assert.ok(foundPatient, 'Patient should appear in assigned clinician roster');
    assert.equal(foundPatient.name, 'Sherlock Holmes');

    // Unassigned psychologist gets empty roster
    const emptyRosterRes = await request(app)
      .get('/api/v1/clinical/patients')
      .set('Authorization', unassignedPsychToken);
    assert.equal(emptyRosterRes.status, 200);
    const outsiderFound = emptyRosterRes.body.data.patients.find(p => p.patientId === patientUid);
    assert.equal(outsiderFound, undefined, 'Outsider clinician must not see unassigned patient');

    // Primary psychologist accesses patient chart
    const chartRes = await request(app)
      .get(`/api/v1/clinical/patients/${patientUid}/chart`)
      .set('Authorization', psychToken);

    assert.equal(chartRes.status, 200);
    assert.equal(chartRes.body.data.chart.patient.patientId, patientUid);
    assert.ok(Array.isArray(chartRes.body.data.chart.appointments));
    assert.ok(Array.isArray(chartRes.body.data.chart.sessionNotes));

    // Unassigned psychologist cannot access patient chart (403)
    const unauthorizedChartRes = await request(app)
      .get(`/api/v1/clinical/patients/${patientUid}/chart`)
      .set('Authorization', unassignedPsychToken);
    assert.equal(unauthorizedChartRes.status, 403);
  });

  await t.test('3. Clinical Session Lifecycle, Idempotent Creation & PIN Generation', async () => {
    // Create / get session for appointment
    const createSessionRes = await request(app)
      .post(`/api/v1/clinical/sessions/appointment/${appointmentId}`)
      .set('Authorization', psychToken);

    assert.equal(createSessionRes.status, 200);
    assert.equal(createSessionRes.body.success, true);
    sessionId = createSessionRes.body.data.session.sessionId;
    assert.ok(sessionId);
    assert.ok(createSessionRes.body.data.session.sessionPin, 'Must generate 6-digit session pin');
    assert.equal(createSessionRes.body.data.session.sessionPin.length, 6);

    // Start session
    const startRes = await request(app)
      .post(`/api/v1/clinical/sessions/${sessionId}/start`)
      .set('Authorization', psychToken);

    assert.equal(startRes.status, 200);
    assert.equal(startRes.body.data.session.status, 'in_progress');

    // Idempotent test: Calling createOrGetSession again returns same session
    const secondCallRes = await request(app)
      .post(`/api/v1/clinical/sessions/appointment/${appointmentId}`)
      .set('Authorization', psychToken);

    assert.equal(secondCallRes.status, 200);
    assert.equal(secondCallRes.body.data.session.sessionId, sessionId);

    // Patient cannot access clinical session start (403)
    const patientAttemptRes = await request(app)
      .post(`/api/v1/clinical/sessions/${sessionId}/start`)
      .set('Authorization', patientToken);
    assert.equal(patientAttemptRes.status, 403);

    // Conclude session -> moves to documentation_review
    const completeRes = await request(app)
      .post(`/api/v1/clinical/sessions/${sessionId}/complete`)
      .set('Authorization', psychToken);

    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.body.data.session.status, 'documentation_review');

    // Finalize session
    const finalizeRes = await request(app)
      .post(`/api/v1/clinical/sessions/${sessionId}/finalize`)
      .set('Authorization', psychToken);

    assert.equal(finalizeRes.status, 200);
    assert.equal(finalizeRes.body.data.session.status, 'finalized');
  });

  await t.test('4. Clinical Notes (SOAP), Draft Saving, Digital Finalization & Amendment Versioning', async () => {
    // Create draft SOAP note
    const createNoteRes = await request(app)
      .post('/api/v1/clinical/notes/draft')
      .set('Authorization', psychToken)
      .send({
        sessionId,
        patientId: patientUid,
        format: 'SOAP',
        content: {
          subjective: 'Patient reports heightened cognitive restlessness and disturbed sleep patterns.',
          objective: 'Alert, oriented x4, coherent speech, hyper-focused thought process.',
          assessment: 'Work-related cognitive overstimulation with acute insomnia symptoms.',
          plan: 'Initiate bedtime stimuli reduction, 4-7-8 breathing exercises, follow up in 7 days.'
        },
        patientVisibleSummary: 'Discussed cognitive unwinding techniques and healthy sleep hygiene practices.',
        sharedWithPatient: true
      });

    assert.equal(createNoteRes.status, 201);
    noteId = createNoteRes.body.data.note.noteId;
    assert.ok(noteId);
    assert.equal(createNoteRes.body.data.note.status, 'draft');
    assert.equal(createNoteRes.body.data.note.version, 1);

    // Update draft note
    const updateDraftRes = await request(app)
      .post('/api/v1/clinical/notes/draft')
      .set('Authorization', psychToken)
      .send({
        noteId,
        sessionId,
        patientId: patientUid,
        format: 'SOAP',
        content: {
          subjective: 'Patient reports heightened cognitive restlessness, improved since last night.',
          objective: 'Calm, coherent, responsive.',
          assessment: 'Mild cognitive fatigue.',
          plan: 'Continue progressive muscle relaxation.'
        },
        patientVisibleSummary: 'Updated: Discussed relaxation techniques.',
        sharedWithPatient: true
      });
    assert.equal(updateDraftRes.status, 201);

    // Finalize note with professional digital signature
    const finalizeNoteRes = await request(app)
      .post(`/api/v1/clinical/notes/${noteId}/finalize`)
      .set('Authorization', psychToken);

    assert.equal(finalizeNoteRes.status, 200);
    assert.equal(finalizeNoteRes.body.data.note.status, 'finalized');
    assert.ok(finalizeNoteRes.body.data.note.finalizedAt);
    assert.equal(finalizeNoteRes.body.data.note.signedBy, 'Dr. John Watson');

    // In-place overwrite attempt on finalized note MUST BE REJECTED (409 Conflict / Lock)
    const illegalOverwriteRes = await request(app)
      .post('/api/v1/clinical/notes/draft')
      .set('Authorization', psychToken)
      .send({
        noteId,
        sessionId,
        patientId: patientUid,
        format: 'SOAP',
        content: { subjective: 'Illegal overwrite attempt' },
        patientVisibleSummary: 'Overwriting finalized note',
        sharedWithPatient: true
      });
    assert.equal(illegalOverwriteRes.status, 409);

    // Controlled Amendment workflow
    const amendRes = await request(app)
      .post(`/api/v1/clinical/notes/${noteId}/amend`)
      .set('Authorization', psychToken)
      .send({
        reason: 'Patient clarified sleep disruption was exacerbated by evening tea intake.',
        amendedContent: {
          subjective: 'Patient reports restlessness exacerbated by late evening tea consumption.',
          objective: 'Calm, coherent.',
          assessment: 'Mild cognitive fatigue with dietary caffeine trigger.',
          plan: 'Eliminate stimulants after 5 PM.'
        },
        patientVisibleSummary: 'Amended takeaway: Restrict evening caffeine.'
      });

    assert.equal(amendRes.status, 200);
    assert.equal(amendRes.body.data.note.status, 'amended');
    assert.equal(amendRes.body.data.note.version, 2);
    assert.ok(Array.isArray(amendRes.body.data.note.versionHistory));
    assert.equal(amendRes.body.data.note.versionHistory.length, 1, 'Prior finalized note preserved in version history');
  });

  await t.test('5. Treatment Plans, Measurable Goals, Progress Tracking & Patient Publication', async () => {
    // Create treatment plan
    const createPlanRes = await request(app)
      .post('/api/v1/clinical/treatment-plans')
      .set('Authorization', psychToken)
      .send({
        patientId: patientUid,
        title: 'Cognitive Decompression & Circadian Regulation Plan',
        presentingProblem: 'Elevated cognitive restlessness and insomnia.',
        goals: [
          {
            description: 'Establish consistent sleep preparation routine',
            measurableObjective: 'Achieve 7 hours uninterrupted rest 5 nights per week',
            targetDate: '2026-11-30',
            status: 'active'
          }
        ]
      });

    assert.equal(createPlanRes.status, 201);
    planId = createPlanRes.body.data.plan.planId;
    assert.ok(planId);
    assert.equal(createPlanRes.body.data.plan.status, 'active');
    goalId = createPlanRes.body.data.plan.goals[0].id;
    assert.ok(goalId);

    // Update goal progress
    const updateGoalRes = await request(app)
      .patch(`/api/v1/clinical/treatment-plans/${planId}/goals/${goalId}`)
      .set('Authorization', psychToken)
      .send({
        status: 'achieved',
        progressNotes: 'Patient successfully maintained sleep routine for 10 consecutive days.'
      });

    assert.equal(updateGoalRes.status, 200);
    const updatedGoal = updateGoalRes.body.data.plan.goals.find(g => g.id === goalId);
    assert.equal(updatedGoal.status, 'achieved');

    // Publish treatment plan to patient portal
    const publishPlanRes = await request(app)
      .put(`/api/v1/clinical/treatment-plans/${planId}`)
      .set('Authorization', psychToken)
      .send({ sharedWithPatient: true });

    assert.equal(publishPlanRes.status, 200);
    assert.equal(publishPlanRes.body.data.plan.sharedWithPatient, true);
  });

  await t.test('6. Homework Assignment & Patient Portal Interactive Completion', async () => {
    // Psychologist assigns homework task
    const assignTaskRes = await request(app)
      .post('/api/v1/clinical/tasks')
      .set('Authorization', psychToken)
      .send({
        patientId: patientUid,
        title: 'Complete 10-Minute Evening Breathwork',
        description: 'Practice diaphragmatic 4-7-8 breathing sequence prior to turning off lights.',
        dueDate: '2026-11-15'
      });

    assert.equal(assignTaskRes.status, 201);
    taskId = assignTaskRes.body.data.task.taskId;
    assert.ok(taskId);
    assert.equal(assignTaskRes.body.data.task.status, 'assigned');

    // Patient views their clinical portal
    const portalRes = await request(app)
      .get('/api/v1/clinical/patient-portal/records')
      .set('Authorization', patientToken);

    assert.equal(portalRes.status, 200);
    assert.ok(Array.isArray(portalRes.body.data.activePlans));
    assert.ok(Array.isArray(portalRes.body.data.homeworkTasks));
    assert.ok(Array.isArray(portalRes.body.data.sharedNotes));

    // Confirm patient receives published plan and assigned task
    const patientPlan = portalRes.body.data.activePlans.find(p => p.planId === planId);
    assert.ok(patientPlan, 'Published plan must appear in patient portal');

    const patientTask = portalRes.body.data.homeworkTasks.find(t => t.taskId === taskId);
    assert.ok(patientTask, 'Homework task must appear in patient portal');

    // Confirm patient receives ONLY shared plain-language takeaways, NOT private therapist SOAP observations
    assert.ok(portalRes.body.data.sharedNotes.length > 0);
    const sharedNote = portalRes.body.data.sharedNotes[0];
    assert.ok(sharedNote.patientVisibleSummary);
    assert.equal(sharedNote.content, undefined, 'Private clinical SOAP content must never be leaked to patient');

    // Patient marks homework task completed
    const toggleTaskRes = await request(app)
      .patch(`/api/v1/clinical/tasks/${taskId}/status`)
      .set('Authorization', patientToken)
      .send({ status: 'completed' });

    assert.equal(toggleTaskRes.status, 200);
    assert.equal(toggleTaskRes.body.data.task.status, 'completed');
    assert.ok(toggleTaskRes.body.data.task.completedAt);
  });

  await t.test('7. Clinical Scope of Practice: Medication Prescription Unauthorized for Standard Psychologists', async () => {
    // Psychologist attempts to prescribe medication without prescriber credential
    const prescribeRes = await request(app)
      .post('/api/v1/clinical/prescriptions')
      .set('Authorization', psychToken)
      .send({
        patientId: patientUid,
        medicationName: 'Sertraline',
        dosage: '50mg',
        instructions: 'Take 1 tablet daily with food.'
      });

    assert.equal(prescribeRes.status, 403, 'Must reject prescription request for non-prescribing psychologist');
    assert.equal(prescribeRes.body.error.code, 'PRESCRIPTION_UNAUTHORIZED_FOR_ROLE');
  });

  await t.test('8. Clinical Report Generation from Real Verified Records', async () => {
    const reportRes = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', psychToken)
      .send({
        patientId: patientUid,
        reportType: 'session_summary',
        clinicalSummaryNotes: 'Patient demonstrated excellent compliance with breathing protocols.'
      });

    assert.equal(reportRes.status, 201);
    assert.ok(reportRes.body.data.report.reportId);
    assert.equal(reportRes.body.data.report.patientId, patientUid);
    assert.ok(reportRes.body.data.report.summary);
    assert.ok(Array.isArray(reportRes.body.data.report.sections));
  });

  await t.test('9. Administrative Governance & Clinical Privacy Barrier', async () => {
    // 1. Strict Clinical Barrier: Admin is barred from reading clinical records
    const adminBlockedPatientsRes = await request(app)
      .get('/api/v1/clinical/patients')
      .set('Authorization', adminToken);

    assert.equal(adminBlockedPatientsRes.status, 403, 'Admin must be strictly forbidden from accessing therapy records');
    assert.equal(adminBlockedPatientsRes.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');

    const adminBlockedChartRes = await request(app)
      .get(`/api/v1/clinical/patients/${patientUid}/chart`)
      .set('Authorization', adminToken);
    assert.equal(adminBlockedChartRes.status, 403);
    assert.equal(adminBlockedChartRes.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');

    // 2. Operational Metrics: Admin retrieves platform health and counts
    const metricsRes = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', adminToken);

    assert.equal(metricsRes.status, 200);
    assert.ok(metricsRes.body.data.totalUsers >= 3);
    assert.ok(metricsRes.body.data.psychologistCount >= 2);
    assert.ok(metricsRes.body.data.patientCount >= 1);

    // 3. Psychologist Credential Review & Approval
    const psychApprovalsRes = await request(app)
      .get('/api/v1/admin/psychologists')
      .set('Authorization', adminToken);

    assert.equal(psychApprovalsRes.status, 200);
    assert.ok(Array.isArray(psychApprovalsRes.body.data));

    // Admin approves Dr. Watson
    const approveRes = await request(app)
      .post(`/api/v1/admin/psychologists/${psychUid}/approve`)
      .set('Authorization', adminToken);

    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.data.approvalStatus, 'approved');

    // 4. FAQ Moderation & Publishing
    // Submit an FAQ as public user
    faqSubmissionId = `faq_sub_${Date.now()}`;
    await firebaseRtdbAdapter.set(`faqSubmissions/${faqSubmissionId}`, {
      submissionId: faqSubmissionId,
      question: 'Are sessions covered by health insurance?',
      category: 'general',
      submittedByName: 'Curious Visitor',
      submittedByEmail: 'visitor@example.com',
      status: 'submitted',
      createdAt: new Date().toISOString()
    });

    const faqSubmissionsRes = await request(app)
      .get('/api/v1/admin/faqs')
      .set('Authorization', adminToken);
    assert.equal(faqSubmissionsRes.status, 200);

    const publishFaqRes = await request(app)
      .post(`/api/v1/admin/faqs/${faqSubmissionId}/publish`)
      .set('Authorization', adminToken)
      .send({
        answer: 'Psyco AI provides itemized superbills that can be submitted to PPO insurance plans for out-of-network reimbursement.',
        category: 'general'
      });

    assert.ok(publishFaqRes.status === 200 || publishFaqRes.status === 201);
    assert.equal(publishFaqRes.body.data.status, 'published');

    // 5. User Account Status Management
    const suspendUserRes = await request(app)
      .patch(`/api/v1/admin/users/${patientUid}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'suspended',
        reason: 'Temporary review'
      });
    assert.equal(suspendUserRes.status, 200);
    assert.equal(suspendUserRes.body.data.accountStatus, 'suspended');

    // Reactivate user
    const reactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${patientUid}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'active',
        reason: 'Review complete'
      });
    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateRes.body.data.accountStatus, 'active');

    // 6. Audit Trail Retrieval
    const auditRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', adminToken);

    assert.equal(auditRes.status, 200);
    assert.ok(Array.isArray(auditRes.body.data));
    assert.ok(auditRes.body.data.length > 0, 'Audit trail must contain recorded events');
  });
});
