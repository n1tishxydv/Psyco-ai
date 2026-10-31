import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { schedulingService } from '../services/scheduling.service.js';
import { auditService } from '../services/audit.service.js';
import { normalizeAvailability } from '../utils/availabilityNormalizer.js';

export async function getOwnAvailability(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const availability = await schedulingService.getAvailability(psychologistId);
    return successResponse(res, { availability });
  } catch (err) {
    next(err);
  }
}

export async function updateOwnAvailability(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const normalizedBody = normalizeAvailability(req.body);

    const updated = await schedulingService.updateAvailability(psychologistId, normalizedBody);

    await auditService.record({
      action: 'AVAILABILITY_UPDATED',
      userId: psychologistId,
      details: {
        sessionDurationMinutes: updated.sessionDurationMinutes,
        bufferTimeMinutes: updated.bufferTimeMinutes,
      },
    });

    return successResponse(res, {
      message: 'Practice availability schedule updated successfully.',
      availability: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function addBlockedDate(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const newBlock = await schedulingService.addBlockedDate(psychologistId, req.body);

    await auditService.record({
      action: 'AVAILABILITY_DATE_BLOCKED',
      userId: psychologistId,
      details: { date: req.body.date, isFullDay: req.body.isFullDay },
    });

    return successResponse(res, {
      message: 'Blocked date successfully added.',
      blockedDate: newBlock,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function removeBlockedDate(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { blockId } = req.params;
    await schedulingService.removeBlockedDate(psychologistId, blockId);
    return successResponse(res, { message: 'Blocked date removed.' });
  } catch (err) {
    next(err);
  }
}

export async function addLeavePeriod(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const newLeave = await schedulingService.addLeavePeriod(psychologistId, req.body);

    await auditService.record({
      action: 'AVAILABILITY_LEAVE_ADDED',
      userId: psychologistId,
      details: { startDate: req.body.startDate, endDate: req.body.endDate },
    });

    return successResponse(res, {
      message: 'Leave period scheduled.',
      leavePeriod: newLeave,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function removeLeavePeriod(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { leaveId } = req.params;
    await schedulingService.removeLeavePeriod(psychologistId, leaveId);
    return successResponse(res, { message: 'Leave period removed.' });
  } catch (err) {
    next(err);
  }
}

export async function getPublicSlots(req, res, next) {
  try {
    const { psychologistId } = req.params;
    const { date, mode } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse(res, 'Valid date query param (YYYY-MM-DD) is required.', 400, 'INVALID_DATE');
    }

    const slots = await schedulingService.getAvailableSlots(psychologistId, date, mode || null);
    return successResponse(res, {
      psychologistId,
      date,
      slots,
      count: slots.length,
    });
  } catch (err) {
    next(err);
  }
}
