# PSYCO AI — PHASE 7.6.2 OAUTH & GOOGLE CALENDAR SOURCE AUDIT
**Document ID:** `PHASE_7_6_2_OAUTH_SOURCE_AUDIT`  
**Audit Phase:** Phase 7.6.2 Implementation & Verification  
**Target Architecture:** Google OAuth 2.0 Web Server Flow & Firebase Authentication  
**Auditor:** Principal Google Workspace Integration Architect & Senior OAuth 2.0 Engineer  
**Date:** 2026-11-03  
**Status:** COMPLETE & BASELINED  

---

## 1. Executive Summary

This audit independently investigated the existing OAuth and Google integration implementations across both frontend and backend codebases. 

The audit identified two distinct, independent Google integration architectures:
1. **Integration A (Google Sign-In)**: Powered by Firebase Authentication for user identity management.
2. **Integration B (Google Calendar Authorization)**: Powered by server-side Node.js OAuth 2.0 Web Server flow for Google Calendar & Google Meet synchronization.

Historically, confusion between these two systems, misconfigured redirect URIs, testing-mode restrictions in Google Cloud Platform (GCP), and unencrypted database storage of tokens led to authorization errors (OAuth 400 `redirect_uri_mismatch`, OAuth 403 `access_denied`) and partial calendar functionality.

---

## 2. Existing OAuth Architecture & System Inventory

```
+--------------------------------------------------------------------------------------------------+
|                                    PSYCO AI AUTHENTICATION PLATFORM                             |
+--------------------------------------------------------------------------------------------------+
                                                 |
             +-----------------------------------+-----------------------------------+
             |                                                                       |
             v                                                                       v
  [ INTEGRATION A: USER AUTHENTICATION ]                          [ INTEGRATION B: CALENDAR SYNC ]
  Purpose: Application Sign-In & Identity                         Purpose: Calendar & Telehealth Sync
  Technology: Firebase Authentication Web SDK                     Technology: OAuth 2.0 Web Server Flow
  Provider: GoogleAuthProvider (popup/redirect)                   Provider: Google Calendar & Meet APIs
  Scopes: openid, email, profile                                  Scopes: calendar.events.owned
  Callback Handler:                                               Callback Handler:
    https://psyco-ai-staging.firebaseapp.com/__/auth/handler        https://psyco-ai.onrender.com/api/v1/integrations/google/callback
```

### 2.1 Inventory of Scanned Files

#### Backend
- `backend/src/routes/v1/googleCalendar.routes.js`: Route definitions for calendar status, auth-url, callback, and disconnect.
- `backend/src/controllers/googleCalendar.controller.js`: Controller mediating OAuth initiation, state tracking, and callback redirects.
- `backend/src/integrations/googleCalendar/googleCalendarAdapter.js`: Core adapter managing authorization URL creation, state signing, token exchange, token refresh, and Calendar API operations.
- `backend/src/controllers/appointment.controller.js`: Appointment lifecycle hooks triggering calendar event creation, rescheduling updates, and cancellations.
- `backend/src/utils/tokenEncryption.js`: AES-256-GCM encryption/decryption module for sensitive token payloads.
- `backend/src/config/index.js`: Configuration loader binding Google client IDs, client secrets, and redirect URIs.

#### Frontend
- `frontend/src/context/AuthContext.jsx`: Firebase Google Sign-In implementation (`signInWithPopup`).
- `frontend/src/services/firebase.js`: Firebase Web SDK initialization with `GoogleAuthProvider`.
- `frontend/src/services/googleCalendarService.js`: API client for calendar endpoints.
- `frontend/src/features/integrations/GoogleCalendarIntegrationCard.jsx`: Dedicated UI card for connection status, connect/reconnect CTA, and disconnect modal.
- `frontend/src/features/settings/SettingsPage.jsx`: Multi-tab settings interface exposing the "Calendar & Integrations" view.
- `frontend/src/components/layout/PatientLayout.jsx` & `PsychologistLayout.jsx`: Persistent portal navigation links to Calendar settings.

---

## 3. Discovered Defects & Root Cause Analysis

### 3.1 Defect 1: The Redirect URI Routing Void (`UX-01/AUTH-02`)
- **Observed Configuration**: In `backend/.env`, the redirect URI was set to:  
  `GOOGLE_REDIRECT_URI=https://psyco-ai-staging.web.app//api/v1/integrations/google/callback`
- **Root Cause**:
  1. `psyco-ai-staging.web.app` is the Firebase Hosting static bundle host.
  2. `firebase.json` specifies `"rewrites": [{ "source": "**", "destination": "/index.html" }]`.
  3. Firebase Hosting does not proxy `/api/v1/*` to the Render backend (`https://psyco-ai.onrender.com`).
  4. Consequently, when Google redirected the user's browser to `https://psyco-ai-staging.web.app/...`, Firebase Hosting returned `index.html` (the SPA), bypassing the Express backend entirely.
- **Correction**: The backend callback must target the actual Express server:  
  `https://psyco-ai.onrender.com/api/v1/integrations/google/callback`

### 3.2 Defect 2: OAuth 403 `access_denied` Testing Lockout
- **Observed Failure**: When authenticating on Google consent screen, users received `Error 403: access_denied` ("Psyco AI has not completed the Google verification process").
- **Root Cause**: The Google Cloud OAuth consent screen is configured with **User Type: External** and **Publishing Status: Testing**. In testing mode, Google strictly blocks any account not explicitly added to the **Test Users** list in Google Cloud Console.
- **Correction**: Project owner must register approved staging tester email addresses in GCP Console, and the frontend must display an informative banner regarding OAuth Testing Mode.

### 3.3 Defect 3: Unencrypted Token Storage & Leakage Risk
- **Observed Flaw**: Earlier implementations stored plaintext `refreshToken` directly in Firebase Realtime Database at `googleConnections/{uid}`.
- **Root Cause**: Lack of an encryption layer before database persistence.
- **Correction**: Implemented `tokenEncryption.js` using authenticated AES-256-GCM. Stored records use `encryptedRefreshToken` and `encryptedAccessToken` envelopes `{ ciphertext, iv, tag, version: 1 }`. Sanitized GET endpoints to ensure tokens are never returned to client browsers.

### 3.4 Defect 4: Single-Role Lockdown on Calendar Endpoints
- **Observed Flaw**: `googleCalendar.routes.js` guarded endpoints with `requireRole(ROLES.PSYCHOLOGIST)`, blocking patients from connecting their Google Calendars.
- **Correction**: Updated route guards to `requireRole(ROLES.PATIENT, ROLES.PSYCHOLOGIST)`.

---

## 4. Security Risk Assessment

| Risk Vector | Pre-Phase 7.6.2 State | Phase 7.6.2 Remediated State |
| :--- | :--- | :--- |
| **Token Theft at Rest** | Plaintext in RTDB | Authenticated AES-256-GCM envelope |
| **CSRF / Replay Attack** | Incomplete state validation | Cryptographically signed HMAC-SHA256 state with 10-min TTL & single-use RTDB ledger |
| **Scope Overreach** | Broad `calendar.events` | Minimized `calendar.events.owned` |
| **Clinical Data Leakage** | Session titles included internal IDs | Generic `Psyco AI Appointment` title, zero diagnosis or SOAP notes |
| **Token Exposure in UI** | Potential leak in status response | Strict sanitization returning boolean and timestamp metadata only |

---

## 5. Audit Conclusion

The source audit is **COMPLETE**. All architectural ambiguities between Firebase Authentication and Google Calendar OAuth have been resolved. Remediations have been codified and verified.

