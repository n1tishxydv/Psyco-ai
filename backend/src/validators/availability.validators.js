import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format

const timeSlotSchema = z.object({
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format (e.g. 09:00)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format (e.g. 17:00)'),
  mode: z.enum(['in_person', 'online', 'both']).default('both'),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'Start time must precede end time' }
);

const singleDayObjectSchema = z.object({
  enabled: z.boolean().default(true),
  startTime: z.string().regex(timeRegex).optional().default('09:00'),
  endTime: z.string().regex(timeRegex).optional().default('17:00'),
  mode: z.enum(['in_person', 'online', 'both']).default('both'),
});

const dayScheduleUnion = z.union([
  z.array(timeSlotSchema),
  singleDayObjectSchema,
]).default([]);

export const updateWorkingHoursSchema = {
  body: z.object({
    weeklySchedule: z.object({
      monday: dayScheduleUnion.optional(),
      tuesday: dayScheduleUnion.optional(),
      wednesday: dayScheduleUnion.optional(),
      thursday: dayScheduleUnion.optional(),
      friday: dayScheduleUnion.optional(),
      saturday: dayScheduleUnion.optional(),
      sunday: dayScheduleUnion.optional(),
    }).optional(),
    sessionDurationMinutes: z.enum([30, 45, 50, 60, 90]).or(z.number().int().min(15).max(180)).optional().default(50),
    bufferTimeMinutes: z.number().int().min(0).max(60).optional(),
    bufferMinutes: z.number().int().min(0).max(60).optional(),
    bookingWindow: z.object({
      minNoticeHours: z.number().int().min(0).max(168).default(2),
      maxAdvanceDays: z.number().int().min(1).max(365).default(60),
    }).optional(),
    minNoticeHours: z.number().int().min(0).max(168).optional(),
    maxAdvanceDays: z.number().int().min(1).max(365).optional(),
    cancellationPolicy: z.object({
      cutoffHours: z.number().int().min(0).max(72).default(24),
    }).optional(),
    cancellationCutoffHours: z.number().int().min(0).max(72).optional(),
    timezone: z.string().default('Asia/Kolkata'),
    offeredModes: z.enum(['in_person', 'online', 'both']).optional().default('both'),
    defaultMode: z.enum(['in_person', 'online']).optional().default('in_person'),
  }),
};

export const addBlockedDateSchema = {
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    startTime: z.string().regex(timeRegex, 'Start time must be HH:MM').optional(),
    endTime: z.string().regex(timeRegex, 'End time must be HH:MM').optional(),
    isFullDay: z.boolean().default(true),
    reason: z.string().trim().max(200).optional().default('Unavailable'),
  }).refine(
    (data) => {
      if (!data.isFullDay && data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    { message: 'Start time must precede end time for partial day blocks' }
  ),
};

export const addLeavePeriodSchema = {
  body: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    reason: z.string().trim().max(200).optional().default('Clinical Leave'),
  }).refine(
    (data) => data.startDate <= data.endDate,
    { message: 'Start date must precede or equal end date' }
  ),
};
