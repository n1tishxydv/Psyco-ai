import { z } from 'zod';

export const patientOnboardingSchema = {
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must have at least 2 characters').max(100),
    gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say'], {
      errorMap: () => ({ message: 'Gender selection is required' }),
    }),
    age: z.number().int().min(10, 'Age must be at least 10').max(120, 'Invalid age'),
    phone: z.string().trim().max(20).optional().or(z.literal('')),
    preferredName: z.string().trim().max(100).optional().or(z.literal('')),
    timezone: z.string().default('Asia/Kolkata'),
  }),
};

export const psychologistOnboardingSchema = {
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must have at least 2 characters').max(100),
    licenseNumber: z.string().trim().min(2, 'Clinical license number is required').max(50).optional().or(z.literal('')).default('LIC-PENDING'),
    bio: z.string().trim().max(2000).optional().or(z.literal('')).default('Licensed clinical psychologist providing mental health care and therapy.'),
    specializations: z.array(z.string().trim().min(1)).min(1, 'At least one specialization is required'),
    qualifications: z.array(z.string().trim()).default([]),
    languages: z.array(z.string().trim()).default(['English']),
    offeredModes: z.enum(['in_person', 'online', 'both']).default('both'),
    defaultMode: z.enum(['in_person', 'online']).default('in_person'),
    timezone: z.string().default('Asia/Kolkata'),
  }),
};

export const updatePatientProfileSchema = {
  body: z.object({
    phone: z.string().trim().max(20).optional(),
    preferredName: z.string().trim().max(100).optional(),
    timezone: z.string().max(50).optional(),
    emergencyContact: z.object({
      name: z.string().trim().max(100),
      relationship: z.string().trim().max(50),
      phone: z.string().trim().max(20),
    }).optional(),
  }),
};

export const updatePsychologistProfileSchema = {
  body: z.object({
    bio: z.string().trim().max(2000).optional().or(z.literal('')),
    specializations: z.array(z.string().trim()).min(1).optional(),
    qualifications: z.array(z.string().trim()).optional(),
    languages: z.array(z.string().trim()).optional(),
    offeredModes: z.enum(['in_person', 'online', 'both']).optional(),
    defaultMode: z.enum(['in_person', 'online']).optional(),
    timezone: z.string().max(50).optional(),
    clinicAddress: z.object({
      line1: z.string().trim().max(150).optional().or(z.literal('')),
      city: z.string().trim().max(50).optional().or(z.literal('')),
      state: z.string().trim().max(50).optional().or(z.literal('')),
      postalCode: z.string().trim().max(20).optional().or(z.literal('')),
    }).optional().nullable(),
  }),
};

export const updatePreferencesSchema = {
  body: z.object({
    theme: z.enum(['dark', 'light']).default('dark'),
    language: z.string().default('en'),
    timezone: z.string().default('Asia/Kolkata'),
    emailNotifications: z.boolean().default(true),
  }),
};

export const accountDeletionSchema = {
  body: z.object({
    confirmation: z.literal('DELETE_MY_ACCOUNT', {
      errorMap: () => ({ message: 'You must confirm by typing DELETE_MY_ACCOUNT exactly.' }),
    }),
    reason: z.string().trim().max(500).optional(),
  }),
};
