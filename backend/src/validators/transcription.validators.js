import { z } from 'zod';

export const requestTokenSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    sampleRate: z.number().int().positive().optional().default(16000),
  }),
};

export const consentRecordSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    patientId: z.string().min(1, 'Patient ID is required'),
    consentType: z.enum(['in_person_ambient', 'online_google_meet', 'manual_import']).default('in_person_ambient'),
    confirmed: z.literal(true, {
      errorMap: () => ({ message: 'Explicit confirmation of patient consent is required' }),
    }),
    patientInformed: z.boolean().default(true),
    zeroAudioRetentionAcknowledged: z.boolean().default(true),
    notes: z.string().max(1000).optional(),
  }),
};

export const consentWithdrawalSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    reason: z.string().min(3, 'A clear withdrawal reason must be provided').max(500),
  }),
};

export const saveTranscriptTurnSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    transcriptId: z.string().min(1, 'Transcript ID is required'),
    turnOrder: z.number().int().nonnegative(),
    transcript: z.string().min(1, 'Transcript turn text cannot be empty'),
    speaker: z.string().max(100).optional().default('Speaker 1'),
    endOfTurn: z.boolean().default(true),
    audioStart: z.number().nonnegative().optional(),
    audioEnd: z.number().nonnegative().optional(),
    words: z
      .array(
        z.object({
          text: z.string(),
          start: z.number().optional(),
          end: z.number().optional(),
          confidence: z.number().optional(),
        })
      )
      .optional(),
  }),
};

export const finalizeTranscriptSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    transcriptId: z.string().min(1, 'Transcript ID is required'),
    completeness: z.enum(['completed', 'partial', 'interrupted']).default('completed'),
    interruptionReason: z.string().max(500).optional(),
  }),
};

export const meetImportSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    meetingCode: z.string().max(50).optional(),
    conferenceRecordId: z.string().max(100).optional(),
  }),
};

export const manualImportSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    text: z.string().min(5, 'Transcript text must be at least 5 characters').max(200000, 'Transcript text exceeds maximum limit (200k chars)'),
    source: z.string().max(100).optional().default('manual_import'),
    notes: z.string().max(1000).optional(),
  }),
};

export const correctEntrySchema = {
  body: z.object({
    text: z.string().min(1, 'Corrected text cannot be empty'),
    speaker: z.string().max(100).optional(),
    startTime: z.union([z.string(), z.number()]).optional(),
    endTime: z.union([z.string(), z.number()]).optional(),
    reason: z.string().min(3, 'A clinical justification or correction reason is required').max(500),
  }),
};

export const updateReviewStatusSchema = {
  body: z.object({
    reviewStatus: z.enum(['pending_review', 'in_review', 'reviewed']),
  }),
};
