# PSYCO AI — PHASE 7.6.2 REMAINING ISSUES & EXTERNAL PREREQUISITES
**Document ID:** `PHASE_7_6_2_REMAINING_ISSUES`  
**Audit Phase:** Phase 7.6.2 Implementation & Verification  
**Auditor:** Principal Software Architect & QA Lead  
**Date:** 2026-11-03  
**Status:** TRACKED & DOCUMENTED  

---

## 1. Executive Summary

This register tracks all remaining non-code dependencies, external Google Cloud Platform manual configurations, and platform limitations following the completion of Phase 7.6.2 implementation.

Zero application code defects, zero test regressions, and zero security vulnerabilities remain in the Psyco AI codebase. All remaining items require manual administrative execution in the Google Cloud Console or are standard Google OAuth testing mode constraints.

---

## 2. External Prerequisites & Issues Register

### Item 1: Manual GCP Console Credentials Registration (`AUTH-02 / TASK-C`)
- **Category**: External Cloud Infrastructure Configuration
- **Severity**: High (Blocks automated cloud testing until applied)
- **Status**: PENDING MANUAL ENTRY BY PROJECT OWNER
- **Description**: Google Cloud Console credentials for OAuth 2.0 Web Client `277075238311-rhabt2dbkp5q3tsd9hp6905op0ktli8c.apps.googleusercontent.com` must have the authoritative Render backend callback (`https://psyco-ai.onrender.com/api/v1/integrations/google/callback`) and Firebase Auth handler (`https://psyco-ai-staging.firebaseapp.com/__/auth/handler`) registered under **Authorized redirect URIs**.
- **Mitigation / Action**: The Project Owner must execute Steps 1–6 in `docs/phase7_6_2/PHASE_7_6_2_GOOGLE_CLOUD_OPERATOR_GUIDE.md`.

---

### Item 2: Test Users List Population (`TASK-B`)
- **Category**: GCP OAuth Consent Screen Governance
- **Severity**: Medium (Affects staging testers not on list)
- **Status**: PENDING MANUAL ENTRY BY PROJECT OWNER
- **Description**: Because Psyco AI operates in Google OAuth **Testing Mode**, accounts not explicitly added to the **Test Users** list will receive `Error 403: access_denied`.
- **Mitigation / Action**: The Project Owner must add the Google email addresses of all staging participants to the Test Users list in GCP Console (Step 5 in Operator Guide). The application UI informs users of this requirement.

---

### Item 3: Seven-Day Refresh Token Expiration in Testing Mode
- **Category**: Google Platform Constraint
- **Severity**: Low (Expected behavior for unverified apps)
- **Status**: ARCHITECTURALLY HANDLED IN CODE
- **Description**: Google enforces a 7-day expiration limit on OAuth refresh tokens issued to apps in Testing mode.
- **Mitigation / Action**: `GoogleCalendarAdapter` detects expired refresh tokens upon refresh failure and sets connection status to `REAUTH_REQUIRED`. The UI prompts the user with: *"Google Calendar connection expired. Please reconnect your account."* without application crashes.

---

### Item 4: Public Production Verification Submission (`TASK-K`)
- **Category**: Compliance & Verification Gate
- **Severity**: Medium (Required prior to general public release)
- **Status**: PREPARED & ROADMAPPED
- **Description**: Before launching to mental health practitioners and patients outside the approved testing cohort, Google requires public sensitive-scope verification for `calendar.events.owned`.
- **Mitigation / Action**: Follow the 4-phase verification roadmap in `docs/phase7_6_2/PHASE_7_6_2_GOOGLE_VERIFICATION_READINESS.md` once production domain and demonstration video are assembled.

---

## 3. Summary & Operational Readiness

| Item ID | Description | Owner | Timeline |
| :---: | :--- | :--- | :--- |
| **REM-01** | Add Redirect URIs in GCP Console | Project Owner | Immediate (5 mins) |
| **REM-02** | Add Staging Test Users in GCP Console | Project Owner | Immediate (2 mins) |
| **REM-03** | 7-day Test Token Handling | Code/Automated | Handled in Phase 7.6.2 |
| **REM-04** | Formal Google App Verification | Compliance / Owner | Production Release Gate |

