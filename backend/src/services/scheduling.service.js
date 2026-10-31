import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import {
  normalizeSchedulePeriod,
  normalizeWeeklySchedule,
  normalizeAvailability,
} from '../utils/availabilityNormalizer.js';

export {
  normalizeSchedulePeriod,
  normalizeWeeklySchedule,
  normalizeAvailability,
};

export const DEFAULT_AVAILABILITY = {
  weeklySchedule: {
    monday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
    tuesday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
    wednesday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
    thursday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
    friday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
    saturday: [{ startTime: '10:00', endTime: '16:00', mode: 'both' }],
    sunday: [{ startTime: '10:00', endTime: '14:00', mode: 'both' }],
  },
  sessionDurationMinutes: 50,
  bufferTimeMinutes: 10,
  bookingWindow: {
    minNoticeHours: 1,
    maxAdvanceDays: 60,
  },
  cancellationPolicy: {
    cutoffHours: 24,
  },
  reschedulingPolicy: {
    cutoffHours: 24,
  },
  timezone: 'Asia/Kolkata',
  offeredModes: 'both',
  defaultMode: 'in_person',
  blockedDates: [],
  leavePeriods: [],
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Generates a deterministic, path-safe UTC slot key for atomic reservations
 */
export function getCanonicalSlotKey(startTime) {
  const d = new Date(startTime);
  if (isNaN(d.getTime())) {
    const err = new Error('Invalid appointment time boundaries.');
    err.code = 'INVALID_TIME_INTERVAL';
    err.status = 400;
    throw err;
  }
  return d.toISOString().replace(/[:.]/g, '_');
}

export const schedulingService = {
  /**
   * Retrieves psychologist's availability configuration or initial default,
   * fully normalized into the canonical schema.
   */
  getAvailability: async (psychologistId) => {
    const custom = await firebaseRtdbAdapter.get(`availability/${psychologistId}`);
    if (!custom) {
      return {
        psychologistId,
        ...DEFAULT_AVAILABILITY,
        isDefault: true,
      };
    }
    const normalized = normalizeAvailability(custom);
    return {
      psychologistId,
      ...DEFAULT_AVAILABILITY,
      ...normalized,
      isDefault: false,
    };
  },

  /**
   * Saves or updates psychologist's availability settings in canonical format.
   */
  updateAvailability: async (psychologistId, updates) => {
    const current = await schedulingService.getAvailability(psychologistId);
    const normalizedUpdates = normalizeAvailability(updates);
    const merged = {
      ...current,
      ...normalizedUpdates,
      psychologistId,
      updatedAt: new Date().toISOString(),
    };
    await firebaseRtdbAdapter.set(`availability/${psychologistId}`, merged);
    return merged;
  },

  /**
   * Add a blocked date or time interval
   */
  addBlockedDate: async (psychologistId, block) => {
    const avail = await schedulingService.getAvailability(psychologistId);
    const blockedList = avail.blockedDates || [];

    // Backend authoritative validation: check collision with existing leave
    const inLeave = (avail.leavePeriods || []).some((l) => block.date >= l.startDate && block.date <= l.endDate);
    if (inLeave) {
      const err = new Error('The selected date falls within an existing approved clinical leave period.');
      err.code = 'DATE_IN_LEAVE_PERIOD';
      err.status = 409;
      throw err;
    }

    // Backend authoritative validation: check existing full-day block
    const alreadyBlocked = blockedList.some((b) => b.date === block.date && b.isFullDay);
    if (alreadyBlocked && block.isFullDay !== false) {
      const err = new Error('This date is already blocked as a full day.');
      err.code = 'DATE_ALREADY_BLOCKED';
      err.status = 409;
      throw err;
    }

    const newBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: block.date,
      startTime: block.startTime || null,
      endTime: block.endTime || null,
      isFullDay: block.isFullDay !== false,
      reason: block.reason || 'Unavailable',
      createdAt: new Date().toISOString(),
    };

    blockedList.push(newBlock);
    await schedulingService.updateAvailability(psychologistId, { blockedDates: blockedList });
    return newBlock;
  },

  /**
   * Remove a blocked date
   */
  removeBlockedDate: async (psychologistId, blockId) => {
    const avail = await schedulingService.getAvailability(psychologistId);
    const updated = (avail.blockedDates || []).filter((b) => b.id !== blockId);
    await schedulingService.updateAvailability(psychologistId, { blockedDates: updated });
    return true;
  },

  /**
   * Add a leave period
   */
  addLeavePeriod: async (psychologistId, leave) => {
    const avail = await schedulingService.getAvailability(psychologistId);
    const leaveList = avail.leavePeriods || [];

    // Backend authoritative validation: ensure new leave interval does not overlap with existing leave
    const hasOverlap = leaveList.some((l) => leave.startDate <= l.endDate && leave.endDate >= l.startDate);
    if (hasOverlap) {
      const err = new Error('Requested leave period overlaps with an existing scheduled leave period.');
      err.code = 'LEAVE_INTERVAL_OVERLAP';
      err.status = 409;
      throw err;
    }

    const newLeave = {
      id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason || 'Clinical Leave',
      createdAt: new Date().toISOString(),
    };

    leaveList.push(newLeave);
    await schedulingService.updateAvailability(psychologistId, { leavePeriods: leaveList });
    return newLeave;
  },

  /**
   * Remove a leave period
   */
  removeLeavePeriod: async (psychologistId, leaveId) => {
    const avail = await schedulingService.getAvailability(psychologistId);
    const updated = (avail.leavePeriods || []).filter((l) => l.id !== leaveId);
    await schedulingService.updateAvailability(psychologistId, { leavePeriods: updated });
    return true;
  },

  /**
   * Calculates available appointment slots for a psychologist on a given date (YYYY-MM-DD).
   * Checks weekly schedule, leave periods, blocked dates, existing appointments, and active reservations.
   */
  getAvailableSlots: async (psychologistId, dateString, requestedMode = null) => {
    const avail = await schedulingService.getAvailability(psychologistId);
    const targetDate = new Date(`${dateString}T00:00:00Z`);

    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }

    const dayName = DAY_NAMES[targetDate.getUTCDay()];
    const rawWorkingSlots = avail.weeklySchedule?.[dayName] || [];

    // If day is not a working day
    if (!rawWorkingSlots || rawWorkingSlots.length === 0) {
      return [];
    }

    // Check Leave Periods
    const isLeave = (avail.leavePeriods || []).some((l) => {
      return dateString >= l.startDate && dateString <= l.endDate;
    });
    if (isLeave) return [];

    // Check Full-Day Blocked Dates
    const isFullDayBlocked = (avail.blockedDates || []).some((b) => {
      return b.date === dateString && b.isFullDay;
    });
    if (isFullDayBlocked) return [];

    const partialBlocks = (avail.blockedDates || []).filter((b) => b.date === dateString && !b.isFullDay);

    // Fetch existing appointments for psychologist
    const allAppointments = await firebaseRtdbAdapter.get('appointments') || {};
    const existingApts = Object.values(allAppointments).filter((apt) => {
      if (apt.psychologistId !== psychologistId) return false;
      if (apt.status === 'cancelled' || apt.status === 'rejected') return false;
      return apt.startTime && apt.startTime.startsWith(dateString);
    });

    // Fetch active slot reservations for psychologist
    const allReservations = await firebaseRtdbAdapter.get(`slotReservations/${psychologistId}`) || {};
    const activeReservations = Object.values(allReservations).filter((resv) => {
      if (resv.status !== 'reserved' && resv.status !== 'confirmed') return false;
      return resv.startTime && resv.startTime.startsWith(dateString);
    });

    const durationMs = (avail.sessionDurationMinutes || 50) * 60 * 1000;
    const bufferMs = (avail.bufferTimeMinutes || 10) * 60 * 1000;
    const nowMs = Date.now();
    const minNoticeMs = (avail.bookingWindow?.minNoticeHours || 2) * 60 * 60 * 1000;
    const maxAdvanceMs = (avail.bookingWindow?.maxAdvanceDays || 60) * 24 * 60 * 60 * 1000;

    const candidateSlots = [];

    for (const rawPeriod of rawWorkingSlots) {
      let period;
      try {
        period = normalizeSchedulePeriod(rawPeriod);
      } catch (normErr) {
        logger.warn(`Skipping invalid schedule period on ${dayName} for psychologist ${psychologistId}: ${normErr.message}`);
        continue;
      }

      // Check mode compatibility
      if (requestedMode && period.mode !== 'both' && period.mode !== requestedMode) {
        continue;
      }

      const [startH, startM] = period.startTime.split(':').map(Number);
      const [endH, endM] = period.endTime.split(':').map(Number);

      const periodStart = new Date(`${dateString}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00Z`).getTime();
      const periodEnd = new Date(`${dateString}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00Z`).getTime();

      let current = periodStart;

      while (current + durationMs <= periodEnd) {
        const slotStart = current;
        const slotEnd = current + durationMs;

        // Advance to next slot considering buffer
        current = slotEnd + bufferMs;

        // 1. Booking window checks (must be in future + notice, and not beyond advance window)
        if (slotStart < nowMs + minNoticeMs || slotStart > nowMs + maxAdvanceMs) {
          continue;
        }

        // 2. Check overlap with partial day blocks
        const overlapsBlock = partialBlocks.some((b) => {
          if (!b.startTime || !b.endTime) return false;
          const [bStartH, bStartM] = b.startTime.split(':').map(Number);
          const [bEndH, bEndM] = b.endTime.split(':').map(Number);
          const bStartMs = new Date(`${dateString}T${String(bStartH).padStart(2, '0')}:${String(bStartM).padStart(2, '0')}:00Z`).getTime();
          const bEndMs = new Date(`${dateString}T${String(bEndH).padStart(2, '0')}:${String(bEndM).padStart(2, '0')}:00Z`).getTime();
          return slotStart < bEndMs && slotEnd > bStartMs;
        });

        if (overlapsBlock) continue;

        // 3. Check overlap with existing appointments + buffer
        const overlapsApt = existingApts.some((apt) => {
          const aptStart = new Date(apt.startTime).getTime();
          const aptEnd = new Date(apt.endTime).getTime();
          return slotStart < aptEnd + bufferMs && slotEnd + bufferMs > aptStart;
        });

        if (overlapsApt) continue;

        // 4. Check overlap with active slot reservations + buffer
        const overlapsResv = activeReservations.some((resv) => {
          const resvStart = new Date(resv.startTime).getTime();
          const resvEnd = new Date(resv.endTime).getTime();
          return slotStart < resvEnd + bufferMs && slotEnd + bufferMs > resvStart;
        });

        if (overlapsResv) continue;

        candidateSlots.push({
          startTime: new Date(slotStart).toISOString(),
          endTime: new Date(slotEnd).toISOString(),
          durationMinutes: avail.sessionDurationMinutes,
          mode: period.mode,
          isAvailable: true,
        });
      }
    }

    return candidateSlots;
  },

  /**
   * Concurrency-safe conflict check. Ensures an appointment interval does not overlap
   * any active appointments, buffer periods, or active slot reservations.
   */
  assertNoConflicts: async (psychologistId, startTime, endTime, excludeAppointmentId = null) => {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    if (isNaN(startMs) || isNaN(endMs) || startMs >= endMs) {
      const err = new Error('Invalid appointment time boundaries.');
      err.code = 'INVALID_TIME_INTERVAL';
      err.status = 400;
      throw err;
    }

    const avail = await schedulingService.getAvailability(psychologistId);
    const bufferMs = (avail.bufferTimeMinutes || 10) * 60 * 1000;

    // Check all existing active appointments for psychologist
    const allAppointments = await firebaseRtdbAdapter.get('appointments') || {};
    for (const [id, apt] of Object.entries(allAppointments)) {
      if (apt.psychologistId !== psychologistId) continue;
      if (excludeAppointmentId && (id === excludeAppointmentId || apt.id === excludeAppointmentId)) continue;
      if (apt.status === 'cancelled' || apt.status === 'rejected') continue;

      const aptStart = new Date(apt.startTime).getTime();
      const aptEnd = new Date(apt.endTime).getTime();

      // Conflicting interval overlap including buffer
      if (startMs < aptEnd + bufferMs && endMs + bufferMs > aptStart) {
        const err = new Error('The requested appointment slot conflicts with an existing booking or buffer window.');
        err.code = 'SLOT_ALREADY_RESERVED';
        err.status = 409;
        throw err;
      }
    }

    // Check all active reservations for psychologist
    const allReservations = await firebaseRtdbAdapter.get(`slotReservations/${psychologistId}`) || {};
    const nowMs = Date.now();
    for (const resv of Object.values(allReservations)) {
      if (resv.status !== 'reserved' && resv.status !== 'confirmed') continue;
      if (excludeAppointmentId && resv.appointmentId === excludeAppointmentId) continue;

      // Crash recovery: unconfirmed reservation lease expired without appointment record
      const isExpired = resv.status === 'reserved' && resv.expiresAt && new Date(resv.expiresAt).getTime() < nowMs;
      if (isExpired) {
        const apt = resv.appointmentId ? await firebaseRtdbAdapter.get(`appointments/${resv.appointmentId}`) : null;
        if (!apt) {
          continue; // Expired reservation from crashed process is ignored and reclaimable
        }
      }

      const resvStart = new Date(resv.startTime).getTime();
      const resvEnd = new Date(resv.endTime).getTime();

      if (startMs < resvEnd + bufferMs && endMs + bufferMs > resvStart) {
        const err = new Error('The requested appointment slot conflicts with an existing booking or buffer window.');
        err.code = 'SLOT_ALREADY_RESERVED';
        err.status = 409;
        throw err;
      }
    }

    return true;
  },

  /**
   * Atomically claims a slot reservation in RTDB under slotReservations/${psychologistId}/${slotKey}.
   * Scoped to the psychologist to protect against both exact-slot and overlapping interval races.
   * Includes crash recovery leasing via expiresAt.
   */
  reserveSlotAtomically: async (psychologistId, startTime, endTime, bookingContext = {}) => {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    if (isNaN(startMs) || isNaN(endMs) || startMs >= endMs) {
      const err = new Error('Invalid appointment time boundaries.');
      err.code = 'INVALID_TIME_INTERVAL';
      err.status = 400;
      throw err;
    }

    const slotKey = getCanonicalSlotKey(startTime);
    const psychReservationsPath = `slotReservations/${psychologistId}`;

    // Transaction scoped to psychologist reservations: serializes all reservations for this clinician
    const result = await firebaseRtdbAdapter.runTransaction(psychReservationsPath, async (currentMap) => {
      const reservations = currentMap || {};
      const nowMs = Date.now();

      // Check conflict with existing active appointments in database
      await schedulingService.assertNoConflicts(
        psychologistId,
        startTime,
        endTime,
        bookingContext.excludeAppointmentId || null
      );

      const avail = await schedulingService.getAvailability(psychologistId);
      const bufferMs = (avail.bufferTimeMinutes || 10) * 60 * 1000;

      // Check conflict with any active reservation in the map across the entire interval
      for (const [key, resv] of Object.entries(reservations)) {
        if (!resv || typeof resv !== 'object') continue;
        if (bookingContext.excludeAppointmentId && resv.appointmentId === bookingContext.excludeAppointmentId) continue;

        // Check if reservation is active
        const isActive = resv.status === 'reserved' || resv.status === 'confirmed';
        if (!isActive) continue;

        // Crash recovery: check expiration of unconfirmed reservation (lease expired)
        const isExpired = resv.status === 'reserved' && resv.expiresAt && new Date(resv.expiresAt).getTime() < nowMs;
        if (isExpired) {
          const apt = resv.appointmentId ? await firebaseRtdbAdapter.get(`appointments/${resv.appointmentId}`) : null;
          if (!apt) {
            // Unpersisted expired reservation from crashed process: mark expired and allow reclaiming
            resv.status = 'expired';
            continue;
          }
        }

        const resvStart = new Date(resv.startTime).getTime();
        const resvEnd = new Date(resv.endTime).getTime();

        // Check interval overlap including buffer
        if (startMs < resvEnd + bufferMs && endMs + bufferMs > resvStart) {
          // Idempotency check: same patient with same idempotency key or same appointmentId
          const isSamePatient = resv.patientId === bookingContext.patientId;
          const isSameIdempotency = Boolean(
            bookingContext.idempotencyKey &&
            resv.idempotencyKey &&
            resv.idempotencyKey === bookingContext.idempotencyKey
          );
          const isSameAppointment = Boolean(
            bookingContext.appointmentId &&
            resv.appointmentId &&
            resv.appointmentId === bookingContext.appointmentId
          );

          if (isSamePatient && (isSameIdempotency || isSameAppointment)) {
            return reservations;
          }

          const err = new Error('The requested appointment slot conflicts with an existing booking or buffer window.');
          err.code = 'SLOT_ALREADY_RESERVED';
          err.status = 409;
          throw err;
        }
      }

      // Add the new reservation with a 10-minute crash recovery lease
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(nowMs + 10 * 60 * 1000).toISOString();

      reservations[slotKey] = {
        slotKey,
        psychologistId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        patientId: bookingContext.patientId || null,
        appointmentId: bookingContext.appointmentId || null,
        idempotencyKey: bookingContext.idempotencyKey || null,
        status: 'reserved',
        createdAt,
        expiresAt,
      };

      return reservations;
    });

    return result.snapshot?.[slotKey];
  },

  /**
   * Releases an active slot reservation safely, guarding against releasing unrelated appointments.
   */
  releaseSlotReservation: async (psychologistId, startTime, appointmentId = null) => {
    if (!startTime) return false;
    let slotKey;
    try {
      slotKey = getCanonicalSlotKey(startTime);
    } catch {
      return false;
    }

    const psychReservationsPath = `slotReservations/${psychologistId}`;

    await firebaseRtdbAdapter.runTransaction(psychReservationsPath, async (currentMap) => {
      const reservations = currentMap || {};
      const current = reservations[slotKey];
      if (!current) {
        return reservations;
      }

      // Guard: do not release if reservation belongs to a different appointment
      if (appointmentId && current.appointmentId && current.appointmentId !== appointmentId) {
        logger.warn(`Slot reservation release mismatch: requested apt ${appointmentId} does not match reservation apt ${current.appointmentId}`);
        return reservations;
      }

      reservations[slotKey] = {
        ...current,
        status: 'released',
        releasedAt: new Date().toISOString(),
      };
      return reservations;
    });

    return true;
  },

  /**
   * Atomically acquires a new slot reservation and releases the old slot reservation.
   * If acquiring the new slot fails, the old reservation is untouched.
   */
  rescheduleSlotAtomically: async (psychologistId, oldStartTime, newStartTime, newEndTime, bookingContext = {}) => {
    // 1. Atomically claim new slot first
    const newReservation = await schedulingService.reserveSlotAtomically(
      psychologistId,
      newStartTime,
      newEndTime,
      {
        ...bookingContext,
        excludeAppointmentId: bookingContext.appointmentId,
      }
    );

    // 2. Safely release old slot reservation
    try {
      await schedulingService.releaseSlotReservation(psychologistId, oldStartTime, bookingContext.appointmentId);
    } catch (releaseErr) {
      logger.warn(`Could not release old slot reservation for appointment ${bookingContext.appointmentId}: ${releaseErr.message}`);
    }

    return newReservation;
  },

  /**
   * Cryptographically generates a secure, human-readable 6-digit session PIN
   */
  generateSessionPin: () => {
    return String(crypto.randomInt(100000, 999999));
  },
};
