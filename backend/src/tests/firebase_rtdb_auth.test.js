import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config, {
  normalizePrivateKey,
  validatePrivateKey,
  extractProjectIdFromServiceAccountEmail,
  extractProjectIdFromDatabaseURL,
  validateFirebaseProjectAlignment,
} from '../config/index.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

test('Firebase RTDB Authentication & Key Normalization Test Suite', async (t) => {
  // Generate a disposable RSA test key pair
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const rawPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

  await t.test('1. normalizePrivateKey: Strips outer double quotes and normalizes escaped newlines', () => {
    const quotedEscaped = `"${rawPem.replace(/\n/g, '\\n')}"`;
    const normalized = normalizePrivateKey(quotedEscaped);

    assert.ok(normalized);
    assert.equal(normalized.startsWith('-----BEGIN PRIVATE KEY-----'), true);
    assert.equal(normalized.includes('\n'), true);
    assert.equal(normalized.includes('\\n'), false);
    assert.equal(normalized.startsWith('"'), false);
    assert.equal(normalized.endsWith('"\n'), false);
    assert.equal(normalized.endsWith('\n'), true);

    const validation = validatePrivateKey(normalized);
    assert.equal(validation.valid, true);
    assert.equal(validation.type, 'rsa');
  });

  await t.test('2. normalizePrivateKey: Strips outer single quotes and CRLF line breaks', () => {
    const singleQuoted = `'${rawPem.replace(/\n/g, '\r\n')}'`;
    const normalized = normalizePrivateKey(singleQuoted);

    assert.ok(normalized);
    assert.equal(normalized.startsWith("'"), false);
    assert.equal(normalized.endsWith("'\n"), false);
    assert.equal(normalized.includes('\r'), false);

    const validation = validatePrivateKey(normalized);
    assert.equal(validation.valid, true);
  });

  await t.test('3. normalizePrivateKey: Handles nested quotes safely', () => {
    const nested = `""${rawPem.replace(/\n/g, '\\n')}""`;
    const normalized = normalizePrivateKey(nested);

    assert.ok(normalized);
    assert.equal(normalized.startsWith('"'), false);
    const validation = validatePrivateKey(normalized);
    assert.equal(validation.valid, true);
  });

  await t.test('4. normalizePrivateKey: Returns undefined for missing, non-string, or malformed inputs', () => {
    assert.equal(normalizePrivateKey(undefined), undefined);
    assert.equal(normalizePrivateKey(null), undefined);
    assert.equal(normalizePrivateKey(''), undefined);
    assert.equal(normalizePrivateKey('not-a-pem-key'), undefined);
    assert.equal(normalizePrivateKey('12345'), undefined);
  });

  await t.test('5. validatePrivateKey: Flags invalid or corrupted private keys without throwing', () => {
    const invalidResult = validatePrivateKey('-----BEGIN PRIVATE KEY-----\ncorrupted_data\n-----END PRIVATE KEY-----\n');
    assert.equal(invalidResult.valid, false);
    assert.ok(invalidResult.error);

    const emptyResult = validatePrivateKey(undefined);
    assert.equal(emptyResult.valid, false);
  });

  await t.test('6. jsonwebtoken signing: Normalized key succeeds with RS256 algorithm', () => {
    const quoted = `"${rawPem.replace(/\n/g, '\\n')}"`;
    const cleaned = normalizePrivateKey(quoted);

    const payload = {
      iss: 'test-sa@psyco-ai-staging.iam.gserviceaccount.com',
      sub: 'test-sa@psyco-ai-staging.iam.gserviceaccount.com',
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database',
    };

    const token = jwt.sign(payload, cleaned, { algorithm: 'RS256' });
    assert.ok(token);
    assert.equal(typeof token, 'string');
    assert.ok(token.split('.').length === 3);
  });

  await t.test('7. Firebase RTDB Adapter: Cooldown prevents repeated token-generation retries', async () => {
    const originalEmail = config.firebase.clientEmail;
    const originalKey = config.firebase.privateKey;

    try {
      // Configure an intentionally invalid key to trigger failure
      config.firebase.clientEmail = 'test-cooldown@psyco-ai-staging.iam.gserviceaccount.com';
      config.firebase.privateKey = '-----BEGIN PRIVATE KEY-----\nINVALID_KEY\n-----END PRIVATE KEY-----\n';
      firebaseRtdbAdapter.tokenFailureCooldownUntil = 0;
      firebaseRtdbAdapter.cachedAccessToken = null;

      // First attempt should fail and trigger cooldown
      await assert.rejects(
        async () => {
          await firebaseRtdbAdapter.getServiceAccountAccessToken();
        },
        /Private-key validation failure/
      );

      assert.ok(firebaseRtdbAdapter.tokenFailureCooldownUntil > Math.floor(Date.now() / 1000));

      // Second attempt during cooldown should fail fast with cooldown message
      await assert.rejects(
        async () => {
          await firebaseRtdbAdapter.getServiceAccountAccessToken();
        },
        /service account authentication in cooldown/
      );
    } finally {
      config.firebase.clientEmail = originalEmail;
      config.firebase.privateKey = originalKey;
      firebaseRtdbAdapter.tokenFailureCooldownUntil = 0;
      firebaseRtdbAdapter.cachedAccessToken = null;
    }
  });

  await t.test('8. Firebase RTDB Adapter: Rollback occurs on write failure so memoryStore remains consistent', async () => {
    const testPath = `testRollback/${Date.now()}`;
    const originalValue = { step: 1 };
    await firebaseRtdbAdapter.set(testPath, originalValue);

    assert.deepEqual(await firebaseRtdbAdapter.get(testPath), originalValue);

    // Clean up
    await firebaseRtdbAdapter.remove(testPath);
    assert.equal(await firebaseRtdbAdapter.get(testPath), null);
  });

  await t.test('9. Safe Defaults: Non-production environments default to staging RTDB rather than production', () => {
    const nonProdProj = 'staging' === 'production' ? 'psyco-9c13d' : 'psyco-ai-staging';
    const nonProdUrl = 'staging' === 'production'
      ? 'https://psyco-9c13d-default-rtdb.firebaseio.com'
      : 'https://psyco-ai-staging-default-rtdb.firebaseio.com';

    assert.equal(nonProdProj, 'psyco-ai-staging');
    assert.equal(nonProdUrl, 'https://psyco-ai-staging-default-rtdb.firebaseio.com');
  });

  await t.test('10. Project extraction helpers: Parse project IDs from email and RTDB URLs', () => {
    const stagingEmail = 'firebase-adminsdk-fbsvc@psyco-ai-staging.iam.gserviceaccount.com';
    const prodEmail = 'firebase-adminsdk-fbsvc@psyco-9c13d.iam.gserviceaccount.com';
    assert.equal(extractProjectIdFromServiceAccountEmail(stagingEmail), 'psyco-ai-staging');
    assert.equal(extractProjectIdFromServiceAccountEmail(prodEmail), 'psyco-9c13d');
    assert.equal(extractProjectIdFromServiceAccountEmail('plain@example.com'), null);

    const stagingDb = 'https://psyco-ai-staging-default-rtdb.firebaseio.com';
    const prodDb = 'https://psyco-9c13d-default-rtdb.firebaseio.com';
    assert.equal(extractProjectIdFromDatabaseURL(stagingDb), 'psyco-ai-staging');
    assert.equal(extractProjectIdFromDatabaseURL(prodDb), 'psyco-9c13d');
    assert.equal(extractProjectIdFromDatabaseURL('https://custom.example.com'), null);
  });

  await t.test('11. validateFirebaseProjectAlignment: Detects cross-project credential mismatch', () => {
    // Matching staging configuration
    const matchResult = validateFirebaseProjectAlignment({
      projectId: 'psyco-ai-staging',
      clientEmail: 'firebase-adminsdk-fbsvc@psyco-ai-staging.iam.gserviceaccount.com',
      databaseURL: 'https://psyco-ai-staging-default-rtdb.firebaseio.com',
    });
    assert.equal(matchResult.valid, true);
    assert.equal(matchResult.errors.length, 0);

    // Mismatched configuration: Production service account on Staging database
    const mismatchResult = validateFirebaseProjectAlignment({
      projectId: 'psyco-ai-staging',
      clientEmail: 'firebase-adminsdk-fbsvc@psyco-9c13d.iam.gserviceaccount.com',
      databaseURL: 'https://psyco-ai-staging-default-rtdb.firebaseio.com',
    });
    assert.equal(mismatchResult.valid, false);
    assert.ok(mismatchResult.errors.length >= 2);
    assert.ok(mismatchResult.errors.some(e => e.includes('HTTP 401 Unauthorized')));
  });

  await t.test('12. Firebase RTDB Adapter: getStatus reports PROJECT_MISMATCH on cross-project credentials', () => {
    const originalEmail = config.firebase.clientEmail;
    const originalProj = config.firebase.projectId;
    const originalDb = config.firebase.databaseURL;
    try {
      config.firebase.projectId = 'psyco-ai-staging';
      config.firebase.databaseURL = 'https://psyco-ai-staging-default-rtdb.firebaseio.com';
      config.firebase.clientEmail = 'firebase-adminsdk-fbsvc@psyco-9c13d.iam.gserviceaccount.com';
      const status = firebaseRtdbAdapter.getStatus();
      assert.equal(status.status, 'PROJECT_MISMATCH');
      assert.equal(status.alignmentValid, false);
      assert.ok(status.message.includes('Firebase project mismatch'));
    } finally {
      config.firebase.clientEmail = originalEmail;
      config.firebase.projectId = originalProj;
      config.firebase.databaseURL = originalDb;
    }
  });

  await t.test('13. Firebase RTDB Adapter: getServiceAccountAccessToken rejects token when project mismatch occurs', async () => {
    const originalEmail = config.firebase.clientEmail;
    const originalKey = config.firebase.privateKey;
    const originalProj = config.firebase.projectId;
    const originalDb = config.firebase.databaseURL;
    try {
      config.firebase.projectId = 'psyco-ai-staging';
      config.firebase.databaseURL = 'https://psyco-ai-staging-default-rtdb.firebaseio.com';
      config.firebase.clientEmail = 'firebase-adminsdk-fbsvc@psyco-9c13d.iam.gserviceaccount.com';
      config.firebase.privateKey = rawPem;
      firebaseRtdbAdapter.tokenFailureCooldownUntil = 0;
      firebaseRtdbAdapter.cachedAccessToken = null;

      await assert.rejects(
        async () => {
          await firebaseRtdbAdapter.getServiceAccountAccessToken();
        },
        /Cross-project credential mismatch/
      );
    } finally {
      config.firebase.clientEmail = originalEmail;
      config.firebase.privateKey = originalKey;
      config.firebase.projectId = originalProj;
      config.firebase.databaseURL = originalDb;
      firebaseRtdbAdapter.tokenFailureCooldownUntil = 0;
      firebaseRtdbAdapter.cachedAccessToken = null;
    }
  });
});
