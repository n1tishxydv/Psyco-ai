import app from './app.js';
import config from './config/index.js';
import { logger } from './utils/logger.js';
import { startWorker, stopWorker } from './workers/aiWorker.js';

import { firebaseRtdbAdapter } from './integrations/firebase/firebaseRtdbAdapter.js';

const HOST = '0.0.0.0';

const server = app.listen(config.port, HOST, () => {
  logger.info(`Psyco AI Backend Server started on port ${config.port} (${HOST}) [${config.env}]`);
  logger.info(`API endpoints mounted at: ${config.apiPrefix}`);
  logger.info(`Health check available at: ${config.apiPrefix}/health`);

  const rtdbStatus = firebaseRtdbAdapter.getStatus();
  if (rtdbStatus.status === 'PROJECT_MISMATCH') {
    logger.error(`[STARTUP CONFIG WARNING] ${rtdbStatus.message}`);
  } else {
    logger.info(`Firebase RTDB Status: ${rtdbStatus.status} [Target: ${rtdbStatus.databaseURL}]`);
  }

  // Start background worker for asynchronous AI documentation jobs
  startWorker();
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopWorker();
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
