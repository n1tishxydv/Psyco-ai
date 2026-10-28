import { z } from 'zod';

export const sessionNoteSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    patientId: z.string().min(1, 'Patient ID is required'),
    format: z.enum(['GENERAL', 'SOAP', 'DAP', 'BIRP']).default('SOAP'),
    content: z.record(z.string()).default({}),
    sharedWithPatient: z.boolean().default(false),
    patientVisibleSummary: z.string().max(2000).optional().default(''),
  }),
};

export const amendNoteSchema = {
  body: z.object({
    reason: z.string().trim().min(5, 'Amendment reason must be at least 5 characters').max(500),
    amendedContent: z.record(z.string()),
    patientVisibleSummary: z.string().max(2000).optional(),
  }),
};

export const treatmentPlanSchema = {
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    title: z.string().trim().min(3, 'Plan title must be at least 3 characters').max(200),
    presentingProblem: z.string().trim().min(5, 'Presenting problem is required').max(2000),
    diagnosisCodes: z.array(z.string()).default([]),
    clinicalInterventions: z.array(z.string()).default([]),
    reviewFrequencyWeeks: z.number().int().min(1).max(52).default(4),
    sharedWithPatient: z.boolean().default(false),
    goals: z.array(z.object({
      id: z.string().optional(),
      description: z.string().trim().min(3, 'Goal description required'),
      measurableObjective: z.string().trim().optional().default(''),
      startDate: z.string().optional(),
      targetDate: z.string().optional(),
      status: z.enum(['active', 'achieved', 'revised', 'discontinued']).default('active'),
      progressNotes: z.string().optional().default(''),
    })).default([]),
  }),
};

export const goalUpdateSchema = {
  body: z.object({
    status: z.enum(['active', 'achieved', 'revised', 'discontinued']).optional(),
    progressNotes: z.string().optional(),
    measurableObjective: z.string().optional(),
    targetDate: z.string().optional(),
  }),
};

export const followUpTaskSchema = {
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    sessionId: z.string().optional().nullable(),
    treatmentPlanId: z.string().optional().nullable(),
    title: z.string().trim().min(3, 'Task title required').max(200),
    description: z.string().trim().max(1000).optional().default(''),
    assignedDate: z.string().optional(),
    dueDate: z.string().optional(),
    sharedWithPatient: z.boolean().default(true),
  }),
};

export const updateTaskStatusSchema = {
  body: z.object({
    status: z.enum(['assigned', 'in_progress', 'completed', 'archived']),
    patientNotes: z.string().max(500).optional(),
  }),
};

export const clinicalRecommendationSchema = {
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    sessionId: z.string().optional().nullable(),
    category: z.enum(['therapeutic_exercise', 'lifestyle', 'reading', 'referral', 'other']).default('therapeutic_exercise'),
    title: z.string().trim().min(3).max(200),
    details: z.string().trim().max(2000),
    sharedWithPatient: z.boolean().default(true),
  }),
};

export const prescriptionRequestSchema = {
  body: z.object({
    patientId: z.string().min(1),
    medicationName: z.string().min(1),
    dosage: z.string().min(1),
    instructions: z.string().min(1),
  }),
};

export const generateReportSchema = {
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    reportType: z.enum(['session_summary', 'treatment_summary', 'progress_report', 'discharge_summary', 'appointment_history']),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    includeNotes: z.boolean().default(true),
    includeGoals: z.boolean().default(true),
    clinicalSummaryNotes: z.string().max(2000).optional().default(''),
  }),
};
