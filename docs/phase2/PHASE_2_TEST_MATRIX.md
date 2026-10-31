# PSYCO AI — PHASE 2 TEST MATRIX & PATIENT JOURNEY VALIDATION
**Comprehensive Patient Portal, Onboarding, Discovery, Scheduling & Care Management Test Matrix**

**Version:** 2.0  
**Date:** 2026-10-31  
**Target Environments:** Staging Frontend (`https://psyco-ai-staging.web.app`) & Staging Backend (`https://psyco-ai.onrender.com`)  
**Database Target:** Firebase Realtime Database (`https://psyco-ai-staging-default-rtdb.firebaseio.com`)

---

## 1. Test Methodology & Scope
The Phase 2 Test Matrix verifies the complete end-to-end patient journey across all core interaction surfaces. Every test case specifies the exact user flow, preconditions, test inputs, expected behavior, security invariant checks, and actual validation status.

---

## 2. End-to-End Patient Journey Test Matrix

| Test ID | Journey Stage / Feature | Preconditions | Test Steps & Inputs | Expected Result | Security & Accessibility Verification | Status |
|---|---|---|---|---|---|---|
| **TC-ONB-01** | Guided Onboarding - Flow Navigation | User registered as `patient` with `onboardingCompleted: false` | 1. Navigate to `/onboarding`.<br>2. Fill Step 1 details (First name, phone).<br>3. Click "Continue".<br>4. Fill Step 2 (Demographics & Emergency Contact).<br>5. Click "Back" and verify data persistence.<br>6. Click "Continue" through Step 3 (Preferences). | Step progress indicator advances from 1 to 3; data in previous steps is preserved; form does not submit prematurely. | ARIA step indicator reports active step; tab order is sequential. | **PASS** |
| **TC-ONB-02** | Guided Onboarding - Consent Checkboxes | Reached Step 4 (Privacy & Legal Disclosures) | 1. Observe initial checkbox states.<br>2. Attempt to click "Review & Continue" without checking boxes.<br>3. Select checkboxes for Telehealth, AI Copilot, and HIPAA.<br>4. Click "Review & Continue". | Form validation blocks advancement until all required informed consent checkboxes are explicitly checked. No checkboxes are pre-checked. | Legally valid affirmative consent; no deceptive dark patterns. | **PASS** |
| **TC-ONB-03** | Guided Onboarding - Final Submission & State Sync | Reached Step 5 (Review & Confirmation) | 1. Review entered summary.<br>2. Click "Complete Onboarding".<br>3. Double-click rapidly on submit button. | Submit button is immediately disabled with loading spinner to prevent duplicate submission; payload sent to `PATCH /api/v1/profile/me`; redirect to `/patient/dashboard`. | No duplicate server writes; server marks `onboardingCompleted: true`. | **PASS** |
| **TC-DSH-01** | Patient Dashboard - Metrics & Greeting | Authenticated patient with existing appointments | 1. Navigate to `/patient/dashboard`.<br>2. Observe top welcome card.<br>3. Inspect the 4 metric cards. | Greeting displays personalized name based on local time ("Good morning/afternoon/evening"); cards show real counts for Upcoming, Pending, and Completed sessions. | Skeletons render during fetch; zero layout shift (CLS). | **PASS** |
| **TC-DSH-02** | Patient Dashboard - Next Session Spotlight | Patient has a confirmed online consultation scheduled | 1. Check "Next Scheduled Consultation" card.<br>2. Verify clinician initials avatar, date/time, and mode.<br>3. Click "Join Google Meet" link. | Card renders Google Meet button with external link icon; URL points to valid authorized session room. In-person sessions render clinic location instead. | ReBAC check: Google Meet URL is only exposed for confirmed appointments of the authorized user. | **PASS** |
| **TC-DSH-03** | Patient Dashboard - Clinical Assessment Alert | Practitioner assigned PHQ-9 screener to patient | 1. Patient loads dashboard.<br>2. Observe Clinical Assessment alert banner.<br>3. Click "Take Clinical Screener". | Prominent alert informs patient of pending clinical assessment; routes seamlessly to `/patient/intake`. | Sensitive questionnaire responses protected by Phase 1 backend encryption. | **PASS** |
| **TC-DIR-01** | Psychologist Directory - Filter & Search | Authenticated or guest patient browsing directory | 1. Navigate to `/find-psychologist`.<br>2. Type clinician name in search input.<br>3. Toggle "Anxiety" specialization chip.<br>4. Select "Online" consultation mode. | Directory filters list in real-time; active filter count badge updates; "Clear Filters" button restores full list. | Strictly displays clinicians with `approvalStatus === 'approved'`; unapproved clinicians never appear. | **PASS** |
| **TC-DIR-02** | Psychologist Directory - Clinician Profile Modal | Clinicians loaded in directory | 1. Click "View Profile & Credentials" on clinician card.<br>2. Inspect modal content.<br>3. Press `Escape` key or click outside to dismiss. | Modal opens with clinician bio, verified license badge, education, languages, and direct "Schedule Consultation" button. | Focus is trapped inside modal; `aria-modal="true"`; `Escape` key returns focus cleanly. | **PASS** |
| **TC-BOK-01** | Appointment Booking - Slot Availability | Selected clinician from directory | 1. Navigate to `/book/:psychologistId`.<br>2. Select session mode (In-person vs Online).<br>3. Select date from quick-date chips or datepicker.<br>4. Observe slot grid. | Backend queries `/api/v1/psychologists/:id/slots`; open time slots render with start and end times; local timezone is displayed prominently. | No phantom slots; conflicts with existing bookings or buffer times are filtered by backend. | **PASS** |
| **TC-BOK-02** | Appointment Booking - Submission & Confirmation | Slot selected and brief reason entered | 1. Enter brief reason in textarea.<br>2. Click "Confirm & Request Booking".<br>3. Observe confirmation card. | Request submitted to `POST /api/v1/appointments`; confirmation displays reference ID, session PIN, and status ("pending" approval or "confirmed"). | Confidential session PIN generated securely; duplicate submission locked during request. | **PASS** |
| **TC-APT-01** | Appointment Management - Tab Segmentation & Search | Patient has multiple appointments across statuses | 1. Navigate to `/patient/appointments`.<br>2. Switch between "Upcoming", "Pending", "Past", and "Cancelled" tabs.<br>3. Type clinician name in search bar. | Appointments are partitioned accurately into each tab; search filters appointments within the selected tab. | Skeletons display during data fetch; empty tab displays helpful CTA. | **PASS** |
| **TC-APT-02** | Appointment Management - Cancellation Guard | Patient selects an upcoming appointment to cancel | 1. Click "Cancel" on an upcoming appointment.<br>2. Inspect cancellation dialog.<br>3. Attempt to submit without entering reason.<br>4. Enter reason (e.g. "Work emergency") and confirm. | Validation prevents submission without reason (minimum 3 characters); backend updates appointment status to `cancelled`; UI updates immediately with success banner. | ReBAC check: Users can only cancel their own appointments; past or completed sessions cannot be cancelled. | **PASS** |
| **TC-APT-03** | Appointment Management - Clinician Proposal Handling | Clinician proposed alternative time slot | 1. View appointment in "Upcoming" or "Pending" tab.<br>2. Inspect "Clinician Proposed New Time" banner.<br>3. Click "Accept Time" or "Decline". | Action triggers `POST /api/v1/appointments/:id/respond-proposal`; accepts slot or declines; appointment refreshes with confirmed time. | State transition rules strictly validated on backend; unauthorized role rejection. | **PASS** |
| **TC-NOT-01** | Notifications - Bell & Status Badges | Patient receives booking confirmation or status change | 1. Observe top navbar notification bell.<br>2. Click bell to toggle dropdown.<br>3. Inspect notification items.<br>4. Click "Mark all as read". | Unread count badge displays correct number; items display category-specific icons (`CheckCheck` for confirmation, `Clock` for proposals); unread count resets to 0. | Accessible dropdown; dismisses on click outside or `Escape`. | **PASS** |
| **TC-PRF-01** | Patient Profile - Records & Edit Guard | Patient on `/patient/profile` | 1. Click "Edit Profile".<br>2. Update phone and preferred name.<br>3. Click "Save Changes". | Profile calls `PATCH /api/v1/profile/me`; local state refreshes; success banner confirms update. | Clinical intake records are accessible via secure SPA `<Link>` without leaking unencrypted notes. | **PASS** |
| **TC-SET-01** | Settings - Security & Re-authentication | Patient on `/settings` tab "Security" | 1. Enter current password and new password.<br>2. Click "Update Password". | Firebase Auth re-authenticates with current credential before allowing password mutation; prevents session hijacking. | High-security credential protection; zero client-side credential logging. | **PASS** |

---

## 3. Responsive Viewport Matrix

| Viewport | Device Class | Resolution | Layout Adaptation | Status |
|---|---|---|---|---|
| **Ultra-Wide** | Desktop Monitor | 1920 × 1080 | 2-column appointments grid, centered max-w-6xl container, sticky navigation. | **PASS** |
| **Standard Desktop** | Laptop | 1440 × 900 | Optimal padding, fluid stats tiles, full directory search bar. | **PASS** |
| **Compact Desktop** | Small Laptop | 1366 × 768 | Responsive grid collapse, modal max-width constrained to 90vw. | **PASS** |
| **Tablet Landscape** | iPad Pro / Air | 1024 × 768 | 2-column card layout, scrollable quick-date picker. | **PASS** |
| **Tablet Portrait** | iPad Mini | 768 × 1024 | Single-column directory cards with initials avatar, fluid buttons. | **PASS** |
| **Large Mobile** | iPhone 14 Pro Max | 430 × 932 | Full-width buttons, collapsible hamburger menu, stacked action rows. | **PASS** |
| **Standard Mobile** | iPhone 13 / 14 | 390 × 844 | 44px touch targets, zero horizontal scrolling, sticky bottom controls. | **PASS** |
| **Compact Mobile** | iPhone SE / Mini | 375 × 812 | Compact typography, fluid date badges, wrapped tags. | **PASS** |
| **Android Small** | Samsung Galaxy A | 360 × 800 | Full responsiveness verified with clean margins and accessible padding. | **PASS** |

---

## 4. Automated Build & Test Verification Sign-Off

```
[STAGING FRONTEND BUILD VERIFICATION]
Command: npm --prefix frontend run build -- --mode staging
Result:  SUCCESS (Exit Code 0)
Modules: 2,061 transformed
Bundle:  dist/assets/index-Cl8g8er9.css (64.24 kB), dist/assets/index-D0euV6Jz.js (1,196.27 kB)

[BACKEND AUTOMATED SECURITY & UAT TEST SUITE]
Command: npm --prefix backend test
Result:  SUCCESS (Exit Code 0)
Summary: 172 tests passed, 0 failed, 16 suites completed in 4.03s

[GIT INTEGRITY & WORKSPACE HYGIENE]
Command: git diff --check
Result:  SUCCESS (Exit Code 0 - zero whitespace errors, merge conflicts, or CRLF defects)
```
