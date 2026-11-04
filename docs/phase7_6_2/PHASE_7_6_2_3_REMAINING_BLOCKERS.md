# Phase 7.6.2.3: Remaining External Blockers & Promotion Readiness

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_3_REMAINING_BLOCKERS.md`  
**Classification**: Operational Readiness & Blocker Register  

---

## 1. Release Classification

**FINAL DECISION: B. CODE DEPLOYED — REAL GOOGLE AUTHORIZATION PENDING**

### Rationale
1. **Codebase Promotion Complete**: All backend and frontend changes (controller allowlisting, layout routing, token encryption reconciliation, obsolete route elimination) are committed (`0686583`), pushed to `origin/main`, deployed on Render, and deployed on Firebase Hosting.
2. **Live Routing Verified**: Live probes against Render and Firebase Hosting confirm that the application correctly intercepts OAuth callbacks, rejects `/clinical/reports`, routes to `/patient/settings` and `/psychologist/settings`, and encapsulates views in their respective authenticated portal layouts without rendering the public marketing navbar.
3. **External Authorization Gating**: Real Google authorization at `accounts.google.com` requires manual entry of tester email addresses into the Google Cloud Platform (GCP) Console by the Project Owner. In accordance with strict release audit guidelines, Classification A cannot be granted until real Google consent is completed end-to-end.

---

## 2. External GCP Console Action Required by Project Owner

To complete live end-to-end OAuth testing with real test accounts:

1. **Navigate to GCP Console**:
   - Go to: [Google Cloud Platform Console](https://console.cloud.google.com/)
   - Select project: `psyco-ai-staging` (or project containing Web OAuth Client `277075238311-rhabt2dbkp5q3tsd9hp6905op0ktli8c.apps.googleusercontent.com`).

2. **Add Approved Test Users**:
   - Open **APIs & Services > OAuth consent screen**.
   - Under **Test users**, click **+ ADD USERS**.
   - Add the specific Google email addresses intended for testing (e.g. test psychologist and test patient Gmail accounts).
   - Save changes.

3. **Verify Authorized Redirect URI**:
   - Open **APIs & Services > Credentials > OAuth 2.0 Client IDs**.
   - Select the Web client.
   - Confirm **Authorized redirect URIs** contains:
     ```text
     https://psyco-ai.onrender.com/api/v1/integrations/google/callback
     ```

---

## 3. Architecture & Operational Safeguards In Effect

- **Production Integrity**: Production Firebase project `psyco-9c13d` remains completely untouched.
- **Single-Instance Enforcement**: Render single-instance runtime remains strictly enforced to prevent distributed race conditions.
- **AI Privacy Sandbox**: Active on staging; live external LLM/transcription API transmission is disabled.
- **Text-Only Invariant**: All application state remains strictly structured text/JSON.
