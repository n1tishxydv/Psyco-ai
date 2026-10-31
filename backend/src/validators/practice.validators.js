import { z } from 'zod';

export const updatePracticeSettingsSchema = {
  body: z.object({
    practiceName: z.string().trim().min(2).max(150).optional(),
    professionalBio: z.string().trim().max(3000).optional().or(z.literal('')),
    contactPhone: z.string().trim().max(30).optional().or(z.literal('')),
    contactEmail: z.string().trim().email().optional().or(z.literal('')),
    timezone: z.string().trim().max(50).optional(),
    offeredModes: z.enum(['in_person', 'online', 'both']).optional(),
    defaultMode: z.enum(['in_person', 'online']).optional(),
    practiceArrangement: z.enum(['independent', 'clinic_affiliated', 'hybrid']).optional(),
    appointmentDurationMinutes: z.number().int().min(15).max(180).optional(),
    bufferTimeMinutes: z.number().int().min(0).max(60).optional(),
    cancellationCutoffHours: z.number().int().min(0).max(72).optional(),
    setupCompleted: z.boolean().optional(),
  }),
};

export const addLocationSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    address: z.object({
      line1: z.string().trim().min(3).max(150),
      city: z.string().trim().min(2).max(50),
      state: z.string().trim().min(2).max(50),
      postalCode: z.string().trim().min(3).max(20),
    }),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    instructions: z.string().trim().max(500).optional(),
  }),
};

export const requestAffiliationSchema = {
  body: z.object({
    clinicId: z.string().trim().min(3),
    note: z.string().trim().max(500).optional(),
  }),
};

export const switchContextSchema = {
  body: z.object({
    practiceId: z.string().trim().min(3),
  }),
};
