# PSYCO AI — PHASE 4 ARCHITECTURE ASSESSMENT
**Document Version:** 1.0.0  
**Status:** Complete & Approved  
**Author:** Psyco AI Principal Engineering & Cybersecurity Team  
**Date:** October 31, 2026  

---

## 1. Executive Summary

This architecture assessment evaluates the administrative and platform-governance subsystem of Psyco AI. Phases 1, 2, and 3 established a hardened security foundation (Phase 1), a high-trust patient onboarding and appointment scheduling experience (Phase 2), and an autonomous clinical practice workspace supporting independent, clinic-affiliated, and hybrid psychologists (Phase 3).

Phase 4 introduces an enterprise-grade **Administrator Platform Operations Workspace**. Its purpose is to equip platform administrators and clinical governance officers with unified tools to oversee users, verify professional credentials, manage clinic applications and memberships, supervise independent practice operations, resolve technical and administrative support requests, publish vetted FAQs and public CMS content, review immutable compliance audit logs, configure platform-level parameters, and monitor system integration health.

Crucially, Phase 4 strictly maintains the **Strict Clinical Privacy Barrier** (`ADMIN_CLINICAL_ACCESS_PROHIBITED`): administrators govern platform accounts and operational metadata, but are cryptographically and server-side barred from viewing psychotherapy session transcripts, private clinical notes (SOAP/DAP), psychiatric assessments, or clinical treatment plans.

---

## 2. Existing Administrative Subsystem & Baseline Inventory

### 2.1 Backend Route & Controller Baseline (`backend/src/routes/v1/admin.routes.js`)
Currently mounted under `/api/v1/admin` with `authenticateToken` and `requireRole(ROLES.ADMIN)`:
* `GET /metrics` -> Returns high-level counters (`totalUsers`, `patientCount`, `psychologistCount`, `pendingApprovals`, `activeAccounts`, `suspendedAccounts`, `totalAppointments`, `pendingFaqSubmissions`, `pendingContactSubmissions`).
* `GET /psychologists` -> Lists psychologist registrations with credentials (`licenseNumber`, `qualifications`, `experience`, `approvalStatus`).
* `POST /psychologists/:psychologistUid/review` -> Records credential approval or rejection with justification.
* `GET /users` -> Lists user directory filtered by search query and role (`patient`, `psychologist`, `admin`).
* `PATCH /users/:targetUid/status` -> Updates account status (`active`, `suspended`, `pending_verification`) with required administrative reason.
* `GET /faqs` & `POST /faqs` -> Lists and creates FAQ items.
* `PATCH /faqs/:faqId/publish` -> Toggles FAQ publication status.
* `GET /contact-submissions` & `PATCH /contact-submissions/:contactId` -> Ingests and updates public contact form submissions.
* `GET /audit-logs` -> Retrieves append-only compliance audit trail.

### 2.2 Security & Authorization Architecture (`backend/src/middleware/authorization.js`)
* **Role Immutability**: Three distinct roles are defined: `ROLES.PATIENT` ('patient'), `ROLES.PSYCHOLOGIST` ('psychologist'), and `ROLES.ADMIN` ('admin'). Role escalation via client-side requests is strictly rejected.
* **Clinical Record Lockout (`blockAdminFromClinicalRecords`)**: Returns HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED` whenever an administrator requests direct access to session notes, therapy transcripts, or intake questionnaires.
* **Credential Verification Gate (`requireVerifiedPsychologist`)**: Ensures only verified psychologists (`approvalStatus: 'approved'`) can access clinical sessions, appointments, and treatment plans.
* **Relationship-Based Access Control (ReBAC)**: Cross-clinician chart isolation ensures unassigned clinicians cannot view records of patients outside their therapeutic relationship.

### 2.3 Database Architecture (`database.rules.json` & RTDB Schema)
* **Storage Policy**: 100% Firebase Realtime Database (RTDB). Zero binary media policy (no raster photos, audio files, or binary uploads; text/JSON only).
* **Rule Hardening**: Client SDK direct reads of `sessionNotes`, `sessionTranscripts`, `transcriptEntries`, `aiDrafts`, `assessmentResults`, and `assessmentAssignments` explicitly check:
  `root.child('users').child(auth.uid).child('role').val() != 'admin'`
* **Audit Trail**: Node `/auditLogs` has `.write: false` to enforce append-only updates via the backend Firebase Admin SDK.

### 2.4 Existing Frontend Console (`frontend/src/features/admin/AdminDashboard.jsx`)
* Contains a single monolith file with tab state: `overview` (Clinician Approvals), `users` (User Directory), `faqs` (FAQ Moderation), `contacts` (Contact Inquiries), and `audit` (Audit Trail).
* Uses basic browser dialogs (`prompt()`, `confirm()`) for status updates and lacks dedicated sections for Clinic Administration, Independent Practice Oversight, Support Ticket Workflows, System Health Integration, and Platform Settings.

---

## 3. Current Limitations & Gap Analysis

| Subsystem Area | Current State | Missing Capability / Gap | Phase 4 Requirement |
| :--- | :--- | :--- | :--- |
| **Dashboard Executive View** | Basic 5-card metric row; no health overview. | Lacks pending action aggregation, clinic metrics, practice status breakdown, and incident indicators. | Comprehensive operations console with unified pending action queues and live health widgets. |
| **User Governance** | Flat table; basic prompt for suspension. | No account detail inspection drawer, no self-suspension guard, no pagination, sorting, or multi-attribute filtering. | Full governance console with account inspection modal, self-suspension guard, search, and audit trail. |
| **Psychologist Verification** | Basic approve/reject list. | No filter by application status (`pending`, `under_review`, `approved`, `rejected`, `suspended`), no credential verification checklist. | Dedicated 5-state credential review workspace with decision modal, reason capture, and practitioner suspension. |
| **Clinic Management** | Clinics exist in backend `practices` table, but admin has no management view. | No clinic registration queue, no clinic status toggle (`pending`, `active`, `suspended`), no membership review. | Complete Clinic Management module with clinic directory, registration approvals, and membership governance. |
| **Independent Practices** | Self-managed by clinicians in Phase 3. | Admins cannot monitor independent practice metadata, consultation modes, or physical locations. | Independent Practice Oversight view with activation tracking and operational status governance. |
| **Support Tickets** | Basic contact submissions inbox with freeform status text. | No ticketing categories, no priority levels (`urgent`, `high`, `normal`), no assignment, no reply history, no clinical privacy warning. | Professional Support Ticket workspace with categories, priorities, assignment, reply threads, and sanitization. |
| **FAQ & Public CMS** | Simple FAQ creation and toggle. | Cannot edit FAQ text, cannot reorder, cannot delete/archive; no CMS for public pages (About, How It Works, Announcements). | Full FAQ CRUD with drag/order support, publication workflow (`draft`/`published`), and website CMS integration. |
| **System Health & Monitoring** | Basic `/health` endpoint exists in backend; not surfaced in admin UI. | Admins have no UI to inspect Firebase readiness, Gemini/AssemblyAI connectivity, or Google Calendar sync status. | Real-time System Health console showing status (`HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `NOT_CONFIGURED`) without secret leaks. |
| **Platform Settings** | Hardcoded environment variables only. | Admins cannot configure platform parameters (branding, appointment buffer, registration policy, maintenance mode). | Dedicated Platform Settings module persisted in `/platformSettings` with audit trails. |
| **Role & Permission Granularity** | Generic `admin` role check. | Need clean boundary between Platform Administrator, Clinic Manager, Clinician, and Patient. | Explicit backend permission scopes and ReBAC enforcement preserving clinical lockout. |

---

## 4. Phase 4 Target Architecture & Design Principles

### 4.1 Principle 1: Absolute Clinical Privacy
Platform administrators possess operational sovereignty over user accounts, clinic organizations, and platform settings. However, under no circumstances may an administrative account view:
1. Patient psychotherapy transcripts or recording text.
2. SOAP/DAP session notes.
3. Patient intake medical/psychiatric questionnaires.
4. Active treatment plans or clinical diagnoses.
5. Psychological assessment instruments (e.g., PHQ-9, GAD-7 individual item responses).

The backend middleware `blockAdminFromClinicalRecords` and database rule `!= 'admin'` remain strictly non-negotiable.

### 4.2 Principle 2: Zero Binary Media Persistence
Consistent with Phases 1–3, Psyco AI enforces zero persistence of raster images (JPEG, PNG), audio files (MP3, WAV), or binary documents. Clinician avatars use SVG/CSS initials avatars (`InitialsAvatar`). Clinical verification uses structured textual metadata (license number, issuing board, qualification dates) rather than scanned PDF/image uploads.

### 4.3 Principle 3: Single Source of Truth in Firebase RTDB
All administrative entities (`users`, `psychologists`, `practices`, `clinicApplications`, `practiceMemberships`, `supportTickets`, `supportReplies`, `faqs`, `publicContent`, `auditLogs`, `platformSettings`) reside in Firebase Realtime Database. No Firestore migrations or external unvetted databases.

### 4.4 Principle 4: Append-Only Immutable Auditing
Every state transition performed by an administrator—user suspension, credential approval, clinic authorization, practice status update, support resolution, FAQ publishing, or platform configuration change—is logged with:
`{ eventId, actorUid, actorRole, action, targetType, targetId, timestamp, outcome, reason, safeMetadata }`.
Audit logs are write-protected against deletion or modification.

---

## 5. Architectural Components & Endpoint Specification

### 5.1 Platform Administration Endpoints (`/api/v1/admin/*`)

| Endpoint | Method | Description | Access Control |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/metrics` | `GET` | Aggregated operational telemetry & pending action counters | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/users` | `GET` | User directory with search, role, status filters, and pagination | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/users/:targetUid/status` | `PATCH` | Update account status (`active`, `suspended`, `disabled`) with reason | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/psychologists` | `GET` | Clinician applications directory with status filtering | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/psychologists/:psychologistUid/review` | `POST` | Approve, reject, or suspend clinician credentials | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/clinics` | `GET` | List registered clinics and pending clinic applications | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/clinics` | `POST` | Register a new clinic organization | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/clinics/:clinicId/status` | `PATCH` | Approve, reject, or suspend clinic organization | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/clinics/memberships` | `GET` | List clinician membership requests across clinics | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/clinics/memberships/:membershipId` | `PATCH` | Approve, reject, or revoke clinic membership | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/practices` | `GET` | Oversight directory of independent practices | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/practices/:practiceId/status` | `PATCH` | Update independent practice status (`active`, `suspended`) | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/support/tickets` | `GET` | Support ticket queue with search, category, and status filters | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/support/tickets/:ticketId` | `GET` | Retrieve single ticket with message history and notes | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/support/tickets/:ticketId` | `PATCH` | Update ticket status, priority, or assignee | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/support/tickets/:ticketId/replies` | `POST` | Add administrative response or internal note | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/faqs` | `GET` | List all FAQs with draft and published statuses | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/faqs` | `POST` | Create a new FAQ entry | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/faqs/:faqId` | `PUT` | Update question, answer, category, or order | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/faqs/:faqId` | `DELETE` | Archive or remove an FAQ entry | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/faqs/:faqId/publish` | `PATCH` | Toggle publish state (`published: true/false`) | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/content` | `GET` | List managed public CMS sections | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/content/:sectionKey` | `PUT` | Update public CMS section content | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/audit-logs` | `GET` | Query compliance audit records with filters & pagination | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/system-health` | `GET` | Inspect operational readiness of integrations & services | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/settings` | `GET` | Retrieve current platform settings | `requireRole(ROLES.ADMIN)` |
| `/api/v1/admin/settings` | `PUT` | Update platform operational settings | `requireRole(ROLES.ADMIN)` |

---

## 6. Realtime Database Schema Additions & Data Governance

```
/
├── clinics/
│   └── {clinicId}/
│       ├── id: string
│       ├── name: string
│       ├── organizationType: "hospital" | "private_group" | "wellness_center"
│       ├── primaryContact: string
│       ├── email: string
│       ├── phone: string
│       ├── address: { line1, city, state, postalCode }
│       ├── status: "pending" | "active" | "suspended" | "rejected"
│       ├── registeredBy: string (uid)
│       ├── reviewedBy: string (adminUid)
│       ├── createdAt: ISOString
│       └── updatedAt: ISOString
│
├── supportTickets/
│   └── {ticketId}/
│       ├── id: string
│       ├── ticketNumber: string (e.g. "TKT-1042")
│       ├── userUid: string | null
│       ├── userEmail: string
│       ├── userName: string
│       ├── category: "account_access" | "registration" | "psychologist_verification" | "appointment_problems" | "technical_difficulties" | "general_assistance"
│       ├── priority: "low" | "normal" | "high" | "urgent"
│       ├── status: "new" | "open" | "in_progress" | "waiting_user" | "resolved" | "closed"
│       ├── subject: string
│       ├── message: string
│       ├── assignedTo: string (adminUid) | null
│       ├── replies: [ { id, senderUid, senderRole, message, isInternal, createdAt } ]
│       ├── createdAt: ISOString
│       └── updatedAt: ISOString
│
├── publicContent/
│   └── {sectionKey}/
│       ├── sectionKey: "about_us" | "how_it_works" | "announcements" | "contact_info"
│       ├── title: string
│       ├── content: string | object
│       ├── updatedAt: ISOString
│       └── updatedBy: string (adminUid)
│
├── platformSettings/
│   ├── platformName: string
│   ├── supportEmail: string
│   ├── supportPhone: string
│   ├── defaultTimezone: string
│   ├── defaultAppointmentDuration: number
│   ├── defaultBufferTime: number
│   ├── allowPatientRegistration: boolean
│   ├── allowClinicianRegistration: boolean
│   ├── requireCredentialVerification: boolean
│   ├── maintenanceMode: boolean
│   ├── maintenanceAnnouncement: string
│   ├── updatedAt: ISOString
│   └── updatedBy: string (adminUid)
```

---

## 7. Implementation Plan & Work Breakdown

1. **Step 1: Backend Service Expansion**
   * Enhance `admin.service.js` with methods for clinics, memberships, practices, support tickets, public CMS, system health telemetry, and platform settings.
   * Add input validation schemas in `admin.validators.js` using Zod.
   * Add controller handlers in `admin.controller.js` and mount routes in `admin.routes.js`.

2. **Step 2: Database Rules Update**
   * Add secure rules for `/clinics`, `/supportTickets`, `/publicContent`, and `/platformSettings` in `database.rules.json`.
   * Re-verify that clinical notes and session transcripts remain strictly locked out from `admin`.

3. **Step 3: Frontend Admin Service & Workspace**
   * Expand `adminService.js` to support all new API routes.
   * Redesign `AdminDashboard.jsx` into a high-density, professional SaaS administration console with responsive 10-tab navigation:
     1. `overview` — Platform telemetry, pending queues, and system health status.
     2. `users` — User directory with search, filter, status toggles, and detail drawer.
     3. `psychologists` — Clinician credential verification queue with approval modals.
     4. `clinics` — Clinic directory, registration approvals, and membership management.
     5. `practices` — Independent practice oversight and status management.
     6. `support` — Support ticket management with priority, assignment, and reply threads.
     7. `faqs` — FAQ moderation, reordering, creation, and CMS content editor.
     8. `audit` — Compliance audit trail with filters, actor search, and pagination.
     9. `health` — Real-time integration diagnostic dashboard.
     10. `settings` — Operational configuration editor with persistence.

4. **Step 4: Automated Testing**
   * Create `backend/src/tests/phase4_admin_management.test.js` validating all 10 scenarios.
   * Verify all 188 existing tests continue to pass.
   * Run staging frontend build and `git diff --check`.

5. **Step 5: Documentation Deliverables**
   * `docs/phase4/PHASE_4_ARCHITECTURE_ASSESSMENT.md` (this document)
   * `docs/phase4/PHASE_4_IMPLEMENTATION_REPORT.md`
   * `docs/phase4/PHASE_4_ADMINISTRATOR_GUIDE.md`
   * `docs/phase4/PHASE_4_AUTHORIZATION_TEST_MATRIX.md`
