# PSYCO AI — AUDIT EVIDENCE & EXECUTION LOG

**Generated Date:** October 28, 2026  
**Auditor:** Antigravity System Audit & Verification Team  
**Scope:** Complete Execution Logs, Test Artifacts, & Verification Traces

---

## 1. AUTOMATED TEST SUITE EXECUTION

### Backend Test Harness Execution
- **Command:** `npm test` (invoking `node --test src/tests/*.test.js`)
- **Working Directory:** `.\backend`
- **Execution Date:** October 28, 2026
- **Result:** **103 passed, 0 failed, 0 skipped, duration 36.86s (Exit Code 0)**
- **Test Artifact Log:** `task-19.log`

#### Discovered Warning Artifacts in Test Output:
1. `[WARN] RTDB remote write failed with status 401 for path ...`
   *Occurred on every database write operation across all phases, confirming that remote Firebase RTDB rejects REST operations and triggers the local in-memory/JSON snapshot fallback.*
2. `[WARN] Could not dispatch assignment notification: notificationService.sendNotification is not a function`
   *Occurred in Workflow G during assessment assignment, confirming DEFECT-03.*
3. `[WARN] Could not dispatch risk alert notification: notificationService.sendNotification is not a function`
   *Occurred in Workflow G during critical risk review flag creation on PHQ-9 Q9, confirming DEFECT-03.*
4. `[INFO] Gemini API key unconfigured; generating structured clinical draft via deterministic engine for GENERATE_SOAP`
   *Confirmed that unit test runs deliberately bypass external AI provider quota by invoking `_generateDeterministicFallback`.*

---

## 2. FRONTEND PRODUCTION BUILD VALIDATION

- **Command:** `npm run build` (invoking `vite build`)
- **Working Directory:** `.\frontend`
- **Execution Date:** October 28, 2026
- **Result:** **Build Succeeded in 19.52s (Exit Code 0)**
- **Output Artifacts:**
  - `dist/index.html` (1.08 kB)
  - `dist/assets/index-X6iFv-A9.css` (58.77 kB │ gzip: 10.36 kB)
  - `dist/assets/index-djvZE9MD.js` (1,131.18 kB │ gzip: 253.95 kB)
  - Modules Transformed: 2,055 modules cleanly transformed.

---

## 3. LIVE BROWSER SUBAGENT INSPECTION TRACE

- **Environment:** Live Vite Dev Server on `http://localhost:5173` & Express API Server on `http://localhost:5000`
- **Recording Artifact:** `audit_public_site`
- **Browser Actions Executed:**
  1. `http://localhost:5173/`: Home page hero renders; brand typography "Psyco AI", "Practice Management & Clinical Intelligence" loaded. Glassmorphism navigation bar operational.
  2. `/about`: Clinical mission, practice autonomy values, ethical AI governance statements verified.
  3. `/services`: Interactive service tabs ("Practice Automation", "Clinical Intelligence", "Patient Care Portal", "Governance & Security") clicked and toggled without layout shifts.
  4. `/faq`: Frequently asked questions rendered; accordion items clicked and animated cleanly.
  5. `/contact`: Contact form loaded. Invalid submission tested with blank fields; validation error tooltips displayed. Valid synthetic test payload submitted; response acknowledged cleanly.
  6. `/find-psychologist`: Clinician cards for "Dr. Elena Vance" and "Dr. James Moriarty" loaded from backend with license numbers, specializations, and booking CTA buttons.
  7. `/get-started`: Onboarding selection cards for Patients and Psychologists rendered with direct route links.
  8. `/login` and `/register`: Authentication forms rendered with role toggles ("Patient" vs "Psychologist"), password strength validation, and Google Sign-in buttons.
  9. **Console Inspection:** Zero unhandled exceptions or broken visual assets observed on public routes.

---

## 4. DIRECT EXTERNAL PROVIDER INTEGRATION TRACES

### A. AssemblyAI Streaming v3 Ephemeral Token Trace
- **Code Path:** `backend/src/integrations/assemblyai/assemblyAiAdapter.js`
- **Operation:** `assemblyaiAdapter.createStreamingToken()`
- **Result Output:**
  ```json
  {
    "isSimulated": false,
    "hasToken": true,
    "wsUrl": "wss://streaming.assemblyai.com/v3/ws?token=..."
  }
  ```
- **Auditor Evaluation:** Confirmed live API connectivity with AssemblyAI's streaming token endpoint using configured `ASSEMBLYAI_API_KEY`.

### B. Google Gemini Clinical Copilot Live Invocation Trace
- **Code Path:** `backend/src/integrations/gemini/geminiAdapter.js`
- **SDK:** `@google/genai` (v2.30.0)
- **Model Configured:** `gemini-3.8-flash`
- **Operation:** `models.generateContent({ model: 'gemini-3.8-flash', contents: 'respond with ok' })`
- **Result Output:** `Gemini Live Response: ok`
- **Deprecation Finding Trace:** Calling with `gemini-2.5-flash` returned:
  `{"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash..."}}`
- **Auditor Evaluation:** Live Google GenAI integration functions successfully when explicitly using `gemini-3.8-flash`.

### C. Firebase Realtime Database Live REST Probe
- **Target URL:** `https://psyco-9c13d-default-rtdb.firebaseio.com/psychologists.json`
- **Operation:** Direct HTTPS GET request
- **Result Output:** `RTDB psychologists read status: 401 Unauthorized, keys: [ 'error' ]`
- **Auditor Evaluation:** Confirms that remote Firebase RTDB requires credentials that are missing from `backend/.env`.

---

## 5. LOCAL PERSISTENCE INSPECTION TRACE

- **File Path:** `.\backend\data\rtdb_snapshot.json`
- **Inspection Summary:**
  - File contains 1,089 lines of formatted JSON (33.7 KB).
  - 18 collections actively seeded with synthetic accounts:
    - User `QbERUvpni8MPpcNddAM4U5JUZ5M2`: Dr. Elena Vance (Psychologist, license `PSY-98421-RCI`, approved).
    - User `GQCjxZQwc2dxxKSBPeALbdkDYHE2`: Nitish Yadav (Patient, completed onboarding).
    - User `unassigned_psych_01`: Dr. James Moriarty (Psychologist, approved).
  - Weekly schedules and availability rules configured.
  - Zero base64 audio, image, or video media discovered.

---

## 6. TESTS BLOCKED OR NOT TESTED

1. **WebSocket Physical Microphone Audio Streaming:**
   - Reason: Headless audit environment does not possess a hardware microphone input device.
   - Status: AssemblyAI token generation verified live; client audio capture verified by code inspection.
2. **Google Calendar Real Event Creation:**
   - Reason: Requires live psychologist user to execute interactive Google OAuth consent screen in a browser window.
   - Status: Adapter and route endpoints verified; returns expected `not_connected` status.
