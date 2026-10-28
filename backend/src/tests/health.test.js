import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('Backend Health & API Foundation Test Suite', async (t) => {
  await t.test('GET /api/v1/health should respond with 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'HEALTHY');
    assert.equal(res.body.data.service, 'Psyco AI API Server');
    assert.ok(res.body.data.uptimeSeconds >= 0);
    assert.ok(res.body.data.process.nodeVersion);

    // Verify storage policy assertions
    assert.equal(res.body.data.storagePolicy.database, 'Firebase Realtime Database (Fixed)');
    assert.equal(res.body.data.storagePolicy.binaryMediaAllowed, false);
    assert.equal(res.body.data.storagePolicy.persistentAudioSaved, false);

    // Verify honest integration reporting (not pretending to be configured when keys are absent)
    assert.equal(typeof res.body.data.integrations.firebaseAuth.configured, 'boolean');
    assert.equal(typeof res.body.data.integrations.geminiClinicalCopilot.configured, 'boolean');
    assert.equal(typeof res.body.data.integrations.assemblyaiTranscription.configured, 'boolean');
  });

  await t.test('GET /unknown-route should return structured 404 error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.ok(res.body.meta.timestamp);
  });

  await t.test('POST /api/v1/auth/register/patient should reject malformed payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/patient')
      .send({ email: 'not-an-email' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(res.body.error.details));
  });

  await t.test('GET /api/v1/appointments without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/appointments');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});
