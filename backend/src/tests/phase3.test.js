import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

test('Phase 3: Appointment Booking, Availability, Calendar Management & Concurrency', async (t) => {
  const patientToken = 'Bearer test-token-patient-patient_p3_01';
  const psychToken = 'Bearer test-token-psychologist-psych_p3_01';
  const competitorToken = 'Bearer test-token-patient-patient_p3_02';

  const psychUid = 'psych_p3_01';

  // Helper date: A future Wednesday 14 days from now
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 14);
  const dayOfWeek = targetDate.getDay();
  const diffToWed = (3 - dayOfWeek + 7) % 7;
  targetDate.setDate(targetDate.getDate() + diffToWed);
  const futureWednesday = targetDate.toISOString().split('T')[0];

  let appointmentId1 = null;
  let appointmentId2 = null;

  await t.test('1. Seed test users (patient & psychologist profiles)', async () => {
    // Onboard psychologist
    const psychRes = await request(app)
      .post('/api/v1/profile/onboard/psychologist')
      .set('Authorization', psychToken)
      .send({
        fullName: 'Dr. Sarah Connor',
        licenseNumber: 'PSY-99281',
        specializations: ['Cognitive Behavioral Therapy (CBT)', 'Anxiety Disorders'],
        consultationModes: ['both'],
        phone: '+1 555-0988',
        bio: 'Clinical Psychologist specialized in cognitive behavioral frameworks.',
      });
    assert.equal(psychRes.status, 201);

    // Administrative verification of clinician fixture
    await firebaseRtdbAdapter.set(`psychologists/${psychUid}/approvalStatus`, 'approved');
    await firebaseRtdbAdapter.set(`users/${psychUid}/accountStatus`, 'active');

    // Onboard patient 1
    const p1Res = await request(app)
      .post('/api/v1/profile/onboard/patient')
      .set('Authorization', patientToken)
      .send({
        fullName: 'Alice Walker',
        gender: 'female',
        age: 32,
        phone: '+1 555-0144',
      });
    assert.equal(p1Res.status, 201);

    // Onboard competitor patient 2
    const p2Res = await request(app)
      .post('/api/v1/profile/onboard/patient')
      .set('Authorization', competitorToken)
      .send({
        fullName: 'Bob Smith',
        gender: 'male',
        age: 35,
        phone: '+1 555-0188',
      });
    assert.equal(p2Res.status, 201);
  });

  await t.test('2. Psychologist configures weekly availability & session parameters', async () => {
    const res = await request(app)
      .put('/api/v1/availability/mine')
      .set('Authorization', psychToken)
      .send({
        weeklySchedule: {
          wednesday: { enabled: true, startTime: '09:00', endTime: '13:00', mode: 'both' },
          thursday: { enabled: true, startTime: '09:00', endTime: '13:00', mode: 'both' },
        },
        sessionDurationMinutes: 50,
        bufferMinutes: 10,
        minNoticeHours: 2,
        maxAdvanceDays: 60,
        cancellationCutoffHours: 24,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.availability.sessionDurationMinutes, 50);
    assert.equal(res.body.data.availability.bufferTimeMinutes, 10);
  });

  await t.test('3. Query available consultation slots for future Wednesday', async () => {
    const res = await request(app)
      .get(`/api/v1/psychologists/${psychUid}/available-slots?date=${futureWednesday}`)
      .set('Authorization', patientToken);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.slots));
    assert.ok(res.body.data.slots.length > 0);

    // Verify first slot starts at 09:00 and lasts 50 mins
    const firstSlot = res.body.data.slots[0];
    assert.ok(firstSlot.startTime.includes('09:00'));
    assert.ok(firstSlot.endTime.includes('09:50'));
  });

  await t.test('4. Blocked date & leave period enforcement', async () => {
    // Add a blocked date
    const blockRes = await request(app)
      .post('/api/v1/availability/blocked-dates')
      .set('Authorization', psychToken)
      .send({
        date: futureWednesday,
        reason: 'Clinical Conference',
      });
    assert.equal(blockRes.status, 201);
    const blockId = blockRes.body.data.blockedDate.id;

    // Verify 0 slots generated on the blocked date
    const slotsRes1 = await request(app)
      .get(`/api/v1/psychologists/${psychUid}/available-slots?date=${futureWednesday}`)
      .set('Authorization', patientToken);
    assert.equal(slotsRes1.status, 200);
    assert.equal(slotsRes1.body.data.slots.length, 0);

    // Unblock the date
    const unblockRes = await request(app)
      .delete(`/api/v1/availability/blocked-dates/${blockId}`)
      .set('Authorization', psychToken);
    assert.equal(unblockRes.status, 200);

    // Verify slots restored
    const slotsRes2 = await request(app)
      .get(`/api/v1/psychologists/${psychUid}/available-slots?date=${futureWednesday}`)
      .set('Authorization', patientToken);
    assert.equal(slotsRes2.status, 200);
    assert.ok(slotsRes2.body.data.slots.length > 0);
  });

  await t.test('5. Patient 1 books appointment (In-Person default mode)', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken)
      .send({
        psychologistId: psychUid,
        date: futureWednesday,
        startTime: '09:00',
        endTime: '09:50',
        mode: 'in_person',
        patientNotes: 'Initial anxiety consultation',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.appointment.status, 'pending');
    assert.equal(res.body.data.appointment.sessionMode, 'in_person');
    assert.ok(res.body.data.appointment.sessionPin);
    assert.equal(res.body.data.appointment.sessionPin.length, 6);

    appointmentId1 = res.body.data.appointment.id;
  });

  await t.test('6. Atomic double-booking concurrency prevention (reject competing slot)', async () => {
    // Attempt exact same slot
    const exactDupRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', competitorToken)
      .send({
        psychologistId: psychUid,
        date: futureWednesday,
        startTime: '09:00',
        endTime: '09:50',
        mode: 'online',
      });

    assert.equal(exactDupRes.status, 409);
    assert.equal(exactDupRes.body.error.code, 'SLOT_ALREADY_RESERVED');

    // Attempt overlapping slot inside buffer period (e.g. 09:40 - 10:30, overlaps 09:00 - 09:50 + 10m buffer)
    const bufferOverlapRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', competitorToken)
      .send({
        psychologistId: psychUid,
        date: futureWednesday,
        startTime: '09:40',
        endTime: '10:30',
        mode: 'online',
      });

    assert.equal(bufferOverlapRes.status, 409);
    assert.equal(bufferOverlapRes.body.error.code, 'SLOT_ALREADY_RESERVED');
  });

  await t.test('7. Psychologist accepts appointment 1', async () => {
    const res = await request(app)
      .post(`/api/v1/appointments/${appointmentId1}/accept`)
      .set('Authorization', psychToken);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.appointment.status, 'confirmed');
  });

  await t.test('8. Propose alternative slot & Patient responds', async () => {
    // Patient 2 requests next non-overlapping slot (10:00 - 10:50)
    const p2BookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', competitorToken)
      .send({
        psychologistId: psychUid,
        date: futureWednesday,
        startTime: '10:00',
        endTime: '10:50',
        mode: 'online',
      });
    assert.equal(p2BookRes.status, 201);
    appointmentId2 = p2BookRes.body.data.appointment.id;

    // Psychologist proposes alternative slot (11:00 - 11:50)
    const proposeRes = await request(app)
      .post(`/api/v1/appointments/${appointmentId2}/propose-alternative`)
      .set('Authorization', psychToken)
      .send({
        date: futureWednesday,
        startTime: '11:00',
        endTime: '11:50',
        reason: 'Schedule adjustment needed',
      });

    assert.equal(proposeRes.status, 200);
    assert.equal(proposeRes.body.data.appointment.status, 'reschedule_requested');
    assert.ok(proposeRes.body.data.appointment.proposedSlot.startTime.includes('11:00'));

    // Patient 2 accepts alternative slot
    const acceptAltRes = await request(app)
      .post(`/api/v1/appointments/${appointmentId2}/respond-alternative`)
      .set('Authorization', competitorToken)
      .send({
        action: 'accept',
      });

    assert.equal(acceptAltRes.status, 200);
    assert.equal(acceptAltRes.body.data.appointment.status, 'confirmed');
    assert.ok(acceptAltRes.body.data.appointment.startTime.includes('11:00'));
    assert.ok(acceptAltRes.body.data.appointment.endTime.includes('11:50'));
  });

  await t.test('9. In-app notifications & read status', async () => {
    const notifsRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', psychToken);

    assert.equal(notifsRes.status, 200);
    assert.ok(Array.isArray(notifsRes.body.data.notifications));
    assert.ok(notifsRes.body.data.notifications.length > 0);

    const firstNotif = notifsRes.body.data.notifications[0];

    // Mark as read
    const readRes = await request(app)
      .post(`/api/v1/notifications/${firstNotif.id}/read`)
      .set('Authorization', psychToken);

    assert.equal(readRes.status, 200);
    assert.equal(readRes.body.data.notification.read, true);

    // Check unread count
    const countRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', psychToken);

    assert.equal(countRes.status, 200);
    assert.ok(typeof countRes.body.data.unreadCount === 'number');
  });

  await t.test('10. Appointment cancellation frees up calendar slot', async () => {
    const cancelRes = await request(app)
      .post(`/api/v1/appointments/${appointmentId1}/cancel`)
      .set('Authorization', patientToken)
      .send({
        reason: 'Personal conflict resolved, cancelling consultation',
      });

    assert.equal(cancelRes.status, 200);
    assert.equal(cancelRes.body.data.appointment.status, 'cancelled');

    // Slot 09:00 - 09:50 should now be available again for booking!
    const rebookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', competitorToken)
      .send({
        psychologistId: psychUid,
        date: futureWednesday,
        startTime: '09:00',
        endTime: '09:50',
        mode: 'in_person',
      });

    assert.equal(rebookRes.status, 201);
  });

  await t.test('11. Google Calendar OAuth adapter endpoint responses', async () => {
    const statusRes = await request(app)
      .get('/api/v1/integrations/google/status')
      .set('Authorization', psychToken);

    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.success, true);
    assert.equal(typeof statusRes.body.data.connected, 'boolean');

    const authUrlRes = await request(app)
      .get('/api/v1/integrations/google/auth-url')
      .set('Authorization', psychToken);

    // When unconfigured on server, returns 503; if configured, returns 200 with accounts.google.com URL
    if (authUrlRes.status === 200) {
      assert.ok(authUrlRes.body.data.url.includes('accounts.google.com'));
      assert.ok(authUrlRes.body.data.url.includes('calendar'));
    } else {
      assert.equal(authUrlRes.status, 503);
      assert.equal(authUrlRes.body.error.code, 'GOOGLE_OAUTH_UNCONFIGURED');
    }
  });
});
