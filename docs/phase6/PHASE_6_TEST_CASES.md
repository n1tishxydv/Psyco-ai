# PSYCO AI — PHASE 6 CONTROLLED PILOT TEST CASES

**Document Identifier:** `PSYCO-TC-PHASE6-001`  
**Document Version:** 1.0.0  
**Date:** October 31, 2026  
**Target Environment:** Staging (`https://psyco-ai-staging.web.app`)  
**Backend Host:** `https://psyco-ai.onrender.com`  
**Database URL:** `https://psyco-ai-staging-default-rtdb.firebaseio.com`  
**Status Taxonomy:** `PASS` | `FAIL` | `BLOCKED` | `NOT TESTED`  

---

## 1. Group A: Administrator Test Cases

| Case ID | Persona & Scenario | Preconditions | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-ADM-01** | **Admin Dashboard Health Telemetry** | Active Admin session (`admin_staging_01`). | 1. Navigate to `/admin/dashboard`.<br>2. Observe telemetry cards.<br>3. Verify backend status badge. | Uptime, active clinics count, pending reviews, and "Healthy" status badge render cleanly without patient PII. | **PASS** |
| **TC-ADM-02** | **Clinician Credential Verification** | A psychologist registered with `approvalStatus: "pending"`. | 1. Open "Pending Clinician Reviews".<br>2. Inspect license number & degrees.<br>3. Click "Approve Credential". | Status transitions to `approved`, `verified: true` is saved, audit log is written, clinician appears in directory. | **PASS** |
| **TC-ADM-03** | **Clinician Rejection with Mandatory Reason** | Psychologist with invalid license number. | 1. Open review modal.<br>2. Click "Reject".<br>3. Leave reason blank.<br>4. Enter rejection reason and submit. | Blank reason is rejected (validation error). Submitting with reason updates status to `rejected`. | **PASS** |
| **TC-ADM-04** | **User Account Suspension** | Patient account violating platform terms. | 1. Search user in Directory.<br>2. Click "Suspend Account".<br>3. Enter audit reason.<br>4. Submit. | Account status sets to `suspended`, active sessions are invalidated, audit log is appended. | **PASS** |
| **TC-ADM-05** | **Self-Suspension Prevention Rule** | Admin attempting self-action. | 1. Admin locates their own user ID.<br>2. Dispatches suspend request (`POST /admin/users/:ownId/suspend`). | Request fails with HTTP 400 `SELF_SUSPENSION_PROHIBITED`. Admin session remains active. | **PASS** |
| **TC-ADM-06** | **Clinic Organization Creation** | Platform onboarding a new clinic. | 1. Navigate to Clinic Management.<br>2. Click "Register New Clinic".<br>3. Fill name, address, tax ID, and phone.<br>4. Save. | New clinic record created in `/clinics` and organization practice node initialized in `/practices`. | **PASS** |
| **TC-ADM-07** | **Support Ticket Workspace** | Synthetic patient filed a technical ticket. | 1. Navigate to Support Tickets.<br>2. Assign ticket priority.<br>3. Add internal note.<br>4. Add public reply.<br>5. Mark resolved. | Status updates to `resolved`, internal note is hidden from patient, public reply is visible in patient portal. | **PASS** |
| **TC-ADM-08** | **Public FAQ Moderation** | Public visitor submitted a question. | 1. Navigate to FAQ Management.<br>2. Open moderation queue.<br>3. Edit question and assign category.<br>4. Click "Publish". | Question moves to published list and appears immediately on `GET /api/v1/public/faqs`. | **PASS** |
| **TC-ADM-09** | **CRITICAL: Transcripts Privacy Lockout** | Active Admin session. | 1. Admin sends `GET /api/v1/transcription/sessions/:sessionId`. | Server halts request with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`. Zero transcript data returned. | **PASS** |
| **TC-ADM-10** | **CRITICAL: SOAP Notes Privacy Lockout** | Active Admin session. | 1. Admin sends `GET /api/v1/clinical/patients/:patientId/chart`. | Server halts request with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`. Zero chart notes returned. | **PASS** |
| **TC-ADM-11** | **CRITICAL: Assessment Scores Lockout** | Active Admin session. | 1. Admin sends `GET /api/v1/assessments/assignments/:id`. | Server halts request with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`. Zero PHQ-9 answers returned. | **PASS** |
| **TC-ADM-12** | **CRITICAL: Intake Form Privacy Lockout** | Active Admin session. | 1. Admin sends `GET /api/v1/intake/patient/:patientId`. | Server halts request with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`. Zero intake data returned. | **PASS** |

---

## 2. Group B: Psychologist Test Cases

| Case ID | Persona & Scenario | Preconditions | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-PSY-01** | **Clinician Onboarding & Credential Submission** | Unregistered psychologist. | 1. Register with email/password.<br>2. Fill license number, years of experience, and bio.<br>3. Submit. | Profile saved in `/psychologists/{uid}` with `approvalStatus: "pending"`. Dashboard locked to setup. | **PASS** |
| **TC-PSY-02** | **Solo Independent Practice Setup** | Verified psychologist (`approvalStatus: "approved"`). | 1. Access `/psychologist/practice-setup`.<br>2. Select "Solo Independent Practice".<br>3. Enter practice name.<br>4. Save. | Autonomous practice node created at `/practices/indep_{uid}` without requiring a clinic organizational ID. | **PASS** |
| **TC-PSY-03** | **Consultation Location Management** | Independent practice. | 1. Navigate to Practice Settings.<br>2. Add physical consultation room.<br>3. Toggle online Meet support.<br>4. Save. | Location appears in booking selection; Google Meet link generated automatically for online bookings. | **PASS** |
| **TC-PSY-04** | **Clinic Affiliation & Hybrid Switching** | Verified psychologist. | 1. Request affiliation with registered clinic.<br>2. Admin approves membership.<br>3. Switch context in top navigation. | Active context switches between Solo and Clinic practice. Patient lists and appointments re-scope cleanly. | **PASS** |
| **TC-PSY-05** | **Availability & Inter-Session Buffer Configuration** | Practice configured. | 1. Open Availability settings.<br>2. Set Mon/Wed 09:00-17:00.<br>3. Set 15-minute buffer.<br>4. Save. | Slot generator creates appointments honoring the 15-minute buffer between client bookings. | **PASS** |
| **TC-PSY-06** | **Patient Chart & Intake Review** | Assigned patient with active appointment. | 1. Open Patient Directory.<br>2. Select patient.<br>3. View clinical chart & intake tab. | ReBAC grants access: medical history, presenting symptoms, and goals render accurately. | **PASS** |
| **TC-PSY-07** | **Clinical Session Initialization & Status** | Confirmed appointment time. | 1. Click "Start Session".<br>2. Verify session status transitions to `in_progress`. | Session record created in `/sessionRecords/{id}` with start timestamp. | **PASS** |
| **TC-PSY-08** | **AI Copilot Draft Generation (HITL)** | Session transcript recorded. | 1. Click "Generate AI Note Draft".<br>2. Gemini generates SOAP proposal.<br>3. Check note status. | Note created in `draft` status. Contains Subjective, Objective, Assessment, Plan. Record is NOT finalized. | **PASS** |
| **TC-PSY-09** | **Clinician Editing & Digital Signature** | AI Draft generated. | 1. Clinician edits Objective section.<br>2. Adds homework assignment.<br>3. Clicks "Sign & Finalize". | Note transitions from `draft` to `finalized`. Clinician digital signature attached. Record becomes immutable. | **PASS** |
| **TC-PSY-10** | **Clinical Note Amendment Workflow** | Finalized clinical note. | 1. Click "Amend Note".<br>2. Enter amendment reason.<br>3. Update text.<br>4. Submit. | Version increments from `1` to `2`. Previous version archived in audit history with justification. | **PASS** |
| **TC-PSY-11** | **Clinical Risk-Review Flag Acknowledgment** | Patient answered PHQ-9 Question 9 affirmatively. | 1. System generates Q9 suicide risk review flag.<br>2. Clinician attempts session finalize.<br>3. Acknowledge flag with safety notes.<br>4. Finalize. | Attempting to finalize before acknowledging is rejected (HTTP 412). Acknowledging allows finalization. | **PASS** |

---

## 3. Group C: Patient Test Cases

| Case ID | Persona & Scenario | Preconditions | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-PAT-01** | **Patient Registration & Profile Onboarding** | New visitor. | 1. Navigate to `/register`.<br>2. Sign up with email.<br>3. Fill age, gender, contact number.<br>4. Save. | Profile saved in `/patients/{uid}` with `onboardingStatus: "completed"`. | **PASS** |
| **TC-PAT-02** | **Structured Clinical Intake Questionnaire** | Onboarded patient. | 1. Navigate to `/patient/intake`.<br>2. Fill Section A (Emergency contact).<br>3. Fill Section B (Symptom rating).<br>4. Fill Section C/D.<br>5. Submit. | Intake saved in `/patientIntake/{uid}`. Progress bar reflects 100% completion. | **PASS** |
| **TC-PAT-03** | **Directory Search & Multi-Filter Refinement** | Public or Patient. | 1. Navigate to `/find-psychologist`.<br>2. Filter by "Anxiety", "In-Person", and "English". | List dynamically filters to matching verified clinicians. Unapproved clinicians remain hidden. | **PASS** |
| **TC-PAT-04** | **Appointment Booking & Slot Reservation** | Available clinician slot. | 1. Select provider profile.<br>2. Pick Friday 10:00 AM slot.<br>3. Select In-Person consultation.<br>4. Confirm. | Appointment created with `status: "confirmed"`. Confirmation notice sent to patient dashboard. | **PASS** |
| **TC-PAT-05** | **Double-Booking Conflict Rejection** | Attempted duplicate booking. | 1. User B selects identical slot.<br>2. Submits booking request. | Server detects overlap and rejects with HTTP 409 Conflict. Slot remains assigned to User A. | **PASS** |
| **TC-PAT-06** | **Lead-Time Policy Enforcement** | Booking `<2 hours` in advance. | 1. Attempt booking slot 45 minutes from current time. | Server rejects request with HTTP 400 Bad Request (`LEAD_TIME_VIOLATION`). | **PASS** |
| **TC-PAT-07** | **Informed Consent for Transcription** | Confirmed session. | 1. Open session modal.<br>2. Review zero-audio-persistence policy notice.<br>3. Click "Provide Consent". | Consent record logged with timestamp (`POST /transcription/consent`). | **PASS** |
| **TC-PAT-08** | **Consent Revocation Workflow** | Prior consent granted. | 1. Open session settings.<br>2. Click "Withdraw Documentation Consent". | System updates consent node; ambient audio transcription is halted immediately. | **PASS** |
| **TC-PAT-09** | **Appointment Cancellation** | Confirmed upcoming session. | 1. Navigate to Appointments.<br>2. Click "Cancel".<br>3. Enter cancellation reason.<br>4. Confirm. | Status changes to `cancelled`. Clinician availability slot is immediately released for re-booking. | **PASS** |
| **TC-PAT-10** | **Care Plan & Homework Task Completion** | Clinician assigned task. | 1. Navigate to `/patient/care-plan`.<br>2. Check "Complete 10-minute mindfulness exercise". | Task status updates to `completed` in `/followUpTasks` with completion timestamp. | **PASS** |

---

## 4. Group D: Clinical Safety & AI Governance Test Cases

| Case ID | Clinical Safety Assertion | Test Execution Vector | Expected Guardrail & Invariant | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-SAF-01** | **Zero Autonomous Finalization** | Gemini generates note proposal. | Note must remain in `draft` state indefinitely until clinician explicitly calls `finalizeNote`. System must never auto-finalize. | **PASS** |
| **TC-SAF-02** | **Inaccurate AI Output Handling** | Gemini generates incorrect symptom description in draft. | Clinician can edit any field directly in textarea before signing. Finalized record reflects clinician text only. | **PASS** |
| **TC-SAF-03** | **Missing Clinical Information** | AI draft omits emergency contact or risk factor. | Clinician adds missing details during review. Save operation validates required clinical fields. | **PASS** |
| **TC-SAF-04** | **Prescription Authorization Guard** | Non-prescriber clinician attempts to issue medication recommendation. | Server checks clinician prescriber credential (`isPrescriber: true`). Rejects non-prescribers with HTTP 403. | **PASS** |
| **TC-SAF-05** | **Zero Binary Media Upload Rejection** | User attempts upload of base64 `.mp3` or `.png` to session note. | RTDB adapter `assertValidPayload()` rejects with `Base64-encoded binary media is strictly forbidden`. | **PASS** |
| **TC-SAF-06** | **Oversized Payload Shield** | Client attempts to transmit `>5 MB` payload to database. | Request rejected with HTTP 400 `Payload exceeds 5MB limit`. Mitigates denial-of-service storage saturation. | **PASS** |
| **TC-SAF-07** | **Emergency Crisis Contact Prominence** | Public Contact and Patient portal navigation. | Crisis hotline numbers (Tele-MANAS & Vandrevala Foundation) are permanently pinned and visible. | **PASS** |
