import config from '../config/index.js';
import { successResponse } from '../utils/apiResponse.js';
import { firebase } from '../database/firebase.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';
import { googleMeetAdapter } from '../integrations/googleMeet/googleMeetAdapter.js';
import { geminiAdapter } from '../integrations/gemini/geminiAdapter.js';
import { assemblyaiAdapter } from '../integrations/assemblyai/assemblyaiAdapter.js';
import { jobQueue } from '../jobs/index.js';

export function getHealthStatus(req, res) {
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: 'HEALTHY',
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
      firebaseAuth: firebase.getStatus().auth,
      firebaseRtdb: firebase.getStatus().database,
      googleCalendar: googleCalendarAdapter.getStatus(),
      googleMeet: googleMeetAdapter.getStatus(),
      geminiClinicalCopilot: geminiAdapter.getStatus(),
      assemblyaiTranscription: assemblyaiAdapter.getStatus(),
      backgroundJobQueue: jobQueue.getStatus(),
    },
  };

  return successResponse(res, healthData, 200, {
    checkedAt: new Date().toISOString(),
  });
}
