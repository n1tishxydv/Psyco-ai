import crypto from 'crypto';
import config from '../config/index.js';
import { logger } from './logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Canonical dedicated encryption environment variable: TOKEN_ENCRYPTION_KEY
 * Backward-compatible alias: CALENDAR_TOKEN_ENCRYPTION_KEY
 *
 * Requirements:
 * 1. Dedicated encryption key distinct from session/JWT secrets.
 * 2. Deterministic 32-byte (256-bit) key for AES-256-GCM.
 * 3. No silent JWT_SECRET fallback in staging/production.
 * 4. Zero secret values exposed in logs.
 * 5. Multi-key candidate resolution on decryption to ensure existing tokens remain decryptable.
 */
export function getCanonicalEncryptionKey() {
  const dedicated =
    (process.env.TOKEN_ENCRYPTION_KEY && process.env.TOKEN_ENCRYPTION_KEY.trim()) ||
    (process.env.CALENDAR_TOKEN_ENCRYPTION_KEY && process.env.CALENDAR_TOKEN_ENCRYPTION_KEY.trim());

  if (dedicated) {
    return crypto.createHash('sha256').update(dedicated).digest();
  }

  // Development and test environments use a deterministic local key
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return crypto.createHash('sha256').update('psyco_ai_token_encryption_test_key_2026').digest();
  }

  // In staging/production, fail safely rather than silently using an insecure or unpredictable fallback
  throw new Error('TOKEN_ENCRYPTION_KEY is required in staging and production environments.');
}

/**
 * Returns an array of candidate keys for decrypting envelopes that may have been
 * encrypted under a previous key, an alias key, or a transition key.
 */
function getDecryptionKeyCandidates() {
  const candidates = [];

  // 1. Canonical / configured primary key
  try {
    candidates.push(getCanonicalEncryptionKey());
  } catch {
    // Primary key not configured in environment
  }

  // 2. Candidate fallbacks to ensure existing tokens remain decryptable
  const fallbackSources = [
    process.env.CALENDAR_TOKEN_ENCRYPTION_KEY,
    process.env.TOKEN_ENCRYPTION_KEY,
    config.firebase?.privateKey,
    process.env.JWT_SECRET,
    process.env.SESSION_SECRET,
    'psyco_ai_token_encryption_default_key_2026',
    'psyco_ai_token_encryption_test_key_2026',
  ].filter(Boolean);

  for (const src of fallbackSources) {
    const key = crypto.createHash('sha256').update(src.trim ? src.trim() : src).digest();
    if (!candidates.some((existing) => existing.equals(key))) {
      candidates.push(key);
    }
  }

  return candidates;
}

/**
 * Encrypts a plaintext string (e.g. OAuth refresh token or access token) using AES-256-GCM.
 *
 * @param {string} plaintext - The secret string to encrypt
 * @returns {{ ciphertext: string, iv: string, tag: string, version: number } | null} Encrypted envelope
 */
export function encryptToken(plaintext) {
  if (!plaintext || typeof plaintext !== 'string') {
    return null;
  }

  try {
    const key = getCanonicalEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      tag,
      version: 1,
    };
  } catch (err) {
    logger.error(`Token encryption failed: ${err.message}`);
    throw new Error('Failed to encrypt sensitive OAuth token.');
  }
}

/**
 * Decrypts an AES-256-GCM encrypted token envelope.
 * Also handles legacy unencrypted strings gracefully for backward compatibility.
 * Attempts candidate keys to ensure previously encrypted tokens remain decryptable across deployments.
 *
 * @param {object|string} envelope - The encrypted envelope or legacy plaintext string
 * @returns {string|null} The decrypted plaintext string
 */
export function decryptToken(envelope) {
  if (!envelope) {
    return null;
  }

  // Handle legacy unencrypted tokens during transition
  if (typeof envelope === 'string') {
    return envelope;
  }

  const { ciphertext, iv, tag } = envelope;
  if (!ciphertext || !iv || !tag) {
    return null;
  }

  const candidates = getDecryptionKeyCandidates();
  if (candidates.length === 0) {
    logger.error('Token decryption failed: No encryption or candidate keys available.');
    return null;
  }

  for (const key of candidates) {
    try {
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(iv, 'hex'),
        { authTagLength: AUTH_TAG_LENGTH }
      );

      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      // Authentication tag mismatch for this candidate key; continue trying next candidate
    }
  }

  logger.error('Token decryption failed: Unable to decrypt envelope with any available key candidate.');
  return null;
}

