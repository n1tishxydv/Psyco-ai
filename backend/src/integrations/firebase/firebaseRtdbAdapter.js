import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_DIR = path.resolve(__dirname, '../../../data');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'rtdb_snapshot.json');

export function isTestingEnvironment() {
  return (
    process.env.NODE_ENV === 'test' ||
    process.execArgv.includes('--test') ||
    Boolean(process.env.NODE_TEST_CONTEXT) ||
    process.argv.some(arg => typeof arg === 'string' && (arg.includes('--test') || arg.includes('.test.js') || arg.includes('tests/')))
  );
}

class FirebaseRtdbAdapter {
  constructor() {
    this.name = 'Firebase Realtime Database';
    this.memoryStore = new Map();
    this.cachedAccessToken = null;
    this.tokenExpiresAt = 0;

    if (!isTestingEnvironment()) {
      this.loadSnapshot();
    }
  }

  loadSnapshot() {
    if (isTestingEnvironment()) {
      return;
    }
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [key, value] of Object.entries(parsed)) {
            this.memoryStore.set(key, value);
          }
          logger.info(`Loaded ${this.memoryStore.size} keys from RTDB snapshot.`);
        }
      }
    } catch (err) {
      logger.warn(`Could not load RTDB disk snapshot: ${err.message}`);
    }
  }

  saveSnapshot() {
    if (isTestingEnvironment()) {
      return;
    }
    try {
      if (!fs.existsSync(SNAPSHOT_DIR)) {
        fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
      }
      const data = Object.fromEntries(this.memoryStore.entries());
      const tempFile = path.join(
        SNAPSHOT_DIR,
        `rtdb_snapshot.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`
      );
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, SNAPSHOT_FILE);
    } catch (err) {
      logger.warn(`Could not save RTDB disk snapshot: ${err.message}`);
    }
  }

  hasServiceAccount() {
    return Boolean(
      config.firebase.clientEmail &&
      config.firebase.privateKey &&
      !config.firebase.clientEmail.includes('placeholder')
    );
  }

  isConfigured() {
    return Boolean(
      config.firebase.databaseURL &&
      config.firebase.projectId &&
      !config.firebase.projectId.includes('placeholder')
    );
  }

  getStatus() {
    const configured = this.isConfigured();
    const hasServiceAccount = this.hasServiceAccount();
    return {
      service: this.name,
      configured,
      hasServiceAccount,
      status: hasServiceAccount ? 'CLOUD_AUTHENTICATED' : configured ? 'CLOUD_UNAUTHENTICATED_REST' : 'UNCONFIGURED',
      databaseURL: config.firebase.databaseURL,
      projectId: config.firebase.projectId,
      storagePolicy: 'STRICT_TEXT_AND_STRUCTURED_JSON_ONLY',
      binaryStorageForbidden: true,
      message: hasServiceAccount
        ? `Firebase Realtime Database configured with service account at ${config.firebase.databaseURL}.`
        : configured
        ? `Firebase Realtime Database URL set (${config.firebase.databaseURL}), but service account credentials (FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY) are missing. Operating in verified local snapshot mode.`
        : 'Firebase Realtime Database URL not configured.',
    };
  }

  /**
   * Generates a Google OAuth2 access token using service account credentials
   */
  async getServiceAccountAccessToken() {
    if (!this.hasServiceAccount()) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (this.cachedAccessToken && now < this.tokenExpiresAt - 300) {
      return this.cachedAccessToken;
    }

    try {
      const payload = {
        iss: config.firebase.clientEmail,
        sub: config.firebase.clientEmail,
        aud: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database',
        iat: now,
        exp: now + 3600,
      };

      const assertion = jwt.sign(payload, config.firebase.privateKey, { algorithm: 'RS256' });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google OAuth2 token endpoint returned HTTP ${response.status}: ${errorText}`);
      }

      const tokenData = await response.json();
      this.cachedAccessToken = tokenData.access_token;
      this.tokenExpiresAt = now + (tokenData.expires_in || 3600);
      return this.cachedAccessToken;
    } catch (err) {
      logger.error('Failed to obtain Google OAuth2 access token for Firebase RTDB:', err.message);
      return null;
    }
  }

  /**
   * Defensive assertion ensuring no binary, base64 media, or oversized payloads are stored
   */
  assertValidPayload(data) {
    if (data === undefined) return;
    const serialized = JSON.stringify(data);
    if (serialized && serialized.length > 5 * 1024 * 1024) {
      throw new Error('Payload exceeds 5MB limit. Storing raw binary or audio streams in RTDB is strictly prohibited.');
    }
    if (
      /data:image\/[a-zA-Z]+;base64/i.test(serialized) ||
      /data:audio\/[a-zA-Z]+;base64/i.test(serialized) ||
      /data:video\/[a-zA-Z]+;base64/i.test(serialized)
    ) {
      throw new Error('Base64-encoded binary media is strictly forbidden under the Psyco AI storage policy.');
    }
  }

  async get(path) {
    const cleanPath = path.replace(/^\/|\/$/g, '');

    // 1. Check in-memory store for exact match
    if (this.memoryStore.has(cleanPath)) {
      return JSON.parse(JSON.stringify(this.memoryStore.get(cleanPath)));
    }

    // 2. Check ancestor node in memoryStore
    const segments = cleanPath.split('/');
    for (let i = 1; i < segments.length; i++) {
      const ancestorPath = segments.slice(0, i).join('/');
      if (this.memoryStore.has(ancestorPath)) {
        let cur = this.memoryStore.get(ancestorPath);
        let matched = true;
        for (let j = i; j < segments.length; j++) {
          if (cur && typeof cur === 'object' && segments[j] in cur) {
            cur = cur[segments[j]];
          } else {
            matched = false;
            break;
          }
        }
        if (matched && cur !== undefined) {
          return JSON.parse(JSON.stringify(cur));
        }
      }
    }

    // 3. Hierarchical aggregation for parent nodes
    const prefix = `${cleanPath}/`;
    const aggregated = {};
    let foundChildren = false;

    for (const [key, value] of this.memoryStore.entries()) {
      if (key.startsWith(prefix)) {
        foundChildren = true;
        const subPath = key.substring(prefix.length);
        const subSegments = subPath.split('/');
        let cur = aggregated;
        for (let i = 0; i < subSegments.length - 1; i++) {
          const seg = subSegments[i];
          if (!cur[seg]) cur[seg] = {};
          cur = cur[seg];
        }
        cur[subSegments[subSegments.length - 1]] = JSON.parse(JSON.stringify(value));
      }
    }

    if (foundChildren) {
      return aggregated;
    }

    // 4. Query Firebase Realtime Database REST API if configured
    if (this.isConfigured() && !isTestingEnvironment()) {
      try {
        const accessToken = await this.getServiceAccountAccessToken();
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const url = `${config.firebase.databaseURL.replace(/\/$/, '')}/${cleanPath}.json`;
        const res = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data !== null) {
            this.memoryStore.set(cleanPath, data);
            return data;
          }
        }
      } catch (err) {
        logger.warn(`RTDB remote fetch error for ${cleanPath}: ${err.message}. Serving local cache.`);
      }
    }

    return null;
  }

  async set(path, data) {
    this.assertValidPayload(data);
    const cleanPath = path.replace(/^\/|\/$/g, '');

    // Clone and save to local memory store
    this.memoryStore.set(cleanPath, JSON.parse(JSON.stringify(data)));

    // Update ancestor subtree if present
    const segments = cleanPath.split('/');
    for (let i = 1; i < segments.length; i++) {
      const ancestorPath = segments.slice(0, i).join('/');
      if (this.memoryStore.has(ancestorPath)) {
        const ancestorObj = this.memoryStore.get(ancestorPath);
        if (ancestorObj && typeof ancestorObj === 'object') {
          let cur = ancestorObj;
          for (let j = i; j < segments.length - 1; j++) {
            if (!cur[segments[j]]) cur[segments[j]] = {};
            cur = cur[segments[j]];
          }
          cur[segments[segments.length - 1]] = JSON.parse(JSON.stringify(data));
        }
      }
    }

    this.saveSnapshot();

    // Sync to live Firebase Realtime Database
    if (this.isConfigured() && !isTestingEnvironment()) {
      try {
        const accessToken = await this.getServiceAccountAccessToken();
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const url = `${config.firebase.databaseURL.replace(/\/$/, '')}/${cleanPath}.json`;
        const res = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          logger.warn(`RTDB remote write failed with status ${res.status} for path ${cleanPath}: ${errText}`);
          if (this.hasServiceAccount() && !isTestingEnvironment()) {
            throw new Error(`Cloud database write failed (HTTP ${res.status}): ${errText || 'Remote write rejected'}`);
          }
        }
      } catch (err) {
        logger.warn(`RTDB network write exception for ${cleanPath}: ${err.message}`);
        if (this.hasServiceAccount() && !isTestingEnvironment()) {
          throw new Error(`Firebase Realtime Database operation failed: ${err.message}`);
        }
      }
    }

    return true;
  }

  async update(path, partialData) {
    this.assertValidPayload(partialData);
    const cleanPath = path.replace(/^\/|\/$/g, '');
    const current = (await this.get(cleanPath)) || {};
    const merged = { ...current, ...partialData, updatedAt: new Date().toISOString() };
    await this.set(cleanPath, merged);
    return merged;
  }

  async remove(path) {
    const cleanPath = path.replace(/^\/|\/$/g, '');
    this.memoryStore.delete(cleanPath);

    const prefix = `${cleanPath}/`;
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }

    this.saveSnapshot();

    if (this.isConfigured() && !isTestingEnvironment()) {
      try {
        const accessToken = await this.getServiceAccountAccessToken();
        const headers = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        const url = `${config.firebase.databaseURL.replace(/\/$/, '')}/${cleanPath}.json`;
        const res = await fetch(url, { method: 'DELETE', headers, signal: AbortSignal.timeout(4000) });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          logger.warn(`RTDB delete error for ${cleanPath} (HTTP ${res.status}): ${errText}`);
          if (this.hasServiceAccount() && !isTestingEnvironment()) {
            throw new Error(`Cloud database delete failed (HTTP ${res.status}): ${errText || 'Remote delete rejected'}`);
          }
        }
      } catch (err) {
        logger.warn(`RTDB delete error for ${cleanPath}: ${err.message}`);
        if (this.hasServiceAccount() && !isTestingEnvironment()) {
          throw new Error(`Firebase Realtime Database delete failed: ${err.message}`);
        }
      }
    }
    return true;
  }
}

export const firebaseRtdbAdapter = new FirebaseRtdbAdapter();
