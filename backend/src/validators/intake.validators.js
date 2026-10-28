import { z } from 'zod';

// Schema for draft intake saving (fields are optional so patients can save progress incrementally)
export const saveDraftIntakeSchema = {
  body: z.object({
    sectionA: z.object({
      occupation: z.string().trim().max(100).optional(),
      maritalStatus: z.string().trim().max(50).optional(),
      emergencyContactName: z.string().trim().max(100).optional(),
      emergencyContactPhone: z.string().trim().max(20).optional(),
      emergencyContactRelationship: z.string().trim().max(50).optional(),
    }).optional(),
    sectionB: z.object({
      primaryReasons: z.array(z.string().trim()).optional(),
      symptomDuration: z.string().trim().max(100).optional(),
      severityRating: z.number().min(1).max(10).optional(),
      therapyGoals: z.string().trim().max(2000).optional(),
    }).optional(),
    sectionC: z.object({
      previousTherapy: z.boolean().optional(),
      previousDiagnoses: z.string().trim().max(1000).optional(),
      currentMedications: z.string().trim().max(1000).optional(),
      familyMentalHealthHistory: z.string().trim().max(1000).optional(),
      medicalConditions: z.string().trim().max(1000).optional(),
    }).optional(),
    sectionD: z.object({
      sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
      exerciseFrequency: z.enum(['sedentary', 'occasional', 'regular', 'daily']).optional(),
      supportSystemRating: z.number().min(1).max(5).optional(),
      substanceUseDetails: z.string().trim().max(1000).optional(),
    }).optional(),
    sectionE: z.object({
      suicidalIdeationPastMonth: z.boolean().optional(),
      selfHarmHistory: z.boolean().optional(),
      immediateRiskAcknowledged: z.boolean().optional(),
      safetyNotes: z.string().trim().max(1000).optional(),
    }).optional(),
    sectionF: z.object({
      consentToTreatment: z.boolean().optional(),
      aiAssistanceAcknowledged: z.boolean().optional(),
      telehealthConsent: z.boolean().optional(),
      privacyNoticeAcknowledged: z.boolean().optional(),
      signatureName: z.string().trim().max(100).optional(),
    }).optional(),
    customResponses: z.record(z.any()).optional(),
  }),
};

// Schema for final intake submission (enforces mandatory consents and essential clinical inputs)
export const submitIntakeSchema = {
  body: z.object({
    sectionA: z.object({
      occupation: z.string().trim().max(100).optional(),
      maritalStatus: z.string().trim().max(50).optional(),
      emergencyContactName: z.string().trim().min(2, 'Emergency contact name is required').max(100),
      emergencyContactPhone: z.string().trim().min(7, 'Emergency contact phone is required').max(20),
      emergencyContactRelationship: z.string().trim().max(50).optional().or(z.literal('')).default('Contact'),
    }),
    sectionB: z.object({
      primaryReasons: z.array(z.string().trim()).min(1, 'Please select at least one primary concern'),
      symptomDuration: z.string().trim().min(1, 'Symptom duration is required'),
      severityRating: z.number().int().min(1).max(10),
      therapyGoals: z.string().trim().max(2000).optional().or(z.literal('')).default('Improve mental health and overall well-being'),
    }),
    sectionC: z.object({
      previousTherapy: z.boolean().default(false),
      previousDiagnoses: z.string().trim().max(1000).optional().or(z.literal('')),
      currentMedications: z.string().trim().max(1000).optional().or(z.literal('')),
      familyMentalHealthHistory: z.string().trim().max(1000).optional().or(z.literal('')),
      medicalConditions: z.string().trim().max(1000).optional().or(z.literal('')),
    }),
    sectionD: z.object({
      sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
      exerciseFrequency: z.enum(['sedentary', 'occasional', 'regular', 'daily']),
      supportSystemRating: z.number().int().min(1).max(5),
      substanceUseDetails: z.string().trim().max(1000).optional().or(z.literal('')),
    }),
    sectionE: z.object({
      suicidalIdeationPastMonth: z.boolean(),
      selfHarmHistory: z.boolean(),
      immediateRiskAcknowledged: z.boolean(),
      safetyNotes: z.string().trim().max(1000).optional().or(z.literal('')),
    }),
    sectionF: z.object({
      consentToTreatment: z.literal(true, {
        errorMap: () => ({ message: 'You must consent to treatment before submitting intake.' }),
      }),
      aiAssistanceAcknowledged: z.literal(true, {
        errorMap: () => ({ message: 'You must acknowledge the AI documentation assistant notice.' }),
      }),
      telehealthConsent: z.literal(true, {
        errorMap: () => ({ message: 'Telehealth and in-person consent is required.' }),
      }),
      privacyNoticeAcknowledged: z.literal(true, {
        errorMap: () => ({ message: 'Privacy policy acknowledgment is required.' }),
      }),
      signatureName: z.string().trim().min(2, 'Legal digital signature name is required').max(100),
    }),
    customResponses: z.record(z.any()).optional(),
  }),
};
