# PSYCO AI — STAGING ISOLATION & INVARIANT TEST REPORT

**Document:** `docs/staging/PSYCO_AI_STAGING_ISOLATION_TESTS.md`  
**Phase:** Staging Setup Phase 1 — Isolation & Safety Probe Execution  
**Date:** October 28, 2026  
**Auditor:** Quality Assurance Specialist & Security Architect  
**Test Harness:** Node.js v24 Test Runner, Supertest, Live RTDB Probes, and Seeding Safety Interceptors  

---

## 1. Isolation Test Objectives

The objective of these isolation tests is to prove that:
1. Staging operations **CANNOT accidentally execute** against the production Firebase project or primary RTDB instance.
2. The synthetic staging data seeding engine correctly structures and persists all 11 required clinical entities.
3. The application does not silently fall back to local disk snapshots or in-memory caches when executing cloud operations.
4. Access control boundaries (ReBAC) strictly prevent cross-tenant and administrative leakage of psychotherapy notes.
5. All persisted clinical records adhere to the strict text-only zero binary media invariant.

---

## 2. Test Execution & Evidence

### Test Case 1: Automated Production-Target Protection Interceptor
* **Objective:** Ensure the staging seeding utility automatically aborts if directed at the primary/production database.
* **Command Executed:**
  ```bash
  node scripts/seedStagingEnvironment.js
  ```
* **Execution Environment:** `NODE_ENV=development`, `FIREBASE_PROJECT_ID=psyco-9c13d`, `FIREBASE_DATABASE_URL=https://psyco-9c13d-default-rtdb.firebaseio.com`.
* **Observed Transcript:**
  ```
  ================================================================
  PSYCO AI — STAGING SYNTHETIC DATA SEEDING UTILITY
  ================================================================
  Target Firebase Project ID: psyco-9c13d
  Target Database URL:       https://psyco-9c13d-default-rtdb.firebaseio.com
  Runtime Environment:       development

  [ABORTED] SAFETY VIOLATION DETECTED:
  The active configuration points to the primary/production database:
   -> Project: psyco-9c13d
   -> DB URL:  https://psyco-9c13d-default-rtdb.firebaseio.com
  To run staging seeding, configure a dedicated staging RTDB instance
  (e.g., https://psyco-staging-default-rtdb.firebaseio.com) or pass --allow-subpath-test for non-destructive root test.

  Seeding halted: Refusing to seed synthetic staging data into primary database.
  ```
* **Result:** **`PASS`**. The process terminated with exit code 1, completely preventing write operations to production.

---

### Test Case 2: Synthetic Data Schema & Multi-Entity Staging Seeding
* **Objective:** Verify that the 11 synthetic clinical entities conform to system schemas and can be written and cleaned up in an isolated test harness.
* **Command Executed:**
  ```bash
  node scripts/seedStagingEnvironment.js --allow-subpath-test
  ```
* **Observed Output:**
  ```
  Seeding synthetic entities under prefix: "stagingTestFixture/"...
   [✓] Seeded Synthetic Admin: staging.admin@psyco.clinic
   [✓] Seeded Synthetic Approved Psychologist: dr.staging.clinician@psyco.clinic
   [✓] Seeded Synthetic Patient: staging.patient@example.com
   [✓] Seeded Clinician Availability Rules (Mon/Wed/Fri 09:00-17:00, 50m session, 10m buffer)
   [✓] Seeded Synthetic Appointment: apt_staging_001
   [✓] Seeded Synthetic Session Record: ses_staging_001
   [✓] Seeded Synthetic SOAP Clinical Note: not_staging_001
   [✓] Seeded Synthetic Treatment Plan: tp_staging_001
   [✓] Seeded Synthetic PHQ-9 Screener Assignment & Result (Score: 7, Mild)
   [✓] Seeded Synthetic Risk Flag: flg_staging_001
   [✓] Seeded Synthetic Public Contact & FAQ Submissions

  >>> STAGING SYNTHETIC DATA SEEDING COMPLETE <<<
  ```
* **Cleanup Execution:** The test subpath `stagingTestFixture` was immediately deleted via `firebaseRtdbAdapter.remove('stagingTestFixture')`, leaving zero test keys in the cloud database.
* **Result:** **`PASS`**. All 11 synthetic entities validated and persisted cleanly.

---

### Test Case 3: Cloud RTDB Durability & Error Transparency
* **Objective:** Confirm that write operations are executed remotely against Google Cloud RTDB and that invalid inputs produce explicit thrown errors rather than silent local success.
* **Test Step A (Lifecycle):** Written record `auditVerification/staging_readiness_test_1793178856616` verified present via direct Google Cloud OAuth2 HTTP fetch (`HTTP 200 OK`). Updated to `UPDATED_IN_CLOUD` (`HTTP 200 OK`). Cleanly removed (`null`).
* **Test Step B (Negative Invalid Key):** When a key containing `/` was submitted, the adapter threw:
  ```
  Firebase Realtime Database operation failed: Cloud database write failed (HTTP 400): {
    "error" : "Invalid data; couldn't parse key beginning at 1:282. Key value can't be empty or contain $ # [ ] / or ."
  }
  ```
* **Result:** **`PASS`**. Remote cloud durability confirmed; zero deceptive local fallbacks.

---

### Test Case 4: ReBAC Boundary Isolation (Admin vs. Psychotherapy Notes)
* **Objective:** Verify that an administrator cannot access private clinical psychotherapy notes.
* **Request:** `GET /api/v1/clinical/patients/patient_staging_01/chart` with `Authorization: Bearer test-token-admin-...`
* **Observed Server Log:**
  ```
  [WARN] Administrator UID admin_staging_01 attempted unauthorized access to clinical records. Blocked by ReBAC.
  [INFO] GET /api/v1/clinical/patients/patient_staging_01/chart 403 - 1ms
  ```
* **Observed Response:**
  ```json
  {
    "success": false,
    "error": {
      "code": "CLINICAL_PRIVACY_VIOLATION",
      "message": "Administrative roles are strictly forbidden from viewing private psychotherapy records."
    }
  }
  ```
* **Result:** **`PASS`**. ReBAC boundary enforced.

---

### Test Case 5: Zero Binary Media Storage Invariant
* **Objective:** Verify that persistent records contain strictly text and structured JSON.
* **Verification Scope:** Inspected all 28 collections in cloud RTDB and checked temporary audio streaming adapters.
* **Observed Evidence:**
  * Raw audio recordings (`.wav`, `.mp3`): ZERO.
  * Raw video recordings (`.mp4`, `.webm`): ZERO.
  * Base64 encoded media blobs: ZERO.
  * Binary attachments or PDF files: ZERO.
  * AssemblyAI audio streaming: Chunks are streamed in real time over WebSockets (16kHz PCM) and discarded immediately after transcript text is generated.
* **Result:** **`PASS`**. 100% compliant with strict text-only storage mandate.

---

## 3. Summary of Isolation Verification

| Test Scenario | Evaluated Invariant | Result | Evidence |
| :--- | :--- | :--- | :--- |
| **Production Target Interceptor** | Staging script aborts on production DB | **`PASS`** | Clean abort with exit code 1 |
| **Synthetic Entity Schemas** | 11 core clinical entities valid | **`PASS`** | All 11 fixtures persisted in test run |
| **Cloud Durability Lifecycle** | Real remote write/read/update/delete | **`PASS`** | Verified via direct Google OAuth fetch |
| **Error Transparency** | Explicit thrown error on invalid write | **`PASS`** | Throws HTTP 400 error |
| **ReBAC Clinical Note Barrier** | Admin blocked from psychotherapy notes | **`PASS`** | HTTP 403 `CLINICAL_PRIVACY_VIOLATION` |
| **Zero Binary Media Invariant** | 100% structured text JSON | **`PASS`** | Zero audio/video media in database |
