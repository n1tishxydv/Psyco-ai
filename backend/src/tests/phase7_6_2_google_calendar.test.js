import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import {
  googleCalendarAdapter,
  DEFAULT_CALENDAR_SCOPE,
} from '../integrations/googleCalendar/googleCalendarAdapter.js';
import { resolveSafeReturnPath } from '../controllers/googleCalendar.controller.js';
import { encryptToken, decryptToken } from '../utils/tokenEncryption.js';
import { normalizeGoogleRedirectUri } from '../config/index.js';
import crypto from 'crypto';

test('PSYCO AI Phase 7.6.2 Google Calendar Integration & OAuth Security Suite', async (suite) => {
  const patientUid = 'cal_test_patient_01';
  const psychUid = 'cal_test_psych_01';
  const otherUserUid = 'cal_test_other_01';
  const adminUid = 'cal_test_admin_01';

  await suite.before(async () => {
    const now = new Date().toISOString();

    // 1. Patient account
    await firebaseRtdbAdapter.set(`users/${patientUid}`, {
      uid: patientUid,
      email: 'calpatient@test.psyco.internal',
      fullName: 'Calendar Test Patient',
      role: 'patient',
      roles: ['patient'],
      activeRole: 'patient',
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    });
    await firebaseRtdbAdapter.set(`patients/${patientUid}`, {
      uid: patientUid,
      fullName: 'Calendar Test Patient',
      email: 'calpatient@test.psyco.internal',
      createdAt: now,
      updatedAt: now,
    });

    // 2. Psychologist account
    await firebaseRtdbAdapter.set(`users/${psychUid}`, {
      uid: psychUid,
      email: 'calpsych@test.psyco.internal',
      fullName: 'Dr. Calendar Psych',
      role: 'psychologist',
      roles: ['psychologist'],
      activeRole: 'psychologist',
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    });
    await firebaseRtdbAdapter.set(`psychologists/${psychUid}`, {
      uid: psychUid,
      fullName: 'Dr. Calendar Psych',
      email: 'calpsych@test.psyco.internal',
      verificationStatus: 'verified',
      approvalStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    });

    // 3. Admin account
    await firebaseRtdbAdapter.set(`users/${adminUid}`, {
      uid: adminUid,
      email: 'caladmin@test.psyco.internal',
      fullName: 'Calendar Admin',
      role: 'administrator',
      roles: ['administrator'],
      activeRole: 'administrator',
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    });
  });

  // =========================================================================
  // SECTION 1: TOKEN ENCRYPTION & SECURITY (TASK F)
  // =========================================================================

  await suite.test('TEST-CAL-01: AES-256-GCM token encryption and decryption round-trip', () => {
    const rawRefreshToken = '1//04test_refresh_token_very_secret_xyz123';
    const encrypted = encryptToken(rawRefreshToken);

    assert.ok(encrypted, 'Encryption should return an envelope');
    assert.ok(encrypted.ciphertext, 'Envelope must contain ciphertext');
    assert.ok(encrypted.iv, 'Envelope must contain IV');
    assert.ok(encrypted.tag, 'Envelope must contain auth tag');
    assert.equal(encrypted.version, 1, 'Version must match');
    assert.notEqual(encrypted.ciphertext, rawRefreshToken, 'Ciphertext must not be plaintext');

    const decrypted = decryptToken(encrypted);
    assert.equal(decrypted, rawRefreshToken, 'Decrypted token must match original plaintext');
  });

  await suite.test('TEST-CAL-02: AES-256-GCM token tampering fails cleanly and returns null', () => {
    const raw = 'secret_token_123';
    const encrypted = encryptToken(raw);

    // Tamper with ciphertext
    const tamperedCipher = {
      ...encrypted,
      ciphertext: '00' + encrypted.ciphertext.slice(2),
    };
    const result1 = decryptToken(tamperedCipher);
    assert.equal(result1, null, 'Tampered ciphertext must fail authentication and return null');

    // Tamper with auth tag
    const tamperedTag = {
      ...encrypted,
      tag: 'ff' + encrypted.tag.slice(2),
    };
    const result2 = decryptToken(tamperedTag);
    assert.equal(result2, null, 'Tampered auth tag must fail authentication and return null');
  });

  await suite.test('TEST-CAL-03: Backward compatibility pass-through for unencrypted strings', () => {
    const legacyPlain = 'legacy_plain_string_token';
    const result = decryptToken(legacyPlain);
    assert.equal(result, legacyPlain, 'Legacy string should pass through safely');
  });

  // =========================================================================
  // SECTION 2: OAUTH STATE & REPLAY PROTECTION (TASK E)
  // =========================================================================

  await suite.test('TEST-CAL-04: generateAuthUrl creates cryptographically signed single-use state', async () => {
    const authUrl = await googleCalendarAdapter.generateAuthUrl(psychUid, 'psychologist', '/psychologist/settings');
    assert.ok(authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'URL must target Google auth');

    const parsedUrl = new URL(authUrl);
    const stateParam = parsedUrl.searchParams.get('state');
    assert.ok(stateParam, 'State parameter must be present');

    const decodedState = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
    assert.equal(decodedState.uid, psychUid, 'State must be bound to initiating UID');
    assert.equal(decodedState.activeRole, 'psychologist', 'State must preserve active role');
    assert.ok(decodedState.nonce, 'Nonce must be present');
    assert.ok(decodedState.sig, 'HMAC signature must be present');

    // Verify state record exists in RTDB and is marked unused
    const storedState = await firebaseRtdbAdapter.get(`googleOAuthStates/${decodedState.nonce}`);
    assert.ok(storedState, 'State record must be in RTDB');
    assert.equal(storedState.used, false, 'State must initially be unused');
  });

  await suite.test('TEST-CAL-05: OAuth callback rejects tampered HMAC state signature', async () => {
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 600000;
    const fakeState = Buffer.from(
      JSON.stringify({
        uid: psychUid,
        activeRole: 'psychologist',
        nonce,
        expiresAt,
        sig: 'invalid_forged_hmac_signature_00000',
      })
    ).toString('base64url');

    await assert.rejects(
      async () => {
        await googleCalendarAdapter.handleOAuthCallback('fake_code', fakeState);
      },
      /signature verification failed/i,
      'Callback must reject invalid state HMAC'
    );
  });

  await suite.test('TEST-CAL-06: OAuth callback rejects expired state (>10 minutes)', async () => {
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiredTime = Date.now() - 10000; // 10 seconds in past
    const secret = googleCalendarAdapter.getStateSecret();
    const sig = crypto
      .createHmac('sha256', secret)
      .update(`${psychUid}:psychologist:${nonce}:${expiredTime}`)
      .digest('hex');

    const expiredState = Buffer.from(
      JSON.stringify({
        uid: psychUid,
        activeRole: 'psychologist',
        nonce,
        expiresAt: expiredTime,
        sig,
      })
    ).toString('base64url');

    await assert.rejects(
      async () => {
        await googleCalendarAdapter.handleOAuthCallback('fake_code', expiredState);
      },
      /expired/i,
      'Callback must reject expired state'
    );
  });

  // =========================================================================
  // SECTION 3: MULTI-ROLE ACCESS & API ENDPOINTS (TASKS B, E, G, I)
  // =========================================================================

  await suite.test('TEST-CAL-07: Patient can check connection status and get auth URL', async () => {
    const statusRes = await request(app)
      .get('/api/v1/integrations/google/status')
      .set('Authorization', `Bearer test-token-patient-${patientUid}`);

    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.success, true);
    assert.equal(statusRes.body.data.connected, false);
    assert.equal(statusRes.body.data.status, 'NOT_CONNECTED');

    const authRes = await request(app)
      .get('/api/v1/integrations/google/auth-url?returnTo=/patient/settings')
      .set('Authorization', `Bearer test-token-patient-${patientUid}`);

    assert.equal(authRes.status, 200);
    assert.equal(authRes.body.success, true);
    assert.ok(authRes.body.data.authUrl);
  });

  await suite.test('TEST-CAL-08: Psychologist can check connection status and get auth URL', async () => {
    const statusRes = await request(app)
      .get('/api/v1/integrations/google/status')
      .set('Authorization', `Bearer test-token-psychologist-${psychUid}`);

    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.success, true);

    const authRes = await request(app)
      .get('/api/v1/integrations/google/auth-url?returnTo=/psychologist/settings')
      .set('Authorization', `Bearer test-token-psychologist-${psychUid}`);

    assert.equal(authRes.status, 200);
    assert.ok(authRes.body.data.authUrl);
  });

  await suite.test('TEST-CAL-09: Unauthenticated request to calendar endpoints is rejected with 401', async () => {
    const res = await request(app).get('/api/v1/integrations/google/status');
    assert.equal(res.status, 401);
  });

  // =========================================================================
  // SECTION 4: SCOPE MINIMIZATION & TOKEN SANITIZATION (TASKS D, F)
  // =========================================================================

  await suite.test('TEST-CAL-10: Minimized scope defaults to calendar.events.owned', () => {
    assert.equal(DEFAULT_CALENDAR_SCOPE, 'https://www.googleapis.com/auth/calendar.events.owned');
    const status = googleCalendarAdapter.getStatus();
    assert.equal(status.scope, DEFAULT_CALENDAR_SCOPE);
  });

  await suite.test('TEST-CAL-11: getConnectionStatus never exposes sensitive tokens to frontend', async () => {
    // Seed encrypted connection in RTDB
    await firebaseRtdbAdapter.set(`googleCalendarConnections/${psychUid}`, {
      uid: psychUid,
      role: 'psychologist',
      connectedEmail: 'clinician@test.com',
      status: 'CONNECTED',
      encryptedAccessToken: encryptToken('ya29.secret_access_token'),
      encryptedRefreshToken: encryptToken('1//04secret_refresh_token'),
      expiresAt: Date.now() + 3600000,
      scope: DEFAULT_CALENDAR_SCOPE,
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .get('/api/v1/integrations/google/status')
      .set('Authorization', `Bearer test-token-psychologist-${psychUid}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.connected, true);
    assert.equal(res.body.data.connectedEmail, 'clinician@test.com');
    assert.equal(res.body.data.accessToken, undefined, 'Access token must never leak');
    assert.equal(res.body.data.refreshToken, undefined, 'Refresh token must never leak');
    assert.equal(res.body.data.encryptedAccessToken, undefined, 'Encrypted token must never leak');
    assert.equal(res.body.data.encryptedRefreshToken, undefined, 'Encrypted token must never leak');
  });

  // =========================================================================
  // SECTION 5: CLINICAL PRIVACY & IDEMPOTENCY (TASKS H, J)
  // =========================================================================

  await suite.test('TEST-CAL-12: Disconnect cleanly deletes connection records and preserves appointments', async () => {
    const res = await request(app)
      .post('/api/v1/integrations/google/disconnect')
      .set('Authorization', `Bearer test-token-psychologist-${psychUid}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const check = await firebaseRtdbAdapter.get(`googleCalendarConnections/${psychUid}`);
    assert.equal(check, null, 'Connection record must be removed');
  });

  await suite.test('TEST-CAL-13: Idempotency mapping prevents duplicate calendar event creation', async () => {
    const appointmentId = 'apt_idempotent_test_01';
    const fakeEventId = 'google_evt_123456789';

    // Seed existing mapping
    await firebaseRtdbAdapter.set(`googleCalendarEventMappings/${psychUid}/${appointmentId}`, {
      appointmentId,
      googleCalendarEventId: fakeEventId,
      googleMeetUrl: 'https://meet.google.com/abc-defg-hij',
      syncedAt: new Date().toISOString(),
    });

    const appointment = {
      id: appointmentId,
      psychologistId: psychUid,
      patientId: patientUid,
      startTime: '2026-11-10T10:00:00.000Z',
      endTime: '2026-11-10T10:50:00.000Z',
      sessionMode: 'online',
    };

    const syncResult = await googleCalendarAdapter.createCalendarEvent(appointment, psychUid);
    assert.equal(syncResult.calendarSyncStatus, 'synced');
    assert.equal(syncResult.googleCalendarEventId, fakeEventId, 'Must return existing mapped event ID');
  });

  // =========================================================================
  // SECTION 6: POST-OAUTH SAFE REDIRECTS & ROUTING SECURITY (PHASE 7.6.2.2)
  // =========================================================================

  await suite.test('TEST-CAL-14: resolveSafeReturnPath resolves correct role-specific integration defaults', () => {
    const patientPath = resolveSafeReturnPath(null, 'patient');
    assert.equal(patientPath, '/patient/settings?tab=integrations');

    const psychPath = resolveSafeReturnPath(null, 'psychologist');
    assert.equal(psychPath, '/psychologist/settings?tab=integrations');
  });

  await suite.test('TEST-CAL-15: resolveSafeReturnPath strictly rejects obsolete /clinical/reports and falls back safely', () => {
    const rejected1 = resolveSafeReturnPath('/clinical/reports', 'psychologist');
    assert.equal(rejected1, '/psychologist/settings?tab=integrations', 'Must not redirect to obsolete /clinical/reports');

    const rejected2 = resolveSafeReturnPath('/psychologist/reports', 'psychologist');
    assert.equal(rejected2, '/psychologist/settings?tab=integrations', 'Reports path must fall back to integrations');

    const rejected3 = resolveSafeReturnPath('/clinical/reports', 'patient');
    assert.equal(rejected3, '/patient/settings?tab=integrations');
  });

  await suite.test('TEST-CAL-16: resolveSafeReturnPath blocks external open-redirect URLs', () => {
    const blocked1 = resolveSafeReturnPath('https://attacker.example.com', 'patient');
    assert.equal(blocked1, '/patient/settings?tab=integrations');

    const blocked2 = resolveSafeReturnPath('//malicious.site/phish', 'psychologist');
    assert.equal(blocked2, '/psychologist/settings?tab=integrations');

    const blocked3 = resolveSafeReturnPath('javascript:alert(1)', 'patient');
    assert.equal(blocked3, '/patient/settings?tab=integrations');
  });

  await suite.test('TEST-CAL-17: OAuth error callback redirects to safe integration settings with error query and never /clinical/reports', async () => {
    // Generate valid state bound to psychologist
    const authUrl = await googleCalendarAdapter.generateAuthUrl(psychUid, 'psychologist', '/psychologist/settings?tab=integrations');
    const stateParam = new URL(authUrl).searchParams.get('state');

    const res = await request(app)
      .get(`/api/v1/integrations/google/callback?error=access_denied&error_description=User+declined&state=${stateParam}`);

    assert.equal(res.status, 302);
    const location = res.headers.location;
    assert.ok(location, 'Must issue 302 redirect');
    assert.ok(!location.includes('/clinical/reports'), 'Must NEVER redirect to /clinical/reports');
    assert.ok(location.includes('/psychologist/settings?tab=integrations'), 'Must return to psychologist settings');
    assert.ok(location.includes('calendar_error=access_denied'), 'Must carry error query parameter');
  });

  await suite.test('TEST-CAL-18: OAuth callback for patient with missing code redirects safely with error', async () => {
    const authUrl = await googleCalendarAdapter.generateAuthUrl(patientUid, 'patient', '/patient/settings?tab=integrations');
    const stateParam = new URL(authUrl).searchParams.get('state');

    const res = await request(app)
      .get(`/api/v1/integrations/google/callback?state=${stateParam}`);

    assert.equal(res.status, 302);
    const location = res.headers.location;
    assert.ok(location.includes('/patient/settings?tab=integrations'));
    assert.ok(location.includes('calendar_error=missing_code_or_state'));
  });

  await suite.test('TEST-CAL-19: normalizeGoogleRedirectUri fixes operator misconfigurations and duplicate slashes', () => {
    // 1. Correct accidental domain typo pointing to frontend web.app
    const misconfigured = 'https://psyco-ai-staging.web.app//api/v1/integrations/google/callback';
    const normalized = normalizeGoogleRedirectUri(misconfigured);
    assert.equal(normalized, 'https://psyco-ai.onrender.com/api/v1/integrations/google/callback');

    // 2. Remove accidental double slashes on Render host
    const doubleSlash = 'https://psyco-ai.onrender.com//api/v1/integrations/google/callback';
    assert.equal(normalizeGoogleRedirectUri(doubleSlash), 'https://psyco-ai.onrender.com/api/v1/integrations/google/callback');

    // 3. Preserve clean URIs untouched
    const clean = 'https://psyco-ai.onrender.com/api/v1/integrations/google/callback';
    assert.equal(normalizeGoogleRedirectUri(clean), clean);
  });
});
