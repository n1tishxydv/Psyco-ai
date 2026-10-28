# Psyco AI — Complete Audit & Verification Execution Evidence

**Audit Date:** October 28, 2026  
**Auditor:** Senior Full-Stack, Firebase Architect & Healthcare Security QA Auditor  
**Repository Root:** `.`  
**Execution Environment:** Windows, Node.js v24.15.0, Vite 6.4.5, Express 4.19  

---

## 1. Baseline Test Suite Execution

### 1.1 Backend Automated Test Suite
* **Command:** `npm test` inside `backend/`
* **Test Framework:** Node.js native test runner (`node --test`)
* **Execution Timestamp:** 2026-10-28T08:56:32Z
* **Result:** Exit Code 0 (ALL 112 TESTS PASSED)
* **Metrics:**
  * Tests Discovered: 112
  * Passed: 112
  * Failed: 0
  * Skipped: 0
  * Cancelled: 0
  * Duration: 3179.38 ms

```
ℹ tests 112
ℹ suites 0
ℹ pass 112
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3179.3765
```

### 1.2 Frontend Production Build Verification
* **Command:** `npm run build` inside `frontend/`
* **Bundler:** Vite v6.4.5 + Rollup
* **Result:** Exit Code 0 (SUCCESSFUL BUILD, 0 ERRORS)
* **Assets Generated:**
  * `dist/index.html` (1.08 kB, gzip: 0.59 kB)
  * `dist/assets/index-GBrTbflC.css` (63.29 kB, gzip: 10.82 kB)
  * `dist/assets/index-CPiSydzu.js` (1,154.91 kB, gzip: 259.62 kB)
* **Build Duration:** 5.67s

---

## 2. Live Cloud Database Operations (Firebase Realtime Database)

### 2.1 Service Account Authentication Probe
* **Service Account:** `firebase-adminsdk-fbsvc@psyco-9c13d.iam.gserviceaccount.com`
* **Target Project ID:** `psyco-9c13d`
* **Target Cloud Database URL:** `https://psyco-9c13d-default-rtdb.firebaseio.com/`
* **Token Algorithm:** RSA-SHA256 (RS256) private key signature to Google OAuth2 token endpoint (`https://oauth2.googleapis.com/token`)
* **Verification Output:**
  ```
  OAuth2 Bearer Token Generated Successfully: Length 1024 chars
  Token Scope: https://www.googleapis.com/auth/userinfo.email, https://www.googleapis.com/auth/firebase.database
  ```

### 2.2 Direct Remote Write, Read, and Delete Validation
* **Probe File:** `scratch/probe_rtdb_live.js`
* **Target Path:** `audit_verification/probe_1793176767222.json`
* **Write Result:** HTTP 200 OK
* **Direct Read Result:** HTTP 200 OK (returned exact JSON payload from Google's servers without local memory involvement)
* **Delete Result:** HTTP 200 OK

### 2.3 Live Cloud Root Collection Discovery
* **Script:** `scratch/inspect_cloud_rtdb.js`
* **Result:** Confirmed **28 active root collections** stored in live Google Cloud RTDB:
  1. `aiDrafts`
  2. `aiJobs`
  3. `analytics`
  4. `appointments`
  5. `assessmentAssignments`
  6. `assessmentDefinitions`
  7. `assessmentResults`
  8. `auditLogs`
  9. `availability`
  10. `clinicalActions`
  11. `consentRecords`
  12. `contactSubmissions`
  13. `documentationFindings`
  14. `faqSubmissions`
  15. `intakeTemplates`
  16. `notifications`
  17. `patientIntake`
  18. `patients`
  19. `psychologists`
  20. `riskReviewFlags`
  21. `sessionNotes`
  22. `sessionRecords`
  23. `sessionTranscripts`
  24. `systemStatus`
  25. `transcriptEntries`
  26. `transcriptVersions`
  27. `treatmentPlans`
  28. `users`

### 2.4 End-to-End Application Write to Cloud Verification
* **API Action:** `POST /api/v1/public/contact`
* **Generated Record:** `cnt_1793177468645_q1fxo`
* **Remote Retrieval via Google RTDB API:**
  ```json
  {
    "id": "cnt_1793177468645_q1fxo",
    "name": "Auditor Synthetic Verification",
    "email": "auditor@example.com",
    "subject": "System Verification",
    "message": "Audit verification of contact persistence to RTDB",
    "createdAt": "2026-10-28T08:51:08.645Z",
    "status": "new",
    "ipAddress": "::1"
  }
  ```
* **Status:** HTTP 200 verified directly from `https://psyco-9c13d-default-rtdb.firebaseio.com/contactSubmissions/cnt_1793177468645_q1fxo.json`.

---

## 3. Account Provisioning & Authorization Verification

### 3.1 Intended Administrator Identity
* **Target Account:** `admin.staging@psyco.clinic`
* **Firebase UID:** `GQCjxZQwc2dxxKSBPeALbdkDYHE2`
* **Database Path:** `users/GQCjxZQwc2dxxKSBPeALbdkDYHE2`
* **Verified Stored Role:** `admin` (Strictly singular role: `role: "admin"`)
* **Clinical Records Barrier:** Verified via automated tests; administrator requesting clinical charts receives HTTP 403 `CLINICAL_PRIVACY_VIOLATION`.

### 3.2 Cloud User Accounts Breakdown
* **Psychologists:** 11 registered profiles
* **Admins:** 5 registered admin accounts
* **Patients:** 8 registered patient accounts

---

## 4. Cryptographic Authentication & Security Probes

| Test Scenario | Request | Expected Status | Actual Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **No Authorization Header** | `GET /api/v1/admin/metrics` | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Returned `Authentication token required` |
| **Forged Bearer Token** | `GET /api/v1/profile/me` with `Bearer forged.token` | 401 TOKEN_VERIFICATION_FAILED | 401 TOKEN_VERIFICATION_FAILED | Returned `Malformed token: could not decode JWT structure` |
| **Invalid Auth Scheme** | `GET /api/v1/clinical/sessions` with `InvalidScheme ...` | 401 UNAUTHORIZED | 401 UNAUTHORIZED | Rejected malformed scheme |
| **Unapproved Clinician Access** | `GET /api/v1/psychologists/:unapprovedId` | 404 NOT_FOUND | 404 NOT_FOUND | Unapproved clinician filtered from public directory |
| **Admin Note Access (ReBAC)** | `GET /api/v1/clinical/patients/:id/chart` by Admin | 403 FORBIDDEN | 403 FORBIDDEN | Psychotherapy note barrier enforced |
| **Spam Honeypot Detection** | `POST /api/v1/public/contact` with `_hp_verification` filled | 200 OK (silent drop) | 200 OK (silent drop) | Logged `Spam submission detected and dropped via honeypot` |

---

## 5. Live External Provider Verification

### 5.1 Google Gemini (Clinical Documentation Copilot)
* **SDK:** `@google/genai` v0.1.1
* **Configured Primary Model:** `gemini-flash-lite-latest`
* **Fallback Models:** `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`
* **Multi-Lingual / Hinglish Capability:** Verified SYSTEM_INSTRUCTION contains explicit rules for parsing code-mixed Hindi-English dialogue ("mujhe anxiety ho rahi hai", "panic attacks aate hain") and synthesizing formal clinical documentation in standardized English.
* **1-Click Generation:** Verified combined Treatment Plan and SOAP note generation workflow.

### 5.2 AssemblyAI (Ambient Streaming Transcription)
* **Adapter:** `assemblyaiAdapter.js`
* **Base Endpoint:** `https://streaming.assemblyai.com/v3`
* **Streaming Protocol:** WebSockets (`wss://streaming.assemblyai.com/v3/ws`)
* **Audio Format:** PCM16 Mono 16000Hz
* **Live Token Probe Output:**
  ```
  AssemblyAI Result: {
    configured: true,
    isSimulated: false,
    tokenLength: 2667,
    wsUrl: 'wss://streaming.assemblyai.com/v3/ws?token=AQICAHhSP--gzqwd67dd...&sample_rate=16000'
  }
  ```

### 5.3 Google Calendar & Meet OAuth
* **Client ID:** `143160785926-q6ntk5o3qu7bdc916ke9rc7ool6fr5nk.apps.googleusercontent.com`
* **Redirect URI:** `http://localhost:5000/api/v1/integrations/google/callback`
* **Status:** Adapters implemented. Live token exchange requires clinician Google OAuth consent screen approval in development mode.

---

## 6. Browser Verification Subagent Summary

* **Public Routes Audited:**
  * `/` (Home) — Rendered hero, CTA buttons, services preview, testimonials, footer.
  * `/about` — Rendered mission, clinical leadership, credentials overview.
  * `/services` — Rendered therapy offerings, specialty cards, transparent pricing.
  * `/faq` — Rendered interactive accordion components; expandable Q&A tested.
  * `/contact` — Rendered inquiry form with validation feedback.
  * `/find-psychologist` — Rendered clinician discovery cards.
  * `/for-patients` — Rendered patient journey and secure portal guide.
  * `/for-psychologists` — Rendered practice management tools overview.
  * `/login` — Rendered email/password inputs, Google SSO button, and registration links.
* **Console Warnings & Errors:** Zero fatal errors; no unhandled promise rejections; zero React error-boundary triggers.
* **Route Protection:** Protected routes (`/admin/*`, `/psychologist/*`, `/patient/*`) correctly redirect unauthenticated sessions to `/login`.
