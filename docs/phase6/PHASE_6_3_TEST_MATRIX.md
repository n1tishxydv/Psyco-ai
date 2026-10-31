# PHASE 6.3 — AI SANDBOX AND VENDOR PRIVACY SAFEGUARDS TEST MATRIX

**Document ID:** `DOC-P63-TEST-MATRIX-001`  
**Test Suite:** `backend/src/tests/phase6_3_ai_sandbox.test.js`  
**Environment:** Staging / Local Isolated Test Harness  
**Execution Engine:** Node.js native test runner (`node --test`)  
**Overall Status:** **100% PASSED (13 / 13 passing in suite; 234 / 234 passing across full backend suite)**  

---

## 1. Test Suite Summary

The Phase 6.3 regression test suite exercises the server-side feature flags, fail-closed validation, mock AI provider generation across multiple clinical schemas, boundary isolation of Google Gemini and AssemblyAI integrations, draft lifecycle states, human-in-the-loop psychologist approval, administrative clinical access lockout, zero binary persistence, and audit logging sanitization.

```
▶ Phase 6.3: AI Sandbox & Vendor Privacy Safeguards Regression Suite
  ✔ 1. Setup Clinical Sandbox Test Harness (2.1585ms)
  ✔ 2. Feature Flag Validation & Fail-Closed Startup Enforcements (0.5666ms)
  ✔ 3. Mock AI Provider: Deterministic Synthetic Documentation (2.1575ms)
  ✔ 4. Gemini Adapter Sandbox Delegation: Zero Outbound Gemini Calls (0.5635ms)
  ✔ 5. AssemblyAI Sandbox Controls: Zero Outbound Calls & Synthetic Token Only (0.7849ms)
  ✔ 6. Transcription Service: Issues Sandbox Token with Audit Record (1.2931ms)
  ✔ 7. AI Job Creation & Processing: Draft-Only State and Synthetic Tagging (52.8584ms)
  ✔ 8. Audit Logging: Provider Mode & Sandbox Indicator (No Raw Content Leaks) (0.4027ms)
  ✔ 9. Admin Clinical Access Prohibition: HTTP 403 Forbidden (15.734ms)
  ✔ 10. Psychologist Approval Workflow: Requires Clinician Review & Commits Record (13.2024ms)
  ✔ 11. Zero Binary Persistence Invariant: RTDB Text/JSON Only (0.3315ms)
  ✔ 12. AI Status Endpoint: Correctly Reports Active Sandbox Mode (5.2751ms)
✔ Phase 6.3: AI Sandbox & Vendor Privacy Safeguards Regression Suite (98.5298ms)
```

---

## 2. Detailed Test Matrix

| Test Case ID | Test Category | Target Component | Description & Preconditions | Expected Assertion / Behavior | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-P63-001** | Test Harness | `firebaseRtdbAdapter` | Seed test psychologist, patient, admin, appointment, session, consent, and structured transcript turns. | All database paths initialized without schema violations. | All entities created in test RTDB memory tree. | **PASS** |
| **TC-P63-002** | Configuration | `aiSandboxConfig.js` | Validate safe default configuration resolution with empty or partial environment variables. | `resolveAiSandboxConfig({})` returns `geminiProvider='mock'`, `geminiClinicalLiveEnabled=false`, `assemblyaiLiveEnabled=false`, `sandboxMode=true`. | Exact match on default sandbox parameters. | **PASS** |
| **TC-P63-003** | Fail-Closed | `aiSandboxConfig.js` | Attempt to set `GEMINI_PROVIDER=live` while `AI_SANDBOX_MODE=true`. | Throws `[FAIL-CLOSED SECURITY VIOLATION] GEMINI_PROVIDER must be 'mock' when AI_SANDBOX_MODE is true.` | Exception thrown; process fails closed. | **PASS** |
| **TC-P63-004** | Fail-Closed | `aiSandboxConfig.js` | Attempt to set `GEMINI_CLINICAL_LIVE_ENABLED=true` while `AI_SANDBOX_MODE=true`. | Throws `[FAIL-CLOSED SECURITY VIOLATION] GEMINI_CLINICAL_LIVE_ENABLED must be false when AI_SANDBOX_MODE is true.` | Exception thrown; process fails closed. | **PASS** |
| **TC-P63-005** | Fail-Closed | `aiSandboxConfig.js` | Attempt to set `ASSEMBLYAI_LIVE_ENABLED=true` while `AI_SANDBOX_MODE=true`. | Throws `[FAIL-CLOSED SECURITY VIOLATION] ASSEMBLYAI_LIVE_ENABLED must be false when AI_SANDBOX_MODE is true.` | Exception thrown; process fails closed. | **PASS** |
| **TC-P63-006** | Fail-Closed | `aiSandboxConfig.js` | Attempt to set invalid provider string (e.g. `unsupported_vendor`). | Throws `Invalid GEMINI_PROVIDER 'unsupported_vendor'. Permitted values: 'mock' \| 'live'.` | Exception thrown; invalid vendor rejected. | **PASS** |
| **TC-P63-007** | Mock AI Provider | `mockAiAdapter.js` | Generate SOAP note from session transcript. | Returns structured JSON with `[SYNTHETIC TEST DRAFT]` markers, `isSynthetic: true`, `isMock: true`, `provider: 'mock'`. | Exact schema compliance with synthetic tags. | **PASS** |
| **TC-P63-008** | Mock AI Provider | `mockAiAdapter.js` | Generate Treatment Plan draft from session transcript. | Returns structured objectives, interventions, and review frequency tagged `isSynthetic: true`. | Valid Treatment Plan schema generated. | **PASS** |
| **TC-P63-009** | Mock AI Provider | `mockAiAdapter.js` | Run documentation completeness audit check. | Returns domain completeness score and findings with disclaimer. | Valid completeness schema returned. | **PASS** |
| **TC-P63-010** | Gemini Adapter | `geminiAdapter.js` | Verify adapter status report during sandbox mode. | Reports `status: 'SANDBOX_MOCK_ACTIVE'`, `externalCallsBlocked: true`, `storagePolicy: 'ZERO_EXTERNAL_TRANSMISSION'`. | Matches expected status schema. | **PASS** |
| **TC-P63-011** | Gemini Adapter | `geminiAdapter.js` | Invoke `geminiAdapter.generateClinicalDocumentation` in sandbox mode. | Adapter intercepts call and delegates to `mockAiAdapter`. Zero network requests dispatched to Google GenAI client. | Output produced by mock adapter with `modelUsed: 'mock-deterministic-clinical-v1'`. | **PASS** |
| **TC-P63-012** | Speech Adapter | `assemblyaiAdapter.js` | Verify speech adapter status in sandbox mode. | Reports `status: 'SANDBOX_MOCK_ACTIVE'`, `liveEnabled: false`, `sandboxMode: true`. | Matches expected speech status schema. | **PASS** |
| **TC-P63-013** | Speech Adapter | `assemblyaiAdapter.js` | Request streaming token while `ASSEMBLYAI_LIVE_ENABLED=false`. | Returns synthetic token (`sandbox_mock_token_<hex>`), `isSimulated: true`, `isSandbox: true`, zero outbound fetch. | Ephemeral synthetic token issued without external network call. | **PASS** |
| **TC-P63-014** | Speech Service | `transcription.service.js` | Call `requestStreamingToken` through service layer. | Returns token data with `isSandbox: true`; records `TRANSCRIPTION_TOKEN_ISSUED` in `/auditLogs`. | Token issued; audit logged with sandbox metadata. | **PASS** |
| **TC-P63-015** | Audit Privacy | `audit.service.js` | Inspect `TRANSCRIPTION_TOKEN_ISSUED` audit log. | `metadata.isSandbox === true`, `metadata.providerMode === 'mock'`, `metadata.token === undefined` (no secret token leak). | Verified: Zero secrets in audit logs. | **PASS** |
| **TC-P63-016** | Background Job | `aiJobService.js` / `aiWorker.js` | Enqueue `GENERATE_SOAP` job via `POST /api/v1/ai/jobs` and process via background worker. | HTTP 202 Accepted; job transitions `queued` -> `processing` -> `validating` -> `completed`; draft created. | Job completed; draft ID populated in RTDB. | **PASS** |
| **TC-P63-017** | Draft Invariant | `aiJobService.js` | Inspect created draft in `aiDrafts/{draftId}`. | `isDraft === true`, `approvalStatus === 'pending_approval'`, `approvedAt === null`, `approvedBy === null`. | Draft-only status verified. Never auto-approved. | **PASS** |
| **TC-P63-018** | Audit Privacy | `audit.service.js` | Inspect `AI_JOB_COMPLETED` audit log entry. | `metadata.providerMode === 'mock'`, `metadata.isSynthetic === true`, `metadata.status === 'success'`, no prompt or clinical text leaked. | Verified: Sanitized audit metadata. | **PASS** |
| **TC-P63-019** | ReBAC Boundary | `authorization.js` | Admin account attempts `POST /api/v1/ai/jobs`. | `HTTP 403 Forbidden` (`ADMIN_CLINICAL_ACCESS_PROHIBITED`). | Access denied to administrative role. | **PASS** |
| **TC-P63-020** | ReBAC Boundary | `authorization.js` | Admin account attempts `GET /api/v1/ai/drafts/:id`. | `HTTP 403 Forbidden` (`ADMIN_CLINICAL_ACCESS_PROHIBITED`). | Access denied to administrative role. | **PASS** |
| **TC-P63-021** | ReBAC Boundary | `authorization.js` | Admin account attempts `GET /api/v1/transcription/sessions/:id`. | `HTTP 403 Forbidden` (`ADMIN_CLINICAL_ACCESS_PROHIBITED`). | Access denied to administrative role. | **PASS** |
| **TC-P63-022** | Human Approval | `clinicalService.js` | Patient attempts to approve AI draft via `POST /api/v1/ai/drafts/:id/approve`. | `HTTP 403 Forbidden` (`PSYCHOLOGIST_ROLE_REQUIRED`). | Patient role blocked from clinical approval. | **PASS** |
| **TC-P63-023** | Human Approval | `clinicalService.js` | Authorized psychologist approves draft with `finalizeImmediately: true`. | `HTTP 200 OK`; draft marked `approved`; official signed note committed in `sessionNotes`. | Approved note committed with clinician UID. | **PASS** |
| **TC-P63-024** | Storage Invariant | `firebaseRtdbAdapter.js` | Verify all transcripts and drafts in RTDB. | Pure text/JSON only. No `audioBuffer`, `audioBinary`, or `audioBlob` properties exist. | Verified: Zero binary persistence invariant upheld. | **PASS** |
| **TC-P63-025** | Public Status API | `ai.controller.js` | Authenticated clinician queries `GET /api/v1/ai/status`. | `HTTP 200 OK`; reports `status: 'SANDBOX_MOCK_ACTIVE'`, `sandboxMode: true`, `providerMode: 'mock'`. | Live status endpoint reflects sandbox mode. | **PASS** |

---

## 3. Regression Test Execution Summary

- **Total Backend Tests:** 234
- **Passed:** 234
- **Failed:** 0
- **Duration:** 3.74s
- **Frontend Build:** Built cleanly with Vite in 25.62s (`dist/index.html`, zero bundling warnings/errors).
