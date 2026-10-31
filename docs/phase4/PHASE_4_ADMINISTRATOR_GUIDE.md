# PSYCO AI — PHASE 4 ADMINISTRATOR GUIDE
**Platform Governance, Operations, and Clinical Credential Verification**  
**Document Version:** 1.0.0  
**Target Audience:** Platform Administrators, Operations Leads, Clinical Governance Officers  
**Date:** October 31, 2026  

---

## 1. Introduction & Overview

Welcome to the **Psyco AI Platform Operations Console**. Psyco AI is an enterprise mental health technology platform providing clinical practice management, appointment scheduling, and AI-assisted workflows for licensed psychologists and their patients.

As a platform administrator, you hold operational sovereignty over accounts, organizational registrations, support requests, and platform settings. However, to safeguard confidential patient relationships and comply with healthcare data privacy laws, Psyco AI enforces an unyielding **Clinical Privacy Boundary**:
> **Important Privacy Notice:** Platform administrators do not have access to private psychotherapy session transcripts, psychiatric assessment scores, confidential SOAP/DAP progress notes, or clinical intake questionnaires. The console is engineered exclusively for platform management, not clinical surveillance.

---

## 2. Access & Authentication

* **Console URL (Staging):** `https://psyco-ai-staging.web.app/admin`
* **Credentials:** Administrator access requires an authenticated Firebase account with `role: 'admin'` assigned in the authoritative `/users/{uid}` database node.
* **Role Immutability:** Roles cannot be escalated from the client side. Any attempt to modify a user's role without server-side provisioning is rejected.
* **Self-Suspension Protection:** The system strictly prevents administrators from suspending their own accounts to avoid administrative deadlocks.

---

## 3. Operational Console Modules

The console is organized into 10 specialized modules accessible from the main navigation bar:

```
[Overview]  [Users]  [Clinician Approvals]  [Clinics]  [Independent Practices]
[Support & Tickets]  [FAQs & CMS]  [Audit Trail]  [System Health]  [Settings]
```

### 3.1 Overview (Executive Telemetry & Action Queues)
* **Metric Cards:** Real-time counters showing total users, registered patients, clinicians, pending credential reviews, registered clinics, active independent practices, and open support tickets.
* **Pending Action Direct Queue:** Aggregated list of items requiring immediate administrative action (clinician applications, clinic registrations, membership requests, urgent support inquiries). Clicking **"Review"** navigates directly to the relevant screen.
* **System Health Snapshot:** At-a-glance indicators for the backend API, Firebase RTDB, Gemini AI, AssemblyAI, and Google Calendar.

---

### 3.2 User Directory & Governance
Use this screen to manage patient, clinician, and administrator accounts.

* **Search:** Filter accounts in real time by name, email address, or unique UID.
* **Filter by Role:** View `All Roles`, `Patients`, `Psychologists`, or `Administrators`.
* **Filter by Status:** View `All Statuses`, `Active`, `Pending Verification`, or `Suspended`.
* **Account Details:** Click **"Details"** to inspect registration date, last update timestamp, and status history.
* **Suspending an Account:**
  1. Click **"Suspend"** next to the user account.
  2. A confirmation modal will appear.
  3. **Mandatory Justification:** Type an administrative rationale (e.g., `"Security hold pending identity verification"`).
  4. Click **"Confirm Account Suspension"**. The user's authenticated sessions will be invalidated immediately.
* **Reactivating an Account:** Click **"Reactivate"** to restore account access.

---

### 3.3 Clinician Credential Verification (SOP)
Verifying clinician credentials is one of the most critical governance responsibilities on Psyco AI. Unverified clinicians cannot accept patient bookings or access clinical charts.

#### Verification Procedure:
1. Navigate to **Clinician Approvals**.
2. Select the **"Pending Review"** filter tab.
3. Review the applicant's card:
   * **Full Name & Contact Email**
   * **State / National License Number** (e.g., `PSY-KA-2024-8841`)
   * **Qualifications & Degrees**
   * **Years of Clinical Experience**
   * **Prescriber Authority Status** (psychiatric credentialing)
   * **Clinical Bio & Specializations**
4. Check the license number against the authoritative regional licensing registry (e.g., State Psychological Board or National Health Register).
5. **To Approve:**
   * Click **"Approve Credentials"**.
   * Confirm the prompt. The clinician's status updates to `approved`, enabling their public directory listing and appointment booking.
6. **To Reject:**
   * Click **"Reject"**.
   * Document the specific rationale (e.g., `"License number expired; unable to verify with state licensing board"`).
   * Confirm the rejection.
7. **To Suspend a Verified Practitioner:**
   * If a complaint or disciplinary action occurs, click **"Suspend Credentials"** and record the formal reason.

---

### 3.4 Clinic Organization Management
Psyco AI supports institutional clinics (private group practices, hospital departments, and outpatient wellness centers).

* **Registering a New Clinic:**
  1. Click **"+ Register New Clinic"**.
  2. Fill in: Clinic Name, Organization Type, Primary Contact Person, Official Email, Phone, and Address.
  3. Click **"Register Clinic"**. The clinic is immediately provisioned in both `clinics` and `practices` nodes.
* **Clinic Status Management:** Use **"Suspend Clinic"** or **"Activate Clinic"** to manage operational status.
* **Clinic Memberships:**
  * View clinician requests to affiliate with registered clinics.
  * Click **"Approve"** to authorize the clinician to conduct sessions under the clinic's practice context.
  * Click **"Reject"** or **"Revoke"** to manage access.

---

### 3.5 Independent Practice Oversight
Psyco AI allows licensed psychologists to operate autonomously without requiring a clinic affiliation.

* **Metadata Inspected:** Practice name, clinician owner, offered consultation modes (`online`, `in_person`, `both`), physical office location count, default session duration, and buffer time.
* **Practice Suspension / Reinstatement:** If an independent clinician requests a temporary sabbatical or is subject to a review, administrators can toggle practice status without affecting their underlying profile.

---

### 3.6 Support Tickets & Inquiries
The Support workspace unifies public contact inquiries and user support requests into a structured ticketing system.

* **Ticket Attributes:** Priority (`urgent`, `high`, `normal`, `low`), Category (`account_access`, `registration`, `psychologist_verification`, `appointment_problems`, `technical_difficulties`, `general_assistance`), and Status (`new`, `open`, `in_progress`, `waiting_user`, `resolved`, `closed`).
* **Viewing a Ticket:** Click on any ticket to open the full conversation thread.
* **Replying to a User:** Type your message in the composer and click **"Send Reply"**. The ticket status automatically shifts to `waiting_user`.
* **Internal Administrative Notes:** Check **"Internal Note Only"** before submitting to log investigative notes invisible to the user.
* **Clinical Boundary Warning:** Never ask users to paste private medical history or psychotherapy notes into support tickets.

---

### 3.7 FAQ Moderation & Public Website CMS
Manage the informational content displayed to prospective patients and clinicians on the public website.

* **Authoring a New FAQ:**
  1. Click **"+ Create New FAQ"**.
  2. Input the Question, Category, Display Order, and authoritative Answer.
  3. Click **"Publish FAQ"**. The item appears immediately on the public `/faq` page.
* **Editing an FAQ:** Click the edit icon to modify question text, answer phrasing, or category.
* **Draft vs. Published:** Use **"Publish"** / **"Unpublish"** to stage FAQs before making them visible.
* **Public CMS Sections:** Use the CMS editor to update About Us, How It Works, and System Announcements without modifying frontend code.

---

### 3.8 Immutable Compliance Audit Trail
Every administrative action is cryptographically recorded in an append-only audit trail in the `/auditLogs` node.

* **Events Monitored:**
  * `USER_SUSPENDED`, `USER_REACTIVATED`
  * `PSYCHOLOGIST_APPROVED`, `PSYCHOLOGIST_REJECTED`, `PSYCHOLOGIST_SUSPENDED`
  * `CLINIC_CREATED`, `CLINIC_STATUS_UPDATED`, `CLINIC_MEMBERSHIP_REVIEWED`
  * `INDEPENDENT_PRACTICE_STATUS_UPDATED`
  * `SUPPORT_TICKET_UPDATED`, `SUPPORT_TICKET_REPLIED`
  * `FAQ_PUBLISHED`, `FAQ_UPDATED`, `FAQ_DELETED`
  * `PLATFORM_SETTINGS_UPDATED`
* **Search & Filters:** Search by actor UID or filter by event type.
* **Data Protection:** Passwords, API keys, session tokens, and clinical notes are strictly redacted from audit payloads.

---

### 3.9 System Diagnostics & Integration Monitoring
Inspect the real-time operational health of platform dependencies.

* **Monitored Services:**
  1. **Express Backend Core:** Liveness, uptime, process PID.
  2. **Firebase RTDB:** Connection state, security rule status, project alignment.
  3. **Firebase Authentication:** Public key caching status and signature verification.
  4. **Google Gemini Clinical Copilot:** API connectivity and model configuration.
  5. **AssemblyAI Transcription:** Transcription pipeline operational readiness.
  6. **Google Calendar API & Meet:** OAuth token synchronization.
  7. **Background Worker:** Asynchronous job queue status.
* **Status Badges:** `HEALTHY` (Green), `DEGRADED` (Amber), `NOT_CONFIGURED` (Neutral).
* **Secret Protection:** Private keys and tokens are never shown on this interface.

---

### 3.10 Platform Operational Settings
Configure global platform parameters persisted directly to the `/platformSettings` node:

* **Branding & Support:** Platform Brand Name, Support Email, Support Phone, Default Timezone.
* **Appointment Defaults:** Default session duration (e.g., 50 minutes) and default buffer time (e.g., 10 minutes).
* **Registration Governance:** Toggles to allow/disable public patient registration and clinician onboarding.
* **Credential Verification Gate:** Enforce mandatory verification before any clinician can receive appointments.
* **Maintenance Banner:** Enable a public notification banner across the website with a custom announcement message.

---

## 4. Frequently Asked Questions (Security & Operations)

#### Q: Can I view a patient's psychotherapy session transcript if they file a complaint?
**A:** No. Under the ReBAC privacy model, session transcripts and clinical notes are accessible solely by the treating psychologist and authorized patient. Administrators receive HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED` on all clinical endpoints. Complaints should be handled through formal administrative inquiries without compromising session confidentiality.

#### Q: Can an unverified psychologist start offering appointments?
**A:** No. The scheduling engine validates `verified === true` and `approvalStatus === 'approved'`. Unverified clinicians cannot accept appointments or access the clinical documentation workspace.

#### Q: How do I recover if I accidentally suspend an account?
**A:** Search for the user in the **Users** directory, filter by `Suspended`, and click **"Reactivate"**. All account privileges are restored immediately.
