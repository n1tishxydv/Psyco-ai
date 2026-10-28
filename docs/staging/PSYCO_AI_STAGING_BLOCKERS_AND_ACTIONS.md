# PSYCO AI — STAGING BLOCKERS & ACTIONABLE REMEDIATION ROADMAP

**Report Document:** Report C  
**Location:** `docs/staging/PSYCO_AI_STAGING_BLOCKERS_AND_ACTIONS.md`  
**Date:** October 28, 2026  
**Auditor:** Senior Full-Stack Engineer, Firebase Architect & Application Security Specialist  
**Product:** Psyco AI Practice Management Platform  
**Target Assessment:** Actionable Prerequisites for Controlled Staging Deployment & Production Readiness  

---

## 1. Executive Blockers Summary

The core application code, database adapters, REST endpoints, ReBAC authorization, clinical safety gates, and AI clinical copilot are **functionally complete and verified**.

However, before deploying to an external staging host or executing multi-user external acceptance testing, the following external and architectural prerequisites must be completed:

| Blocker ID | Category | Severity | Description | Action Required By |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-STG-01** | Database Isolation | **CRITICAL** | A dedicated staging Firebase RTDB instance must be configured to prevent staging tests from writing to the primary database. | Firebase Project Owner |
| **BLK-AUTH-01**| OAuth Consent | **HIGH** | Google OAuth Consent Screen is in "Testing" mode, blocking non-registered Google accounts with 403 `access_denied`. | Google Cloud Admin |
| **BLK-CAL-01** | Calendar OAuth | **MEDIUM** | Clinician Google Calendar integration requires completing the one-time interactive OAuth consent flow for `calendar.events`. | Clinician / Operator |
| **BLK-HOST-01**| Cloud Hosting | **MEDIUM** | A dedicated staging hosting target (Firebase Hosting or Cloud Run) must be declared in configuration. | DevOps / Operator |
| **BLK-PERF-01**| Bundle Splitting | **LOW** | Vite monolithic bundle warning (1,154 kB) should be split via `manualChunks` prior to public release. | Engineering |

---

## 2. Step-by-Step Operator Action Guides

### Action Guide 1: Establish an Isolated Staging Firebase RTDB Instance (`BLK-STG-01`)
To ensure complete isolation between staging tests and production records:

1. **Open Firebase Console:** Navigate to [Firebase Console — Realtime Database](https://console.firebase.google.com/project/psyco-9c13d/database).
2. **Create a Secondary Database Instance:**
   * In the top-left dropdown of the Realtime Database panel (next to your database name), click **Create Database** (or Manage databases).
   * Name the instance: `psyco-9c13d-staging`.
   * Location: Select the same regional location (e.g., `us-central1` or `asia-southeast1`).
3. **Deploy Security Rules to Staging Instance:**
   * In the `psyco-9c13d-staging` database, navigate to the **Rules** tab.
   * Paste the contents of `database.rules.json` and click **Publish**.
4. **Update Staging Environment Variables:**
   * In your staging environment configuration (e.g. `backend/.env.staging` or hosting secrets), update:
     ```env
     FIREBASE_DATABASE_URL=https://psyco-9c13d-staging.firebaseio.com
     ```
   * This guarantees that staging synthetic records will never touch the primary database.

---

### Action Guide 2: Unblock Google Sign-In via OAuth Console (`BLK-AUTH-01`)
To allow external Google accounts to authenticate via the "Continue with Google" popup:

1. **Open Google Cloud Console:** Navigate to [Google Cloud Console — OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent) for project `psyco-9c13d` (or Client ID project `143160785926`).
2. **Locate Test Users Section:**
   * Scroll down to **Audience** / **Test users**.
   * Click **+ ADD USERS**.
3. **Add Authorized Tester Emails:**
   * Enter the email addresses intended for testing (e.g. `admin.staging@psyco.clinic`, `nitish25csu169@ncuindia.edu`, and QA testers).
   * Click **SAVE**.
4. **Authorize Staging Domain:**
   * Under **Authorized domains**, ensure your staging domain (e.g. `psyco-staging.web.app` or `firebaseapp.com`) is listed.
   * Save changes.
5. **Verification Test:**
   * Navigate to `http://localhost:5173/login` (or staging URL), click **Continue with Google**, and verify that the account signs in and redirects to the appropriate dashboard without error `403: access_denied`.

---

### Action Guide 3: Complete Clinician Google Calendar Authorization (`BLK-CAL-01`)
To enable automated Google Meet link generation and calendar event synchronization:

1. **Verify Redirect URI:**
   * In Google Cloud Console > **APIs & Services > Credentials**, find OAuth 2.0 Client ID `143160785926-q6ntk5o3qu7bdc916ke9rc7ool6fr5nk.apps.googleusercontent.com`.
   * Under **Authorized redirect URIs**, confirm:
     * `http://localhost:5000/api/v1/integrations/google/callback` (for local development)
     * `https://<staging-api-domain>/api/v1/integrations/google/callback` (for staging environment)
2. **Execute Interactive Clinician Consent:**
   * Log in to Psyco AI as an approved psychologist (`elena.vance@psyco.clinic` or `nitish25csu169@ncuindia.edu`).
   * Navigate to `/settings` or `/psychologist/calendar`.
   * Click **Connect Google Calendar**.
   * In the Google consent popup, select the clinician Google account and click **Allow** for `View and edit events on all your calendars`.
3. **Verify Stored Tokens:**
   * The backend will automatically capture the authorization code, exchange it for tokens, and persist `{ accessToken, refreshToken, expiresAt, scope }` under `googleConnections/${uid}` in RTDB.
4. **Test Live Event Creation:**
   * Book an online appointment; verify that Google Calendar receives the event and returns a valid Google Meet video link (`meet.google.com/abc-mnop-xyz`).

---

### Action Guide 4: Provision Staging Hosting (`BLK-HOST-01`)
To deploy Psyco AI to an external staging host over HTTPS:

#### Option A: Firebase Hosting (Recommended for Frontend)
1. Add hosting target in `firebase.json`:
   ```json
   {
     "database": {
       "rules": "database.rules.json"
     },
     "hosting": {
       "target": "staging",
       "public": "frontend/dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```
2. Set up staging target:
   ```bash
   firebase target:apply hosting staging psyco-staging
   firebase deploy --only hosting:staging
   ```

#### Option B: Containerized Backend (Google Cloud Run or Render)
1. Create a production/staging `Dockerfile` in `backend/`:
   ```dockerfile
   FROM node:24-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY src/ ./src/
   EXPOSE 5000
   CMD ["node", "src/server.js"]
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy psyco-backend-staging \
     --source backend \
     --region asia-south1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=staging,FRONTEND_URL=https://psyco-staging.web.app
   ```

---

### Action Guide 5: Configure Vite Bundle Splitting (`BLK-PERF-01`)
To optimize frontend loading speed and eliminate the 1,154 kB monolithic chunk warning:

1. Update `frontend/vite.config.js`:
   ```javascript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     server: {
       port: 5173,
       strictPort: true,
     },
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
     },
   });
   ```
2. Re-run `npm run build` in `frontend/` to confirm chunk sizes drop below 400 kB.

---

## 3. Tasks Required Before Production-Readiness Assessment

1. **Multi-User User Acceptance Testing (UAT):** Conduct live test consultations between synthetic clinicians and patients over external HTTPS connections.
2. **Automated End-to-End Cypress / Playwright Smoke Suite:** Execute headless browser automation verifying registration, appointment booking, and SOAP note generation on each release.
3. **Third-Party Security Penetration Review:** Commission independent verification of HIPAA compliance and ReBAC privacy barrier validation.
4. **Google App Verification:** Transition OAuth consent screen from "Testing" to "In Production" to allow unhindered public patient sign-ins.
