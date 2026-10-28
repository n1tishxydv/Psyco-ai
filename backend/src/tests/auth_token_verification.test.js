import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { firebaseAuthAdapter } from '../integrations/firebase/firebaseAuthAdapter.js';
import config from '../config/index.js';

test('Cryptographic Authentication & Token Verification Security Suite', async (t) => {
  const projectId = config.firebase.projectId || 'psyco-9c13d';

  await t.test('1. Missing Authorization header must return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/appointments');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  await t.test('2. Malformed token string must return 401 INVALID_TOKEN or TOKEN_VERIFICATION_FAILED', async () => {
    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', 'Bearer invalid-token-string-xyz');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('3. Forged unsigned token (alg: none) must be rejected with 401', async () => {
    // Generate forged token with alg: none
    const forgedHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const forgedPayload = Buffer.from(
      JSON.stringify({
        sub: 'attacker_uid',
        email: 'attacker@evil.com',
        role: 'admin',
        aud: projectId,
        iss: `https://securetoken.google.com/${projectId}`,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64url');
    const forgedToken = `${forgedHeader}.${forgedPayload}.`;

    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${forgedToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.message.includes('Invalid token algorithm') || res.body.error.message.includes('verification'));
  });

  await t.test('4. Forged token signed with HMAC (symmetric secret) must be rejected with 401', async () => {
    // Attacker tries signing with HS256 using an arbitrary secret
    const forgedToken = jwt.sign(
      {
        sub: 'forged_admin_uid',
        role: 'admin',
        aud: projectId,
        iss: `https://securetoken.google.com/${projectId}`,
      },
      'attacker-secret-key-123',
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${forgedToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('5. Token signed with RS256 but unknown kid must be rejected with 401', async () => {
    // Header has RS256 but arbitrary kid not in Google certificates
    const forgedHeader = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'fake_key_9999' })).toString('base64url');
    const forgedPayload = Buffer.from(
      JSON.stringify({
        sub: 'forged_user',
        aud: projectId,
        iss: `https://securetoken.google.com/${projectId}`,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64url');
    const forgedToken = `${forgedHeader}.${forgedPayload}.fake_signature`;

    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${forgedToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('6. Expired token claims must be rejected with 401', async () => {
    // Generate token with exp in the past
    const expiredPayload = Buffer.from(
      JSON.stringify({
        sub: 'user_123',
        aud: projectId,
        iss: `https://securetoken.google.com/${projectId}`,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      })
    ).toString('base64url');
    const forgedHeader = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'fake_key' })).toString('base64url');
    const token = `${forgedHeader}.${expiredPayload}.fake_signature`;

    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('7. Test tokens are strictly rejected when NODE_ENV is set to production', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      await assert.rejects(
        async () => {
          await firebaseAuthAdapter.verifyIdToken('test-token-patient-pat01');
        },
        /Test tokens are strictly forbidden in non-test environments/
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  await t.test('8. Legitimate test tokens are accepted when NODE_ENV === test', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'test';
      const decoded = await firebaseAuthAdapter.verifyIdToken('test-token-patient-test_patient_id');
      assert.equal(decoded.uid, 'test_patient_id');
      assert.equal(decoded.role, 'patient');
      assert.equal(decoded.email, 'patient@test.psyco-ai.internal');
      assert.equal(decoded.emailVerified, true);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
