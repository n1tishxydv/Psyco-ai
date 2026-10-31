import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { assemblyaiAdapter } from '../integrations/assemblyai/assemblyaiAdapter.js';
import { googleMeetAdapter } from '../integrations/googleMeet/googleMeetAdapter.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';
import config from '../config/index.js';
import crypto from 'crypto';

export const transcriptionService = {
  // ==========================================
  // 1. CONSENT MANAGEMENT
  // ==========================================

  /**
   * Retrieves the current consent record for a session
   */
  getConsentStatus: async (sessionId, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    const allConsents = (await firebaseRtdbAdapter.get('consentRecords')) || {};
    const sessionConsents = Object.values(allConsents)
      .filter((c) => c.sessionId === sessionId && c.patientId === session.patientId)
      .sort((a, b) => (b.confirmedAt || '').localeCompare(a.confirmedAt || ''));

    const latest = sessionConsents[0] || null;
    return {
      sessionId,
      patientId: session.patientId,
      consentStatus: latest ? latest.status : 'not_recorded',
      record: latest,
    };
  },

  /**
   * Records explicit informed patient consent before transcription
   */
  recordConsent: async (payload, psychologistId) => {
    const { sessionId, patientId, consentType, patientInformed, zeroAudioRetentionAcknowledged, notes } = payload;

    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (session.patientId !== patientId) {
      const err = new Error('Patient ID mismatch for this session.');
      err.status = 400;
      throw err;
    }

    const consentId = `cst_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const consentRecord = {
      id: consentId,
      consentId,
      sessionId,
      appointmentId: session.appointmentId,
      patientId,
      psychologistId,
      consentType: consentType || 'in_person_ambient',
      status: 'granted',
      patientInformed: Boolean(patientInformed),
      zeroAudioRetentionAcknowledged: Boolean(zeroAudioRetentionAcknowledged),
      notes: notes || null,
      confirmedAt: now,
      recordedBy: psychologistId,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`consentRecords/${consentId}`, consentRecord);

    await auditService.log({
      action: 'CONSENT_RECORDED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: consentId,
      details: {
        sessionId,
        patientId,
        consentType: consentRecord.consentType,
        status: 'granted',
      },
    });

    return consentRecord;
  },

  /**
   * Records consent withdrawal and immediately halts transcription
   */
  withdrawConsent: async (sessionId, reason, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    const consentInfo = await transcriptionService.getConsentStatus(sessionId, psychologistId);
    const now = new Date().toISOString();

    if (consentInfo.record) {
      const updatedConsent = {
        ...consentInfo.record,
        status: 'withdrawn',
        withdrawalReason: reason,
        withdrawnAt: now,
        withdrawnBy: psychologistId,
        updatedAt: now,
      };
      await firebaseRtdbAdapter.set(`consentRecords/${consentInfo.record.id}`, updatedConsent);
    }

    // If an active transcript exists, mark it as interrupted / consent_withdrawn
    const allTranscripts = (await firebaseRtdbAdapter.get('sessionTranscripts')) || {};
    const existing = Object.values(allTranscripts).find((t) => t.sessionId === sessionId);
    if (existing && existing.status !== 'completed') {
      existing.status = 'interrupted';
      existing.completeness = 'interrupted';
      existing.interruptionReason = `Consent withdrawn: ${reason}`;
      existing.updatedAt = now;
      await firebaseRtdbAdapter.set(`sessionTranscripts/${existing.id}`, existing);
    }

    await auditService.log({
      action: 'CONSENT_WITHDRAWN',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: sessionId,
      details: { reason, timestamp: now },
    });

    return {
      sessionId,
      status: 'withdrawn',
      reason,
      withdrawnAt: now,
    };
  },

  // ==========================================
  // 2. IN-PERSON STREAMING & TOKEN ISSUANCE
  // ==========================================

  /**
   * Issues short-lived AssemblyAI v3 streaming token after verifying session & consent
   */
  requestStreamingToken: async (sessionId, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    // Verify consent
    const consentInfo = await transcriptionService.getConsentStatus(sessionId, psychologistId);
    if (consentInfo.consentStatus !== 'granted') {
      const err = new Error('Patient consent has not been recorded or was withdrawn for this session.');
      err.status = 400;
      err.code = 'CONSENT_REQUIRED';
      throw err;
    }

    // Ensure or initialize transcript record
    const transcript = await transcriptionService.getOrCreateTranscriptRecord(
      sessionId,
      psychologistId,
      session.patientId,
      session.appointmentId,
      'assemblyai',
      'in_person'
    );

    // Request short-lived token from AssemblyAI v3
    const tokenData = await assemblyaiAdapter.createStreamingToken(60);

    // Update transcript status to connecting / ready
    transcript.status = 'ready';
    transcript.updatedAt = new Date().toISOString();
    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcript.id}`, transcript);

    await auditService.log({
      action: 'TRANSCRIPTION_TOKEN_ISSUED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: transcript.id,
      details: {
        sessionId,
        isSimulated: tokenData.isSimulated,
        isSandbox: Boolean(tokenData.isSandbox),
        providerMode: tokenData.provider || (config.aiSandbox?.assemblyaiLiveEnabled ? 'live' : 'mock'),
        sandboxMode: Boolean(config.aiSandbox?.sandboxMode),
        status: 'success',
      },
    });

    return {
      token: tokenData.token,
      wsUrl: tokenData.wsUrl,
      transcriptId: transcript.id,
      sessionId,
      expiresInSeconds: tokenData.expiresInSeconds,
      isSimulated: tokenData.isSimulated,
      isSandbox: Boolean(tokenData.isSandbox),
      sandboxMode: Boolean(config.aiSandbox?.sandboxMode),
      provider: tokenData.provider || 'mock',
    };
  },

  /**
   * Helper: Initializes or retrieves the transcript parent record
   */
  getOrCreateTranscriptRecord: async (
    sessionId,
    psychologistId,
    patientId,
    appointmentId,
    source = 'assemblyai',
    sessionMode = 'in_person'
  ) => {
    const allTranscripts = (await firebaseRtdbAdapter.get('sessionTranscripts')) || {};
    let transcript = Object.values(allTranscripts).find((t) => t.sessionId === sessionId);

    if (!transcript) {
      const transcriptId = `trx_${sessionId.replace(/^ses_/, '')}`;
      const now = new Date().toISOString();
      transcript = {
        id: transcriptId,
        transcriptId,
        sessionId,
        appointmentId,
        patientId,
        psychologistId,
        sessionMode,
        source, // 'assemblyai' | 'google_meet' | 'manual_import'
        status: 'awaiting_consent', // 'awaiting_consent' | 'ready' | 'processing' | 'completed' | 'partial' | 'interrupted'
        completeness: 'in_progress', // 'in_progress' | 'completed' | 'partial' | 'interrupted'
        language: 'en',
        fullText: '',
        turnCount: 0,
        reviewStatus: 'pending_review', // 'pending_review' | 'in_review' | 'reviewed'
        version: 1,
        sharedWithPatient: false,
        createdAt: now,
        updatedAt: now,
      };
      await firebaseRtdbAdapter.set(`sessionTranscripts/${transcriptId}`, transcript);
    }

    return transcript;
  },

  /**
   * Saves a finalized transcript turn event from AssemblyAI stream
   */
  saveTranscriptTurn: async (payload, psychologistId) => {
    const { sessionId, transcriptId, turnOrder, transcript, speaker, audioStart, audioEnd, words, endOfTurn } = payload;

    const transcriptRecord = await firebaseRtdbAdapter.get(`sessionTranscripts/${transcriptId}`);
    if (!transcriptRecord || transcriptRecord.psychologistId !== psychologistId) {
      const err = new Error('Transcript not found or access denied.');
      err.status = 404;
      throw err;
    }

    // Check consent state
    const consentInfo = await transcriptionService.getConsentStatus(sessionId, psychologistId);
    if (consentInfo.consentStatus === 'withdrawn') {
      const err = new Error('Consent has been withdrawn. Ingesting new turns is prohibited.');
      err.status = 403;
      err.code = 'CONSENT_WITHDRAWN';
      throw err;
    }

    const now = new Date().toISOString();
    const entryId = `ent_${String(turnOrder).padStart(5, '0')}_${crypto.randomBytes(3).toString('hex')}`;

    const turnEntry = {
      id: entryId,
      entryId,
      transcriptId,
      sessionId,
      turnOrder,
      speaker: speaker || 'Speaker 1',
      text: transcript.trim(),
      startTime: audioStart ? Math.round(audioStart) : null,
      endTime: audioEnd ? Math.round(audioEnd) : null,
      words: words || [],
      endOfTurn: Boolean(endOfTurn),
      createdAt: now,
      updatedAt: now,
    };

    // Store in structured transcriptEntries node
    await firebaseRtdbAdapter.set(`transcriptEntries/${transcriptId}/${entryId}`, turnEntry);

    // Update parent transcript fullText and state
    const allEntries = (await firebaseRtdbAdapter.get(`transcriptEntries/${transcriptId}`)) || {};
    const sortedEntries = Object.values(allEntries).sort((a, b) => a.turnOrder - b.turnOrder);
    const updatedFullText = sortedEntries.map((e) => `[${e.speaker}]: ${e.text}`).join('\n\n');

    transcriptRecord.status = 'processing';
    transcriptRecord.fullText = updatedFullText;
    transcriptRecord.turnCount = sortedEntries.length;
    transcriptRecord.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcriptId}`, transcriptRecord);

    return {
      entry: turnEntry,
      transcriptId,
      turnCount: sortedEntries.length,
    };
  },

  /**
   * Finalizes an in-person ambient transcription session
   */
  finalizeTranscript: async (payload, psychologistId) => {
    const { sessionId, transcriptId, completeness = 'completed', interruptionReason } = payload;

    const transcriptRecord = await firebaseRtdbAdapter.get(`sessionTranscripts/${transcriptId}`);
    if (!transcriptRecord || transcriptRecord.psychologistId !== psychologistId) {
      const err = new Error('Transcript not found or access denied.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    transcriptRecord.status = completeness;
    transcriptRecord.completeness = completeness;
    if (interruptionReason) {
      transcriptRecord.interruptionReason = interruptionReason;
    }
    transcriptRecord.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcriptId}`, transcriptRecord);

    await auditService.log({
      action: 'TRANSCRIPTION_FINALIZED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: transcriptId,
      details: { sessionId, completeness, turnCount: transcriptRecord.turnCount },
    });

    return transcriptRecord;
  },

  // ==========================================
  // 3. GOOGLE MEET TRANSCRIPT IMPORT
  // ==========================================

  /**
   * Discovers and imports official Google Meet transcript for an online session
   */
  importGoogleMeetTranscript: async (sessionId, psychologistId, meetingCodeOverride) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    const appointment = await firebaseRtdbAdapter.get(`appointments/${session.appointmentId}`);
    if (!appointment) {
      const err = new Error('Associated appointment not found.');
      err.status = 404;
      throw err;
    }

    // Determine meeting code
    const rawMeetUrl = meetingCodeOverride || appointment.googleMeetUrl || appointment.location?.addressOrUrl;
    const meetingCode = googleMeetAdapter.extractMeetingCode(rawMeetUrl);
    if (!meetingCode) {
      const err = new Error('No valid Google Meet code or URL found for this appointment.');
      err.status = 400;
      throw err;
    }

    // 1. Discover conference record
    const confRes = await googleMeetAdapter.discoverConferenceRecord(psychologistId, meetingCode);
    if (!confRes.success) {
      const err = new Error(confRes.message || 'Conference record could not be discovered.');
      err.status = confRes.status === 'OAUTH_REQUIRED' ? 401 : 404;
      err.code = confRes.status;
      throw err;
    }

    const confRecord = confRes.conferenceRecord;

    // 2. List available transcripts
    const transcriptsRes = await googleMeetAdapter.listTranscripts(psychologistId, confRecord.name);
    if (!transcriptsRes.success) {
      const err = new Error(transcriptsRes.message || 'No transcripts found for this Google Meet session.');
      err.status = 404;
      err.code = transcriptsRes.status;
      throw err;
    }

    const latestTranscript = transcriptsRes.transcripts[0];

    // 3. Retrieve transcript entries
    const entriesRes = await googleMeetAdapter.fetchTranscriptEntries(psychologistId, latestTranscript.name);
    if (!entriesRes.success) {
      const err = new Error(entriesRes.message || 'Failed to retrieve Google Meet transcript entries.');
      err.status = 502;
      throw err;
    }

    const rawEntries = entriesRes.entries || [];
    if (rawEntries.length === 0) {
      const err = new Error('The Google Meet transcript contains no speech entries.');
      err.status = 422;
      throw err;
    }

    // 4. Initialize or get parent transcript record (Idempotent reuse)
    const transcript = await transcriptionService.getOrCreateTranscriptRecord(
      sessionId,
      psychologistId,
      session.patientId,
      session.appointmentId,
      'google_meet',
      'online'
    );

    // Map participant identifiers into recognizable aliases (e.g. Participant 1, Participant 2)
    const participantMap = new Map();
    let participantCounter = 1;

    const now = new Date().toISOString();
    const normalizedEntries = {};

    rawEntries.forEach((entry, idx) => {
      let speaker = 'Speaker';
      if (entry.participant) {
        if (!participantMap.has(entry.participant)) {
          participantMap.set(entry.participant, `Speaker ${participantCounter++}`);
        }
        speaker = participantMap.get(entry.participant);
      }

      const entryId = `ent_${String(idx).padStart(5, '0')}_${crypto.randomBytes(3).toString('hex')}`;
      normalizedEntries[entryId] = {
        id: entryId,
        entryId,
        transcriptId: transcript.id,
        sessionId,
        turnOrder: idx,
        speaker,
        text: entry.text || '',
        startTime: entry.startTime || null,
        endTime: entry.endTime || null,
        languageCode: entry.languageCode || 'en-US',
        googleEntryName: entry.name || null,
        endOfTurn: true,
        createdAt: now,
        updatedAt: now,
      };
    });

    // Save normalized entries (idempotent overwrite of previous uncorrected entries)
    await firebaseRtdbAdapter.set(`transcriptEntries/${transcript.id}`, normalizedEntries);

    // Assemble text
    const sortedEntries = Object.values(normalizedEntries).sort((a, b) => a.turnOrder - b.turnOrder);
    const fullText = sortedEntries.map((e) => `[${e.speaker}]: ${e.text}`).join('\n\n');

    transcript.source = 'google_meet';
    transcript.status = 'completed';
    transcript.completeness = entriesRes.isTruncated ? 'partial' : 'completed';
    transcript.turnCount = sortedEntries.length;
    transcript.fullText = fullText;
    transcript.googleConferenceRecord = confRecord.name;
    transcript.googleTranscriptName = latestTranscript.name;
    transcript.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcript.id}`, transcript);

    await auditService.log({
      action: 'GOOGLE_MEET_TRANSCRIPT_IMPORTED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: transcript.id,
      details: {
        sessionId,
        meetingCode,
        turnCount: sortedEntries.length,
        isTruncated: entriesRes.isTruncated,
      },
    });

    return transcript;
  },

  // ==========================================
  // 4. MANUAL TEXT IMPORT FALLBACK
  // ==========================================

  /**
   * Imports plain text transcript provided by clinician (e.g. external provider fallback)
   */
  importManualTextTranscript: async (payload, psychologistId) => {
    const { sessionId, text, source = 'manual_import', notes } = payload;

    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    const cleanText = text.trim();
    if (!cleanText) {
      const err = new Error('Transcript text cannot be empty.');
      err.status = 400;
      throw err;
    }

    const transcript = await transcriptionService.getOrCreateTranscriptRecord(
      sessionId,
      psychologistId,
      session.patientId,
      session.appointmentId,
      source,
      session.sessionMode || 'in_person'
    );

    // Parse paragraphs as separate entries
    const paragraphs = cleanText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const now = new Date().toISOString();
    const entries = {};

    paragraphs.forEach((para, idx) => {
      // Check for speaker pattern like "[Psychologist]: ..." or "Patient: ..."
      let speaker = 'Speaker';
      let content = para;
      const speakerMatch = para.match(/^\[?([A-Za-z0-9 _-]+)\]?:\s*(.+)$/s);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
        content = speakerMatch[2].trim();
      }

      const entryId = `ent_${String(idx).padStart(5, '0')}_${crypto.randomBytes(3).toString('hex')}`;
      entries[entryId] = {
        id: entryId,
        entryId,
        transcriptId: transcript.id,
        sessionId,
        turnOrder: idx,
        speaker,
        text: content,
        startTime: null,
        endTime: null,
        endOfTurn: true,
        createdAt: now,
        updatedAt: now,
      };
    });

    await firebaseRtdbAdapter.set(`transcriptEntries/${transcript.id}`, entries);

    transcript.source = source;
    transcript.status = 'completed';
    transcript.completeness = 'completed';
    transcript.fullText = cleanText;
    transcript.turnCount = paragraphs.length;
    transcript.notes = notes || null;
    transcript.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcript.id}`, transcript);

    await auditService.log({
      action: 'MANUAL_TRANSCRIPT_IMPORTED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: transcript.id,
      details: { sessionId, source, turnCount: paragraphs.length },
    });

    return transcript;
  },

  // ==========================================
  // 5. TRANSCRIPT RETRIEVAL & SEARCH
  // ==========================================

  /**
   * Retrieves complete transcript record with entries and version history
   */
  getTranscript: async (sessionIdOrTranscriptId, requesterUid, requesterRole) => {
    // Admin is strictly prohibited from clinical transcripts!
    if (requesterRole === 'admin') {
      const err = new Error('Access to confidential psychotherapy transcripts is restricted from administrative accounts.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    const allTranscripts = (await firebaseRtdbAdapter.get('sessionTranscripts')) || {};
    const transcript =
      allTranscripts[sessionIdOrTranscriptId] ||
      Object.values(allTranscripts).find(
        (t) => t.sessionId === sessionIdOrTranscriptId || t.id === sessionIdOrTranscriptId
      );

    if (!transcript) {
      return null;
    }

    // Role-based authorization
    if (requesterRole === 'patient') {
      if (transcript.patientId !== requesterUid || !transcript.sharedWithPatient) {
        const err = new Error('Access denied. This transcript has not been released to the patient portal.');
        err.status = 403;
        throw err;
      }
    } else if (requesterRole === 'psychologist') {
      if (transcript.psychologistId !== requesterUid) {
        const err = new Error('Access denied. You do not own this clinical session transcript.');
        err.status = 403;
        throw err;
      }
    }

    // Load entries
    const rawEntries = (await firebaseRtdbAdapter.get(`transcriptEntries/${transcript.id}`)) || {};
    const entries = Object.values(rawEntries).sort((a, b) => a.turnOrder - b.turnOrder);

    // Load version history snapshots
    const rawVersions = (await firebaseRtdbAdapter.get(`transcriptVersions/${transcript.id}`)) || {};
    const versions = Object.values(rawVersions).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return {
      transcript,
      entries,
      versions,
    };
  },

  /**
   * Searches entries inside an authorized transcript
   */
  searchTranscript: async (transcriptId, query, psychologistId) => {
    const transcriptRecord = await firebaseRtdbAdapter.get(`sessionTranscripts/${transcriptId}`);
    if (!transcriptRecord || transcriptRecord.psychologistId !== psychologistId) {
      const err = new Error('Transcript not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (!query || !query.trim()) {
      return [];
    }

    const term = query.trim().toLowerCase();
    const rawEntries = (await firebaseRtdbAdapter.get(`transcriptEntries/${transcriptId}`)) || {};
    const entries = Object.values(rawEntries).sort((a, b) => a.turnOrder - b.turnOrder);

    const matches = [];
    entries.forEach((entry) => {
      const text = entry.text || '';
      if (text.toLowerCase().includes(term)) {
        matches.push({
          entryId: entry.id,
          turnOrder: entry.turnOrder,
          speaker: entry.speaker,
          text: entry.text,
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
      }
    });

    return matches;
  },

  // ==========================================
  // 6. INLINE CORRECTION & VERSION HISTORY
  // ==========================================

  /**
   * Corrects a transcript turn entry and archives a version snapshot
   */
  correctTranscriptEntry: async (transcriptId, entryId, updates, psychologistId) => {
    const { text, speaker, startTime, endTime, reason } = updates;

    const transcriptRecord = await firebaseRtdbAdapter.get(`sessionTranscripts/${transcriptId}`);
    if (!transcriptRecord || transcriptRecord.psychologistId !== psychologistId) {
      const err = new Error('Transcript not found or access denied.');
      err.status = 404;
      throw err;
    }

    const entry = await firebaseRtdbAdapter.get(`transcriptEntries/${transcriptId}/${entryId}`);
    if (!entry) {
      const err = new Error('Transcript entry not found.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    const currentVersion = transcriptRecord.version || 1;
    const versionId = `ver_${currentVersion}_${Date.now()}`;

    // 1. Snapshot previous state into transcriptVersions
    const versionSnapshot = {
      id: versionId,
      versionId,
      transcriptId,
      entryId,
      previousVersion: currentVersion,
      previousText: entry.text,
      previousSpeaker: entry.speaker,
      correctedText: text.trim(),
      correctedSpeaker: speaker || entry.speaker,
      reason: reason.trim(),
      correctedBy: psychologistId,
      createdAt: now,
    };

    await firebaseRtdbAdapter.set(`transcriptVersions/${transcriptId}/${versionId}`, versionSnapshot);

    // 2. Update entry
    entry.text = text.trim();
    if (speaker) entry.speaker = speaker.trim();
    if (startTime !== undefined) entry.startTime = startTime;
    if (endTime !== undefined) entry.endTime = endTime;
    entry.isCorrected = true;
    entry.lastCorrectedAt = now;
    entry.lastCorrectedBy = psychologistId;
    entry.updatedAt = now;

    await firebaseRtdbAdapter.set(`transcriptEntries/${transcriptId}/${entryId}`, entry);

    // 3. Reassemble fullText and increment version
    const allEntries = (await firebaseRtdbAdapter.get(`transcriptEntries/${transcriptId}`)) || {};
    const sortedEntries = Object.values(allEntries).sort((a, b) => a.turnOrder - b.turnOrder);
    const updatedFullText = sortedEntries.map((e) => `[${e.speaker}]: ${e.text}`).join('\n\n');

    transcriptRecord.fullText = updatedFullText;
    transcriptRecord.version = currentVersion + 1;
    transcriptRecord.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcriptId}`, transcriptRecord);

    await auditService.log({
      action: 'TRANSCRIPT_ENTRY_CORRECTED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: entryId,
      details: {
        transcriptId,
        version: currentVersion + 1,
        reason,
      },
    });

    return {
      entry,
      versionSnapshot,
      newVersion: currentVersion + 1,
    };
  },

  /**
   * Updates clinical review status of a transcript
   */
  updateReviewStatus: async (transcriptId, reviewStatus, psychologistId) => {
    const transcriptRecord = await firebaseRtdbAdapter.get(`sessionTranscripts/${transcriptId}`);
    if (!transcriptRecord || transcriptRecord.psychologistId !== psychologistId) {
      const err = new Error('Transcript not found or access denied.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    transcriptRecord.reviewStatus = reviewStatus;
    transcriptRecord.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionTranscripts/${transcriptId}`, transcriptRecord);

    await auditService.log({
      action: 'TRANSCRIPT_REVIEW_STATUS_UPDATED',
      userId: psychologistId,
      userRole: 'psychologist',
      targetId: transcriptId,
      details: { reviewStatus },
    });

    return transcriptRecord;
  },
};
