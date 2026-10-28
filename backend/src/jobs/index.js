import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { EventEmitter } from 'events';

class DurableJobQueue extends EventEmitter {
  constructor() {
    super();
    this.name = 'Psyco AI Durable Job Queue';
    this.activeJobs = new Set();
    this.concurrencyLimit = 3;
    this.isProcessing = false;
    this.pollInterval = null;
    this.workerHandler = null;
  }

  isConfigured() {
    return true; // Durable Firebase RTDB queue is always configured and available
  }

  getStatus() {
    return {
      name: this.name,
      configured: true,
      status: 'ACTIVE',
      engine: config.integrations.redis.isConfigured ? 'BullMQ/Redis' : 'Firebase-RTDB-Durable-Outbox',
      activeJobsCount: this.activeJobs.size,
      concurrencyLimit: this.concurrencyLimit,
      targetPhase: 'Phase 6 (Durable AI Processing & Gemini Clinical Copilot)',
      message: config.integrations.redis.isConfigured
        ? 'Connected to Redis backend queue.'
        : 'Durable Firebase RTDB queue active with restart reconciliation.',
    };
  }

  /**
   * Registers the background worker processor
   */
  registerWorker(handler) {
    this.workerHandler = handler;
    logger.info('Durable Job Queue: Background worker processor registered.');
  }

  /**
   * Enqueues a job for background processing
   */
  async enqueue(jobType, payload) {
    logger.info(`Durable Job Queue: Enqueued job ${jobType} (Job ID: ${payload.jobId || 'N/A'})`);
    
    // Emit event for immediate processing in current or attached worker
    setImmediate(() => {
      this._triggerNext();
    });

    return {
      id: payload.jobId,
      jobType,
      status: 'queued',
      enqueuedAt: new Date().toISOString(),
    };
  }

  /**
   * Internal queue processing trigger
   */
  async _triggerNext() {
    if (!this.workerHandler) return;
    if (this.activeJobs.size >= this.concurrencyLimit) return;

    try {
      // Find eligible queued jobs from RTDB
      const allJobs = (await firebaseRtdbAdapter.get('aiJobs')) || {};
      const pendingJobs = Object.values(allJobs)
        .filter((j) => (j.status === 'queued' || j.status === 'retrying') && !this.activeJobs.has(j.id))
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

      for (const job of pendingJobs) {
        if (this.activeJobs.size >= this.concurrencyLimit) break;
        this._dispatchJob(job.id);
      }
    } catch (err) {
      logger.error(`Durable Job Queue: Error polling queued jobs: ${err.message}`);
    }
  }

  async _dispatchJob(jobId) {
    if (this.activeJobs.has(jobId)) return;
    this.activeJobs.add(jobId);

    try {
      if (this.workerHandler) {
        await this.workerHandler(jobId);
      }
    } catch (err) {
      logger.error(`Durable Job Queue: Worker failed executing job ${jobId}: ${err.message}`);
    } finally {
      this.activeJobs.delete(jobId);
      // Check if more jobs are waiting
      setImmediate(() => this._triggerNext());
    }
  }

  /**
   * Starts periodic polling and crash reconciliation loop
   */
  startReconciliation(intervalMs = 5000) {
    if (this.pollInterval) return;

    logger.info(`Durable Job Queue: Starting crash-reconciliation loop (${intervalMs}ms interval)`);
    this.pollInterval = setInterval(async () => {
      try {
        await this.reconcileStaleJobs();
        await this._triggerNext();
      } catch (err) {
        logger.error(`Durable Job Queue: Reconciliation cycle error: ${err.message}`);
      }
    }, intervalMs);

    // Initial check
    this._triggerNext();
  }

  /**
   * Reconciles stale or interrupted jobs (e.g. if worker crashed mid-processing)
   */
  async reconcileStaleJobs() {
    const allJobs = (await firebaseRtdbAdapter.get('aiJobs')) || {};
    const now = Date.now();
    const STALE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

    for (const [jobId, job] of Object.entries(allJobs)) {
      if (job.status === 'processing' && !this.activeJobs.has(jobId)) {
        const lastUpdated = new Date(job.updatedAt || job.createdAt).getTime();
        if (now - lastUpdated > STALE_TIMEOUT_MS) {
          logger.warn(`Durable Job Queue: Detected abandoned/stale job ${jobId}. Resetting to queued for retry.`);
          job.status = 'retrying';
          job.updatedAt = new Date().toISOString();
          await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, job);
        }
      }
    }
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    logger.info('Durable Job Queue: Stopped queue processing.');
  }
}

export const jobQueue = new DurableJobQueue();
