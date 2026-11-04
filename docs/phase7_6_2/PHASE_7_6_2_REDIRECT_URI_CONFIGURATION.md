# PSYCO AI — PHASE 7.6.2 OAUTH REDIRECT URI CONFIGURATION AUDIT
**Document ID:** `PHASE_7_6_2_REDIRECT_URI_CONFIGURATION`  
**Audit Phase:** Phase 7.6.2 Implementation & Verification  
**Target:** OAuth 2.0 Web Client Credentials, Firebase Hosting & Express Callback Routing  
**Auditor:** Principal Google Workspace Integration Architect & Release Manager  
**Date:** 2026-11-03  
**Status:** VERIFIED & DOCUMENTED  

---

## 1. Executive Summary

During testing of the Google Calendar OAuth connection, users experienced redirect failures and routing voids. This document details the forensic investigation into why the previously configured callback failed, identifies the authoritative callback endpoint, and specifies the exact configuration required in the Google Cloud Console.

---

## 2. Forensic Analysis of the Callback Routing Void

### 2.1 The Misconfigured Redirect URI
The application environment previously specified:
```text
GOOGLE_REDIRECT_URI=https://psyco-ai-staging.web.app//api/v1/integrations/google/callback
```
*(Notice the protocol domain `web.app` and the malformed double slash `//`)*.

### 2.2 Inspection of Firebase Hosting Rewrites (`firebase.json`)
```json
{
  "hosting": {
    "public": "frontend/dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
1. Firebase Hosting only acts as a static CDN for the compiled Vite React frontend (`frontend/dist`).
2. There are no Cloud Functions or Cloud Run proxies mapping `/api/**` to Render.
3. Therefore, any HTTP GET request to `https://psyco-ai-staging.web.app/api/v1/integrations/google/callback?code=...` serves `index.html` (the client-side single page app).
4. The React Router in `frontend/src/routes/index.jsx` does not recognize `/api/v1/integrations/google/callback`, causing a client-side 404 or redirecting the user to home/login.
5. The backend Express application on Render **never receives the authorization code**, and the token exchange never occurs.

### 2.3 The Authoritative Backend Architecture
The Psyco AI Express backend is deployed as a single-instance web service on Render at:
```text
https://psyco-ai.onrender.com
```
In `backend/src/routes/index.js`, the router mounts:
```javascript
router.use('/integrations/google', googleCalendarRoutes);
```
In `backend/src/routes/v1/googleCalendar.routes.js`, the route is defined as:
```javascript
router.get('/callback', handleOAuthCallback);
```
Thus, the authoritative, direct server-side callback endpoint is:
```text
https://psyco-ai.onrender.com/api/v1/integrations/google/callback
```

---

## 3. Comparison Matrix: Existing vs. Corrected Values

| Configuration Parameter | Previous (Defective) Value | Corrected (Authoritative) Value | Routing Nature |
| :--- | :--- | :--- | :--- |
| **Backend Environment (`GOOGLE_REDIRECT_URI`)** | `https://psyco-ai-staging.web.app//api/v1/integrations/google/callback` | `https://psyco-ai.onrender.com/api/v1/integrations/google/callback` | Server-Side Express Handler |
| **Local Development Redirect URI** | `http://localhost:5000/api/v1/integrations/google/callback` | `http://localhost:5000/api/v1/integrations/google/callback` | Local Express Handler |
| **GCP Authorized Redirect URI** | Missing or misconfigured | `https://psyco-ai.onrender.com/api/v1/integrations/google/callback` | Registered in GCP Client ID |
| **GCP Authorized JavaScript Origin** | `https://psyco-ai-staging.web.app` | `https://psyco-ai-staging.web.app` | Frontend Browser Origin |
| **Firebase Auth Handler (Separate)** | Confused with Calendar callback | `https://psyco-ai-staging.firebaseapp.com/__/auth/handler` | Handled by Firebase SDK |

---

## 4. Step-by-Step Operator Configuration Guide (Google Cloud Console)

To resolve OAuth redirect errors for Google Calendar, the Google Cloud Project Owner must execute these steps:

### Step 1: Open Google Cloud Console
1. Navigate to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select the GCP project housing OAuth Client ID:  
   `277075238311-rhabt2dbkp5q3tsd9hp6905op0ktli8c.apps.googleusercontent.com`

### Step 2: Edit the Web Client ID
1. Under **OAuth 2.0 Client IDs**, select the client corresponding to the Calendar integration.
2. In the **Authorized JavaScript origins** section, verify and ensure these exact origins exist:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `https://psyco-ai-staging.web.app`
   - `https://psyco-ai-staging.firebaseapp.com`

### Step 3: Register Authorized Redirect URIs
In the **Authorized redirect URIs** section, add the following exact endpoints:
- `http://localhost:5000/api/v1/integrations/google/callback` *(Local backend)*
- `https://psyco-ai.onrender.com/api/v1/integrations/google/callback` *(Staging backend)*

*(Do not include trailing slashes or double slashes).*

### Step 4: Update Render Environment Variables
In the Render Dashboard for the backend service (`psyco-ai`):
1. Navigate to **Environment**.
2. Set `GOOGLE_REDIRECT_URI`:
   ```text
   GOOGLE_REDIRECT_URI=https://psyco-ai.onrender.com/api/v1/integrations/google/callback
   ```
3. Save changes (Render will trigger a zero-downtime redeploy of the single-instance backend).

---

## 5. Summary & Verification

When Google responds to the authorization request:
1. Google redirects the user's browser to `https://psyco-ai.onrender.com/api/v1/integrations/google/callback?code=...&state=...`.
2. The Express server validates the cryptographic state, completes the token exchange, encrypts the credentials, and updates connection metadata.
3. The server issues an HTTP 302 redirect back to the frontend:
   `https://psyco-ai-staging.web.app/settings?tab=integrations&calendar_connected=true`
4. The user arrives in their portal with active synchronization confirmed.

