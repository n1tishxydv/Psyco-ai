# PSYCO AI — STAGING USER ACCEPTANCE TESTING (UAT) RESULTS

**Audit Date:** 2026-10-28  
**Environment:** Staging (`psyco-ai-staging`)  
**Database URL:** `https://psyco-ai-staging-default-rtdb.firebaseio.com/`  
**Lead Tester:** Senior QA Lead, Full-Stack Engineer, Healthcare Security Specialist  
**Overall UAT Status:** **READY WITH BLOCKERS**

---

## 1. Executive Summary

This document presents the complete User Acceptance Testing (UAT) results for the Psyco AI staging environment. Testing verified the running runtime configuration, token verification, three authenticated user portals (Patient, Psychologist, Administrator), scheduling conflict engines, clinical note workflows, clinical safety gates, AI copilot integration, and strict text-only storage policies.

### Summary Metrics

| Metric | Result | Notes |
| :--- | :---: | :--- |
| **Total Automated Tests Executed** | **131** | Node.js native test runner (`node --test src/tests/*.test.js`) |
| **Automated Tests Passed** | **131 (100%)** | 0 failed, 0 skipped, duration: 3.06s |
| **Live Cloud CRUD & Restart Probes** | **PASS** | Staging RTDB read, write, update, delete & persistence confirmed |
| **Live Third-Party AI Probes** | **PASS** | Google Gemini live inference & AssemblyAI v3 live streaming token |
| **Production Target Safeguard** | **PASS** | Staging seeder aborts immediately on `psyco-9c13d` (Code 1) |
| **Frontend Staging Build** | **PASS** | Vite compiles in 7.10s to `frontend/dist/`; zero bundled secrets |
| **Security & Privacy Defects Found** | **0 Remaining** | Audience mismatch resolved; sole admin role enforced |
| **Data Persistence Defects** | **0** | Strict text-only JSON enforced; binary media rejected |
| **Remaining Integration Blockers** | **1** | Clinician interactive Google Calendar OAuth consent dialog |

---

## 2. Comprehensive UAT Verification Matrix

| Test ID | Role | Workflow / Feature | Expected Result | Actual Result | Status | Evidence / Notes |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **ENV-01** | System | Environment Configuration Check | Backend reports `NODE_ENV=staging`, project `psyco-ai-staging` | HTTP 200, environment: `staging`, project: `psyco-ai-staging` | **PASS** | `/api/v1/health` diagnostic verified |
| **ENV-02** | System | Database Isolation Shield | Reject seeding or testing if targeted at `psyco-9c13d` | Aborts with `Refusing to seed synthetic staging data into primary database` | **PASS** | Verified via `staging_safety.test.js` & dry-run CLI |
| **AUTH-01** | Visitor | Unauthenticated Route Gate | Rejects protected endpoint with 401 Unauthorized | HTTP 401 `{"code": "UNAUTHORIZED"}` | **PASS** | Verified on `GET /api/v1/profile/me` |
| **AUTH-02** | Visitor | Malformed Token Signature | Rejects invalid or forged JWT signature with 401 | HTTP 401 `{"code": "INVALID_TOKEN"}` | **PASS** | Verified in `staging_uat_e2e.test.js` |
| **AUTH-03** | Admin | Administrator Authentication | Token verified against `psyco-ai-staging`; role is `admin` | Cryptographic signature match; profile role: `admin` | **PASS** | Verified for `admin.staging@psyco.clinic` (`fOA2tu4QflesR0uQHcTOywP8DDs1`) |
| **AUTH-04** | User | Role Tampering Protection | Client cannot elevate role by altering local storage or payload | Role update ignored/rejected; database role remains authoritative | **PASS** | Profile update strips or rejects `role: 'admin'` |
| **PAT-01** | Patient | Portal Navigation & Profile View | Patient accesses `/profile/me` and receives patient data | HTTP 200, returns patient record for `patient_staging_01` | **PASS** | Profile verified with non-sensitive fields |
| **PAT-02** | Patient | Appointment Schedule Inspection | Patient views own assigned appointments | HTTP 200, array of own appointments returned | **PASS** | Filtered by `patientId` |
| **PAT-03** | Patient | Cross-Patient Record Lockout | Patient A cannot view Patient B's chart | HTTP 403 Forbidden | **PASS** | ReBAC guard blocks cross-patient requests |
| **PAT-04** | Patient | Administrative Route Barrier | Patient cannot access `/api/v1/admin/metrics` | HTTP 403 Forbidden | **PASS** | `requireRole('admin')` blocks non-admins |
| **PSY-01** | Clinician | Clinician Practice Profile | Approved clinician accesses practice profile | HTTP 200, returns clinician profile with approved status | **PASS** | Verified for `psych_staging_01` |
| **PSY-02** | Clinician | Authorized Appointment Access | Clinician views authorized appointments | HTTP 200, returns active appointments | **PASS** | Verified for `apt_staging_001` |
| **PSY-03** | Clinician | Clinical Note Draft Creation | Clinician creates SOAP note draft | HTTP 201 Created, `status: 'draft'`, format: `'SOAP'` | **PASS** | Tested in `staging_uat_e2e.test.js` |
| **PSY-04** | Clinician | Unassigned Patient Chart Barrier | Unassigned clinician blocked from patient chart | HTTP 403 Forbidden (`Access denied. No active clinical relationship`) | **PASS** | ReBAC therapeutic relationship guard verified |
| **ADM-01** | Admin | Operational Dashboard Metrics | Admin accesses `/api/v1/admin/metrics` | HTTP 200, system uptime and platform metrics returned | **PASS** | Admin metrics endpoint verified |
| **ADM-02** | Admin | **Clinical Privacy Lockout Barrier** | Admin request for patient psychotherapy chart is barred | **HTTP 403 Forbidden** (`Administrative accounts are barred from accessing direct patient clinical notes`) | **PASS** | Express middleware & RTDB rule verified |
| **SCH-01** | Patient | Appointment Conflict Prevention | Rejects overlapping appointment slot | HTTP 409 Conflict (`SLOT_ALREADY_RESERVED`) | **PASS** | Conflict engine rejects overlapping booking |
| **SCH-02** | Patient | Validation Error on Malformed Mode | Booking with invalid session mode is rejected | HTTP 400 Bad Request (`VALIDATION_ERROR`) | **PASS** | Zod appointment validator verified |
| **SAF-01** | Clinician | **Q9 Suicide Risk Safety Gate** | Finalize blocked when unreviewed risk flag is active | **HTTP 412 Precondition Failed** (`active clinical risk-review flags require clinician acknowledgment`) | **PASS** | Precondition gate halts session finalization |
| **SAF-02** | Clinician | Risk Flag Acknowledgment | Clinician acknowledges flag; finalization succeeds | HTTP 200 OK on acknowledge; session status transitions to `'finalized'` | **PASS** | Verified in `staging_uat_e2e.test.js` |
| **STO-01** | System | Zero Base64 Audio Storage Invariant | RTDB adapter rejects base64 audio payloads | Throws `Error: Base64-encoded binary media is strictly forbidden` | **PASS** | Enforced in `assertValidPayload()` |
| **STO-02** | System | Zero Base64 Image Storage Invariant | RTDB adapter rejects base64 image payloads | Throws `Error: Base64-encoded binary media is strictly forbidden` | **PASS** | Enforced in `assertValidPayload()` |
| **STO-03** | System | 5MB Payload Ceiling | RTDB adapter rejects payloads exceeding 5MB | Throws `Error: Payload exceeds 5MB limit` | **PASS** | Enforced in `assertValidPayload()` |
| **AI-01** | System | Google Gemini Clinical Inference | Gemini generates structured SOAP draft | HTTP 200, `isSimulated: false`, returns valid Subjective & Plan | **PASS** | Live inference test verified |
| **AI-02** | System | AssemblyAI Ephemeral Token | Mint short-lived WebSocket token for ambient audio | HTTP 200, `isSimulated: false`, `expiresInSeconds: 60` | **PASS** | Live AssemblyAI v3 API token check |
| **CAL-01** | Clinician | Google Calendar & Meet Sync | Creates Google Calendar event with Meet link | Architecture, tokens & error fallbacks verified (PASS); live Google API event & Meet link generation blocked pending clinician consent grant | **BLOCKED** | See `docs/staging/CALENDAR_MEET_VALIDATION.md` for full 16-point post-authorization audit |

---

## 3. Defects Identified, Root Cause & Remediation

### Defect 1: JWT Audience Mismatch on Staging Login
* **Symptom:** User encountered `Failed to authenticate token: Cryptographic token verification failed: jwt audience invalid. expected: psyco-9c13d` on the onboarding screen.
* **Root Cause:** A background terminal process was running the backend in development mode (which defaulted to project `psyco-9c13d`), while the frontend was properly transmitting tokens from `psyco-ai-staging`.
* **Remediation:** 
  1. Terminated the lingering development server on port 5000.
  2. Updated [backend/src/config/index.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/config/index.js) with smart staging environment detection to reliably load `.env.staging` regardless of execution context.
  3. Re-launched backend with `npm run dev:backend:staging`. Verified `/api/v1/health` confirms `environment: staging` and `projectId: psyco-ai-staging`.

### Defect 2: Duplicate Administrator UID in Staging Database
* **Symptom:** Two records existed for `admin.staging@psyco.clinic`: legacy UID `GQCjxZQwc2dxxKSBPeALbdkDYHE2` (role `admin`) and real staging UID `fOA2tu4QflesR0uQHcTOywP8DDs1` (role `patient`).
* **Root Cause:** UID `GQCjxZQwc2dxxKSBPeALbdkDYHE2` was generated by production Firebase Auth. When the user signed into staging, staging Firebase Auth generated UID `fOA2tu4QflesR0uQHcTOywP8DDs1`.
* **Remediation:** 
  1. Executed `node --env-file=backend/.env.staging backend/scripts/provisionAdmin.js --uid fOA2tu4QflesR0uQHcTOywP8DDs1 --confirm` to promote the active staging UID to `admin`.
  2. Cleaned up legacy and synthetic admin test fixtures so `admin.staging@psyco.clinic` is the **sole administrator** in the database.

---

## 4. Remaining External Integration Blockers

1. **Google Calendar & Google Meet Integration:**
   * **Status:** `BLOCKED: OPERATOR ACTION REQUIRED`.
   * **Detail:** The 16-point post-authorization audit verified all 14 programmatic, security, and fallback checks (PASS). Generating live `meet.google.com` links and Google Calendar events on Google's external API remains blocked solely because no clinician user has completed the third-party OAuth consent dialog in Google Accounts. Full details and operator steps are in [CALENDAR_MEET_VALIDATION.md](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/staging/CALENDAR_MEET_VALIDATION.md).

---

## 5. Final Recommendation & Readiness Classification

### **READY WITH BLOCKERS**
The core staging environment, isolated cloud infrastructure, database security rules, fail-closed safety interceptor, remote database persistence, and automated test suite are **100% verified and functional** (131/131 tests passing). External Google Calendar OAuth interactive consent grant remains as the only specified operator action.

