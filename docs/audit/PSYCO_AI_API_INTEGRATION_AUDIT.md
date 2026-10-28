# PSYCO AI — COMPLETE API & INTEGRATION AUDIT

**Generated Date:** October 28, 2026  
**Auditor:** Antigravity Senior Application Security & Systems Integration Engineer  
**Audit Scope:** Express 4.21 Backend REST API, Security Middleware, & External Integrations

---

## 1. EXTERNAL INTEGRATION AUDIT MATRIX

| Provider / Integration | Code Implementation Paths | Required Environment Variables | Config State | Auth Mechanism | Live Test Performed | Live Test Outcome | Actual Functionality Verified | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Firebase Authentication** | `backend/src/integrations/firebase/firebaseAuthAdapter.js` | `FIREBASE_PROJECT_ID` | Present | Client ID Token (JWT Bearer) | Decoded client test tokens | Validated `iss`, `aud`, `sub` claims; **FAILED:** Token signature is not cryptographically verified | Token decoding & user resolution works; signature verification is bypassed | **SECURITY_DEFECT** (P0) |
| **Firebase Realtime Database** | `backend/src/integrations/firebase/firebaseRtdbAdapter.js` | `FIREBASE_DATABASE_URL`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Partial (`URL` present; `EMAIL` & `KEY` empty) | Firebase Admin SDK / REST Auth | Direct REST GET/POST to `https://psyco-9c13d-default-rtdb.firebaseio.com/psychologists.json` | **FAILED: HTTP 401 Unauthorized** (Live rules reject unauthenticated REST calls) | Backend successfully falls back to in-memory store and disk snapshot (`rtdb_snapshot.json`) | **BLOCKED_BY_CONFIGURATION** (P0) |
| **Google Gemini API** | `backend/src/integrations/gemini/geminiAdapter.js` | `GEMINI_API_KEY`, `GEMINI_MODEL` | Present (`gemini-3.8-flash`) | API Key Header via `@google/genai` SDK | Direct invocation of `@google/genai` generateContent with model `gemini-3.8-flash` | **PASSED:** Model generated live JSON response in <1.2s | Real AI text drafting works in live mode; deterministic fallback engine works in test mode | **VERIFIED** |
| **AssemblyAI Streaming v3** | `backend/src/integrations/assemblyai/assemblyAiAdapter.js` | `ASSEMBLYAI_API_KEY` | Present | Bearer API Key via HTTP GET | Invocation of `createStreamingToken()` against `https://streaming.assemblyai.com/v3/token` | **PASSED:** Received real ephemeral token (`isSimulated: false`) | Real ephemeral WebSocket token generation verified live; zero audio storage policy enforced | **VERIFIED** |
| **Google Calendar API** | `backend/src/integrations/googleCalendar/googleCalendarAdapter.js` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Present | OAuth2 Authorization Code Flow | Checked configuration and `getConnectionStatus` | Returns `not_connected` gracefully when unauthenticated | Adapter structure complete; live event sync requires psychologist OAuth linking | **BLOCKED_BY_CONFIGURATION** |
| **Google Meet API v2** | `backend/src/integrations/googleMeet/googleMeetAdapter.js` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Present | OAuth2 Bearer Access Token | Tested conference record query formatting | Returns `OAUTH_REQUIRED` error gracefully when unlinked | Conference record discovery logic implemented; requires live completed Meet conference | **BLOCKED_BY_CONFIGURATION** |
| **Background Queue** | `backend/src/jobs/index.js`, `backend/src/workers/aiWorker.js` | `REDIS_URL` (Optional) | Present (Uses durable RTDB outbox) | In-process EventEmitter + RTDB Outbox | Enqueued synthetic AI job and processed through `aiWorker` | **PASSED:** Job transitioned `queued` -> `processing` -> `completed` | Durable background processing, retry reconciliation, and crash recovery verified | **VERIFIED** |

---

## 2. BACKEND API ROUTE INVENTORY

### A. Health & System
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | No | Public | Returns service status, node version, memory usage, and integration diagnostics | None | **VERIFIED** |

### B. Public Routes
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/public/faqs` | No | Public | Returns published FAQs | `faqs` | **VERIFIED** |
| `POST` | `/api/v1/public/contact` | No | Public | Submits public contact inquiry with honeypot protection | `contactSubmissions` | **VERIFIED** |
| `POST` | `/api/v1/public/faq-submissions` | No | Public | Submits public user question for FAQ moderation | `faqSubmissions` | **VERIFIED** |

### C. Authentication & Profile Routes
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register/patient` | No | Public | Legacy Phase 0 scaffolded endpoint (returns stub message) | None | **STUB_DEAD_CODE** |
| `POST` | `/api/v1/auth/register/psychologist` | No | Public | Legacy Phase 0 scaffolded endpoint (returns stub message) | None | **STUB_DEAD_CODE** |
| `POST` | `/api/v1/auth/login` | No | Public | Legacy Phase 0 scaffolded endpoint (returns stub message) | None | **STUB_DEAD_CODE** |
| `GET` | `/api/v1/auth/me` | Yes | All | Returns user from token claims | None | **VERIFIED** |
| `GET` | `/api/v1/profile/me` | Yes | All | Returns authenticated user profile, role data, and preferences | `users`, `patients`, `psychologists` | **VERIFIED** |
| `POST` | `/api/v1/profile/onboard/patient` | Yes | Patient | Commits initial patient profile after Firebase Auth sign-up | `users`, `patients` | **VERIFIED** |
| `POST` | `/api/v1/profile/onboard/psychologist` | Yes | Psychologist | Commits initial clinician application after Firebase Auth sign-up | `users`, `psychologists` | **VERIFIED** |
| `PUT` | `/api/v1/profile/preferences` | Yes | All | Updates user preferences (theme, timezone, notifications) | `userPreferences` | **VERIFIED** |

### D. Clinician Directory & Availability Routes
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/psychologists` | No | Public | Lists approved clinicians with query filters (mode, spec, lang) | `psychologists` | **VERIFIED** |
| `GET` | `/api/v1/psychologists/:id` | No | Public | Retrieves sanitized public clinician profile | `psychologists` | **VERIFIED** |
| `GET` | `/api/v1/psychologists/:id/available-slots` | No | Public | Calculates dynamic available booking slots for date and mode | `availability`, `appointments` | **VERIFIED** |
| `GET` | `/api/v1/availability/mine` | Yes | Psychologist | Retrieves psychologist's own weekly schedule and policies | `availability` | **VERIFIED** |
| `PUT` | `/api/v1/availability/mine` | Yes | Psychologist | Updates schedule, session duration, buffer time, and policies | `availability` | **VERIFIED** |
| `POST` | `/api/v1/availability/blocked-dates` | Yes | Psychologist | Adds temporary blocked date to availability | `availability` | **VERIFIED** |
| `DELETE` | `/api/v1/availability/blocked-dates/:id` | Yes | Psychologist | Removes blocked date | `availability` | **VERIFIED** |
| `POST` | `/api/v1/availability/leave` | Yes | Psychologist | Adds vacation/leave period | `availability` | **VERIFIED** |
| `DELETE` | `/api/v1/availability/leave/:id` | Yes | Psychologist | Removes leave period | `availability` | **VERIFIED** |

### E. Appointment & Scheduling Routes
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/appointments` | Yes | All | Lists appointments for authenticated user (patient or psychologist) | `appointments` | **VERIFIED** |
| `POST` | `/api/v1/appointments` | Yes | All | Books new appointment with atomic double-booking lock | `appointments`, `notifications` | **VERIFIED** |
| `GET` | `/api/v1/appointments/:id` | Yes | Participant / Admin | Retrieves appointment details | `appointments` | **VERIFIED** |
| `POST` | `/api/v1/appointments/:id/accept` | Yes | Psychologist | Clinician confirms appointment and triggers Google Calendar sync | `appointments`, `googleConnections` | **VERIFIED** |
| `POST` | `/api/v1/appointments/:id/reject` | Yes | Psychologist | Clinician declines appointment request with reason | `appointments`, `notifications` | **VERIFIED** |
| `POST` | `/api/v1/appointments/:id/reschedule` | Yes | Participant | Reschedules appointment with policy cutoff checks | `appointments` | **VERIFIED** |
| `POST` | `/api/v1/appointments/:id/cancel` | Yes | Participant | Cancels appointment with policy cutoff checks | `appointments` | **VERIFIED** |
| `POST` | `/api/v1/appointments/:id/propose-alternative` | Yes | Psychologist | Proposes alternative slot to patient | `appointments` | **VERIFIED** |
| `POST` | `/api/v1/appointments/:id/respond-alternative` | Yes | Patient | Patient accepts or declines proposed alternative slot | `appointments` | **VERIFIED** |

### F. Clinical Workspace Routes (Admin Barred)
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/clinical/patient-portal/records` | Yes | Patient | Retrieves patient-facing care portal records and shared notes | `sessionNotes`, `treatmentPlans`, `followUpTasks` | **VERIFIED** |
| `PATCH` | `/api/v1/clinical/tasks/:id/status` | Yes | Patient / Psychologist | Updates status of homework or follow-up task | `followUpTasks` | **VERIFIED** |
| `GET` | `/api/v1/clinical/patients` | Yes | Psychologist | Retrieves assigned patients with therapeutic relationships | `appointments`, `patients` | **VERIFIED** |
| `GET` | `/api/v1/clinical/patients/:id/chart` | Yes | Psychologist | Retrieves full clinical medical chart (notes, plans, assessments) | All clinical nodes | **VERIFIED** |
| `POST` | `/api/v1/clinical/sessions/appointment/:id` | Yes | Psychologist | Opens or retrieves clinical session for confirmed appointment | `sessionRecords` | **VERIFIED** |
| `POST` | `/api/v1/clinical/sessions/:id/start` | Yes | Psychologist | Starts active consultation session | `sessionRecords` | **VERIFIED** |
| `POST` | `/api/v1/clinical/sessions/:id/complete` | Yes | Psychologist | Marks consultation session completed | `sessionRecords` | **VERIFIED** |
| `POST` | `/api/v1/clinical/sessions/:id/finalize` | Yes | Psychologist | Finalizes session; **GATED (HTTP 412)** if unreviewed risk flags exist | `sessionRecords`, `riskReviewFlags` | **VERIFIED** |
| `POST` | `/api/v1/clinical/notes/draft` | Yes | Psychologist | Saves or updates clinical note draft (SOAP, DAP, BIRP) | `sessionNotes` | **VERIFIED** |
| `POST` | `/api/v1/clinical/notes/:id/finalize` | Yes | Psychologist | Locks clinical note with clinician digital sign-off | `sessionNotes` | **VERIFIED** |
| `POST` | `/api/v1/clinical/notes/:id/amend` | Yes | Psychologist | Amends finalized note with version increment and audit reason | `sessionNotes`, `auditLogs` | **VERIFIED** |
| `POST` | `/api/v1/clinical/treatment-plans` | Yes | Psychologist | Creates structured treatment plan with measurable goals | `treatmentPlans` | **VERIFIED** |
| `PUT` | `/api/v1/clinical/treatment-plans/:id` | Yes | Psychologist | Updates treatment plan | `treatmentPlans` | **VERIFIED** |
| `PATCH` | `/api/v1/clinical/treatment-plans/:id/goals/:goalId` | Yes | Psychologist | Updates specific goal progress | `treatmentPlans` | **VERIFIED** |
| `POST` | `/api/v1/clinical/tasks` | Yes | Psychologist | Assigns between-session homework or follow-up task | `followUpTasks` | **VERIFIED** |
| `POST` | `/api/v1/clinical/recommendations` | Yes | Psychologist | Records clinical lifestyle/exercise recommendations | `clinicalRecommendations` | **VERIFIED** |
| `POST` | `/api/v1/clinical/prescriptions` | Yes | Psychologist | Fails with 500: missing `createPrescriptionRecord` service method | None | **IMPLEMENTED_BUT_FAILING** (P1) |
| `POST` | `/api/v1/clinical/reports/generate` | Yes | Psychologist | Generates formal clinical report summary | `reports` | **VERIFIED** |

### G. Transcription & Ambient Speech Routes
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/transcription/consent/:id` | Yes | Participant | Retrieves patient informed recording consent status | `consentRecords` | **VERIFIED** |
| `POST` | `/api/v1/transcription/consent` | Yes | Psychologist | Records informed consent with zero-audio retention agreement | `consentRecords` | **VERIFIED** |
| `POST` | `/api/v1/transcription/token` | Yes | Psychologist | Requests ephemeral AssemblyAI streaming token (requires consent) | `consentRecords` | **VERIFIED** |
| `POST` | `/api/v1/transcription/turns` | Yes | Psychologist | Ingests real-time transcript utterance into text transcript | `sessionTranscripts`, `transcriptEntries` | **VERIFIED** |
| `POST` | `/api/v1/transcription/finalize` | Yes | Psychologist | Finalizes session transcript and generates review version | `sessionTranscripts` | **VERIFIED** |
| `POST` | `/api/v1/transcription/manual-import` | Yes | Psychologist | Manually imports session transcript text | `sessionTranscripts` | **VERIFIED** |
| `POST` | `/api/v1/transcription/google-meet/import` | Yes | Psychologist | Imports transcript from Google Meet conference record | `sessionTranscripts` | **VERIFIED** |

### H. Gemini Clinical Copilot Routes
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ai/status` | Yes | Psychologist | Retrieves Gemini model status and queue telemetry | None | **VERIFIED** |
| `POST` | `/api/v1/ai/jobs` | Yes | Psychologist | Enqueues asynchronous AI documentation drafting task (HTTP 202) | `aiJobs` | **VERIFIED** |
| `GET` | `/api/v1/ai/jobs/:id` | Yes | Psychologist | Polling endpoint for background AI job completion | `aiJobs` | **VERIFIED** |
| `GET` | `/api/v1/ai/drafts/:id` | Yes | Psychologist | Retrieves AI-generated structured draft | `aiDrafts` | **VERIFIED** |
| `PUT` | `/api/v1/ai/drafts/:id` | Yes | Psychologist | Saves clinician edits to AI draft | `aiDrafts` | **VERIFIED** |
| `POST` | `/api/v1/ai/drafts/:id/approve` | Yes | Psychologist | Explicit Human Clinician Approval: commits draft to clinical note | `aiDrafts`, `sessionNotes` | **VERIFIED** |
| `POST` | `/api/v1/ai/drafts/:id/reject` | Yes | Psychologist | Rejects AI draft with reason | `aiDrafts` | **VERIFIED** |

### I. Psychometric Assessments & Risk Review
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/assessments/instruments` | Yes | All | Returns catalog of verified instruments (PHQ-9, GAD-7) | In-memory catalog | **VERIFIED** |
| `GET` | `/api/v1/assessments/instruments/:id` | Yes | All | Returns specific instrument questionnaire schema | In-memory catalog | **VERIFIED** |
| `POST` | `/api/v1/assessments/assign` | Yes | Psychologist | Assigns questionnaire to patient; fails notification dispatch bug | `assessmentAssignments` | **PARTIALLY_IMPLEMENTED** (P1) |
| `GET` | `/api/v1/assessments/assignments/:id` | Yes | Participant | Retrieves assignment details for test runner | `assessmentAssignments` | **VERIFIED** |
| `POST` | `/api/v1/assessments/assignments/:id/submit` | Yes | Patient | Submits responses, scores deterministically, creates risk flag if Q9>0 | `assessmentResults`, `riskReviewFlags` | **PARTIALLY_IMPLEMENTED** (P1) |
| `GET` | `/api/v1/assessments/results/:id` | Yes | Participant | Retrieves scored assessment result | `assessmentResults` | **VERIFIED** |
| `GET` | `/api/v1/risk-review/flags` | Yes | Psychologist | Lists clinical risk review flags | `riskReviewFlags` | **VERIFIED** |
| `POST` | `/api/v1/risk-review/flags/:id/acknowledge` | Yes | Psychologist | Acknowledges clinical risk flag to unblock session finalization | `riskReviewFlags`, `auditLogs` | **VERIFIED** |
| `GET` | `/api/v1/analytics/patient/:id/progress` | Yes | Participant | Returns longitudinal symptom score trajectories | `assessmentResults` | **VERIFIED** |

### J. Administration Routes (Admin Only)
| Method | Route Path | Auth Required | Allowed Roles | Description | Database Dependency | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/metrics` | Yes | Admin | Returns system-wide operational metrics | Aggregated from RTDB | **VERIFIED** |
| `GET` | `/api/v1/admin/psychologists` | Yes | Admin | Lists pending and approved psychologist applications | `psychologists` | **VERIFIED** |
| `POST` | `/api/v1/admin/psychologists/:id/review` | Yes | Admin | Approves or rejects psychologist application | `psychologists`, `users` | **VERIFIED** |
| `GET` | `/api/v1/admin/users` | Yes | Admin | Lists platform users with search and role filters | `users` | **VERIFIED** |
| `PATCH` | `/api/v1/admin/users/:id/status` | Yes | Admin | Suspends or reactivates user account | `users` | **VERIFIED** |
| `GET` | `/api/v1/admin/faqs` | Yes | Admin | Lists all FAQs including unpublished questions | `faqs`, `faqSubmissions` | **VERIFIED** |
| `POST` | `/api/v1/admin/faqs` | Yes | Admin | Publishes curated FAQ item | `faqs` | **VERIFIED** |
| `GET` | `/api/v1/admin/contact-submissions` | Yes | Admin | Reviews public contact submissions | `contactSubmissions` | **VERIFIED** |
| `GET` | `/api/v1/admin/audit-logs` | Yes | Admin | Queries administrative audit logs | `auditLogs` | **VERIFIED** |
