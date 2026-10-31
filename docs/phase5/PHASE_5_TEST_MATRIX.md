# PSYCO AI — PHASE 5 TEST MATRIX
**Release Target:** Staging Remediation & Stabilization (v1.0.0-rc5)  
**Date:** October 31, 2026  
**Status Key:**
- **PASS**: Verification executed and confirmed successful.
- **FAIL**: Verification executed and failed.
- **BLOCKED**: Verification impeded by environment or external dependency.
- **NOT TESTED**: Verification not scheduled or out of scope.

---

## 1. Task 1: Firebase Token Re-authentication Test Matrix

| ID | Test Scenario | Execution Type | Verification Mechanism | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TR-01** | Valid Token | Automated Unit Test | `token_renewal.test.js` | **PASS** | Attaches token in `Authorization: Bearer <token>`, succeeds on first try (1 fetch call). |
| **TR-02** | Expired Token Detection | Automated Unit Test | `token_renewal.test.js` | **PASS** | HTTP 401 triggers token refresher mechanism. |
| **TR-03** | Successful Token Renewal | Automated Unit Test | `token_renewal.test.js` | **PASS** | Renewed token retries request, succeeds on 2nd attempt, updates storage. |
| **TR-04** | Failed Token Renewal | Automated Unit Test | `token_renewal.test.js` | **PASS** | Refresh error triggers session-expired handler, clears storage, propagates error without retrying. |
| **TR-05** | Concurrent Failed Requests | Automated Unit Test | `token_renewal.test.js` | **PASS** | 5 simultaneous 401 requests share single refresh promise (`refreshCalls === 1`). |
| **TR-06** | Logged-Out User Handling | Automated Unit Test | `token_renewal.test.js` | **PASS** | When `currentUser` is null, refresh fails cleanly and dispatches session-expired event. |
| **TR-07** | HTTP 403 Response Guard | Automated Unit Test | `token_renewal.test.js` | **PASS** | HTTP 403 is never retried; refresh counter remains 0. |
| **TR-08** | Infinite Retry Prevention | Automated Unit Test | `token_renewal.test.js` | **PASS** | Guard `_retry` stops retries after 1 attempt when server continues to reject with 401. |

---

## 2. Task 2: Frontend Code Splitting & Performance Test Matrix

| ID | Test Scenario | Execution Type | Verification Mechanism | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CS-01** | Production Staging Build | Automated CLI | `npm --prefix frontend run build -- --mode staging` | **PASS** | Build completes in 6.35s with 0 errors. |
| **CS-02** | Main Bundle Size (<500 kB) | Automated Benchmark | Vite Rollup Output Inspection | **PASS** | Main `index-*.js` chunk is **261.44 kB** (reduced from 1,292.96 kB). |
| **CS-03** | Admin Dashboard Chunking | Automated Benchmark | Vite Rollup Output Inspection | **PASS** | `AdminDashboard-*.js` isolated to **82.11 kB** chunk. |
| **CS-04** | Session Workspace Chunking| Automated Benchmark | Vite Rollup Output Inspection | **PASS** | `SessionWorkspacePage-*.js` isolated to **84.07 kB** chunk. |
| **CS-05** | Vendor Library Partitioning | Automated Benchmark | Vite Rollup Output Inspection | **PASS** | `vendor-firebase` (327.85 kB) and `vendor-react` (164.97 kB) split into cached chunks. |
| **CS-06** | Zero Chunk Size Warnings | Automated Benchmark | Vite Build Log Analysis | **PASS** | No chunks exceed 500 kB warning threshold. |
| **CS-07** | Dist Bundle Loopback Guard | Automated Test | `frontend_api_configuration.test.js` | **PASS** | Compiled JS assets verify absence of loopback addresses (`localhost:5000`). |

---

## 3. Task 3: FAQ Keyword Search Test Matrix

| ID | Test Scenario | Execution Type | Verification Mechanism | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FQ-01** | Matching Question | Automated Unit Test | `faq_search.test.js` | **PASS** | Searching "consultation modes" matches `faq_02`. |
| **FQ-02** | Matching Answer | Automated Unit Test | `faq_search.test.js` | **PASS** | Searching "zero-binary-media" (present only in answer) matches `faq_03`. |
| **FQ-03** | Mixed-Case Search | Automated Unit Test | `faq_search.test.js` | **PASS** | Queries "rebac", "REBAC", and "ReBaC" produce identical results. |
| **FQ-04** | Empty & Whitespace Query | Automated Unit Test | `faq_search.test.js` | **PASS** | Empty query and `"   "` return full set of FAQs. |
| **FQ-05** | No Matching Results | Automated Unit Test | `faq_search.test.js` | **PASS** | Non-matching search string returns empty array (`length === 0`). |
| **FQ-06** | Combined Search & Category | Automated Unit Test | `faq_search.test.js` | **PASS** | Intersects category filter with keyword query accurately. |
| **FQ-07** | Clear Search Restoration | Automated Unit Test | `faq_search.test.js` | **PASS** | Resetting query immediately restores full FAQ list. |
| **FQ-08** | In-Memory Performance | Code Inspection | `FaqSection.jsx` & `faqUtils.js` | **PASS** | Zero additional network requests emitted during typing. |

---

## 4. Task 4: Complete Regression Test Matrix (Phases 1–4)

| Domain | Scenario / Test Area | Execution Type | Verification Mechanism | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Security** | Authentication Middleware Verification | Automated Suite | `auth_token_verification.test.js` | **PASS** |
| **Security** | Role Authorization & Immutability | Automated Suite | `phase1_security_matrix.test.js` | **PASS** |
| **Security** | ReBAC Boundary & Patient Data Isolation | Automated Suite | `staging_uat_e2e.test.js` | **PASS** |
| **Security** | Administrator Clinical Privacy Prohibition | Automated Suite | `staging_safety.test.js` | **PASS** |
| **Security** | Immutable Audit Trail Enforcement | Automated Suite | `phase4_admin_management.test.js` | **PASS** |
| **Security** | Text-Only Invariant & Zero Binary Media | Automated Suite | `staging_safety.test.js` | **PASS** |
| **Patient** | Patient Registration & Profile Storage | Automated Suite | `phase2.test.js` | **PASS** |
| **Patient** | Medical Intake & Presenting Concerns | Automated Suite | `phase2.test.js` | **PASS** |
| **Patient** | Psychologist Directory Filtering | Automated Suite | `public.test.js` | **PASS** |
| **Patient** | Lead-Time & Appointment Conflict Guard | Automated Suite | `staging_uat_e2e.test.js` | **PASS** |
| **Patient** | Cancellation & Reschedule Lifecycle | Automated Suite | `phase3.test.js` | **PASS** |
| **Clinician** | Independent Practice Setup (No Clinic Required)| Automated Suite | `phase3_practice_management.test.js` | **PASS** |
| **Clinician** | Clinic Affiliation & Approval Workflow | Automated Suite | `phase3_practice_management.test.js` | **PASS** |
| **Clinician** | Hybrid Context Switching & Chart Isolation | Automated Suite | `phase3_practice_management.test.js` | **PASS** |
| **Clinician** | Availability Slots & Lead-Time Rules | Automated Suite | `phase3.test.js` | **PASS** |
| **Clinician** | SOAP Note Draft Creation & Versioning | Automated Suite | `phase4.test.js` | **PASS** |
| **Clinician** | Clinical Copilot AI Draft Approval Invariant | Automated Suite | `phase4.test.js` | **PASS** |
| **Admin** | Platform Telemetry & Metrics Aggregation | Automated Suite | `phase4_admin_management.test.js` | **PASS** |
| **Admin** | User Governance & Account Suspension | Automated Suite | `phase4_admin_management.test.js` | **PASS** |
| **Admin** | Self-Suspension Prevention Rule | Automated Suite | `phase4_admin_management.test.js` | **PASS** |
| **Admin** | Clinician Credential Review & Verification | Automated Suite | `phase4_admin_management.test.js` | **PASS** |
| **Admin** | Clinic Organization Governance | Automated Suite | `phase4_admin_management.test.js` | **PASS** |
| **Admin** | Support Ticket Queue & Notes | Automated Suite | `phase4_admin_management.test.js` | **PASS** |
| **Admin** | Public FAQ Moderation & Content Management | Automated Suite | `phase4_admin_management.test.js` | **PASS** |

---

## 5. Live Staging vs Automated Verification Distinctions

| Evaluation Vector | Verification Method | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Token Renewal Engine** | Automated Harness | **PASS** | Verified via Node test harness simulating expired tokens and concurrency. |
| **Bundle Code Splitting** | Automated Production Build | **PASS** | Validated via `vite build --mode staging` chunk output. |
| **FAQ Keyword Search** | Automated Pure Logic + Build | **PASS** | Validated via `faq_search.test.js` and bundle compilation. |
| **Live Staging Health Endpoint** | Live Network Probe | **PASS** | Live Render staging reported `HEALTHY` (119ms). |
| **Production Project Isolation** | Staging Seeder & Config Guard | **PASS** | Hardcoded guards prevent `psyco-9c13d` modifications. |
| **Independent External Certification** | Formal External Audit | **NOT TESTED** | Psyco AI has not undergone formal independent third-party certification. |
