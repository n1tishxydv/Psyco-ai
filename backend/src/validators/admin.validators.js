import { z } from 'zod';

export const psychologistApprovalSchema = {
  body: z.object({
    approved: z.boolean(),
    reason: z.string().trim().max(300).optional().default(''),
  }),
};

export const updateUserStatusSchema = {
  body: z.object({
    status: z.enum(['active', 'pending_verification', 'suspended']),
    reason: z.string().trim().min(3).max(300),
  }),
};

export const publishFaqSchema = {
  body: z.object({
    question: z.string().trim().min(5).max(300),
    answer: z.string().trim().min(10).max(3000),
    category: z.string().trim().min(2).max(50).default('General Practice'),
    order: z.number().int().default(1),
    published: z.boolean().default(true),
  }),
};

export const updateContactStatusSchema = {
  body: z.object({
    status: z.enum(['new', 'in_review', 'responded', 'closed', 'spam']),
    adminNotes: z.string().trim().max(1000).optional().default(''),
  }),
};
