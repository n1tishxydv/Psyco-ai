# PSYCO AI — STAGING USER ACCEPTANCE TESTING (UAT) REPORT

**Report Document:** Report B  
**Location:** `docs/staging/PSYCO_AI_STAGING_UAT_REPORT.md`  
**Date:** October 28, 2026  
**Auditor:** Quality Assurance Specialist & Clinical Software Quality Auditor  
**Product:** Psyco AI Practice Management Platform  
**Test Method:** Synthetic Automated Workflows, Browser Navigation Audits, API Probes, and ReBAC Verification  

---

## 1. UAT Execution Summary

| UAT Scenario Group | Total Scenarios | Passed | Failed | Blocked | Success Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Public Website & Discovery** | 10 | 10 | 0 | 0 | **100%** |
| **B. Patient Portal Workflows** | 8 | 8 | 0 | 0 | **100%** |
| **C. Psychologist Clinical Practice** | 12 | 12 | 0 | 0 | **100%** |
| **D. Administrator Governance** | 8 | 8 | 0 | 0 | **100%** |
| **E. Cross-Role Authorization (ReBAC)**| 6 | 6 | 0 | 0 | **100%** |
| **F. Provider Failure & Resilience** | 6 | 6 | 0 | 0 | **100%** |
| **G. External Provider Live Testing** | 4 | 2 | 0 | 2 | **50% (2 Blocked)** |
| **TOTAL** | **54** | **52** | **0** | **2** | **96.3%** |

---

## 2. Tested User Roles & Identities

* **Administrator Role:**
  * Authenticated Identity: `admin.staging@psyco.clinic`
  * UID: `GQCjxZQwc2dxxKSBPeALbdkDYHE2`
  * Verified Capabilities: Practice metrics, psychologist review, approval/rejection, user suspension, FAQ moderation.
  * Enforced Boundary: Cannot access psychotherapy session notes (**HTTP 403**).
* **Approved Psychologist Role:**
  * Primary Clinician: `elena.vance@psyco.clinic` (UID: `QbERUvpni8MPpcNddAM4U5JUZ5M2`)
  * Secondary Clinician: `nitish25csu169@ncuindia.edu` (UID: `80i0qKgls8PAjdA5gksnzoWmYz02`)
  * Verified Capabilities: Availability rules (50m session / 10m buffer), calendar, session start/end, SOAP/DAP/BIRP notes, treatment plans, AI copilot drafting, risk flag acknowledgment.
* **Patient Role:**
  * Registered Account: `user1@gmail.com` (UID: `EF2utgUJZXMnWkZHo3XNqmeiPZx2`)
  * Synthetic Patient: `pat_pre8_1793177794383_01`
  * Verified Capabilities: Profile editing, psychologist directory search, booking slots, intake form submission, PHQ-9 & GAD-7 screeners, care plan review.
  * Enforced Boundary: Cannot view other patients' charts or clinician-only clinical workspaces.

---

## 3. Detailed Scenario Execution Results

### Group A: Public Website & Discovery
| ID | Test Scenario | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-PUB-01** | Homepage Load & Navigation | Renders hero, CTA links, header, footer without errors | Rendered clean; zero console errors | **`PASS`** |
| **UAT-PUB-02** | About Us Page | Renders clinical mission and clinician bio highlights | Rendered clean; HTTP 200 | **`PASS`** |
| **UAT-PUB-03** | Services Catalog | Lists therapy modalities with pricing transparency | Rendered clean; cards active | **`PASS`** |
| **UAT-PUB-04** | Interactive FAQ Accordion | Expanding an item reveals answer text | Accordion animated smoothly; text expanded | **`PASS`** |
| **UAT-PUB-05** | Public Question Submission | Submits question to admin moderation queue | Saved to `faqSubmissions` in RTDB | **`PASS`** |
| **UAT-PUB-06** | Contact Form Missing Fields | Rejects empty payload with 400 validation error | Form highlighted missing fields | **`PASS`** |
| **UAT-PUB-07** | Contact Form Valid Message | Creates inquiry and saves to cloud RTDB | Created `cnt_...` verified in Google Cloud | **`PASS`** |
| **UAT-PUB-08** | Contact Honeypot Spam Trap | Silently drops spam bot filling hidden field | Dropped silently with 200 OK | **`PASS`** |
| **UAT-PUB-09** | Psychologist Directory | Displays approved clinicians; filters unapproved | Only approved clinicians visible | **`PASS`** |
| **UAT-PUB-10** | Public Booking Entry (`/book/:id`) | Displays clinician profile and bookable slots | Bookable calendar rendered | **`PASS`** |

### Group B: Patient Portal Workflows
| ID | Test Scenario | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-PAT-01** | Patient Registration & Auth | Creates patient account and initializes profile | Registered and redirected to dashboard | **`PASS`** |
| **UAT-PAT-02** | Profile Demographic Updates | Updates preferred name and phone; persists in RTDB | Persisted to `patients/:id` node | **`PASS`** |
| **UAT-PAT-03** | Appointment Booking | Reserves open slot, checks conflict, sends notification | Created appointment record; sent alert | **`PASS`** |
| **UAT-PAT-04** | Double-Booking Prevention | Second booking for identical slot is rejected | Rejected with HTTP 409 Conflict | **`PASS`** |
| **UAT-PAT-05** | Clinical Intake Submission | Submits medical history and emergency contacts | Persisted to `patientIntake/:id` | **`PASS`** |
| **UAT-PAT-06** | PHQ-9 Screener Execution | 9 items scored deterministically (0–27) | Scored deterministically; saved to results | **`PASS`** |
| **UAT-PAT-07** | GAD-7 Screener Execution | 7 items scored deterministically (0–21) | Scored deterministically; category mapped | **`PASS`** |
| **UAT-PAT-08** | Care Plan Viewing | Displays treatment goals marked shared by clinician | Displays authorized goals; hides private notes | **`PASS`** |

### Group C: Psychologist Clinical Practice
| ID | Test Scenario | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-PSY-01** | Psychologist Dashboard | Displays schedule, patient count, pending alerts | Rendered stats and appointment cards | **`PASS`** |
| **UAT-PSY-02** | Weekly Availability Rules | Updates working hours, 50m session, 10m buffer | Persisted to `availability/:id` in RTDB | **`PASS`** |
| **UAT-PSY-03** | Patient Chart Access | Displays assigned patient medical history & assessments | Loaded patient chart; assessment trends rendered | **`PASS`** |
| **UAT-PSY-04** | Start Clinical Session | Commences encounter; records start timestamp | Session status changed to `active` | **`PASS`** |
| **UAT-PSY-05** | SOAP Note Draft Creation | Saves subjective/objective/assessment/plan draft | Saved to `sessionNotes` with status `draft` | **`PASS`** |
| **UAT-PSY-06** | DAP / BIRP Note Templates | Allows switching note formats | Form switched; structured fields persisted | **`PASS`** |
| **UAT-PSY-07** | Clinical Note Finalization | Finalizes and signs note; locks against alteration | Status `finalized`; edit disabled | **`PASS`** |
| **UAT-PSY-08** | Versioned Note Amendment | Appends amendment with required clinical reason | Amendment appended; previous text preserved | **`PASS`** |
| **UAT-PSY-09** | Treatment Plan Formulation | Creates SMART goals and target clinical problems | Persisted to `treatmentPlans` node | **`PASS`** |
| **UAT-PSY-10** | 1-Click Plan + SOAP (Gemini) | AI Copilot drafts both Treatment Plan and SOAP note | Generated structured JSON via Gemini SDK | **`PASS`** |
| **UAT-PSY-11** | Hinglish Dialogue Synthesis | AI Copilot comprehends mixed Hindi-English transcript | Accurately synthesized to clinical English | **`PASS`** |
| **UAT-PSY-12** | Human-in-the-Loop Gate | AI draft remains in draft state until clinician signs | Note cannot seal without manual signature | **`PASS`** |

### Group D: Administrator Governance
| ID | Test Scenario | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-ADM-01** | Admin Authentication | Verified UID `GQCjxZQwc...` accesses admin panel | Dashboard opened; verified role `admin` | **`PASS`** |
| **UAT-ADM-02** | Practice Analytics Cards | Aggregates registered users, sessions, appointments | Real-time counts rendered accurately | **`PASS`** |
| **UAT-ADM-03** | Pending Clinician Queue | Lists applicants awaiting credential verification | Loaded unapproved psychologist cards | **`PASS`** |
| **UAT-ADM-04** | 1-Click Clinician Approval | Approves license; makes clinician public | Status updated to `approved` in RTDB | **`PASS`** |
| **UAT-ADM-05** | Clinician Rejection | Rejects invalid applicant with rationale | Status updated to `rejected`; email queued | **`PASS`** |
| **UAT-ADM-06** | User Account Suspension | Suspends disruptive user; revokes active session | User `accountStatus` set to `suspended` | **`PASS`** |
| **UAT-ADM-07** | FAQ Moderation Queue | Publishes approved questions to public FAQ page | Question published; visible on `/faq` | **`PASS`** |
| **UAT-ADM-08** | Audit Trail Log Viewer | Displays immutable audit logs with actor and code | Loaded audit records from `auditLogs` | **`PASS`** |

### Group E: Cross-Role Authorization & Clinical Safeguards (ReBAC)
| ID | Test Scenario | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-SEC-01** | Admin Reads Therapy Notes | Admin attempts `GET /clinical/patients/:id/chart` | Intercepted; returned HTTP 403 Forbidden | **`PASS`** |
| **UAT-SEC-02** | Cross-Patient Record Access | Patient A requests Patient B's appointment/notes | Intercepted; returned HTTP 403 Forbidden | **`PASS`** |
| **UAT-SEC-03** | Unassigned Clinician Access | Psychologist requests unassigned patient chart | Intercepted; returned HTTP 403 Forbidden | **`PASS`** |
| **UAT-SEC-04** | Patient Role Self-Promotion | Patient sends `{ role: 'admin' }` in profile update | Ignored; RTDB rules reject role tampering | **`PASS`** |
| **UAT-SEC-05** | PHQ-9 Q9 Suicide Risk Gate | Affirmative Q9 triggers emergency alert | Created risk flag; notified clinician | **`PASS`** |
| **UAT-SEC-06** | Session Lockout on Risk Flag | Finalization blocked while risk flag unreviewed | Returned HTTP 412 Precondition Failed | **`PASS`** |

### Group F: Resilience & Error Handling
| ID | Test Scenario | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-RES-01** | Missing Auth Header | Protected API request without `Authorization` header | Returned HTTP 401 Unauthorized | **`PASS`** |
| **UAT-RES-02** | Forged Unsigned JWT Token | Request with fake Bearer token | Rejected with HTTP 401 Token Failed | **`PASS`** |
| **UAT-RES-03** | Invalid Path Character RTDB | Submitting JSON with `/` or `.` in key names | Throws explicit error; no silent success | **`PASS`** |
| **UAT-RES-04** | Polling Endpoint Rate Limit | Frequent polling of `/ai/jobs/:id` | Exempted from 429; polled smoothly | **`PASS`** |
| **UAT-RES-05** | Backend Health Probes | Calling `/api/v1/health` during high load | Returned 200 OK `status: HEALTHY` | **`PASS`** |
| **UAT-RES-06** | Zero Audio Media Persistence | Inspecting DB after session transcription | Only text saved; zero audio blobs | **`PASS`** |

### Group G: External Provider Live Workflows
| ID | Test Scenario | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-EXT-01** | AssemblyAI Live Token | Requests ephemeral streaming token from API | Issued 2667-char token from v3 WSS | **`PASS`** |
| **UAT-EXT-02** | Gemini Generative Inactive Fallback | Multi-model fallback handles rate limits or 503 | Fallbacks seamlessly across flash-lite models | **`PASS`** |
| **UAT-EXT-03** | Google Sign-In Popup | Firebase popup authenticates external Google user | Blocked by Google Console test user list | **`BLOCKED`** |
| **UAT-EXT-04** | Google Calendar Event Sync | Clinician completes OAuth; creates Meet link | Blocked until clinician grants consent | **`BLOCKED`** |

---

## 4. Browser Console & Performance Observations

* **Console Errors:** Zero fatal exceptions; zero React error-boundary triggers across all audited routes.
* **Initial Page Load:** Under 120ms locally.
* **Route Transitions:** Instantaneous client-side navigation via React Router v6.
* **Assessment Scoring Latency:** Instantaneous deterministic calculation (<5ms).
* **AI Job Status Polling:** Operates smoothly on a 2-second interval without rate-limiting interference.
