import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/apiResponse.js';

export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000, // Generous limit for development & polling
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate-limit internal polling for background AI jobs, notifications, or health checks
    const p = req.path || req.originalUrl || '';
    return p.includes('/ai/jobs') || p.includes('/notifications') || p.includes('/health');
  },
  handler: (req, res) => {
    return errorResponse(res, 'Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit auth attempts to 15 per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  },
});

export const publicSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit form submissions to 10 per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      'Submission rate limit reached. Please wait before submitting another message or question.',
      429,
      'SUBMISSION_RATE_LIMIT_EXCEEDED'
    );
  },
});
