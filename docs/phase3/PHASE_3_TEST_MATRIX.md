# PSYCO AI — PHASE 3 TEST MATRIX & CLINICAL WORKFLOW VALIDATION
**Comprehensive Independent Practice, Clinic Affiliation, Scheduling & Clinical Operations Test Matrix**

**Version:** 3.0  
**Date:** 2026-10-31  
**Target Environments:** Staging Frontend (`https://psyco-ai-staging.web.app`) & Staging Backend (`https://psyco-ai.onrender.com`)  
**Database Target:** Firebase Realtime Database (`https://psyco-ai-staging-default-rtdb.firebaseio.com`)

---

## 1. Test Methodology & Scope
The Phase 3 Test Matrix verifies practice independence, multi-practice context isolation, scheduling workflows, clinical documentation, and role-based privacy barriers.

---

## 2. End-to-End Test Matrix

| Test ID | Domain / Feature | Preconditions | Test Steps & Inputs | Expected Result | Security & Privacy Check | Status |
|---|---|---|---|---|---|---|
| **TC-IND-01** | Independent Practice Workspace Creation | Approved psychologist account | 1. Call `GET /api/v1/practice/mine`.<br>2. Inspect returned workspace object. | Autonomous workspace created with `type: 'independent'`, `ownerUid === psychologistId`, and default practice name. No clinic ID required. | RBAC: Only authenticated psychologists can access `/api/v1/practice/mine`. | **PASS** |
| **TC-IND-02** | Online-Only Practice Configuration | Independent practice workspace active | 1. Update practice settings with `offeredModes: 'online'`.<br>2. Clear all physical office locations.<br>3. Save practice settings. | Settings update successfully; physical office address is **not required**; practice can activate and accept telehealth bookings. | Zero unnecessary mandatory location constraints. | **PASS** |
| **TC-LOC-01** | Multi-Location Practice Management | Independent practice active | 1. Call `POST /api/v1/practice/locations` with location details.<br>2. Verify location in practice workspace.<br>3. Add second location with `isDefault: true`.<br>4. Delete first location. | First location is created; second becomes default office; deletion removes location cleanly and updates default indicator. | Owner check: Clinicians can only modify locations of their own practice. | **PASS** |
| **TC-CLN-01** | Clinic Affiliation Request | Psychologist with `practiceArrangement: 'hybrid'` | 1. Browse registered clinics via `GET /api/v1/practice/clinics`.<br>2. Submit affiliation request to target clinic via `POST /api/v1/practice/affiliations/request`. | Membership record created in `practiceMemberships/` with `status: 'pending'`. Does not immediately grant clinic administrative rights. | Membership requires affirmative clinic coordinator approval. | **PASS** |
| **TC-HYB-01** | Hybrid Practice Context Switching | Psychologist with independent practice and approved clinic membership | 1. Attempt to switch context to an unapproved clinic.<br>2. Verify error response.<br>3. Switch context to approved clinic.<br>4. Switch context back to independent practice. | Unapproved clinic switch fails with **403 Forbidden** (`UNAUTHORIZED_PRACTICE_CONTEXT`). Approved clinic switch succeeds. Context updates in real time. | Strict isolation: Data cannot leak across unapproved practice domains. | **PASS** |
| **TC-DSH-01** | Dashboard Live Metrics & Schedule | Authenticated clinician with appointments | 1. Navigate to `/psychologist/dashboard`.<br>2. Inspect metric cards.<br>3. Inspect today's schedule and incoming requests. | Live counts for Today's Schedule, Pending Requests, Active Patients, and Upcoming Sessions match backend data. No dummy metrics. | Real backend data invariant upheld. | **PASS** |
| **TC-APT-01** | Appointment Request - Accept | Pending appointment request assigned to clinician | 1. Clinician clicks "Accept" on request.<br>2. System validates conflict buffers.<br>3. Session updates to `confirmed`. | Appointment status transitions to `confirmed`; Google Meet link generated for online mode; patient notified. | Concurrency check: Prevents double-booking and buffer violations. | **PASS** |
| **TC-APT-02** | Appointment Request - Propose Alternative | Pending appointment request | 1. Clinician enters proposed date and time.<br>2. Submits proposal via `POST /api/v1/appointments/:id/propose-alternative`. | Appointment updates with `proposedSlot`; patient receives alternative proposal notification. | State transition validation prevents modifying completed or cancelled sessions. | **PASS** |
| **TC-APT-03** | Appointment Request - Decline | Pending appointment request | 1. Clinician enters mandatory reason.<br>2. Submits decline via `POST /api/v1/appointments/:id/reject`. | Appointment status transitions to `rejected`; patient notified with cancellation note. | Mandatory reason of at least 3 characters enforced. | **PASS** |
| **TC-PAT-01** | Patient Directory & Filters | Clinician on `/psychologist/patients` | 1. Toggle filter tabs: "All", "Active Treatment", "Awaiting Intake", "Upcoming".<br>2. Search patient by name.<br>3. Sort by "Most Consultations". | Directory updates dynamically; skeleton renders during fetch; only authorized patients appear. | ReBAC check: Unassigned patients are never returned in directory queries. | **PASS** |
| **TC-CHT-01** | Clinical Chart ReBAC Verification | Authenticated clinician on patient chart | 1. Clinician requests chart of assigned patient.<br>2. Clinician requests chart of unassigned patient. | Assigned patient chart loads completely. Unassigned patient chart request rejected with **403 Forbidden** (`UNAUTHORIZED_PATIENT_ACCESS`). | ReBAC boundary strictly enforced by `assertTherapeuticRelationship`. | **PASS** |
| **TC-NOT-01** | Clinical Documentation (SOAP) & Drafts | Clinician in session workspace | 1. Author Subjective, Objective, Assessment, Plan notes.<br>2. Click "Save Draft".<br>3. Review audit trail.<br>4. Click "Finalize Note". | Note saves as editable draft without silent modification; finalization locks note and creates immutable audit entry. | Preserves clinician control over clinical records. | **PASS** |
| **TC-COP-01** | AI Clinical Copilot Transparency | Session workspace with transcript text | 1. Request AI Copilot SOAP draft generation.<br>2. Inspect generated draft.<br>3. Edit draft before approval. | AI output is explicitly marked as draft; requires clinician review; cannot auto-finalize or prescribe medication. | Medical safety invariant: AI cannot independently finalize clinical records. | **PASS** |
| **TC-ADM-01** | Administrative Privacy Lockout | Platform administrator token | 1. Administrator attempts to call `GET /api/v1/clinical/patients/:id/chart`.<br>2. Administrator attempts to call `GET /api/v1/transcription/sessions/:id`. | All requests strictly rejected with **403 Forbidden** by `blockAdminFromClinicalRecords`. | Strict privacy barrier: Administrators can never access clinical notes. | **PASS** |

---

## 3. Automated Test Execution Summary

```
================================================================
PSYCO AI BACKEND TEST EXECUTION
================================================================
Test Suites:
  ✔ Phase 1: Security, Authorization & ReBAC Suite
  ✔ Phase 2: Patient Portal & Booking Suite
  ✔ Phase 3: Independent Practice, Locations & Affiliation Suite
  ✔ Phase 13: Staging Safety & Repeatable Environment Guards
  ✔ Phase E2E: Full Staging UAT Validation Suite

Summary:
  ℹ tests 179
  ℹ suites 0
  ℹ pass 179
  ℹ fail 0
  ℹ duration_ms 3648.085
```
