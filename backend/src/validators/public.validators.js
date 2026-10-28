import { z } from 'zod';

export const contactSubmissionSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    email: z.string().trim().email('A valid email address is required').max(150, 'Email cannot exceed 150 characters'),
    subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150, 'Subject cannot exceed 150 characters'),
    message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message cannot exceed 2000 characters'),
    // Honeypot field: allowed in body so controller can detect and drop bots silently
    hp_website: z.string().optional(),
  }),
};

export const faqSubmissionSchema = {
  body: z.object({
    question: z.string().trim().min(8, 'Question must be at least 8 characters').max(500, 'Question cannot exceed 500 characters'),
    name: z.string().trim().max(100).optional().or(z.literal('')),
    email: z.string().trim().email('Valid email format required').max(150).optional().or(z.literal('')),
    // Honeypot field
    hp_website: z.string().optional(),
  }),
};
