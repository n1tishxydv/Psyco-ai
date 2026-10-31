# PSYCO AI — PHASE 3 ARCHITECTURE ASSESSMENT
**Psychologist Clinical Workspace, Independent Practice Architecture & Clinical Management Review**

**Version:** 3.0  
**Date:** 2026-10-31  
**Scope:** Clinical Practice Operations, Independent Practitioner Enablement, Multi-Location Management, Clinic Affiliation Hierarchy & Patient Roster Care

---

## 1. Executive Summary & Objective
Psyco AI provides a secure, clinically ethical mental health practice management platform. Phase 1 established zero-trust authentication, ReBAC role isolation, and database security rules. Phase 2 transformed the patient portal into an accessible, guided, and trustworthy experience. 

The primary objective of Phase 3 is to transform the psychologist portal into an autonomous, professional **Clinical Practice Management Workspace**. Crucially, the platform must decouple the psychologist from mandatory physical clinic employment. Independent clinicians must be able to register, configure their practice brand, specify working hours and availability, accept and conduct consultations (telehealth via Google Meet or in-person at their private practice location), manage assigned patients, and document clinical encounters (SOAP, DAP, treatment plans) without ever requiring a clinic affiliation or administrator intervention.

---

## 2. Existing Architecture & Baseline Assessment

### 2.1 Backend Foundations
1. **Psychologist Identity & Verification**:
   - Path: `psychologists/${psychologistId}`
   - Approval gate: Psychologists must possess `approvalStatus === 'approved'` to activate public booking or access clinical charting (`requireVerifiedPsychologist`).
2. **Scheduling Engine**:
   - Path: `availability/${psychologistId}`
   - Configures weekly schedules, break intervals, buffer times, blocked dates, and advance booking windows. Computes conflict-free intervals authoritative on the backend.
3. **Clinical Relationship (ReBAC)**:
   - `assertTherapeuticRelationship` in `clinical.service.js` strictly verifies clinician approval and an active appointment or direct patient assignment (`patient.assignedPsychologistIds[psychologistId]`).
   - Administrative lockout (`blockAdminFromClinicalRecords`) strictly prevents platform administrators or clinic managers from viewing private psychotherapy notes or clinical session transcripts.
4. **Google Calendar & Meet**:
   - `googleCalendarAdapter.js` handles per-clinician OAuth tokens and automatic Google Meet link creation upon appointment confirmation.

### 2.2 Gaps Identified in Existing Implementation
1. **Clinic Dependency Assumption**:
   - Previous schemas assumed a single `clinicAddress` field directly on the psychologist profile, conflating independent private practices with external clinics.
   - If an independent psychologist practiced purely online, legacy flows did not cleanly articulate the absence of an offline office.
2. **Lack of Practice Context Separation**:
   - Hybrid clinicians operating both a private practice and a clinic affiliation lacked a context switcher, risking appointment or patient confusion between distinct practice operational scopes.
3. **Disjointed Setup Experience**:
   - Setting up a practice required navigating multiple disconnected screens (Profile, Availability, System Settings) rather than a guided, reassuring onboarding wizard.
4. **Calendar View Limitations**:
   - The psychologist calendar was constrained primarily to single-day or list views rather than comprehensive multi-view (Day, Week, Month, Agenda) scheduling.

---

## 3. Practice Arrangement Architecture

Psyco AI explicitly models three distinct practice configurations:

### 3.1 Arrangement A: Independent Practice
- **Description**: The psychologist operates as an autonomous private practitioner.
- **Data Model**: Owned workspace stored under `practices/indep_${psychologistId}` with `ownerUid === psychologistId` and `type === 'independent'`.
- **Requirements**:
  - No clinic ID or clinic administrator approval is required.
  - Profile features custom practice branding and bio.
  - Consultation modes: In-Person, Online Video (Google Meet), or Both.
  - If Online-Only, physical office address is **strictly optional**.
  - Multi-location support: Psychologists with multiple private offices can register distinct locations (`practiceLocations`).
  - Clinician connects their personal Google Calendar account.
  - Direct patient booking and management under the clinician's private practice.

### 3.2 Arrangement B: Clinic-Affiliated Practice
- **Description**: The psychologist practices under a registered clinic entity.
- **Data Model**: Registered clinic entity in `practices/${clinicId}` (`type === 'clinic'`) with an explicit membership record in `practiceMemberships/${membershipId}` (`status === 'approved'`).
- **Requirements**:
  - Affiliation requires affirmative approval by the clinic's authorized representative.
  - Clinician adopts clinic-authorized practice locations and clinic operating hours.
  - Clinic administrators cannot view private clinical notes or psychotherapy transcripts.

### 3.3 Arrangement C: Hybrid Practice
- **Description**: The psychologist operates their independent private practice while also maintaining one or more authorized clinic affiliations.
- **Data Model**: Holds `practices/indep_${psychologistId}` and approved memberships in `practiceMemberships/`. Active practice context is stored in `psychologist.activePracticeId`.
- **Requirements**:
  - UI provides an explicit **Practice Context Switcher** in the top navigation.
  - Active practice context determines:
    - Which locations are available for appointments.
    - Which patient appointments and requests are spotlighted.
    - Which calendar schedule governs the clinician's active day.
  - Absolute data isolation: Clinic records do not leak into private practice views, and private practice records are never visible to clinic members.

---

## 4. Database Schema Specifications (Firebase RTDB Text/JSON)

### 4.1 Independent Practice Workspace (`practices/${practiceId}`)
```json
{
  "id": "indep_psych_staging_01",
  "ownerUid": "psych_staging_01",
  "type": "independent",
  "practiceName": "Dr. Alex Mercer Psychological Practice",
  "professionalBio": "Specializing in anxiety disorders and mindfulness-based CBT.",
  "contactEmail": "dr.mercer@example.com",
  "contactPhone": "+91 98765 43210",
  "timezone": "Asia/Kolkata",
  "offeredModes": "both",
  "defaultMode": "in_person",
  "locations": [
    {
      "id": "loc_staging_01",
      "name": "Main Counseling Office",
      "address": {
        "line1": "Suite 302, Green Glen Towers",
        "city": "Bengaluru",
        "state": "Karnataka",
        "postalCode": "560103"
      },
      "isDefault": true,
      "isActive": true
    }
  ],
  "calendarSync": {
    "connected": false,
    "email": null
  },
  "setupCompleted": true,
  "createdAt": "2026-10-31T06:00:00.000Z",
  "updatedAt": "2026-10-31T06:00:00.000Z"
}
```

### 4.2 Practice Memberships (`practiceMemberships/${membershipId}`)
```json
{
  "id": "mem_staging_01",
  "psychologistId": "psych_staging_01",
  "clinicId": "clinic_staging_central",
  "clinicName": "MindCare Wellness Institute",
  "role": "psychologist",
  "status": "approved",
  "grantedAt": "2026-10-31T06:00:00.000Z"
}
```

---

## 5. Security & Clinical Privacy Matrix

| Role | Independent Practice Settings | Clinic Operational Settings | Patient Chart & Notes (SOAP) | Telehealth Meet Link |
|---|---|---|---|---|
| **Independent Psychologist** | Full Control (Owner) | N/A | Full Clinical Control (Self) | Full Access (Host) |
| **Clinic-Affiliated Psychologist** | Full Control (Personal Practice) | View Only / Schedule Input | Full Clinical Control (Assigned Patient) | Full Access (Host) |
| **Practice / Clinic Manager** | Operational Scheduling | Operational Scheduling | **STRICTLY PROHIBITED (403)** | Allowed for Scheduling Assistance |
| **Platform Administrator** | Platform Diagnostics | Platform Diagnostics | **STRICTLY PROHIBITED (403)** | **PROHIBITED (403)** |
| **Patient** | View Public Profile & Booking | View Public Profile & Booking | Self Records Only via Care Portal | Participant Access (Confirmed Only) |

---

## 6. Implementation Dependencies & Execution Sequence
1. **Service & API Layer (`backend/src/services/practice.service.js`, `practice.routes.js`)**:
   Implement practice workspace retrieval, settings mutation, location management, clinic memberships, and context switching.
2. **Setup Wizard (`frontend/src/features/psychologists/PracticeSetupPage.jsx`)**:
   Build the 6-step setup flow for onboarding clinicians into independent, clinic, or hybrid practice.
3. **Unified Dashboard (`frontend/src/features/psychologists/PsychologistDashboard.jsx`)**:
   Upgrade to a responsive, context-aware command center with live metrics, schedule spotlights, and appointment request handlers.
4. **Patient Management & Chart (`PatientDirectoryPage.jsx`, `PatientChartPage.jsx`)**:
   Introduce patient category filters, sorting, search, and integrated clinical history.
5. **Calendar Suite (`PsychologistCalendarPage.jsx`)**:
   Multi-view schedule (Day, Week, Month, Agenda), conflict buffer visualization, and walk-in scheduling.
6. **Automated Testing & Documentation Sign-off**:
   Validate with `npm --prefix backend test`, staging frontend build, and generate complete documentation suite.
