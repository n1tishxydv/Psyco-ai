# Psyco AI — AI-Powered Mental Health Practice-Management Platform

> **"Less time on paperwork. More time for patient care."**

Psyco AI is a modern, privacy-focused, web-based mental health practice-management SaaS built specifically for clinical psychologists, psychotherapists, and outpatient mental health clinics.

The platform provides end-to-end clinical workflow automation: from patient intake, psychometrics (PHQ-9, GAD-7, C-SSRS), and conflict-free scheduling, to consultation transcription, clinical documentation drafts with mandatory human-in-the-loop review, and longitudinal treatment plan tracking.

---

## 1. Staging Deployments & Project Infrastructure

* **Frontend Staging:** [https://psyco-ai-staging.web.app](https://psyco-ai-staging.web.app/) (Firebase Hosting)
* **Backend Staging:** [https://psyco-ai.onrender.com](https://psyco-ai.onrender.com/) (Render Web Service)
* **Staging Database:** [https://psyco-ai-staging-default-rtdb.firebaseio.com](https://psyco-ai-staging-default-rtdb.firebaseio.com/) (Firebase Realtime Database)
* **Repository:** [https://github.com/n1tishxydv/Psyco-ai](https://github.com/n1tishxydv/Psyco-ai)
* **Production Guard:** Production project (`psyco-9c13d`) is strictly isolated and untouchable from staging tooling and automated tests.

---

## 2. Core Features & Portals

* **Three Role-Gated Portals:**
  * **Patient Portal:** Appointment booking, self-assessment intake forms, psychometric screener runners, and care plan access.
  * **Psychologist Portal:** Practice schedule management, therapeutic chart reviews, consultation transcription, clinical documentation copilot, and diagnostic assessment dispatch.
  * **Administrator Portal:** System uptime metrics, practitioner credential review/approval, and operational audit logs (strictly barred from private clinical psychotherapy notes and patient charts).
* **AI Sandbox Safeguards (Phase 6.3):**
  * **Fail-Closed Isolation:** `AI_SANDBOX_MODE=true` ensures external Google Gemini and AssemblyAI live endpoints are disabled (`GEMINI_CLINICAL_LIVE_ENABLED=false`, `ASSEMBLYAI_LIVE_ENABLED=false`).
  * **Deterministic Synthetic Output:** AI assistance utilizes a deterministic mock provider with verified synthetic inputs only; zero identifiable clinical data is transmitted externally.
  * **Mandatory Human-in-the-Loop Review:** All generated clinical drafts (SOAP, DAP, BIRP) remain in `draft` status until explicitly edited, signed, and approved by a verified psychologist. The system never diagnoses or prescribes autonomously.
* **Scheduling & Telehealth Integration:** Google Calendar API v3 integration with automated Google Meet video room creation and conflict detection.
* **Clinical Safety Interceptors:** Deterministic Q9 suicide risk safety gate (C-SSRS / PHQ-9 Item 9) that enforces immediate clinical acknowledgment before session finalization.

---

## 3. Technology Stack & Storage Architecture

* **Frontend:** React 18, Vite 6, Tailwind CSS, Lucide React icons, Context API for state management.
* **Backend:** Node.js 20+, Express.js, versioned REST API (`/api/v1`), Zod request validation, Helmet, CORS, and rate limiting.
* **Database:** **Firebase Realtime Database (Sole Database).** All persistent clinical data is structured text-only JSON. No Firestore, SQL, or binary bucket dependencies.
* **Authentication:** Firebase Authentication (Email/Password & Google Sign-In) with cryptographic server-side JWT verification and automated token renewal.
* **Strict Zero-Binary Media Policy:** Psyco AI explicitly forbids the storage of raw MP3, WAV, WebM, JPEG, or Base64 audio/image media in persistent storage.
* **Ephemeral Audio Processing:** Streaming audio chunks are processed transiently in-memory and wiped immediately.
* **Administrative Clinical Lockout:** Express route guards (`blockAdminFromClinicalRecords`) and RTDB rules enforce that administrative accounts receive `403 Forbidden` (`ADMIN_CLINICAL_ACCESS_PROHIBITED`) if attempting to access clinical psychotherapy charts or session notes. No unsupported regulatory certifications are claimed.

---

## 4. Repository Structure

```
psyco/
├── .firebaserc                     # Firebase project configuration and aliases
├── .gitignore                      # Master Git ignore rules
├── database.rules.json             # Firebase Realtime Database security rules
├── firebase.json                   # Firebase deployment configuration
├── package.json                    # Root npm workspace commands
├── backend/
│   ├── .env.example                # Safe backend environment template
│   ├── .env.staging.example        # Safe staging backend template
│   ├── package.json                # Backend dependencies and scripts
│   ├── scripts/                    # Maintenance, diagnostic, and seeding tools
│   │   ├── diagnoseAccount.js      # Account & role inspector
│   │   ├── migrateToRtdb.js        # Safe database migration utility
│   │   ├── provisionAdmin.js       # Operator-only admin provisioning
│   │   └── seedStagingEnvironment.js # Synthetic staging database seeder
│   └── src/
│       ├── app.js                  # Express application setup
│       ├── config/                 # Environment and credential loader
│       ├── controllers/            # Route controllers
│       ├── integrations/           # Third-party adapters (Gemini, AssemblyAI, Calendar, Firebase)
│       ├── middleware/             # Auth, role authorization, rate limiters
│       ├── routes/                 # Versioned API routes (/api/v1)
│       ├── services/               # Core business and clinical logic
│       └── tests/                  # Automated native test suite (131 tests)
├── frontend/
│   ├── .env.example                # Safe frontend environment template
│   ├── .env.staging.example        # Safe staging frontend template
│   ├── package.json                # Frontend dependencies and scripts
│   ├── vite.config.js              # Vite bundler configuration
│   └── src/
│       ├── components/             # Reusable UI components and layout
│       ├── context/                # Authentication & Theme contexts
│       ├── features/               # Patient, Psychologist, Admin, and Public views
│       ├── routes/                 # Protected and role-gated routing
│       └── services/               # API clients and Firebase Web SDK
└── docs/                           # Architectural, security, and staging documentation
```

---

## 5. Prerequisites

* **Node.js:** $\ge$ 20.0.0 (Node.js 22 LTS or 24 recommended).
* **npm:** $\ge$ 10.0.0.
* **Firebase Project:** A Google Cloud / Firebase project with Realtime Database and Authentication enabled.

---

## 6. Installation & Environment Setup

### 1. Install All Dependencies

```bash
npm run install:all
```

### 2. Configure Backend Environment

Copy the safe example template:

```bash
cp backend/.env.example backend/.env
```

Or for staging:

```bash
cp backend/.env.staging.example backend/.env.staging
```

Populate the following variables with your isolated credentials:

| Variable | Description | Source |
|---|---|---|
| `PORT` | Backend server port (default: `5000`) | Local |
| `NODE_ENV` | Environment (`development` or `staging`) | Local |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID | Firebase Console |
| `FIREBASE_DATABASE_URL` | Your Firebase Realtime Database URL | Firebase Console |
| `FIREBASE_CLIENT_EMAIL` | Service Account client email | GCP Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Service Account RSA private key | GCP Service Accounts |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Web Client ID | GCP Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret (Server-only) | GCP Credentials |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5000/api/v1/integrations/google/callback` | GCP Credentials |
| `GEMINI_API_KEY` | Google AI Studio / Gemini API Key | Google AI Studio |
| `ASSEMBLYAI_API_KEY` | AssemblyAI Speech-to-Text API Key | AssemblyAI Dashboard |

### 3. Configure Frontend Environment

Copy the frontend example template:

```bash
cp frontend/.env.example frontend/.env
```

Or for staging:

```bash
cp frontend/.env.staging.example frontend/.env.staging
```

Configure only public browser credentials:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://your-project-default-rtdb.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |

> [!CAUTION]
> Never put Firebase private keys, OAuth client secrets, or Gemini/AssemblyAI API keys in frontend environment files or `VITE_` variables.

---

## 7. Running Locally

### Development Mode

Run backend and frontend concurrently:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

* Backend API: `http://localhost:5000`
* Frontend App: `http://localhost:5173`
* Health Check: `http://localhost:5000/api/v1/health`

### Staging Mode

To run with isolated staging credentials (`.env.staging`):

```bash
# Terminal 1: Staging Backend
npm run dev:backend:staging

# Terminal 2: Staging Frontend
npm run dev:frontend:staging
```

---

## 8. Automated Testing & Verification

Run the comprehensive native Node.js test suite:

```bash
npm test
```

* Total Automated Tests: **250 tests** across 22 test suites (`node --test src/tests/*.test.js`).
* Scope: Security rules, ReBAC isolation, JWT verification, token renewal, suicide safety gates, ReDoS/Zod validations, text-only storage policies, AI sandbox mock determinism, reports data contract regression, and staging environment shields.
* Pass Rate: **100% (250/250 passing)**.

To build the frontend for staging:

```bash
npm run build:frontend:staging
```

---

## 9. Staging Synthetic Data Seeder

To seed a fresh, isolated staging database with synthetic test records (fictional patients, psychologists, availability, and session records):

```bash
# Dry run verification (0 records written)
npm run seed:staging:dry-run

# Live staging seeding
npm run seed:staging
```

> [!NOTE]
> The seeder includes built-in safety guards that automatically abort if targeted at production database `psyco-9c13d`.

---

## 10. Known Limitations & Pending Integrations

* **Google Calendar & Meet Video Links:** The backend OAuth code exchange and conference generation engines are fully tested and functional. Creating live events on Google Calendar requires a human clinician to complete one interactive OAuth consent dialog at `http://localhost:5173/settings` using a verified Google Account.
* **Google Sign-In Test Users:** External Google Sign-In requires adding tester emails to the Google Cloud Console OAuth Consent Screen Test Users list while the app is in "Testing" mode.

---

## 11. Security & Compliance Guidelines

1. **No Production Access in Staging:** Staging scripts and tests must point exclusively to `psyco-ai-staging`.
2. **Database Security Rules:** Deploy database rules from `database.rules.json` via the Firebase Console or `firebase deploy --only database`.
3. **Admin Privacy Barrier:** Administrators cannot read clinical session notes. If an administrative audit is required, use operational logs in `/api/v1/admin/metrics` and `auditLogs`.

---

## 12. License

Proprietary — All rights reserved. Psyco AI Architecture Team.
