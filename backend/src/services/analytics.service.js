import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { clinicalService } from './clinical.service.js';
import { assessmentService } from './assessment.service.js';

export const analyticsService = {
  /**
   * Computes longitudinal progress analytics for an authorized patient
   */
  getPatientProgressAnalytics: async (patientId, psychologistId, userRole) => {
    if (userRole === 'admin') {
      const err = new Error('Administrative accounts are barred from accessing clinical progress analytics.');
      err.status = 403;
      err.code = 'ADMIN_CLINICAL_ACCESS_PROHIBITED';
      throw err;
    }

    if (userRole === 'psychologist') {
      await clinicalService.assertTherapeuticRelationship(psychologistId, patientId);
    } else if (userRole === 'patient') {
      if (patientId !== psychologistId) {
        // Here second arg is requestingUid
        const err = new Error('Access denied. You can only view your own progress data.');
        err.status = 403;
        throw err;
      }
    }

    // 1. Assessment Trajectories (Compatible instruments compared separately)
    const allResults = await assessmentService.getPatientHistory(patientId, psychologistId, userRole);

    const assessmentsByInstrument = {};
    for (const res of allResults) {
      if (!assessmentsByInstrument[res.instrumentId]) {
        assessmentsByInstrument[res.instrumentId] = [];
      }
      assessmentsByInstrument[res.instrumentId].push({
        id: res.id,
        date: res.submittedAt,
        score: res.totalScore,
        maxScore: res.maxScore,
        category: res.severityCategory,
        severityCode: res.severityCode,
        hasCriticalSafetySignal: res.hasCriticalSafetySignal,
      });
    }

    const instrumentMetrics = {};
    for (const [instId, series] of Object.entries(assessmentsByInstrument)) {
      if (series.length === 0) continue;
      const baseline = series[0];
      const latest = series[series.length - 1];
      const delta = latest.score - baseline.score;
      const percentChange = baseline.score > 0 ? Math.round((delta / baseline.score) * 100) : 0;

      let trend = 'stable';
      if (delta < 0) trend = 'improving'; // Lower scores on PHQ-9 and GAD-7 indicate symptom reduction
      if (delta > 0) trend = 'elevating';

      instrumentMetrics[instId] = {
        instrumentId: instId,
        baselineScore: baseline.score,
        baselineDate: baseline.date,
        latestScore: latest.score,
        latestDate: latest.date,
        delta,
        percentChange,
        trend,
        datapointsCount: series.length,
        series,
        history: series,
      };
    }

    // 2. Treatment Plan Goals Progress
    const allPlans = (await firebaseRtdbAdapter.get('treatmentPlans')) || {};
    const patientPlans = Object.values(allPlans).filter((p) => p.patientId === patientId);
    const activePlan = patientPlans.find((p) => p.status === 'active') || patientPlans[0] || null;

    let goalsMetrics = {
      totalGoals: 0,
      achievedGoals: 0,
      activeGoals: 0,
      revisedGoals: 0,
      completionRate: 0,
      goals: [],
    };

    if (activePlan && activePlan.goals) {
      const goals = activePlan.goals;
      const achieved = goals.filter((g) => g.status === 'achieved').length;
      const active = goals.filter((g) => g.status === 'active').length;
      const revised = goals.filter((g) => g.status === 'revised').length;
      const completionRate = goals.length > 0 ? Math.round((achieved / goals.length) * 100) : 0;

      goalsMetrics = {
        planId: activePlan.id,
        planTitle: activePlan.title,
        totalGoals: goals.length,
        achievedGoals: achieved,
        activeGoals: active,
        revisedGoals: revised,
        completionRate,
        goals,
      };
    }

    // 3. Attendance & Engagement Metrics
    const allAppointments = (await firebaseRtdbAdapter.get('appointments')) || {};
    const patientAppointments = Object.values(allAppointments).filter((a) => a.patientId === patientId);

    let completedApts = 0;
    let scheduledApts = 0;
    let patientCancelledApts = 0;
    let psychologistCancelledApts = 0;
    let noShowApts = 0;

    for (const apt of patientAppointments) {
      if (apt.status === 'completed') completedApts++;
      else if (apt.status === 'confirmed' || apt.status === 'pending') scheduledApts++;
      else if (apt.status === 'cancelled' && apt.cancelledBy === 'patient') patientCancelledApts++;
      else if (apt.status === 'cancelled') psychologistCancelledApts++;
      else if (apt.status === 'no_show') noShowApts++;
    }

    const totalConcludedAppointments = completedApts + patientCancelledApts + noShowApts;
    const attendanceRate = totalConcludedAppointments > 0 ? Math.round((completedApts / totalConcludedAppointments) * 100) : 100;

    // Follow-up task completion
    const allTasks = (await firebaseRtdbAdapter.get('followUpTasks')) || {};
    const patientTasks = Object.values(allTasks).filter((t) => t.patientId === patientId);
    const completedTasks = patientTasks.filter((t) => t.status === 'completed').length;
    const taskCompletionRate = patientTasks.length > 0 ? Math.round((completedTasks / patientTasks.length) * 100) : 0;

    // 4. Unified Patient Clinical Timeline
    const timeline = [];

    // Add completed sessions
    const allSessions = (await firebaseRtdbAdapter.get('sessionRecords')) || {};
    const patientSessions = Object.values(allSessions).filter((s) => s.patientId === patientId);
    for (const s of patientSessions) {
      timeline.push({
        type: 'session',
        id: s.id || s.sessionId,
        title: `Clinical Consultation (${s.sessionMode || 'Session'})`,
        date: s.actualStartTime || s.scheduledAt || s.createdAt,
        status: s.sessionStatus || 'completed',
        summary: s.notesFinalized ? 'Clinical documentation finalized and signed.' : 'Session completed.',
      });
    }

    // Add assessment submissions
    for (const res of allResults) {
      timeline.push({
        type: 'assessment',
        id: res.id,
        title: `Completed ${res.instrumentName}`,
        date: res.submittedAt,
        status: res.reviewStatus,
        summary: `Score: ${res.totalScore}/${res.maxScore} (${res.severityCategory})`,
        hasCriticalSafetySignal: res.hasCriticalSafetySignal,
      });
    }

    // Add treatment plan milestones
    for (const p of patientPlans) {
      timeline.push({
        type: 'treatment_plan',
        id: p.id,
        title: `Treatment Plan: ${p.title}`,
        date: p.approvedAt || p.createdAt,
        status: p.status,
        summary: `${p.goals?.length || 0} therapeutic goals established.`,
      });
    }

    // Sort timeline latest first
    timeline.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return {
      patientId,
      assessments: instrumentMetrics,
      instrumentMetrics,
      assessmentsByInstrument,
      goals: goalsMetrics,
      goalMetrics: goalsMetrics,
      attendance: {
        totalAppointments: patientAppointments.length,
        completedSessions: completedApts,
        scheduledUpcoming: scheduledApts,
        patientCancellations: patientCancelledApts,
        psychologistCancellations: psychologistCancelledApts,
        noShows: noShowApts,
        attendanceRate,
        taskCompletionRate,
        totalTasksAssigned: patientTasks.length,
        completedTasks,
      },
      attendanceMetrics: {
        totalAppointments: patientAppointments.length,
        completedSessions: completedApts,
        scheduledUpcoming: scheduledApts,
        patientCancellations: patientCancelledApts,
        psychologistCancellations: psychologistCancelledApts,
        noShows: noShowApts,
        attendanceRate,
        taskCompletionRate,
        totalTasksAssigned: patientTasks.length,
        completedTasks,
      },
      timeline: timeline.slice(0, 20), // Top 20 chronological events
      careTimeline: timeline.slice(0, 20),
    };
  },

  /**
   * Computes aggregate clinical practice metrics for psychologist dashboard
   */
  getPracticeAnalytics: async (psychologistId, userRole) => {
    if (userRole !== 'psychologist') {
      const err = new Error('Access denied. Psychologist role required.');
      err.status = 403;
      throw err;
    }

    const assignedPatients = await clinicalService.getAssignedPatients(psychologistId);
    const patientIds = new Set(assignedPatients.map((p) => p.id));

    const allApts = (await firebaseRtdbAdapter.get('appointments')) || {};
    const psychologistApts = Object.values(allApts).filter((a) => a.psychologistId === psychologistId);

    const allResults = (await firebaseRtdbAdapter.get('assessmentResults')) || {};
    const psychologistResults = Object.values(allResults).filter((r) => r.psychologistId === psychologistId);

    const allRiskFlags = (await firebaseRtdbAdapter.get('riskReviewFlags')) || {};
    const pendingRiskFlags = Object.values(allRiskFlags).filter(
      (f) => f.psychologistId === psychologistId && f.reviewStatus === 'pending_review'
    );

    const allSessions = (await firebaseRtdbAdapter.get('sessionRecords')) || {};
    const unfinalizedSessions = Object.values(allSessions).filter(
      (s) => s.psychologistId === psychologistId && s.sessionStatus === 'completed' && !s.notesFinalized
    );

    return {
      totalActivePatients: assignedPatients.length,
      totalAppointments: psychologistApts.length,
      totalAssessmentsCompleted: psychologistResults.length,
      pendingRiskReviewsCount: pendingRiskFlags.length,
      unfinalizedDocumentationCount: unfinalizedSessions.length,
      pendingRiskFlags: pendingRiskFlags.slice(0, 5),
    };
  },
};
