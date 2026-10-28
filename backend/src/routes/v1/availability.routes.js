import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole, ROLES } from '../../middleware/authorization.js';
import { validateRequest } from '../../validators/validateRequest.js';
import {
  updateWorkingHoursSchema,
  addBlockedDateSchema,
  addLeavePeriodSchema,
} from '../../validators/availability.validators.js';
import {
  getOwnAvailability,
  updateOwnAvailability,
  addBlockedDate,
  removeBlockedDate,
  addLeavePeriod,
  removeLeavePeriod,
} from '../../controllers/availability.controller.js';

const router = Router();

// All routes in this file require authenticated Psychologist
router.use(authenticateToken);
router.use(requireRole(ROLES.PSYCHOLOGIST));

router.get('/mine', getOwnAvailability);
router.put('/mine', validateRequest(updateWorkingHoursSchema), updateOwnAvailability);

router.post('/blocked-dates', validateRequest(addBlockedDateSchema), addBlockedDate);
router.delete('/blocked-dates/:blockId', removeBlockedDate);

router.post('/leave', validateRequest(addLeavePeriodSchema), addLeavePeriod);
router.delete('/leave/:leaveId', removeLeavePeriod);

export default router;
