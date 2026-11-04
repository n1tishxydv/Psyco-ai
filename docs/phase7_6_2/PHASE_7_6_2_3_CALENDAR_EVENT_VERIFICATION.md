# Phase 7.6.2.3: Calendar Event Lifecycle & Clinical Privacy Audit

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_3_CALENDAR_EVENT_VERIFICATION.md`  
**Classification**: Clinical Data Privacy & Synchronization Specification  

---

## 1. Executive Summary

This specification documents the behavioral and clinical privacy invariants governing Google Calendar event creation, modification, and cancellation within Psyco AI.

Under healthcare data protection regulations (HIPAA, GDPR, DISHA), calendar events published to external providers (such as Google Calendar) must never contain protected health information (PHI), clinical diagnostic codes, session transcripts, or participant crisis indicators.

---

## 2. Event Payload Sanitization Specification

When Psyco AI synchronizes an appointment to an integrated Google Calendar:

### 2.1 Permitted Event Attributes
- **Summary**: `Consultation — Psyco AI` (generic non-revealing title).
- **Description**: `Scheduled consultation on the Psyco AI platform. Please sign in to your authenticated portal to access consultation details.`
- **Location**: `Psyco AI Secure Telehealth Room` (or encrypted video room URL).
- **Start / End Times**: Exact ISO-8601 strings with timezone specification (`Asia/Kolkata` default).
- **Extended Properties (Private Metadata)**:
  - `psyco_appointment_id`: Internal appointment UUID for duplicate prevention and lifecycle tracking.
  - `psyco_role`: Role of the integrating user.

### 2.2 Prohibited Data Elements (Strict Privacy Invariant)
The following elements are strictly forbidden from being sent to Google Calendar APIs:
- Patient full legal name (in summaries or descriptions visible to others).
- Clinical diagnoses, DSM-5 / ICD-10 codes, or intake responses.
- Session clinical notes, SOAP documentation, or transcription text.
- Suicide risk assessments or crisis review flags.
- Firebase Authentication tokens, access tokens, or refresh tokens.

---

## 3. Event Lifecycle Operations

### 3.1 Creation & Duplicate Prevention
- Prior to creating an event, `googleCalendarAdapter` queries the user's connection metadata in Firebase RTDB (`googleCalendarConnections/{uid}/events/{appointmentId}`).
- If an `eventId` already exists, the adapter executes a PATCH / UPDATE operation rather than inserting a duplicate calendar event.

### 3.2 Rescheduling
- When an appointment time is altered in Psyco AI, the scheduling service invokes `googleCalendarAdapter.updateEvent(uid, appointmentId, { startTime, endTime })`.
- The Google Calendar event start and end times are updated without creating a new event ID.

### 3.3 Cancellation
- When an appointment is cancelled, the adapter calls `googleCalendarAdapter.deleteEvent(uid, appointmentId)`.
- If Google Calendar API returns `404 Not Found` (e.g. user manually deleted the event in Google Calendar), the error is caught and handled idempotently.

### 3.4 Disconnection
- When a user clicks "Disconnect Google Calendar", `googleCalendarAdapter.disconnect(uid)` is executed.
- Sensitive access and refresh tokens are wiped from RTDB.
- All internal Psyco AI appointment records remain intact; appointment status is completely decoupled from external calendar connectivity.

---

## 4. Failure Isolation & Graceful Degradation

- Google Calendar synchronization is an auxiliary integration.
- A failure in Google Calendar API (rate limits, invalid tokens, network timeout) **must never cause appointment booking, session finalization, or clinical note saving to fail**.
- Failures are recorded in `auditLog` with `GOOGLE_CALENDAR_SYNC_FAILED`, and the appointment record updates with `calendarSyncStatus: 'FAILED'` while allowing clinical workflows to complete smoothly.
