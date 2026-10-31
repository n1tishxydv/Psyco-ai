import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import {
  normalizeSchedulePeriod,
  normalizeWeeklySchedule,
  normalizeAvailability,
  getCanonicalSlotKey,
} from '../services/scheduling.service.js';

/**
 * Creates a deterministic synchronization barrier for concurrency testing.
 * All N workers pause at wait() until all N have arrived, releasing them simultaneously.
 */
function createBarrier(count) {
  let arrived = 0;
  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });
  return async function wait() {
    arrived++;
    if (arrived === count) {
      release();
    }
    await promise;
  };
}

test('PSYCO AI Phase 7.5.2A — Availability Normalization & Atomic Booking Remediation', async (t) => {
  // Setup synthetic identities
  const psychUid1 = 'psych_rem_01';
  const psychUid2 = 'psych_rem_02';
  const patientUid1 = 'patient_rem_01';
  const patientUid2 = 'patient_rem_02';
  const patientUid3 = 'patient_rem_03';
  const unauthorizedUid = 'patient_unauth_99';

  const psychToken1 = `Bearer test-token-psychologist-${psychUid1}`;
  const psychToken2 = `Bearer test-token-psychologist-${psychUid2}`;
  const patientToken1 = `Bearer test-token-patient-${patientUid1}`;
  const patientToken2 = `Bearer test-token-patient-${patientUid2}`;
  const patientToken3 = `Bearer test-token-patient-${patientUid3}`;
  const unauthorizedToken = `Bearer test-token-patient-${unauthorizedUid}`;

  // Use a future Monday 21 days from now (fixed in UTC noon to eliminate midnight date boundary shifts)
  const baseDate = new Date();
  baseDate.setUTCHours(12, 0, 0, 0);
  const currentDay = baseDate.getUTCDay();
  const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
  baseDate.setUTCDate(baseDate.getUTCDate() + 14 + daysUntilMonday);
  const testDate = baseDate.toISOString().split('T')[0]; // e.g. 2026-11-23

  const date2 = new Date(baseDate.getTime());
  date2.setUTCDate(date2.getUTCDate() + 7);
  const testDate2 = date2.toISOString().split('T')[0]; // clean future Monday

  await t.test('0. Fixture Initialization: Setup synthetic clinical practice & patients', async () => {
    // 1. Onboard Approved Clinician 1
    await firebaseRtdbAdapter.set(`psychologists/${psychUid1}`, {
      uid: psychUid1,
      fullName: 'Dr. Rebecca Jenkins',
      email: 'dr.jenkins@psycoai.example',
      approvalStatus: 'approved',
      verified: true,
      offeredModes: 'both',
      licenseNumber: 'PSY-TEST-001',
    });
    await firebaseRtdbAdapter.set(`users/${psychUid1}`, {
      uid: psychUid1,
      role: 'psychologist',
      accountStatus: 'active',
    });

    // 2. Onboard Approved Clinician 2
    await firebaseRtdbAdapter.set(`psychologists/${psychUid2}`, {
      uid: psychUid2,
      fullName: 'Dr. Marcus Vance',
      email: 'dr.vance@psycoai.example',
      approvalStatus: 'approved',
      verified: true,
      offeredModes: 'both',
      licenseNumber: 'PSY-TEST-002',
    });
    await firebaseRtdbAdapter.set(`users/${psychUid2}`, {
      uid: psychUid2,
      role: 'psychologist',
      accountStatus: 'active',
    });

    // 3. Onboard Patients
    for (const [uid, name] of [
      [patientUid1, 'Alex Mercer'],
      [patientUid2, 'Maya Lin'],
      [patientUid3, 'David Chen'],
    ]) {
      await firebaseRtdbAdapter.set(`patients/${uid}`, {
        uid,
        fullName: name,
        preferredName: name.split(' ')[0],
      });
      await firebaseRtdbAdapter.set(`users/${uid}`, {
        uid,
        role: 'patient',
        accountStatus: 'active',
      });
    }

    // Set canonical schedule for Clinician 1
    await firebaseRtdbAdapter.set(`availability/${psychUid1}`, {
      psychologistId: psychUid1,
      weeklySchedule: {
        monday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
      },
      bufferTimeMinutes: 10,
      sessionDurationMinutes: 50,
      bookingWindow: { minNoticeHours: 1, maxAdvanceDays: 60 },
      cancellationPolicy: { cutoffHours: 24 },
      reschedulingPolicy: { cutoffHours: 24 },
    });
  });

  // =========================================================================
  // TASK A: AVAILABILITY PROPERTY NORMALIZATION TESTS
  // =========================================================================
  await t.test('TASK A1: Normalizer handles canonical {startTime, endTime}', () => {
    const canonical = { startTime: '09:00', endTime: '17:00', mode: 'both' };
    const normalized = normalizeSchedulePeriod(canonical);
    assert.equal(normalized.startTime, '09:00');
    assert.equal(normalized.endTime, '17:00');
    assert.equal(normalized.mode, 'both');
  });

  await t.test('TASK A2: Normalizer handles legacy {start, end}', () => {
    const legacy = { start: '09:00', end: '17:00' };
    const normalized = normalizeSchedulePeriod(legacy);
    assert.equal(normalized.startTime, '09:00');
    assert.equal(normalized.endTime, '17:00');
    assert.equal(normalized.mode, 'both');
  });

  await t.test('TASK A3: Controlled validation error on missing start time', () => {
    assert.throws(
      () => normalizeSchedulePeriod({ endTime: '17:00' }),
      (err) => err.code === 'MISSING_START_TIME' && err.status === 400
    );
    assert.throws(
      () => normalizeSchedulePeriod({ start: null, end: '17:00' }),
      (err) => err.code === 'MISSING_START_TIME' && err.status === 400
    );
  });

  await t.test('TASK A4: Controlled validation error on missing end time', () => {
    assert.throws(
      () => normalizeSchedulePeriod({ startTime: '09:00' }),
      (err) => err.code === 'MISSING_END_TIME' && err.status === 400
    );
    assert.throws(
      () => normalizeSchedulePeriod({ start: '09:00', end: '' }),
      (err) => err.code === 'MISSING_END_TIME' && err.status === 400
    );
  });

  await t.test('TASK A5: Controlled validation error on invalid time format', () => {
    assert.throws(
      () => normalizeSchedulePeriod({ startTime: '9:00', endTime: '17:00' }),
      (err) => err.code === 'INVALID_TIME_FORMAT' && err.status === 400
    );
    assert.throws(
      () => normalizeSchedulePeriod({ start: '25:00', end: '17:00' }),
      (err) => err.code === 'INVALID_TIME_FORMAT' && err.status === 400
    );
    assert.throws(
      () => normalizeSchedulePeriod({ start: '09:00', end: '09:65' }),
      (err) => err.code === 'INVALID_TIME_FORMAT' && err.status === 400
    );
  });

  await t.test('TASK A6: Controlled validation error when start time equals end time', () => {
    assert.throws(
      () => normalizeSchedulePeriod({ startTime: '10:00', endTime: '10:00' }),
      (err) => err.code === 'START_TIME_EQUALS_END_TIME' && err.status === 400
    );
  });

  await t.test('TASK A7: Controlled validation error when start time is after end time', () => {
    assert.throws(
      () => normalizeSchedulePeriod({ startTime: '18:00', endTime: '10:00' }),
      (err) => err.code === 'START_TIME_AFTER_END_TIME' && err.status === 400
    );
  });

  await t.test('TASK A8: Normalizes legacy top-level availability settings', () => {
    const legacyAvail = {
      psychologistId: 'psych_legacy_test',
      weeklySchedule: {
        monday: [{ start: '09:00', end: '17:00' }],
      },
      bufferMinutes: 15,
      sessionDuration: 45,
      bookingLeadTimeHours: 4,
      maxAdvanceBookingDays: 45,
      cancellationCutoffHours: 48,
    };

    const normalized = normalizeAvailability(legacyAvail);
    assert.equal(normalized.weeklySchedule.monday[0].startTime, '09:00');
    assert.equal(normalized.weeklySchedule.monday[0].endTime, '17:00');
    assert.equal(normalized.bufferTimeMinutes, 15);
    assert.equal(normalized.sessionDurationMinutes, 45);
    assert.equal(normalized.bookingWindow.minNoticeHours, 4);
    assert.equal(normalized.bookingWindow.maxAdvanceDays, 45);
    assert.equal(normalized.cancellationPolicy.cutoffHours, 48);
  });

  await t.test('TASK A9: Untouched seeded account with legacy {start, end} generates available slots without HTTP 500', async () => {
    // Seed Dr. Vance with legacy properties directly in RTDB
    await firebaseRtdbAdapter.set(`availability/${psychUid2}`, {
      psychologistId: psychUid2,
      weeklySchedule: {
        monday: [{ start: '10:00', end: '18:00' }],
      },
      bufferMinutes: 10,
      sessionDuration: 50,
      bookingLeadTimeHours: 1,
      maxAdvanceBookingDays: 60,
    });

    // Request available slots
    const res = await request(app)
      .get(`/api/v1/psychologists/${psychUid2}/available-slots?date=${testDate}`)
      .set('Authorization', patientToken1);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.slots));
    assert.ok(res.body.data.slots.length > 0);

    const firstSlot = res.body.data.slots[0];
    assert.ok(firstSlot.startTime.includes('10:00'));
    assert.ok(firstSlot.endTime.includes('10:50'));
  });

  await t.test('TASK A10: Unauthorized user cannot update practice availability schedule', async () => {
    const res = await request(app)
      .put('/api/v1/availability/mine')
      .set('Authorization', patientToken1) // Patient role, not psychologist
      .send({
        weeklySchedule: {
          monday: [{ startTime: '09:00', endTime: '17:00' }],
        },
      });

    assert.equal(res.status, 403);
  });

  // =========================================================================
  // TASK D: MANDATORY CONCURRENCY TEST SUITE (TESTS 1 to 10)
  // =========================================================================

  await t.test('Test 1 — Two simultaneous users: exactly one 201, exactly one 409', async () => {
    const targetSlotStart = `${testDate}T09:00:00.000Z`;
    const targetSlotEnd = `${testDate}T09:50:00.000Z`;

    const barrier = createBarrier(2);

    const req1 = async () => {
      await barrier();
      return request(app)
        .post('/api/v1/appointments')
        .set('Authorization', patientToken1)
        .send({
          psychologistId: psychUid1,
          startTime: targetSlotStart,
          endTime: targetSlotEnd,
          mode: 'in_person',
          reason: 'Concurrent booking request User 1',
        });
    };

    const req2 = async () => {
      await barrier();
      return request(app)
        .post('/api/v1/appointments')
        .set('Authorization', patientToken2)
        .send({
          psychologistId: psychUid1,
          startTime: targetSlotStart,
          endTime: targetSlotEnd,
          mode: 'in_person',
          reason: 'Concurrent booking request User 2',
        });
    };

    const [res1, res2] = await Promise.all([req1(), req2()]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [201, 409], 'Must yield exactly one HTTP 201 and one HTTP 409');

    const conflictRes = res1.status === 409 ? res1 : res2;
    assert.equal(conflictRes.body.error?.code, 'SLOT_ALREADY_RESERVED');

    // Verify exactly one active reservation exists
    const slotKey = getCanonicalSlotKey(targetSlotStart);
    const reservation = await firebaseRtdbAdapter.get(`slotReservations/${psychUid1}/${slotKey}`);
    assert.ok(reservation);
    assert.equal(reservation.status, 'reserved');

    // Verify appointments in database
    const allApts = await firebaseRtdbAdapter.get('appointments') || {};
    const matchedApts = Object.values(allApts).filter(
      (a) => a.psychologistId === psychUid1 && a.startTime === targetSlotStart
    );
    assert.equal(matchedApts.length, 1, 'Exactly one appointment record must be created');
  });

  await t.test('Test 2 — Ten simultaneous requests for the same slot: exactly one 201, nine 409s', async () => {
    const targetSlotStart = `${testDate}T10:00:00.000Z`;
    const targetSlotEnd = `${testDate}T10:50:00.000Z`;

    const count = 10;
    const barrier = createBarrier(count);

    const workers = Array.from({ length: count }, (_, idx) => {
      return async () => {
        await barrier();
        return request(app)
          .post('/api/v1/appointments')
          .set('Authorization', patientToken2)
          .send({
            psychologistId: psychUid1,
            startTime: targetSlotStart,
            endTime: targetSlotEnd,
            mode: 'in_person',
            reason: `Parallel burst worker ${idx + 1}`,
          });
      };
    });

    const results = await Promise.all(workers.map((w) => w()));
    const successResponses = results.filter((r) => r.status === 201);
    const conflictResponses = results.filter((r) => r.status === 409);

    assert.equal(successResponses.length, 1, 'Exactly one request must succeed with HTTP 201');
    assert.equal(conflictResponses.length, 9, 'Exactly nine requests must be rejected with HTTP 409');

    for (const conf of conflictResponses) {
      assert.equal(conf.body.error?.code, 'SLOT_ALREADY_RESERVED');
    }

    // Verify database integrity
    const allApts = await firebaseRtdbAdapter.get('appointments') || {};
    const matched = Object.values(allApts).filter(
      (a) => a.psychologistId === psychUid1 && a.startTime === targetSlotStart
    );
    assert.equal(matched.length, 1, 'Only one appointment record exists for the contested slot');
  });

  await t.test('Test 3 — Different slots: simultaneous requests for different slots both succeed', async () => {
    const slotAStart = `${testDate}T11:00:00.000Z`;
    const slotAEnd = `${testDate}T11:50:00.000Z`;
    const slotBStart = `${testDate}T13:00:00.000Z`;
    const slotBEnd = `${testDate}T13:50:00.000Z`;

    const barrier = createBarrier(2);

    const reqA = async () => {
      await barrier();
      return request(app)
        .post('/api/v1/appointments')
        .set('Authorization', patientToken1)
        .send({
          psychologistId: psychUid1,
          startTime: slotAStart,
          endTime: slotAEnd,
          mode: 'in_person',
        });
    };

    const reqB = async () => {
      await barrier();
      return request(app)
        .post('/api/v1/appointments')
        .set('Authorization', patientToken3)
        .send({
          psychologistId: psychUid1,
          startTime: slotBStart,
          endTime: slotBEnd,
          mode: 'in_person',
        });
    };

    const [resA, resB] = await Promise.all([reqA(), reqB()]);
    assert.equal(resA.status, 201, 'Slot A booking must succeed');
    assert.equal(resB.status, 201, 'Slot B booking must succeed');
  });

  await t.test('Test 4 — Same patient retry: idempotency key returns identical appointment without duplication', async () => {
    const slotStart = `${testDate}T14:00:00.000Z`;
    const slotEnd = `${testDate}T14:50:00.000Z`;
    const idempotencyKey = `idem_test_${Date.now()}_abc`;

    // First booking attempt
    const firstRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .set('X-Idempotency-Key', idempotencyKey)
      .send({
        psychologistId: psychUid1,
        startTime: slotStart,
        endTime: slotEnd,
        mode: 'in_person',
        reason: 'Initial consultation with idempotency key',
      });

    assert.equal(firstRes.status, 201);
    const appointmentId = firstRes.body.data.appointment.id;

    // Retry with the same user and same idempotency key
    const retryRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .set('X-Idempotency-Key', idempotencyKey)
      .send({
        psychologistId: psychUid1,
        startTime: slotStart,
        endTime: slotEnd,
        mode: 'in_person',
      });

    assert.equal(retryRes.status, 201);
    assert.equal(retryRes.body.data.appointment.id, appointmentId, 'Must return same appointment ID');

    // Confirm that no second appointment was created
    const allApts = await firebaseRtdbAdapter.get('appointments') || {};
    const countForSlot = Object.values(allApts).filter(
      (a) => a.psychologistId === psychUid1 && a.startTime === slotStart
    ).length;
    assert.equal(countForSlot, 1, 'Database must contain exactly 1 appointment for this slot');
  });

  await t.test('Test 5 — Persistence failure: slot reservation is safely rolled back', async () => {
    const slotStart = `${testDate}T15:00:00.000Z`;
    const slotEnd = `${testDate}T15:50:00.000Z`;

    // Intercept firebaseRtdbAdapter.set once to simulate a disk/network fault during appointment write
    const originalSet = firebaseRtdbAdapter.set.bind(firebaseRtdbAdapter);
    let simulatedFailureInjected = false;

    firebaseRtdbAdapter.set = async (path, data) => {
      if (path.startsWith('appointments/apt_') && !simulatedFailureInjected) {
        simulatedFailureInjected = true;
        throw new Error('SIMULATED_DATABASE_IO_FAILURE');
      }
      return originalSet(path, data);
    };

    let failedRes;
    try {
      failedRes = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', patientToken1)
        .send({
          psychologistId: psychUid1,
          startTime: slotStart,
          endTime: slotEnd,
          mode: 'in_person',
        });
    } finally {
      firebaseRtdbAdapter.set = originalSet;
    }

    assert.equal(failedRes.status, 500);

    // Verify reservation was released (rolled back) and slot is NOT blocked
    const slotKey = getCanonicalSlotKey(slotStart);
    const reservation = await firebaseRtdbAdapter.get(`slotReservations/${psychUid1}/${slotKey}`);
    assert.ok(
      !reservation || reservation.status === 'released',
      'Failed reservation must be rolled back to released state'
    );

    // Verify that a subsequent booking for the exact same slot now succeeds!
    const recoveryRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken2)
      .send({
        psychologistId: psychUid1,
        startTime: slotStart,
        endTime: slotEnd,
        mode: 'in_person',
        reason: 'Post-recovery booking',
      });

    assert.equal(recoveryRes.status, 201, 'Slot must be claimable after previous failure rollback');
  });

  await t.test('Test 6 — Cancellation: releases the slot reservation', async () => {
    const slotStart = `${testDate}T16:00:00.000Z`;
    const slotEnd = `${testDate}T16:50:00.000Z`;

    // 1. Create appointment
    const createRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .send({
        psychologistId: psychUid1,
        startTime: slotStart,
        endTime: slotEnd,
        mode: 'in_person',
      });
    assert.equal(createRes.status, 201);
    const aptId = createRes.body.data.appointment.id;

    // 2. Clinician accepts appointment
    const acceptRes = await request(app)
      .post(`/api/v1/appointments/${aptId}/accept`)
      .set('Authorization', psychToken1);
    assert.equal(acceptRes.status, 200);

    // 3. Clinician cancels appointment (direct cancellation)
    const cancelRes = await request(app)
      .post(`/api/v1/appointments/${aptId}/cancel`)
      .set('Authorization', psychToken1)
      .send({ reason: 'Patient requested schedule adjustment' });
    assert.equal(cancelRes.status, 200);

    // 4. Verify slot becomes available again for another patient
    const rebookRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken2)
      .send({
        psychologistId: psychUid1,
        startTime: slotStart,
        endTime: slotEnd,
        mode: 'in_person',
        reason: 'Rebooking previously cancelled slot',
      });
    assert.equal(rebookRes.status, 201, 'Cancelled slot must be reusable by another user');
  });

  await t.test('Test 7 — Rescheduling: moves reservation from Slot A to Slot B consistently', async () => {
    // Clinician 2 schedule for rescheduling tests
    await firebaseRtdbAdapter.set(`availability/${psychUid2}`, {
      psychologistId: psychUid2,
      weeklySchedule: {
        monday: [{ startTime: '09:00', endTime: '18:00', mode: 'both' }],
      },
      bufferTimeMinutes: 10,
      sessionDurationMinutes: 50,
      bookingWindow: { minNoticeHours: 1, maxAdvanceDays: 60 },
      cancellationPolicy: { cutoffHours: 24 },
      reschedulingPolicy: { cutoffHours: 24 },
    });

    const slotAStart = `${testDate}T11:00:00.000Z`;
    const slotAEnd = `${testDate}T11:50:00.000Z`;
    const slotBStart = `${testDate}T14:00:00.000Z`;
    const slotBEnd = `${testDate}T14:50:00.000Z`;

    // Create booking in Slot A
    const createRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .send({
        psychologistId: psychUid2,
        startTime: slotAStart,
        endTime: slotAEnd,
        mode: 'in_person',
      });
    assert.equal(createRes.status, 201);
    const aptId = createRes.body.data.appointment.id;

    // Reschedule to Slot B (by clinician to avoid cutoff request queue)
    const reschedRes = await request(app)
      .post(`/api/v1/appointments/${aptId}/reschedule`)
      .set('Authorization', psychToken2)
      .send({
        newStartTime: slotBStart,
        newEndTime: slotBEnd,
        reason: 'Direct clinician reschedule',
      });
    assert.equal(reschedRes.status, 200);

    // Verify Slot A is now free: Patient 2 can book Slot A
    const bookSlotARes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken2)
      .send({
        psychologistId: psychUid2,
        startTime: slotAStart,
        endTime: slotAEnd,
        mode: 'in_person',
      });
    assert.equal(bookSlotARes.status, 201, 'Old slot must be freed after rescheduling');

    // Verify Slot B is protected: Patient 3 CANNOT book Slot B
    const bookSlotBRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken3)
      .send({
        psychologistId: psychUid2,
        startTime: slotBStart,
        endTime: slotBEnd,
        mode: 'in_person',
      });
    assert.equal(bookSlotBRes.status, 409, 'New rescheduled slot must be protected against collision');
  });

  await t.test('Test 8 — Concurrent rescheduling: competing reschedules into the same slot reject one', async () => {
    const slotInitial1 = `${testDate}T15:00:00.000Z`;
    const slotInitial2 = `${testDate}T16:00:00.000Z`;
    const contestedTarget = `${testDate}T17:00:00.000Z`;
    const contestedEnd = `${testDate}T17:50:00.000Z`;

    // Create appointment 1
    const apt1Res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .send({
        psychologistId: psychUid2,
        startTime: slotInitial1,
        endTime: `${testDate}T15:50:00.000Z`,
        mode: 'in_person',
      });
    assert.equal(apt1Res.status, 201);
    const aptId1 = apt1Res.body.data.appointment.id;

    // Create appointment 2
    const apt2Res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken2)
      .send({
        psychologistId: psychUid2,
        startTime: slotInitial2,
        endTime: `${testDate}T16:50:00.000Z`,
        mode: 'in_person',
      });
    assert.equal(apt2Res.status, 201);
    const aptId2 = apt2Res.body.data.appointment.id;

    // Both attempt to reschedule into contestedTarget simultaneously
    const barrier = createBarrier(2);

    const resched1 = async () => {
      await barrier();
      return request(app)
        .post(`/api/v1/appointments/${aptId1}/reschedule`)
        .set('Authorization', psychToken2)
        .send({
          newStartTime: contestedTarget,
          newEndTime: contestedEnd,
        });
    };

    const resched2 = async () => {
      await barrier();
      return request(app)
        .post(`/api/v1/appointments/${aptId2}/reschedule`)
        .set('Authorization', psychToken2)
        .send({
          newStartTime: contestedTarget,
          newEndTime: contestedEnd,
        });
    };

    const [reschedResult1, reschedResult2] = await Promise.all([resched1(), resched2()]);
    const statuses = [reschedResult1.status, reschedResult2.status].sort();

    assert.deepEqual(statuses, [200, 409], 'Exactly one reschedule succeeds, competing one receives 409');
  });

  await t.test('Test 9 — Authorization: unapproved clinician or unauthorized patient is rejected (403)', async () => {
    // Unapproved clinician
    await firebaseRtdbAdapter.set('psychologists/psych_unapproved_99', {
      uid: 'psych_unapproved_99',
      fullName: 'Unapproved Clinician',
      approvalStatus: 'pending',
      verified: false,
      offeredModes: 'both',
    });

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .send({
        psychologistId: 'psych_unapproved_99',
        startTime: `${testDate}T09:00:00.000Z`,
        endTime: `${testDate}T09:50:00.000Z`,
        mode: 'in_person',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.error?.code, 'PSYCHOLOGIST_NOT_VERIFIED');
  });

  await t.test('Test 10 — Timezone normalization: equivalent instants in different timezone formats map to same slot', async () => {
    // 09:00 UTC == 14:30 IST (+05:30) on the testDate
    // First, verify canonical UTC slot key calculation:
    const utcString = `${testDate}T09:00:00.000Z`;
    const istString = `${testDate}T14:30:00+05:30`;

    const keyUtc = getCanonicalSlotKey(utcString);
    const keyIst = getCanonicalSlotKey(istString);
    assert.equal(keyUtc, keyIst, 'UTC and IST string representations of same instant must produce identical slotKey');

    // Use a fresh slot on Clinician 1
    const testUtc = `${testDate}T12:00:00.000Z`;
    const testIst = `${testDate}T17:30:00+05:30`; // Same instant as 12:00 UTC

    // Book via UTC
    const bookUtcRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .send({
        psychologistId: psychUid1,
        startTime: testUtc,
        endTime: `${testDate}T12:50:00.000Z`,
        mode: 'in_person',
      });
    assert.equal(bookUtcRes.status, 201);

    // Attempt booking same instant expressed in +05:30 IST offset
    const bookIstRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken2)
      .send({
        psychologistId: psychUid1,
        startTime: testIst,
        endTime: `${testDate}T18:20:00+05:30`,
        mode: 'in_person',
      });

    assert.equal(bookIstRes.status, 409, 'Timestamp with +05:30 offset must conflict with equivalent UTC slot');
    assert.equal(bookIstRes.body.error?.code, 'SLOT_ALREADY_RESERVED');
  });

  await t.test('Test 11 — Overlapping intervals: competing requests with different start times reject one with 409', async () => {
    // Clinician schedule on Monday: 09:00 - 17:00
    // Contested overlapping window:
    // Request A: 13:00 - 13:50 UTC
    // Request B: 13:30 - 14:20 UTC (overlaps Request A)
    const slotAStart = `${testDate2}T13:00:00.000Z`;
    const slotAEnd = `${testDate2}T13:50:00.000Z`;
    const slotBStart = `${testDate2}T13:30:00.000Z`;
    const slotBEnd = `${testDate2}T14:20:00.000Z`;

    const barrier = createBarrier(2);

    const reqA = async () => {
      await barrier();
      return request(app)
        .post('/api/v1/appointments')
        .set('Authorization', patientToken1)
        .send({
          psychologistId: psychUid1,
          startTime: slotAStart,
          endTime: slotAEnd,
          mode: 'in_person',
          reason: 'Overlapping candidate A',
        });
    };

    const reqB = async () => {
      await barrier();
      return request(app)
        .post('/api/v1/appointments')
        .set('Authorization', patientToken2)
        .send({
          psychologistId: psychUid1,
          startTime: slotBStart,
          endTime: slotBEnd,
          mode: 'in_person',
          reason: 'Overlapping candidate B',
        });
    };

    const [resA, resB] = await Promise.all([reqA(), reqB()]);
    const statuses = [resA.status, resB.status].sort();

    assert.deepEqual(statuses, [201, 409], 'Exactly one overlapping interval must succeed, the other rejected with 409');
    const rejectedRes = resA.status === 409 ? resA : resB;
    assert.equal(rejectedRes.body.error?.code, 'SLOT_ALREADY_RESERVED');
  });

  await t.test('Test 12 — Idempotency payload mismatch: reused key with altered booking data is rejected with 409', async () => {
    const key = `idem_tamper_${Date.now()}`;
    const initialSlot = `${testDate}T09:00:00.000Z`;
    const initialEnd = `${testDate}T09:50:00.000Z`;

    // 1. Manually set an idempotency record for patientUid1
    const cryptoMod = await import('crypto');
    const originalFingerprint = cryptoMod.default
      .createHash('sha256')
      .update(JSON.stringify({
        psychologistId: psychUid1,
        startTime: initialSlot,
        endTime: initialEnd,
        sessionMode: 'in_person',
      }))
      .digest('hex');

    await firebaseRtdbAdapter.set(`idempotency/${patientUid1}/${key}`, {
      idempotencyKey: key,
      userId: patientUid1,
      appointmentId: 'apt_original_cached',
      payloadFingerprint: originalFingerprint,
      statusCode: 201,
      createdAt: new Date().toISOString(),
    });

    // 2. Retry with same key but DIFFERENT clinician or time
    const tamperedRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .set('X-Idempotency-Key', key)
      .send({
        psychologistId: psychUid2, // Altered clinician!
        startTime: initialSlot,
        endTime: initialEnd,
        mode: 'in_person',
      });

    assert.equal(tamperedRes.status, 409);
    assert.equal(tamperedRes.body.error?.code, 'IDEMPOTENCY_PAYLOAD_MISMATCH');
  });

  await t.test('Test 13 — Crash recovery: stale reservation with expired lease is safely reclaimed', async () => {
    const crashSlotStart = `${testDate2}T10:00:00.000Z`;
    const crashSlotEnd = `${testDate2}T10:50:00.000Z`;
    const slotKey = getCanonicalSlotKey(crashSlotStart);

    // Simulate an abandoned reservation from a crashed Node.js process:
    // status is 'reserved', but expiresAt was 20 minutes ago and no appointment was ever written
    const expiredTimestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    await firebaseRtdbAdapter.set(`slotReservations/${psychUid1}/${slotKey}`, {
      slotKey,
      psychologistId: psychUid1,
      startTime: crashSlotStart,
      endTime: crashSlotEnd,
      patientId: 'patient_crashed_worker',
      appointmentId: 'apt_never_persisted',
      status: 'reserved',
      createdAt: expiredTimestamp,
      expiresAt: expiredTimestamp,
    });

    // A new patient attempts to book this slot: the expired lease must be reclaimed
    const reclaimRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken3)
      .send({
        psychologistId: psychUid1,
        startTime: crashSlotStart,
        endTime: crashSlotEnd,
        mode: 'in_person',
        reason: 'Reclaiming abandoned crashed reservation',
      });

    assert.equal(reclaimRes.status, 201, 'Expired unpersisted reservation must be reclaimed without manual intervention');
    const newReservation = await firebaseRtdbAdapter.get(`slotReservations/${psychUid1}/${slotKey}`);
    assert.equal(newReservation.patientId, patientUid3);
    assert.equal(newReservation.status, 'reserved');
  });

  await t.test('Test 14 — Duplicate / concurrent cancellation: idempotent and safe', async () => {
    const slotStart = `${testDate2}T11:00:00.000Z`;
    const slotEnd = `${testDate2}T11:50:00.000Z`;

    // 1. Create and confirm appointment
    const createRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', patientToken1)
      .send({
        psychologistId: psychUid1,
        startTime: slotStart,
        endTime: slotEnd,
        mode: 'in_person',
      });
    assert.equal(createRes.status, 201);
    const aptId = createRes.body.data.appointment.id;

    // 2. Perform two simultaneous cancellation requests
    const barrier = createBarrier(2);
    const cancel1 = async () => {
      await barrier();
      return request(app)
        .post(`/api/v1/appointments/${aptId}/cancel`)
        .set('Authorization', psychToken1)
        .send({ reason: 'Cancellation worker 1' });
    };
    const cancel2 = async () => {
      await barrier();
      return request(app)
        .post(`/api/v1/appointments/${aptId}/cancel`)
        .set('Authorization', psychToken1)
        .send({ reason: 'Cancellation worker 2' });
    };

    const [cRes1, cRes2] = await Promise.all([cancel1(), cancel2()]);
    assert.equal(cRes1.status, 200);
    assert.equal(cRes2.status, 200);

    const apt = await firebaseRtdbAdapter.get(`appointments/${aptId}`);
    assert.equal(apt.status, 'cancelled');
  });
});

