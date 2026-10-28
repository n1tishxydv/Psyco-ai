# PSYCO AI — PRIORITIZED REMAINING WORK ROADMAP

**Generated Date:** October 28, 2026  
**Auditor:** Antigravity Senior Technical Project Auditor & Lead Architect  
**Purpose:** Actionable, Dependency-Ordered Engineering Roadmap from Current State to Verified Production Release

---

## 1. ROADMAP OVERVIEW & EXECUTION ORDER

To bring Psyco AI from its current evaluated state (Phase 0–7 completed with architectural/service gaps) to a fully verified, hardened, and production-ready system, development must follow four strictly ordered phases:

```
┌─────────────────────────┐
│ Group 1: Critical Fixes │ (P0/P1 Security, DB Auth & Contract Gaps)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Group 2: Feature Repairs│ (P2/P3 UI Disconnects, Stubs & Fallback Cleanup)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Group 3: Phase 8 QA     │ (End-to-End Regression, Performance & Security)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Group 4: Release Prep   │ (Cloud Deployment, CI/CD, Secrets & Runbooks)
└─────────────────────────┘
```

---

## 2. WORK GROUP SPECIFICATIONS

### GROUP 1 — CRITICAL FIXES (P0 & P1 ISSUES)
*Mandatory prerequisites before starting Phase 8.*

#### Task ID: `TASK-G1-01`
- **Title:** Implement Cryptographic Firebase JWT Verification
- **Priority:** **P0 — Critical**
- **Associated Defect:** `DEF-SEC-001` (`FEAT-010`, `FEAT-012`)
- **Reason:** Prevent trivial privilege escalation and identity spoofing via un-signed client tokens.
- **Dependencies:** None.
- **Acceptance Criteria:**
  1. `firebaseAuthAdapter.js` cryptographically verifies the token signature against Google's public x509 certs or `firebase-admin` auth service.
  2. Forged tokens with altered `sub` or unsigned payloads are strictly rejected with HTTP 401.
  3. Automated test harness tokens (e.g. `test-token-*`) remain supported only when `NODE_ENV === 'test'`.
- **Required Test:** Negative test passing forged JWTs to `/api/v1/profile/me` asserting HTTP 401.
- **Evidence:** Test logs verifying signature rejection.

#### Task ID: `TASK-G1-02`
- **Title:** Configure Cloud Firebase Service Account & Deploy Security Rules
- **Priority:** **P0 — Critical**
- **Associated Defect:** `DEF-DAT-002` (All Database Features)
- **Reason:** Enable genuine remote persistence to `https://psyco-9c13d-default-rtdb.firebaseio.com` and eliminate dependence on local memory fallback.
- **Dependencies:** Google Cloud / Firebase Console access.
- **Acceptance Criteria:**
  1. `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` populated with valid Service Account credentials.
  2. `firebase-tools` deploys `database.rules.json` to project `psyco-9c13d`.
  3. Backend write operations succeed directly with HTTP 200/201 against cloud RTDB without triggering 401 warnings.
- **Required Test:** Execute synthetic test write to `contactSubmissions` and verify presence via Firebase Admin CLI.
- **Evidence:** Successful cloud RTDB response without fallback warning.

#### Task ID: `TASK-G1-03`
- **Title:** Correct Method Name for Assessment & Risk Alert Notifications
- **Priority:** **P1 — High**
- **Associated Defect:** `DEF-CLIN-003` (`FEAT-056`)
- **Reason:** Ensure clinician receives immediate in-app alerts when a patient indicates suicidal ideation (PHQ-9 Question 9).
- **Dependencies:** None.
- **Acceptance Criteria:**
  1. `assessment.service.js` lines 91 and 290 invoke `notificationService.notify(...)`.
  2. Notification record is committed to `notifications/{psychologistId}` with title `CRITICAL CLINICAL REVIEW`.
- **Required Test:** Submit PHQ-9 with Q9=3 and assert `notifications/{psychologistId}` contains `clinical_risk_alert`.
- **Evidence:** Unit test asserting notification creation.

#### Task ID: `TASK-G1-04`
- **Title:** Decommission or Resolve Prescription Endpoint
- **Priority:** **P1 — High**
- **Associated Defect:** `DEF-CLIN-004` (`FEAT-038`)
- **Reason:** Eliminate unhandled 500 server crash on `POST /api/v1/clinical/prescriptions`.
- **Dependencies:** None.
- **Acceptance Criteria:**
  1. Replace broken stub in `clinical.controller.js` with an explicit clinical referral or scope-of-practice restriction response (HTTP 403 or 422), or implement `createPrescriptionRecord` if approved.
  2. No uncaught `TypeError` in backend logs.
- **Required Test:** Call `POST /api/v1/clinical/prescriptions` and verify clean HTTP status (not 500).
- **Evidence:** Supertest assertion confirming handled response.

#### Task ID: `TASK-G1-05`
- **Title:** Align Frontend AdminDashboard with adminService Contract
- **Priority:** **P1 — High**
- **Associated Defect:** `DEF-FE-005` (`FEAT-061`–`FEAT-066`)
- **Reason:** Restore full operational functionality to the Administrator Portal.
- **Dependencies:** None.
- **Acceptance Criteria:**
  1. Update `adminService.js` or `AdminDashboard.jsx` so all method names match: `getMetrics`, `getPsychologists`, `reviewPsychologist`, `getUsers`, `getFaqs`, `getContactSubmissions`, `getAuditLogs`.
  2. Admin dashboard renders telemetry, approval cards, and audit logs without console errors.
- **Required Test:** Live browser subagent audit on `/admin/dashboard`.
- **Evidence:** Browser console clean of `TypeError`.

---

### GROUP 2 — CORE FEATURE REPAIRS & CLEANUP

#### Task ID: `TASK-G2-01`
- **Title:** Align PatientDashboard with assessmentService Contract
- **Priority:** **P2 — Medium**
- **Associated Defect:** `DEF-FE-006` (`FEAT-053`)
- **Acceptance Criteria:** `PatientDashboard.jsx` calls `assessmentService.listPatientAssignments()`. Assigned assessment banner displays when questionnaire is pending.

#### Task ID: `TASK-G2-02`
- **Title:** Align RiskReviewBanner & DocumentationQualityWidget Method Names
- **Priority:** **P2 — Medium**
- **Associated Defect:** `DEF-FE-007`, `DEF-FE-008` (`FEAT-056`, `FEAT-060`)
- **Acceptance Criteria:** Update method calls in `RiskReviewBanner.jsx` and `DocumentationQualityWidget.jsx` to match `analyticsService.js`. Risk banners and quality scans function without errors.

#### Task ID: `TASK-G2-03`
- **Title:** Update Default Gemini Model to gemini-3.8-flash
- **Priority:** **P2 — Medium**
- **Associated Defect:** `DEF-AI-009` (`FEAT-046`)
- **Acceptance Criteria:** Replace deprecated `gemini-2.5-flash` with `gemini-3.8-flash` in `geminiAdapter.js` lines 41, 45, 66 and in `.env.example`.

#### Task ID: `TASK-G2-04`
- **Title:** Deprecate Stale Phase 0 Scaffolding Routes
- **Priority:** **P3 — Low**
- **Associated Defect:** `DEF-ARC-010`
- **Acceptance Criteria:** Remove or cleanly redirect legacy endpoints in `auth.routes.js`, `patient.routes.js`, `session.routes.js`, and `audit.routes.js`.

---

### GROUP 3 — FINAL HARDENING & VERIFICATION (PHASE 8 TARGET)

#### Task ID: `TASK-G3-01`
- **Title:** End-to-End Automated Browser Regression Suite
- **Priority:** **High**
- **Description:** Implement Cypress/Playwright suites covering Workflows A through K:
  - Patient registration -> intake completion -> booking -> assessment submission.
  - Psychologist availability setup -> appointment acceptance -> clinical session -> SOAP draft -> finalization.
  - Admin approval of new psychologist -> audit log verification.
- **Acceptance Criteria:** 100% automated browser tests pass against staging build.

#### Task ID: `TASK-G3-02`
- **Title:** Clinical Safety & HIPAA Privacy Hardening
- **Priority:** **High**
- **Description:**
  - Audit all log outputs to guarantee zero Protected Health Information (PHI) or transcript text appears in production stdout/files.
  - Verify that session transcripts and notes are encrypted at rest and in transit.
  - Verify audit log retention policies and immutability.
- **Acceptance Criteria:** Zero PHI in logs; encryption-in-transit (TLS 1.3) enforced.

#### Task ID: `TASK-G3-03`
- **Title:** Redis / BullMQ Production Queue Worker Cluster
- **Priority:** **Medium**
- **Description:** Configure multi-worker BullMQ cluster backed by managed Redis for horizontal scaling of AI drafting jobs beyond single-process Node.js limits.
- **Acceptance Criteria:** Backend seamlessly toggles to BullMQ when `REDIS_URL` is set; jobs process in parallel without starvation.

---

### GROUP 4 — RELEASE PREPARATION & DEPLOYMENT

#### Task ID: `TASK-G4-01`
- **Title:** Production Environment Config & Secrets Management
- **Priority:** **High**
- **Description:** Establish Google Secret Manager or Cloud KMS for runtime injection of `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `FIREBASE_PRIVATE_KEY`, and Google OAuth client secrets.
- **Acceptance Criteria:** Zero plaintext secrets in `.env` or repository.

#### Task ID: `TASK-G4-02`
- **Title:** CI/CD Deployment Pipeline & Dockerization
- **Priority:** **High**
- **Description:** Author multi-stage Dockerfiles for backend and frontend. Build GitHub Actions workflow running linting, test suites, and staging deployments.
- **Acceptance Criteria:** Automated PR verification; zero-downtime rolling container deployments.

#### Task ID: `TASK-G4-03`
- **Title:** Operational Disaster Recovery & Data Backup Runbook
- **Priority:** **Medium**
- **Description:** Document automated daily RTDB export schedules, point-in-time recovery steps, and service failover protocols.
- **Acceptance Criteria:** Tested database recovery procedure from cold snapshot.
