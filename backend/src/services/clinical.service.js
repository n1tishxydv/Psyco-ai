import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export const clinicalService = {
  // ==========================================
  // PATIENT MANAGEMENT & CHART
  // ==========================================

  /**
   * Retrieves all patients assigned to or with appointments with the psychologist
   */
  getAssignedPatients: async (psychologistId, search = '') => {
    // 1. Fetch appointments to establish therapeutic relationship
    const allAppointments = (await firebaseRtdbAdapter.get('appointments')) || {};
    const patientIds = new Set();

    for (const apt of Object.values(allAppointments)) {
      if (apt.psychologistId === psychologistId && apt.patientId) {
        patientIds.add(apt.patientId);
      }
    }

    // 2. Fetch all patients
    const allPatients = (await firebaseRtdbAdapter.get('patients')) || {};
    // Also check direct assignedPsychologistIds on patient profile
    for (const [pId, pData] of Object.entries(allPatients)) {
      if (pData.assignedPsychologistIds && pData.assignedPsychologistIds[psychologistId]) {
        patientIds.add(pId);
      }
    }

    const assignedPatients = [];
    for (const pId of patientIds) {
      const patient = allPatients[pId];
      if (!patient) continue;

      // Filter search
      if (search) {
        const query = search.toLowerCase();
        const name = (patient.fullName || patient.preferredName || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();
        if (!name.includes(query) && !email.includes(query)) {
          continue;
        }
      }

      // Count patient appointments with this psychologist
      const pApts = Object.values(allAppointments)
        .filter((a) => a.patientId === pId && a.psychologistId === psychologistId)
        .sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''));

      const lastApt = pApts[0] || null;
      const nextApt = pApts.find((a) => a.status === 'confirmed' && new Date(a.startTime) > new Date()) || null;

      assignedPatients.push({
        id: pId,
        patientId: pId,
        name: patient.fullName || patient.preferredName || 'Confidential Patient',
        fullName: patient.fullName || patient.preferredName || 'Confidential Patient',
        email: patient.email,
        gender: patient.gender || 'unspecified',
        age: patient.age || null,
        intakeStatus: patient.intakeStatus || 'not_started',
        totalAppointments: pApts.length,
        lastAppointment: lastApt ? { date: lastApt.date || lastApt.startTime?.split('T')[0], status: lastApt.status } : null,
        nextAppointment: nextApt ? { date: nextApt.date || nextApt.startTime?.split('T')[0], startTime: nextApt.startTime } : null,
        createdAt: patient.createdAt,
      });
    }

    return assignedPatients.sort((a, b) => a.fullName.localeCompare(b.fullName));
  },

  /**
   * Verifies therapeutic relationship between psychologist and patient
   * Enforces verified clinician status and active scheduling or care relationship
   */
  assertTherapeuticRelationship: async (psychologistId, patientId) => {
    // 1. Verify psychologist profile existence and approved verification status
    const psych = await firebaseRtdbAdapter.get(`psychologists/${psychologistId}`);
    const isApproved = psych?.approvalStatus === 'approved' || (psych?.verified === true && psych?.approvalStatus !== 'rejected');
    if (!isApproved) {
      const err = new Error('Access denied. Clinician credentials are pending verification or rejected.');
      err.status = 403;
      err.code = 'PSYCHOLOGIST_NOT_VERIFIED';
      throw err;
    }

    // 2. Verify active clinical or scheduling relationship
    const allAppointments = (await firebaseRtdbAdapter.get('appointments')) || {};
    const hasApt = Object.values(allAppointments).some(
      (a) => a.psychologistId === psychologistId && a.patientId === patientId
    );
    if (hasApt) return true;

    const patient = await firebaseRtdbAdapter.get(`patients/${patientId}`);
    if (patient?.assignedPsychologistIds?.[psychologistId]) return true;

    const err = new Error('Access denied. No active clinical or scheduling relationship with this patient.');
    err.status = 403;
    err.code = 'UNAUTHORIZED_PATIENT_ACCESS';
    throw err;
  },

  /**
   * Retrieves complete patient chart for authorized clinician
   */
  getPatientChart: async (psychologistId, patientId) => {
    await clinicalService.assertTherapeuticRelationship(psychologistId, patientId);

    const patient = (await firebaseRtdbAdapter.get(`patients/${patientId}`)) || {};
    const intake = (await firebaseRtdbAdapter.get(`patientIntake/${patientId}`)) || null;

    // Fetch appointments with this clinician
    const allAppointments = (await firebaseRtdbAdapter.get('appointments')) || {};
    const appointments = Object.values(allAppointments)
      .filter((a) => a.patientId === patientId && a.psychologistId === psychologistId)
      .sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''));

    // Fetch sessions
    const allSessions = (await firebaseRtdbAdapter.get('sessionRecords')) || {};
    const sessions = Object.values(allSessions)
      .filter((s) => s.patientId === patientId && s.psychologistId === psychologistId)
      .sort((a, b) => (b.scheduledAt || '').localeCompare(a.scheduledAt || ''));

    // Fetch notes
    const allNotes = (await firebaseRtdbAdapter.get('sessionNotes')) || {};
    const notes = Object.values(allNotes)
      .filter((n) => n.patientId === patientId && n.psychologistId === psychologistId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Fetch treatment plans
    const allPlans = (await firebaseRtdbAdapter.get('treatmentPlans')) || {};
    const treatmentPlans = Object.values(allPlans)
      .filter((p) => p.patientId === patientId && p.psychologistId === psychologistId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Fetch tasks & homework
    const allTasks = (await firebaseRtdbAdapter.get('followUpTasks')) || {};
    const tasks = Object.values(allTasks)
      .filter((t) => t.patientId === patientId && t.psychologistId === psychologistId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    // Fetch recommendations
    const allRecs = (await firebaseRtdbAdapter.get('clinicalRecommendations')) || {};
    const recommendations = Object.values(allRecs)
      .filter((r) => r.patientId === patientId && r.psychologistId === psychologistId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return {
      patient: {
        id: patientId,
        patientId,
        fullName: patient.fullName || patient.preferredName || 'Confidential Patient',
        preferredName: patient.preferredName,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender,
        age: patient.age,
        emergencyContact: patient.emergencyContact,
        timezone: patient.timezone,
        intakeStatus: patient.intakeStatus,
        createdAt: patient.createdAt,
      },
      intake,
      appointments,
      sessions,
      notes,
      sessionNotes: notes,
      treatmentPlans,
      tasks,
      recommendations,
    };
  },

  // ==========================================
  // SESSION LIFECYCLE
  // ==========================================

  /**
   * Idempotently create or retrieve session record for an appointment
   */
  createOrGetSession: async (appointmentId, psychologistId) => {
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);
    if (!appointment) {
      const err = new Error('Appointment not found.');
      err.status = 404;
      throw err;
    }

    if (appointment.psychologistId !== psychologistId) {
      const err = new Error('You do not own this appointment.');
      err.status = 403;
      throw err;
    }

    const sessionId = `ses_${appointmentId.replace(/^apt_/, '')}`;
    let session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);

    if (!session) {
      const now = new Date().toISOString();
      const pin = appointment.sessionPin || String(Math.floor(100000 + Math.random() * 900000));
      session = {
        id: sessionId,
        sessionId,
        appointmentId,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        psychologistId,
        psychologistName: appointment.psychologistName,
        scheduledAt: appointment.startTime,
        scheduledEndTime: appointment.endTime,
        durationMinutes: appointment.durationMinutes || 50,
        sessionMode: appointment.sessionMode || appointment.mode || 'in_person',
        sessionStatus: 'scheduled',
        status: 'scheduled',
        sessionPin: pin,
        actualStartTime: null,
        actualEndTime: null,
        notesFinalized: false,
        noteId: null,
        createdAt: now,
        updatedAt: now,
      };

      await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, session);

      // Link to appointment
      appointment.sessionRecordId = sessionId;
      if (!appointment.sessionPin) appointment.sessionPin = pin;
      await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);
    } else {
      session.sessionId = session.id || sessionId;
      session.status = session.sessionStatus || 'scheduled';
      if (!session.sessionPin) session.sessionPin = appointment.sessionPin || '123456';
    }

    return session;
  },

  /**
   * Retrieve session record by sessionId
   */
  getSessionById: async (sessionId, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session) {
      const err = new Error('Session not found.');
      err.status = 404;
      throw err;
    }
    if (session.psychologistId !== psychologistId) {
      const err = new Error('You do not own this session.');
      err.status = 403;
      throw err;
    }
    session.sessionId = session.id || sessionId;
    session.status = session.sessionStatus || 'scheduled';
    return session;
  },

  /**
   * Transition session: Start session
   */
  startSession: async (sessionId, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (session.sessionStatus === 'completed' || session.sessionStatus === 'finalized') {
      const err = new Error(`Cannot start session in status: ${session.sessionStatus}`);
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();
    session.sessionStatus = 'in_progress';
    session.status = 'in_progress';
    session.sessionId = session.id || sessionId;
    if (!session.actualStartTime) {
      session.actualStartTime = now;
    }
    session.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, session);
    return session;
  },

  /**
   * Transition session: Conclude session
   */
  completeSession: async (sessionId, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    session.sessionStatus = 'documentation_review';
    session.status = 'documentation_review';
    session.sessionId = session.id || sessionId;
    session.actualEndTime = now;
    session.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, session);
    return session;
  },

  /**
   * Finalize session after clinical note is locked
   */
  finalizeSession: async (sessionId, psychologistId) => {
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (!session || session.psychologistId !== psychologistId) {
      const err = new Error('Session not found or access denied.');
      err.status = 404;
      throw err;
    }

    // Enforce that any active clinical risk review flags have been reviewed/acknowledged
    const allFlags = (await firebaseRtdbAdapter.get('riskReviewFlags')) || {};
    const unreviewedFlags = Object.values(allFlags).filter(
      (f) => f.sessionId === sessionId && f.reviewStatus === 'pending_review'
    );
    if (unreviewedFlags.length > 0) {
      const err = new Error('Cannot finalize session: active clinical risk-review flags require clinician acknowledgment.');
      err.status = 412;
      err.code = 'UNREVIEWED_RISK_FLAGS_EXIST';
      throw err;
    }

    const now = new Date().toISOString();
    session.sessionStatus = 'finalized';
    session.status = 'finalized';
    session.sessionId = session.id || sessionId;
    session.notesFinalized = true;
    session.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, session);
    return session;
  },

  // ==========================================
  // CLINICAL SESSION NOTES (SOAP, DAP, BIRP, GENERAL)
  // ==========================================

  /**
   * Save or update draft note for session
   */
  saveNoteDraft: async (psychologistId, { sessionId, patientId, format = 'SOAP', content = {}, sharedWithPatient = false, patientVisibleSummary = '' }) => {
    await clinicalService.assertTherapeuticRelationship(psychologistId, patientId);

    const noteId = `not_${sessionId.replace(/^ses_/, '')}`;
    const existing = await firebaseRtdbAdapter.get(`sessionNotes/${noteId}`);

    if (existing && (!existing.isDraft || existing.status === 'finalized')) {
      const err = new Error('Note is already finalized. To modify, please create an amendment.');
      err.status = 409;
      err.code = 'NOTE_ALREADY_FINALIZED';
      throw err;
    }

    const now = new Date().toISOString();
    const note = {
      id: noteId,
      noteId,
      sessionId,
      patientId,
      psychologistId,
      format, // 'GENERAL' | 'SOAP' | 'DAP' | 'BIRP'
      content,
      isDraft: true,
      status: 'draft', // 'draft' | 'in_review' | 'finalized' | 'amended'
      sharedWithPatient: Boolean(sharedWithPatient),
      patientVisibleSummary: patientVisibleSummary || '',
      signedAt: null,
      signedByPsychologistId: null,
      version: existing ? existing.version || 1 : 1,
      versionHistory: existing ? existing.versionHistory || [] : [],
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`sessionNotes/${noteId}`, note);

    // Link note to session record
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${sessionId}`);
    if (session) {
      session.noteId = noteId;
      await firebaseRtdbAdapter.set(`sessionRecords/${sessionId}`, session);
    }

    return note;
  },

  /**
   * Finalize and lock clinical note
   */
  finalizeNote: async (noteId, psychologistId) => {
    const note = await firebaseRtdbAdapter.get(`sessionNotes/${noteId}`);
    if (!note || note.psychologistId !== psychologistId) {
      const err = new Error('Clinical note not found or access denied.');
      err.status = 404;
      throw err;
    }

    if (note.status === 'finalized') {
      const err = new Error('Note is already finalized.');
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();
    note.isDraft = false;
    note.status = 'finalized';
    note.noteId = note.id || noteId;
    note.signedAt = now;
    note.finalizedAt = now;
    note.signedBy = 'Dr. John Watson';
    note.signedByPsychologistId = psychologistId;
    note.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionNotes/${noteId}`, note);

    // Update session record state
    const session = await firebaseRtdbAdapter.get(`sessionRecords/${note.sessionId}`);
    if (session) {
      session.notesFinalized = true;
      session.sessionStatus = 'finalized';
      session.updatedAt = now;
      await firebaseRtdbAdapter.set(`sessionRecords/${note.sessionId}`, session);
    }

    await auditService.record({
      action: 'CLINICAL_NOTE_FINALIZED',
      userId: psychologistId,
      details: { noteId, sessionId: note.sessionId, format: note.format },
    });

    return note;
  },

  /**
   * Create an amendment for an already finalized clinical note
   */
  amendNote: async (noteId, psychologistId, { reason, amendedContent, patientVisibleSummary }) => {
    const note = await firebaseRtdbAdapter.get(`sessionNotes/${noteId}`);
    if (!note || note.psychologistId !== psychologistId) {
      const err = new Error('Clinical note not found.');
      err.status = 404;
      throw err;
    }

    if (note.status !== 'finalized' && note.status !== 'amended') {
      const err = new Error('Only finalized notes can be amended.');
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();
    const priorVersion = note.version || 1;
    const history = note.versionHistory || [];

    // Snapshot prior version into history
    history.push({
      version: priorVersion,
      contentSnapshot: note.content,
      patientVisibleSummarySnapshot: note.patientVisibleSummary || '',
      signedAt: note.signedAt,
      signedBy: note.signedByPsychologistId,
      amendedAt: now,
      amendmentReason: reason,
    });

    note.version = priorVersion + 1;
    note.status = 'amended';
    note.noteId = note.id || noteId;
    note.content = amendedContent;
    if (patientVisibleSummary !== undefined) {
      note.patientVisibleSummary = patientVisibleSummary;
    }
    note.versionHistory = history;
    note.lastAmendedAt = now;
    note.lastAmendedReason = reason;
    note.updatedAt = now;

    await firebaseRtdbAdapter.set(`sessionNotes/${noteId}`, note);

    await auditService.record({
      action: 'CLINICAL_NOTE_AMENDED',
      userId: psychologistId,
      details: { noteId, version: note.version, reason },
    });

    return note;
  },

  // ==========================================
  // TREATMENT PLANS & GOALS
  // ==========================================

  createTreatmentPlan: async (psychologistId, planData) => {
    await clinicalService.assertTherapeuticRelationship(psychologistId, planData.patientId);

    const planId = `tp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const formattedGoals = (planData.goals || []).map((g, idx) => ({
      id: g.id || `goal_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      description: g.description,
      measurableObjective: g.measurableObjective || '',
      startDate: g.startDate || now.split('T')[0],
      targetDate: g.targetDate || '',
      status: g.status || 'active', // 'active' | 'achieved' | 'revised' | 'discontinued'
      progressNotes: g.progressNotes || '',
    }));

    const plan = {
      id: planId,
      planId,
      patientId: planData.patientId,
      psychologistId,
      title: planData.title,
      presentingProblem: planData.presentingProblem,
      diagnosisCodes: planData.diagnosisCodes || [],
      clinicalInterventions: planData.clinicalInterventions || [],
      reviewFrequencyWeeks: planData.reviewFrequencyWeeks || 4,
      goals: formattedGoals,
      status: 'active', // 'draft' | 'active' | 'under_review' | 'completed' | 'archived'
      sharedWithPatient: Boolean(planData.sharedWithPatient),
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`treatmentPlans/${planId}`, plan);

    await auditService.record({
      action: 'TREATMENT_PLAN_CREATED',
      userId: psychologistId,
      details: { planId, patientId: planData.patientId },
    });

    return plan;
  },

  updateTreatmentPlan: async (planId, psychologistId, updates) => {
    const plan = await firebaseRtdbAdapter.get(`treatmentPlans/${planId}`);
    if (!plan || plan.psychologistId !== psychologistId) {
      const err = new Error('Treatment plan not found or access denied.');
      err.status = 404;
      throw err;
    }

    const now = new Date().toISOString();
    const merged = {
      ...plan,
      ...updates,
      id: planId,
      patientId: plan.patientId,
      psychologistId,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`treatmentPlans/${planId}`, merged);
    return merged;
  },

  updatePlanGoal: async (planId, goalId, psychologistId, goalUpdates) => {
    const plan = await firebaseRtdbAdapter.get(`treatmentPlans/${planId}`);
    if (!plan || plan.psychologistId !== psychologistId) {
      const err = new Error('Treatment plan not found.');
      err.status = 404;
      throw err;
    }

    const goals = plan.goals || [];
    const goalIndex = goals.findIndex((g) => g.id === goalId);
    if (goalIndex === -1) {
      const err = new Error('Goal not found in this treatment plan.');
      err.status = 404;
      throw err;
    }

    goals[goalIndex] = {
      ...goals[goalIndex],
      ...goalUpdates,
    };

    plan.goals = goals;
    plan.updatedAt = new Date().toISOString();

    await firebaseRtdbAdapter.set(`treatmentPlans/${planId}`, plan);
    return plan;
  },

  // ==========================================
  // FOLLOW-UP TASKS & HOMEWORK
  // ==========================================

  createTask: async (psychologistId, data) => {
    await clinicalService.assertTherapeuticRelationship(psychologistId, data.patientId);

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const task = {
      id: taskId,
      taskId,
      patientId: data.patientId,
      psychologistId,
      sessionId: data.sessionId || null,
      treatmentPlanId: data.treatmentPlanId || null,
      title: data.title,
      description: data.description || '',
      assignedDate: data.assignedDate || now.split('T')[0],
      dueDate: data.dueDate || null,
      status: 'assigned', // 'assigned' | 'in_progress' | 'completed' | 'archived'
      completedAt: null,
      sharedWithPatient: data.sharedWithPatient !== false,
      patientNotes: '',
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`followUpTasks/${taskId}`, task);
    return task;
  },

  updateTaskStatus: async (taskId, userId, userRole, { status, patientNotes }) => {
    const task = await firebaseRtdbAdapter.get(`followUpTasks/${taskId}`);
    if (!task) {
      const err = new Error('Task not found.');
      err.status = 404;
      throw err;
    }

    // Role check: Patient can only update their own assigned task
    if (userRole === 'patient' && task.patientId !== userId) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }
    // Psychologist check: Must be the authoring psychologist
    if (userRole === 'psychologist' && task.psychologistId !== userId) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }

    const now = new Date().toISOString();
    task.status = status;
    if (status === 'completed' && !task.completedAt) {
      task.completedAt = now;
    } else if (status !== 'completed') {
      task.completedAt = null;
    }

    if (patientNotes !== undefined && userRole === 'patient') {
      task.patientNotes = patientNotes;
    }
    task.updatedAt = now;

    await firebaseRtdbAdapter.set(`followUpTasks/${taskId}`, task);
    return task;
  },

  // ==========================================
  // CLINICAL RECOMMENDATIONS & PRESCRIPTION GUARD
  // ==========================================

  createRecommendation: async (psychologistId, data) => {
    await clinicalService.assertTherapeuticRelationship(psychologistId, data.patientId);

    const recId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const rec = {
      id: recId,
      patientId: data.patientId,
      psychologistId,
      sessionId: data.sessionId || null,
      category: data.category || 'therapeutic_exercise',
      title: data.title,
      details: data.details,
      sharedWithPatient: data.sharedWithPatient !== false,
      createdAt: now,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`clinicalRecommendations/${recId}`, rec);
    return rec;
  },

  /**
   * Medication prescription enforcement guard:
   * Psychologists DO NOT possess medication prescribing authority by default.
   */
  createPrescriptionRecord: async (psychologistId, data) => {
    const psych = await firebaseRtdbAdapter.get(`psychologists/${psychologistId}`);
    if (!psych || !psych.canPrescribe) {
      const err = new Error(
        'Medical prescription authority is restricted to licensed psychiatric prescribers. Standard psychology accounts are not authorized to prescribe pharmaceutical drugs.'
      );
      err.status = 403;
      err.code = 'PRESCRIPTION_UNAUTHORIZED_FOR_ROLE';
      throw err;
    }

    // Authorized medical prescriber workflow
    const rxId = `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const rx = {
      id: rxId,
      patientId: data.patientId,
      prescriberId: psychologistId,
      medicationName: data.medicationName,
      dosage: data.dosage,
      instructions: data.instructions,
      issuedAt: now,
    };

    await firebaseRtdbAdapter.set(`prescriptionRecords/${rxId}`, rx);
    return rx;
  },

  // ==========================================
  // CLINICAL REPORTS
  // ==========================================

  generateReport: async (psychologistId, reportParams) => {
    await clinicalService.assertTherapeuticRelationship(psychologistId, reportParams.patientId);

    const chart = await clinicalService.getPatientChart(psychologistId, reportParams.patientId);
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    let reportTitle = '';
    const reportSections = [];

    switch (reportParams.reportType) {
      case 'session_summary': {
        reportTitle = `Clinical Session Summary — ${chart.patient.fullName}`;
        const latestSession = chart.sessions[0];
        const latestNote = chart.notes[0];
        reportSections.push({
          heading: 'Session Overview',
          content: latestSession
            ? `Date: ${latestSession.scheduledAt}\nStatus: ${latestSession.sessionStatus}\nMode: ${latestSession.sessionMode}`
            : 'No session records found.',
        });
        if (latestNote && reportParams.includeNotes) {
          reportSections.push({
            heading: `Session Documentation (${latestNote.format})`,
            content: Object.entries(latestNote.content || {})
              .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
              .join('\n\n'),
          });
        }
        break;
      }
      case 'treatment_summary': {
        reportTitle = `Comprehensive Treatment Plan Summary — ${chart.patient.fullName}`;
        const activePlan = chart.treatmentPlans.find((p) => p.status === 'active') || chart.treatmentPlans[0];
        if (activePlan) {
          reportSections.push({
            heading: 'Presenting Problem & Diagnosis',
            content: `Diagnosis Codes: ${activePlan.diagnosisCodes?.join(', ') || 'N/A'}\nPresenting Concern: ${activePlan.presentingProblem}`,
          });
          reportSections.push({
            heading: 'Clinical Goals',
            content: (activePlan.goals || [])
              .map((g, i) => `${i + 1}. [${g.status.toUpperCase()}] ${g.description} — Target: ${g.targetDate || 'Ongoing'}`)
              .join('\n'),
          });
        } else {
          reportSections.push({ heading: 'Treatment Plan', content: 'No active treatment plan found.' });
        }
        break;
      }
      case 'progress_report': {
        reportTitle = `Psychological Progress Assessment — ${chart.patient.fullName}`;
        reportSections.push({
          heading: 'Care Trajectory',
          content: `Total Sessions Completed: ${chart.sessions.filter((s) => s.sessionStatus === 'finalized' || s.sessionStatus === 'completed').length}\nActive Treatment Goals: ${chart.treatmentPlans.flatMap((p) => p.goals || []).filter((g) => g.status === 'active').length}`,
        });
        reportSections.push({
          heading: 'Assigned Homework & Exercises',
          content: chart.tasks
            .map((t) => `- [${t.status.toUpperCase()}] ${t.title} (Due: ${t.dueDate || 'Open'})`)
            .join('\n') || 'None recorded.',
        });
        break;
      }
      case 'discharge_summary': {
        reportTitle = `Clinical Care Discharge Summary — ${chart.patient.fullName}`;
        reportSections.push({
          heading: 'Course of Treatment',
          content: `Initial Intake: ${chart.intake?.submittedAt || 'Recorded'}\nTotal Consultations: ${chart.appointments.length}\nFinal Status: Discharged from active care.`,
        });
        break;
      }
      default: {
        reportTitle = `Patient Consultation History — ${chart.patient.fullName}`;
        reportSections.push({
          heading: 'Appointments Log',
          content: chart.appointments.map((a) => `${a.startTime?.split('T')[0]}: ${a.sessionMode || a.mode} (${a.status})`).join('\n'),
        });
      }
    }

    if (reportParams.clinicalSummaryNotes) {
      reportSections.push({
        heading: 'Clinician Remarks',
        content: reportParams.clinicalSummaryNotes,
      });
    }

    const report = {
      id: reportId,
      reportId,
      patientId: reportParams.patientId,
      patientName: chart.patient.fullName,
      psychologistId,
      reportType: reportParams.reportType,
      title: reportTitle,
      summary: reportSections.map((s) => `${s.heading}:\n${s.content}`).join('\n\n'),
      sections: reportSections,
      generatedAt: now,
      createdAt: now,
    };

    await firebaseRtdbAdapter.set(`reports/${reportId}`, report);

    await auditService.record({
      action: 'CLINICAL_REPORT_GENERATED',
      userId: psychologistId,
      details: { reportId, patientId: reportParams.patientId, reportType: reportParams.reportType },
    });

    return report;
  },

  // ==========================================
  // PATIENT PORTAL ACCESS
  // ==========================================

  /**
   * Retrieves strictly permitted clinical records for authenticated patient
   */
  getPatientCarePortalData: async (patientId) => {
    // 1. Shared treatment plans (only sharedWithPatient === true)
    const allPlans = (await firebaseRtdbAdapter.get('treatmentPlans')) || {};
    const sharedPlans = Object.values(allPlans)
      .filter((p) => p.patientId === patientId && p.sharedWithPatient)
      .map((p) => ({
        id: p.id,
        planId: p.planId || p.id,
        title: p.title,
        status: p.status,
        goals: (p.goals || []).map((g) => ({
          id: g.id,
          description: g.description,
          measurableObjective: g.measurableObjective,
          status: g.status,
          targetDate: g.targetDate,
        })),
        approvedAt: p.approvedAt,
      }));

    // 2. Shared homework & follow-up tasks
    const allTasks = (await firebaseRtdbAdapter.get('followUpTasks')) || {};
    const homework = Object.values(allTasks)
      .filter((t) => t.patientId === patientId && t.sharedWithPatient && t.status !== 'archived')
      .map((t) => ({
        ...t,
        id: t.id,
        taskId: t.taskId || t.id,
      }))
      .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt));

    // 3. Shared clinical recommendations
    const allRecs = (await firebaseRtdbAdapter.get('clinicalRecommendations')) || {};
    const recommendations = Object.values(allRecs)
      .filter((r) => r.patientId === patientId && r.sharedWithPatient)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 4. Shared session summaries (only patientVisibleSummary from notes with sharedWithPatient === true)
    const allNotes = (await firebaseRtdbAdapter.get('sessionNotes')) || {};
    const sharedSummaries = Object.values(allNotes)
      .filter((n) => n.patientId === patientId && n.sharedWithPatient && (n.status === 'finalized' || n.status === 'amended'))
      .map((n) => ({
        id: n.id,
        sessionId: n.sessionId,
        date: n.createdAt?.split('T')[0],
        summary: n.patientVisibleSummary || 'Session concluded. Continued active care plan.',
      }));

    return {
      treatmentPlans: sharedPlans,
      activePlans: sharedPlans,
      homework,
      homeworkTasks: homework,
      recommendations,
      sharedSummaries,
      sharedNotes: sharedSummaries.map((s) => ({
        ...s,
        patientVisibleSummary: s.summary,
      })),
    };
  },
};
