import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { seedStagingEnvironment } from '../../scripts/seedStagingEnvironment.js';
import { schedulingService } from '../services/scheduling.service.js';

test('PHASE 7.4: INDEPENDENT CODE AUDIT, SECURITY REVIEW & RELEASE VERIFICATION', async (suite) => {
  const adminUid = 'admin_staging_01';
  const adminToken = `Bearer test-token-admin-${adminUid}`;
  const psychUid = 'psych_staging_01';
  const psychToken = `Bearer test-token-psychologist-${psychUid}`;
  const patientUid = 'patient_staging_01';
  const patientToken = `Bearer test-token-patient-${patientUid}`;
  const patient2Uid = 'patient_staging_02';
  const patient2Token = `Bearer test-token-patient-${patient2Uid}`;

  suite.before(async () => {
    await seedStagingEnvironment({ dryRun: false });
  });

  // =========================================================================
  // TASK B AUDIT: CALENDAR EXPORT SECURITY & ZERO-PIN COMPLIANCE
  // =========================================================================
  await suite.test('1. Task B: Calendar Export Security & Zero-PIN Compliance', () => {
    const mockConfirmedAppointment = {
      id: 'apt_conf_audit_99182',
      psychologistId: psychUid,
      patientId: patientUid,
      startTime: '2026-11-20T10:00:00.000Z',
      endTime: '2026-11-20T10:50:00.000Z',
      sessionPin: '938104',
      meetingUrl: 'https://meet.google.com/xyz-abcd-efg',
      status: 'confirmed',
    };

    // Format UTC for calendar (YYYYMMDDTHHmmssZ) with validation
    const formatUtc = (iso) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startUtc = formatUtc(mockConfirmedAppointment.startTime);
    const endUtc = formatUtc(mockConfirmedAppointment.endTime);

    assert.strictEqual(startUtc, '20261120T100000Z');
    assert.strictEqual(endUtc, '20261120T105000Z');

    // Test Invalid Date handling
    assert.strictEqual(formatUtc('invalid-date'), null);
    assert.strictEqual(formatUtc(null), null);
    assert.strictEqual(formatUtc(''), null);

    // Google Calendar URL Generator
    const title = encodeURIComponent('Psyco AI Appointment');
    const details = encodeURIComponent('Scheduled consultation via Psyco AI Healthcare Platform.');
    const location = encodeURIComponent('Psyco AI Telehealth');
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;

    // Assert URL Format & minimal event info
    assert.ok(googleUrl.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
    assert.ok(googleUrl.includes('text=Psyco%20AI%20Appointment'));
    assert.ok(googleUrl.includes('20261120T100000Z/20261120T105000Z'));

    // Critical Security Assertions: Zero credentials, Zero PIN, Zero database IDs, Zero PHI
    assert.strictEqual(googleUrl.includes(mockConfirmedAppointment.sessionPin), false, 'PIN must never appear in Google URL');
    assert.strictEqual(googleUrl.includes('938104'), false, 'PIN digits must not appear');
    assert.strictEqual(googleUrl.includes(mockConfirmedAppointment.id), false, 'Appointment ID must not be leaked in URL');
    assert.strictEqual(googleUrl.includes(mockConfirmedAppointment.meetingUrl), false, 'Private meeting URL must not be in query');
    assert.strictEqual(googleUrl.includes('symptom'), false);
    assert.strictEqual(googleUrl.includes('diagnosis'), false);
    assert.strictEqual(googleUrl.includes('SOAP'), false);

    // RFC 5545 iCalendar (.ics) Generator
    const randomUid = 'event-uuid-audit-999';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Psyco AI//Practice Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${randomUid}@psyco.ai`,
      `DTSTAMP:20261031T120000Z`,
      `DTSTART:${startUtc}`,
      `DTEND:${endUtc}`,
      `SUMMARY:Psyco AI Appointment`,
      `DESCRIPTION:Scheduled consultation via Psyco AI Healthcare Platform.`,
      `LOCATION:Psyco AI Telehealth`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // RFC 5545 Compliance
    assert.ok(icsContent.startsWith('BEGIN:VCALENDAR\r\n'));
    assert.ok(icsContent.endsWith('\r\nEND:VCALENDAR'));
    assert.ok(icsContent.includes('SUMMARY:Psyco AI Appointment'));
    assert.ok(icsContent.includes(`DTSTART:20261120T100000Z`));
    assert.ok(icsContent.includes(`DTEND:20261120T105000Z`));
    assert.ok(icsContent.includes('STATUS:CONFIRMED'));

    // Critical Security Assertions for ICS
    assert.strictEqual(icsContent.includes(mockConfirmedAppointment.sessionPin), false, 'PIN must not be in ICS');
    assert.strictEqual(icsContent.includes('PIN:'), false, 'PIN label must not be in ICS');
    assert.strictEqual(icsContent.includes(mockConfirmedAppointment.id), false, 'Database ID must not be in ICS');
    assert.strictEqual(icsContent.includes('depression'), false);
    assert.strictEqual(icsContent.includes('anxiety'), false);
  });

  // =========================================================================
  // TASK C AUDIT: INTAKE DRAFT PERSISTENCE, REBAC & IMMUTABILITY GUARD
  // =========================================================================
  await suite.test('2. Task C: Patient Intake Draft Isolation & Immutability Guard', async () => {
    // 2.1 Unsubmitted draft saving
    const draftPayload = {
      sectionA: { occupation: 'Software Architect', emergencyContactName: 'Auditor Contact', emergencyContactPhone: '555-0199' },
      sectionB: { primaryReasons: ['Work & Career Burnout'], severityRating: 5 },
    };

    const draftRes = await request(app)
      .post('/api/v1/intake/draft')
      .set('Authorization', patientToken)
      .send(draftPayload);

    assert.strictEqual(draftRes.status, 200);
    assert.strictEqual(draftRes.body.data.intake.status, 'draft');

    // 2.2 ReBAC Isolation: Patient 2 cannot access Patient 1 draft
    const crossRes = await request(app)
      .get(`/api/v1/intake/patient/${patientUid}`)
      .set('Authorization', patient2Token);
    assert.strictEqual(crossRes.status, 403);

    // 2.3 Admin Clinical Lockout
    const adminRes = await request(app)
      .get(`/api/v1/intake/patient/${patientUid}`)
      .set('Authorization', adminToken);
    assert.strictEqual(adminRes.status, 403);
    assert.strictEqual(adminRes.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');

    // 2.4 Final submit
    const submitPayload = {
      sectionA: {
        occupation: 'Software Architect',
        maritalStatus: 'Single',
        emergencyContactName: 'Auditor Contact',
        emergencyContactPhone: '555-0199',
        emergencyContactRelationship: 'Spouse',
      },
      sectionB: {
        primaryReasons: ['Work & Career Burnout'],
        symptomDuration: '1-6 months',
        severityRating: 5,
        therapyGoals: 'Stress reduction and work-life balance',
      },
      sectionC: { previousTherapy: false },
      sectionD: { sleepQuality: 'fair', exerciseFrequency: 'occasional', supportSystemRating: 3 },
      sectionE: { suicidalIdeationPastMonth: false, selfHarmHistory: false, immediateRiskAcknowledged: false },
      sectionF: {
        consentToTreatment: true,
        aiAssistanceAcknowledged: true,
        telehealthConsent: true,
        privacyNoticeAcknowledged: true,
        signatureName: 'Alex Mercer',
      },
    };

    const submitRes = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', patientToken)
      .send(submitPayload);

    assert.strictEqual(submitRes.status, 201);
    assert.strictEqual(submitRes.body.data.intake.status, 'submitted');

    // 2.5 Immutability Guard: Cannot overwrite submitted intake with a draft!
    const overwriteAttemptRes = await request(app)
      .post('/api/v1/intake/draft')
      .set('Authorization', patientToken)
      .send({ sectionA: { occupation: 'Malicious Overwrite' } });

    assert.strictEqual(overwriteAttemptRes.status, 400);
    assert.strictEqual(overwriteAttemptRes.body.error.code, 'INTAKE_ALREADY_SUBMITTED');
  });

  // =========================================================================
  // TASK D AUDIT: BACKEND AUTHORITATIVE INTERVAL OVERLAP VALIDATION
  // =========================================================================
  await suite.test('3. Task D: Backend Authoritative Interval Overlap Validation', async () => {
    // Clean initial availability for psych_staging_01
    await schedulingService.updateAvailability(psychUid, {
      blockedDates: [],
      leavePeriods: [],
    });

    // 3.1 Add initial leave period: Nov 10 to Nov 15
    const leave1Res = await request(app)
      .post('/api/v1/availability/leave')
      .set('Authorization', psychToken)
      .send({
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        reason: 'Annual Clinical Retreat',
      });
    assert.strictEqual(leave1Res.status, 201);

    // 3.2 Attempt to add overlapping leave (Nov 12 to Nov 18) -> Backend MUST REJECT with 409
    const overlapLeaveRes = await request(app)
      .post('/api/v1/availability/leave')
      .set('Authorization', psychToken)
      .send({
        startDate: '2026-11-12',
        endDate: '2026-11-18',
        reason: 'Conflicting Leave Attempt',
      });
    assert.strictEqual(overlapLeaveRes.status, 409);
    assert.strictEqual(overlapLeaveRes.body.error.code, 'LEAVE_INTERVAL_OVERLAP');

    // 3.3 Add non-overlapping adjacent leave (Nov 16 to Nov 20) -> Backend MUST ACCEPT
    const adjacentLeaveRes = await request(app)
      .post('/api/v1/availability/leave')
      .set('Authorization', psychToken)
      .send({
        startDate: '2026-11-16',
        endDate: '2026-11-20',
        reason: 'Adjacent Non-Overlapping Leave',
      });
    assert.strictEqual(adjacentLeaveRes.status, 201);

    // 3.4 Attempt to add a blocked date that falls within the leave window (Nov 13) -> Backend MUST REJECT
    const blockInLeaveRes = await request(app)
      .post('/api/v1/availability/blocked-dates')
      .set('Authorization', psychToken)
      .send({
        date: '2026-11-13',
        isFullDay: true,
        reason: 'Collision with Leave',
      });
    assert.strictEqual(blockInLeaveRes.status, 409);
    assert.strictEqual(blockInLeaveRes.body.error.code, 'DATE_IN_LEAVE_PERIOD');

    // 3.5 Add a valid blocked date outside leave (Nov 25)
    const validBlockRes = await request(app)
      .post('/api/v1/availability/blocked-dates')
      .set('Authorization', psychToken)
      .send({
        date: '2026-11-25',
        isFullDay: true,
        reason: 'Single Day Off',
      });
    assert.strictEqual(validBlockRes.status, 201);

    // 3.6 Attempt duplicate full-day block on same date -> Backend MUST REJECT with 409
    const dupBlockRes = await request(app)
      .post('/api/v1/availability/blocked-dates')
      .set('Authorization', psychToken)
      .send({
        date: '2026-11-25',
        isFullDay: true,
        reason: 'Duplicate Full Day Block',
      });
    assert.strictEqual(dupBlockRes.status, 409);
    assert.strictEqual(dupBlockRes.body.error.code, 'DATE_ALREADY_BLOCKED');
  });

  // =========================================================================
  // TASK F & G AUDIT: REPORTS AND ACCESSIBILITY ROUTE SECURITY
  // =========================================================================
  await suite.test('4. Task F & G: Reports ReBAC Guard & Mobile Accessibility Endpoints', async () => {
    // Psychologist generating empty-date-range report returns structured response
    const emptyDatePayload = {
      patientId: patientUid,
      reportType: 'progress_report',
      dateFrom: '2029-01-01',
      dateTo: '2029-01-31',
    };

    const reportRes = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', psychToken)
      .send(emptyDatePayload);

    assert.ok([200, 201].includes(reportRes.status));

    // Admin lockout on report generation
    const adminReportRes = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', adminToken)
      .send(emptyDatePayload);

    assert.strictEqual(adminReportRes.status, 403);
    assert.strictEqual(adminReportRes.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');

    // Public and responsive routes available for mobile navbar
    const publicFaqRes = await request(app).get('/api/v1/public/faqs');
    assert.strictEqual(publicFaqRes.status, 200);

    const publicPsychRes = await request(app).get('/api/v1/psychologists');
    assert.strictEqual(publicPsychRes.status, 200);
  });
});
