# Phase 7.6.3: Google Calendar Integration & OAuth Audit

**Project**: Psyco AI — Mental Health Practice Management Platform
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)
**Audit Date**: 2026-11-04
**Auditor**: Senior OAuth 2.0 Engineer & Healthcare SaaS Privacy Auditor
**Document Reference**: `docs/phase7_6_3/PHASE_7_6_3_GOOGLE_CALENDAR_AUDIT.md`
**Classification**: OAuth 2.0 Security & Calendar Integration Matrix

---

## 1. Executive Summary

This audit assesses the Google Calendar OAuth 2.0 integration, token encryption security, callback routing, and appointment synchronization architecture.

The server-side allowlist (`resolveSafeReturnPath`) implemented in Phase 7.6.2.2 guarantees that OAuth callbacks return clinicians to `/psychologist/settings?tab=integrations` and patients to `/patient/settings?tab=integrations`, permanently eliminating the legacy `/clinical/reports` 404 defect.

---

## 2. OAuth Security & Architectural Findings

### 2.1 State Nonce & Replay Defense
- `generateAuthUrl` constructs an encrypted state envelope bound to the initiating user's UID and role, with a 10-minute expiry window.
- State records are stored in Firebase RTDB at `googleOAuthStates/{nonce}` and marked `used: true` upon first consumption. Replay attempts return `OAuth state has already been used`.

### 2.2 Callback Routing & Destination Whitelist
- Endpoint: `GET /api/v1/integrations/google/callback` on Render (`https://psyco-ai.onrender.com`).
- Destination Sanitization: `resolveSafeReturnPath(requestedPath, role)` rejects protocol smuggling (`//evil.com`, `https://...`) and obsolete paths (`/reports`, `/clinical/reports`).
- URL Hygiene: Successful connection redirects with `&calendar_connected=true`; `GoogleCalendarIntegrationCard` parses the flag, triggers a background status refresh, and immediately purges the query string from browser history.

### 2.3 Token Encryption at Rest
- Tokens stored at `googleCalendarConnections/{uid}` inside an opaque AES-256-GCM envelope (`ciphertext`, `iv`, `tag`, `version: 1`).
- Key reconciliation: Canonical `TOKEN_ENCRYPTION_KEY` enforced. Silent JWT fallback blocked in staging and production. Multi-key candidate resolution guarantees existing tokens remain decryptable.

### 2.4 Calendar Event Privacy
- Events generated for Google Calendar contain only generic non-clinical summaries (`Consultation — Psyco AI`).
- Zero patient diagnosis codes, intake responses, clinical session notes, session PINs, or meeting credentials are transmitted to Google APIs.

### 2.5 Real Google Authorization Gating
- Live token exchange with external Google accounts is currently gated on the Project Owner adding approved test Gmail addresses to **OAuth consent screen > Test users** in the Google Cloud Platform Console.
- Status: **CODE DEPLOYED & ROUTING VERIFIED — REAL GOOGLE AUTHORIZATION PENDING GCP ACTION**.
