import { z } from 'zod';

export const psychologistApprovalSchema = {
  body: z.object({
    approved: z.boolean().optional(),
    status: z.enum(['approved', 'rejected', 'suspended']).optional(),
    reason: z.string().trim().max(500).optional().default(''),
  }).refine((data) => data.approved !== undefined || data.status !== undefined, {
    message: 'Either approved flag or status must be provided.',
  }),
};

export const updateUserStatusSchema = {
  body: z.object({
    status: z.enum(['active', 'pending_verification', 'suspended', 'disabled']),
    reason: z.string().trim().min(3, 'A reason of at least 3 characters is required for account status changes.').max(500),
  }),
};

export const publishFaqSchema = {
  body: z.object({
    question: z.string().trim().min(5, 'Question must be at least 5 characters.').max(300),
    answer: z.string().trim().min(10, 'Answer must be at least 10 characters.').max(3000),
    category: z.string().trim().min(2).max(50).default('General Practice'),
    order: z.number().int().default(1),
    published: z.boolean().default(true),
  }),
};

export const updateFaqSchema = {
  body: z.object({
    question: z.string().trim().min(5).max(300).optional(),
    answer: z.string().trim().min(10).max(3000).optional(),
    category: z.string().trim().min(2).max(50).optional(),
    order: z.number().int().optional(),
    published: z.boolean().optional(),
  }),
};

export const updateContactStatusSchema = {
  body: z.object({
    status: z.enum(['new', 'in_review', 'responded', 'closed', 'spam']),
    adminNotes: z.string().trim().max(1000).optional().default(''),
  }),
};

export const createClinicSchema = {
  body: z.object({
    name: z.string().trim().min(3, 'Clinic name must be at least 3 characters.').max(150),
    organizationType: z.enum(['hospital', 'private_group', 'wellness_center', 'outpatient_clinic']).default('private_group'),
    primaryContact: z.string().trim().min(2).max(100),
    email: z.string().email(),
    phone: z.string().trim().max(30).optional().default(''),
    address: z.object({
      line1: z.string().trim().max(200).optional().default(''),
      city: z.string().trim().max(100).optional().default(''),
      state: z.string().trim().max(100).optional().default(''),
      postalCode: z.string().trim().max(20).optional().default(''),
    }).optional().default({}),
    description: z.string().trim().max(1000).optional().default(''),
  }),
};

export const updateClinicStatusSchema = {
  body: z.object({
    status: z.enum(['active', 'suspended', 'rejected', 'pending']),
    reason: z.string().trim().min(3, 'A reason of at least 3 characters is required.').max(500),
  }),
};

export const reviewClinicMembershipSchema = {
  body: z.object({
    status: z.enum(['approved', 'rejected', 'revoked', 'pending']),
    reason: z.string().trim().max(500).optional().default(''),
  }),
};

export const updatePracticeStatusSchema = {
  body: z.object({
    status: z.enum(['active', 'suspended', 'pending']),
    reason: z.string().trim().min(3, 'A reason of at least 3 characters is required.').max(500),
  }),
};

export const updateSupportTicketSchema = {
  body: z.object({
    status: z.enum(['new', 'open', 'in_progress', 'waiting_user', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    assignedTo: z.string().trim().max(100).optional().nullable(),
    adminNotes: z.string().trim().max(1000).optional(),
  }),
};

export const addSupportReplySchema = {
  body: z.object({
    message: z.string().trim().min(1, 'Message cannot be empty.').max(3000),
    isInternal: z.boolean().default(false),
  }),
};

export const updatePublicContentSchema = {
  body: z.object({
    title: z.string().trim().max(200).optional(),
    content: z.union([z.string().trim().max(10000), z.record(z.any())]),
  }),
};

export const updatePlatformSettingsSchema = {
  body: z.object({
    platformName: z.string().trim().min(2).max(100).optional(),
    supportEmail: z.string().email().optional(),
    supportPhone: z.string().trim().max(30).optional(),
    defaultTimezone: z.string().trim().max(50).optional(),
    defaultAppointmentDuration: z.number().int().min(15).max(180).optional(),
    defaultBufferTime: z.number().int().min(0).max(60).optional(),
    allowPatientRegistration: z.boolean().optional(),
    allowClinicianRegistration: z.boolean().optional(),
    requireCredentialVerification: z.boolean().optional(),
    maintenanceMode: z.boolean().optional(),
    maintenanceAnnouncement: z.string().trim().max(500).optional(),
  }),
};
