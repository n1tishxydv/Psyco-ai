import { Router } from 'express';
import { getHealthStatus } from '../../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprehensive process health check and real integration status
 * @access  Public
 */
router.get('/', getHealthStatus);

export default router;
