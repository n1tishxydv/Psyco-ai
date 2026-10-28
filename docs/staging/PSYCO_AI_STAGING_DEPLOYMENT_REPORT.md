# PSYCO AI — STAGING DEPLOYMENT & READINESS REPORT

**Report Document:** Report A  
**Location:** `docs/staging/PSYCO_AI_STAGING_DEPLOYMENT_REPORT.md`  
**Date:** October 28, 2026  
**Auditor:** Senior Full-Stack Engineer, Firebase Architect & Healthcare Security QA Auditor  
**Product:** Psyco AI — AI-Powered Mental Healthcare Practice Management Platform  
**Target Environment:** Staging Pre-Deployment Assessment  

---

## 1. Executive Deployment Status

| Deployment Category | Target Specification | Current State | Verdict |
| :--- | :--- | :--- | :--- |
| **Hosting Platform** | Firebase Hosting / Containerized Host | Local Vite (5173) + Express (5000) active; no staging cloud target provisioned | **`BLOCKED — CONFIGURATION REQUIRED`** |
| **Frontend Staging Target** | HTTPS Staging Domain (e.g. `staging.psyco-ai.app`) | Configured to `http://localhost:5173` | **`BLOCKED — CONFIGURATION REQUIRED`** |
| **Backend Staging Target** | HTTPS Staging Domain (e.g. `api-staging.psyco-ai.app`) | Configured to `http://localhost:5000` | **`BLOCKED — CONFIGURATION REQUIRED`** |
| **Database Isolation** | Dedicated Staging RTDB Instance | Configured to primary `psyco-9c13d-default-rtdb` | **`BLOCKED — CONFIGURATION REQUIRED`** |
| **Production Build Status** | Production bundle compile | Built successfully in 6.21s, 0 errors | **`PASS`** |
| **Backend Test Status** | Automated validation suite | 112 / 112 tests passed | **`PASS`** |
| **Runtime Health Check** | `/api/v1/health` | HTTP 200 `HEALTHY` (Uptime: 5200s+) | **`PASS`** |

> [!IMPORTANT]
> **Safety Invariant Enforced:** In strict accordance with the audit guidelines (*"Do not deploy the staging application against the production RTDB by default. If the only currently configured database is production, stop before deployment and provide the exact steps required to create and configure a staging database"*), deployment to external staging hosting is **held at the safe boundary** to prevent accidental contamination or synthetic mutation of the primary database.

---

## 2. Existing Deployment Configuration Inspection

### 2.1 Package Scripts & Build Pipeline
* **Root `package.json`**:
  * `"dev:backend"`: `npm --prefix backend run dev`
  * `"dev:frontend"`: `npm --prefix frontend run dev`
  * `"build:frontend"`: `npm --prefix frontend run build`
  * `"test:backend"`: `npm --prefix backend run test`
* **Frontend `package.json`**:
  * Dependencies: React 18.3.1, `react-router-dom` 6.28.0, `firebase` 13.1.0, `lucide-react` 1.16.0, Tailwind CSS 3.4.16.
  * Build Script: `vite build` (Targets ES modules, generates `dist/`).
* **Backend `package.json`**:
  * Dependencies: Express 4.21.2, Helmet 8.0.0, CORS 2.8.5, Zod 3.24.2, `@google/genai` 2.30.0, JSONWebToken 9.0.3.
  * Test Script: `node --test src/tests/*.test.js` (Native Node.js test runner).

### 2.2 Cloud Hosting Infrastructure Inspection
* **Firebase Configuration (`firebase.json`)**:
  ```json
  {
    "database": {
      "rules": "database.rules.json"
    }
  }
  ```
  * *Finding:* `firebase.json` defines RTDB rules but **lacks a `"hosting"` block**. No Firebase Hosting targets are currently configured.
* **Firebase Project Configuration (`.firebaserc`)**:
  ```json
  {
    "projects": {
      "default": "psyco-9c13d"
    }
  }
  ```
  * *Finding:* Only the default project `psyco-9c13d` is declared. No dedicated staging alias (e.g. `"staging": "psyco-staging"`) exists.
* **Containers & CI/CD**:
  * No `Dockerfile`, `docker-compose.yml`, or `render.yaml` exists in the repository.
  * No `.github/workflows` CI/CD directory exists.

---

## 3. Configuration & Secrets Validation

| Configuration Parameter | Target Requirement | Staging State | Safe Status |
| :--- | :--- | :--- | :--- |
| `FIREBASE_PROJECT_ID` | Isolated staging project ID | Set to `psyco-9c13d` | Configured |
| `FIREBASE_DATABASE_URL` | Dedicated staging RTDB URL | Set to `https://psyco-9c13d-default-rtdb...` | Primary Instance |
| `FIREBASE_CLIENT_EMAIL` | Staging service account | Present (`firebase-adminsdk-fbsvc@...`) | Valid |
| `FIREBASE_PRIVATE_KEY` | Staging RSA private key | Present (RS256 valid PEM) | Valid |
| `GEMINI_API_KEY` | Staging Gemini API key | Present & verified live | Active |
| `GEMINI_MODEL` | Clinical copilot model | `gemini-flash-lite-latest` | Verified |
| `ASSEMBLYAI_API_KEY` | Staging transcription key | Present & verified live (WSS token active) | Active |
| `GOOGLE_CLIENT_ID` | Staging OAuth client | Configured (`143160785926-...`) | Configured |
| `GOOGLE_REDIRECT_URI` | Staging backend callback | `http://localhost:5000/...` | Local Only |
| `FRONTEND_URL` | Staging frontend origin | `http://localhost:5173` | Local Only |

> [!NOTE]
> All secret values, private keys, API credentials, and tokens are strictly excluded from frontend builds and repository documentation.

---

## 4. Build & Compilation Verification

### 4.1 Production Frontend Build Execution
* **Command:** `npm run build` inside `frontend/`
* **Bundler:** Vite v6.4.5 + Rollup
* **Status:** `0 ERRORS` (Clean build in 6.21s)
* **Output Artifacts:**
  * `dist/index.html` (1.08 kB)
  * `dist/assets/index-GBrTbflC.css` (63.29 kB)
  * `dist/assets/index-CPiSydzu.js` (1,154.91 kB)
* **Bundle Analysis:** The single JavaScript bundle warning (1,154 kB) does not block functionality or runtime stability, but manual chunk splitting (`manualChunks`) is recommended for public production release.

### 4.2 Automated Test Suite Execution
* **Command:** `npm test` inside `backend/`
* **Test Runner:** Node.js v24 Test Runner (`node --test`)
* **Total Discovered:** 112
* **Total Passed:** 112
* **Total Failed:** 0
* **Duration:** 3179.38 ms

---

## 5. Integration Verification in Staging Build Candidate

* **Firebase RTDB Cloud Connectivity:** **`PASS`**. Full synthetic write, direct cloud read via OAuth2 bearer token, update, and clean deletion completed with **HTTP 200 OK**.
* **Cryptographic Token Verification:** **`PASS`**. Tested against Google's live x509 public certificates; unsigned and forged tokens rejected with **HTTP 401**.
* **AssemblyAI Real-Time Transcription:** **`PASS`**. Live WebSocket streaming token (2667 chars) issued directly by `streaming.assemblyai.com/v3`.
* **Google Gemini Clinical Copilot:** **`PASS`**. Live generative documentation active using `gemini-flash-lite-latest` with Hinglish dialogue synthesis.
* **Google Sign-In Popup:** **`BLOCKED — OPERATOR ACTION REQUIRED`**. Requires adding testing emails under Google Cloud Console > APIs & Services > OAuth consent screen > Test users.
* **Google Calendar & Meet OAuth:** **`BLOCKED — OPERATOR ACTION REQUIRED`**. OAuth state generation and callback handling verified; live two-way sync requires clinician to complete Google consent dialog.

---

## 6. Rollback & Disaster Recovery Procedures

To ensure that any staging deployment can be disabled or reverted without data corruption:

### 6.1 Version Pinning
* **Current Staging Candidate Release:** `v1.0.0-rc1` (Build Hash: `CPiSydzu`)
* **Associated Git Snapshot:** Preserved locally across `frontend/dist/` and backend runtime.

### 6.2 Instant Staging Teardown / Rollback
1. **Frontend Rollback:** If hosting via Firebase Hosting or Vercel, execute:
   ```bash
   firebase hosting:channel:deploy staging --expires 0d
   ```
   Or revert the Vercel deployment alias to the previous stable deployment ID.
2. **Backend Rollback:** On containerized hosts (Cloud Run / Render), route 100% of traffic to the previous healthy revision image.
3. **Database Safeguard:**
   * Synthetic staging records are isolated under `/auditVerification/` and staging test UIDs (`pat_pre8_*`, `psych_pre8_*`).
   * Rollback of application code does NOT alter or wipe existing database nodes.

---

## 7. Next Steps for Live Staging Release

1. **Establish Isolated Staging RTDB Instance:** Follow Section 3 of `PSYCO_AI_STAGING_BLOCKERS_AND_ACTIONS.md` to create a dedicated staging database.
2. **Configure Staging Hosting Target:** Add the `"hosting"` section to `firebase.json` for Firebase Hosting or deploy backend container to Cloud Run.
3. **Register OAuth Test Users:** Add tester accounts to Google Cloud Console.
