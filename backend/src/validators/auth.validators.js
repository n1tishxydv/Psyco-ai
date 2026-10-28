import { z } from 'zod';

export const registerPatientSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full name must have at least 2 characters').max(100),
    email: z.string().email('Valid email address is required'),
    gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']),
    age: z.number().int().min(10, 'Age must be at least 10').max(120, 'Invalid age'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
};

export const registerPsychologistSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full name must have at least 2 characters').max(100),
    email: z.string().email('Valid email address is required'),
    licenseNumber: z.string().min(3, 'License number is required'),
    specializations: z.array(z.string()).min(1, 'At least one specialization is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    consultationModes: z.object({
      inPerson: z.boolean().default(true),
      online: z.boolean().default(true),
    }).default({ inPerson: true, online: true }),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(1, 'Password is required'),
  }),
};
