import { Router } from 'express';
import { getPublishedFaqs, submitContact, submitFaqQuestion } from '../../controllers/public.controller.js';
import { validateRequest } from '../../validators/validateRequest.js';
import { contactSubmissionSchema, faqSubmissionSchema } from '../../validators/public.validators.js';
import { publicSubmissionLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

/**
 * @route   GET /api/v1/public/faqs
 * @desc    Get published product FAQs
 * @access  Public
 */
router.get('/faqs', getPublishedFaqs);

/**
 * @route   POST /api/v1/public/contact
 * @desc    Submit a contact inquiry
 * @access  Public (Rate limited)
 */
router.post(
  '/contact',
  publicSubmissionLimiter,
  validateRequest(contactSubmissionSchema),
  submitContact
);

/**
 * @route   POST /api/v1/public/faq-submissions
 * @desc    Submit a question for public FAQ consideration
 * @access  Public (Rate limited)
 */
router.post(
  '/faq-submissions',
  publicSubmissionLimiter,
  validateRequest(faqSubmissionSchema),
  submitFaqQuestion
);

export default router;
