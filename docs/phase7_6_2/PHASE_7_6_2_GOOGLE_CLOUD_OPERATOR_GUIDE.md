# PSYCO AI — PHASE 7.6.2 GOOGLE CLOUD OPERATOR GUIDE
**Document ID:** `PHASE_7_6_2_GOOGLE_CLOUD_OPERATOR_GUIDE`  
**Audit Phase:** Phase 7.6.2 Implementation & Verification  
**Audience:** Google Cloud Project Owner, Systems Administrator & DevOps Lead  
**Date:** 2026-11-03  
**Status:** ACTIONABLE RUNBOOK  

---

## 1. Overview & Objectives

This runbook provides the Google Cloud Project Owner with step-by-step instructions to configure Google Cloud Platform (GCP) credentials for Psyco AI.

Completing this checklist resolves:
1. **OAuth Error 403 `access_denied`**: By adding approved staging tester accounts to the GCP Test Users list.
2. **OAuth Error 400 `redirect_uri_mismatch`**: By registering the authoritative Render backend callback and Firebase Auth handler URIs.
3. **Calendar API Activation**: By enabling the Google Calendar API.

---

## 2. Step-by-Step Operator Checklist

### Step 1: Select the Correct GCP Project
1. Log in to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top project selector dropdown, ensure you are in the project associated with OAuth Client ID:  
   `277075238311-rhabt2dbkp5q3tsd9hp6905op0ktli8c.apps.googleusercontent.com`  
   *(e.g., project `psyco-ai-staging` or the designated staging auth project).*

---

### Step 2: Enable Google Calendar API
1. In the GCP navigation menu, go to **APIs & Services** > **Library**.
2. Search for **Google Calendar API**.
3. If not already enabled, click **Enable**.

---

### Step 3: Configure OAuth Consent Screen & Audience
1. In the navigation menu, go to **APIs & Services** > **OAuth consent screen**.
2. **User Type**: Verify that **External** is selected.
3. **Publishing Status**: Keep as **Testing** (do NOT click "Publish App" during staging development).
4. Verify branding fields:
   - **App name**: `Psyco AI`
   - **User support email**: Select your authorized admin email.
   - **Developer contact email**: Enter the project owner's email.
   - **Authorized domains**: Add `web.app` and `firebaseapp.com`.
5. Click **Save and Continue**.

---

### Step 4: Register Minimized Calendar Scope
1. On the **Scopes** page of the OAuth consent screen wizard, click **Add or Remove Scopes**.
2. In the filter box, enter `calendar.events.owned`.
3. Check the box for:
   ```text
   https://www.googleapis.com/auth/calendar.events.owned
   ```
   *(Description: "See, edit, share, and permanently delete all the events on each calendar you own")*
4. Also verify basic identity scopes are checked:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Click **Update** and then **Save and Continue**.

---

### Step 5: Add Approved Staging Test Users (Fixes 403 `access_denied`)
1. On the **Test users** page, click **+ Add Users**.
2. Enter the Google email addresses of all individuals participating in external staging testing:
   - Project Owner Google Account: `[n1tishxydv@gmail.com / project owner email]`
   - Approved clinical tester account(s)
   - Approved patient tester account(s)
3. Click **Add**.
4. Click **Save and Continue**.

---

### Step 6: Configure Web OAuth Client (Fixes 400 `redirect_uri_mismatch`)
1. In the navigation menu, go to **APIs & Services** > **Credentials**.
2. Under **OAuth 2.0 Client IDs**, click the Web Client ID:  
   `277075238311-rhabt2dbkp5q3tsd9hp6905op0ktli8c.apps.googleusercontent.com`
3. Under **Authorized JavaScript origins**, ensure the following exact URLs are present:
   - [x] `http://localhost:5173`
   - [x] `http://localhost:3000`
   - [x] `https://psyco-ai-staging.web.app`
   - [x] `https://psyco-ai-staging.firebaseapp.com`
4. Under **Authorized redirect URIs**, add the authoritative backend and Firebase handlers:
   - [x] `http://localhost:5000/api/v1/integrations/google/callback` *(Local Calendar callback)*
   - [x] `https://psyco-ai.onrender.com/api/v1/integrations/google/callback` *(Staging Calendar callback)*
   - [x] `http://localhost:5173` *(Local frontend)*
   - [x] `https://psyco-ai-staging.web.app/__/auth/handler` *(Firebase Auth staging handler)*
   - [x] `https://psyco-ai-staging.firebaseapp.com/__/auth/handler` *(Firebase Auth domain handler)*
5. Click **Save**.

---

### Step 7: Update Render Backend Environment Configuration
1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Select the backend web service: `psyco-ai`.
3. In the left navigation, click **Environment**.
4. Verify or update the following environment variables:
   ```env
   GOOGLE_CLIENT_ID=277075238311-rhabt2dbkp5q3tsd9hp6905op0ktli8c.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=[Enter client secret securely here]
   GOOGLE_REDIRECT_URI=https://psyco-ai.onrender.com/api/v1/integrations/google/callback
   TOKEN_ENCRYPTION_KEY=[Enter a 32-character or longer random secret for AES-256-GCM]
   ```
5. Click **Save Changes** (Render will automatically redeploy the backend with the updated configuration).

---

## 3. End-to-End Verification Procedure

Once GCP credentials and Render environment variables are saved (allow 5 minutes for Google edge propagation):

1. **Test User Verification**:
   - Navigate to `https://psyco-ai-staging.web.app/settings?tab=integrations`.
   - Sign in as a test user whose email was added in Step 5.
   - Click **Connect Google Calendar**.
   - Verify that Google displays the consent screen for `Psyco AI` requesting permission to manage owned calendar events.
   - Approve consent.
   - Verify automatic redirection back to Psyco AI showing the green **Connected** badge with the user's Google email.

2. **Unapproved User Verification**:
   - Repeat the process using a personal Google account that was **not** added to the Test Users list.
   - Verify that Google displays the expected Error 403 `access_denied` testing restriction.
   - Click "Back to safety" and verify Psyco AI handles the cancellation cleanly without crashing.

3. **Calendar Event Verification**:
   - Book or confirm a consultation appointment.
   - Open [Google Calendar](https://calendar.google.com/) for the connected account.
   - Verify that an event titled `Psyco AI Appointment` appears at the exact scheduled time with a Google Meet conference link.
   - Verify that no patient symptoms, clinical notes, or diagnostic codes are present in the event description.

