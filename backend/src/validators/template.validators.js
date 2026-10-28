import { z } from 'zod';

export const customQuestionSchema = z.object({
  id: z.string().trim().min(1),
  prompt: z.string().trim().min(3, 'Question prompt must have at least 3 characters').max(300),
  type: z.enum(['text', 'textarea', 'select', 'multiselect', 'boolean', 'scale']),
  options: z.array(z.string().trim()).optional(),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
});

export const intakeTemplateSchema = {
  body: z.object({
    title: z.string().trim().min(2, 'Template title is required').max(100),
    description: z.string().trim().max(500).optional(),
    customQuestions: z.array(customQuestionSchema).max(30, 'Maximum 30 custom questions allowed'),
    isActive: z.boolean().default(true),
  }),
};
