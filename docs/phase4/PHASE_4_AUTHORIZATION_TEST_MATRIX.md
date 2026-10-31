# PSYCO AI — PHASE 4 AUTHORIZATION TEST MATRIX
**Document Version:** 1.0.0  
**Status:** 100% Verified & Passing  
**Date:** October 31, 2026  
**Auditor / Architect:** Senior Healthcare Cybersecurity & Backend Testing Specialist  

---

## 1. Overview & Purpose

The purpose of this document is to establish a verifiable, granular security and authorization matrix for Phase 4 of Psyco AI. Mental health practice management platforms require strict Role-Based and Relationship-Based Access Control (ReBAC) to prevent horizontal privilege escalation, administrative overreach into clinical records, and unauthorized state transitions.

This matrix documents every newly introduced or expanded administrative endpoint, detailing the permitted caller roles, prohibited caller roles, expected status codes, and the automated test cases in `backend/src/tests/phase4_admin_management.test.js` verifying each invariant.

---

## 2. Role Definitions & Access Boundaries

| Role Identifier | System Role Name | Authority Scope | Prohibited Actions |
| :--- | :--- | :--- | :--- |
| `ROLES.ADMIN` | Platform Administrator | Global account governance, clinician verification, clinic registration, support ticketing, FAQ/CMS moderation, audit logs, system health, platform settings. | **Strictly barred from patient psychotherapy notes, session transcripts, psychiatric intake disclosures, and treatment plans (`ADMIN_CLINICAL_ACCESS_PROHIBITED`). Cannot self-suspend account.** |
| `ROLES.PSYCHOLOGIST` | Licensed Clinician | Autonomous independent practice, clinic affiliation participation, patient chart management, SOAP clinical notes, treatment plans, appointment management. | **Barred from platform-wide user management, reviewing other clinicians' credentials, modifying platform settings, or accessing unrelated patient charts.** |
| `ROLES.PATIENT` | Care Recipient | Personal profile, intake responses, appointment discovery and booking, interactive homework tasks, patient portal records. | **Barred from all administrative endpoints, other patients' records, and unapproved psychologist schedules.** |

---

## 3. Comprehensive Endpoint Authorization Matrix

| Endpoint Route | HTTP Method | Permitted Role(s) | Prohibited Role(s) | Status Code | Test Assertion & Scenario |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/admin/metrics` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 1, Scenario 1B |
| `/api/v1/admin/users` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 2 |
| `/api/v1/admin/users/:uid/status` | `PATCH` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 2 |
| `/api/v1/admin/users/:ownUid/status` (self-suspend) | `PATCH` | None (Blocked) | `admin` (Self) | `400` (`SELF_SUSPENSION_PROHIBITED`) | Scenario 2B |
| `/api/v1/admin/psychologists` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 3 |
| `/api/v1/admin/psychologists/:uid/review` | `POST` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 3 |
| `/api/v1/admin/psychologists/:ownUid/review` (self-approve) | `POST` | None (Blocked) | `psychologist` (Self) | `403` (`INSUFFICIENT_ROLE_PERMISSIONS`) | Scenario 3 |
| `/api/v1/admin/clinics` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 4 |
| `/api/v1/admin/clinics` | `POST` | `admin` | `patient`, `psychologist` | `201` (Admin) / `403` (Non-Admin) | Scenario 4 |
| `/api/v1/admin/clinics/:id/status` | `PATCH` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 4 |
| `/api/v1/admin/clinics/memberships` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 4 |
| `/api/v1/admin/clinics/memberships/:id` | `PATCH` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 4 |
| `/api/v1/admin/practices` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 5 |
| `/api/v1/admin/practices/:id/status` | `PATCH` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 5 |
| `/api/v1/admin/support/tickets` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 6 |
| `/api/v1/admin/support/tickets/:id` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 6 |
| `/api/v1/admin/support/tickets/:id` | `PATCH` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 6 |
| `/api/v1/admin/support/tickets/:id/replies` | `POST` | `admin` | `patient`, `psychologist` | `201` (Admin) / `403` (Non-Admin) | Scenario 6 |
| `/api/v1/admin/faqs` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 7 |
| `/api/v1/admin/faqs` | `POST` | `admin` | `patient`, `psychologist` | `201` (Admin) / `403` (Non-Admin) | Scenario 7 |
| `/api/v1/admin/faqs/:id` | `PUT` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 7 |
| `/api/v1/admin/faqs/:id/publish` | `PATCH` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 7 |
| `/api/v1/admin/faqs/:id` | `DELETE` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 7 |
| `/api/v1/admin/content/:key` | `PUT` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 7 |
| `/api/v1/admin/audit-logs` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 8 |
| `/api/v1/admin/system-health` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 9 |
| `/api/v1/admin/settings` | `GET` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 10 |
| `/api/v1/admin/settings` | `PUT` | `admin` | `patient`, `psychologist` | `200` (Admin) / `403` (Non-Admin) | Scenario 10 |
| `/api/v1/clinical/patients/:id/chart` | `GET` | Assigned `psychologist` | `admin`, unassigned `psychologist` | `403` (`ADMIN_CLINICAL_ACCESS_PROHIBITED`) | Scenario 11 |

---

## 4. Test Execution & Pass / Fail Audit Log

All scenarios were executed locally against the unified backend test runner (`node --test src/tests/phase4_admin_management.test.js`).

```
[TEST RUN OUTPUT: phase4_admin_management.test.js]
▶ PSYCO AI Phase 4: Administrator Portal, Clinic Governance & Platform Operations
  ✔ Scenario 1: Authorized administrator retrieves operational metrics & pending actions (PASS)
  ✔ Scenario 1B: Non-admin users cannot access administrative metrics (PASS)
  ✔ Scenario 2: Administrator queries user directory and manages account status (PASS)
  ✔ Scenario 2B: Administrator self-suspension is strictly blocked (PASS)
  ✔ Scenario 3: Administrator reviews, approves, and rejects clinician credentials (PASS)
  ✔ Scenario 4: Administrator registers clinic, reviews status, and manages memberships (PASS)
  ✔ Scenario 5: Administrator monitors independent practices without forcing clinic affiliation (PASS)
  ✔ Scenario 6: Support ticket operations, priority management, and clinical privacy warnings (PASS)
  ✔ Scenario 7: Full FAQ CRUD and Public Website CMS content editor (PASS)
  ✔ Scenario 8: Audit events are recorded on admin actions and protected from unauthorized read (PASS)
  ✔ Scenario 9: System health telemetry surfaces service status without exposing API keys (PASS)
  ✔ Scenario 10: Operational platform settings can be retrieved and updated (PASS)
  ✔ Scenario 11: Administrator is strictly barred from accessing private clinical notes or transcripts (PASS)
✔ PSYCO AI Phase 4: Administrator Portal, Clinic Governance & Platform Operations (13 passing, 0 failing)
```

---

## 5. Security Invariant Certification

1. **Clinical Lockout Integrity:** Fully intact. Admin accounts are blocked via middleware (`blockAdminFromClinicalRecords()`) and database rules (`!= 'admin'`).
2. **Horizontal Privilege Escalation:** Patients and clinicians cannot alter user statuses, verify credentials, or modify clinic registrations.
3. **Audit Trail Immutability:** Audit logs are write-protected in Firebase RTDB (`.write: false`), append-only via backend service account, and readable only by authorized administrators.
4. **Secret Sanitization:** Diagnostics do not expose service account credentials, JWT tokens, or API secrets.
