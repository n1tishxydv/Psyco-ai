import { riskReviewService } from '../services/riskReview.service.js';
import { z } from 'zod';

const acknowledgeFlagSchema = z.object({
  actionTaken: z.string().optional(),
  clinicianNotes: z.string().optional(),
  dismissAsNonApplicable: z.boolean().optional(),
});

export const riskReviewController = {
  scanTranscript: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const result = await riskReviewService.scanTranscriptForSafetySignals(sessionId, req.user.uid);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  listFlags: async (req, res, next) => {
    try {
      const { patientId, status } = req.query;
      const flags = await riskReviewService.listRiskFlags(req.user.uid, req.user.role, { patientId, status });
      res.status(200).json({ success: true, count: flags.length, flags });
    } catch (err) {
      next(err);
    }
  },

  acknowledgeFlag: async (req, res, next) => {
    try {
      const { flagId } = req.params;
      const data = acknowledgeFlagSchema.parse(req.body);
      const flag = await riskReviewService.acknowledgeRiskFlag(flagId, req.user.uid, req.user.role, data);
      res.status(200).json({ success: true, message: 'Risk review flag updated.', flag });
    } catch (err) {
      next(err);
    }
  },

  executeAction: async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const result = await riskReviewService.executeClinicalAction(sessionId, req.user.uid, req.user.role, req.body);
      res.status(200).json({ success: true, message: 'Clinical action executed and recorded.', action: result });
    } catch (err) {
      next(err);
    }
  },
};
