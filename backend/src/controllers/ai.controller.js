import { aiJobService } from '../services/aiJob.service.js';
import { geminiAdapter } from '../integrations/gemini/geminiAdapter.js';
import { jobQueue } from '../jobs/index.js';
import { createJobSchema, updateDraftSchema, approveDraftSchema } from '../validators/ai.validators.js';

export const aiController = {
  /**
   * Get AI Clinical Copilot & Queue operational status
   */
  getStatus: async (req, res, next) => {
    try {
      const geminiStatus = geminiAdapter.getStatus();
      const queueStatus = jobQueue.getStatus();

      res.status(200).json({
        success: true,
        copilot: geminiStatus,
        queue: queueStatus,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create an asynchronous AI clinical documentation job
   */
  createJob: async (req, res, next) => {
    try {
      const validatedData = createJobSchema.parse(req.body);
      const userId = req.user.uid;
      const userRole = req.user.role;

      const result = await aiJobService.createJob(userId, userRole, validatedData);

      // Returns HTTP 202 Accepted immediately
      res.status(202).json({
        success: true,
        message: 'AI documentation job enqueued for background processing.',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get status of an AI job
   */
  getJob: async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.uid;
      const userRole = req.user.role;

      const job = await aiJobService.getJob(jobId, userId, userRole);
      res.status(200).json({
        success: true,
        job,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * List AI jobs for a specific session
   */
  listJobsForSession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.uid;
      const userRole = req.user.role;

      const jobs = await aiJobService.listJobsForSession(sessionId, userId, userRole);
      res.status(200).json({
        success: true,
        count: jobs.length,
        jobs,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retry an eligible failed AI job
   */
  retryJob: async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.uid;

      const job = await aiJobService.retryJob(jobId, userId);
      res.status(200).json({
        success: true,
        message: 'Job re-enqueued for retry.',
        job,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Cancel a queued AI job
   */
  cancelJob: async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.uid;

      const job = await aiJobService.cancelJob(jobId, userId);
      res.status(200).json({
        success: true,
        message: 'Job cancelled successfully.',
        job,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get an AI clinical draft
   */
  getDraft: async (req, res, next) => {
    try {
      const { draftId } = req.params;
      const userId = req.user.uid;
      const userRole = req.user.role;

      const draft = await aiJobService.getDraft(draftId, userId, userRole);
      res.status(200).json({
        success: true,
        draft,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * List all AI drafts for a session
   */
  listDraftsForSession: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.uid;
      const userRole = req.user.role;

      const drafts = await aiJobService.listDraftsForSession(sessionId, userId, userRole);
      res.status(200).json({
        success: true,
        count: drafts.length,
        drafts,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Edit an AI clinical draft
   */
  updateDraft: async (req, res, next) => {
    try {
      const { draftId } = req.params;
      const userId = req.user.uid;
      const updates = updateDraftSchema.parse(req.body);

      const draft = await aiJobService.updateDraft(draftId, userId, updates);
      res.status(200).json({
        success: true,
        message: 'Draft updated successfully.',
        draft,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Reject / Discard an AI clinical draft
   */
  rejectDraft: async (req, res, next) => {
    try {
      const { draftId } = req.params;
      const userId = req.user.uid;
      const { reason } = req.body;

      const draft = await aiJobService.rejectDraft(draftId, userId, reason);
      res.status(200).json({
        success: true,
        message: 'Draft rejected and archived.',
        draft,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Explicit Clinician Approval: commits AI draft to official clinical records
   */
  approveDraft: async (req, res, next) => {
    try {
      const { draftId } = req.params;
      const userId = req.user.uid;
      const userRole = req.user.role;
      const approvalData = approveDraftSchema.parse(req.body);

      const result = await aiJobService.approveDraft(draftId, userId, userRole, approvalData);
      res.status(200).json({
        success: true,
        message: 'Clinical draft approved and committed to authoritative patient records.',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
};
