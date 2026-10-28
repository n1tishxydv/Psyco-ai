# PSYCO AI — DEFECT REGISTER & ISSUES LOG

**Generated Date:** October 28, 2026  
**Auditor:** Antigravity Senior Application Security, QA & Full-Stack Lead

---

## 1. DEFECT CLASSIFICATION SCHEME

- **P0 (Critical):** Vulnerability in authentication/authorization, data corruption/loss, secret leakage, or violation of clinical safety gates. Must be fixed immediately.
- **P1 (High):** Major broken workflow, unhandled runtime exception, missing service method, or false integration reporting. Blocks Phase 8 release.
- **P2 (Medium):** Secondary feature failing, frontend-to-service contract mismatch, or deprecated API dependency. Must be resolved before general release.
- **P3 (Low):** Dead scaffolding code, minor cosmetic inconsistency, or non-blocking documentation discrepancy.

---

## 2. DEFECT LOG

### DEFECT-01: Insecure JWT Signature Verification in FirebaseAuthAdapter
- **Defect ID:** `DEF-SEC-001`
- **Severity:** **P0 — Critical**
- **Category:** Authentication & Application Security
- **Affected Phase:** Phase 2 (Authentication & Onboarding)
- **Affected Feature:** `FEAT-010`, `FEAT-012` (Token Verification)
- **Affected File:** [firebaseAuthAdapter.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/integrations/firebase/firebaseAuthAdapter.js#L52-L75)
- **Reproduction Steps:**
  1. Construct a mock un-signed JWT string with payload `{ sub: "victim_psychologist_uid", iss: "https://securetoken.google.com/psyco-9c13d", aud: "psyco-9c13d", exp: 9999999999 }`.
  2. Send an HTTP request to any protected endpoint (`GET /api/v1/profile/me`) with `Authorization: Bearer <un-signed-jwt>`.
- **Expected Result:** Backend rejects the token with HTTP 401 because the cryptographic signature is missing or unverified against Google's public certificates.
- **Actual Result:** `firebaseAuthAdapter.js` calls `jwt.decode(token)` (which does not check signatures) and validates only string equality of `iss`, `aud`, and `exp`. The forged token is accepted, granting unauthorized access to the victim account.
- **Root Cause:** Code relies on `jwt.decode` rather than `firebase-admin.auth().verifyIdToken()` or `jsonwebtoken.verify()` with Google's public x509 certs (`https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`).
- **Recommended Correction:** Replace `jwt.decode` with official `verifyIdToken` via `firebase-admin` or fetch and verify Google's public x509 certificates.
- **Blocks Major Workflow:** Yes (All authenticated API endpoints).
- **Resolution Gate:** Must be resolved before Phase 8 and before any production deployment.

---

### DEFECT-02: Remote Firebase Realtime Database Writes Reject with 401 Unauthorized
- **Defect ID:** `DEF-DAT-002`
- **Severity:** **P0 — Critical**
- **Category:** Persistence & Cloud Infrastructure
- **Affected Phase:** Phase 0–7 (All Persistent Modules)
- **Affected Feature:** All database-backed features
- **Affected File:** [firebaseRtdbAdapter.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/integrations/firebase/firebaseRtdbAdapter.js#L158-L176), [backend/.env](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/.env#L16-L17)
- **Reproduction Steps:**
  1. Trigger any database write (e.g., submit contact form, book appointment, save clinical note).
  2. Observe backend stdout logs.
- **Expected Result:** Record is committed remotely to `https://psyco-9c13d-default-rtdb.firebaseio.com` via authenticated REST or Admin SDK.
- **Actual Result:** `[WARN] RTDB remote write failed with status 401 for path ...` is logged. Backend falls back to writing exclusively to local memory and `backend/data/rtdb_snapshot.json`.
- **Root Cause:** `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are empty in `backend/.env`. REST writes do not pass an admin auth token; cloud Firebase rules reject unauthenticated writes.
- **Recommended Correction:** Populate `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` with a valid Firebase Service Account key, and deploy `database.rules.json` to project `psyco-9c13d`.
- **Blocks Major Workflow:** Yes (Multi-instance deployment, persistent cloud records).
- **Resolution Gate:** Must be resolved before Phase 8 release assessment.

---

### DEFECT-03: Silent Failure of Assessment & Risk Review Notifications
- **Defect ID:** `DEF-CLIN-003`
- **Severity:** **P1 — High**
- **Category:** Clinical Safety & Notification Systems
- **Affected Phase:** Phase 7 (Standardized Assessments & Risk Review)
- **Affected Feature:** `FEAT-056` (PHQ-9 Q9 Clinical Risk Alert Notification)
- **Affected File:** [assessment.service.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/services/assessment.service.js#L91), [assessment.service.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/services/assessment.service.js#L290)
- **Reproduction Steps:**
  1. Submit a PHQ-9 assessment with Question 9 > 0 (suicidal ideation).
  2. Inspect backend logs.
- **Expected Result:** Notification is recorded in `notifications/{psychologistId}` alerting the clinician.
- **Actual Result:** Warning logged: `Could not dispatch risk alert notification: notificationService.sendNotification is not a function`. The notification is dropped silently.
- **Root Cause:** `assessment.service.js` calls `notificationService.sendNotification(...)`, whereas `notification.service.js` defines the method as `notificationService.notify(...)`.
- **Recommended Correction:** Update `assessment.service.js` lines 91 and 290 to call `notificationService.notify(...)` with `{ recipientUid, type, title, message }`.
- **Blocks Major Workflow:** Yes (Clinician immediate in-app alerting for elevated suicidal risk).
- **Resolution Gate:** Must be resolved before Phase 8.

---

### DEFECT-04: Missing Service Method for Medication Prescriptions (Runtime 500)
- **Defect ID:** `DEF-CLIN-004`
- **Severity:** **P1 — High**
- **Category:** Backend API & Route Handlers
- **Affected Phase:** Phase 4 (Clinical Workspace)
- **Affected Feature:** `FEAT-038` (Prescription Recording Endpoint)
- **Affected File:** [clinical.controller.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/controllers/clinical.controller.js#L190-L198), [clinical.service.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/services/clinical.service.js)
- **Reproduction Steps:**
  1. Send an authenticated HTTP POST request to `/api/v1/clinical/prescriptions` with valid payload `{ patientId, medicationName, dosage, instructions }`.
- **Expected Result:** Either successfully records prescription or returns 403 Forbidden under psychologist scope-of-practice constraints.
- **Actual Result:** Controller throws unhandled error: `clinicalService.createPrescriptionRecord is not a function`, returning HTTP 500.
- **Root Cause:** Controller delegates to `clinicalService.createPrescriptionRecord`, which was never authored in `clinical.service.js`.
- **Recommended Correction:** Since psychologists are not authorized to prescribe medication without psychiatrist credentials, cleanly decommission `/api/v1/clinical/prescriptions` or implement an explicit referral record.
- **Blocks Major Workflow:** No (Secondary workflow), but causes unhandled 500 server error.
- **Resolution Gate:** Must be resolved before Phase 8.

---

### DEFECT-05: Frontend AdminDashboard Method Name Contract Mismatch
- **Defect ID:** `DEF-FE-005`
- **Severity:** **P1 — High**
- **Category:** Frontend UI & Service Contract
- **Affected Phase:** Phase 8 (Governance & Administration)
- **Affected Feature:** `FEAT-061`, `FEAT-062`, `FEAT-063`, `FEAT-064`, `FEAT-066`
- **Affected File:** [AdminDashboard.jsx](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/features/admin/AdminDashboard.jsx#L60-L70), [adminService.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/services/adminService.js)
- **Reproduction Steps:**
  1. Log into frontend as an Administrator and navigate to `/admin/dashboard`.
  2. Open browser developer console.
- **Expected Result:** Telemetry metrics, psychologist approvals, and user directory load cleanly.
- **Actual Result:** Component throws uncaught `TypeError: adminService.getPlatformMetrics is not a function`. Dashboard shows error banner: "Unable to load administrative telemetry."
- **Root Cause:** `AdminDashboard.jsx` calls `getPlatformMetrics()`, `getPsychologistApprovals()`, `listUsers()`, `getFaqSubmissions()`, and `approvePsychologist()`. In `adminService.js`, the methods are named `getMetrics()`, `getPsychologists()`, `getUsers()`, `getFaqs()`, and `reviewPsychologist()`.
- **Recommended Correction:** Align `adminService.js` and `AdminDashboard.jsx` method signatures to match exactly.
- **Blocks Major Workflow:** Yes (All Admin Portal functionality in the browser).
- **Resolution Gate:** Must be resolved before Phase 8.

---

### DEFECT-06: Frontend PatientDashboard Assigned Assessments Method Mismatch
- **Defect ID:** `DEF-FE-006`
- **Severity:** **P2 — Medium**
- **Category:** Frontend UI & Patient Portal
- **Affected Phase:** Phase 7 (Standardized Assessments)
- **Affected Feature:** `FEAT-053`, `FEAT-054` (Patient Dashboard Assessment Banner)
- **Affected File:** [PatientDashboard.jsx](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/features/patients/PatientDashboard.jsx#L34), [assessmentService.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/services/assessmentService.js#L38)
- **Reproduction Steps:**
  1. Assign an assessment to a patient.
  2. Log into the Patient Portal as that patient and navigate to `/patient/dashboard`.
- **Expected Result:** Top alert banner shows "Clinical Assessment Assigned (1) — Action Requested".
- **Actual Result:** Banner never appears. Browser console shows: `Failed to load assignments: TypeError: assessmentService.getPatientAssignments is not a function`.
- **Root Cause:** `PatientDashboard.jsx` calls `getPatientAssignments()`, but the method in `assessmentService.js` is named `listPatientAssignments()`.
- **Recommended Correction:** In `PatientDashboard.jsx` line 34, change `getPatientAssignments` to `listPatientAssignments`.
- **Blocks Major Workflow:** No (Patient can still take test via direct URL, but UI prompt is hidden).
- **Resolution Gate:** Must be resolved before Phase 8.

---

### DEFECT-07: RiskReviewBanner Method Name Mismatch
- **Defect ID:** `DEF-FE-007`
- **Severity:** **P2 — Medium**
- **Category:** Frontend UI & Clinical Safety
- **Affected Phase:** Phase 7 (Risk Review & Safety Alerts)
- **Affected Feature:** `FEAT-056`, `FEAT-058` (Clinician Risk Review Alert Banner)
- **Affected File:** [RiskReviewBanner.jsx](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/features/clinical/RiskReviewBanner.jsx#L16), [analyticsService.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/services/analyticsService.js#L30)
- **Reproduction Steps:**
  1. Trigger an active risk flag on a patient.
  2. Log in as their psychologist and open the psychologist dashboard.
- **Expected Result:** Red banner alerts the psychologist of active risk review flags.
- **Actual Result:** Banner fails to render. Console logs: `Failed to load risk review flags: TypeError: analyticsService.getRiskFlags is not a function`.
- **Root Cause:** `RiskReviewBanner.jsx` calls `analyticsService.getRiskFlags()`, but the method in `analyticsService.js` is `listRiskFlags()`.
- **Recommended Correction:** In `RiskReviewBanner.jsx` line 16, change `getRiskFlags` to `listRiskFlags`.
- **Blocks Major Workflow:** Yes (Alert banner visibility for psychologist).
- **Resolution Gate:** Must be resolved before Phase 8.

---

### DEFECT-08: DocumentationQualityWidget Method Name Mismatches
- **Defect ID:** `DEF-FE-008`
- **Severity:** **P2 — Medium**
- **Category:** Frontend UI & Clinical Completeness
- **Affected Phase:** Phase 7 (Documentation Quality Gaps)
- **Affected Feature:** `FEAT-060` (Documentation Quality Widget)
- **Affected File:** [DocumentationQualityWidget.jsx](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/features/clinical/DocumentationQualityWidget.jsx#L26-L54), [analyticsService.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/services/analyticsService.js#L48-L65)
- **Reproduction Steps:**
  1. Open psychologist dashboard and click "Run Audit Scan" on the Documentation Quality widget.
- **Expected Result:** Runs audit scan and lists missing notes or incomplete treatment goals.
- **Actual Result:** Throws error: `analyticsService.getDocumentationFindings is not a function` and `scanDocumentationQuality is not a function`.
- **Root Cause:** Method names in widget (`getDocumentationFindings`, `scanDocumentationQuality`, `resolveDocumentationFinding`) do not match `analyticsService.js` (`listDocFindings`, `scanDocumentation`, `resolveDocFinding`).
- **Recommended Correction:** Align method names in `DocumentationQualityWidget.jsx`.
- **Blocks Major Workflow:** No (Quality audits only).
- **Resolution Gate:** Must be resolved before Phase 8.

---

### DEFECT-09: Gemini Model Fallback Points to Deprecated gemini-2.5-flash
- **Defect ID:** `DEF-AI-009`
- **Severity:** **P2 — Medium**
- **Category:** External AI Integration & Deprecation
- **Affected Phase:** Phase 6 (Gemini Clinical Copilot)
- **Affected Feature:** `FEAT-046`, `FEAT-047`
- **Affected File:** [geminiAdapter.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/integrations/gemini/geminiAdapter.js#L66), [backend/.env.example](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/.env.example#L36)
- **Reproduction Steps:**
  1. Remove `GEMINI_MODEL` from `backend/.env` to allow default fallback.
  2. Attempt an AI generation call using `@google/genai`.
- **Expected Result:** Model resolves and generates text.
- **Actual Result:** Google GenAI API returns `HTTP 404: This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash`.
- **Root Cause:** Hardcoded default fallback string `gemini-2.5-flash` is deprecated.
- **Recommended Correction:** Update fallback string in `geminiAdapter.js` lines 41, 45, 66 and in `.env.example` to `gemini-3.8-flash`.
- **Blocks Major Workflow:** Only if `.env` fails to supply `GEMINI_MODEL`.
- **Resolution Gate:** Must be resolved before Phase 8.

---

### DEFECT-10: Stale Phase 0 Scaffolding Routes Still Registered
- **Defect ID:** `DEF-ARC-010`
- **Severity:** **P3 — Low**
- **Category:** Code Integrity & Dead Code
- **Affected Phase:** Phase 0 (Foundation)
- **Affected Feature:** Route Registration
- **Affected Files:** `auth.routes.js`, `patient.routes.js`, `session.routes.js`, `audit.routes.js`
- **Reproduction Steps:**
  1. Send POST to `/api/v1/auth/register/patient` or GET to `/api/v1/patients/pat_123`.
- **Expected Result:** Endpoint either functions or returns 404.
- **Actual Result:** Returns 200/201 with static message: `"Registration endpoint scaffolded. Firebase integration will complete account creation in Phase 2."`
- **Root Cause:** Early scaffolding routes were never cleaned up when real routes were added in Phase 2, 4, and 8.
- **Recommended Correction:** Deprecate and remove stale route handlers in favor of active controllers.
- **Blocks Major Workflow:** No.
- **Resolution Gate:** Recommended cleanup before Phase 8.
