# Phase 7.6.2.2: Remaining Issues & External Cloud Operator Prerequisites

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_2_REMAINING_ISSUES.md`  
**Classification**: Operational Prerequisites & External Readiness Ledger  

---

## 1. Release Classification Status

**Status: B. ROUTING FIX IMPLEMENTED — REAL GOOGLE AUTHORIZATION PENDING**

All application code, backend OAuth controllers, redirect sanitizers, layout encapsulations, frontend components, and routing trees have been implemented, hardened, and verified with zero regression failures (349/349 backend tests passing, Vite staging build successful).

Full end-to-end live testing with real Google accounts requires manual administrative configuration in the Google Cloud Platform (GCP) Console, which cannot be automated via codebase modifications.

---

## 2. External Google Cloud Platform Prerequisites

The following configuration steps must be verified by the Project Owner in the Google Cloud Console before promoting this release to the live staging environment:

### 2.1 Authorized Redirect URIs
In the GCP Console under **APIs & Services > Credentials > OAuth 2.0 Client IDs**:
- Open the Web Application client credential used for Psyco AI.
- Ensure the **Authorized redirect URIs** section contains the exact backend callback URL:
  ```text
  https://psyco-ai.onrender.com/api/v1/integrations/google/callback
  ```
  *(For local developer testing, also include `http://localhost:5000/api/v1/integrations/google/callback`)*.
- If this URI is missing or has a trailing slash discrepancy, Google will display `Error 400: redirect_uri_mismatch`.

### 2.2 OAuth Consent Screen Publishing Status & Test Users
In the GCP Console under **APIs & Services > OAuth consent screen**:
- **Publishing status**: If set to **Testing**, Google restricts authorization to registered test users only.
- **Test users list**: All Google accounts used for staging evaluation (e.g., test psychologist and patient Gmail accounts) **must be explicitly added** to the test users list.
- If an unlisted account attempts to connect, Google will return:
  ```text
  Error 403: access_denied
  The developer haven't given you access to this app during testing.
  ```

### 2.3 OAuth Scopes Configuration
Under **OAuth consent screen > Scopes**:
- Verify that the least-privilege Calendar scope is configured:
  ```text
  https://www.googleapis.com/auth/calendar.events.owned
  ```
  *(Psyco AI operates strictly on events owned by the user, avoiding invasive full-calendar access).*

---

## 3. Backend Environment Variables (Render Staging)

Verify that the following environment variables are correctly populated in the Render dashboard for `psyco-ai.onrender.com`:

| Variable Name | Required Value / Description | Sensitive |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Web Client ID from GCP Console | No |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Web Client Secret from GCP Console | **Yes** |
| `GOOGLE_REDIRECT_URI` | `https://psyco-ai.onrender.com/api/v1/integrations/google/callback` | No |
| `CALENDAR_TOKEN_ENCRYPTION_KEY` | 64-character hex string (32 bytes) for AES-256-GCM token encryption in Firebase RTDB | **Yes** |
| `FRONTEND_URL` | `https://psyco-ai-staging.web.app` | No |

---

## 4. Single-Instance Scheduling Architecture Constraint

- The single-instance restriction on Render remains strictly enforced.
- Google Calendar background synchronization and appointment webhook handlers rely on a single Node.js runtime process to prevent distributed race conditions or duplicate calendar event creation.
- Horizontal scaling on Render must remain disabled until a distributed distributed-lock coordinator (e.g. Redis Redlock) is formally adopted in a future phase.

---

## 5. Verification Checklist for Release Promotion

- [x] Server-side redirect allowlisting implemented (`resolveSafeReturnPath`).
- [x] Obsolete `/clinical/reports` references purged from codebase.
- [x] Alias redirect `<Route path="/clinical/reports" />` added for legacy bookmarks.
- [x] Portal layout encapsulation verified (Public navbar excluded from authenticated views).
- [x] Portal-specific 404 handlers nested within `PatientLayout` and `PsychologistLayout`.
- [x] Decoupled UI connection state from unverified URL parameters.
- [x] All 349 backend tests passing (including 5 new redirect security tests).
- [x] Frontend staging build cleanly compiled (`dist/` generated).
- [ ] GCP Console Authorized Redirect URI confirmed by Project Owner.
- [ ] GCP Console Test Users configured for staging testers.
- [ ] Render environment variables verified.

