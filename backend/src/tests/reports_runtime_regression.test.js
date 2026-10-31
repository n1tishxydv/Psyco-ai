import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { clinicalService } from '../../../frontend/src/services/clinicalService.js';
import { setRuntimeApiBaseUrl } from '../../../frontend/src/services/apiClient.js';

setRuntimeApiBaseUrl('https://api.psyco-ai.com/api/v1');

test('Reports Page Runtime Remediation & Data Contract Regression Test Suite', async (suite) => {
  const psychUid = 'psych_reports_test_01';
  const psychToken = `Bearer test-token-psychologist-${psychUid}`;

  const patientUid = 'patient_reports_test_01';
  const patientToken = `Bearer test-token-patient-${patientUid}`;

  const adminUid = 'admin_reports_test_01';
  const adminToken = `Bearer test-token-admin-${adminUid}`;

  const unverifiedPsychUid = 'psych_unverified_reports_01';
  const unverifiedPsychToken = `Bearer test-token-psychologist-${unverifiedPsychUid}`;

  suite.before(async () => {
    // 1. Seed verified psychologist
    await firebaseRtdbAdapter.set(`users/${psychUid}`, {
      uid: psychUid,
      email: 'dr.reports@psyco-ai.com',
      role: 'psychologist',
      accountStatus: 'active',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    });
    await firebaseRtdbAdapter.set(`psychologists/${psychUid}`, {
      userId: psychUid,
      fullName: 'Dr. Report Specialist',
      approvalStatus: 'approved',
      licenseNumber: 'LIC-REPORT-101',
    });

    // 2. Seed patient in users and patients collections
    await firebaseRtdbAdapter.set(`users/${patientUid}`, {
      uid: patientUid,
      email: 'patient.reports@psyco-ai.com',
      role: 'patient',
      accountStatus: 'active',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    });
    await firebaseRtdbAdapter.set(`patients/${patientUid}`, {
      id: patientUid,
      userId: patientUid,
      fullName: 'Alice Patient',
      email: 'patient.reports@psyco-ai.com',
      createdAt: new Date().toISOString(),
    });

    // 3. Seed unverified psychologist
    await firebaseRtdbAdapter.set(`users/${unverifiedPsychUid}`, {
      uid: unverifiedPsychUid,
      email: 'dr.unverified@psyco-ai.com',
      role: 'psychologist',
      accountStatus: 'active',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    });
    await firebaseRtdbAdapter.set(`psychologists/${unverifiedPsychUid}`, {
      userId: unverifiedPsychUid,
      fullName: 'Dr. Unverified Clinician',
      approvalStatus: 'pending',
    });

    // 4. Seed admin
    await firebaseRtdbAdapter.set(`users/${adminUid}`, {
      uid: adminUid,
      email: 'admin.reports@psyco-ai.com',
      role: 'admin',
      accountStatus: 'active',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    });

    // 5. Establish patient-psychologist relationship via completed appointment
    const appointmentId = 'apt_reports_test_01';
    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, {
      id: appointmentId,
      psychologistId: psychUid,
      patientId: patientUid,
      status: 'completed',
      scheduledAt: new Date(Date.now() - 3600000).toISOString(),
      serviceType: 'therapy',
      mode: 'telehealth',
      createdAt: new Date().toISOString(),
    });
    await firebaseRtdbAdapter.set(`appointments_by_user/${psychUid}/${appointmentId}`, true);
    await firebaseRtdbAdapter.set(`appointments_by_user/${patientUid}/${appointmentId}`, true);
  });

  // =========================================================================
  // TASK 2.3 & 2.4: CLIENT-SIDE SERVICE BOUNDARY NORMALIZATION TESTS
  // =========================================================================

  await suite.test('1. Valid Patient Array: returns array directly and supports .find(), .filter(), .map()', async () => {
    const originalFetch = globalThis.fetch;
    try {
      const mockPatients = [
        { patientId: 'pat_101', name: 'Alice Smith', totalSessions: 3 },
        { patientId: 'pat_102', name: 'Bob Jones', totalSessions: 1 },
      ];

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockPatients,
      });

      const res = await clinicalService.getAssignedPatients();
      assert.ok(Array.isArray(res), 'Normalized response must be an Array');
      assert.equal(res.length, 2);

      // Verify .find() works without throwing TypeError: c.find is not a function
      const found = res.find((p) => p.patientId === 'pat_101');
      assert.ok(found, 'Should find patient by ID');
      assert.equal(found.name, 'Alice Smith');

      // Verify .map() and .filter()
      const ids = res.map((p) => p.patientId);
      assert.deepEqual(ids, ['pat_101', 'pat_102']);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await suite.test('2. Empty Patient Array: returns empty array without throwing on .find()', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => [],
      });

      const res = await clinicalService.getAssignedPatients();
      assert.ok(Array.isArray(res));
      assert.equal(res.length, 0);

      const found = res.find((p) => p.patientId === 'non_existent');
      assert.equal(found, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await suite.test('3. Null / Undefined Response: safely normalizes to empty array without crashing', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => null,
      });

      const res = await clinicalService.getAssignedPatients();
      assert.ok(Array.isArray(res), 'Must normalize null response to empty array');
      assert.equal(res.length, 0);
      assert.equal(typeof res.find, 'function', '.find() must be callable');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await suite.test('4. Standard API Envelope Object ({ success: true, data: { patients: [...] } }): normalizes to array and preserves backward compatibility', async () => {
    const originalFetch = globalThis.fetch;
    try {
      const envelopeData = {
        success: true,
        data: {
          patients: [
            { patientId: 'pat_201', name: 'Carol Danvers', totalSessions: 5 },
            { patientId: 'pat_202', name: 'David Banner', totalSessions: 2 },
          ],
        },
        error: null,
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => envelopeData,
      });

      const res = await clinicalService.getAssignedPatients();
      assert.ok(Array.isArray(res), 'Must normalize envelope to an actual Array');
      assert.equal(res.length, 2);

      // Crucial test: .find() does not throw TypeError: c.find is not a function
      const selectedPatient = res.find((p) => p.patientId === 'pat_201');
      assert.ok(selectedPatient);
      assert.equal(selectedPatient.name, 'Carol Danvers');

      // Backward compatibility check: existing callers using res.data?.patients
      assert.ok(Array.isArray(res.data?.patients), 'Must preserve res.data.patients property for existing pages');
      assert.equal(res.data.patients.length, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await suite.test('5. Paginated Envelope Object ({ data: { patients: [...], pagination: { ... } } }): extracts array correctly', async () => {
    const originalFetch = globalThis.fetch;
    try {
      const paginatedEnvelope = {
        success: true,
        data: {
          patients: [{ patientId: 'pat_301', name: 'Emma Frost' }],
          pagination: { total: 1, page: 1, limit: 10 },
        },
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => paginatedEnvelope,
      });

      const res = await clinicalService.getAssignedPatients();
      assert.ok(Array.isArray(res));
      assert.equal(res.length, 1);
      assert.equal(res[0].patientId, 'pat_301');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await suite.test('6. Malformed Response (object without patients property, or scalar): normalizes to empty array', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ message: 'ok', unknownField: true }),
      });

      const res = await clinicalService.getAssignedPatients();
      assert.ok(Array.isArray(res), 'Must safely fallback to empty array for unexpected object shape');
      assert.equal(res.length, 0);
      assert.equal(typeof res.find, 'function');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await suite.test('7. API Failure (HTTP 500 / Network Error): rejects and does not disguise failure as successful empty result', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Database connection failed' },
        }),
      });

      await assert.rejects(
        async () => {
          await clinicalService.getAssignedPatients();
        },
        (err) => {
          assert.equal(err.status, 500);
          assert.equal(err.code, 'INTERNAL_ERROR');
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // =========================================================================
  // BACKEND API CONTRACT & ROLE AUTHORIZATION TESTS
  // =========================================================================

  await suite.test('8. Backend /clinical/patients: Unauthorized request (no token) returns 401', async () => {
    const res = await request(app).get('/api/v1/clinical/patients');
    assert.equal(res.status, 401);
  });

  await suite.test('9. Backend /clinical/patients: Patient role access returns 403 INSUFFICIENT_ROLE_PERMISSIONS', async () => {
    const res = await request(app)
      .get('/api/v1/clinical/patients')
      .set('Authorization', patientToken);
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'INSUFFICIENT_ROLE_PERMISSIONS');
  });

  await suite.test('10. Backend /clinical/patients: Admin role access returns 403 ADMIN_CLINICAL_ACCESS_PROHIBITED', async () => {
    const res = await request(app)
      .get('/api/v1/clinical/patients')
      .set('Authorization', adminToken);
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
  });

  await suite.test('11. Backend /clinical/patients: Unverified psychologist returns 403 PSYCHOLOGIST_NOT_VERIFIED', async () => {
    const res = await request(app)
      .get('/api/v1/clinical/patients')
      .set('Authorization', unverifiedPsychToken);
    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'PSYCHOLOGIST_NOT_VERIFIED');
  });

  await suite.test('12. Backend /clinical/patients: Verified psychologist succeeds with valid envelope', async () => {
    const res = await request(app)
      .get('/api/v1/clinical/patients')
      .set('Authorization', psychToken);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
    assert.ok(Array.isArray(res.body.data.patients));
    assert.ok(res.body.data.patients.length >= 1);

    const assigned = res.body.data.patients.find((p) => p.patientId === patientUid);
    assert.ok(assigned, 'Assigned patient must be in psychologist roster');
    assert.ok(typeof assigned.totalAppointments === 'number');
  });

  await suite.test('13. Backend /clinical/reports/generate: Admin access blocked with 403 ADMIN_CLINICAL_ACCESS_PROHIBITED', async () => {
    const res = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', adminToken)
      .send({
        patientId: patientUid,
        reportType: 'session_summary',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'ADMIN_CLINICAL_ACCESS_PROHIBITED');
  });

  await suite.test('14. Backend /clinical/reports/generate: Patient access blocked with 403 INSUFFICIENT_ROLE_PERMISSIONS', async () => {
    const res = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', patientToken)
      .send({
        patientId: patientUid,
        reportType: 'session_summary',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'INSUFFICIENT_ROLE_PERMISSIONS');
  });

  await suite.test('15. Backend /clinical/reports/generate: Verified psychologist generates valid clinical report', async () => {
    const res = await request(app)
      .post('/api/v1/clinical/reports/generate')
      .set('Authorization', psychToken)
      .send({
        patientId: patientUid,
        reportType: 'session_summary',
        clinicalSummaryNotes: 'Patient making sustained progress on emotional regulation goals.',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.report);

    const report = res.body.data.report;
    assert.ok(report.reportId, 'Must have a unique reportId');
    assert.equal(report.patientId, patientUid);
    assert.ok(report.title);
    assert.ok(report.summary);
    assert.ok(Array.isArray(report.sections), 'Report sections must be an array');
    assert.ok(report.generatedAt);
  });
});
