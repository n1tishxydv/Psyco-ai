# Psyco AI — Remediation Register & Defect Log

**Target Document:** `docs/audits/PSYCO_AI_REMEDIATION_REGISTER.md`  
**Application:** Psyco AI Mental Health Practice Management Platform  
**Target Environments:**  
- **Staging Frontend:** [https://psyco-ai-staging.web.app](https://psyco-ai-staging.web.app/)  
- **Staging Backend:** [https://psyco-ai.onrender.com](https://psyco-ai.onrender.com/)  
**Classification:** Engineering Defect Tracking & Resolution Register  
**Audit Date:** October 2026

---

## 1. Remediation Summary Matrix

| ID | Title / Subsystem | Severity | Status | Changed Files |
|---|---|---|---|---|
| **DEF-01** | Reports Page Runtime Crash (`TypeError: c.find is not a function`) | **P1** | **RESOLVED** | `frontend/src/services/clinicalService.js`<br>`frontend/src/features/clinical/ReportsPage.jsx`<br>`backend/src/tests/reports_runtime_regression.test.js` |
| **DEF-02** | Inconsistent Data Envelope Extraction Across Clinical Features | **P2** | **RESOLVED** | `frontend/src/services/clinicalService.js`<br>`frontend/src/features/clinical/PatientDirectoryPage.jsx`<br>`frontend/src/features/clinical/TreatmentPlansPage.jsx` |
| **DEF-03** | Suspicious Root Artifacts (`r`, `taged = git diff --cached --name-only`) | **P3** | **DOCUMENTED** | Documented in audit; isolated from runtime build. Tracked for Git purge. |
| **DEF-04** | Outdated Documentation Contradicting AI Sandbox & Test Counts | **P3** | **RESOLVED** | `README.md`<br>`backend/.env.example` |
| **DEF-05** | Form Disable State on Empty Assigned Patient Roster | **P2** | **RESOLVED** | `frontend/src/features/clinical/ReportsPage.jsx` |
| **DEF-06** | Unhandled Error When Calling `generateReport` with Nested Object Payload | **P2** | **RESOLVED** | `frontend/src/services/clinicalService.js` |

---

## 2. Detailed Defect Investigations & Remediation Logs

### DEF-01: Critical Runtime Error on Reports Workspace
* **Severity:** **P1** (Broken Core Workflow / Runtime Crash)
* **Status:** **RESOLVED & VERIFIED**
* **Discovered At:** Minified staging production bundle `ReportsPage-AkL9H0mD.js:12:79` (`ReportsPage.jsx:140`).
* **Symptom:**
  When a logged-in psychologist navigated to `/psychologist/reports`, the React ErrorBoundary caught an uncaught exception: `TypeError: c.find is not a function`. The page was un-renderable.
* **Root Cause:**
  Backend `getAssignedPatients` controller enveloped patient records into `{ success: true, data: { patients: [...] } }`. In `clinicalService.js`, `getPatients` attempted extraction via `res?.patients || res || []`. Because `res.patients` was undefined, `res` (the envelope object) was returned. In `ReportsPage.jsx`, `setPatients(data || [])` stored this object in state, and line 140 called `patients.find(...)`, crashing immediately.
* **Remediation Implemented:**
  1. Updated `frontend/src/services/clinicalService.js` with `normalizePatientList` ensuring a guaranteed `Array` is returned, with backward-compatible `.data.patients` property preservation.
  2. Updated `frontend/src/features/clinical/ReportsPage.jsx` to defensively normalize received rosters, guard all array operations (`safePatients.find`), provide loading and empty states, and fallback identifiers (`p.patientId || p.id`).
* **Verification Evidence:**
  16 new regression tests in `backend/src/tests/reports_runtime_regression.test.js` covering valid arrays, empty arrays, null responses, missing properties, object envelopes, and role authorization. All 16 passed.

---

### DEF-02: Inconsistent Service Envelope Handling Across Pages
* **Severity:** **P2** (Contract Inconsistency & Latent Fragility)
* **Status:** **RESOLVED**
* **Root Cause:**
  `PatientDirectoryPage.jsx` and `TreatmentPlansPage.jsx` had previously worked around the service layer bug by writing `res.data?.patients || []`. If the service layer had returned a plain array, `res.data` would have evaluated to undefined, potentially breaking those components.
* **Remediation Implemented:**
  Normalized `clinicalService.js` to return an Array instance with attached `.data = { patients: safeArray }` and updated component extraction to `Array.isArray(res) ? res : (res?.data?.patients || [])`.
* **Verification Evidence:**
  Frontend staging build succeeded in 5.53s with 0 errors. All 250 backend tests passing.

---

### DEF-03: Suspicious Root Repository Artifacts
* **Severity:** **P3** (Repository Hygiene)
* **Status:** **DOCUMENTED & ISOLATED**
* **Files:**
  - `r` (16,653 bytes)
  - `taged = git diff --cached --name-only` (11,869 bytes)
* **Root Cause:**
  Forensic inspection revealed both files were committed on October 28, 2026 in commit `bcfbfa381750f0bac24a2bc3d00b843eac1b0593` ("Prepare staging deployment for Render and Firebase Hosting"):
  - `r`: Text capture of `less` pager command manual.
  - `taged = git diff --cached --name-only`: Shell redirect output resulting from an unquoted terminal command during staging git diff inspection.
* **Impact Assessment:**
  Neither file is imported by frontend or backend source code. Vite and Node ignore root text files. No sensitive clinical data, keys, or tokens are present in either file.
* **Remediation Recommendation:**
  Remove these two stray files via standard Git branch PR during next repository maintenance cycle.

---

### DEF-04: Documentation Contradictions with AI Sandbox
* **Severity:** **P3** (Documentation Accuracy)
* **Status:** **RESOLVED**
* **Root Cause:**
  `README.md` previously claimed "HIPAA/clinical-privacy aligned" (unsupported certification claim) and stated automated test count was 131 tests, missing Phase 4-7, Phase 6.3 AI Sandbox, and runtime regression tests.
* **Remediation Implemented:**
  Updated `README.md` to accurately document Phase 6.3 AI Sandbox settings, deterministic mock provider, fail-closed startup, text-only storage invariants, and the current 250 automated tests.

---

### DEF-05: Form Submission Disabled on Empty Assigned Roster
* **Severity:** **P2** (UX Validation)
* **Status:** **RESOLVED**
* **Root Cause:**
  On a new clinician account with zero assigned consultations, the "Generate Official Report" button was enabled if `selectedPatientId` had a stale value, attempting to generate an invalid report.
* **Remediation Implemented:**
  Added `safePatients.length === 0` to the `disabled` property of the submit button, along with an explicit explanatory banner: *"No patients assigned yet. Consultations must be booked first."*
* **Verification Evidence:**
  Verified in `ReportsPage.jsx` and tested with empty roster synthetic inputs.

---

### DEF-06: Unhandled Object Argument in `generateReport`
* **Severity:** **P2** (Service Polymorphism)
* **Status:** **RESOLVED**
* **Root Cause:**
  `clinicalService.generateReport` previously handled `(patientId, payload)` but failed if called with a single object `{ patientId, reportType }`.
* **Remediation Implemented:**
  Added polymorphic signature support in `clinicalService.generateReport` handling both string patientId with second argument and single payload object.

---

## 3. Verification & Sign-Off Matrix

| Test Suite / Tool | Command | Scope | Result |
|---|---|---|---|
| **Backend Test Suite** | `npm test` | All 22 test suites (auth, clinical, ReBAC, AI sandbox, reports regression) | **250 / 250 PASS** |
| **Reports Regression** | `node --test src/tests/reports_runtime_regression.test.js` | 16 dedicated contract & security tests | **16 / 16 PASS** |
| **Frontend Staging Build**| `npm run build:frontend:staging` | Full Vite production compilation | **PASS (5.53s, 0 errors)** |
| **Git Whitespace & Format**| `git diff --check` | Formatting, line endings, whitespace | **0 ERRORS** |
