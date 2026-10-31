# PSYCO AI — Phase 1 Security Remediation Report

**Classification**: Confidential / Application Security Audit  
**Date**: October 31, 2026  
**Auditor / Architect**: Senior Backend Security Architect & Healthcare Software Security Specialist  
**Target Environments**:
- Staging Web Application: `https://psyco-ai-staging.web.app`
- Staging Backend API: `https://psyco-ai.onrender.com`
- Staging Firebase Realtime Database: `https://psyco-ai-staging-default-rtdb.firebaseio.com`
- Primary/Production Environment: `psyco-9c13d` (*Strictly Untouched / Isolated*)

---

## Executive Summary

During previous security reviews and defect registrations, several critical foundational security vulnerabilities were identified in the Psyco AI mental health clinical application. These included:
1. Permissive Realtime Database rules violating the cascade model (e.g., broad `.read: "auth != null"` at the `appointments` root);
2. Privilege escalation during onboarding and profile updates;
3. Lack of strict clinician verification gates permitting unapproved psychologists into public directories and clinical workflows;
4. Inadequate Relationship-Based Access Control (ReBAC) allowing cross-clinician chart and intake snooping;
5. Incomplete administrator lockout from Protected Health Information (PHI);
6. Predictable, unsigned Google Calendar OAuth states vulnerable to CSRF and state injection.

In Phase 1, all foundational security issues were systematically remediated without breaking existing architectures, violating the Firebase Realtime Database schema, or mutating production infrastructure. 100% of the 16 backend test suites (172 unit, integration, and security matrix tests) pass cleanly.

---

## Remediation Details by Vulnerability

### 1. RTDB Security Rules Cascade & Data Exposure (SEC-01)
- **Vulnerability**: In Firebase Realtime Database, child `.read` or `.write` rules cannot restrict permissions granted by an ancestor rule. The `appointments` node previously had `.read: "auth != null"`, allowing any authenticated user (patient, pending applicant, competitor) to dump all appointments platform-wide via REST or client SDK. Similar over-permissive writes existed on `consentRecords`, `assessmentAssignments`, and `assessmentResults`.
- **Root Cause**: Reliance on child security rules without acknowledging the non-overridable nature of RTDB ancestor grants.
- **Remediation**:
  - Removed broad `.read: "auth != null"` from `appointments` root in [database.rules.json](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/database.rules.json).
  - Added query indexing: `".indexOn": ["patientId", "psychologistId", "startTime", "status"]`.
  - Restricted individual appointment access at `/appointments/$appointmentId` strictly to authentic participants (`auth.uid === data.child('patientId').val() || auth.uid === data.child('psychologistId').val()`).
  - Hardened `/consentRecords/$consentId`, `/assessmentAssignments/$assignmentId`, and `/assessmentResults/$resultId` so only assigned patients or psychologists can read and write records.
  - Added author and psychologist ownership validation on `sessionNotes`, `treatmentPlans`, `sessionTranscripts`, `transcriptEntries`, `transcriptVersions`, `aiJobs`, and `aiDrafts`.
  - Locked `googleOAuthStates` with `.read: false, .write: false`.

### 2. Privilege Escalation & Role Tampering (SEC-02)
- **Vulnerability**: Client payloads during onboarding (`/api/v1/profile/onboard/patient` and `/api/v1/profile/onboard/psychologist`) or profile updates could supply arbitrary `role: 'admin'` or `approvalStatus: 'approved'`, leading to unauthorized role upgrades.
- **Root Cause**: Over-reliance on request body fields without strict server-side role assignment and omission of database-level role immutability rules.
- **Remediation**:
  - Hardcoded server-side role assignment in [profile.controller.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/controllers/profile.controller.js):
    - `onboardPatient` strictly writes `role: 'patient'`, `accountStatus: 'active'`.
    - `onboardPsychologist` strictly writes `role: 'psychologist'`, `approvalStatus: 'pending'`, `accountStatus: 'pending_verification'`, `verified: false`.
  - In [database.rules.json](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/database.rules.json), added validation on `/users/$uid`:
    - New records can only have `role === 'patient'` or omit `role`.
    - Updates cannot modify `role` or `accountStatus`.
  - Added validation on `/psychologists/$uid`:
    - Initial creation enforces `approvalStatus === 'pending'` or omitted.
    - Updates cannot modify `approvalStatus`.

### 3. Clinician Verification & Public Directory Integrity (SEC-03)
- **Vulnerability**: Newly registered psychologists could immediately appear in public directories, define public slots, and accept bookings prior to clinical license or identity verification.
- **Root Cause**: Lack of an explicit verification status gate between account creation and public listing.
- **Remediation**:
  - Created `requireVerifiedPsychologist()` middleware in [authorization.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/middleware/authorization.js) checking `accountStatus !== 'suspended'` and `approvalStatus === 'approved'`.
  - Updated [psychologist.routes.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/routes/v1/psychologist.routes.js):
    - Public directory endpoint `/api/v1/psychologists` explicitly filters only `approvalStatus === 'approved'`.
    - Removed auto-creation of mock approved profiles.
  - Updated [appointment.controller.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/controllers/appointment.controller.js):
    - Booking engine strictly rejects appointments if the target psychologist is not approved.
    - Clinicians cannot accept or manage appointments unless approved.
  - Updated [admin.service.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/services/admin.service.js) to synchronize approval decisions atomically across `psychologists/${uid}` and `users/${uid}`.

### 4. Therapeutic Relationship (ReBAC) & Clinical Boundary Enforcement (SEC-04)
- **Vulnerability**: Psychologists could theoretically query patient charts or intake questionnaires of patients with whom they had no care relationship.
- **Root Cause**: Verification was role-based (RBAC) rather than relationship-based (ReBAC).
- **Remediation**:
  - Enhanced `clinicalService.assertTherapeuticRelationship(psychologistId, patientId)` in [clinical.service.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/services/clinical.service.js):
    1. Confirms the clinician profile is approved (`approvalStatus === 'approved'`).
    2. Confirms active therapeutic relationship (either existing confirmed appointment or explicitly assigned clinician ID).
    3. Throws 403 `PSYCHOLOGIST_NOT_VERIFIED` or 403 `UNAUTHORIZED_PATIENT_ACCESS`.
  - Enforced `assertTherapeuticRelationship` on:
    - `GET /api/v1/clinical/patients/:patientId/chart`
    - `GET /api/v1/intake/patient/:patientId`
    - `POST /api/v1/clinical/notes/draft`
    - `POST /api/v1/clinical/treatment-plans`
    - `POST /api/v1/assessment/assign`

### 5. Administrator Clinical Privacy Lockout (SEC-05)
- **Vulnerability**: Administrative accounts possessed broad access to administrative endpoints, but without strict clinical barriers could potentially intercept patient clinical intake or chart notes.
- **Root Cause**: Lack of an explicit denial policy barring administrators from clinical data paths.
- **Remediation**:
  - Implemented `blockAdminFromClinicalRecords()` middleware in [authorization.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/middleware/authorization.js).
  - Applied to all clinical routes ([clinical.routes.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/routes/v1/clinical.routes.js)) and intake routes ([intake.routes.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/routes/v1/intake.routes.js)).
  - Explicit controller barrier in [intake.controller.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/controllers/intake.controller.js) returning 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`.
  - HIPAA minimum necessary principle enforced: administrators manage users, verify clinician licenses, and inspect platform health, but cannot access medical notes, charts, or intake responses.

### 6. Google Calendar OAuth State Cryptographic Verification (SEC-06)
- **Vulnerability**: OAuth authorization flows generated plain or unverified states, leaving clinicians vulnerable to OAuth cross-site request forgery and authorization code injection.
- **Root Cause**: Absence of cryptographic signing and single-use validation for OAuth states.
- **Remediation**:
  - Overhauled [googleCalendarAdapter.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/integrations/googleCalendar/googleCalendarAdapter.js):
    1. Generates 32-byte cryptographically secure random nonces (`crypto.randomBytes(32)`).
    2. Encodes state payload with `{ uid, nonce, expiresAt, sig }`.
    3. Calculates HMAC-SHA256 signature using internal server secret.
    4. Stores state server-side in `googleOAuthStates/${nonce}`.
    5. On callback, validates HMAC signature using `crypto.timingSafeEqual`, validates timestamp (< 10 minutes), and checks server registry.
    6. Marks state `used: true` immediately upon receipt to prevent replay attacks.
    7. Extracts psychologist UID solely from validated server-side state, never from query parameters.

### 7. Health & Diagnostic Probe Hardening (SEC-07)
- **Vulnerability**: Health endpoints risked leaking configuration keys or private keys, or failed to reflect project mismatches.
- **Root Cause**: Lack of separated liveness vs. readiness probes and deep credential validation.
- **Remediation**:
  - Implemented `GET /api/v1/health/liveness` returning 200 `UP` without inspecting sensitive internals.
  - Implemented `GET /api/v1/health/readiness` returning 200 `READY` or 503 `SERVICE_NOT_READY` based on project ID alignment, RTDB credentials, and auth configuration.
  - Ensured `GET /api/v1/health` and all diagnostic endpoints scrub private keys (`BEGIN PRIVATE KEY` strictly forbidden from output).

---

## Verification & Automated Test Matrix

A comprehensive security test suite was developed in [backend/src/tests/phase1_security_matrix.test.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/phase1_security_matrix.test.js).

### Test Results Summary
```text
▶ Phase 1: Security, Authorization, Patient Privacy & ReBAC Matrix Suite
  ✔ 0. Setup: Seed fixture accounts (80.944ms)
  ✔ 1.1 Patient cannot tamper with role or access clinician profile modification (10.2279ms)
  ✔ 1.2 Patient A cannot read Patient B intake form via psychologist route (5.5805ms)
  ✔ 1.3 Patient A can read their own intake form via /my-intake (6.1983ms)
  ✔ 1.4 Patient cannot access clinical patient chart endpoint (5.4301ms)
  ✔ 2.1 Pending psychologist cannot access clinical endpoints (4.8353ms)
  ✔ 2.2 Pending psychologist cannot read patient intake form (4.656ms)
  ✔ 2.3 Pending psychologist is NOT visible in public directory (6.8865ms)
  ✔ 2.4 Unassigned verified psychologist is denied patient chart access (ReBAC) (6.8453ms)
  ✔ 2.5 Unassigned verified psychologist is denied patient intake form (ReBAC) (6.1699ms)
  ✔ 2.6 Assigned verified psychologist can read patient chart and intake (9.0126ms)
  ✔ 3.1 Admin is strictly blocked from clinical patient chart (4.8832ms)
  ✔ 3.2 Admin is strictly blocked from clinical notes drafting (5.7238ms)
  ✔ 3.3 Admin is strictly blocked from patient intake record (4.7196ms)
  ✔ 3.4 Admin can review and approve a pending psychologist (6.1715ms)
  ✔ 4.1 OAuth state rejects tampered HMAC signature (1.9608ms)
  ✔ 4.2 OAuth state rejects expired states (0.4213ms)
  ✔ 4.3 OAuth state rejects replay/reused states (0.5045ms)
  ✔ 5.1 GET /api/v1/health/liveness returns 200 UP without secrets (5.4389ms)
  ✔ 5.2 GET /api/v1/health/readiness returns structured readiness checks (6.4779ms)
✔ Phase 1: Security, Authorization, Patient Privacy & ReBAC Matrix Suite (187.5014ms)
ℹ tests 21 | pass 21 | fail 0
```

### Full Backend Test Suite Execution
```text
ℹ tests 172
ℹ suites 0
ℹ pass 172
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 3484.2124
```

---

## Remaining Risks & Mitigations

1. **Service Account Privilege Bypassing RTDB Rules**:
   - *Risk*: The backend connects to Firebase Realtime Database using Google OAuth tokens derived from a service account. Under Firebase architecture, service accounts bypass RTDB security rules.
   - *Mitigation*: Express application middleware and service layers enforce strict ReBAC checks, role enforcement, and input validations before performing any RTDB query. RTDB security rules act as defense-in-depth against direct client SDK abuse.
2. **Key Rotation & Secrets Invalidation**:
   - *Risk*: If service account private keys are ever rotated in Google Cloud, stale environment configurations would halt RTDB connectivity.
   - *Mitigation*: The `/api/v1/health/readiness` probe detects key validation and project alignment errors immediately and responds with 503 `SERVICE_NOT_READY` before traffic is routed.

---

## Staging Deployment & Verification Procedure

1. **Environment Variables**:
   Verify Render environment variables for the staging service (`psyco-ai.onrender.com`):
   - `FIREBASE_PROJECT_ID=psyco-ai-staging`
   - `FIREBASE_DATABASE_URL=https://psyco-ai-staging-default-rtdb.firebaseio.com`
   - `FIREBASE_CLIENT_EMAIL=<service-account>@psyco-ai-staging.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."`
2. **Deploy Rules to Staging**:
   When approved for deployment:
   ```bash
   firebase deploy --only database --project psyco-ai-staging
   ```
3. **Verify Health Probes**:
   ```bash
   curl -i https://psyco-ai.onrender.com/api/v1/health/liveness
   curl -i https://psyco-ai.onrender.com/api/v1/health/readiness
   ```
4. **Smoke Test ReBAC**:
   Verify that patient intake and appointments function normally on `https://psyco-ai-staging.web.app` while cross-account access and role escalation attempts are strictly blocked with HTTP 403.
