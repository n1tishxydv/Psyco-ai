# PSYCO AI — ZERO-BILLING STAGING DEPLOYMENT PREPARATION
## Firebase Hosting (Spark Free Tier) & Render (Free Web Service)

**Document Version:** 1.0  
**Target Environment:** Staging (`psyco-ai-staging`)  
**Deployment Model:** Zero Google Cloud Billing Required  
**Frontend Platform:** Firebase Hosting (Spark No-Cost Plan)  
**Backend Platform:** Render Free Web Service  
**Persistence Engine:** Firebase Realtime Database (`https://psyco-ai-staging-default-rtdb.firebaseio.com`)  
**Production Isolation Status:** **ENFORCED** (Production `psyco-9c13d` completely untouched)  

---

## 1. Executive Summary

This document details the configuration, preparation, and operational runbook for deploying the Psyco AI application online with zero Google Cloud billing overhead. 

The architecture pairs **Firebase Hosting** on the no-cost Spark plan with **Render's Free Web Service** for the Express backend, backed by the dedicated **Firebase Realtime Database** on project `psyco-ai-staging`. All application security mechanisms, clinical privacy barriers, and the 131-test automated suite remain 100% operational.

---

## 2. Infrastructure Architecture Overview

```
                                      +---------------------------------------------+
                                      |              CLINICAL USERS                 |
                                      |   (Patients, Psychologists, Administrators) |
                                      +---------------------------------------------+
                                                             |
                                                             | HTTPS
                                                             v
+-------------------------------------------------------------------------------------------------------------------+
| FRONTEND: FIREBASE HOSTING (Spark Plan - No Cost)                                                                 |
| Domain: https://psyco-ai-staging.web.app (or https://psyco-ai-staging.firebaseapp.com)                            |
| Static Assets: React 18, Vite 6, Tailwind CSS (frontend/dist)                                                     |
| SPA Routing: Single-Page Application rewrite (/** -> /index.html)                                                 |
| API Integration: apiClient.js calls Render backend endpoint with VITE_API_BASE_URL (no silent localhost fallback)   |
+-------------------------------------------------------------------------------------------------------------------+
                                                             |
                                                             | HTTPS REST Calls (/api/v1)
                                                             v
+-------------------------------------------------------------------------------------------------------------------+
| BACKEND: RENDER FREE WEB SERVICE (No Cost)                                                                        |
| Service Name: psyco-ai-api-staging                                                                                |
| Runtime: Node.js 20+ (ES Modules)                                                                                 |
| Endpoint: https://psyco-ai-api-staging.onrender.com                                                               |
| Root Dir: backend/ | Build: npm ci | Start: npm start                                                             |
| Listening: process.env.PORT on 0.0.0.0 (Port 5000 fallback locally)                                               |
| Security: Strict CORS allowlist matching Firebase Hosting origin + Auth headers                                   |
+-------------------------------------------------------------------------------------------------------------------+
                                 |                                                  |
                                 | OAuth2 Bearer (Service Account)                  | Outbound APIs
                                 v                                                  v
+---------------------------------------------------------+   +-----------------------------------------------------+
| PERSISTENCE: FIREBASE REALTIME DATABASE                 |   | THIRD-PARTY CLINICAL ENGINES                        |
| Target: https://psyco-ai-staging-default-rtdb.firebaseio.com|   | Google Gemini AI: Structured documentation drafts   |
| Project: psyco-ai-staging (Dedicated Staging)           |   | AssemblyAI v3: Ambient consultation transcription   |
| Storage Policy: Structured Text-Only JSON (No Media)    |   | Google Calendar & Meet: Video consultation rooms    |
+---------------------------------------------------------+   +-----------------------------------------------------+
```

---

## 3. Inventory of Modified Files

| File Path | Description of Changes |
|---|---|
| [`firebase.json`](file:///./firebase.json) | Added `hosting` configuration pointing to `frontend/dist` with SPA rewrite rule (`/** -> /index.html`), while preserving existing Realtime Database rules. |
| [`render.yaml`](file:///./render.yaml) | Created root-level Render Blueprint for `psyco-ai-api-staging` free web service with non-sensitive defaults and `sync: false` for secrets. |
| [`backend/src/server.js`](file:///./backend/src/server.js) | Explicitly bound Express server to host `'0.0.0.0'` on `config.port` to ensure proper container networking on Render. |
| [`backend/src/config/index.js`](file:///./backend/src/config/index.js) | Added explicit `allowedOrigins` allowlist parsing `FRONTEND_URL` and `ADDITIONAL_ALLOWED_ORIGINS` to eliminate unrestricted non-production CORS. |
| [`backend/src/app.js`](file:///./backend/src/app.js) | Enforced explicit origin allowlist in CORS middleware, rejecting unauthorized origins while supporting health checks and server-to-server calls. |
| [`frontend/src/services/apiClient.js`](file:///./frontend/src/services/apiClient.js) | Updated `getApiBaseUrl()` to prohibit silent localhost fallback in deployed/production builds, throwing an explicit configuration error if unconfigured. |
| [`backend/.env.staging.example`](file:///./backend/.env.staging.example) | Corrected project identifier to `psyco-ai-staging` and staging database URL `https://psyco-ai-staging-default-rtdb.firebaseio.com`. |
| [`frontend/.env.staging.example`](file:///./frontend/.env.staging.example) | Corrected staging project credentials and updated `VITE_API_BASE_URL` to reference the Render service endpoint. |

---

## 4. Actual Staging Firebase Configuration

* **Firebase Project ID:** `psyco-ai-staging`
* **Realtime Database Instance URL:** `https://psyco-ai-staging-default-rtdb.firebaseio.com`
* **Database Rules Path:** [`database.rules.json`](file:///./database.rules.json)
* **Authorized Hosting Hostnames:**
  * `psyco-ai-staging.web.app`
  * `psyco-ai-staging.firebaseapp.com`

---

## 5. Render Web Service Settings

| Setting | Value |
|---|---|
| **Service Type** | Web Service |
| **Name** | `psyco-ai-api-staging` |
| **Environment / Runtime** | `Node` |
| **Region** | `Oregon (US West)` or `Ohio (US East)` (Select closest free-tier region) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `npm ci` |
| **Start Command** | `npm start` |
| **Instance Type / Plan** | `Free` ($0/month) |
| **Health Check Path** | `/api/v1/health` |
| **Auto-Deploy** | `Yes` (Triggered on git push to main) |

---

## 6. Required Render Environment Variables (By Name Only)

Configure these variables in the **Render Dashboard -> Services -> psyco-ai-api-staging -> Environment**:

### 6.1 Server Runtime Settings
* `NODE_ENV`: `staging`
* `API_PREFIX`: `/api/v1`
* `DEFAULT_TIMEZONE`: `Asia/Kolkata`
* `DEFAULT_SESSION_DURATION_MINUTES`: `50`
* `DEFAULT_BUFFER_TIME_MINUTES`: `10`
* `FRONTEND_URL`: `https://psyco-ai-staging.web.app,https://psyco-ai-staging.firebaseapp.com`

### 6.2 Firebase Staging Authentication & Database
* `FIREBASE_PROJECT_ID`: `psyco-ai-staging`
* `FIREBASE_DATABASE_URL`: `https://psyco-ai-staging-default-rtdb.firebaseio.com`
* `FIREBASE_API_KEY`: *(Staging Web API Key from Firebase Console)*
* `FIREBASE_CLIENT_EMAIL`: `firebase-adminsdk-staging@psyco-ai-staging.iam.gserviceaccount.com` (or staging service account)
* `FIREBASE_PRIVATE_KEY`: *(RSA Private Key in PEM format with escaped `\n` characters)*

### 6.3 External AI & Telehealth Integrations
* `GOOGLE_CALENDAR_API_KEY`: *(Staging Google API key)*
* `GOOGLE_CLIENT_ID`: *(OAuth 2.0 Web Client ID)*
* `GOOGLE_CLIENT_SECRET`: *(OAuth 2.0 Client Secret)*
* `GOOGLE_REDIRECT_URI`: `https://psyco-ai-api-staging.onrender.com/api/v1/integrations/google/callback`
* `GEMINI_API_KEY`: *(Google AI Studio Gemini API Key)*
* `GEMINI_MODEL`: `gemini-2.5-flash` (or `gemini-flash-lite-latest`)
* `ASSEMBLYAI_API_KEY`: *(AssemblyAI API Key)*

> [!CAUTION]
> Never commit actual values for these variables to Git. Configure them exclusively in the protected Render dashboard.

---

## 7. CORS Configuration Details

* **Previous Behavior:** Allowed all browser origins whenever `NODE_ENV !== 'production'`.
* **New Secure Staging Allowlist:**
  * `http://localhost:5173` (Local Vite dev)
  * `http://localhost:3000` (Alternative local dev)
  * `http://127.0.0.1:5173`
  * `http://127.0.0.1:3000`
  * `https://psyco-ai-staging.web.app` (Firebase Hosting)
  * `https://psyco-ai-staging.firebaseapp.com` (Firebase Hosting alternate)
  * Any custom domains configured via `FRONTEND_URL` or `ADDITIONAL_ALLOWED_ORIGINS`
* **Non-Browser Invariant:** Requests with no `Origin` header (such as curl, mobile clients, and uptime health check probes hitting `/api/v1/health`) are explicitly permitted.
* **Credentials:** `credentials: true` enabled for authorized cookie and header handling.

---

## 8. Background AI Worker on Render Free Tier

* **Architecture:** In [`backend/src/server.js`](file:///./backend/src/server.js), `startWorker()` initializes the background queue reconciliation engine within the Express process.
* **Render Free Plan Lifecycle:**
  * Render free services automatically spin down (sleep) after **15 minutes of inactivity** (zero incoming HTTP requests).
  * While sleeping, container execution is paused and CPU consumption is zero.
  * When an incoming HTTP request arrives, Render automatically wakes the instance (cold start typically takes **30–50 seconds**).
* **Impact on Background AI Jobs:**
  * If a clinical documentation generation job is enqueued immediately before the instance sleeps, processing will pause.
  * As soon as an incoming request wakes the instance, the worker's 5-second crash-reconciliation loop automatically claims and resumes uncompleted jobs.
* **Zero-Cost Mitigation:** No separate paid background worker or always-on instance is required. For staging evaluation, keeping the web service active during consultation sessions or pinging `/api/v1/health` is sufficient.

---

## 9. Verification & Test Results

* **Backend Test Suite:** **131/131 PASSED (100%)** (`node --test src/tests/*.test.js`, execution duration: 3.48s).
* **Frontend Production Build:** **SUCCESS** (`vite build --mode staging`, build duration: 5.28s).
* **Git Whitespace & Syntax Check:** `git diff --check` executed with zero errors.
* **Production Protection:** Verified that the staging seeder aborts immediately if pointed to production database `psyco-9c13d`.

---

## 10. Step-by-Step Deployment Runbook

### Step 1: Deploy Backend to Render

1. Log into your Render account at [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/n1tishxydv/Psyco-ai`.
4. Configure the service settings:
   * **Name:** `psyco-ai-api-staging`
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm ci`
   * **Start Command:** `npm start`
   * **Plan:** `Free`
   * **Health Check Path:** `/api/v1/health`
5. Click **Advanced** -> **Add Environment Variable** and enter the variables listed in Section 6.
6. Click **Create Web Service**.
7. Once deployment finishes, copy your assigned Render service URL (e.g., `https://psyco-ai-api-staging.onrender.com`).
8. Verify health endpoint in your browser:
   `https://psyco-ai-api-staging.onrender.com/api/v1/health`

---

### Step 2: Build & Deploy Frontend to Firebase Hosting

1. Update your local `frontend/.env.staging` file with your actual Render service URL:
   ```dotenv
   VITE_API_BASE_URL=https://psyco-ai-api-staging.onrender.com/api/v1
   ```
2. Compile the production staging bundle:
   ```bash
   npm --prefix frontend run build -- --mode staging
   ```
3. Deploy strictly Firebase Hosting to project `psyco-ai-staging`:
   ```bash
   firebase deploy --only hosting --project psyco-ai-staging
   ```
4. Firebase Hosting will output your live URL:
   `https://psyco-ai-staging.web.app`

---

### Step 3: Configure Google OAuth Callback in GCP Console

1. Navigate to Google Cloud Console -> **APIs & Services** -> **Credentials** for project `psyco-ai-staging`.
2. Locate the OAuth 2.0 Client ID used for Google Calendar.
3. Under **Authorized redirect URIs**, add your live Render callback:
   `https://psyco-ai-api-staging.onrender.com/api/v1/integrations/google/callback`
4. Under **Authorized JavaScript origins**, add your Firebase Hosting domains:
   * `https://psyco-ai-staging.web.app`
   * `https://psyco-ai-staging.firebaseapp.com`
5. Save changes.

---

## 11. Rollback Runbook

* **Frontend Rollback:** In the Firebase Console -> **Hosting** -> Release History, click the three dots next to any previous release and select **Rollback**.
* **Backend Rollback:** In the Render Dashboard -> `psyco-ai-api-staging` -> **Deploys**, click on any previous successful build and select **Rollback to this deploy**.
