import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../../');

// Detect if staging is requested via NODE_ENV, APP_ENV, or command line flags
const isStaging =
  process.env.NODE_ENV === 'staging' ||
  process.env.APP_ENV === 'staging' ||
  process.argv.includes('--staging') ||
  process.argv.some(arg => typeof arg === 'string' && (arg.includes('staging') || arg.includes('.env.staging')));

const stagingPath = path.join(backendRoot, '.env.staging');
if (isStaging && fs.existsSync(stagingPath)) {
  dotenv.config({ path: stagingPath, override: true });
} else {
  dotenv.config({ path: path.join(backendRoot, '.env') });
}

// Compute explicit allowlist for CORS
const configuredFrontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['https://psyco-ai-staging.web.app', 'https://psyco-ai-staging.firebaseapp.com'];

const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
  ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = Array.from(
  new Set([
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    ...configuredFrontendOrigins,
    ...additionalOrigins,
  ])
).filter(Boolean);

/**
 * Normalizes and cleans a PEM private key from environment variables.
 * Automatically removes wrapping quotes (single or double) and converts
 * escaped newline characters (\\n, \\r\\n) into standard newlines.
 *
 * @param {string|undefined} rawKey - The raw private key string
 * @returns {string|undefined} Normalized PEM key string or undefined
 */
export function normalizePrivateKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    return undefined;
  }

  let key = rawKey.trim();

  // Strip wrapping single or double quotes that can be introduced by cloud hosting dashboards (Render, Heroku, etc.)
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Normalize escaped linebreaks to true newline characters
  key = key
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Verify basic PEM structure
  if (!key.includes('BEGIN') || !key.includes('KEY')) {
    return undefined;
  }

  // Ensure trailing newline
  if (!key.endsWith('\n')) {
    key += '\n';
  }

  return key;
}

/**
 * Validates that a private key is a valid asymmetric key for RS256 signing.
 *
 * @param {string|undefined} key - Normalized PEM string
 * @returns {{ valid: boolean, type?: string, error?: string }}
 */
export function validatePrivateKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Private key is missing or undefined.' };
  }
  try {
    const keyObject = crypto.createPrivateKey(key);
    if (!keyObject.asymmetricKeyType) {
      return { valid: false, error: 'Key is not an asymmetric cryptographic key.' };
    }
    return { valid: true, type: keyObject.asymmetricKeyType };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Extracts the Google Cloud project ID from a service account client email.
 * e.g., 'firebase-adminsdk-fbsvc@psyco-ai-staging.iam.gserviceaccount.com' -> 'psyco-ai-staging'
 *
 * @param {string|undefined} email - Service account client email
 * @returns {string|null} Extracted project ID or null
 */
export function extractProjectIdFromServiceAccountEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const match = email.match(/@([^.]+)\.iam\.gserviceaccount\.com$/);
  return match ? match[1] : null;
}

/**
 * Extracts the Firebase project/database name from a Firebase Realtime Database URL.
 * e.g., 'https://psyco-ai-staging-default-rtdb.firebaseio.com' -> 'psyco-ai-staging'
 *
 * @param {string|undefined} url - Realtime database URL
 * @returns {string|null} Extracted database project name or null
 */
export function extractProjectIdFromDatabaseURL(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/https:\/\/([a-zA-Z0-9-]+?)(?:-default-rtdb)?\.firebaseio\.com/);
  return match ? match[1] : null;
}

/**
 * Validates cross-project alignment among the configured project ID, service account email, and database URL.
 * Ensures tokens signed by a service account for project A are not erroneously sent to database for project B.
 *
 * @param {{ projectId?: string, clientEmail?: string, databaseURL?: string }} params
 * @returns {{ valid: boolean, emailProject: string|null, dbProject: string|null, projectId: string|null, errors: string[] }}
 */
export function validateFirebaseProjectAlignment({ projectId, clientEmail, databaseURL } = {}) {
  const emailProject = extractProjectIdFromServiceAccountEmail(clientEmail);
  const dbProject = extractProjectIdFromDatabaseURL(databaseURL);

  const errors = [];
  if (emailProject && projectId && emailProject !== projectId) {
    errors.push(
      `Service account email project (${emailProject}) does not match configured project ID (${projectId}).`
    );
  }
  if (dbProject && projectId && dbProject !== projectId) {
    errors.push(
      `Database URL target project (${dbProject}) does not match configured project ID (${projectId}).`
    );
  }
  if (emailProject && dbProject && emailProject !== dbProject) {
    errors.push(
      `Service account email project (${emailProject}) does not match target database URL project (${dbProject}). This causes Google OAuth tokens to be rejected with HTTP 401 Unauthorized.`
    );
  }

  return {
    valid: errors.length === 0,
    emailProject,
    dbProject,
    projectId: projectId || null,
    errors,
  };
}

import { resolveAiSandboxConfig } from './aiSandboxConfig.js';

const defaultProjectId = process.env.NODE_ENV === 'production' ? 'psyco-9c13d' : 'psyco-ai-staging';
const defaultDatabaseURL = process.env.NODE_ENV === 'production'
  ? 'https://psyco-9c13d-default-rtdb.firebaseio.com'
  : 'https://psyco-ai-staging-default-rtdb.firebaseio.com';

const resolvedProjectId = process.env.FIREBASE_PROJECT_ID || defaultProjectId;
const resolvedDatabaseURL = process.env.FIREBASE_DATABASE_URL || defaultDatabaseURL;

// Resolve and validate AI Sandbox configuration (fails closed if inconsistent)
const aiSandbox = resolveAiSandboxConfig(process.env);

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: configuredFrontendOrigins[0] || 'http://localhost:5173',
  allowedOrigins,

  // Phase 6.3 AI Sandbox & Vendor Privacy Safeguards
  aiSandbox,

  defaults: {
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
    sessionDurationMinutes: parseInt(process.env.DEFAULT_SESSION_DURATION_MINUTES, 10) || 50,
    bufferTimeMinutes: parseInt(process.env.DEFAULT_BUFFER_TIME_MINUTES, 10) || 10,
  },

  firebase: {
    projectId: resolvedProjectId,
    apiKey: process.env.FIREBASE_API_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    databaseURL: resolvedDatabaseURL,
    alignment: validateFirebaseProjectAlignment({
      projectId: resolvedProjectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      databaseURL: resolvedDatabaseURL,
    }),
    isConfigured: Boolean(
      resolvedProjectId &&
      !resolvedProjectId.includes('placeholder')
    ),
  },

  integrations: {
    google: {
      calendarApiKey: process.env.GOOGLE_CALENDAR_API_KEY,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      isConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      isConfigured: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('placeholder')),
    },
    assemblyai: {
      apiKey: process.env.ASSEMBLYAI_API_KEY,
      isConfigured: Boolean(process.env.ASSEMBLYAI_API_KEY),
    },
    redis: {
      url: process.env.REDIS_URL,
      isConfigured: Boolean(process.env.REDIS_URL),
    },
  },
};

export default config;
