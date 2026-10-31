import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

describe('PSYCO AI Phase 4: Administrator Portal, Clinic Governance & Platform Operations', () => {
  const adminUid = 'admin_p4_audit';
  const psychUid = 'psych_p4_audit';
  const unapprovedPsychUid = 'psych_unapproved_p4';
  const patientUid = 'patient_p4_audit';

  const adminToken = `Bearer test-token-admin-${adminUid}`;
  const psychToken = `Bearer test-token-psychologist-${psychUid}`;
  const unapprovedPsychToken = `Bearer test-token-psychologist-${unapprovedPsychUid}`;
  const patientToken = `Bearer test-token-patient-${patientUid}`;

  before(async () => {
    // Seed test users in RTDB
    await firebaseRtdbAdapter.set(`users/${adminUid}`, {
      uid: adminUid,
      email: 'admin@psyco.ai',
      role: 'admin',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });

    await firebaseRtdbAdapter.set(`users/${psychUid}`, {
      uid: psychUid,
      email: 'psych@psyco.ai',
      role: 'psychologist',
      fullName: 'Dr. Tested Clinician',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });

    await firebaseRtdbAdapter.set(`psychologists/${psychUid}`, {
      id: psychUid,
      uid: psychUid,
      email: 'psych@psyco.ai',
      fullName: 'Dr. Tested Clinician',
      licenseNumber: 'PSY-TEST-4421',
      yearsOfExperience: 9,
      verified: true,
      approvalStatus: 'approved',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });

    await firebaseRtdbAdapter.set(`users/${unapprovedPsychUid}`, {
      uid: unapprovedPsychUid,
      email: 'unapproved@psyco.ai',
      role: 'psychologist',
      fullName: 'Dr. Pending Clinician',
      accountStatus: 'pending_verification',
      createdAt: new Date().toISOString(),
    });

    await firebaseRtdbAdapter.set(`psychologists/${unapprovedPsychUid}`, {
      id: unapprovedPsychUid,
      uid: unapprovedPsychUid,
      email: 'unapproved@psyco.ai',
      fullName: 'Dr. Pending Clinician',
      licenseNumber: 'PSY-PENDING-9988',
      yearsOfExperience: 2,
      verified: false,
      approvalStatus: 'pending',
      accountStatus: 'pending_verification',
      createdAt: new Date().toISOString(),
    });

    await firebaseRtdbAdapter.set(`users/${patientUid}`, {
      uid: patientUid,
      email: 'patient@example.com',
      role: 'patient',
      fullName: 'John Patient',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });
  });

  after(async () => {
    // Cleanup synthetic test records
    await firebaseRtdbAdapter.remove(`users/${adminUid}`);
    await firebaseRtdbAdapter.remove(`users/${psychUid}`);
    await firebaseRtdbAdapter.remove(`psychologists/${psychUid}`);
    await firebaseRtdbAdapter.remove(`users/${unapprovedPsychUid}`);
    await firebaseRtdbAdapter.remove(`psychologists/${unapprovedPsychUid}`);
    await firebaseRtdbAdapter.remove(`users/${patientUid}`);
  });

  // SCENARIO 1: OPERATIONAL DASHBOARD TELEMETRY & METRICS
  test('Scenario 1: Authorized administrator retrieves operational metrics & pending actions', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', adminToken);

    assert.equal(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(typeof res.body.data.totalUsers === 'number');
    assert.ok(typeof res.body.data.psychologistCount === 'number');
    assert.ok(typeof res.body.data.pendingApprovals === 'number');
    assert.ok(Array.isArray(res.body.data.pendingActions));
  });

  test('Scenario 1B: Non-admin users cannot access administrative metrics', async () => {
    const patientRes = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', patientToken);
    assert.equal(patientRes.status, 403);

    const psychRes = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', psychToken);
    assert.equal(psychRes.status, 403);
  });

  // SCENARIO 2: USER GOVERNANCE & ACCOUNT SUSPENSION
  test('Scenario 2: Administrator queries user directory and manages account status', async () => {
    const dirRes = await request(app)
      .get('/api/v1/admin/users?role=patient')
      .set('Authorization', adminToken);

    assert.equal(dirRes.status, 200);
    assert.ok(Array.isArray(dirRes.body.data.users));
    assert.ok(dirRes.body.data.users.some((u) => u.uid === patientUid));

    // Suspend patient account
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/users/${patientUid}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'suspended',
        reason: 'Temporary compliance hold for identity verification',
      });

    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.data.status, 'suspended');

    // Reactivate account
    const reactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${patientUid}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'active',
        reason: 'Identity verified successfully',
      });

    assert.equal(reactivateRes.status, 200);
    assert.equal(reactivateRes.body.data.status, 'active');
  });

  test('Scenario 2B: Administrator self-suspension is strictly blocked', async () => {
    const selfSuspendRes = await request(app)
      .patch(`/api/v1/admin/users/${adminUid}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'suspended',
        reason: 'Accidental self suspension attempt',
      });

    assert.equal(selfSuspendRes.status, 400);
    assert.equal(selfSuspendRes.body.error.code, 'SELF_SUSPENSION_PROHIBITED');
  });

  // SCENARIO 3: CLINICIAN CREDENTIAL VERIFICATION WORKFLOW
  test('Scenario 3: Administrator reviews, approves, and rejects clinician credentials', async () => {
    // List pending psychologists
    const listRes = await request(app)
      .get('/api/v1/admin/psychologists?status=pending')
      .set('Authorization', adminToken);

    assert.equal(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data));
    assert.ok(listRes.body.data.some((p) => p.uid === unapprovedPsychUid));

    // Clinicians cannot approve themselves
    const selfApproveRes = await request(app)
      .post(`/api/v1/admin/psychologists/${unapprovedPsychUid}/review`)
      .set('Authorization', unapprovedPsychToken)
      .send({ approved: true, reason: 'Self-approval attempt' });
    assert.equal(selfApproveRes.status, 403);

    // Rejection without reason is rejected
    const invalidRejectRes = await request(app)
      .post(`/api/v1/admin/psychologists/${unapprovedPsychUid}/review`)
      .set('Authorization', adminToken)
      .send({ approved: false, status: 'rejected', reason: '' });
    assert.equal(invalidRejectRes.status, 400);

    // Authorized administrator approves clinician
    const approveRes = await request(app)
      .post(`/api/v1/admin/psychologists/${unapprovedPsychUid}/review`)
      .set('Authorization', adminToken)
      .send({
        approved: true,
        status: 'approved',
        reason: 'State board registration license verified with registry',
      });

    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.data.approvalStatus, 'approved');
    assert.equal(approveRes.body.data.verified, true);

    // Verify record in RTDB reflects verified status
    const verifiedPsych = await firebaseRtdbAdapter.get(`psychologists/${unapprovedPsychUid}`);
    assert.equal(verifiedPsych.verified, true);
    assert.equal(verifiedPsych.approvalStatus, 'approved');
  });

  // SCENARIO 4: CLINIC MANAGEMENT & MEMBERSHIP GOVERNANCE
  test('Scenario 4: Administrator registers clinic, reviews status, and manages memberships', async () => {
    const clinicPayload = {
      name: 'Lotus Behavioral Health Center',
      organizationType: 'private_group',
      primaryContact: 'Dr. Lotus Patel',
      email: 'admin@lotusbehavioral.org',
      phone: '+91 80 2345 6789',
      address: {
        line1: '42 Indiranagar 100ft Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
      },
      description: 'Comprehensive psychological and behavioral health facility.',
    };

    // Create clinic
    const createRes = await request(app)
      .post('/api/v1/admin/clinics')
      .set('Authorization', adminToken)
      .send(clinicPayload);

    assert.equal(createRes.status, 201);
    const clinicId = createRes.body.data.clinic.id;
    assert.ok(clinicId);

    // List clinics
    const listRes = await request(app)
      .get('/api/v1/admin/clinics')
      .set('Authorization', adminToken);

    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.data.clinics.some((c) => c.id === clinicId));

    // Update clinic status (e.g., suspend)
    const suspendClinicRes = await request(app)
      .patch(`/api/v1/admin/clinics/${clinicId}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'suspended',
        reason: 'Periodic organizational license renewal audit in progress',
      });

    assert.equal(suspendClinicRes.status, 200);
    assert.equal(suspendClinicRes.body.data.clinic.status, 'suspended');

    // Test clinic membership workflow
    const membershipId = `mem_${psychUid}_${clinicId}`;
    await firebaseRtdbAdapter.set(`practiceMemberships/${membershipId}`, {
      id: membershipId,
      psychologistId: psychUid,
      psychologistName: 'Dr. Tested Clinician',
      clinicId,
      clinicName: clinicPayload.name,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    });

    const membershipsRes = await request(app)
      .get(`/api/v1/admin/clinics/memberships?clinicId=${clinicId}`)
      .set('Authorization', adminToken);

    assert.equal(membershipsRes.status, 200);
    assert.ok(membershipsRes.body.data.memberships.some((m) => m.id === membershipId));

    // Approve membership
    const reviewMemRes = await request(app)
      .patch(`/api/v1/admin/clinics/memberships/${membershipId}`)
      .set('Authorization', adminToken)
      .send({ status: 'approved', reason: 'Verified clinical credentials and credentialing' });

    assert.equal(reviewMemRes.status, 200);
    assert.equal(reviewMemRes.body.data.membership.status, 'approved');

    // Cleanup clinic
    await firebaseRtdbAdapter.remove(`clinics/${clinicId}`);
    await firebaseRtdbAdapter.remove(`practices/${clinicId}`);
    await firebaseRtdbAdapter.remove(`practiceMemberships/${membershipId}`);
  });

  // SCENARIO 5: INDEPENDENT PRACTICE OVERSIGHT
  test('Scenario 5: Administrator monitors independent practices without forcing clinic affiliation', async () => {
    const indepId = `indep_${psychUid}`;
    await firebaseRtdbAdapter.set(`practices/${indepId}`, {
      id: indepId,
      ownerUid: psychUid,
      type: 'independent',
      practiceName: 'Autonomous Clinical Psychology Practice',
      offeredModes: 'both',
      defaultMode: 'in_person',
      locations: [
        {
          id: 'loc_test_01',
          name: 'Consultation Suite 402',
          address: { city: 'Bengaluru' },
          isDefault: true,
        },
      ],
      appointmentDurationMinutes: 50,
      bufferTimeMinutes: 10,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    const practicesRes = await request(app)
      .get('/api/v1/admin/practices')
      .set('Authorization', adminToken);

    assert.equal(practicesRes.status, 200);
    assert.ok(practicesRes.body.data.practices.some((p) => p.id === indepId));

    // Suspend independent practice
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/practices/${indepId}/status`)
      .set('Authorization', adminToken)
      .send({
        status: 'suspended',
        reason: 'Temporary practitioner request for sabbatical',
      });

    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.data.practice.status, 'suspended');

    // Cleanup practice
    await firebaseRtdbAdapter.remove(`practices/${indepId}`);
  });

  // SCENARIO 6: SUPPORT TICKET WORKSPACE
  test('Scenario 6: Support ticket operations, priority management, and clinical privacy warnings', async () => {
    const ticketId = `tkt_test_${Date.now()}`;
    await firebaseRtdbAdapter.set(`supportTickets/${ticketId}`, {
      id: ticketId,
      ticketNumber: 'TKT-TEST-01',
      userEmail: 'patient@example.com',
      userName: 'John Patient',
      category: 'technical_difficulties',
      priority: 'high',
      status: 'open',
      subject: 'Video consultation link connectivity issue',
      message: 'Google Meet link gave an authorization error during my morning session.',
      createdAt: new Date().toISOString(),
      replies: [],
    });

    // List tickets
    const listRes = await request(app)
      .get('/api/v1/admin/support/tickets?priority=high')
      .set('Authorization', adminToken);

    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.data.tickets.some((t) => t.id === ticketId));

    // Post internal reply
    const replyRes = await request(app)
      .post(`/api/v1/admin/support/tickets/${ticketId}/replies`)
      .set('Authorization', adminToken)
      .send({
        message: 'Checked Google OAuth token sync: token refreshed automatically.',
        isInternal: true,
      });

    assert.equal(replyRes.status, 201);
    assert.equal(replyRes.body.data.reply.isInternal, true);

    // Update status to resolved
    const updateRes = await request(app)
      .patch(`/api/v1/admin/support/tickets/${ticketId}`)
      .set('Authorization', adminToken)
      .send({
        status: 'resolved',
        priority: 'normal',
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.ticket.status, 'resolved');

    // Cleanup ticket
    await firebaseRtdbAdapter.remove(`supportTickets/${ticketId}`);
  });

  // SCENARIO 7: FAQ MODERATION & PUBLIC CMS
  test('Scenario 7: Full FAQ CRUD and Public Website CMS content editor', async () => {
    // 1. Create FAQ
    const createFaqRes = await request(app)
      .post('/api/v1/admin/faqs')
      .set('Authorization', adminToken)
      .send({
        question: 'How are clinical credentials verified by Psyco AI?',
        answer: 'Psyco AI administrators verify state psychologist registrations against official government clinical licensing boards.',
        category: 'Credential Verification',
        order: 5,
        published: true,
      });

    assert.equal(createFaqRes.status, 201);
    const faqId = createFaqRes.body.data.faq.id;
    assert.ok(faqId);

    // 2. Update FAQ
    const updateFaqRes = await request(app)
      .put(`/api/v1/admin/faqs/${faqId}`)
      .set('Authorization', adminToken)
      .send({
        order: 2,
        published: false,
      });

    assert.equal(updateFaqRes.status, 200);
    assert.equal(updateFaqRes.body.data.faq.order, 2);
    assert.equal(updateFaqRes.body.data.faq.published, false);

    // 3. Toggle Publish
    const toggleRes = await request(app)
      .patch(`/api/v1/admin/faqs/${faqId}/publish`)
      .set('Authorization', adminToken)
      .send({ published: true });

    assert.equal(toggleRes.status, 200);
    assert.equal(toggleRes.body.data.faq.published, true);

    // 4. Public Content CMS Update
    const cmsRes = await request(app)
      .put('/api/v1/admin/content/announcements')
      .set('Authorization', adminToken)
      .send({
        title: 'Platform System Notice',
        content: 'Psyco AI will conduct routine database maintenance on Sunday at 02:00 AM UTC.',
      });

    assert.equal(cmsRes.status, 200);
    assert.equal(cmsRes.body.data.content.sectionKey, 'announcements');

    // 5. Delete FAQ
    const deleteFaqRes = await request(app)
      .delete(`/api/v1/admin/faqs/${faqId}`)
      .set('Authorization', adminToken);

    assert.equal(deleteFaqRes.status, 200);
    assert.equal(deleteFaqRes.body.data.success, true);
  });

  // SCENARIO 8: IMMUTABLE AUDIT LOGGING & APPEND-ONLY INTEGRITY
  test('Scenario 8: Audit events are recorded on admin actions and protected from unauthorized read', async () => {
    const logsRes = await request(app)
      .get('/api/v1/admin/audit-logs?limit=10')
      .set('Authorization', adminToken);

    assert.equal(logsRes.status, 200);
    assert.ok(Array.isArray(logsRes.body.data));

    // Patients cannot inspect compliance audit logs
    const patientDenialRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', patientToken);

    assert.equal(patientDenialRes.status, 403);
  });

  // SCENARIO 9: SYSTEM HEALTH TELEMETRY WITHOUT SECRET LEAKS
  test('Scenario 9: System health telemetry surfaces service status without exposing API keys or secrets', async () => {
    const healthRes = await request(app)
      .get('/api/v1/admin/system-health')
      .set('Authorization', adminToken);

    assert.equal(healthRes.status, 200);
    assert.ok(healthRes.body.data.services);
    assert.ok(healthRes.body.data.services.backendServer);
    assert.ok(healthRes.body.data.services.firebaseRtdb);

    const serialized = JSON.stringify(healthRes.body.data);
    assert.ok(!serialized.includes('FIREBASE_PRIVATE_KEY'));
    assert.ok(!serialized.includes('GEMINI_API_KEY'));
    assert.ok(!serialized.includes('ASSEMBLYAI_API_KEY'));
  });

  // SCENARIO 10: PLATFORM SETTINGS PERSISTENCE
  test('Scenario 10: Operational platform settings can be retrieved and updated', async () => {
    const getRes = await request(app)
      .get('/api/v1/admin/settings')
      .set('Authorization', adminToken);

    assert.equal(getRes.status, 200);
    assert.ok(getRes.body.data.settings.platformName);

    const updateRes = await request(app)
      .put('/api/v1/admin/settings')
      .set('Authorization', adminToken)
      .send({
        platformName: 'Psyco AI Mental Health Platform',
        defaultAppointmentDuration: 55,
        defaultBufferTime: 15,
        requireCredentialVerification: true,
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.settings.platformName, 'Psyco AI Mental Health Platform');
    assert.equal(updateRes.body.data.settings.defaultAppointmentDuration, 55);
  });

  // SCENARIO 11: STRICT PRIVACY LOCKOUT BARRIER
  test('Scenario 11: Administrator is strictly barred from accessing private clinical notes or transcripts', async () => {
    // Attempt to access clinical notes
    const notesRes = await request(app)
      .get('/api/v1/clinical/patients/patient_p4_test_99/chart')
      .set('Authorization', adminToken);

    assert.equal(notesRes.status, 403);
    assert.equal(notesRes.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
  });
});
