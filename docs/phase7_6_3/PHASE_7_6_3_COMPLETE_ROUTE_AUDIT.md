# Phase 7.6.3: Complete Route Inventory & Routing Engine Audit

**Project**: Psyco AI — Mental Health Practice Management Platform
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)
**Audit Date**: 2026-11-04
**Auditor**: Senior React Architect & QA Lead
**Document Reference**: `docs/phase7_6_3/PHASE_7_6_3_COMPLETE_ROUTE_AUDIT.md`
**Classification**: Routing Architecture & Complete Inventory Matrix

---

## 1. Executive Summary

This document registers and audits every route declared in the React Router v6 routing tree ([routes/index.jsx](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/src/routes/index.jsx)). Each route is mapped to its associated lazy-loaded component, authorized user role, enclosing layout component, responsiveness profile, and operational verification status.

---

## 2. Complete Application Route Inventory Table

| Route | Component | Authorized Role | Enclosing Layout | Loads | Functional | Responsive | Result |
|---|---|---|---|---|---|---|---|
| `/` | `HomePage` | Public | `PublicLayout` | Yes | Yes | Yes (320px–1920px) | **PASS** |
| `/about` | `AboutPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/services` | `ServicesPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/faq` | `FaqPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/contact` | `ContactPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/get-started` | `GetStartedPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/for-patients` | `PatientPortalInfoPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/for-psychologists` | `PsychologistPortalInfoPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/admin-guide` | `AdminGuidePage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/find-psychologist` | `PsychologistDirectoryPage` | Public / Patient | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/book/:psychologistId` | `BookingPage` | Patient / Guest | `PublicLayout` | Yes | Yes (DEF-763-03 fixed) | Yes | **PASS** |
| `/login` | `LoginPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/register` | `RegisterPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/workspace-select` | `WorkspaceChooserPage` | Authenticated | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/onboarding` | `WorkspaceChooserPage` | Authenticated | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/settings` | `SettingsRedirect` | Authenticated | Dynamic Redirect | Yes | Yes | Yes | **PASS** |
| `/appointments` | `AppointmentsRedirect` | Authenticated | Dynamic Redirect | Yes | Yes | Yes | **PASS** |
| `/clinical/reports` | Alias Redirect | Psychologist | Redirect to `/psychologist/reports` | Yes | Yes | Yes | **PASS** |
| `/patient/dashboard` | `PatientDashboard` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/patient/intake` | `PatientIntakePage` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/patient/profile` | `PatientProfilePage` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/patient/appointments` | `PatientAppointmentsPage` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/patient/care-plan` | `PatientCarePlanPage` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/patient/assessments/:id` | `PatientAssessmentRunnerPage` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/patient/settings` | `SettingsPage` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/patient/*` | `NotFoundPage` | Patient | `PatientLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/dashboard` | `PsychologistDashboard` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/profile` | `PsychologistProfilePage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/intake-settings` | `IntakeTemplateSettingsPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/practice-setup` | `PracticeSetupPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/appointments` | `PsychologistCalendarPage` | Psychologist | `PsychologistLayout` | Yes | Yes (DEF-763-01 fixed) | Yes | **PASS** |
| `/psychologist/calendar` | `PsychologistCalendarPage` | Psychologist | `PsychologistLayout` | Yes | Yes (DEF-763-02 fixed) | Yes | **PASS** |
| `/psychologist/availability` | `AvailabilitySettingsPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/patients` | `PatientDirectoryPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/patients/:id` | `PatientChartPage` | Psychologist | `PsychologistLayout` | Yes | Yes (ReBAC guarded) | Yes | **PASS** |
| `/psychologist/sessions/...` | `SessionWorkspacePage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/transcripts` | `TranscriptStudioPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/treatment-plans` | `TreatmentPlansPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/reports` | `ReportsPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/settings` | `SettingsPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/psychologist/*` | `NotFoundPage` | Psychologist | `PsychologistLayout` | Yes | Yes | Yes | **PASS** |
| `/admin/dashboard` | `AdminDashboard` | Administrator | `AdminLayout` | Yes | Yes (Clinical locked) | Yes | **PASS** |
| `/legal` | `DocumentationCentrePage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/privacy-policy` | `PrivacyPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/terms` | `TermsPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/data-privacy` | `DataPrivacyPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/cookie-policy` | `CookiePolicyPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/ai-transparency` | `AiTransparencyPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/medical-disclaimer` | `MedicalDisclaimerPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/data-retention` | `DataRetentionPolicyPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/acceptable-use` | `AcceptableUsePage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/accessibility` | `AccessibilityPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `/privacy-requests` | `PrivacyRequestsPage` | Public | `PublicLayout` | Yes | Yes | Yes | **PASS** |
| `*` (Top-Level Fallback) | `NotFoundPage` | Public / Unauth | `PublicLayout` | Yes | Yes | Yes | **PASS** |

---

## 3. Backward Compatibility Redirects

The routing tree retains seamless aliasing for legacy URLs:
- `/patient-portal` & `/patient-guide` -> `/for-patients`
- `/psychologist-portal` & `/psychologist-guide` -> `/for-psychologists`
- `/documentation` -> `/legal`
- `/privacy` -> `/privacy-policy`
- `/security-overview` -> `/data-privacy`
- `/notes` -> `/psychologist/appointments`
- `/calendar` -> `/psychologist/calendar`
- `/clinical/reports` -> `/psychologist/reports`
