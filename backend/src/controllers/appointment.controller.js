import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { schedulingService } from '../services/scheduling.service.js';
import { notificationService } from '../services/notification.service.js';
import { googleCalendarAdapter } from '../integrations/googleCalendar/googleCalendarAdapter.js';
import { auditService } from '../services/audit.service.js';
import { logger } from '../utils/logger.js';

export async function createAppointment(req, res, next) {
  try {
    let {
      psychologistId,
      startTime,
      endTime,
      date,
      sessionMode,
      mode,
      reason = '',
      patientNotes = '',
    } = req.body;

    sessionMode = sessionMode || mode || 'in_person';
    reason = reason || patientNotes || '';

    // If date is passed and times are HH:MM, convert to ISO 8601 UTC
    if (date && /^\d{2}:\d{2}$/.test(startTime)) {
      startTime = `${date}T${startTime}:00.000Z`;
    }
    if (date && /^\d{2}:\d{2}$/.test(endTime)) {
      endTime = `${date}T${endTime}:00.000Z`;
    }
    const user = req.user;

    // Verify psychologist existence & active status
    let psychRecord = await firebaseRtdbAdapter.get(`psychologists/${psychologistId}`);
    if (!psychRecord) {
      const userRec = await firebaseRtdbAdapter.get(`users/${psychologistId}`);
      if (userRec && userRec.role === 'psychologist') {
        psychRecord = {
          uid: psychologistId,
          fullName: userRec.fullName || 'Clinical Psychologist',
          licenseNumber: 'RCI-CLINICAL-PRACTICE',
          bio: 'Specialized clinical psychologist focused on evidence-based mental healthcare.',
          specializations: ['Cognitive Behavioral Therapy (CBT)', 'Anxiety & Depression'],
          qualifications: ['M.Phil Clinical Psychology', 'Licensed Clinical Practitioner'],
          languages: ['English', 'Hindi'],
          offeredModes: 'both',
          defaultMode: 'in_person',
          approvalStatus: 'approved',
          timezone: 'Asia/Kolkata',
          createdAt: userRec.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await firebaseRtdbAdapter.set(`psychologists/${psychologistId}`, psychRecord);
      }
    }
    if (!psychRecord) {
      return errorResponse(res, 'Psychologist not found or inactive.', 404, 'PSYCHOLOGIST_NOT_FOUND');
    }

    // Verify mode compatibility
    const offeredModes = psychRecord.offeredModes || 'both';
    if (offeredModes !== 'both' && offeredModes !== sessionMode) {
      return errorResponse(
        res,
        `Psychologist only offers ${offeredModes.replace('_', ' ')} consultations.`,
        400,
        'UNSUPPORTED_SESSION_MODE'
      );
    }

    // Enforce booking concurrency & conflict detection
    await schedulingService.assertNoConflicts(psychologistId, startTime, endTime);

    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionPin = schedulingService.generateSessionPin();
    const now = new Date().toISOString();
    const durationMinutes = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);

    const isPsychologistBooking = user.role === 'psychologist';
    const patientId = isPsychologistBooking ? req.body.patientId || 'patient_direct' : user.uid;

    // Fetch patient snapshot
    const patientRecord = await firebaseRtdbAdapter.get(`patients/${patientId}`);
    const patientName = patientRecord?.preferredName || patientRecord?.fullName || user.fullName || 'Patient';
    const psychName = psychRecord.fullName || 'Psychologist';

    const locationDetails = sessionMode === 'in_person'
      ? {
          type: 'clinic',
          addressOrUrl: psychRecord.clinicAddress
            ? `${psychRecord.clinicAddress.line1 || ''}, ${psychRecord.clinicAddress.city || ''}`
            : 'Clinician Practice Clinic',
        }
      : {
          type: 'google_meet',
          addressOrUrl: 'Pending confirmation',
        };

    const initialStatus = isPsychologistBooking ? 'confirmed' : 'pending';

    const appointment = {
      id: appointmentId,
      patientId,
      patientName,
      psychologistId,
      psychologistName: psychName,
      startTime,
      endTime,
      durationMinutes,
      sessionMode,
      mode: sessionMode,
      date: startTime.includes('T') ? startTime.split('T')[0] : startTime,
      status: initialStatus,
      sessionPin,
      location: locationDetails,
      reason: reason || null,
      patientNotes: reason || null,
      calendarSyncStatus: 'not_connected',
      googleCalendarEventId: null,
      meetStatus: sessionMode === 'online' ? 'pending' : 'not_required',
      googleMeetUrl: null,
      googleMeetLink: null,
      history: [
        {
          timestamp: now,
          actor: user.role,
          action: 'CREATED',
          status: initialStatus,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Save to RTDB
    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

    // If psychologist created and confirmed, attempt Google Calendar event sync
    if (initialStatus === 'confirmed') {
      const syncResult = await googleCalendarAdapter.createCalendarEvent(appointment);
      if (syncResult.googleCalendarEventId) {
        appointment.calendarSyncStatus = syncResult.calendarSyncStatus;
        appointment.googleCalendarEventId = syncResult.googleCalendarEventId;
        appointment.googleMeetUrl = syncResult.googleMeetUrl;
        appointment.meetStatus = syncResult.meetStatus;
        if (syncResult.googleMeetUrl) {
          appointment.location.addressOrUrl = syncResult.googleMeetUrl;
        }
        await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);
      }
    }

    // Dispatch persistent notifications
    if (!isPsychologistBooking) {
      await notificationService.notify({
        recipientUid: psychologistId,
        type: 'appointment_request',
        title: 'New Appointment Request',
        message: `${patientName} requested an appointment on ${new Date(startTime).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        appointmentId,
        actionUrl: `/psychologist/appointments`,
      });
    }

    await auditService.record({
      action: 'APPOINTMENT_CREATED',
      userId: user.uid,
      details: { appointmentId, psychologistId, patientId, sessionMode },
    });

    return successResponse(res, { appointment }, 201);
  } catch (err) {
    if (err.code === 'SLOT_ALREADY_RESERVED') {
      return errorResponse(res, err.message, 409, 'SLOT_ALREADY_RESERVED');
    }
    next(err);
  }
}

export async function getAppointments(req, res, next) {
  try {
    const user = req.user;
    const allAppointments = await firebaseRtdbAdapter.get('appointments') || {};
    let appointments = Object.values(allAppointments);

    if (user.role === 'patient') {
      appointments = appointments.filter((a) => a.patientId === user.uid);
    } else if (user.role === 'psychologist') {
      appointments = appointments.filter((a) => a.psychologistId === user.uid);
    } else if (user.role !== 'admin') {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    // Optional query filtering
    const { status, from, to } = req.query;
    if (status) {
      appointments = appointments.filter((a) => a.status === status);
    }
    if (from) {
      appointments = appointments.filter((a) => a.startTime >= from);
    }
    if (to) {
      appointments = appointments.filter((a) => a.startTime <= to);
    }

    // Sort by startTime ascending
    appointments.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return successResponse(res, { appointments, count: appointments.length });
  } catch (err) {
    next(err);
  }
}

export async function getAppointmentById(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const user = req.user;
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404, 'NOT_FOUND');
    }

    // Ownership check
    if (user.role === 'patient' && appointment.patientId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }
    if (user.role === 'psychologist' && appointment.psychologistId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    return successResponse(res, { appointment });
  } catch (err) {
    next(err);
  }
}

export async function acceptAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const user = req.user;
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404, 'NOT_FOUND');
    }

    if (appointment.psychologistId !== user.uid) {
      return errorResponse(res, 'You can only accept appointments assigned to your practice.', 403, 'FORBIDDEN');
    }

    if (appointment.status === 'confirmed') {
      return errorResponse(res, 'Appointment is already confirmed.', 400, 'ALREADY_CONFIRMED');
    }

    // Revalidate concurrency & conflicts before confirming
    await schedulingService.assertNoConflicts(user.uid, appointment.startTime, appointment.endTime, appointmentId);

    const now = new Date().toISOString();
    appointment.status = 'confirmed';
    appointment.updatedAt = now;
    appointment.history.push({
      timestamp: now,
      actor: 'psychologist',
      action: 'ACCEPTED',
      status: 'confirmed',
    });

    // Attempt Google Calendar Event & Meet conference creation
    const syncResult = await googleCalendarAdapter.createCalendarEvent(appointment);
    appointment.calendarSyncStatus = syncResult.calendarSyncStatus;
    appointment.googleCalendarEventId = syncResult.googleCalendarEventId;
    appointment.googleMeetUrl = syncResult.googleMeetUrl;
    appointment.meetStatus = syncResult.meetStatus;
    if (syncResult.googleMeetUrl) {
      appointment.location.addressOrUrl = syncResult.googleMeetUrl;
    }

    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

    // Notify patient
    await notificationService.notify({
      recipientUid: appointment.patientId,
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${appointment.psychologistName} on ${new Date(appointment.startTime).toLocaleDateString()} has been confirmed.`,
      appointmentId,
      actionUrl: `/patient/appointments`,
    });

    await auditService.record({
      action: 'APPOINTMENT_ACCEPTED',
      userId: user.uid,
      details: { appointmentId, patientId: appointment.patientId },
    });

    return successResponse(res, { appointment, message: 'Appointment confirmed successfully.' });
  } catch (err) {
    if (err.code === 'SLOT_ALREADY_RESERVED') {
      return errorResponse(res, err.message, 409, 'SLOT_ALREADY_RESERVED');
    }
    next(err);
  }
}

export async function rejectAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const user = req.user;
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404, 'NOT_FOUND');
    }

    if (appointment.psychologistId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    const now = new Date().toISOString();
    appointment.status = 'rejected';
    appointment.rejectionReason = reason;
    appointment.updatedAt = now;
    appointment.history.push({
      timestamp: now,
      actor: 'psychologist',
      action: 'REJECTED',
      reason,
      status: 'rejected',
    });

    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

    // Notify patient
    await notificationService.notify({
      recipientUid: appointment.patientId,
      type: 'appointment_rejected',
      title: 'Appointment Request Declined',
      message: `Your appointment request for ${new Date(appointment.startTime).toLocaleDateString()} could not be accommodated. Reason: ${reason}`,
      appointmentId,
      actionUrl: `/patient/appointments`,
    });

    await auditService.record({
      action: 'APPOINTMENT_REJECTED',
      userId: user.uid,
      details: { appointmentId, reason },
    });

    return successResponse(res, { appointment, message: 'Appointment rejected.' });
  } catch (err) {
    next(err);
  }
}

export async function proposeAlternativeSlot(req, res, next) {
  try {
    const { appointmentId } = req.params;
    let { startTime, endTime, date, sessionMode, mode, note, reason } = req.body;
    const user = req.user;
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404, 'NOT_FOUND');
    }

    if (appointment.psychologistId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    sessionMode = sessionMode || mode || appointment.sessionMode;
    note = note || reason || '';

    // If date is passed and times are HH:MM, convert to ISO 8601 UTC
    if (date && /^\d{2}:\d{2}$/.test(startTime)) {
      startTime = `${date}T${startTime}:00.000Z`;
    }
    if (date && /^\d{2}:\d{2}$/.test(endTime)) {
      endTime = `${date}T${endTime}:00.000Z`;
    }

    // Verify proposed slot has no conflicts
    await schedulingService.assertNoConflicts(user.uid, startTime, endTime, appointmentId);

    const now = new Date().toISOString();
    const proposal = {
      startTime,
      endTime,
      sessionMode,
      note,
      proposedAt: now,
    };
    appointment.proposedSlot = proposal;
    appointment.alternativeProposal = proposal;
    appointment.status = 'reschedule_requested';
    appointment.updatedAt = now;
    appointment.history.push({
      timestamp: now,
      actor: 'psychologist',
      action: 'PROPOSED_ALTERNATIVE',
      details: proposal,
    });

    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

    // Notify patient
    await notificationService.notify({
      recipientUid: appointment.patientId,
      type: 'alternative_proposed',
      title: 'New Time Proposed for Appointment',
      message: `Your clinician proposed a new time: ${new Date(startTime).toLocaleString()}. Please review and accept or decline.`,
      appointmentId,
      actionUrl: `/patient/appointments`,
    });

    return successResponse(res, { appointment, message: 'Alternative slot proposed to patient.' });
  } catch (err) {
    if (err.code === 'SLOT_ALREADY_RESERVED') {
      return errorResponse(res, err.message, 409, 'SLOT_ALREADY_RESERVED');
    }
    next(err);
  }
}

export async function respondToAlternative(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const { action } = req.body; // 'accept' | 'decline'
    const user = req.user;
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404, 'NOT_FOUND');
    }

    if (appointment.patientId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    if (!appointment.proposedSlot) {
      return errorResponse(res, 'No alternative slot has been proposed for this appointment.', 400, 'NO_PROPOSAL');
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // Re-assert no conflicts before locking
      await schedulingService.assertNoConflicts(
        appointment.psychologistId,
        appointment.proposedSlot.startTime,
        appointment.proposedSlot.endTime,
        appointmentId
      );

      appointment.startTime = appointment.proposedSlot.startTime;
      appointment.endTime = appointment.proposedSlot.endTime;
      if (appointment.proposedSlot.sessionMode) {
        appointment.sessionMode = appointment.proposedSlot.sessionMode;
      }
      appointment.status = 'confirmed';
      appointment.proposedSlot = null;
      appointment.updatedAt = now;
      appointment.history.push({
        timestamp: now,
        actor: 'patient',
        action: 'ACCEPTED_ALTERNATIVE',
        status: 'confirmed',
      });

      // Update external Google Calendar event if synced
      if (appointment.googleCalendarEventId) {
        await googleCalendarAdapter.updateCalendarEvent(appointment);
      }

      await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

      // Notify psychologist
      await notificationService.notify({
        recipientUid: appointment.psychologistId,
        type: 'reschedule_approved',
        title: 'Alternative Slot Accepted',
        message: `${appointment.patientName} accepted your proposed time for ${new Date(appointment.startTime).toLocaleString()}.`,
        appointmentId,
        actionUrl: `/psychologist/appointments`,
      });

      return successResponse(res, { appointment, message: 'Alternative appointment time confirmed.' });
    } else {
      appointment.status = 'rejected';
      appointment.proposedSlot = null;
      appointment.updatedAt = now;
      appointment.history.push({
        timestamp: now,
        actor: 'patient',
        action: 'DECLINED_ALTERNATIVE',
        status: 'rejected',
      });

      await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

      await notificationService.notify({
        recipientUid: appointment.psychologistId,
        type: 'appointment_update',
        title: 'Alternative Slot Declined',
        message: `${appointment.patientName} declined the proposed alternative time.`,
        appointmentId,
        actionUrl: `/psychologist/appointments`,
      });

      return successResponse(res, { appointment, message: 'Proposed time declined.' });
    }
  } catch (err) {
    if (err.code === 'SLOT_ALREADY_RESERVED') {
      return errorResponse(res, err.message, 409, 'SLOT_ALREADY_RESERVED');
    }
    next(err);
  }
}

export async function rescheduleAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const { newStartTime, newEndTime, reason = '' } = req.body;
    const user = req.user;
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404, 'NOT_FOUND');
    }

    const isPatient = user.role === 'patient';
    const isPsychologist = user.role === 'psychologist';

    if (isPatient && appointment.patientId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }
    if (isPsychologist && appointment.psychologistId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    // Check reschedule cutoff policy
    const avail = await schedulingService.getAvailability(appointment.psychologistId);
    const cutoffHours = avail.reschedulingPolicy?.cutoffHours ?? 24;
    const hoursUntilAppointment = (new Date(appointment.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

    const insideCutoff = hoursUntilAppointment < cutoffHours;

    // Check conflict on new slot
    await schedulingService.assertNoConflicts(appointment.psychologistId, newStartTime, newEndTime, appointmentId);

    const now = new Date().toISOString();

    if (isPatient && insideCutoff) {
      // Inside cutoff: patient submits reschedule request requiring clinician confirmation
      appointment.status = 'reschedule_requested';
      appointment.rescheduleRequest = {
        newStartTime,
        newEndTime,
        reason,
        requestedAt: now,
      };
      appointment.updatedAt = now;
      appointment.history.push({
        timestamp: now,
        actor: 'patient',
        action: 'RESCHEDULE_REQUESTED_INSIDE_CUTOFF',
        details: appointment.rescheduleRequest,
      });

      await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

      await notificationService.notify({
        recipientUid: appointment.psychologistId,
        type: 'reschedule_requested',
        title: 'Late Rescheduling Request',
        message: `${appointment.patientName} requested to reschedule within the ${cutoffHours}h cutoff window.`,
        appointmentId,
        actionUrl: `/psychologist/appointments`,
      });

      return successResponse(res, {
        appointment,
        message: `Rescheduling request submitted for clinician approval (within ${cutoffHours}h policy cutoff).`,
      });
    }

    // Direct reschedule permitted
    const previousTime = { startTime: appointment.startTime, endTime: appointment.endTime };
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    appointment.updatedAt = now;
    appointment.history.push({
      timestamp: now,
      actor: user.role,
      action: 'RESCHEDULED',
      previousTime,
      reason,
    });

    // Sync to Google Calendar
    if (appointment.googleCalendarEventId) {
      await googleCalendarAdapter.updateCalendarEvent(appointment);
    }

    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

    const otherUid = isPatient ? appointment.psychologistId : appointment.patientId;
    if (otherUid && otherUid !== 'patient_direct') {
      await notificationService.notify({
        recipientUid: otherUid,
        type: 'appointment_update',
        title: 'Appointment Rescheduled',
        message: `Appointment rescheduled to ${new Date(newStartTime).toLocaleString()}.`,
        appointmentId,
        actionUrl: isPatient ? '/psychologist/appointments' : '/patient/appointments',
      });
    }

    return successResponse(res, { appointment, message: 'Appointment rescheduled successfully.' });
  } catch (err) {
    if (err.code === 'SLOT_ALREADY_RESERVED') {
      return errorResponse(res, err.message, 409, 'SLOT_ALREADY_RESERVED');
    }
    next(err);
  }
}

export async function cancelAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const user = req.user;
    const appointment = await firebaseRtdbAdapter.get(`appointments/${appointmentId}`);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404, 'NOT_FOUND');
    }

    const isPatient = user.role === 'patient';
    const isPsychologist = user.role === 'psychologist';

    if (isPatient && appointment.patientId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }
    if (isPsychologist && appointment.psychologistId !== user.uid) {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    const avail = await schedulingService.getAvailability(appointment.psychologistId);
    const cutoffHours = avail.cancellationPolicy?.cutoffHours ?? 24;
    const hoursUntilApt = (new Date(appointment.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

    const insideCutoff = hoursUntilApt < cutoffHours;
    const now = new Date().toISOString();

    if (isPatient && insideCutoff) {
      // Inside cutoff: mark cancellation requested
      appointment.status = 'cancellation_requested';
      appointment.cancellationReason = reason;
      appointment.updatedAt = now;
      appointment.history.push({
        timestamp: now,
        actor: 'patient',
        action: 'CANCELLATION_REQUESTED_INSIDE_CUTOFF',
        reason,
      });

      await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

      await notificationService.notify({
        recipientUid: appointment.psychologistId,
        type: 'appointment_update',
        title: 'Late Cancellation Request',
        message: `${appointment.patientName} requested to cancel within the ${cutoffHours}h cutoff window.`,
        appointmentId,
        actionUrl: `/psychologist/appointments`,
      });

      return successResponse(res, {
        appointment,
        message: `Cancellation requested. Because this is within ${cutoffHours}h of your session, clinical review is required.`,
      });
    }

    // Direct cancellation
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = user.role;
    appointment.updatedAt = now;
    appointment.history.push({
      timestamp: now,
      actor: user.role,
      action: 'CANCELLED',
      reason,
    });

    // Delete or cancel Google Calendar event if synced
    if (appointment.googleCalendarEventId) {
      await googleCalendarAdapter.deleteCalendarEvent(appointment.psychologistId, appointment.googleCalendarEventId);
    }

    await firebaseRtdbAdapter.set(`appointments/${appointmentId}`, appointment);

    const otherUid = isPatient ? appointment.psychologistId : appointment.patientId;
    if (otherUid && otherUid !== 'patient_direct') {
      await notificationService.notify({
        recipientUid: otherUid,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Appointment on ${new Date(appointment.startTime).toLocaleDateString()} has been cancelled. Reason: ${reason}`,
        appointmentId,
        actionUrl: isPatient ? '/psychologist/appointments' : '/patient/appointments',
      });
    }

    await auditService.record({
      action: 'APPOINTMENT_CANCELLED',
      userId: user.uid,
      details: { appointmentId, reason, cancelledBy: user.role },
    });

    return successResponse(res, { appointment, message: 'Appointment cancelled successfully.' });
  } catch (err) {
    next(err);
  }
}
