# Phase 7.6.2.3: Staging Deployment & Environment Promotion Report

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Deployment Date**: 2026-11-04  
**Release Manager**: Senior Release Engineer & Render DevOps Engineer  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_3_STAGING_DEPLOYMENT_REPORT.md`  
**Classification**: Controlled Release Promotion Ledger  

---

## 1. Executive Summary

Phase 7.6.2.3 promoted the Google Calendar OAuth redirect fixes, layout isolation mechanisms, and encryption reconciliations to the live staging environment. Both backend (Render) and frontend (Firebase Hosting) were deployed via controlled promotion without touching production resources or weakening clinical security boundaries.

Live probes against `https://psyco-ai.onrender.com` and `https://psyco-ai-staging.web.app` confirm that the deployed staging system properly rejects obsolete `/clinical/reports` destinations, routes callbacks to role-specific settings inside portal layouts, and maintains single-instance backend stability.

---

## 2. Git Promotion & Source Revision

- **Repository**: `https://github.com/n1tishxydv/Psyco-ai.git`
- **Target Branch**: `main`
- **Promotion Commit SHA**: `0686583`
- **Commit Message**: `fix(integrations): correct Google Calendar OAuth callback and portal routing`
- **Scope of Promotion**:
  - Exactly 30 files staged and committed (Phase 7.6.2 and 7.6.2.2 implementation and audits).
  - Zero `.env` files, `.firebase` directories, or private keys included.
  - Zero unrelated working-copy modifications committed or removed.
- **Git Push Verification**: Pushed cleanly to `origin/main` without force flags.

---

## 3. Render Backend Deployment Verification

Render automatically deployed commit `0686583` for service `psyco-ai-api-staging`.

### 3.1 Live Health Check Probe (`GET https://psyco-ai.onrender.com/api/v1/health`)
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
rndr-id: 77e44182-8777-42e7
Server: cloudflare
x-render-origin-server: Render
```
```json
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "service": "Psyco AI API Server",
    "environment": "staging",
    "uptimeSeconds": 102,
    "storagePolicy": {
      "database": "Firebase Realtime Database (Fixed)",
      "binaryMediaAllowed": false,
      "transientAudioBuffersOnly": true,
      "persistentAudioSaved": false
    },
    "integrations": {
      "firebaseAuth": {
        "service": "Firebase Authentication",
        "configured": true,
        "status": "INITIALIZED",
        "projectId": "psyco-ai-staging"
      },
      "firebaseRtdb": {
        "service": "Firebase Realtime Database",
        "configured": true,
        "status": "CLOUD_AUTHENTICATED",
        "databaseURL": "https://psyco-ai-staging-default-rtdb.firebaseio.com",
        "alignmentValid": true
      },
      "googleCalendar": {
        "service": "Google Calendar & Meet API",
        "configured": true,
        "status": "INITIALIZED",
        "clientId": "277075238311-rha...",
        "redirectUri": "https://psyco-ai.onrender.com/api/v1/integrations/google/callback",
        "scope": "https://www.googleapis.com/auth/calendar.events.owned"
      },
      "geminiClinicalCopilot": {
        "status": "SANDBOX_MOCK_ACTIVE",
        "providerMode": "mock",
        "sandboxMode": true,
        "clinicalLiveEnabled": false
      },
      "assemblyaiTranscription": {
        "status": "SANDBOX_MOCK_ACTIVE",
        "liveEnabled": false,
        "sandboxMode": true
      }
    }
  }
}
```

### 3.2 Invariant Verification on Render
- **Database Target**: `psyco-ai-staging-default-rtdb.firebaseio.com` (Production `psyco-9c13d` remains untouched).
- **Single-Instance Restriction**: Maintained single Node.js runtime process (`pid: 86`), zero horizontal scaling.
- **AI Privacy Sandbox**: Active (`SANDBOX_MOCK_ACTIVE`); live external transmission blocked.
- **Callback URI Normalization**: `redirectUri` resolves cleanly to `https://psyco-ai.onrender.com/api/v1/integrations/google/callback`.

---

## 4. Firebase Hosting Deployment Verification

Frontend assets were built with Vite v6.4.5 in staging mode and deployed to project `psyco-ai-staging`.

```bash
firebase deploy --only hosting --project psyco-ai-staging
```
- **Deployment Status**: `+ Deploy complete!`
- **Hosting URL**: `https://psyco-ai-staging.web.app`
- **Deployed Asset Hash Verification**:
  - Script: `/assets/index-KuIQ_w1D.js` (matches local `dist/`)
  - Stylesheet: `/assets/index-MGkt_Fgu.css` (matches local `dist/`)
- **Hosting Redirect Rule (`firebase.json`)**:
  - Probe: `GET https://psyco-ai-staging.web.app/api/v1/integrations/google/callback`
  - Result: `HTTP/1.1 302 Found` -> `Location: https://psyco-ai.onrender.com/api/v1/integrations/google/callback`
  - Guarantees any inadvertent request targeting the frontend domain is immediately forwarded to the backend OAuth handler.

---

## 5. Token Encryption Variable Reconciliation

### 5.1 Architecture Decoupling
- **Canonical Variable**: `TOKEN_ENCRYPTION_KEY`
- **Supported Alias**: `CALENDAR_TOKEN_ENCRYPTION_KEY`
- **Key Derivation**: Deterministic 32-byte SHA-256 digest of dedicated key.
- **Fail-Safe Mechanism**:
  - In `staging` and `production`, encryption of new tokens strictly requires `TOKEN_ENCRYPTION_KEY` or `CALENDAR_TOKEN_ENCRYPTION_KEY`. Silent fallback to `JWT_SECRET` or `SESSION_SECRET` is blocked.
  - In `development` and `test`, deterministic local test keys are provided.
- **Backward-Compatible Multi-Key Candidate Resolution**:
  - On decryption, `tokenEncryption.js` evaluates candidate keys (primary key -> alias key -> legacy key) sequentially.
  - Ensures existing stored tokens remain decryptable across deployments and key updates.
