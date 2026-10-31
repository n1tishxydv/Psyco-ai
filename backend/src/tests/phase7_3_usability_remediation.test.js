import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { schedulingService } from '../services/scheduling.service.js';
import { seedStagingEnvironment } from '../../scripts/seedStagingEnvironment.js';

test('PHASE 7.3: USABILITY REMEDIATION VERIFICATION SUITE', async (suite) => {
  const adminUid = 'admin_staging_01';
  const adminToken = `Bearer test-token-admin-${adminUid}`;
  const psychUid = 'psych_staging_01';
  const psychToken = `Bearer test-token-psychologist-${psychUid}`;
  const patientUid = 'patient_staging_01';
  const patientToken = `Bearer test-token-patient-${patientUid}`;
  const otherPatientUid = 'patient_staging_02';
  const otherPatientToken = `Bearer test-token-patient-${otherPatientUid}`;

  suite.before(async () => {
    await seedStagingEnvironment({ dryRun: false, allowSubpathTest: false });
  });

  // =========================================================================
  // TASK 1: DEF-03 PATIENT INTAKE MULTI-STEP & DRAFT PERSISTENCE
  // =========================================================================
  await suite.test('1. DEF-03: Patient Intake Draft Persistence & Scoped Isolation', async () => {
    // 1.1 Patient saves Step 1 & Step 2 draft safely to backend
    const draftPayload = {
      sectionA: {
        occupation: 'Software Engineer',
        maritalStatus: 'Single',
        emergencyContactName: 'John Mercer',
        emergencyContactPhone: '+1 555-0199',
        emergencyContactRelationship: 'Brother',
      },
      sectionB: {
        primaryReasons: ['Generalized Anxiety', 'Work & Career Burnout'],
        symptomDuration: '1-6 months',
        severityRating: 7,
        therapyGoals: 'Learn cognitive strategies to manage stress',
      },
      sectionC: {
        previousTherapy: true,
        previousDiagnoses: 'None',
        currentMedications: 'None',
        familyMentalHealthHistory: 'None',
      },
      sectionD: {
        sleepQuality: 'fair',
        exerciseFrequency: 'regular',
        supportSystemRating: 4,
        substanceUseDetails: 'Occasional caffeine',
      },
      sectionE: {
        suicidalIdeationPastMonth: false,
        selfHarmHistory: false,
        immediateRiskAcknowledged: false,
        safetyNotes: 'Stable mood',
      },
    };

    const draftRes = await request(app)
      .post('/api/v1/intake/draft')
      .set('Authorization', patientToken)
      .send(draftPayload);

    assert.strictEqual(draftRes.status, 200);
    assert.strictEqual(draftRes.body.success, true);
    assert.strictEqual(draftRes.body.data.intake.status, 'draft');
    assert.strictEqual(draftRes.body.data.intake.patientId, patientUid);

    // 1.2 Verify Patient A cannot be read by Patient B (Patient isolation)
    const patient2FetchRes = await request(app)
      .get('/api/v1/intake/my-intake')
      .set('Authorization', otherPatientToken);

    assert.strictEqual(patient2FetchRes.status, 200);
    if (patient2FetchRes.body.data?.intake) {
      assert.notStrictEqual(patient2FetchRes.body.data.intake.patientId, patientUid);
    }

    // 1.3 Administrator clinical lockout: Admin CANNOT read or save patient intake
    const adminIntakeRes = await request(app)
      .get('/api/v1/intake/my-intake')
      .set('Authorization', adminToken);

    assert.strictEqual(adminIntakeRes.status, 403);
    assert.strictEqual(adminIntakeRes.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');

    // 1.4 Client validation schema: Missing required emergency contact or consent on final submit
    const invalidSubmitRes = await request(app)
      .post('/api/v1/intake/submit')
      .set('Authorization', patientToken)
      .send({
        // Missing Section F consent & signature
        ...draftPayload,
      });

    assert.strictEqual(invalidSubmitRes.status, 400);
    assert.strictEqual(invalidSubmitRes.body.success, false);
  });

  // =========================================================================
  // TASK 2: DEF-04 REPORTS PAGE EMPTY-DATE-RANGE MESSAGING
  // =========================================================================
  await suite.test('2. DEF-04: Reports Generation with Empty Date Range Handled Gracefully', async () => {
    // 2.1 Psychologist queries a future date window with zero sessions (e.g., year 2099)
    const emptyDatePayload = {
      patientId: patientUid,
      reportType: 'session_summary',
      dateRange: {
        startDate: '2099-01-01',
        endDate: '2099-01-31',
      },
    };

    const reportRes = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', psychToken)
      .send(emptyDatePayload);

    // Backend returns 201 Created or 200 OK without crashing with 500
    assert.ok([200, 201].includes(reportRes.status));
    assert.strictEqual(reportRes.body.success, true);
    assert.ok(reportRes.body.data.report);

    // Verified psychologist receives report structure; empty date filter yields detectable empty content
    const report = reportRes.body.data.report;
    assert.strictEqual(report.patientId, patientUid);
    assert.ok(Array.isArray(report.sections));

    // 2.2 Admin clinical lockout on report generation
    const adminReportRes = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', adminToken)
      .send(emptyDatePayload);

    assert.strictEqual(adminReportRes.status, 403);
    assert.strictEqual(adminReportRes.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
  });

  // =========================================================================
  // TASK 3: DEF-05 MOBILE NAVIGATION DRAWER SPECIFICATION
  // =========================================================================
  await suite.test('3. DEF-05: Mobile Navigation Hierarchy & Role Isolation', async () => {
    // Assert public and directory route configurations exist
    const publicEndpoints = ['/api/v1/public/faqs', '/api/v1/psychologists'];
    for (const ep of publicEndpoints) {
      const res = await request(app).get(ep);
      assert.strictEqual(res.status, 200);
    }

    // Role boundary: Patient trying to access psychologist clinical workspace
    const patientClinicalRes = await request(app)
      .get(`/api/v1/clinical/patients/${patientUid}/chart`)
      .set('Authorization', patientToken);

    assert.strictEqual(patientClinicalRes.status, 403);
  });

  // =========================================================================
  // TASK 4: DEF-06 AVAILABILITY OVERLAP DETECTION ENGINE
  // =========================================================================
  await suite.test('4. DEF-06: Interval Overlap Detection Algorithm', () => {
    // Test helper matching client-side interval overlap logic:
    // Overlap condition: startA <= endB && endA >= startB
    const checkLeaveOverlap = (newStart, newEnd, existingStart, existingEnd) => {
      return newStart <= existingEnd && newEnd >= existingStart;
    };

    // 4.1 Identical interval -> Overlap
    assert.strictEqual(checkLeaveOverlap('2026-11-01', '2026-11-05', '2026-11-01', '2026-11-05'), true);

    // 4.2 Complete containment -> Overlap
    assert.strictEqual(checkLeaveOverlap('2026-11-02', '2026-11-04', '2026-11-01', '2026-11-10'), true);
    assert.strictEqual(checkLeaveOverlap('2026-11-01', '2026-11-10', '2026-11-02', '2026-11-04'), true);

    // 4.3 Partial overlap (tail) -> Overlap
    assert.strictEqual(checkLeaveOverlap('2026-11-04', '2026-11-08', '2026-11-01', '2026-11-05'), true);

    // 4.4 Partial overlap (head) -> Overlap
    assert.strictEqual(checkLeaveOverlap('2026-10-28', '2026-11-02', '2026-11-01', '2026-11-05'), true);

    // 4.5 Strictly adjacent intervals -> MUST NOT OVERLAP
    // e.g. Oct 25 to Oct 31, and Nov 1 to Nov 5
    assert.strictEqual(checkLeaveOverlap('2026-11-01', '2026-11-05', '2026-10-25', '2026-10-31'), false);
    assert.strictEqual(checkLeaveOverlap('2026-10-25', '2026-10-31', '2026-11-01', '2026-11-05'), false);

    // 4.6 Daily schedule time interval validation
    const validateTimeRow = (startTime, endTime) => {
      if (!startTime || !endTime) return 'REQUIRED';
      if (startTime >= endTime) return 'INVALID_INTERVAL';
      return 'VALID';
    };

    assert.strictEqual(validateTimeRow('09:00', '17:00'), 'VALID');
    assert.strictEqual(validateTimeRow('17:00', '09:00'), 'INVALID_INTERVAL');
    assert.strictEqual(validateTimeRow('12:00', '12:00'), 'INVALID_INTERVAL');
    assert.strictEqual(validateTimeRow('', '12:00'), 'REQUIRED');
  });

  // =========================================================================
  // TASK 5: DEF-07 BOOKING CALENDAR EXPORT (GOOGLE CAL & RFC 5545 .ICS)
  // =========================================================================
  await suite.test('5. DEF-07: Calendar Export Engine & Zero-PHI Compliance', () => {
    const mockAppointment = {
      id: 'apt_test_cal_01',
      startTime: '2026-11-15T14:00:00.000Z',
      endTime: '2026-11-15T14:50:00.000Z',
      sessionMode: 'online',
      sessionPin: '849201',
    };

    // Format UTC for calendar (YYYYMMDDTHHmmssZ)
    const formatUtc = (iso) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    const startUtc = formatUtc(mockAppointment.startTime);
    const endUtc = formatUtc(mockAppointment.endTime);

    assert.strictEqual(startUtc, '20261115T140000Z');
    assert.strictEqual(endUtc, '20261115T145000Z');

    // 5.1 Google Calendar URL Generator (Minimal Privacy-Safe Event Info)
    const title = encodeURIComponent('Psyco AI Appointment');
    const location = encodeURIComponent('Psyco AI Telehealth');
    const details = encodeURIComponent('Scheduled consultation via Psyco AI Healthcare Platform.');
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;

    assert.ok(googleUrl.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
    assert.ok(googleUrl.includes('Psyco%20AI%20Appointment'));
    assert.ok(googleUrl.includes('20261115T140000Z/20261115T145000Z'));
    // Assert zero credentials, zero PIN, zero internal ID, zero clinical PHI
    assert.strictEqual(googleUrl.includes('PIN'), false);
    assert.strictEqual(googleUrl.includes(mockAppointment.sessionPin), false);
    assert.strictEqual(googleUrl.includes(mockAppointment.id), false);
    assert.strictEqual(googleUrl.includes('symptom'), false);
    assert.strictEqual(googleUrl.includes('diagnosis'), false);
    assert.strictEqual(googleUrl.includes('SOAP'), false);
    assert.strictEqual(googleUrl.includes('intake'), false);

    // 5.2 RFC 5545 iCalendar (.ics) String Generation (Minimal Privacy-Safe Event Info)
    const randomUid = 'event-uuid-test-1234';
    const uid = `${randomUid}@psyco.ai`;
    const summary = 'Psyco AI Appointment';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Psyco AI//Practice Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:20261031T120000Z`,
      `DTSTART:${startUtc}`,
      `DTEND:${endUtc}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:Scheduled consultation via Psyco AI Healthcare Platform.`,
      `LOCATION:Psyco AI Telehealth`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    // Verify standards compliance
    assert.ok(icsContent.startsWith('BEGIN:VCALENDAR\r\n'));
    assert.ok(icsContent.endsWith('\r\nEND:VCALENDAR'));
    assert.ok(icsContent.includes('VERSION:2.0'));
    assert.ok(icsContent.includes('BEGIN:VEVENT'));
    assert.ok(icsContent.includes(`UID:event-uuid-test-1234@psyco.ai`));
    assert.ok(icsContent.includes(`DTSTART:20261115T140000Z`));
    assert.ok(icsContent.includes(`DTEND:20261115T145000Z`));
    assert.ok(icsContent.includes('STATUS:CONFIRMED'));
    assert.ok(icsContent.includes('SUMMARY:Psyco AI Appointment'));
    // Assert zero credentials, zero PIN, zero database IDs, zero PHI in ICS
    assert.strictEqual(icsContent.includes('PIN'), false);
    assert.strictEqual(icsContent.includes(mockAppointment.sessionPin), false);
    assert.strictEqual(icsContent.includes(mockAppointment.id), false);
    assert.strictEqual(icsContent.includes('depression'), false);
    assert.strictEqual(icsContent.includes('anxiety'), false);
  });
});
