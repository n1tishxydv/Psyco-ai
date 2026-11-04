import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

test('PSYCO AI Phase 7.6.3: AppointmentCard & Location Invariant Protection Suite', async (suite) => {
  const aptCardPath = path.join(
    projectRoot,
    'frontend/src/components/common/AppointmentCard.jsx'
  );
  const patientAptPath = path.join(
    projectRoot,
    'frontend/src/features/appointments/PatientAppointmentsPage.jsx'
  );
  const psychDashPath = path.join(
    projectRoot,
    'frontend/src/features/psychologists/PsychologistDashboard.jsx'
  );

  await suite.test('DEF-763-04: AppointmentCard guards location object against Minified React error #31', () => {
    assert.ok(fs.existsSync(aptCardPath), 'AppointmentCard.jsx must exist');
    const content = fs.readFileSync(aptCardPath, 'utf8');

    // Verify locationText safe resolution is implemented
    assert.match(
      content,
      /let\s+locationText\s*=\s*'Clinic Consultation';/,
      'AppointmentCard must declare locationText fallback'
    );
    assert.match(
      content,
      /location\.addressOrUrl/,
      'AppointmentCard must handle location.addressOrUrl object property'
    );
    assert.match(
      content,
      /typeof\s+location\s*===\s*'object'/,
      'AppointmentCard must guard against object types in location'
    );

    // Verify JSX renders locationText and not bare location object
    assert.ok(
      !content.includes('{location ||'),
      'Must NOT render bare {location || ...} into JSX children'
    );
    assert.match(
      content,
      /<span className="truncate">\{locationText\}<\/span>/,
      'Must render safe string locationText into JSX'
    );
  });

  await suite.test('DEF-763-04: Simulation of locationText extraction logic handles all schema variants', () => {
    // Pure function logic mirroring AppointmentCard
    function resolveLocationText({ isOnline, location, clinicAddress }) {
      let locationText = 'Clinic Consultation';
      if (isOnline) {
        locationText = 'Telehealth Consultation (Secure Encrypted Video)';
      } else if (typeof location === 'string' && location.trim()) {
        locationText = location.trim();
      } else if (location && typeof location === 'object') {
        if (typeof location.addressOrUrl === 'string' && location.addressOrUrl.trim()) {
          locationText = location.addressOrUrl.trim();
        } else if (typeof location.address === 'string' && location.address.trim()) {
          locationText = location.address.trim();
        } else if (typeof location.name === 'string' && location.name.trim()) {
          locationText = location.name.trim();
        }
      } else if (clinicAddress) {
        if (typeof clinicAddress === 'string' && clinicAddress.trim()) {
          locationText = clinicAddress.trim();
        } else if (typeof clinicAddress === 'object') {
          const parts = [clinicAddress.line1, clinicAddress.city, clinicAddress.state].filter(Boolean);
          locationText = parts.length > 0 ? parts.join(', ') : 'Clinic Consultation';
        }
      }
      return locationText;
    }

    // Case 1: Standard appointment with location object { addressOrUrl, type }
    const res1 = resolveLocationText({
      isOnline: false,
      location: { addressOrUrl: '100 Medical Center Way, Suite 300', type: 'clinic' },
      clinicAddress: null,
    });
    assert.equal(res1, '100 Medical Center Way, Suite 300');
    assert.equal(typeof res1, 'string');

    // Case 2: Online telehealth
    const res2 = resolveLocationText({
      isOnline: true,
      location: { addressOrUrl: 'https://meet.google.com/abc-defg-hij', type: 'google_meet' },
      clinicAddress: null,
    });
    assert.equal(res2, 'Telehealth Consultation (Secure Encrypted Video)');
    assert.equal(typeof res2, 'string');

    // Case 3: Legacy string location
    const res3 = resolveLocationText({
      isOnline: false,
      location: 'Downtown Therapy Office',
      clinicAddress: null,
    });
    assert.equal(res3, 'Downtown Therapy Office');
    assert.equal(typeof res3, 'string');

    // Case 4: Clinic address object fallback
    const res4 = resolveLocationText({
      isOnline: false,
      location: null,
      clinicAddress: { line1: '12 Beacon St', city: 'Boston', state: 'MA' },
    });
    assert.equal(res4, '12 Beacon St, Boston, MA');
    assert.equal(typeof res4, 'string');

    // Case 5: Empty fallback
    const res5 = resolveLocationText({
      isOnline: false,
      location: null,
      clinicAddress: null,
    });
    assert.equal(res5, 'Clinic Consultation');
    assert.equal(typeof res5, 'string');
  });

  await suite.test('DEF-763-04: PatientAppointmentsPage & PsychologistDashboard guard location rendering', () => {
    const patientContent = fs.readFileSync(patientAptPath, 'utf8');
    assert.match(
      patientContent,
      /typeof\s+apt\.location\s*===\s*'string'/,
      'PatientAppointmentsPage must guard against non-string location types'
    );

    const psychDashContent = fs.readFileSync(psychDashPath, 'utf8');
    assert.match(
      psychDashContent,
      /typeof\s+apt\.location\s*===\s*'string'/,
      'PsychologistDashboard must guard against non-string location types'
    );
  });
});
