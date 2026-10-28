# Psyco AI — Complete Remaining Work Roadmap

**Audit Date:** October 28, 2026  
**Auditor:** Senior Full-Stack & Healthcare Software Quality Architect  
**Objective:** Actionable, prioritized pre-production roadmap to transition Psyco AI from Verified Release Candidate (`rc1`) to Controlled Staging and Production.

---

## 1. Prioritized Roadmap Overview

| Priority | Task ID | Description | Primary Dependency | Estimated Effort | Target Phase |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **TASK-01** | Register OAuth Test Users in Google Cloud Console | Google Cloud Admin Access | 15 mins | Pre-Release Auth |
| **P1** | **TASK-02** | Complete Clinician Google Calendar Consent Flow | Google Cloud OAuth Credentials | 1 hour | Integrations |
| **P2** | **TASK-03** | Configure Frontend Vite Chunk Code-Splitting | Vite Configuration | 45 mins | Performance |
| **P3** | **TASK-04** | Implement Medical Clinic JSON-LD Structured SEO | Frontend HTML Metadata | 30 mins | SEO & Marketing |
| **P4** | **TASK-05** | Production Staging Environment Hardening | Cloud Hosting Infrastructure | 2 hours | Operations |

---

## 2. Detailed Task Specifications

### TASK-01: Register Authorized OAuth Test Users in Google Cloud Console
* **Priority:** **P0 (Critical Pre-Release Blocker for Google SSO)**
* **Objective:** Enable seamless Google Sign-In for internal QA testers and clinicians without encountering Google OAuth 403 `access_denied`.
* **Prerequisites:** Access to Google Cloud Console for project `psyco-9c13d` / Client ID `143160785926`.
* **Step-by-step Execution:**
  1. Navigate to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
  2. Open **OAuth consent screen**.
  3. Under **Test users**, click **+ ADD USERS**.
  4. Add `admin.staging@psyco.clinic` and all QA team test emails.
  5. Save changes.
* **Acceptance Criteria:**
  * Clicking "Continue with Google" on `http://localhost:5173/login` completes popup authentication without error.
  * Backend receives genuine Firebase ID token, validates RS256 signature, and maps account to user profile in RTDB.
* **Verification Test:**
  * Run browser subagent on `/login`, click Google Sign-In, and verify redirect to `/patient/dashboard` or `/admin/dashboard`.

---

### TASK-02: Complete Clinician Google Calendar Consent & Live Event Sync
* **Priority:** **P1**
* **Objective:** Enable psychologists to synchronize their Psyco AI appointment calendar with their personal Google Calendar and generate live Google Meet video links.
* **Prerequisites:** Authorized Redirect URI configured in Google Developer Console (`http://localhost:5000/api/v1/integrations/google/callback`).
* **Step-by-step Execution:**
  1. In Google Cloud Console, ensure redirect URI `http://localhost:5000/api/v1/integrations/google/callback` is authorized.
  2. Test clinician authorization flow via `/api/v1/integrations/google/auth-url`.
  3. Authorize Google account and verify tokens stored securely under `integrations/googleCalendar/:uid`.
  4. Verify that booking an appointment in Psyco AI creates a matching event on Google Calendar with a Google Meet conference link.
* **Acceptance Criteria:**
  * Event created on Google Calendar with title "Psyco AI Clinical Session".
  * Google Meet link automatically saved to `appointments/:id/meetingUrl`.
* **Verification Test:**
  * Book test appointment as synthetic patient; check psychologist Google Calendar for new event.

---

### TASK-03: Configure Frontend Vite Bundle Splitting & Performance Hardening
* **Priority:** **P2**
* **Objective:** Eliminate large bundle warning and optimize page load time across desktop and mobile devices.
* **Implementation Plan:**
  * Update `frontend/vite.config.js`:
    ```javascript
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/database'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    }
    ```
* **Acceptance Criteria:**
  * Production build runs with zero chunk size warnings.
  * Vendor libraries cached separately for faster reloads.
* **Verification Test:**
  * Execute `npm run build` in `frontend/` and verify all chunk sizes are under 400 kB.

---

### TASK-04: Implement Schema.org MedicalBusiness / MentalHealthClinic Metadata
* **Priority:** **P3**
* **Objective:** Improve SEO discoverability and provide search engines with rich snippets regarding practice credentials and emergency hotlines.
* **Implementation Plan:**
  * Insert JSON-LD structured data in `frontend/index.html` describing `MedicalBusiness` with `medicalSpecialty: "Psychiatry"`.
* **Acceptance Criteria:**
  * Google Rich Results Test passes with zero errors.

---

### TASK-05: Controlled Staging Deployment & Environment Hardening
* **Priority:** **P4**
* **Objective:** Deploy Psyco AI to a secured staging server for multi-user user acceptance testing (UAT).
* **Prerequisites:** Completion of Tasks 01–04.
* **Acceptance Criteria:**
  * Frontend deployed on HTTPS (e.g. Firebase Hosting or Vercel).
  * Backend deployed on Node.js container (e.g. Cloud Run, Render, or GCP Compute).
  * Production environment variables configured.
