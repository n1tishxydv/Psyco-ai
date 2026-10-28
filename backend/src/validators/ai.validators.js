import { z } from 'zod';

export const AI_JOB_TYPES = [
  'GENERATE_SESSION_SUMMARY',
  'GENERATE_SOAP',
  'GENERATE_DAP',
  'GENERATE_BIRP',
  'GENERATE_TREATMENT_PLAN_DRAFT',
  'GENERATE_HOMEWORK_SUGGESTIONS',
  'GENERATE_FOLLOW_UP_SUGGESTIONS',
  'CHECK_DOCUMENTATION_COMPLETENESS',
];

export const AI_JOB_TYPE_ENUM = {
  GENERATE_SESSION_SUMMARY: 'GENERATE_SESSION_SUMMARY',
  GENERATE_SOAP: 'GENERATE_SOAP',
  GENERATE_DAP: 'GENERATE_DAP',
  GENERATE_BIRP: 'GENERATE_BIRP',
  GENERATE_TREATMENT_PLAN_DRAFT: 'GENERATE_TREATMENT_PLAN_DRAFT',
  GENERATE_HOMEWORK_SUGGESTIONS: 'GENERATE_HOMEWORK_SUGGESTIONS',
  GENERATE_FOLLOW_UP_SUGGESTIONS: 'GENERATE_FOLLOW_UP_SUGGESTIONS',
  CHECK_DOCUMENTATION_COMPLETENESS: 'CHECK_DOCUMENTATION_COMPLETENESS',
};

// Input Request Validation Schemas
export const createJobSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  jobType: z.enum(AI_JOB_TYPES, {
    errorMap: () => ({ message: `jobType must be one of: ${AI_JOB_TYPES.join(', ')}` }),
  }),
  format: z.string().optional(),
  idempotencyKey: z.string().optional(),
  notes: z.string().optional(),
});

export const updateDraftSchema = z.object({
  content: z.record(z.any()).optional(),
  missingInformation: z.array(z.string()).optional(),
});

export const approveDraftSchema = z.object({
  finalizeImmediately: z.boolean().optional(),
  sharedWithPatient: z.boolean().optional(),
  patientVisibleSummary: z.string().optional(),
  selectedIndices: z.array(z.number()).optional(),
});

// Output Validation Schemas
export const sessionSummarySchema = z.object({
  title: z.string().optional(),
  presentingConcerns: z.array(z.string()).optional().default([]),
  mainTopicsDiscussed: z.array(z.string()).optional().default([]),
  patientReportedSymptoms: z.array(z.string()).optional().default([]),
  clinicalObservations: z.array(z.string()).optional().default([]),
  interventionsDocumented: z.array(z.string()).optional().default([]),
  patientResponse: z.string().optional().default(''),
  progressNotes: z.string().optional().default(''),
  riskAssessmentNotes: z.string().optional().default(''),
  followUpPlan: z.array(z.string()).optional().default([]),
  missingInformation: z.array(z.string()).optional().default([]),
});

export const soapNoteSchema = z.object({
  subjective: z.string().min(1),
  objective: z.string().min(1),
  assessment: z.string().min(1),
  plan: z.string().min(1),
  evidenceReferences: z.array(z.any()).optional().default([]),
  missingInformation: z.array(z.string()).optional().default([]),
});

export const dapNoteSchema = z.object({
  data: z.string().min(1),
  assessment: z.string().min(1),
  plan: z.string().min(1),
  evidenceReferences: z.array(z.any()).optional().default([]),
  missingInformation: z.array(z.string()).optional().default([]),
});

export const birpNoteSchema = z.object({
  behavior: z.string().min(1),
  intervention: z.string().min(1),
  response: z.string().min(1),
  plan: z.string().min(1),
  evidenceReferences: z.array(z.any()).optional().default([]),
  missingInformation: z.array(z.string()).optional().default([]),
});

export const treatmentPlanDraftSchema = z.object({
  title: z.string().min(1),
  presentingProblem: z.string().min(1),
  patientStatedGoals: z.array(z.string()).optional().default([]),
  proposedLongTermGoals: z.array(z.string()).optional().default([]),
  shortTermObjectives: z.array(z.any()).optional().default([]),
  proposedInterventions: z.array(z.string()).optional().default([]),
  suggestedReviewFrequencyWeeks: z.number().optional().default(4),
  progressEvaluationCriteria: z.string().optional().default(''),
  missingInformation: z.array(z.string()).optional().default([]),
});

export const homeworkSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      therapeuticRationale: z.string().optional().default(''),
      suggestedFrequency: z.string().optional().default(''),
      dueDateDays: z.number().optional().default(7),
    })
  ),
  clinicianReviewNotes: z.string().optional().default(''),
});

export const followUpSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      category: z.string().optional().default('follow_up'),
      description: z.string(),
      priority: z.string().optional().default('routine'),
      suggestedTimeframe: z.string().optional().default(''),
    })
  ),
  clinicianReviewNotes: z.string().optional().default(''),
});

export const completenessCheckSchema = z.object({
  overallCompletenessScore: z.number().min(0).max(100),
  status: z.string(),
  findings: z.array(
    z.object({
      domain: z.string(),
      severity: z.string(),
      finding: z.string(),
      recommendation: z.string(),
    })
  ),
  missingExpectedElements: z.array(z.string()).optional().default([]),
  disclaimer: z.string().optional(),
});

/**
 * Validates AI output object against the schema corresponding to jobType
 */
export function validateAiOutput(jobType, output) {
  if (!output || typeof output !== 'object') {
    throw new Error('AI output must be a valid non-empty object.');
  }

  switch (jobType) {
    case 'GENERATE_SESSION_SUMMARY':
      return sessionSummarySchema.parse(output);
    case 'GENERATE_SOAP':
      return soapNoteSchema.parse(output);
    case 'GENERATE_DAP':
      return dapNoteSchema.parse(output);
    case 'GENERATE_BIRP':
      return birpNoteSchema.parse(output);
    case 'GENERATE_TREATMENT_PLAN_DRAFT':
      return treatmentPlanDraftSchema.parse(output);
    case 'GENERATE_HOMEWORK_SUGGESTIONS':
      return homeworkSuggestionsSchema.parse(output);
    case 'GENERATE_FOLLOW_UP_SUGGESTIONS':
      return followUpSuggestionsSchema.parse(output);
    case 'CHECK_DOCUMENTATION_COMPLETENESS':
      return completenessCheckSchema.parse(output);
    default:
      throw new Error(`Unknown jobType: ${jobType}`);
  }
}
