# Psyco AI — Complete Backend API & Endpoint Audit

**Audit Date:** October 28, 2026  
**Auditor:** Senior Full-Stack & API Integration Engineer  
**Mount Prefix:** `/api/v1`  
**Router Root:** `backend/src/routes/index.js`  

---

## 1. API Architecture & Security Middleware Stack

Every incoming request traverses the following standardized security pipeline:
1. **Helmet**: Configures strict HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`).
2. **CORS**: Enforces approved origins (`FRONTEND_URL` or localhost during development).
3. **Body Parser**: Enforces a strict 1MB JSON payload ceiling.
4. **Request Logger**: Sanitizes request logs to guarantee clinical notes, transcripts, passwords, and authorization tokens are NEVER printed to stdout/disk.
5. **Rate Limiting**:
   * General API endpoints: Rate-limited via `standardRateLimiter`.
   * Public contact & FAQ forms: Rate-limited to 10 submissions per 15 minutes.
   * Internal polling endpoints (`/ai/jobs/:jobId`, `/notifications`, `/health`): Explicitly exempted from aggressive rate-limiting to prevent false 429 errors.
6. **Authentication & RBAC (`verifyAuth`, `requireRole`)**:
   * Enforces cryptographic RS256 Firebase ID token signature verification against Google's public certificates.
   * Maps validated UID to database profile and injects `req.user = { uid, role, email }`.
7. **ReBAC Privacy Barriers**:
   * `blockAdminFromClinicalRecords`: Intercepts administrative attempts to view private clinical psychotherapy notes and returns HTTP 403.

---

## 2. Complete Endpoint Inventory & Verification Status

### 2.1 System Health & Diagnostics (`/health`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | None | Firebase RTDB, Gemini, AssemblyAI | `VERIFIED` | 200 OK `{"status":"HEALTHY","checks":{...}}` |

### 2.2 Public Website Endpoints (`/public`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/public/faqs` | None | None | RTDB `faqSubmissions` | `VERIFIED` | 200 OK (returns published FAQ list) |
| `POST` | `/public/contact` | None | None | RTDB `contactSubmissions` | `VERIFIED` | 201 Created `{"submissionId":"cnt_..."}` |
| `POST` | `/public/faq-submissions` | None | None | RTDB `faqSubmissions` | `VERIFIED` | 201 Created (moderation queue entry) |

### 2.3 Authentication & Session (`/auth`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/session-login` | Required | Any | Firebase Auth | `VERIFIED` | 200 OK (profile hydration & role return) |
| `POST` | `/auth/sync-profile` | Required | Any | RTDB `users` | `VERIFIED` | 200 OK (synchronizes OAuth profiles) |
| `POST` | `/auth/logout` | Required | Any | Session Store | `VERIFIED` | 200 OK (clears session context) |

### 2.4 User Profiles (`/profile`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/profile/me` | Required | Any | RTDB `users` | `VERIFIED` | 200 OK (returns authenticated user profile) |
| `PUT` | `/profile/patient` | Required | `patient` | RTDB `patients` | `VERIFIED` | 200 OK (updates patient demographic data) |
| `PUT` | `/profile/psychologist` | Required | `psychologist` | RTDB `psychologists` | `VERIFIED` | 200 OK (updates clinician bio and license) |

### 2.5 Clinical Intake & Templates (`/intake`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/intake/templates` | Required | Clinician | RTDB `intakeTemplates` | `VERIFIED` | 200 OK (returns practice intake schemas) |
| `POST` | `/intake/templates` | Required | Clinician | RTDB `intakeTemplates` | `VERIFIED` | 201 Created (saves custom intake form) |
| `GET` | `/intake/patient/:id` | Required | Authorized | RTDB `patientIntake` | `VERIFIED` | 200 OK (retrieves patient intake responses) |
| `POST` | `/intake/patient` | Required | `patient` | RTDB `patientIntake` | `VERIFIED` | 201 Created (patient submits intake form) |

### 2.6 Clinician Availability & Booking (`/availability`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/availability/psychologist/:id`| None | None | RTDB `availability` | `VERIFIED` | 200 OK (public slot availability) |
| `PUT` | `/availability/my-rules` | Required | Clinician | RTDB `availability` | `VERIFIED` | 200 OK (updates working hours & buffer) |
| `GET` | `/availability/slots` | None | None | RTDB `availability` | `VERIFIED` | 200 OK (calculated bookable time slots) |

### 2.7 Appointments Lifecycle (`/appointments`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/appointments/my` | Required | Any | RTDB `appointments` | `VERIFIED` | 200 OK (returns user's appointments) |
| `POST` | `/appointments` | Required | `patient` | RTDB `appointments` | `VERIFIED` | 201 Created (books slot; checks conflicts) |
| `PATCH` | `/appointments/:id/status` | Required | Authorized | RTDB `appointments` | `VERIFIED` | 200 OK (confirms, reschedules, or cancels) |

### 2.8 Clinical Sessions & Notes (`/clinical`, `/sessions`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/clinical/sessions/appointment/:id` | Required | Clinician | RTDB `sessionRecords` | `VERIFIED` | 200 OK (creates or links session record) |
| `POST` | `/clinical/sessions/:id/start` | Required | Clinician | RTDB `sessionRecords` | `VERIFIED` | 200 OK (marks session active) |
| `POST` | `/clinical/sessions/:id/finalize` | Required | Clinician | RTDB, Safety Gates | `VERIFIED` | 200 OK (or 412 if risk flags unacknowledged) |
| `POST` | `/clinical/notes/draft` | Required | Clinician | RTDB `sessionNotes` | `VERIFIED` | 201 Created (auto-saves draft SOAP note) |
| `POST` | `/clinical/notes/:id/finalize` | Required | Clinician | RTDB `sessionNotes` | `VERIFIED` | 200 OK (locks note against changes) |
| `POST` | `/clinical/notes/:id/amend` | Required | Clinician | RTDB `sessionNotes` | `VERIFIED` | 200 OK (appends versioned amendment) |
| `GET` | `/clinical/patients/:id/chart` | Required | Clinician | RTDB `sessionNotes` | `VERIFIED` | 200 OK (clinician chart view; 403 for admin) |

### 2.9 Ambient Transcription & Audio Streaming (`/transcription`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/transcription/token` | Required | Clinician | AssemblyAI API | `VERIFIED` | 200 OK (live 2667-char WSS auth token) |
| `POST` | `/transcription/sessions/:id/entry` | Required | Clinician | RTDB `transcriptEntries` | `VERIFIED` | 201 Created (appends transcript text entry) |
| `GET` | `/transcription/sessions/:id` | Required | Authorized | RTDB `sessionTranscripts` | `VERIFIED` | 200 OK (fetches complete transcript text) |

### 2.10 AI Generative Documentation (`/ai`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/ai/generate` | Required | Clinician | Google Gemini SDK | `VERIFIED` | 202 Accepted `{"jobId":"ai_job_..."}` |
| `GET` | `/ai/jobs/:id` | Required | Clinician | RTDB `aiJobs` | `VERIFIED` | 200 OK `{"status":"COMPLETED","output":{...}}` |
| `POST` | `/ai/generate-combined` | Required | Clinician | Google Gemini SDK | `VERIFIED` | 202 Accepted (1-click Plan + SOAP generation) |

### 2.11 Psychometrics & Clinical Safety (`/assessments`, `/risk-review`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/assessments/definitions` | Required | Any | Assessment Library | `VERIFIED` | 200 OK (PHQ-9 & GAD-7 definitions) |
| `POST` | `/assessments/assign` | Required | Clinician | RTDB `assessmentAssignments`| `VERIFIED` | 201 Created (dispatches notification) |
| `POST` | `/assessments/assignments/:id/submit` | Required | `patient` | RTDB, Safety Engine | `VERIFIED` | 200 OK (scores & checks Q9 risk flag) |
| `POST` | `/risk-review/flags/:id/acknowledge` | Required | Clinician | RTDB `riskReviewFlags` | `VERIFIED` | 200 OK (clinician acknowledges risk flag) |

### 2.12 Administration & Governance (`/admin`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/admin/metrics` | Required | `admin` | RTDB System Stats | `VERIFIED` | 200 OK (practice analytics & metrics) |
| `GET` | `/admin/psychologists/pending` | Required | `admin` | RTDB `psychologists` | `VERIFIED` | 200 OK (pending applicant queue) |
| `POST` | `/admin/psychologists/:id/approve` | Required | `admin` | RTDB `psychologists` | `VERIFIED` | 200 OK (approves practice credentials) |
| `POST` | `/admin/psychologists/:id/reject` | Required | `admin` | RTDB `psychologists` | `VERIFIED` | 200 OK (rejects application with reason) |
| `GET` | `/admin/users` | Required | `admin` | RTDB `users` | `VERIFIED` | 200 OK (paginated user directory) |
| `PATCH` | `/admin/users/:id/status` | Required | `admin` | RTDB `users` | `VERIFIED` | 200 OK (suspends or reactivates user) |

### 2.13 Notifications & Audit Logging (`/notifications`, `/audit`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/notifications/my` | Required | Any | RTDB `notifications` | `VERIFIED` | 200 OK (in-app clinical notifications) |
| `PATCH` | `/notifications/:id/read` | Required | Recipient | RTDB `notifications` | `VERIFIED` | 200 OK (marks notification read) |
| `GET` | `/audit/logs` | Required | `admin` | RTDB `auditLogs` | `VERIFIED` | 200 OK (immutable compliance audit trail) |

### 2.14 Google Calendar & Meet Integrations (`/integrations/google`)
| Method | Route | Auth | Role | Dependencies | Test Status | Observed Response |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/integrations/google/auth-url` | Required | Clinician | Google OAuth v2 | `VERIFIED` | 200 OK (returns signed CSRF OAuth URL) |
| `GET` | `/integrations/google/callback` | None | Clinician | Google OAuth v2 | `PARTIALLY_IMPLEMENTED` | Handles code exchange; requires live OAuth consent. |
| `GET` | `/integrations/google/status` | Required | Clinician | RTDB Integration Metadata | `VERIFIED` | 200 OK (reports connection state) |
