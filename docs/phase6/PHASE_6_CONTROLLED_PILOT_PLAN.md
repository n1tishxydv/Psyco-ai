# PSYCO AI — PHASE 6 CONTROLLED PILOT PLAN

**Document Identifier:** `PSYCO-PILOT-PLAN-001`  
**Document Version:** 1.0.0  
**Date:** October 31, 2026  
**Target Environment:** Staging (`https://psyco-ai-staging.web.app` / `https://psyco-ai.onrender.com`)  
**Target Database:** `https://psyco-ai-staging-default-rtdb.firebaseio.com`  
**Production Isolation Baseline:** `psyco-9c13d` (**STRICTLY UNTOUCHED — 0 modifications**)  

---

## 1. Pilot Mission & Objectives

The primary objective of the Phase 6 Controlled Pilot is to validate end-to-end clinical workflows, platform operations, and usability in a realistic staging setting prior to any commercial rollout. 

### Key Verification Goals:
1. Validate seamless interaction between Patients, Psychologists, and Practice Administrators.
2. Verify independent, clinic-affiliated, and hybrid practice configurations in live operation.
3. Confirm that the Human-in-the-Loop AI documentation copilot assists without autonomous clinical finalization.
4. Verify strict observation of the Administrator Clinical Privacy Wall under concurrent operational load.
5. Validate system stability, token renewal behavior, and responsive design across desktop and mobile devices.

---

## 2. Strict Rules of Engagement

1. **Staging Environment Only:** All pilot activities must occur exclusively on `https://psyco-ai-staging.web.app` and `https://psyco-ai.onrender.com`.
2. **Production Safeguard:** Production project `psyco-9c13d` is strictly quarantined and must never be accessed or targeted.
3. **Fictional Data Mandatory:** Real patient identifying information (PII) or real clinical history is strictly forbidden. All test accounts, consultations, and intake responses must be synthetic and fictional.
4. **Zero Binary Media Invariant:** Permanent audio, video, or raster image files must never be uploaded or stored. Only transient audio buffers for transcription and text/JSON structured data are permitted.
5. **No Code/Rule Modifications During Pilot:** No deployments or Firebase rule changes may occur during an active pilot testing window.

---

## 3. Pilot Participant Cohorts & Test Accounts

| Cohort Role | Target Participants | Primary Staging Test Fixtures | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Practice Administrators** | 2 internal operations engineers | `admin_staging_01` (`staging.admin@psyco.clinic`) | Governance, credential review, clinic oversight, audit logs, system telemetry. |
| **Independent Psychologists** | 2 clinical testers | `psych_staging_01` (`staging.psych@psyco.clinic`) | Solo practice setup, availability scheduling, direct patient intake, clinical notes. |
| **Clinic / Hybrid Psychologists** | 2 clinical testers | `psych_staging_02` (Hybrid context) | Clinic roster management, switching active practice context, joint scheduling. |
| **Synthetic Patients** | 4 QA / test participants | `patient_staging_01` (`alex.mercer.test@psyco.clinic`) | Provider discovery, intake completion, booking, video sessions, care plans. |

---

## 4. End-to-End Pilot Workflows

### 4.1 Workflow A: Administrator Operations

```
[Admin Log In]
      │
      ▼
[Review Platform Telemetry] ────► Verify Render backend health & RTDB connectivity
      │
      ▼
[User Governance] ─────────────► Search user accounts, verify roles, test audit reasons
      │
      ▼
[Psychologist Verification] ───► Review pending credentials, verify license, approve status
      │
      ▼
[Clinic Oversight] ────────────► Review clinics, inspect affiliated clinicians, manage status
      │
      ▼
[Support Queue & FAQ CMS] ─────► Process support tickets, moderate public submitted questions
      │
      ▼
[Clinical Barrier Verification] ► Attempt access to patient charts/notes (Confirm 403 Forbidden)
```

1. **Step A1 — Telemetry Monitoring:** Navigate to `/admin/dashboard`. Inspect real-time platform metrics, active clinic tallies, and background worker queue counts.
2. **Step A2 — Clinician Credential Verification:** Open "Pending Clinician Review Queue". Review license number, qualifications, and prescriber credentials for newly registered psychologist. Approve account (`POST /api/v1/admin/psychologists/:id/verify`).
3. **Step A3 — User Governance:** Search for test accounts. Test non-destructive status updates and verify that suspending an account creates an immutable audit log entry.
4. **Step A4 — Support Ticket Resolution:** Open support ticket workspace. Assign priority (`high`), add an internal diagnostic note, and respond with a public message.
5. **Step A5 — FAQ Moderation:** Review submitted public question in moderation queue. Edit question text, assign category, and toggle `published: true`.
6. **Step A6 — Clinical Privacy Lockout Verification:** Attempt direct URL navigation or API query to `/api/v1/clinical/patients/:patientId/chart`. Confirm server strictly blocks access with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`.

---

### 4.2 Workflow B: Psychologist Practice & Clinical Workspace

```
[Psychologist Registration]
      │
      ▼
[Submit Practice Credentials] ──► License, specializations, consultation modes (online/in-person)
      │
      ▼
[Configure Practice Setup] ─────► Option 1: Solo Independent | Option 2: Clinic Affiliated | Option 3: Hybrid
      │
      ▼
[Set Availability Schedule] ────► Working hours (e.g., 09:00-17:00), buffer times, location selection
      │
      ▼
[Session Workspace] ────────────► Review patient intake, initiate session, capture notes
      │
      ▼
[AI-Assisted Copilot] ──────────► Generate draft SOAP note from transcript / session summary
      │
      ▼
[Clinician Review & Signature] ─► Manually review, edit inaccuracies, sign digitally (Finalize)
```

1. **Step B1 — Onboarding & Credentialing:** Register psychologist account. Complete practice profile with license number and therapeutic specializations. Verify initial status is `pending`.
2. **Step B2 — Solo Practice Configuration:** Select "Independent Practice". Configure consultation modes (`in_person` with room details and `online` with default video link).
3. **Step B3 — Availability & Buffer Setup:** Configure working hours for Monday/Wednesday/Friday. Set 15-minute inter-session buffer time to prevent consecutive session fatigue.
4. **Step B4 — Clinic Affiliation & Hybrid Switching:** Submit membership request to test clinic organization. Upon approval, use the context dropdown to switch between "Solo Practice" and "Clinic Practice". Verify patient rosters are isolated.
5. **Step B5 — Patient Intake Review:** Open assigned patient profile. Review presenting concerns and emergency contacts.
6. **Step B6 — Clinical Session Execution:** Open `/psychologist/sessions/:sessionId`. Record session observations.
7. **Step B7 — Human-in-the-Loop AI Copilot:** Trigger Gemini Copilot note draft. Review generated SOAP sections (`Subjective`, `Objective`, `Assessment`, `Plan`). Edit any missing or inaccurate content. Digitally sign the note (`finalize`).
8. **Step B8 — Clinical Note Amendment:** Simulate a documentation correction: amend the finalized note with an explicit clinical justification. Verify version increments to `2` and previous version is archived in audit history.

---

### 4.3 Workflow C: Patient Discovery, Booking & Care Journey

```
[Patient Registration]
      │
      ▼
[Complete Clinical Intake] ─────► Medical history, presenting concerns, emergency contact
      │
      ▼
[Psychologist Directory] ──────► Filter by specialization, language, and session mode
      │
      ▼
[Book Appointment] ─────────────► Select available time-slot, confirm consultation mode
      │
      ▼
[Session Consent] ──────────────► Provide explicit informed consent for clinical documentation
      │
      ▼
[Patient Care Portal] ──────────► View confirmed appointments, care plans, and homework tasks
```

1. **Step C1 — Registration & Onboarding:** Register patient account. Fill out profile details (fictional name, contact number, age).
2. **Step C2 — Structured Clinical Intake:** Complete 4-part intake questionnaire: emergency contact details, presenting symptom severity, medical history, and personal therapy goals.
3. **Step C3 — Directory Provider Discovery:** Access `/find-psychologist`. Use filter pills to locate providers offering "In-Person" sessions in "Anxiety Management".
4. **Step C4 — Appointment Booking:** Select an available clinician slot. Select session mode (`in_person` or `online`). Confirm reservation.
5. **Step C5 — Appointment Conflict Validation:** Attempt to double-book the same slot from another browser session; confirm system prevents collision with HTTP 409 Conflict.
6. **Step C6 — Transcription Consent:** Open pre-session modal. Confirm consent recording (`POST /transcription/consent`). Test consent withdrawal and verify recording is halted.
7. **Step C7 — Rescheduling / Cancellation:** Test patient-initiated cancellation with required cancellation reason. Verify calendar slot is immediately returned to available pool.
8. **Step C8 — Care Plan & Homework:** Open `/patient/care-plan`. Review clinician-assigned homework tasks and mark task as completed.

---

## 5. Pilot Execution Phases & Timeline

```
+----------------------------------------------------------------------------------------------------+
|                                    PILOT EXECUTION SCHEDULE                                        |
+------------------------------------+----------------+----------------------------------------------+
| Phase                              | Duration       | Primary Activity & Deliverables              |
+------------------------------------+----------------+----------------------------------------------+
| Phase 6.1: Technical Smoke Drill   | Day 1          | Verify test accounts, seed synthetic staging |
|                                    |                | data, execute baseline connectivity checks.  |
| Phase 6.2: Internal Simulated Run  | Day 2 - Day 3  | Internal team executes full Workflows A, B,  |
|                                    |                | and C. Record telemetry and feedback.        |
| Phase 6.3: Clinical Safety Drill   | Day 4          | Test edge cases: incorrect AI suggestions,   |
|                                    |                | PHQ-9 Q9 risk flags, note amendments.        |
| Phase 6.4: Recovery & Exit Review  | Day 5          | Execute data recovery drill, review ticket   |
|                                    |                | log, evaluate exit criteria.                 |
+------------------------------------+----------------+----------------------------------------------+
```

---

## 6. Pilot Exit Criteria

To successfully conclude the Phase 6 Controlled Pilot, all of the following exit criteria must be met:

1. **100% Critical Safety Gate Pass:** Zero instances of administrative access to patient clinical notes, transcripts, or intake forms.
2. **100% AI HITL Compliance:** Zero clinical records finalized automatically by AI; 100% of generated notes contain licensed clinician digital signature.
3. **Zero Data Corruption / Leakage:** Zero cross-patient or cross-clinic data leakage observed during hybrid context switching.
4. **Zero Downtime or Uncaught Exceptions:** Staging uptime remains `>99.5%` during pilot runs; zero uncaught fatal exceptions in browser or server logs.
5. **All Test Workflows Executed:** Workflows A, B, and C completed with recorded evidence.
6. **Disaster Recovery Drill Completed:** Staging point-in-time recovery test executed successfully with recovery time `<2 hours`.
