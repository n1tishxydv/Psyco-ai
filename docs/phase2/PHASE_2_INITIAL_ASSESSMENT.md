# PSYCO AI — Phase 2 Initial Assessment & Reconnaissance Report

**Project**: Psyco AI — AI-Powered Mental Health Practice Management Platform  
**Phase**: Phase 2 — Patient Portal, Onboarding, Appointment Experience and UX Improvement  
**Author**: Senior Product Designer, React Architect, Frontend Security Specialist  
**Date**: October 31, 2026  
**Target Environments**:
- Staging Web Application: `https://psyco-ai-staging.web.app`
- Staging Backend API: `https://psyco-ai.onrender.com`
- Staging Firebase Realtime Database: `https://psyco-ai-staging-default-rtdb.firebaseio.com`
- Primary/Production Environment: `psyco-9c13d` (*Strictly Untouched / Isolated*)

---

## 1. Executive Summary & Reconnaissance Scope

Psyco AI has established foundational backend security, authentication, and database boundaries in Phase 1 (100% pass across 172 backend security, authorization, and clinical safety tests). 

The goal of Phase 2 is to transform the existing patient experience into a modern, clinical-grade, accessible, and intuitive mental health journey. Rather than rewriting the frontend or building disjointed demo pages, this initiative refines the existing React/Vite architecture, design system, and API service layer.

---

## 2. Frontend Architecture Inventory

### 2.1 Route & Page Inventory

| Route Path | Current Component | Current Status | Planned Phase 2 Enhancement |
|:---|:---|:---|:---|
| `/onboarding` | `OnboardingPage.jsx` | Basic role toggle form with 4-5 fields | **Complete Redesign**: Guided 5-step patient onboarding journey (Welcome, Personal Profile, Care Preferences, Initial Intake Overview, Privacy & Consent, Review) with double-submit defense. |
| `/patient/dashboard` | `PatientDashboard.jsx` | Static link cards with assessment alert | **Complete Redesign**: Personalized greeting, real backend metrics, next appointment spotlight (with online Meet links or clinic address), care plan summaries, and empathetic empty states. |
| `/find-psychologist` | `PsychologistDirectoryPage.jsx` | Basic search bar with cards | **Enhanced Directory**: Real backend query filter (only approved clinicians), verified credential badges, detailed clinician modal, and direct booking actions. |
| `/book/:psychologistId` | `BookingPage.jsx` | 3-step date & slot picker | **Enhanced Booking**: 5-step booking engine with real availability slots, timezone clarity, in-person vs. telehealth mode details, and transparent confirmation. |
| `/patient/appointments` | `PatientAppointmentsPage.jsx` | Basic appointment listing | **Enhanced Management**: Categorized tabs (Upcoming, Pending, Completed, Cancelled), cancellation modals with mandatory reasons, rescheduling slot picker, and join link security. |
| `/patient/profile` | `PatientProfilePage.jsx` | Editable form | **Refined Profile**: Demographic management, emergency contacts, care preferences, and clinical intake status summary. |
| `/settings` | `SettingsPage.jsx` | Multi-tab settings | **Hardened Settings**: Theme toggle, notification preferences, password security, and clear privacy policies. |
| Shared Bell | `NotificationBell.jsx` | Header notification bell | **Enhanced Notifications**: Real unread counter, categorized icons, mark-as-read, and deep links. |

### 2.2 Reusable Component Architecture

The current component library located in `frontend/src/components/common/` contains:
- `Button.jsx` (Primary, Secondary, Danger, Ghost variants)
- `Input.jsx` (Accessible form inputs with error labels)
- `Select.jsx` (Accessible dropdowns)
- `Textarea.jsx` (Multi-line text inputs)
- `Badge.jsx` (Status badges: teal, green, amber, red, neutral)
- `AlertBanner.jsx` (Notice banners)
- `EmptyState.jsx` (Empty state presentation)
- `InitialsAvatar.jsx` (CSS/SVG gradient avatars obeying zero-binary-media invariant)
- `LoadingSpinner.jsx` (Loading state indicator)

**Identified Gaps & Planned Reusable Components**:
1. `PageHeader.jsx`: Unified title, badge, breadcrumbs, and primary action bar.
2. `StatusBadge.jsx`: Standardized appointment and clinical status indicator mapping to backend enums (`pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`).
3. `LoadingSkeleton.jsx`: Content-aware placeholder skeleton screens for appointment cards, dashboard metrics, and clinician cards to prevent layout shift.
4. `ConfirmationDialog.jsx`: Accessible modal dialog for destructive actions (appointment cancellation) with keyboard trap and focus return.
5. `AppointmentCard.jsx`: Reusable appointment presentation card across dashboard and management views.
6. `PsychologistCard.jsx`: Standardized clinician card with verified badges, qualifications, specializations, and booking actions.

---

## 3. API & Backend Contract Alignment

All Phase 2 patient features strictly interface with the existing, hardened Express backend API:
- **Authentication**: `Firebase ID Token` sent via `Authorization: Bearer <token>`.
- **Profile Service**:
  - `GET /api/v1/profile/me`: Authoritative user profile, role, preferences, intake status.
  - `POST /api/v1/profile/onboard/patient`: Demographics onboarding (`fullName`, `gender`, `age`, `phone`, `preferredName`, `timezone`).
  - `PUT /api/v1/profile/patient`: Self-only profile update.
  - `GET /api/v1/profile/preferences` & `PUT /api/v1/profile/preferences`: Theme, language, notification settings.
- **Directory Service**:
  - `GET /api/v1/psychologists`: Public directory strictly returning approved clinicians (`approvalStatus === 'approved'`) with sanitized fields.
  - `GET /api/v1/psychologists/:psychologistId`: Clinician profile details.
- **Availability Service**:
  - `GET /api/v1/psychologists/:psychologistId/availability`: Active weekly schedule.
  - `GET /api/v1/psychologists/:psychologistId/slots?date=YYYY-MM-DD&mode=...`: Conflict-free, real-time booking slots.
- **Appointment Service**:
  - `POST /api/v1/appointments`: Server-validated appointment creation with concurrency protection.
  - `GET /api/v1/appointments`: Scoped patient appointment history.
  - `POST /api/v1/appointments/:id/cancel`: Cancellation with mandatory reason.
  - `POST /api/v1/appointments/:id/reschedule`: Rescheduling to an available slot.
- **Intake Service**:
  - `GET /api/v1/intake/my-intake`: Patient-scoped clinical questionnaire.
  - `POST /api/v1/intake/draft`: Incremental draft auto-save.
  - `POST /api/v1/intake/submit`: Final signed intake commitment.
- **Notification Service**:
  - `GET /api/v1/notifications`: Real user notifications.
  - `PATCH /api/v1/notifications/:id/read` & `POST /api/v1/notifications/read-all`: Status updates.

---

## 4. Design Vision & Accessibility Principles

### 4.1 Visual System (Midnight Navy & Soft Teal)
- **Primary Background**: `midnightNavy` (`#111B2B`) and `deepBlueGray` (`#172536`).
- **Surfaces & Cards**: `elevatedSlate` (`#1D3042`) with subtle border tokens (`border-slate-800` / `border-teal-500/20`).
- **Brand Accents**: `softTeal` (`#79CBB8`) and `deepJade` (`#2D8276`).
- **Semantic Feedback**: `calmGreen` (`#65B891`) for confirmed/active, `mutedAmber` (`#E6B96C`) for pending/action needed, and `mutedCoral` (`#D87575`) for cancelled/critical warnings.
- **Zero Binary Media Invariant**: Text and JSON only. No photos, raster images, or external avatar links. All avatars render as high-fidelity SVG/CSS initials avatars.

### 4.2 Accessibility (WCAG 2.2 AA)
- High-contrast text pairings (`text-slate-100` on `#111B2B` > 7:1 contrast ratio; `text-slate-400` for secondary text > 4.5:1).
- Distinct keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-softTeal`).
- Form inputs with explicit `aria-describedby` links to validation error text.
- Screen-reader announcements for asynchronous status changes.
- Respect for `prefers-reduced-motion` media queries.

---

## 5. Implementation Roadmap

1. **Phase 2I (Design Tokens & Reusable Component Library)**:
   - Build `PageHeader`, `StatusBadge`, `LoadingSkeleton`, `ConfirmationDialog`, `AppointmentCard`, `PsychologistCard`.
2. **Phase 2B (Patient Onboarding Redesign)**:
   - Build guided multi-step onboarding with progressive disclosure, validation, and consent disclosures.
3. **Phase 2C (Patient Dashboard Redesign)**:
   - Implement dynamic greeting, appointment spotlight, stats overview, and empathetic empty states.
4. **Phase 2D (Psychologist Directory & Details)**:
   - Refine search filters, verified badges, clinician detail modal, and direct booking actions.
5. **Phase 2E (Appointment Booking Experience)**:
   - Build streamlined slot picker, mode selection, confirmation summary, and error handling.
6. **Phase 2F (Appointment Management)**:
   - Implement categorized tabs, rescheduling slot picker, and cancellation dialogs.
7. **Phase 2G (Notification Bell & Dropdown)**:
   - Polish unread counter, action navigation, and mark-as-read workflows.
8. **Phase 2H (Patient Profile & Settings)**:
   - Polish demographics editing, preferences sync, and security views.
9. **Phase 2M (Verification & Testing)**:
   - Run backend test suite (`npm --prefix backend test`).
   - Run frontend build (`npm --prefix frontend run build -- --mode staging`).
   - Verify zero regression in Phase 1 security rules.
   - Document in `docs/phase2/PHASE_2_IMPLEMENTATION_REPORT.md` and `docs/phase2/PHASE_2_TEST_MATRIX.md`.
