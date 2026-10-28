import { documentationQualityService } from '../services/documentationQuality.service.js';
import { z } from 'zod';

const resolveFindingSchema = z.object({
  resolutionNotes: z.string().optional(),
});

export const documentationQualityController = {
  scanDocumentation: async (req, res, next) => {
    try {
      const result = await documentationQualityService.scanPracticeDocumentation(req.user.uid, req.user.role);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  listFindings: async (req, res, next) => {
    try {
      const { patientId, status, severity } = req.query;
      const findings = await documentationQualityService.listFindings(req.user.uid, req.user.role, {
        patientId,
        status,
        severity,
      });
      res.status(200).json({ success: true, count: findings.length, findings });
    } catch (err) {
      next(err);
    }
  },

  resolveFinding: async (req, res, next) => {
    try {
      const { findingId } = req.params;
      const data = resolveFindingSchema.parse(req.body);
      const finding = await documentationQualityService.resolveFinding(findingId, req.user.uid, req.user.role, data);
      res.status(200).json({ success: true, message: 'Documentation finding marked resolved.', finding });
    } catch (err) {
      next(err);
    }
  },
};
