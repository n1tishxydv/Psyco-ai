# PSYCO AI — PHASE 0: REPOSITORY BASELINE AUDIT

**Audit Date:** 2026-10-28  
**Auditor:** Senior Full-Stack & DevOps Engineer, Application Security Lead  
**Target Application:** Psyco AI (Mental Health Practice Management SaaS)  
**Corpus Root:** `.`

---

## 1. Executive Summary

This audit establishes the baseline technical state of the Psyco AI platform prior to staging isolation. Psyco AI is a clinical practice management system serving Patients, Psychologists, and Practice Administrators. All persistent application records are constrained to structured JSON in Firebase Realtime Database. Audio and video streaming are strictly transient.

### Core Baseline Metrics

| Component | Target Version / Runtime | Baseline Verification Status | Observed Result |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Node.js v20+ / Express 4.21.2 | PASS | Express server boots, 122 automated tests passing (3350ms) |
| **Frontend Runtime** | React 18.3.1 / Vite 6.0.1 / TailwindCSS | PASS | Production build completes cleanly in 6.46s (Vite v6.4.5) |
| **Database** | Firebase Realtime Database | PASS | Strict text-only JSON adapter verified; zero Firestore |
| **Primary Project** | `psyco-9c13d` | PRESERVED | Untouched; rejected by staging safeguards |
| **Staging Target** | `psyco-ai-staging` | ACTIVE | Dedicated GCP/Firebase project verified |

---

## 2. Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 18 (Vite SPA) + Tailwind CSS + Lucide Icons                                |
|  Portals: /patient/*, /psychologist/*, /admin/*, Public Marketing & FAQs          |
+----------------------------------------+------------------------------------------+
                                         | REST / JSON (Express Router)
                                         v
+-----------------------------------------------------------------------------------+
|                                 BACKEND API TIER                                  |
|  Node.js (ESM) + Express 4.21.2                                                   |
|  Port: 5000 | Prefix: /api/v1                                                     |
|  Middlewares: Helmet, CORS, Rate-Limiting, Bearer Auth, ReBAC Role Gates          |
+-------------------+--------------------+--------------------+---------------------+
                    |                    |                    |
                    v                    v                    v
      +---------------------+   +----------------+   +-------------------+
      | FIREBASE RTDB       |   | GOOGLE GEMINI  |   | ASSEMBLYAI        |
      | Text/JSON Only      |   | Copilot Engine |   | Ambient Streaming |
      | (Zero binary media) |   | Draft Notes    |   | Ephemeral Token   |
      +---------------------+   +----------------+   +-------------------+
```

### Component Inventory

1. **Frontend (`/frontend`)**:
   - Framework: React 18 with Vite SPA architecture.
   - Styling: Tailwind CSS 3.4.16 with responsive navigation and modal dialogs.
   - Client Firebase SDK: Used for client authentication state (`onAuthStateChanged`, ID token generation).
   - Data Access Model: Express-mediated API requests via `VITE_API_BASE_URL=http://localhost:5000/api/v1`. Browser does not write directly to sensitive database root.

2. **Backend (`/backend`)**:
   - Router: Modular Express architecture mounted under `/api/v1`.
   - Security Middleware:
     - `helmet`: Secure HTTP response headers.
     - `cors`: Restricted origin validation against `FRONTEND_URL`.
     - `express-rate-limit`: Brute-force protection on authentication and public inquiry routes.
   - Database Adapter: `backend/src/integrations/firebase/firebaseRtdbAdapter.js` provides REST-mediated read/write operations with service account OAuth2 token authentication (RSA256 JWT assertion against `https://oauth2.googleapis.com/token`).

3. **Database Security Model**:
   - Technology: Firebase Realtime Database (`us-central1`).
   - Security Rules: Declarative authorization tree in `database.rules.json` enforced at the database level.
   - Clinical Privacy Invariant: ReBAC policy ensures administrators cannot read private psychotherapy notes (`sessionNotes`, `clinicalDrafts`).

---

## 3. Discovered Configuration & Environment Variables

### Frontend Environment Keys (`frontend/.env.staging.example`)
- `VITE_API_BASE_URL`: Backend API endpoint (e.g., `http://localhost:5000/api/v1`).
- `VITE_FIREBASE_API_KEY`: Browser Firebase API key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Auth domain (e.g., `psyco-ai-staging.firebaseapp.com`).
- `VITE_FIREBASE_PROJECT_ID`: Staging project ID (`psyco-ai-staging`).
- `VITE_FIREBASE_DATABASE_URL`: Staging RTDB URL (`https://psyco-ai-staging-default-rtdb.firebaseio.com`).
- `VITE_FIREBASE_APP_ID`: Web application ID (`1:651213878079:web:09848e67fa97d2dfbfd98a`).

### Backend Environment Keys (`backend/.env.staging.example`)
- `PORT`: HTTP server listen port (`5000`).
- `NODE_ENV`: Runtime identifier (`staging`).
- `FIREBASE_PROJECT_ID`: Isolated GCP project ID (`psyco-ai-staging`).
- `FIREBASE_DATABASE_URL`: Dedicated database URL (`https://psyco-ai-staging-default-rtdb.firebaseio.com`).
- `FIREBASE_CLIENT_EMAIL`: Service account email (`firebase-adminsdk-fbsvc@psyco-ai-staging.iam.gserviceaccount.com`).
- `FIREBASE_PRIVATE_KEY`: RSA256 private key for service account assertion.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: OAuth credentials for Calendar & Meet integration.
- `GEMINI_API_KEY`: Google Gemini clinical documentation copilot key.
- `ASSEMBLYAI_API_KEY`: AssemblyAI speech-to-text ambient streaming token key.

---

## 4. Initial Baseline Test & Build Results

### Automated Backend Tests
- Command: `npm test` (executed in `/backend`)
- Test Engine: Node.js native test runner (`node --test src/tests/*.test.js`)
- Total Tests: **122**
- Suites Passed: **100% (122 / 122)**
- Execution Duration: **3.35s**
- Covered Test Scenarios:
  - Token signature verification and role claim validation.
  - Appointment scheduling, lead-time rules, and calendar conflict detection.
  - Clinician approval workflows and unapproved practitioner blocks.
  - Clinical SOAP documentation and human-in-the-loop sign-off.
  - PHQ-9 scoring engine, severity categorization, and critical safety flag triggers.
  - Admin operational access vs. clinical note privacy lockouts.
  - Production project rejection and staging fail-closed guards.
  - Strict text-only storage assertions (rejection of base64 and binary media).

### Frontend Production Build
- Command: `npm run build` (executed in `/frontend`)
- Bundler: Vite 6.0.1 with Rollup
- Build Result: **SUCCESS** in 6.46s
- Output Directory: `frontend/dist/`
- Output Assets:
  - `dist/index.html`: 1.08 kB
  - `dist/assets/index-GBrTbflC.css`: 63.29 kB
  - `dist/assets/index-CPiSydzu.js`: 1,154.91 kB
- Secret Scan: Zero private keys, zero OAuth secrets, zero service account tokens bundled into JavaScript.

---

## 5. Identified Gaps & Deficiencies Prior to Staging Work

1. **Staging Seeder Lacked Dry-Run**: `backend/scripts/seedStagingEnvironment.js` wrote directly without a non-destructive dry-run inspection mode. *(Resolved in Phase 3)*.
2. **Missing Repeatable Staging Safety Suite**: Automated tests did not explicitly verify that changing `config.firebase.projectId` to `psyco-9c13d` safely aborted execution. *(Resolved in Phase 13 with `staging_safety.test.js`)*.
3. **Google Sign-In OAuth Consent Screen**: In Google Cloud Console, Google Sign-In requires test users to be explicitly registered in "Testing" mode. *(Identified as Operator Action in Phase 6)*.
4. **Google Calendar & Meet Interactive Grant**: Requires interactive OAuth consent by clinician to issue refresh tokens. *(Documented in Phase 7)*.

---

## 6. Files Modified / Created During Baseline Audit

- [seedStagingEnvironment.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/scripts/seedStagingEnvironment.js): Added dry-run capability and fail-closed checks.
- [staging_safety.test.js](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/staging_safety.test.js): Automated environment guard tests.
- [package.json (backend)](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/package.json): Added `dev:staging`, `start:staging`, `seed:staging`.
- [package.json (root)](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/package.json): Added workspace-level staging lifecycle commands.
