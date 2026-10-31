# PSYCO AI — Phase 1 Authorization Test Matrix

**Document Purpose**: Definitive reference for Role-Based Access Control (RBAC), Relationship-Based Access Control (ReBAC), and administrative privacy boundaries across all application endpoints and data resources.  
**Classification**: Security Architecture / Verification Reference  
**Last Updated**: October 31, 2026  

---

## 1. Actor & Persona Definitions

| Persona Code | Role Identifier | Account Status | Approval Status | Description |
|:---|:---|:---|:---|:---|
| **ANON** | Unauthenticated | N/A | N/A | Anonymous web visitor without valid Firebase ID token |
| **PAT** | `patient` | `active` | N/A | Verified patient seeking mental health consultations |
| **PSY-PEND** | `psychologist` | `pending_verification` | `pending` | Newly registered clinician awaiting credential audit |
| **PSY-REJ** | `psychologist` | `suspended` | `rejected` | Clinician whose credentials failed review |
| **PSY-APP-UN** | `psychologist` | `active` | `approved` | Verified clinician with **no** relationship to target patient |
| **PSY-APP-REL** | `psychologist` | `active` | `approved` | Verified clinician with **active** therapeutic relationship |
| **ADM** | `admin` | `active` | N/A | Platform operations & clinician credentialing manager |

---

## 2. Resource & Operation Access Matrix

| Resource / Endpoint | Operation | ANON | PAT | PSY-PEND | PSY-REJ | PSY-APP-UN | PSY-APP-REL | ADM | Enforcement Layer |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **Health Liveness** (`/api/v1/health/liveness`) | `GET` | 200 | 200 | 200 | 200 | 200 | 200 | 200 | Public Route |
| **Health Readiness** (`/api/v1/health/readiness`) | `GET` | 200 / 503 | 200 / 503 | 200 / 503 | 200 / 503 | 200 / 503 | 200 / 503 | 200 / 503 | Public Diagnostic Probe |
| **Health Diagnostics** (`/api/v1/health`) | `GET` | 200 | 200 | 200 | 200 | 200 | 200 | 200 | Public Route |
| **Public Directory** (`GET /api/v1/psychologists`) | `GET` | 200 (1) | 200 (1) | 200 (1) | 200 (1) | 200 (1) | 200 (1) | 200 (1) | Route Query Filter |
| **Patient Registration** (`/api/v1/auth/register/patient`) | `POST` | 201 | 400 | 400 | 400 | 400 | 400 | 400 | Public Auth Endpoint |
| **Onboard Patient Profile** (`/api/v1/profile/onboard/patient`) | `POST` | 401 | 201 (2) | 400 | 400 | 400 | 400 | 400 | `authenticateToken` + Controller (2) |
| **Onboard Clinician** (`/api/v1/profile/onboard/psychologist`) | `POST` | 401 | 400 | 201 (3) | 400 | 400 | 400 | 400 | `authenticateToken` + Controller (3) |
| **Get My Profile** (`GET /api/v1/profile/me`) | `GET` | 401 | 200 | 200 | 200 | 200 | 200 | 200 | `authenticateToken` |
| **Update Patient Profile** (`PUT /api/v1/profile/patient`) | `PUT` | 401 | 200 | 403 | 403 | 403 | 403 | 403 | `requireRole(PATIENT)` |
| **Update Clinician Profile** (`PUT /api/v1/profile/psychologist`) | `PUT` | 401 | 403 | 200 | 403 | 200 | 200 | 403 | `requireRole(PSYCHOLOGIST)` |
| **Submit Patient Intake** (`POST /api/v1/intake/submit`) | `POST` | 401 | 201 | 403 | 403 | 403 | 403 | 403 | `requireRole(PATIENT)` + `blockAdmin` |
| **View Own Intake** (`GET /api/v1/intake/my-intake`) | `GET` | 401 | 200 | 403 | 403 | 403 | 403 | 403 | `requireRole(PATIENT)` + `blockAdmin` |
| **View Patient Intake** (`GET /api/v1/intake/patient/:id`) | `GET` | 401 | 403 | 403 (4) | 403 (4) | 403 (5) | 200 | 403 (6) | `requireVerifiedPsychologist` + ReBAC |
| **Book Appointment** (`POST /api/v1/appointments`) | `POST` | 401 | 201 (7) | 403 | 403 | 403 | 403 | 403 | `requireRole(PATIENT)` + Clinician Check |
| **List Own Appointments** (`GET /api/v1/appointments`) | `GET` | 401 | 200 (8) | 200 (8) | 403 | 200 (8) | 200 (8) | 200 (9) | `authenticateToken` + User Scope |
| **Patient Chart** (`GET /api/v1/clinical/patients/:id/chart`) | `GET` | 401 | 403 | 403 (4) | 403 (4) | 403 (5) | 200 | 403 (6) | `requireVerifiedPsychologist` + ReBAC |
| **Draft Clinical Note** (`POST /api/v1/clinical/notes/draft`) | `POST` | 401 | 403 | 403 (4) | 403 (4) | 403 (5) | 201 | 403 (6) | `requireVerifiedPsychologist` + ReBAC |
| **Treatment Plan** (`POST /api/v1/clinical/treatment-plans`) | `POST` | 401 | 403 | 403 (4) | 403 (4) | 403 (5) | 201 | 403 (6) | `requireVerifiedPsychologist` + ReBAC |
| **Assign Assessment** (`POST /api/v1/assessment/assign`) | `POST` | 401 | 403 | 403 (4) | 403 (4) | 403 (5) | 201 | 403 (6) | `requireVerifiedPsychologist` + ReBAC |
| **Acknowledge Risk Flag** (`POST /api/v1/risk-review/flags/:id/ack`) | `POST` | 401 | 403 | 403 (4) | 403 (4) | 403 (5) | 200 | 403 (6) | `requireVerifiedPsychologist` + ReBAC |
| **Google Calendar Auth URL** (`GET /api/v1/integrations/google-calendar/auth-url`) | `GET` | 401 | 403 | 403 (4) | 403 (4) | 200 | 200 | 403 | `requireVerifiedPsychologist` |
| **Google Calendar Callback** (`GET /api/v1/integrations/google-calendar/callback`) | `GET` | 302 (10) | 302 (10) | 302 (10) | 302 (10) | 302 (10) | 302 (10) | 302 (10) | Cryptographic HMAC Validation (10) |
| **Review Clinician Application** (`POST /api/v1/admin/psychologists/:id/review`) | `POST` | 401 | 403 | 403 | 403 | 403 | 403 | 200 | `requireRole(ADMIN)` |
| **Update User Status** (`PATCH /api/v1/admin/users/:id/status`) | `PATCH` | 401 | 403 | 403 | 403 | 403 | 403 | 200 | `requireRole(ADMIN)` |

---

## 3. Footnotes & Enforcement Invariants

- **(1) Public Directory Filtering**: The public directory (`GET /api/v1/psychologists`) strictly filters out unapproved or pending clinicians. Only clinicians with `approvalStatus === 'approved'` are returned. Sensitive data (email, phone, address details) is omitted.
- **(2) Patient Role Immunity**: `onboardPatient` hardcodes `role: 'patient'` and `accountStatus: 'active'`. Any supplied `role` or `accountStatus` in the client request body is discarded.
- **(3) Clinician Verification Gate**: `onboardPsychologist` hardcodes `role: 'psychologist'`, `approvalStatus: 'pending'`, `accountStatus: 'pending_verification'`, `verified: false`. Clinician applicants cannot self-approve.
- **(4) Verification Gate Check**: `requireVerifiedPsychologist()` middleware rejects unverified or pending psychologists with HTTP 403 `PSYCHOLOGIST_NOT_VERIFIED`.
- **(5) ReBAC Isolation**: `assertTherapeuticRelationship(psychologistId, patientId)` evaluates whether a verified clinician has a confirmed appointment or assigned care link to the target patient. Unrelated clinicians receive HTTP 403 `UNAUTHORIZED_PATIENT_ACCESS`.
- **(6) Administrative PHI Lockout**: `blockAdminFromClinicalRecords()` middleware strictly halts any administrative access to patient clinical charts, session notes, treatment plans, or intake records with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`.
- **(7) Target Clinician Booking Gate**: Booking engine verifies that the targeted psychologist is verified and approved. Appointments with pending or rejected clinicians are rejected with HTTP 400 `PSYCHOLOGIST_NOT_AVAILABLE`.
- **(8) Patient & Clinician Scope**: Authenticated users can only view appointments where their UID matches `patientId` or `psychologistId`. Cross-account snooping is prevented at both the controller and RTDB rules layers.
- **(9) Admin Appointment Metadata**: Administrators only see non-clinical operational metadata for billing/scheduling dispute management; clinical session contents remain locked.
- **(10) OAuth State Security**: The OAuth callback requires a valid HMAC-SHA256 signature, unexpired timestamp (<10 minutes), and single-use validation against `googleOAuthStates/${nonce}`. Invalid or replayed states are redirected with `calendar_error`.

---

## 4. Firebase Realtime Database Rule Enforcement

| Database Node | Read Authorization Rule | Write Authorization Rule |
|:---|:---|:---|
| `/users/$uid` | `auth != null && auth.uid === $uid` | Self-only. Cannot alter `role` or `accountStatus` once created. |
| `/psychologists/$uid` | Public (approved only) / Self / Admin | Self-only. Cannot alter `approvalStatus`. |
| `/patients/$uid` | `auth != null && (auth.uid === $uid \|\| ...assigned...)` | Self-only. |
| `/patientIntake/$patientId` | `auth != null && (auth.uid === $patientId \|\| ...assigned...)` | Patient self-only. |
| `/appointments/$appointmentId` | `auth.uid === data.child('patientId').val() \|\| auth.uid === data.child('psychologistId').val()` | Booking patient or assigned psychologist. |
| `/sessionNotes/$noteId` | Assigned clinician only (`auth.uid === data.child('psychologistId').val()`) | Assigned clinician only. |
| `/googleOAuthStates` | `.read: false` | `.write: false` (Backend service account only). |
| `/auditLogs` | `.read: false` | `.write: false` (Backend service account only). |

---

## 5. Verification Test Suite Traceability

All rules documented in this matrix are continuously verified in the automated CI test suite:
- **Matrix Suite File**: [backend/src/tests/phase1_security_matrix.test.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/phase1_security_matrix.test.js)
- **Token Verification Suite**: [backend/src/tests/auth_token_verification.test.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/auth_token_verification.test.js)
- **Staging Safety Suite**: [backend/src/tests/staging_safety.test.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/staging_safety.test.js)
- **E2E UAT Validation Suite**: [backend/src/tests/staging_uat_e2e.test.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/staging_uat_e2e.test.js)
