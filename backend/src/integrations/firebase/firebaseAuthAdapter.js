import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { logger } from '../../utils/logger.js';

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

class FirebaseAuthAdapter {
  constructor() {
    this.name = 'Firebase Authentication';
    this.cachedCertificates = null;
    this.certsExpiresAt = 0;
  }

  isConfigured() {
    return Boolean(config.firebase.projectId && !config.firebase.projectId.includes('placeholder'));
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      service: this.name,
      configured,
      status: configured ? 'INITIALIZED' : 'UNCONFIGURED',
      projectId: config.firebase.projectId,
      message: configured
        ? `Firebase Auth initialized for project ${config.firebase.projectId}.`
        : 'Firebase project ID not configured.',
    };
  }

  /**
   * Fetches Google public x509 certificates with caching.
   */
  async getPublicCertificates() {
    const now = Date.now();
    if (this.cachedCertificates && now < this.certsExpiresAt) {
      return this.cachedCertificates;
    }

    try {
      const response = await fetch(GOOGLE_CERTS_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching Google certs`);
      }

      // Parse cache-control header
      const cacheControl = response.headers.get('cache-control') || '';
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

      const certs = await response.json();
      this.cachedCertificates = certs;
      this.certsExpiresAt = now + maxAgeSec * 1000;
      return certs;
    } catch (err) {
      logger.error('Failed to fetch Google public certificates for token verification:', err.message);
      if (this.cachedCertificates) {
        // Fallback to existing cache if available
        return this.cachedCertificates;
      }
      throw new Error(`Unable to fetch Google public keys for signature verification: ${err.message}`);
    }
  }

  /**
   * Verifies a Firebase ID token with cryptographic RS256 signature verification.
   * Enforces:
   * 1. Cryptographic signature check against Google public x509 certificates.
   * 2. Header algorithm must be RS256.
   * 3. Audience must match configured Firebase project ID.
   * 4. Issuer must match https://securetoken.google.com/<projectId>.
   * 5. Expiration, subject/UID check.
   * 6. Strictly isolates test-token-* format to NODE_ENV === 'test'.
   */
  async verifyIdToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Missing or invalid token string.');
    }

    // 1. Isolated test token recognition for automated test harnesses ONLY
    if (token.startsWith('test-token-')) {
      const isTest =
        process.env.NODE_ENV === 'test' ||
        (process.env.NODE_ENV !== 'production' &&
          (process.execArgv.includes('--test') || Boolean(process.env.NODE_TEST_CONTEXT)));

      if (!isTest) {
        throw new Error('Test tokens are strictly forbidden in non-test environments.');
      }
      const parts = token.split('-');
      // format: test-token-<role>-<uid>
      return {
        uid: parts[3] || 'test_user_uid',
        email: `${parts[2] || 'user'}@test.psyco-ai.internal`,
        role: parts[2] || 'patient',
        emailVerified: true,
      };
    }

    // 2. Decode JWT structure to inspect header
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.payload) {
      throw new Error('Malformed token: could not decode JWT structure.');
    }

    const { header, payload } = decoded;

    // Verify RS256 algorithm
    if (header.alg !== 'RS256') {
      throw new Error(`Invalid token algorithm: expected RS256, got ${header.alg}.`);
    }

    if (!header.kid) {
      throw new Error('Token header missing key identifier (kid).');
    }

    const projectId = config.firebase.projectId;
    if (!projectId) {
      throw new Error('Firebase project ID is not configured on the server.');
    }

    // 3. Fetch Google public certificates and match kid
    const certificates = await this.getPublicCertificates();
    const cert = certificates[header.kid];

    if (!cert) {
      throw new Error(`Token signed with unknown key ID (${header.kid}).`);
    }

    // 4. Cryptographic signature verification using jsonwebtoken and Google public cert
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    let verifiedPayload;
    try {
      verifiedPayload = jwt.verify(token, cert, {
        algorithms: ['RS256'],
        audience: projectId,
        issuer: expectedIssuer,
      });
    } catch (verifyErr) {
      if (verifyErr.name === 'TokenExpiredError') {
        throw new Error('Token expired.');
      }
      if (verifyErr.name === 'JsonWebTokenError') {
        throw new Error(`Cryptographic token verification failed: ${verifyErr.message}`);
      }
      throw verifyErr;
    }

    if (!verifiedPayload.sub || typeof verifiedPayload.sub !== 'string') {
      throw new Error('Token missing valid subject (UID) claim.');
    }

    return {
      uid: verifiedPayload.sub,
      email: verifiedPayload.email || null,
      role: verifiedPayload.role || null,
      emailVerified: Boolean(verifiedPayload.email_verified),
      authTime: verifiedPayload.auth_time,
    };
  }
}

export const firebaseAuthAdapter = new FirebaseAuthAdapter();
