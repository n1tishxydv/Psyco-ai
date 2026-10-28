import { Router } from 'express';
import { registerPatient, registerPsychologist, login, getProfile } from '../../controllers/auth.controller.js';
import { validateRequest } from '../../validators/validateRequest.js';
import { registerPatientSchema, registerPsychologistSchema, loginSchema } from '../../validators/auth.validators.js';
import { authenticateToken } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register/patient', authRateLimiter, validateRequest(registerPatientSchema), registerPatient);
router.post('/register/psychologist', authRateLimiter, validateRequest(registerPsychologistSchema), registerPsychologist);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.get('/me', authenticateToken, getProfile);

export default router;
