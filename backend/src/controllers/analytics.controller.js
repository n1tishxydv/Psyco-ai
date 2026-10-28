import { analyticsService } from '../services/analytics.service.js';

export const analyticsController = {
  getPatientProgressAnalytics: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const analytics = await analyticsService.getPatientProgressAnalytics(patientId, req.user.uid, req.user.role);
      res.status(200).json({ success: true, analytics });
    } catch (err) {
      next(err);
    }
  },

  getPracticeAnalytics: async (req, res, next) => {
    try {
      const metrics = await analyticsService.getPracticeAnalytics(req.user.uid, req.user.role);
      res.status(200).json({ success: true, metrics });
    } catch (err) {
      next(err);
    }
  },
};
