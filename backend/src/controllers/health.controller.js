import config from '../config/index.js';
import { successResponse } from '../utils/apiResponse.js';
import { firebase } from '../database/firebase.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';
import { googleMeetAdapter } from '../integrations/googleMeet/googleMeetAdapter.js';
import { geminiAdapter } from '../integrations/gemini/geminiAdapter.js';
import { assemblyaiAdapter } from '../integrations/assemblyai/assemblyaiAdapter.js';
import { jobQueue } from '../jobs/index.js';

export function getLiveness(req, res) {
  return successResponse(res, {
    status: 'UP',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

export function getReadiness(req, res) {
  const rtdbStatus = firebase.getStatus().database;
  const authStatus = firebase.getStatus().auth;
  const workerStatus = jobQueue.getStatus();

  const isAlignmentOk = rtdbStatus.alignmentValid !== false && rtdbStatus.status !== 'PROJECT_MISMATCH';
  const isKeyOk = rtdbStatus.status !== 'INVALID_PRIVATE_KEY';
  const isAuthOk = authStatus.configured;
  const isDatabaseOk = rtdbStatus.configured;

  const isReady = isAlignmentOk && isKeyOk && isAuthOk && isDatabaseOk;

  const readinessData = {
    status: isReady ? 'READY' : 'NOT_READY',
    ready: isReady,
    checks: {
      firebaseAlignment: {
        status: isAlignmentOk ? 'PASS' : 'FAIL',
        message: isAlignmentOk ? 'Project IDs aligned' : 'Project ID mismatch detected',
      },
      firebaseAuth: {
        status: isAuthOk ? 'PASS' : 'WARN',
        configured: isAuthOk,
      },
      firebaseRtdb: {
        status: (isDatabaseOk && isKeyOk && isAlignmentOk) ? 'PASS' : 'FAIL',
        mode: rtdbStatus.status,
      },
      backgroundWorker: {
        status: workerStatus.running ? 'PASS' : 'STANDBY',
      },
    },
    checkedAt: new Date().toISOString(),
  };

  if (!isReady) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_NOT_READY',
        message: 'Critical service dependencies are misconfigured or not ready.',
      },
      data: readinessData,
    });
  }

  return successResponse(res, readinessData, 200);
}

export function getHealthStatus(req, res) {
  const memoryUsage = process.memoryUsage();
  const rtdbStatus = firebase.getStatus().database;
  const authStatus = firebase.getStatus().auth;

  const isAlignmentOk = rtdbStatus.alignmentValid !== false && rtdbStatus.status !== 'PROJECT_MISMATCH';
  const isKeyOk = rtdbStatus.status !== 'INVALID_PRIVATE_KEY';
  const isHealthy = isAlignmentOk && isKeyOk;

  const healthData = {
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    service: 'Psyco AI API Server',
    environment: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    process: {
      nodeVersion: process.version,
      pid: process.pid,
      memoryUsageMb: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    },
    storagePolicy: {
      database: 'Firebase Realtime Database (Fixed)',
      binaryMediaAllowed: false,
      transientAudioBuffersOnly: true,
      persistentAudioSaved: false,
    },
    integrations: {
      firebaseAuth: authStatus,
      firebaseRtdb: rtdbStatus,
      googleCalendar: googleCalendarAdapter.getStatus(),
      googleMeet: googleMeetAdapter.getStatus(),
      geminiClinicalCopilot: geminiAdapter.getStatus(),
      assemblyaiTranscription: assemblyaiAdapter.getStatus(),
      backgroundJobQueue: jobQueue.getStatus(),
    },
  };

  const statusCode = isHealthy ? 200 : 503;
  return successResponse(res, healthData, statusCode, {
    checkedAt: new Date().toISOString(),
  });
}
