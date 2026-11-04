# PSYCO AI — PHASE 7.6.2 SCOPE MINIMIZATION & LEAST-PRIVILEGE AUDIT
**Document ID:** `PHASE_7_6_2_SCOPE_MINIMIZATION_REPORT`  
**Audit Phase:** Phase 7.6.2 Implementation & Verification  
**Target:** Google OAuth 2.0 Scope Architecture  
**Auditor:** Principal Google Workspace Integration Architect & Healthcare SaaS Privacy Auditor  
**Date:** 2026-11-03  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Executive Summary

In healthcare software, user data protection and the principle of least privilege are paramount. The previous implementation of the Google Calendar integration requested the broad scope:
```text
https://www.googleapis.com/auth/calendar.events
```
This grant permits reading, editing, and deleting events across all calendars accessible to the user, including shared family calendars, organization-wide calendars, and external shared schedules.

Phase 7.6.2 audited application capabilities and successfully minimized the requested permission to:
```text
https://www.googleapis.com/auth/calendar.events.owned
```
This restricts Psyco AI's access strictly to events on calendars created and owned by the authenticating user.

---

## 2. Comparative Scope Analysis

| Metric | Legacy Scope | Minimized Scope (Phase 7.6.2) |
| :--- | :--- | :--- |
| **OAuth Scope String** | `https://www.googleapis.com/auth/calendar.events` | `https://www.googleapis.com/auth/calendar.events.owned` |
| **Google Permission Category** | Sensitive Scope | Sensitive Scope (Narrowed) |
| **Calendar Ownership Restriction** | None; all accessible calendars (owned & shared) | **Strictly calendars owned by the authenticated user** |
| **View Shared Calendars** | Yes (Over-privileged) | **NO** (Blocked by Google IAM) |
| **Edit Events on Shared Calendars** | Yes (Over-privileged) | **NO** (Blocked by Google IAM) |
| **Manage Primary Calendar Appointments**| Yes | **YES** |
| **Create Google Meet Conferencing** | Yes | **YES** |
| **Update/Reschedule Appts** | Yes | **YES** |
| **Delete/Cancel Appts** | Yes | **YES** |

---

## 3. API Method Alignment

The following Google Calendar API v3 REST operations are utilized by `GoogleCalendarAdapter`:

| API Operation | HTTP Method & Endpoint | Minimized Scope Sufficiency |
| :--- | :--- | :---: |
| **Create Appointment Event** | `POST https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1` | **Fully Sufficient** |
| **Reschedule Appointment** | `PATCH https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}` | **Fully Sufficient** |
| **Cancel / Delete Appointment** | `DELETE https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}` | **Fully Sufficient** |
| **Identity Verification** | `GET https://www.googleapis.com/oauth2/v2/userinfo` | Handled via `userinfo.email` |

Both primary calendar insertion and Google Meet conference data generation (`hangoutsMeet`) operate with 100% functionality under `calendar.events.owned`.

---

## 4. Permissions Explicitly Avoided

By narrowing the scope, Psyco AI explicitly does NOT request:
1. `https://www.googleapis.com/auth/calendar` (Full read/write/delete of entire calendars and calendar settings).
2. `https://www.googleapis.com/auth/calendar.readonly` (Broad calendar history inspection).
3. `https://www.googleapis.com/auth/calendar.settings.readonly` (User calendar preferences and settings).
4. `https://www.googleapis.com/auth/calendar.acls` (Access Control Lists and sharing permissions).
5. `https://www.googleapis.com/auth/calendar.freebusy` (General free/busy availability queries).

---

## 5. Google App Verification Implications

Both `calendar.events` and `calendar.events.owned` are classified by Google as **Sensitive Scopes**. 

### Critical Verification Notice:
Selecting `calendar.events.owned` does **not** exempt Psyco AI from Google's Cloud OAuth verification requirements for public production use. However, requesting `calendar.events.owned` significantly streamlines the verification review process:
1. Demonstrates adherence to Google's *API Services User Data Policy*.
2. Minimizes the security footprint and risk assessment during Google's Trust & Safety review.
3. Provides users with a transparent consent prompt clearly indicating that only owned calendar events will be managed.

---

## 6. Implementation & Regression Verification

In `backend/src/integrations/googleCalendar/googleCalendarAdapter.js`:
```javascript
export const DEFAULT_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned';
```
Automated test `TEST-CAL-10` in `backend/src/tests/phase7_6_2_google_calendar.test.js` continuously validates that `generateAuthUrl` and `getStatus` enforce this scope.

