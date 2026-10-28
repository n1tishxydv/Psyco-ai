import { z } from 'zod';

export const createAppointmentSchema = {
  body: z.object({
    psychologistId: z.string().min(1, 'Psychologist ID is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    date: z.string().optional(),
    sessionMode: z.enum(['in_person', 'online']).optional(),
    mode: z.enum(['in_person', 'online']).optional(),
    reason: z.string().trim().max(500, 'Reason must not exceed 500 characters').optional().or(z.literal('')),
    patientNotes: z.string().trim().max(500).optional(),
  }),
};

export const rejectAppointmentSchema = {
  body: z.object({
    reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters').max(300),
  }),
};

export const proposeAlternativeSlotSchema = {
  body: z.object({
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    date: z.string().optional(),
    sessionMode: z.enum(['in_person', 'online']).optional(),
    mode: z.enum(['in_person', 'online']).optional(),
    note: z.string().trim().max(300).optional(),
    reason: z.string().trim().max(300).optional(),
  }),
};

export const respondToAlternativeSchema = {
  body: z.object({
    action: z.enum(['accept', 'decline']),
  }),
};

export const rescheduleAppointmentSchema = {
  body: z.object({
    newStartTime: z.string().optional(),
    newEndTime: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    date: z.string().optional(),
    reason: z.string().trim().max(300).optional(),
  }),
};

export const cancelAppointmentSchema = {
  body: z.object({
    reason: z.string().trim().min(3, 'Cancellation reason must be at least 3 characters').max(300),
  }),
};
