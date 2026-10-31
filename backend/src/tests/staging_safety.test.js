process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import config from '../config/index.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { seedStagingEnvironment } from '../../scripts/seedStagingEnvironment.js';
import { restoreStagingBackup } from '../../scripts/restoreStagingBackup.js';

test('PSYCO AI Phase 13: Staging Safety & Repeatable Environment Guards', async (t) => {

  await t.test('1. Production Project ID is strictly rejected by staging seeder', async () => {
    // Force config pointing to production project
    const originalProjectId = config.firebase.projectId;
    const originalDbUrl = config.firebase.databaseURL;

    try {
      config.firebase.projectId = 'psyco-9c13d';
      config.firebase.databaseURL = 'https://psyco-9c13d-default-rtdb.firebaseio.com';

      await assert.rejects(
        async () => {
          await seedStagingEnvironment({ dryRun: false });
        },
        {
          name: 'Error',
          message: /Refusing to seed synthetic staging data into primary\/production database/,
        }
      );
    } finally {
      config.firebase.projectId = originalProjectId;
      config.firebase.databaseURL = originalDbUrl;
    }
  });

  await t.test('2. Production Database URL is strictly rejected even if project ID is altered', async () => {
    const originalProjectId = config.firebase.projectId;
    const originalDbUrl = config.firebase.databaseURL;

    try {
      config.firebase.projectId = 'custom-test-project';
      config.firebase.databaseURL = 'https://psyco-9c13d-default-rtdb.firebaseio.com';

      await assert.rejects(
        async () => {
          await seedStagingEnvironment({ dryRun: false });
        },
        {
          name: 'Error',
          message: /Refusing to seed synthetic staging data into primary\/production database/,
        }
      );
    } finally {
      config.firebase.projectId = originalProjectId;
      config.firebase.databaseURL = originalDbUrl;
    }
  });

  await t.test('3. Missing database URL causes fail-closed termination', async () => {
    const originalDbUrl = config.firebase.databaseURL;

    try {
      config.firebase.databaseURL = '';

      await assert.rejects(
        async () => {
          await seedStagingEnvironment({ dryRun: false });
        },
        {
          name: 'Error',
          message: /Refusing to seed: Missing target project or database URL/,
        }
      );
    } finally {
      config.firebase.databaseURL = originalDbUrl;
    }
  });

  await t.test('4. Staging Seeder dry-run mode returns success without writing records', async () => {
    const originalProjectId = config.firebase.projectId;
    const originalDbUrl = config.firebase.databaseURL;

    try {
      config.firebase.projectId = 'psyco-ai-staging';
      config.firebase.databaseURL = 'https://psyco-ai-staging-default-rtdb.firebaseio.com';

      const result = await seedStagingEnvironment({ dryRun: true });
      assert.equal(result.success, true);
      assert.equal(result.dryRun, true);
      assert.equal(result.count, 11);
    } finally {
      config.firebase.projectId = originalProjectId;
      config.firebase.databaseURL = originalDbUrl;
    }
  });

  await t.test('5. Zero Binary Media Invariant: Base64 payloads are strictly rejected', () => {
    assert.throws(
      () => {
        firebaseRtdbAdapter.assertValidPayload({
          id: 'test_audio_payload',
          data: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
        });
      },
      {
        name: 'Error',
        message: /Base64-encoded binary media is strictly forbidden/,
      }
    );

    assert.throws(
      () => {
        firebaseRtdbAdapter.assertValidPayload({
          id: 'test_image_payload',
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        });
      },
      {
        name: 'Error',
        message: /Base64-encoded binary media is strictly forbidden/,
      }
    );
  });

  await t.test('6. Storage Invariant: Oversized payload (>5MB) is strictly rejected', () => {
    const largeString = 'X'.repeat(6 * 1024 * 1024);
    assert.throws(
      () => {
        firebaseRtdbAdapter.assertValidPayload({ content: largeString });
      },
      {
        name: 'Error',
        message: /Payload exceeds 5MB limit/,
      }
    );
  });

  await t.test('7. Clinical Privacy Barrier: Admin access to clinical chart is rejected with 403', async () => {
    const adminToken = 'Bearer test-token-admin-safety_admin_01';
    await firebaseRtdbAdapter.set('users/safety_admin_01', { uid: 'safety_admin_01', role: 'admin' });

    const res = await request(app)
      .get('/api/v1/clinical/patients/patient_staging_01/chart')
      .set('Authorization', adminToken);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.error.message, /Administrative accounts are barred from accessing direct patient clinical notes/);
  });

  await t.test('8. ReBAC Boundary: Unassigned psychologist cannot access another clinician\'s patient chart', async () => {
    const unassignedPsychToken = 'Bearer test-token-psychologist-psych_unassigned_01';
    await firebaseRtdbAdapter.set('users/psych_unassigned_01', { uid: 'psych_unassigned_01', role: 'psychologist' });
    await firebaseRtdbAdapter.set('psychologists/psych_unassigned_01', { id: 'psych_unassigned_01', approvalStatus: 'approved' });

    const res = await request(app)
      .get('/api/v1/clinical/patients/patient_staging_01/chart')
      .set('Authorization', unassignedPsychToken);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.error.message, /Access denied\. No active clinical or scheduling relationship with this patient/);
  });

  await t.test('9. Diagnostic and Health Endpoints do not leak secrets or private keys', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);

    const bodyString = JSON.stringify(res.body);
    assert.equal(bodyString.includes('BEGIN PRIVATE KEY'), false);
    assert.equal(bodyString.includes('AIzaSy'), false);
    assert.equal(bodyString.includes('GOCSPX'), false);
    assert.equal(bodyString.includes(config.firebase.apiKey || 'NEVER_MATCH'), false);
  });

  await t.test('10. Recovery Guard: Production target is strictly rejected by restoreStagingBackup', async () => {
    const originalProjectId = config.firebase.projectId;
    const originalDbUrl = config.firebase.databaseURL;

    try {
      config.firebase.projectId = 'psyco-9c13d';
      config.firebase.databaseURL = 'https://psyco-9c13d-default-rtdb.firebaseio.com';

      await assert.rejects(
        async () => {
          await restoreStagingBackup({
            stagingOnly: true,
            confirm: true,
            backupFile: 'test.json',
          });
        },
        {
          name: 'Error',
          message: /Production environment detected/,
        }
      );
    } finally {
      config.firebase.projectId = originalProjectId;
      config.firebase.databaseURL = originalDbUrl;
    }
  });

  await t.test('11. Recovery Guard: Missing --staging-only flag aborts restoreStagingBackup', async () => {
    await assert.rejects(
      async () => {
        await restoreStagingBackup({
          stagingOnly: false,
          confirm: true,
          backupFile: 'test.json',
        });
      },
      {
        name: 'Error',
        message: /The --staging-only flag is required/,
      }
    );
  });

  await t.test('12. Recovery Guard: Missing confirmation flag aborts live restoreStagingBackup', async () => {
    await assert.rejects(
      async () => {
        await restoreStagingBackup({
          stagingOnly: true,
          confirm: false,
          dryRun: false,
          backupFile: 'test.json',
        });
      },
      {
        name: 'Error',
        message: /Explicit confirmation required/,
      }
    );
  });
});
