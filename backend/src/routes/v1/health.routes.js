import { Router } from 'express';
import { getHealthStatus, getLiveness, getReadiness } from '../../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprehensive process health check and real integration status
 * @access  Public
 */
router.get('/', getHealthStatus);

/**
 * @route   GET /api/v1/health/liveness
 * @desc    Process liveness probe
 * @access  Public
 */
router.get('/liveness', getLiveness);

/**
 * @route   GET /api/v1/health/readiness
 * @desc    Critical dependency readiness check (Firebase, DB, Workers)
 * @access  Public
 */
router.get('/readiness', getReadiness);

export default router;
