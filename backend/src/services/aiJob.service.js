import crypto from 'crypto';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { geminiAdapter } from '../integrations/gemini/geminiAdapter.js';
import { clinicalService } from './clinical.service.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';
import { validateAiOutput, AI_JOB_TYPES } from '../validators/ai.validators.js';
import { jobQueue } from '../jobs/index.js';

export const aiJobService = {
  // ==========================================
  // 1. SOURCE CONTEXT PREPARATION (MINIMUM CONTEXT PRINCIPLE)
  // ==========================================

  /**
   * Prepares the minimum necessary clinical source context for an AI operation.
   * Enforces privacy and provenance tracking.
   */
  prepareSourceContext: async (psychologistId, sessionId, jobType) => {
    // 1. Verify session exists and belongs to psychologist
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      err.code = 'SESSION_NOT_FOUND';
      throw err;
    }

    // 2. Assert active therapeutic relationship
    await clinicalService.assertTherapeuticRelationship(psychologistId, session.patientId);

    // 3. Retrieve authorized source transcript
    const allTranscripts = (await firebaseRtdbAdapter.get('sessionTranscripts')) || {};
    const transcript = Object.values(allTranscripts).find((t) => t.sessionId === sessionId);

    if (!transcript) {
      const err = new Error('No transcript found for this session. AI documentation requires an existing transcript.');
      err.status = 400;
      err.code = 'TRANSCRIPT_REQUIRED';
      throw err;
    }

    // 4. Retrieve structured transcript entries if present, or fall back to fullText
    const entriesObj = (await firebaseRtdbAdapter.get(`transcriptEntries/${transcript.id}`)) || {};
    const sortedEntries = Object.values(entriesObj).sort((a, b) => a.turnOrder - b.turnOrder);

    let transcriptText = transcript.fullText || '';
    if (sortedEntries.length > 0) {
      transcriptText = sortedEntries.map((e) => `[${e.speaker}]: ${e.text}`).join('\n\n');
    }

    if (!transcriptText || !transcriptText.trim()) {
      const err = new Error('The source transcript is empty. Cannot generate clinical documentation from an empty conversation.');
      err.status = 400;
      err.code = 'EMPTY_TRANSCRIPT';
      throw err;
    }

    // 5. Patient context (minimal: id, gender, age, no sensitive unnecessary contact info)
    const patientRaw = (await firebaseRtdbAdapter.get(`patients/${session.patientId}`)) || {};
    const patientContext = {
      id: session.patientId,
      name: patientRaw.fullName || patientRaw.preferredName || 'Confidential Patient',
      gender: patientRaw.gender || 'unspecified',
      age: patientRaw.age || null,
    };

    // 6. Only include intake presenting problems if relevant to treatment planning or summary
    let intakeContext = null;
    if (['GENERATE_SESSION_SUMMARY', 'GENERATE_TREATMENT_PLAN_DRAFT'].includes(jobType)) {
      const intakeRaw = (await firebaseRtdbAdapter.get(`patientIntake/${session.patientId}`)) || null;
      if (intakeRaw) {
        intakeContext = {
          presentingProblems: intakeRaw.presentingProblems || intakeRaw.primaryConcern || '',
          goals: intakeRaw.goals || '',
        };
      }
    }

    // 7. Only include existing active treatment plan if drafting a treatment plan revision
    let existingTreatmentPlan = null;
    if (jobType === 'GENERATE_TREATMENT_PLAN_DRAFT') {
      const allPlans = (await firebaseRtdbAdapter.get('treatmentPlans')) || {};
      const patientPlans = Object.values(allPlans)
        .filter((p) => p.patientId === session.patientId && p.psychologistId === psychologistId && p.status === 'active')
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      if (patientPlans.length > 0) {
        const latest = patientPlans[0];
        existingTreatmentPlan = {
          planId: latest.id || latest.planId,
          title: latest.title,
          presentingProblem: latest.presentingProblem,
          goals: latest.goals || [],
          clinicalInterventions: latest.clinicalInterventions || [],
        };
      }
    }

    return {
      session: {
        id: session.sessionId || session.id || sessionId,
        appointmentId: session.appointmentId,
        patientId: session.patientId,
        sessionMode: session.sessionMode,
        sessionStatus: session.sessionStatus,
      },
      patient: patientContext,
      intake: intakeContext,
      existingTreatmentPlan,
      transcript: {
        id: transcript.id,
        version: transcript.version || 1,
        turnCount: sortedEntries.length || transcript.turnCount || 0,
        completeness: transcript.completeness || 'completed',
        reviewStatus: transcript.reviewStatus || 'pending_review',
      },
      transcriptText,
      transcriptVersion: transcript.version || 1,
    };
  },

  // ==========================================
  // 2. DURABLE JOB CREATION & IDEMPOTENCY
  // ==========================================

  /**
   * Registers a persistent AI job in Firebase RTDB and enqueues it for background processing.
   * Returns immediately with job status.
   */
  createJob: async (psychologistId, userRole, payload) => {
    // Admin access barrier: strict prohibition
    if (userRole === 'admin') {
      const err = new Error('Access to confidential psychotherapy AI drafting is strictly prohibited from administrative accounts.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    if (userRole !== 'psychologist') {
      const err = new Error('Only licensed psychologists can request AI clinical documentation drafts.');
      err.status = 403;
      err.code = 'PSYCHOLOGIST_ROLE_REQUIRED';
      throw err;
    }

    const { sessionId, jobType, format, idempotencyKey, notes } = payload;

    if (!sessionId || !jobType) {
      const err = new Error('Missing required parameters: sessionId and jobType are mandatory.');
      err.status = 400;
      throw err;
    }

    if (!AI_JOB_TYPES.includes(jobType)) {
      const err = new Error(`Invalid jobType: "${jobType}". Supported types: ${AI_JOB_TYPES.join(', ')}`);
      err.status = 400;
      throw err;
    }

    // 1. Verify access and prepare source context metadata
    const context = await aiJobService.prepareSourceContext(psychologistId, sessionId, jobType);

    // 2. Idempotency check: look for active or completed identical job
    const allJobs = (await firebaseRtdbAdapter.get('aiJobs')) || {};
    const existingJobs = Object.values(allJobs).filter(
      (j) =>
        j.sessionId === sessionId &&
        j.jobType === jobType &&
        j.psychologistId === psychologistId &&
        j.sourceTranscriptVersion === context.transcriptVersion
    );

    if (idempotencyKey) {
      const match = existingJobs.find((j) => j.idempotencyKey === idempotencyKey);
      if (match) {
        logger.info(`Idempotent AI job match found for key: ${idempotencyKey} (Job ${match.id})`);
        return {
          jobId: match.id,
          status: match.status,
          jobType: match.jobType,
          draftId: match.draftId || null,
          idempotentReplay: true,
          createdAt: match.createdAt,
        };
      }
    }

    // Check if an uncompleted job of the exact same type is currently queued or processing
    const pendingJob = existingJobs.find((j) => j.status === 'queued' || j.status === 'processing');
    if (pendingJob) {
      logger.info(`Returning currently pending job for session ${sessionId} and type ${jobType} (Job ${pendingJob.id})`);
      return {
        jobId: pendingJob.id,
        status: pendingJob.status,
        jobType: pendingJob.jobType,
        draftId: pendingJob.draftId || null,
        idempotentReplay: true,
        createdAt: pendingJob.createdAt,
      };
    }

    // 3. Create persistent RTDB job record
    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const jobRecord = {
      id: jobId,
      jobId,
      jobType,
      format: format || 'GENERAL',
      status: 'queued', // 'queued' | 'processing' | 'validating' | 'completed' | 'failed' | 'retrying' | 'cancelled'
      psychologistId,
      patientId: context.session.patientId,
      sessionId,
      appointmentId: context.session.appointmentId,
      sourceTranscriptId: context.transcript.id,
      sourceTranscriptVersion: context.transcriptVersion,
      idempotencyKey: idempotencyKey || null,
      attemptCount: 0,
      maxAttempts: 3,
      draftId: null,
      notes: notes || null,
      errorCode: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, jobRecord);

    // 4. Enqueue to durable background queue
    await jobQueue.enqueue('PROCESS_AI_JOB', { jobId });

    // 5. Audit record
    await auditService.log({
      action: 'AI_JOB_CREATED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: jobId,
      details: {
        sessionId,
        jobType,
        format: jobRecord.format,
        sourceTranscriptId: context.transcript.id,
        transcriptVersion: context.transcriptVersion,
      },
    });

    return {
      jobId,
      status: 'queued',
      jobType,
      createdAt: now,
    };
  },

  // ==========================================
  // 3. WORKER JOB EXECUTION & VALIDATION
  // ==========================================

  /**
   * Processes an enqueued AI job outside Express request handler.
   * Invoked by durable background worker.
   */
  processJob: async (jobId) => {
    const job = await firebaseRtdbAdapter.get(`aiJobs/${jobId}`);
    if (!job) {
      logger.warn(`AI Worker: Job ${jobId} not found in database.`);
      return null;
    }

    if (job.status === 'completed' || job.status === 'cancelled') {
      logger.info(`AI Worker: Job ${jobId} already ${job.status}. Skipping.`);
      return job;
    }

    const now = new Date().toISOString();
    const currentAttempt = (job.attemptCount || 0) + 1;

    // Transition state to processing
    job.status = 'processing';
    job.attemptCount = currentAttempt;
    job.startedAt = job.startedAt || now;
    job.updatedAt = now;
    await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, job);

    try {
      // 1. Re-assert authorization & retrieve fresh source context
      const context = await aiJobService.prepareSourceContext(job.psychologistId, job.sessionId, job.jobType);

      // 2. Invoke Gemini Provider Adapter
      const { output, modelUsed, isSimulated } = await geminiAdapter.generateClinicalDocumentation(
        job.jobType,
        context
      );

      // 3. Update status to validating
      job.status = 'validating';
      job.updatedAt = new Date().toISOString();
      await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, job);

      // 4. Validate output schema server-side
      const validatedOutput = validateAiOutput(job.jobType, output);

      // 5. Persist generated draft in aiDrafts node
      const draftId = `aid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const draftRecord = {
        id: draftId,
        draftId,
        jobId,
        draftType: job.jobType,
        format: job.format || 'GENERAL',
        patientId: job.patientId,
        psychologistId: job.psychologistId,
        sessionId: job.sessionId,
        appointmentId: job.appointmentId,
        sourceTranscriptId: job.sourceTranscriptId,
        sourceTranscriptVersion: job.sourceTranscriptVersion,
        content: validatedOutput,
        evidenceReferences: validatedOutput.evidenceReferences || [],
        missingInformation: validatedOutput.missingInformation || [],
        modelUsed,
        isSimulated: Boolean(isSimulated),
        isDraft: true,
        approvalStatus: 'pending_approval', // 'pending_approval' | 'edited' | 'approved' | 'rejected'
        reviewedAt: null,
        approvedAt: null,
        approvedBy: null,
        version: 1,
        versionHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firebaseRtdbAdapter.set(`aiDrafts/${draftId}`, draftRecord);

      // 6. Complete Job Record
      const completedTime = new Date().toISOString();
      job.status = 'completed';
      job.draftId = draftId;
      job.completedAt = completedTime;
      job.updatedAt = completedTime;
      await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, job);

      // 7. Audit log
      await auditService.log({
        action: 'AI_JOB_COMPLETED',
        userId: job.psychologistId,
        userRole: 'psychologist',
        targetId: jobId,
        details: {
          draftId,
          jobType: job.jobType,
          modelUsed,
          attemptCount: currentAttempt,
        },
      });

      logger.info(`AI Worker: Successfully completed job ${jobId} -> Draft ${draftId}`);
      return job;
    } catch (err) {
      logger.error(`AI Worker: Execution failure on job ${jobId} (attempt ${currentAttempt}): ${err.message}`);

      const isRetryable = err.retryable && currentAttempt < (job.maxAttempts || 3);
      const failedTime = new Date().toISOString();

      job.status = isRetryable ? 'retrying' : 'failed';
      job.errorCode = err.code || 'AI_PROCESSING_ERROR';
      job.errorMessage = err.message || 'An unexpected error occurred during AI clinical processing.';
      job.updatedAt = failedTime;
      if (!isRetryable) {
        job.failedAt = failedTime;
      }

      await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, job);

      await auditService.log({
        action: isRetryable ? 'AI_JOB_RETRY_SCHEDULED' : 'AI_JOB_FAILED',
        userId: job.psychologistId,
        userRole: 'psychologist',
        targetId: jobId,
        details: {
          jobType: job.jobType,
          attemptCount: currentAttempt,
          error: job.errorMessage,
          errorCode: job.errorCode,
        },
      });

      if (isRetryable) {
        // Schedule retry with exponential backoff (1s, 2s, 4s)
        const delayMs = Math.pow(2, currentAttempt) * 1000;
        setTimeout(() => {
          jobQueue.enqueue('PROCESS_AI_JOB', { jobId });
        }, delayMs);
      }

      throw err;
    }
  },

  // ==========================================
  // 4. JOB RETRIEVAL & QUERYING
  // ==========================================

  getJob: async (jobId, psychologistId, userRole) => {
    if (userRole === 'admin') {
      const err = new Error('Access denied. Administrative accounts cannot access clinical AI jobs.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    const job = await firebaseRtdbAdapter.get(`aiJobs/${jobId}`);
    if (!job) {
      const err = new Error('Job not found.');
      err.status = 404;
      throw err;
    }

    if (job.psychologistId !== psychologistId) {
      const err = new Error('Access denied. You do not have permission to view this job.');
      err.status = 403;
      throw err;
    }

    return job;
  },

  listJobsForSession: async (sessionId, psychologistId, userRole) => {
    if (userRole === 'admin') {
      const err = new Error('Access denied. Administrative accounts cannot access clinical AI jobs.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    const allJobs = (await firebaseRtdbAdapter.get('aiJobs')) || {};
    const sessionJobs = Object.values(allJobs)
      .filter((j) => j.sessionId === sessionId && j.psychologistId === psychologistId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return sessionJobs;
  },

  retryJob: async (jobId, psychologistId) => {
    const job = await firebaseRtdbAdapter.get(`aiJobs/${jobId}`);
    if (!job || job.psychologistId !== psychologistId) {
      const err = new Error('Job not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (job.status !== 'failed' && job.status !== 'retrying') {
      const err = new Error(`Cannot retry job in status: ${job.status}`);
      err.status = 400;
      throw err;
    }

    job.status = 'queued';
    job.updatedAt = new Date().toISOString();
    await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, job);
    await jobQueue.enqueue('PROCESS_AI_JOB', { jobId });
    return job;
  },

  cancelJob: async (jobId, psychologistId) => {
    const job = await firebaseRtdbAdapter.get(`aiJobs/${jobId}`);
    if (!job || job.psychologistId !== psychologistId) {
      const err = new Error('Job not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      const err = new Error(`Cannot cancel a job that is already ${job.status}.`);
      err.status = 400;
      throw err;
    }

    job.status = 'cancelled';
    job.cancelledAt = new Date().toISOString();
    job.updatedAt = job.cancelledAt;
    await firebaseRtdbAdapter.set(`aiJobs/${jobId}`, job);

    await auditService.log({
      action: 'AI_JOB_CANCELLED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: jobId,
      details: { sessionId: job.sessionId, jobType: job.jobType },
    });

    return job;
  },

  // ==========================================
  // 5. DRAFT MANAGEMENT & CLINICAL REVIEW
  // ==========================================

  getDraft: async (draftId, psychologistId, userRole) => {
    if (userRole === 'admin') {
      const err = new Error('Access denied. Administrative accounts cannot access clinical documentation drafts.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    const draft = await firebaseRtdbAdapter.get(`aiDrafts/${draftId}`);
    if (!draft) {
      const err = new Error('Clinical draft not found.');
      err.status = 404;
      throw err;
    }

    if (draft.psychologistId !== psychologistId) {
      const err = new Error('Access denied. You do not own this clinical draft.');
      err.status = 403;
      throw err;
    }

    return draft;
  },

  listDraftsForSession: async (sessionId, psychologistId, userRole) => {
    if (userRole === 'admin') {
      const err = new Error('Access denied. Administrative accounts cannot access clinical documentation drafts.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    const allDrafts = (await firebaseRtdbAdapter.get('aiDrafts')) || {};
    const sessionDrafts = Object.values(allDrafts)
      .filter((d) => d.sessionId === sessionId && d.psychologistId === psychologistId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return sessionDrafts;
  },

  updateDraft: async (draftId, psychologistId, updates) => {
    const draft = await firebaseRtdbAdapter.get(`aiDrafts/${draftId}`);
    if (!draft || draft.psychologistId !== psychologistId) {
      const err = new Error('Clinical draft not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (draft.approvalStatus === 'approved') {
      const err = new Error('Cannot edit a draft that has already been approved and finalized.');
      err.status = 400;
      err.code = 'DRAFT_ALREADY_APPROVED';
      throw err;
    }

    const now = new Date().toISOString();
    const priorVersion = draft.version || 1;
    const history = draft.versionHistory || [];

    // Snapshot current state into version history
    history.push({
      version: priorVersion,
      contentSnapshot: draft.content,
      modifiedAt: now,
      modifiedBy: psychologistId,
    });

    draft.content = {
      ...draft.content,
      ...(updates.content || {}),
    };
    if (updates.missingInformation) {
      draft.missingInformation = updates.missingInformation;
    }
    draft.version = priorVersion + 1;
    draft.versionHistory = history;
    draft.approvalStatus = 'edited';
    draft.reviewedAt = now;
    draft.updatedAt = now;

    await firebaseRtdbAdapter.set(`aiDrafts/${draftId}`, draft);
    return draft;
  },

  rejectDraft: async (draftId, psychologistId, reason) => {
    const draft = await firebaseRtdbAdapter.get(`aiDrafts/${draftId}`);
    if (!draft || draft.psychologistId !== psychologistId) {
      const err = new Error('Clinical draft not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (draft.approvalStatus === 'approved') {
      const err = new Error('Cannot reject an already approved clinical draft.');
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();
    draft.approvalStatus = 'rejected';
    draft.rejectedAt = now;
    draft.rejectionReason = reason || 'Discarded by clinician.';
    draft.updatedAt = now;

    await firebaseRtdbAdapter.set(`aiDrafts/${draftId}`, draft);

    await auditService.log({
      action: 'AI_DRAFT_REJECTED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: draftId,
      details: {
        sessionId: draft.sessionId,
        draftType: draft.draftType,
        reason: draft.rejectionReason,
      },
    });

    return draft;
  },

  // ==========================================
  // 6. HUMAN-IN-THE-LOOP APPROVAL & PERSISTENCE
  // ==========================================

  /**
   * Explicit, authenticated clinician approval action.
   * Commits the reviewed AI draft into Psyco AI's authoritative clinical records.
   */
  approveDraft: async (draftId, psychologistId, userRole, approvalPayload = {}) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Only licensed psychologists can approve clinical documentation.');
      err.status = 403;
      throw err;
    }

    const draft = await firebaseRtdbAdapter.get(`aiDrafts/${draftId}`);
    if (!draft || draft.psychologistId !== psychologistId) {
      const err = new Error('Clinical draft not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (draft.approvalStatus === 'approved') {
      const err = new Error('This draft has already been approved and committed to clinical records.');
      err.status = 409;
      err.code = 'DRAFT_ALREADY_APPROVED';
      throw err;
    }

    const now = new Date().toISOString();
    let committedRecord = null;
    let recordType = '';

    // Route commit action according to draftType
    switch (draft.draftType) {
      case 'GENERATE_SOAP':
      case 'GENERATE_DAP':
      case 'GENERATE_BIRP': {
        const formatMap = {
          GENERATE_SOAP: 'SOAP',
          GENERATE_DAP: 'DAP',
          GENERATE_BIRP: 'BIRP',
        };
        const format = formatMap[draft.draftType];
        recordType = 'sessionNotes';

        // 1. Save draft note to official clinical service
        const note = await clinicalService.saveNoteDraft(psychologistId, {
          sessionId: draft.sessionId,
          patientId: draft.patientId,
          format,
          content: draft.content,
          sharedWithPatient: Boolean(approvalPayload.sharedWithPatient),
          patientVisibleSummary: approvalPayload.patientVisibleSummary || '',
        });

        // 2. If clinician explicitly elected to finalize/sign immediately
        if (approvalPayload.finalizeImmediately) {
          committedRecord = await clinicalService.finalizeNote(note.id, psychologistId);
        } else {
          committedRecord = note;
        }
        break;
      }

      case 'GENERATE_SESSION_SUMMARY': {
        recordType = 'clinicalSummaries';
        const summaryId = `sum_${draft.sessionId.replace(/^ses_/, '')}`;
        const summaryRecord = {
          id: summaryId,
          summaryId,
          sessionId: draft.sessionId,
          patientId: draft.patientId,
          psychologistId,
          title: draft.content.title || 'Session Summary',
          content: draft.content,
          approvedAt: now,
          approvedBy: psychologistId,
          createdAt: now,
          updatedAt: now,
        };
        await firebaseRtdbAdapter.set(`clinicalSummaries/${summaryId}`, summaryRecord);
        committedRecord = summaryRecord;
        break;
      }

      case 'GENERATE_TREATMENT_PLAN_DRAFT': {
        recordType = 'treatmentPlans';
        const planData = {
          patientId: draft.patientId,
          title: draft.content.title || 'Treatment Plan',
          presentingProblem: draft.content.presentingProblem || '',
          goals: (draft.content.shortTermObjectives || []).map((obj, i) => ({
            description: obj.objective,
            measurableObjective: obj.measurableCriteria || '',
            targetDate: '',
          })),
          clinicalInterventions: draft.content.proposedInterventions || [],
          reviewFrequencyWeeks: draft.content.suggestedReviewFrequencyWeeks || 4,
          sharedWithPatient: Boolean(approvalPayload.sharedWithPatient),
        };

        committedRecord = await clinicalService.createTreatmentPlan(psychologistId, planData);
        break;
      }

      case 'GENERATE_HOMEWORK_SUGGESTIONS': {
        recordType = 'followUpTasks';
        const selectedIndices = approvalPayload.selectedIndices || [0];
        const suggestions = draft.content.suggestions || [];
        const createdTasks = [];

        for (const idx of selectedIndices) {
          const item = suggestions[idx];
          if (item) {
            const task = await clinicalService.createTask(psychologistId, {
              patientId: draft.patientId,
              sessionId: draft.sessionId,
              title: item.title,
              description: `${item.description}\n\nRationale: ${item.therapeuticRationale || ''}`,
              sharedWithPatient: true,
            });
            createdTasks.push(task);
          }
        }
        committedRecord = createdTasks;
        break;
      }

      case 'GENERATE_FOLLOW_UP_SUGGESTIONS': {
        recordType = 'followUpTasks';
        const selectedIndices = approvalPayload.selectedIndices || [0];
        const suggestions = draft.content.suggestions || [];
        const createdTasks = [];

        for (const idx of selectedIndices) {
          const item = suggestions[idx];
          if (item) {
            const task = await clinicalService.createTask(psychologistId, {
              patientId: draft.patientId,
              sessionId: draft.sessionId,
              title: item.title,
              description: `[Category: ${item.category || 'Follow-up'}] ${item.description}`,
              sharedWithPatient: false, // Clinician follow-up item
            });
            createdTasks.push(task);
          }
        }
        committedRecord = createdTasks;
        break;
      }

      case 'CHECK_DOCUMENTATION_COMPLETENESS': {
        recordType = 'documentationReviews';
        const reviewId = `rev_${draft.sessionId.replace(/^ses_/, '')}`;
        const reviewRecord = {
          id: reviewId,
          sessionId: draft.sessionId,
          patientId: draft.patientId,
          psychologistId,
          findings: draft.content,
          acknowledgedAt: now,
          acknowledgedBy: psychologistId,
        };
        await firebaseRtdbAdapter.set(`documentationReviews/${reviewId}`, reviewRecord);
        committedRecord = reviewRecord;
        break;
      }

      default:
        throw new Error(`Unsupported draft type for approval: ${draft.draftType}`);
    }

    // Update Draft Status to Approved
    draft.approvalStatus = 'approved';
    draft.isDraft = false;
    draft.approvedAt = now;
    draft.approvedBy = psychologistId;
    draft.committedRecordId = Array.isArray(committedRecord)
      ? committedRecord.map((r) => r.id).join(',')
      : committedRecord?.id || null;
    draft.recordType = recordType;
    draft.updatedAt = now;

    await firebaseRtdbAdapter.set(`aiDrafts/${draftId}`, draft);

    // Audit Logging
    await auditService.log({
      action: 'AI_DRAFT_APPROVED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: draftId,
      details: {
        sessionId: draft.sessionId,
        patientId: draft.patientId,
        draftType: draft.draftType,
        recordType,
        committedRecordId: draft.committedRecordId,
      },
    });

    return {
      success: true,
      draftId,
      approvalStatus: 'approved',
      committedRecord,
      recordType,
      approvedAt: now,
    };
  },
};
