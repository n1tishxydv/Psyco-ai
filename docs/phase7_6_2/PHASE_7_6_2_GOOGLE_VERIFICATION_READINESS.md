# PSYCO AI — PHASE 7.6.2 GOOGLE APP VERIFICATION & TESTING READINESS
**Document ID:** `PHASE_7_6_2_GOOGLE_VERIFICATION_READINESS`  
**Audit Phase:** Phase 7.6.2 Implementation & Verification  
**Target:** Google Cloud OAuth Consent Screen & Public Verification Strategy  
**Auditor:** Principal Google Workspace Integration Architect & Compliance Officer  
**Date:** 2026-11-03  
**Status:** AUDITED & ROADMAPPED  

---

## 1. Executive Summary

During external testing, users encountered:
```text
Error 403: access_denied
Psyco AI has not completed the Google verification process. The app is currently being tested, and it hasn't been verified by Google.
```
This report documents the architectural causes of this error, details the rules governing Google Cloud OAuth **Testing Mode** versus **Production Mode**, and defines the formal roadmap required for public Google verification.

---

## 2. Root Cause of Error 403 `access_denied`

When an application registers sensitive Google OAuth scopes (such as `calendar.events.owned` or `calendar.events`), Google Cloud enforces strict access controls based on the consent screen's **Publishing Status**:

```
+-----------------------------------+-----------------------------------+
| TESTING MODE                      | PRODUCTION MODE (UNVERIFIED)      |
+-----------------------------------+-----------------------------------+
| Restricted to pre-approved        | Allows any Google user.           |
| accounts listed under             | Triggers alarming "Google hasn't  |
| "Test Users" in GCP Console.      | verified this app" warning.       |
| Unlisted users get Error 403      | Capped at 100 user token grants   |
| access_denied.                    | before hard-blocking all logins.  |
+-----------------------------------+-----------------------------------+
                                      |
                                      v
                    +-----------------------------------+
                    | PRODUCTION MODE (VERIFIED)        |
                    +-----------------------------------+
                    | Formally audited by Google Trust  |
                    | & Safety team. No warning screen. |
                    | Unlimited users.                  |
                    +-----------------------------------+
```

In the current staging environment, Psyco AI is correctly configured in **Testing Mode**. Error 403 occurs when an account that has not been explicitly added to the GCP **Test Users** list attempts to authorize the Calendar integration.

---

## 3. Staging Verification Strategy (Controlled Testing)

### Mandatory Rule: Do NOT Switch to "In Production" Prematurely
Switching the staging project to "In Production" without verification will expose testers to an alarming "Unverified App" security bypass screen and trigger a 100-user cap that will permanently break the OAuth client when exhausted.

### Staging Testing Protocol:
1. **Audience**: External user type.
2. **Publishing Status**: Keep as **Testing**.
3. **Authorized Cohort**: Add the Project Owner and all designated staging participants to the **Test Users** list in the Google Cloud Console.
4. **Expiry Management**: Google's testing mode limits refresh tokens for test users to a 7-day expiration window. The application handles this gracefully by displaying:
   `"Google Calendar connection expired. Please reconnect your account."`

---

## 4. Public Release Verification Roadmap

Prior to launching Psyco AI to general mental health practices and external patients, the Project Owner must complete Google's formal OAuth App Verification process.

### Phase 1: Domain & Brand Preparation
1. **Google Search Console**: Verify ownership of the root domain (`psyco.ai` or equivalent production domain) in Google Search Console using the same GCP account.
2. **Authorized Domains**: Add the verified domain under **Authorized domains** in the OAuth Consent Screen.
3. **Public Policies**:
   - Privacy Policy URL (e.g. `https://psyco.ai/privacy-policy`) explicitly detailing how Google user data is accessed, used, stored, and protected.
   - Terms of Service URL (e.g. `https://psyco.ai/terms`).
4. **App Branding**: High-resolution 120x120px Psyco AI logo, official developer contact email, and support email.

### Phase 2: Scope Justification Document
Submit a written justification explaining why `https://www.googleapis.com/auth/calendar.events.owned` is required:
> *"Psyco AI is a mental health practice management platform. Clinicians and patients connect their Google Calendar to automatically synchronize confirmed therapy appointments and generate Google Meet telehealth sessions. Psyco AI requests only the minimized `calendar.events.owned` scope to insert and update appointment events on calendars owned by the user. Psyco AI never accesses emails, contacts, or unowned calendars, and never transmits clinical diagnoses, patient symptoms, or therapy notes to Google Calendar."*

### Phase 3: Demonstration Video Requirements
Prepare an unlisted YouTube video showing:
1. User clicking "Connect Google Calendar" in Psyco AI settings.
2. The Google OAuth consent screen showing the application client ID in the URL bar (`client_id=...`).
3. User granting consent to `calendar.events.owned`.
4. Successful redirection back to Psyco AI showing the "Connected" status.
5. Booking a consultation and demonstrating the event appearing on the user's Google Calendar with generic title and Google Meet link.
6. Rescheduling the appointment and showing the event update.
7. Cancelling the appointment and showing the event removal.

### Phase 4: Submit for Verification
1. Click **Submit for Verification** in Google Cloud Console.
2. Google Trust & Safety review typically completes within 3 to 7 business days.
3. Address any follow-up inquiries regarding data retention or user consent.

---

## 5. Verification Gate Status

- **Staging Readiness**: **READY** (Requires Test Users addition in GCP Console).
- **Public Production Verification**: **PENDING** (To be initiated during production rollout).

