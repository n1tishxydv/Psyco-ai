import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

test('PSYCO AI Phase 7.6.3: Runtime Calendar, Booking & Route Integrity Suite', async (suite) => {
  const psychCalendarPath = path.join(
    projectRoot,
    'frontend/src/features/appointments/PsychologistCalendarPage.jsx'
  );
  const bookingPagePath = path.join(
    projectRoot,
    'frontend/src/features/appointments/BookingPage.jsx'
  );
  const routesIndexPath = path.join(
    projectRoot,
    'frontend/src/routes/index.jsx'
  );

  await suite.test('DEF-763-01 / DEF-763-02: PsychologistCalendarPage imports CalendarIcon and contains no undefined <Calendar /> tags', () => {
    assert.ok(fs.existsSync(psychCalendarPath), 'PsychologistCalendarPage must exist');
    const content = fs.readFileSync(psychCalendarPath, 'utf8');

    // Verify Calendar is aliased as CalendarIcon
    assert.match(content, /Calendar\s+as\s+CalendarIcon/, 'Must import Calendar aliased as CalendarIcon from lucide-react');

    // Verify no bare <Calendar /> JSX tag exists that would trigger "ReferenceError: Calendar is not defined"
    const bareCalendarTagMatches = content.match(/<Calendar[\s/>]/g) || [];
    assert.equal(bareCalendarTagMatches.length, 0, 'Must NOT contain bare <Calendar /> JSX tags when aliased as CalendarIcon');

    // Verify CalendarIcon is used at the Google Calendar connection badge
    assert.match(content, /<CalendarIcon\s+className="w-3 h-3 text-blue-400"\s*\/>/, 'Badge must use CalendarIcon');
  });

  await suite.test('DEF-763-03: BookingConfirmationView cleanly encapsulates calendarMenuOpen state and dismissal listeners', () => {
    assert.ok(fs.existsSync(bookingPagePath), 'BookingPage must exist');
    const content = fs.readFileSync(bookingPagePath, 'utf8');

    // Verify BookingConfirmationView declares calendarMenuOpen state
    assert.match(content, /const\s+\[calendarMenuOpen,\s*setCalendarMenuOpen\]\s*=\s*useState\(false\);/, 'BookingConfirmationView must declare calendarMenuOpen');

    // Verify click-outside and escape-key listener
    assert.match(content, /menuRef/, 'Must use menuRef for click-outside detection');
    assert.match(content, /e\.key\s*===\s*'Escape'/, 'Must handle Escape key dismissal');
    assert.match(content, /handleClickOutside/, 'Must handle click outside dismissal');

    // Verify Google Calendar and iCal generators are encapsulated
    assert.match(content, /getGoogleCalendarUrl/, 'Must define Google Calendar template generator');
    assert.match(content, /handleDownloadIcs/, 'Must define .ics iCal generator');
  });

  await suite.test('ROUTE-763-01: Routes tree binds appointments and calendar to verified components', () => {
    assert.ok(fs.existsSync(routesIndexPath), 'routes/index.jsx must exist');
    const content = fs.readFileSync(routesIndexPath, 'utf8');

    // Psychologist calendar and appointments
    assert.match(content, /path="\/psychologist\/appointments"/, 'Must register /psychologist/appointments');
    assert.match(content, /path="\/psychologist\/calendar"/, 'Must register /psychologist/calendar');
    assert.match(content, /PsychologistCalendarPage/, 'Must map to PsychologistCalendarPage');

    // Patient appointments
    assert.match(content, /path="\/patient\/appointments"/, 'Must register /patient/appointments');
    assert.match(content, /PatientAppointmentsPage/, 'Must map to PatientAppointmentsPage');

    // Role-aware redirects
    assert.match(content, /AppointmentsRedirect/, 'Must provide role-aware AppointmentsRedirect');
    assert.match(content, /SettingsRedirect/, 'Must provide role-aware SettingsRedirect');
  });

  await suite.test('ROUTE-763-02: Legacy /clinical/reports alias redirects to /psychologist/reports', () => {
    const content = fs.readFileSync(routesIndexPath, 'utf8');
    assert.match(content, /path="\/clinical\/reports"/, 'Must maintain backward-compatible alias');
    assert.match(content, /to="\/psychologist\/reports"/, 'Must redirect to /psychologist/reports');
  });

  await suite.test('LAYOUT-763-01: Authenticated layouts remain isolated from PublicLayout', () => {
    const content = fs.readFileSync(routesIndexPath, 'utf8');
    // Ensure /settings is not inside PublicLayout
    assert.ok(!content.includes('<PublicLayout>\n            <Route\n              path="/settings"'), '/settings must not be a child of PublicLayout');
  });
});
