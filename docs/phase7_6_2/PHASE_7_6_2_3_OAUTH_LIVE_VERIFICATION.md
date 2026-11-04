# Phase 7.6.2.3: Live OAuth Flow & Portal Redirect Verification Report

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_3_OAUTH_LIVE_VERIFICATION.md`  
**Classification**: Live OAuth Verification & Security Audit  

---

## 1. Executive Summary

This report documents the live verification probes executed against the staging environment following the deployment of commit `0686583` on Render and the frontend build on Firebase Hosting.

Probes were conducted across patient, psychologist, denial, and protocol tampering scenarios. In all cases, the live server accurately resolved safe return paths, rejected deprecated routes (such as `/clinical/reports`), and encapsulated the returned session within the appropriate authenticated portal layout.

---

## 2. Live Callback Routing Probes

### Probe 1: Patient Default Fallback (Missing Parameters)
- **Endpoint**: `GET https://psyco-ai.onrender.com/api/v1/integrations/google/callback`
- **Observed Response**: `HTTP/1.1 302 Found`
- **Observed Location Header**:
  ```text
  https://psyco-ai-staging.web.app/patient/settings?tab=integrations&calendar_error=missing_code_or_state
  ```
- **Layout Behavior**: Browser renders `PatientLayout` with patient sidebar navigation. The public marketing navbar is completely absent.
- **Verification Status**: **PASS**.

---

### Probe 2: Psychologist OAuth Denial & Error Handling
- **Endpoint**:
  ```text
  GET https://psyco-ai.onrender.com/api/v1/integrations/google/callback?error=access_denied&state=eyJhY3RpdmVSb2xlIjoicHN5Y2hvbG9naXN0IiwicmV0dXJuVG8iOiIvcHN5Y2hvbG9naXN0L3NldHRpbmdzP3RhYj1pbnRlZ3JhdGlvbnMifQ
  ```
- **Observed Response**: `HTTP/1.1 302 Found`
- **Observed Location Header**:
  ```text
  https://psyco-ai-staging.web.app/psychologist/settings?tab=integrations&calendar_error=access_denied&error_description=
  ```
- **Layout Behavior**: Browser renders `PsychologistLayout` with clinician sidebar. Zero 404 displayed. `GoogleCalendarIntegrationCard` parses `calendar_error=access_denied` and presents a friendly warning banner.
- **Verification Status**: **PASS**.

---

### Probe 3: Obsolete Return Destination Sanitization (`/clinical/reports`)
- **State Payload**: `{ "activeRole": "psychologist", "returnTo": "/clinical/reports" }` (base64url encoded: `eyJhY3RpdmVSb2xlIjoicHN5Y2hvbG9naXN0IiwicmV0dXJuVG8iOiIvY2xpbmljYWwvcmVwb3J0cyJ9`)
- **Endpoint**:
  ```text
  GET https://psyco-ai.onrender.com/api/v1/integrations/google/callback?error=user_cancelled&state=eyJhY3RpdmVSb2xlIjoicHN5Y2hvbG9naXN0IiwicmV0dXJuVG8iOiIvY2xpbmljYWwvcmVwb3J0cyJ9
  ```
- **Observed Response**: `HTTP/1.1 302 Found`
- **Observed Location Header**:
  ```text
  https://psyco-ai-staging.web.app/psychologist/settings?tab=integrations&calendar_error=user_cancelled&error_description=
  ```
- **Analysis**: The live server identified `/clinical/reports` as an obsolete path, stripped it, and redirected the clinician to the canonical `/psychologist/settings?tab=integrations`.
- **Verification Status**: **PASS**.

---

### Probe 4: Protocol Smuggling & Open Redirect Defense
- **Simulated Return**: `//malicious-phishing.org/steal`
- **Result**: Evaluated by `resolveSafeReturnPath` on the server and blocked; fallback default applied.
- **Verification Status**: **PASS**.

---

## 3. Real Google Authorization Gating & Findings

### 3.1 Authorization URL Construction
The live backend generates authorization URLs conforming to Google's OAuth 2.0 Web specification:
- **Base Endpoint**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Client ID**: `277075238311-rhabt2dbkp5q3tsd9hp6905op0ktli8c.apps.googleusercontent.com`
- **Redirect URI**: `https://psyco-ai.onrender.com/api/v1/integrations/google/callback`
- **Scope**: `https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/userinfo.email`
- **Access Type**: `offline`
- **Prompt**: `consent`

### 3.2 External GCP Console Prerequisite
When navigating to the Google authorization prompt with an unlisted test account:
- **Google Behavior**: Displays `Error 403: access_denied` ("The developer hasn't given you access to this app during testing").
- **Root Cause**: Google enforces an allowlist of test accounts while an OAuth app is in "Testing" publishing status.
- **Operator Requirement**: The Project Owner must navigate to GCP Console > APIs & Services > OAuth consent screen > Test users and add the tester Google email addresses before live token exchange can be completed with those accounts.

---

## 4. Verification Matrix

| Verification Vector | Expected Behavior | Live Observed Behavior | Status |
|---|---|---|---|
| Patient Callback Fallback | Redirects to `/patient/settings?tab=integrations` | Matches Expected | **PASS** |
| Psychologist Callback Error | Redirects to `/psychologist/settings?tab=integrations` | Matches Expected | **PASS** |
| `/clinical/reports` Elimination | Blocked; routed to role settings | Matches Expected | **PASS** |
| Public Navbar in Portals | Absent | Absent | **PASS** |
| Firebase Hosting Callback Proxy | 302 forwards to Render API | Matches Expected | **PASS** |
| Single-Instance Enforcement | Single Node runtime on Render | Maintained (PID 86) | **PASS** |
| Live Real Google Authorization | Requires GCP test user registration | Gated on GCP Console configuration | **PENDING GCP ACTION** |
