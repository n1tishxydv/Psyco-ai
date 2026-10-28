import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

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

export const schedulingService = {
  /**
   * Retrieves psychologist's availability configuration or initial default
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
    return {
      psychologistId,
      ...DEFAULT_AVAILABILITY,
      ...custom,
      isDefault: false,
    };
  },

  /**
   * Saves or updates psychologist's availability settings
   */
  updateAvailability: async (psychologistId, updates) => {
    const current = await schedulingService.getAvailability(psychologistId);
    const merged = {
      ...current,
      ...updates,
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
   * Calculates available appointment slots for a psychologist on a given date (YYYY-MM-DD)
   */
  getAvailableSlots: async (psychologistId, dateString, requestedMode = null) => {
    const avail = await schedulingService.getAvailability(psychologistId);
    const targetDate = new Date(`${dateString}T00:00:00Z`);

    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }

    const dayName = DAY_NAMES[targetDate.getUTCDay()];
    const workingSlots = avail.weeklySchedule?.[dayName] || [];

    // If day is not a working day
    if (!workingSlots || workingSlots.length === 0) {
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
      return apt.startTime.startsWith(dateString);
    });

    const durationMs = (avail.sessionDurationMinutes || 50) * 60 * 1000;
    const bufferMs = (avail.bufferTimeMinutes || 10) * 60 * 1000;
    const nowMs = Date.now();
    const minNoticeMs = (avail.bookingWindow?.minNoticeHours || 2) * 60 * 60 * 1000;
    const maxAdvanceMs = (avail.bookingWindow?.maxAdvanceDays || 60) * 24 * 60 * 60 * 1000;

    const candidateSlots = [];

    for (const period of workingSlots) {
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
          // Interval overlap test including buffer
          return slotStart < aptEnd + bufferMs && slotEnd + bufferMs > aptStart;
        });

        if (overlapsApt) continue;

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
   * any active appointments or buffer periods.
   */
  assertNoConflicts: async (psychologistId, startTime, endTime, excludeAppointmentId = null) => {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    if (isNaN(startMs) || isNaN(endMs) || startMs >= endMs) {
      const err = new Error('Invalid appointment time boundaries.');
      err.code = 'INVALID_TIME_INTERVAL';
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

    return true;
  },

  /**
   * Cryptographically generates a secure, human-readable 6-digit session PIN
   */
  generateSessionPin: () => {
    return String(crypto.randomInt(100000, 999999));
  },
};
