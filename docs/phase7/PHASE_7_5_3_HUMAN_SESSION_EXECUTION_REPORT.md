# PSYCO AI — PHASE 7.5.3
## SUPERVISED HUMAN USABILITY PILOT EXECUTION REPORT

**Phase:** Phase 7.5.3 — Supervised Human Usability Pilot Execution  
**Execution Roles:** Senior UX Researcher, Healthcare SaaS Product Analyst, QA Lead, Human Usability Research Coordinator  
**Target Environment:** Staging Portal (`https://psyco-ai-staging.web.app`) & Staging API (`https://psyco-ai.onrender.com`)  
**Active Backend Commit:** `cb708be1ccdef3ec64cf7b647ef2a56276e73781` (Phase 7.5.2C Verified)  
**Staging Database:** `https://psyco-ai-staging-default-rtdb.firebaseio.com` (`psyco-ai-staging`)  
**Production Database:** `psyco-9c13d` — **STRICTLY UNTOUCHED (Zero mutations)**  
**Current Cohort Status:** All 7 Participant Sessions remain **`NOT STARTED`**  

---

## 1. ETHICAL GOVERNANCE & RESEARCH INTEGRITY CHARTER

In strict adherence to healthcare software evaluation ethics, GCP/ICH clinical trial guidelines, and project directives:

> [!CAUTION]
> ### MANDATORY RESEARCH INTEGRITY DIRECTIVE
> 1. **Zero Artificial Simulation:** Under no circumstances may participant behavior, think-aloud commentary, task durations, Likert ratings, or usability scores be simulated, generated, or fabricated.
> 2. **Authoritative Event-Driven Ledger:** Sessions may transition to `SCHEDULED`, `IN PROGRESS`, or `COMPLETED` **only when an actual human participant physically engages** in the supervised protocol with the designated facilitator.
> 3. **Non-Clinical Synthetic Boundary:** Participants evaluate software usability, information architecture, and ergonomic interaction only. They are not receiving clinical therapy. No actual medical records, protected health information (PHI), or real crisis situations may be submitted.
> 4. **Privacy & Consent:** Consent is obtained prior to commencing tasks. Credentials are distributed via private, 1-to-1 secure channels. No passwords, tokens, or personal identifiers are stored in public reports.

---

## 2. PRE-SESSION TECHNICAL AUDIT & READINESS GATES

Prior to facilitating sessions, the technical operating environment was audited and locked:

| Audit Parameter | Verification Target | Live Value / Evidence | Status |
| :--- | :--- | :--- | :---: |
| **Frontend Accessibility** | `https://psyco-ai-staging.web.app/` | HTTP 200 OK (`text/html; charset=utf-8`) | **PASS** |
| **Backend Health** | `https://psyco-ai.onrender.com/api/v1/health` | `status: "HEALTHY"`, `v24.22.1` | **PASS** |
| **Audited Backend Commit** | Commit SHA Verification | `cb708be1ccdef3ec64cf7b647ef2a56276e73781` | **PASS** |
| **Single-Instance Enforcement** | Render Free Dyno & Process Count | `plan: free`, `pid: 85`, `WEB_CONCURRENCY=1`, 1 Web Container | **PASS** |
| **RTDB Project Alignment** | Staging Database Instance | `psyco-ai-staging` (`alignmentValid: true`) | **PASS** |
| **Production Isolation** | Primary Production Target | `psyco-9c13d` completely untouched | **PASS** |
| **AI Clinical Sandbox** | Gemini Provider Guardrail | `SANDBOX_MOCK_ACTIVE` (`externalCallsBlocked: true`) | **PASS** |
| **Ambient Speech Sandbox** | AssemblyAI Provider Guardrail | `SANDBOX_MOCK_ACTIVE` (`zeroAudioPersistenceEnforced: true`) | **PASS** |
| **Database Mutex State** | Seeders / Restore Scripts | Seeder execution strictly prohibited | **PASS** |

---

## 3. PARTICIPANT COHORT MAPPING & CREDENTIAL GOVERNANCE

The 7 planned human participants represent distinct healthcare ecosystem personas:

| Participant ID | Role / Target Persona | Synthetic Identity UID | Synthetic Email Address | Evaluation Focus |
| :---: | :--- | :--- | :--- | :--- |
| **P1** | System Administrator | `admin_staging_01` | `staging.admin@psyco.clinic` | Governance, practitioner verification, user management, audit logs, clinical privacy lockout |
| **P2** | Lead Psychologist | `psych_staging_01` | `dr.jenkins@psyco.clinic` | Practice settings, working hours, patient roster, SOAP charting, AI Sandbox review & sign-off |
| **P3** | Associate Psychologist | `psych_staging_02` | `dr.vance@psyco.clinic` | Independent availability scheduling, leave periods, clinical reports, ReBAC patient isolation |
| **P4** | Patient (Wave 2) | `patient_staging_01` | `alex.mercer@example.com` | Directory search, psychologist profile, booking flow, multi-step intake form, calendar export |
| **P5** | Patient (Wave 2) | `patient_staging_02` | `maya.lin@example.com` | Directory filtering, booking discovery, intake form submission, appointment cancellation |
| **P6** | Patient (Wave 2) | `patient_staging_03` | `david.chen@example.com` | Practice exploration, booking flow, calendar synchronization, notification management |
| **P7** | Patient (Mobile Focus) | `patient_staging_04` | `elena.rostova@example.com` | Mobile responsive viewport (&le; 420px), touch targets (&ge; 48px), drawer navigation, responsive intake |

*Credential Distribution Rule:* Credentials and temporary staging passwords are communicated out-of-band via secure direct transmission. Never record credentials in commit logs or documentation.

---

## 4. MASTER PARTICIPANT EXECUTION LEDGER

*Current state as of 2026-11-01T14:34:00+05:30:*

| ID | Persona | Assigned Identity | Facilitator | Scheduled Window | Actual Duration | Tasks Completed | Session Status | Usability Score | Status Notes |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **P1** | Administrator | `admin_staging_01` | Senior UX Lead | Scheduled — Wave 1 | — | 0 / 6 | **NOT STARTED** | — | Staged; pre-flight safety verified; awaiting live participant onboarding. |
| **P2** | Psychologist 1 | `psych_staging_01` | Senior UX Lead | Scheduled — Wave 1 | — | 0 / 6 | **NOT STARTED** | — | Staged; assigned to Dr. Sarah Jenkins profile; ready for facilitated execution. |
| **P3** | Psychologist 2 | `psych_staging_02` | Senior UX Lead | Scheduled — Wave 1 | — | 0 / 6 | **NOT STARTED** | — | Staged; assigned to Dr. Marcus Vance profile; ready for facilitated execution. |
| **P4** | Patient 1 | `patient_staging_01` | QA Lead | Scheduled — Wave 2 | — | 0 / 6 | **NOT STARTED** | — | Staged; assigned to Alex Mercer profile; ready for facilitated execution. |
| **P5** | Patient 2 | `patient_staging_02` | QA Lead | Scheduled — Wave 2 | — | 0 / 6 | **NOT STARTED** | — | Staged; assigned to Maya Lin profile; ready for facilitated execution. |
| **P6** | Patient 3 | `patient_staging_03` | QA Lead | Scheduled — Wave 2 | — | 0 / 6 | **NOT STARTED** | — | Staged; assigned to David Chen profile; ready for facilitated execution. |
| **P7** | Patient (Mobile) | `patient_staging_04` | QA Lead | Scheduled — Wave 2 | — | 0 / 6 | **NOT STARTED** | — | Staged; mobile smartphone / responsive viewport focus; ready for execution. |

**Cohort Execution Summary:**
- Planned Sessions: **7**
- Completed Sessions: **0 / 7 (0%)**
- In-Progress Sessions: **0 / 7 (0%)**
- Not Started Sessions: **7 / 7 (100%)**
- Composite Usability Score: **N/A (Awaiting genuine human participation)**

---

## 5. FACILITATION METHODOLOGY & PROTOCOL

All sessions are conducted using the standardized **Concurrent Think-Aloud (CTA)** methodology:

### 5.1 Protocol Guidelines
1. **Facilitator Demeanor:** Neutral, observant, and non-directive. Do not lead the participant or provide hints unless the participant has been blocked for $\ge 3$ minutes.
2. **Think-Aloud Prompting:** Encourage the participant: *"Please keep talking aloud. Tell me what you're looking at, what you expect to happen, and what you're trying to do."*
3. **Task Outcome Classifications:**
   - **Independent:** Participant completed the task without assistance or prompting.
   - **Prompted:** Participant required a neutral verbal prompt (e.g. *"What do you see on this page?"*).
   - **Assisted:** Participant required specific guidance to proceed past a confusing UI element.
   - **Failed:** Participant could not complete the core goal of the scenario.
   - **Technical Blocker:** Platform bug, network error, or environmental failure halted the task.
4. **Immediate Task Stop Trigger:**
   If a participant encounters unauthorized access to clinical notes, an unexpected privacy exposure, or a database corruption symptom, **the task is stopped immediately** and escalated as a P0 defect.

---

## 6. ROLE-SPECIFIC TEST PROTOCOLS

The established test sheets in `docs/phase7/` are strictly maintained and reused:

### 6.1 P1: System Administrator Protocol ([PHASE_7_1_ADMIN_TEST_SHEET.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/phase7/PHASE_7_1_ADMIN_TEST_SHEET.md))
- **ADM-01:** Authentication & Administrative Dashboard Metrics inspection.
- **ADM-02:** Practitioner Credentialing & Verification workflow (Dr. Marcus Vance).
- **ADM-03:** Global User Directory & Account Governance controls.
- **ADM-04:** Support Desk & Escalation Ticket resolution.
- **ADM-05:** Immutable Audit Logs Inspection (Verify Zero PHI disclosure).
- **ADM-06:** **Clinical Privacy Lockout Verification** (Attempt navigation to `/clinical/notes`; verify clean 403 access denial without stack traces).

### 6.2 P2 & P3: Clinical Psychologists Protocol ([PHASE_7_1_PSYCHOLOGIST_TEST_SHEET.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/phase7/PHASE_7_1_PSYCHOLOGIST_TEST_SHEET.md))
- **PSY-01:** Clinician Login & Practice Overview (Schedule widget, pending notes badge).
- **PSY-02:** Practice Setup (Modalities, 50-minute duration, consultation fee).
- **PSY-03:** Working Hours & Availability Configuration (Buffer minutes, slot preview).
- **PSY-04:** Patient Directory & Clinical Intake Review (PHQ-9 score, risk markers).
- **PSY-05:** Clinical Documentation & AI Sandbox Review (Trigger mock SOAP draft, verify "DRAFT" badge, edit Assessment & Plan, approve & digitally sign).
- **PSY-06:** Clinical Report Generation (Comprehensive Progress Report, print/export layout).

### 6.3 P4–P6: Patient Desktop Protocol ([PHASE_7_1_PATIENT_TEST_SHEET.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/phase7/PHASE_7_1_PATIENT_TEST_SHEET.md))
- **PAT-01:** Patient Login & Dashboard Orientation.
- **PAT-02:** Profile & Emergency Contact Management (Synthetic data only).
- **PAT-03:** Psychologist Directory Search & Specialization Filtering.
- **PAT-04:** Appointment Booking Flow & 3-Step Intake Submission.
- **PAT-05:** Appointment Management & Polite Cancellation Flow.
- **PAT-06:** Notification Bell & Status Confirmation.

### 6.4 P7: Patient Mobile Viewport Protocol ([PHASE_7_1_PATIENT_TEST_SHEET.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/phase7/PHASE_7_1_PATIENT_TEST_SHEET.md))
- Evaluated on a physical mobile device or simulated mobile viewport ($\le 420\text{px}$ width).
- Tests responsive hamburger drawer, 48px touch targets, sticky booking action bar, absence of horizontal scrolling, touch keyboard usability during multi-step intake.

---

## 7. NEXT STEPS FOR FACILITATED SESSION EXECUTION

1. Facilitator initiates 1-on-1 scheduled sessions with the 7 internal cohort members.
2. Deliver the verbal briefing, secure participant consent, and share credentials privately.
3. Observe participant execution via think-aloud protocol; log task durations, error counts, and assistance levels in [`PHASE_7_5_3_USABILITY_OBSERVATIONS.md`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/phase7/PHASE_7_5_3_USABILITY_OBSERVATIONS.md).
4. Collect standardized 1–5 dimensional ratings in [`PHASE_7_1_PARTICIPANT_FEEDBACK_TEMPLATE.md`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/phase7/PHASE_7_1_PARTICIPANT_FEEDBACK_TEMPLATE.md).
5. Record any discovered bugs in [`PHASE_7_5_3_DEFECT_REGISTER.md`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/phase7/PHASE_7_5_3_DEFECT_REGISTER.md).
6. Update session ledger and summary reports only upon physical completion of each session.
