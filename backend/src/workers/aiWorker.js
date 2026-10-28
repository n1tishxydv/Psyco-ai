/**
 * Psyco AI - Dedicated Asynchronous Worker Process
 * Processes compute-heavy Gemini AI documentation drafting tasks outside the web request cycle.
 * Supports durable restart recovery, concurrency management, and bounded retries.
 */

import { jobQueue } from '../jobs/index.js';
import { aiJobService } from '../services/aiJob.service.js';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

let isWorkerActive = false;

export function startWorker() {
  if (isWorkerActive) {
    logger.info('AI Worker: Worker process is already active.');
    return true;
  }

  logger.info('AI Worker: Initializing durable AI job processing worker...');
  
  // Register processing function
  jobQueue.registerWorker(async (jobId) => {
    logger.info(`AI Worker: Claimed job ${jobId} for execution.`);
    return await aiJobService.processJob(jobId);
  });

  // Start periodic crash-reconciliation loop (every 5 seconds)
  jobQueue.startReconciliation(5000);

  isWorkerActive = true;
  logger.info('AI Worker: Worker initialized and listening for jobs.');
  return true;
}

export function stopWorker() {
  if (!isWorkerActive) return;
  jobQueue.stop();
  isWorkerActive = false;
  logger.info('AI Worker: Worker process stopped.');
}

// Standalone CLI execution detection: node src/workers/aiWorker.js
const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && process.argv[1].replace(/\\/g, '/') === currentFilePath.replace(/\\/g, '/')) {
  logger.info('AI Worker: Starting in standalone daemon mode...');
  startWorker();

  process.on('SIGINT', () => {
    logger.info('AI Worker: Received SIGINT, gracefully shutting down worker...');
    stopWorker();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('AI Worker: Received SIGTERM, gracefully shutting down worker...');
    stopWorker();
    process.exit(0);
  });
}
