import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  defaults: {
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
    sessionDurationMinutes: parseInt(process.env.DEFAULT_SESSION_DURATION_MINUTES, 10) || 50,
    bufferTimeMinutes: parseInt(process.env.DEFAULT_BUFFER_TIME_MINUTES, 10) || 10,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'psyco-9c13d',
    apiKey: process.env.FIREBASE_API_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined,
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://psyco-9c13d-default-rtdb.firebaseio.com',
    isConfigured: Boolean(
      process.env.FIREBASE_PROJECT_ID &&
      !process.env.FIREBASE_PROJECT_ID.includes('placeholder')
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
