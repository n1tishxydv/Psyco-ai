/**
 * PSYCO AI — AVAILABILITY NORMALIZATION UTILITY
 * Canonical Availability Schema:
 *   weeklySchedule: {
 *     monday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
 *     ...
 *   },
 *   sessionDurationMinutes: 50,
 *   bufferTimeMinutes: 10,
 *   bookingWindow: { minNoticeHours: 2, maxAdvanceDays: 60 },
 *   cancellationPolicy: { cutoffHours: 24 },
 *   reschedulingPolicy: { cutoffHours: 24 }
 */

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/**
 * Normalizes a single schedule period into the canonical representation:
 * { startTime: 'HH:MM', endTime: 'HH:MM', mode: 'in_person' | 'online' | 'both' }
 *
 * Rejects missing or invalid times with a controlled Error(code, status=400).
 */
export function normalizeSchedulePeriod(period) {
  if (!period || typeof period !== 'object' || Array.isArray(period)) {
    const err = new Error('Schedule period must be a non-empty object.');
    err.code = 'INVALID_SCHEDULE_PERIOD';
    err.status = 400;
    throw err;
  }

  // Support canonical startTime/endTime and legacy start/end
  const rawStart = period.startTime !== undefined ? period.startTime : period.start;
  const rawEnd = period.endTime !== undefined ? period.endTime : period.end;

  if (rawStart === undefined || rawStart === null || rawStart === '') {
    const err = new Error('Missing schedule start time.');
    err.code = 'MISSING_START_TIME';
    err.status = 400;
    throw err;
  }

  if (rawEnd === undefined || rawEnd === null || rawEnd === '') {
    const err = new Error('Missing schedule end time.');
    err.code = 'MISSING_END_TIME';
    err.status = 400;
    throw err;
  }

  if (typeof rawStart !== 'string' || typeof rawEnd !== 'string') {
    const err = new Error('Schedule start and end times must be strings in HH:MM format.');
    err.code = 'INVALID_TIME_FORMAT';
    err.status = 400;
    throw err;
  }

  const startTime = rawStart.trim();
  const endTime = rawEnd.trim();

  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    const err = new Error('Schedule start and end times must be in valid HH:MM 24-hour format (e.g. 09:00).');
    err.code = 'INVALID_TIME_FORMAT';
    err.status = 400;
    throw err;
  }

  if (startTime === endTime) {
    const err = new Error('Schedule start time cannot equal end time.');
    err.code = 'START_TIME_EQUALS_END_TIME';
    err.status = 400;
    throw err;
  }

  if (startTime > endTime) {
    const err = new Error('Schedule start time must precede end time.');
    err.code = 'START_TIME_AFTER_END_TIME';
    err.status = 400;
    throw err;
  }

  const allowedModes = ['in_person', 'online', 'both'];
  const mode = allowedModes.includes(period.mode) ? period.mode : 'both';

  return {
    startTime,
    endTime,
    mode,
  };
}

/**
 * Normalizes an entire weekly schedule.
 * Accepts arrays of periods, single day objects { enabled, startTime, endTime, mode } / { enabled, start, end },
 * or legacy records. Returns canonical weekly schedule.
 */
export function normalizeWeeklySchedule(rawSchedule) {
  if (!rawSchedule || typeof rawSchedule !== 'object' || Array.isArray(rawSchedule)) {
    return {};
  }

  const normalized = {};

  for (const day of DAYS_OF_WEEK) {
    const dayVal = rawSchedule[day];

    if (!dayVal) {
      normalized[day] = [];
      continue;
    }

    if (Array.isArray(dayVal)) {
      normalized[day] = dayVal.map((p) => normalizeSchedulePeriod(p));
    } else if (typeof dayVal === 'object') {
      if (dayVal.enabled === false) {
        normalized[day] = [];
      } else {
        const s = dayVal.startTime !== undefined ? dayVal.startTime : dayVal.start;
        const e = dayVal.endTime !== undefined ? dayVal.endTime : dayVal.end;
        if (!s && !e) {
          normalized[day] = [];
        } else {
          normalized[day] = [normalizeSchedulePeriod(dayVal)];
        }
      }
    } else {
      normalized[day] = [];
    }
  }

  return normalized;
}

/**
 * Normalizes full availability object from database or request body,
 * mapping legacy field names to canonical schema.
 */
export function normalizeAvailability(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;

  const result = { ...raw };

  // 1. Normalize weeklySchedule
  if (result.weeklySchedule) {
    result.weeklySchedule = normalizeWeeklySchedule(result.weeklySchedule);
  }

  // 2. Normalize bufferTimeMinutes (legacy: bufferMinutes)
  if (result.bufferTimeMinutes === undefined && result.bufferMinutes !== undefined) {
    result.bufferTimeMinutes = result.bufferMinutes;
  }

  // 3. Normalize sessionDurationMinutes (legacy: sessionDuration)
  if (result.sessionDurationMinutes === undefined && result.sessionDuration !== undefined) {
    result.sessionDurationMinutes = result.sessionDuration;
  }

  // 4. Normalize bookingWindow (legacy: bookingLeadTimeHours, maxAdvanceBookingDays, minNoticeHours, maxAdvanceDays)
  if (!result.bookingWindow || typeof result.bookingWindow !== 'object' || Array.isArray(result.bookingWindow)) {
    result.bookingWindow = {};
  } else {
    result.bookingWindow = { ...result.bookingWindow };
  }

  if (result.bookingWindow.minNoticeHours === undefined) {
    if (result.minNoticeHours !== undefined) {
      result.bookingWindow.minNoticeHours = result.minNoticeHours;
    } else if (result.bookingLeadTimeHours !== undefined) {
      result.bookingWindow.minNoticeHours = result.bookingLeadTimeHours;
    } else {
      result.bookingWindow.minNoticeHours = 2;
    }
  }

  if (result.bookingWindow.maxAdvanceDays === undefined) {
    if (result.maxAdvanceDays !== undefined) {
      result.bookingWindow.maxAdvanceDays = result.maxAdvanceDays;
    } else if (result.maxAdvanceBookingDays !== undefined) {
      result.bookingWindow.maxAdvanceDays = result.maxAdvanceBookingDays;
    } else {
      result.bookingWindow.maxAdvanceDays = 60;
    }
  }

  // 5. Normalize cancellationPolicy (legacy: cancellationCutoffHours)
  if (!result.cancellationPolicy || typeof result.cancellationPolicy !== 'object' || Array.isArray(result.cancellationPolicy)) {
    result.cancellationPolicy = {};
  } else {
    result.cancellationPolicy = { ...result.cancellationPolicy };
  }

  if (result.cancellationPolicy.cutoffHours === undefined) {
    if (result.cancellationCutoffHours !== undefined) {
      result.cancellationPolicy.cutoffHours = result.cancellationCutoffHours;
    } else {
      result.cancellationPolicy.cutoffHours = 24;
    }
  }

  // 6. Normalize reschedulingPolicy (legacy: reschedulingCutoffHours)
  if (!result.reschedulingPolicy || typeof result.reschedulingPolicy !== 'object' || Array.isArray(result.reschedulingPolicy)) {
    result.reschedulingPolicy = {};
  } else {
    result.reschedulingPolicy = { ...result.reschedulingPolicy };
  }

  if (result.reschedulingPolicy.cutoffHours === undefined) {
    if (result.reschedulingCutoffHours !== undefined) {
      result.reschedulingPolicy.cutoffHours = result.reschedulingCutoffHours;
    } else {
      result.reschedulingPolicy.cutoffHours = 24;
    }
  }

  return result;
}
