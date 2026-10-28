import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

test('Public Routes & Submissions Test Suite', async (t) => {
  await t.test('GET /api/v1/public/faqs should return published or curated FAQs with 200', async () => {
    const res = await request(app).get('/api/v1/public/faqs');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.faqs));
    assert.ok(res.body.data.faqs.length >= 5);

    // Verify fields on first FAQ
    const firstFaq = res.body.data.faqs[0];
    assert.ok(firstFaq.id);
    assert.ok(firstFaq.question);
    assert.ok(firstFaq.answer);
    assert.ok(firstFaq.category);
  });

  await t.test('POST /api/v1/public/contact should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/public/contact')
      .send({ name: 'Jane' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(res.body.error.details));
  });

  await t.test('POST /api/v1/public/contact should reject malformed email', async () => {
    const res = await request(app)
      .post('/api/v1/public/contact')
      .send({
        name: 'Jane Doe',
        email: 'invalid-email-address',
        subject: 'Practice Inquiry',
        message: 'I am interested in setting up a practice.',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /api/v1/public/contact with honeypot filled should drop silently with 200', async () => {
    const res = await request(app)
      .post('/api/v1/public/contact')
      .send({
        name: 'Spam Bot',
        email: 'bot@spam.com',
        subject: 'Buy Cheap Medication',
        message: 'Spam promotional content here.',
        hp_website: 'http://spam-link.com',
      });

    // Honeypot triggers graceful response without persistence
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await t.test('POST /api/v1/public/contact with valid payload returns 201 or 503 depending on configuration', async () => {
    const res = await request(app)
      .post('/api/v1/public/contact')
      .send({
        name: 'Dr. John Doe',
        email: 'john.doe@clinic.com',
        subject: 'Onboarding Inquiry',
        message: 'Interested in onboarding our clinical team onto Psyco AI.',
      });

    // If Firebase is configured, returns 201; if unconfigured, returns 503
    assert.ok([201, 503].includes(res.status));
    if (res.status === 201) {
      assert.equal(res.body.success, true);
    } else {
      assert.equal(res.body.error.code, 'DATABASE_UNCONFIGURED');
    }
  });

  await t.test('POST /api/v1/public/faq-submissions should reject question that is too short', async () => {
    const res = await request(app)
      .post('/api/v1/public/faq-submissions')
      .send({
        question: 'Why?',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /api/v1/public/faq-submissions with honeypot filled should drop silently with 200', async () => {
    const res = await request(app)
      .post('/api/v1/public/faq-submissions')
      .send({
        question: 'Is this a real question for the FAQ?',
        hp_website: 'http://spambot.net',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
