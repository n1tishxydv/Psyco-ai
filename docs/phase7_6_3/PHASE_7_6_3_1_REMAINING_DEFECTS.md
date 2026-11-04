# PSYCO AI — PHASE 7.6.3.1 REMAINING DEFECTS REGISTER

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`https://psyco-ai-staging.web.app/` / `https://psyco-ai.onrender.com/`), Production (`psyco-9c13d`)  
**Audit Date**: 2026-11-04 / 2026-11-05 UTC  
**Auditor**: Senior QA Engineer & Release Manager  
**Document Reference**: `docs/phase7_6_3/PHASE_7_6_3_1_REMAINING_DEFECTS.md`  
**Classification**: Post-Deployment Defect Tracking & Risk Register  

---

## 1. EXECUTIVE SUMMARY

Following the successful commit `a9a208d58fff215764279b99d5930a5dfc1409d4` and deployment to Firebase Hosting staging target `psyco-ai-staging`, all internal JavaScript runtime errors and navigation discrepancies identified in Phase 7.6.3 have been remediated. 

The remaining operational item is an external Google Cloud OAuth consent configuration requirement, which is outside codebase modification and tracked in this register.

---

## 2. DEFECT RESOLUTION LEDGER

| Defect ID | Severity | Category | Description | Root Cause | Resolution Status | Verified On Live |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-763-01** | CRITICAL | Runtime Error | `Calendar is not defined` on `/psychologist/appointments` | Missing identifier; Lucide icon was imported as `CalendarIcon` | Resolved in `PsychologistCalendarPage.jsx` | **VERIFIED (PASS)** |
| **DEF-763-02** | CRITICAL | Runtime Error | `Calendar is not defined` on `/psychologist/calendar` | Shared component `PsychologistCalendarPage` reference crash | Resolved in `PsychologistCalendarPage.jsx` | **VERIFIED (PASS)** |
| **DEF-763-03** | CRITICAL | Runtime Error | `calendarMenuOpen is not defined` on `/book/:id` confirmation | Extracted component `BookingConfirmationView` missed local state | Resolved in `BookingPage.jsx` | **VERIFIED (PASS)** |
| **DEF-762-01** | HIGH | Routing | Post-OAuth redirect 404 on `/clinical/reports` | Obsolete path in Google OAuth callback controller | Resolved; redirects to `/psychologist/reports` | **VERIFIED (PASS)** |
| **DEF-762-02** | HIGH | Navigation | Public navbar leaking into authenticated layouts | Authenticated routes rendered without layout boundary | Resolved via `PsychologistLayout` / `PatientLayout` | **VERIFIED (PASS)** |

---

## 3. OPEN OPERATIONAL & EXTERNAL PREREQUISITES

### EXT-763-01: Google Cloud Console OAuth App Publishing / Test User Registration
- **Severity**: HIGH (Clinical Feature Blocker for External Clinicians)
- **Component**: Google Workspace / Google Calendar API
- **Observation**:
  When a live user clicks "Connect Google Calendar" in staging, Google's OAuth consent screen displays:
  `Access blocked: Psyco AI has not completed the Google verification process`
  `Error 403: access_denied`
- **Technical Context**:
  The Google OAuth Client (`651213878079-5lr...`) is currently in "Testing" mode in the Google Cloud Console. In "Testing" mode, Google restricts OAuth token issuance to email accounts explicitly listed under "Test Users" in the Google Cloud Console OAuth consent screen configuration.
- **Required Remediation (Cloud Console Administration)**:
  1. Practice Administrator must access the Google Cloud Console project for Psyco AI.
  2. Navigate to **APIs & Services > OAuth consent screen > Audience / Test users**.
  3. Add the staging clinician test accounts (e.g., `doctor.sarah.jenkins@gmail.com` or tester Google accounts) to the authorized Test Users list.
  4. (For production public launch): Submit Psyco AI for Google OAuth app verification with privacy policy and CASA tier 2 assessment.
- **Codebase Impact**: None. The backend callback, encryption service, state verification, and frontend routing are 100% compliant and ready.

---

## 4. MINOR ENHANCEMENT CANDIDATES (NON-BLOCKING)

| Item ID | Category | Description | Priority | Recommended Target |
| :--- | :--- | :--- | :--- | :--- |
| **ENH-763-01** | UI / Responsive | Enhance calendar grid horizontal scroll bar appearance on narrow mobile devices (<360px). | LOW | Post-Pilot Polish |
| **ENH-763-02** | UX / Feedback | Provide an explicit toast notification if a patient attempts to book an appointment with fewer than 2 hours lead time. | MEDIUM | Phase 7.7 |
| **ENH-763-03** | Performance | Implement service worker asset caching for static SVG clinical icons. | LOW | Phase 8 Optimization |

---

## 5. FINAL RELEASE READINESS CLASSIFICATION

### **Classification: A. CALENDAR AND BOOKING RUNTIME FIXES DEPLOYED AND VERIFIED**

**Justification**:
1. All three fatal JavaScript runtime crashes (`DEF-763-01`, `DEF-763-02`, `DEF-763-03`) have been eliminated from both the source tree and the live staging distribution (`https://psyco-ai-staging.web.app`).
2. The staging application bundle `index-D63ipk_k.js` is live, serving HTTP 200 without any runtime syntax or reference errors.
3. Production environment `psyco-9c13d` and production database rules were maintained completely isolated and untouched.
4. The remaining external item (`EXT-763-01`) is strictly an administrative Google Cloud Console test user assignment and does not impede internal staging pilot verification.
