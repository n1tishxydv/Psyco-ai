# PSYCO AI — STAGING SETUP PHASE 1 REMAINING BLOCKERS & REMEDIATION

**Document:** `docs/staging/PSYCO_AI_STAGING_REMAINING_BLOCKERS.md`  
**Phase:** Staging Setup Phase 1 — External Prerequisites & Operator Remediation  
**Date:** October 28, 2026  
**Auditor:** Senior Full-Stack Engineer, Firebase Architect & Application Security Specialist  
**Product:** Psyco AI Practice Management Platform  
**Target:** Live Staging Release & External UAT  

---

## 1. Updated Blockers Status Dashboard

| Blocker ID | Category | Severity | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-STG-01** | Database Isolation | **CRITICAL** | Dedicated staging project & RTDB instance | **`RESOLVED`** (`psyco-ai-staging-default-rtdb` active) |
| **BLK-RULES-01**| Database Rules | **HIGH** | Staging security rules deployment | **`RESOLVED`** (Published via Management API) |
| **BLK-SEED-01** | Test Fixtures | **MEDIUM** | Synthetic staging data seeding | **`RESOLVED`** (11 core entities populated) |
| **BLK-AUTH-01** | OAuth Consent | **HIGH** | Google OAuth Consent Screen test users | **`BLOCKED — OPERATOR ACTION REQUIRED`** |
| **BLK-CAL-01**  | Calendar OAuth | **MEDIUM** | Clinician Google Calendar consent flow | **`BLOCKED — OPERATOR ACTION REQUIRED`** |

---

## 2. Operator Action Guides for Live Testing

### Operator Action 1: Add Staging Test Users in Google Cloud Console (`BLK-AUTH-01`)
Because the OAuth Consent Screen is in "Testing" mode, external Google logins trigger `Error 403: access_denied` until test emails are registered:

1. **Open Google Cloud Console:** Navigate to [Google Cloud Console — OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent) for project `psyco-ai-staging` (or Client ID project `143160785926`).
2. **Add Test Users:**
   * Under **Audience** / **Test users**, click **+ ADD USERS**.
   * Add:
     * `admin.staging@psyco.clinic`
     * `nitish25csu169@ncuindia.edu`
     * Staging QA tester emails.
   * Click **SAVE**.
3. **Verify:**
   * Open the staging website, click **Continue with Google**, and verify that the account signs in and redirects to the appropriate dashboard without error.

---

### Operator Action 2: Authorize Clinician Google Calendar (`BLK-CAL-01`)
To enable two-way calendar sync and automated Google Meet link generation in staging:

1. Log in to the staging site as the synthetic approved psychologist (`dr.staging.clinician@psyco.clinic`) or operator psychologist.
2. Navigate to **Practice Settings** or `/psychologist/calendar`.
3. Click **Connect Google Calendar**.
4. In the Google popup, grant consent for `https://www.googleapis.com/auth/calendar.events`.
5. The backend will exchange the authorization code and save tokens under `googleConnections/${uid}` in `psyco-ai-staging-default-rtdb`.

---

## 3. Staging Deployment Readiness Decision

With the creation of `psyco-ai-staging` and the deployment of security rules:
* **Production Data Risk:** **`0% (Completely Isolated)`**
* **Staging Database Status:** **`ACTIVE & POPULATED`**
* **Staging Rules Status:** **`ENFORCED`**
* **Deployment Readiness:** **`READY FOR STAGING TRAFFIC`**
