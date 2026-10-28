# PSYCO AI — MASTER STAGING ENVIRONMENT SETUP & VALIDATION REPORT

**Audit Date:** 2026-10-28  
**Final Staging Status:** **READY WITH BLOCKERS**  
**Lead Engineers:** Senior Full-Stack Engineer, Firebase Architect, DevOps Engineer, Security Specialist, QA Lead  
**Corpus Root:** `.`

---

## 1. Executive Summary & Assessment

The staging environment for Psyco AI has been successfully constructed, isolated, configured, seeded, and verified against a dedicated cloud Firebase Realtime Database instance. 

### Final Status Classification: **`READY WITH BLOCKERS`**
- **Core Staging Infrastructure**: **PASSED**. Isolated Firebase project (`psyco-ai-staging`), dedicated Realtime Database (`us-central1`), 27 deployed security rule nodes, fail-closed production guards, and 11 synthetic clinical test fixtures are active.
- **Persistence & Cloud CRUD**: **PASSED**. Live cloud writes, reads, updates, deletes, and persistence across restarts verified.
- **Automated Test Suite**: **PASSED**. 122 / 122 tests passing (100%) in 3.35s.
- **Frontend Staging Build**: **PASSED**. Clean Vite production build in 6.97s with zero leaked secrets.
- **AI Integrations**: **PASSED**. Live cloud Google Gemini SOAP draft generation and AssemblyAI v3 ephemeral streaming token issuance verified (`isSimulated: false`).
- **Remaining Blockers**: Specified operator actions required in Google Cloud Console for OAuth consent screen test user registration and clinician interactive Calendar authorization.

---

## 2. Environment & Infrastructure Identification

| Infrastructure Dimension | Staging Value | Verification Status |
| :--- | :--- | :--- |
| **GCP / Firebase Project ID** | `psyco-ai-staging` | Verified Dedicated Staging Project |
| **Project Number** | `651213878079` | Verified |
| **Realtime Database URL** | `https://psyco-ai-staging-default-rtdb.firebaseio.com/` | Verified US-Central1 Instance |
| **Service Account** | `firebase-adminsdk-fbsvc@psyco-ai-staging.iam.gserviceaccount.com` | Verified OAuth Bearer Token Minting |
| **Web App ID** | `1:651213878079:web:09848e67fa97d2dfbfd98a` | Verified Staging Client SDK |
| **Auth Domain** | `psyco-ai-staging.firebaseapp.com` | Configured |
| **Storage Policy** | Strict Text & Structured JSON Only | Verified (Base64/Binary Blocked) |
| **Production Target Protection** | Strict Rejection of `psyco-9c13d` | Tested & Verified (Exit Code 1) |

---

## 3. Files Created or Modified

### Implementation Files Modified/Created:
- [backend/scripts/seedStagingEnvironment.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/scripts/seedStagingEnvironment.js): Added `--dry-run` inspection mode, fail-closed target verification, and production project rejection.
- [backend/src/tests/staging_safety.test.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/staging_safety.test.js): Automated suite for production rejection, dry-run safety, storage invariants, and ReBAC note lockout.
- [backend/package.json](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/package.json): Added `dev:staging`, `start:staging`, `seed:staging`, and `seed:staging:dry-run`.
- [package.json (root)](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/package.json): Added workspace-level staging lifecycle scripts.
- [backend/.env.staging](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/.env.staging): Dedicated staging configuration for `psyco-ai-staging`.
- [frontend/.env.staging](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/.env.staging): Staging client SDK configuration.
- [.gitignore](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/.gitignore): Verified secret protection rules for `.env.*` and service account keys.

### Documentation Files Generated (`docs/staging/`):
1. [BASELINE_AUDIT.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/BASELINE_AUDIT.md): Phase 0 baseline architecture, initial test results, and discovered gaps.
2. [STAGING_ARCHITECTURE.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/STAGING_ARCHITECTURE.md): Phase 1 isolated topology, IAM boundaries, and data flows.
3. [DATABASE_SECURITY_REVIEW.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/DATABASE_SECURITY_REVIEW.md): Phase 2 audit of 27 deployed RTDB security rule nodes and ReBAC note lockout.
4. [SEEDING_SAFETY.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/SEEDING_SAFETY.md): Phase 3 seeder safeguards, dry-run inspection, and production rejection proofs.
5. [REMOTE_DATABASE_VALIDATION.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/REMOTE_DATABASE_VALIDATION.md): Phase 5 live cloud CRUD and restart persistence verification.
6. [GOOGLE_SIGN_IN_VALIDATION.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/GOOGLE_SIGN_IN_VALIDATION.md): Phase 6 Google Sign-In status and OAuth test user registration steps.
7. [CALENDAR_MEET_VALIDATION.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/CALENDAR_MEET_VALIDATION.md): Phase 7 Google Calendar & Meet integration analysis and consent steps.
8. [AI_INTEGRATION_VALIDATION.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/AI_INTEGRATION_VALIDATION.md): Phase 8 live Gemini & AssemblyAI cloud validation evidence.
9. [SECURITY_AND_PRIVACY_TESTS.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/SECURITY_AND_PRIVACY_TESTS.md): Phase 9 endpoint security matrix, ReBAC barrier tests, and Q9 safety gate.
10. [LOCAL_STAGING_RUNBOOK.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/LOCAL_STAGING_RUNBOOK.md): Phase 10 exact Windows PowerShell commands for local execution.
11. [DEPLOYMENT_READINESS.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/DEPLOYMENT_READINESS.md): Phase 12 hosting architecture, build artifact validation, and deployment boundaries.
12. [STAGING_SETUP_REPORT.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/STAGING_SETUP_REPORT.md): Phase 14 master comprehensive report.

---

## 4. Test Execution & Pass/Fail Metrics

### 4.1 Backend Automated Test Suite
- **Command Executed**: `npm test` (executed in `/backend`)
- **Total Tests**: **122**
- **Passed**: **122 (100%)**
- **Failed**: **0**
- **Duration**: **3349ms**

### 4.2 Frontend Production Staging Build
- **Command Executed**: `npm run build:frontend:staging` (runs `vite build --mode staging`)
- **Result**: **SUCCESS** in 6.97s
- **Output Artifacts**: `frontend/dist/` (HTML, CSS, JS bundles)
- **Leaked Secret Check**: 0 private keys, 0 client secrets found in distribution bundle.

---

## 5. Real Cloud Integrations Verified

1. **Staging Realtime Database Security Rules**:
   - Deployed 27 rule nodes to `https://psyco-ai-staging-default-rtdb.firebaseio.com/.settings/rules.json` via Google Cloud Management API PUT (HTTP 200).
2. **Staging Synthetic Dataset Seeding**:
   - Successfully populated 11 clinical entities into `psyco-ai-staging-default-rtdb`: Admin, Approved Clinician, Patient, Schedule Availability, Appointment, Session Record, SOAP Draft Note, Treatment Plan, PHQ-9 Assignment, PHQ-9 Result (Mild), and Risk Flag.
3. **Live Cloud CRUD & Persistence**:
   - Executed live set, get, update, remove lifecycle probe on remote staging RTDB.
   - Verified that `appointments/apt_staging_001` persists across backend server reboots.
4. **Google Gemini Live Cloud Inference**:
   - Executed live inference test against model `gemini-flash-lite-latest` using staging credentials.
   - Returned structured clinical SOAP draft with `isSimulated: false`.
5. **AssemblyAI Live Streaming Token Generation**:
   - Executed live token request to `https://streaming.assemblyai.com/v3/token`.
   - Minted valid 60-second ephemeral streaming token with `isSimulated: false`.

---

## 6. Integrations Remaining Blocked & Why

| Integration | Status | Root Cause |
| :--- | :--- | :--- |
| **Google Sign-In** | BLOCKED: OPERATOR ACTION REQUIRED | OAuth Consent Screen is in "Testing" mode. Google blocks logins from accounts not explicitly registered under Audience > Test Users. |
| **Google Calendar & Meet** | BLOCKED: OPERATOR ACTION REQUIRED | Automated agent cannot interactively complete a browser consent dialog to grant calendar access for a clinician account. |

---

## 7. Security Issues Discovered & Remediation

1. **Silent Fallback Elimination**:
   - Issue: RTDB adapter could previously log warnings and retain data in local memory if remote writes failed without a service account.
   - Fix: In staging and production modes with service account configured, `firebaseRtdbAdapter.set()`, `update()`, and `remove()` throw observable errors upon remote HTTP errors.
2. **Missing Dry-Run & Production Target Rejection**:
   - Issue: Seeder previously ran immediately without dry-run inspection, and did not fail closed on missing project IDs.
   - Fix: Added `--dry-run` mode and fail-closed checks that abort execution with exit code 1 if targeting `psyco-9c13d` or if targets are undefined.
3. **Clinical Privacy Lockout Verification**:
   - Verified both in database rules and in Express middleware that administrators are strictly prohibited from reading psychotherapy notes.

---

## 8. Exact Manual Operator Actions Required Next

### Action A: Unblock Google Sign-In
1. Navigate to [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=psyco-ai-staging).
2. Ensure project **`psyco-ai-staging`** is selected.
3. Under **Test users**, click **+ ADD USERS**.
4. Add your testing Google Account email addresses and click **SAVE**.

### Action B: Connect Clinician Calendar for Google Meet
1. Log into the Psyco AI staging clinician portal at `http://localhost:5173/psychologist/settings`.
2. Click **"Connect Google Calendar"**.
3. Complete the interactive Google OAuth consent screen.
4. Book an online appointment to verify automatic Google Meet link generation.

---

## 9. Commands to Start Local Staging Services

Open two PowerShell windows:

```powershell
# Terminal 1: Backend in Staging Mode
npm run dev:backend:staging

# Terminal 2: Frontend in Staging Mode
npm run dev:frontend:staging
```

Verify backend health:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health"
```
