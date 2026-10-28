/**
 * Sanitized logger for Psyco AI
 * Prohibits logging passwords, tokens, patient notes, and transcripts.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'apiKey',
  'secret',
  'transcript',
  'audio',
  'intakedata',
  'sessionnotes',
  'subjective',
  'objective',
  'assessment',
  'plan',
]);

function sanitize(obj, depth = 0) {
  if (depth > 3 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitize(item, depth + 1));

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED_SENSITIVE_CLINICAL_OR_AUTH_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value, depth + 1);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info: (msg, meta) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(sanitize(meta))}` : '';
    console.log(`[INFO] [${timestamp}] ${msg}${metaStr}`);
  },
  warn: (msg, meta) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(sanitize(meta))}` : '';
    console.warn(`[WARN] [${timestamp}] ${msg}${metaStr}`);
  },
  error: (msg, meta) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(sanitize(meta))}` : '';
    console.error(`[ERROR] [${timestamp}] ${msg}${metaStr}`);
  },
};
