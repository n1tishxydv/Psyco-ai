# Psyco AI — Authorization & Access Control Matrix

**Version:** 1.0.0 (Phase 0 Foundation)  
**Roles:** `Patient`, `Psychologist`, `Administrator`  
**Enforcement Philosophy:** Defense-in-depth. Server-side token verification, role checks, and relationship-based resource authorization. The frontend is never the sole enforcement point.

---

## 1. Role Definitions

1. **Patient (`ROLE_PATIENT`)**: Individual accessing mental health services. Granted access strictly to self-owned profiles, personal intake surveys, appointments involving themselves, and clinician-published reports.
2. **Psychologist (`ROLE_PSYCHOLOGIST`)**: Licensed therapist or counselor managing practice operations. Granted broad clinical and scheduling control over self-owned practice assets, assigned patients, session records, and clinical documentation.
3. **Administrator (`ROLE_ADMIN`)**: Practice manager or platform administrator. Manages user status, psychologist verification, platform configurations, and operational audit trails. **Explicitly barred from unrestricted access to private patient clinical notes and transcripts.**

---

## 2. Resource-Level Permission Matrix

| Resource / Action | Patient | Psychologist | Administrator | Authorization Rules & Guards |
| :--- | :---: | :---: | :---: | :--- |
| **User Profile: View Self** | ✅ | ✅ | ✅ | `auth.uid == target.userId` |
| **User Profile: Edit Self** | ✅ | ✅ | ✅ | `auth.uid == target.userId` (excludes role field) |
| **User Profile: Suspend / Deactivate** | ❌ | ❌ | ✅ | Role `admin` only |
| **Psychologist Verification** | ❌ | ❌ | ✅ | Admin reviews credentials and approves status |
| **Psychologist Availability: Edit** | ❌ | ✅ | ❌ | Only the psychologist who owns the schedule |
| **Psychologist Availability: View** | ✅ | ✅ | ✅ | Publicly visible slots for booking |
| **Intake Survey: Submit / Edit** | ✅ | ❌ | ❌ | Patient submits self intake data |
| **Intake Survey: View** | ✅ (Self) | ✅ (Assigned) | ❌ | Clinician must be explicitly assigned to patient |
| **Appointment: Book** | ✅ | ✅ | ❌ | Patient books with psychologist or clinician schedules |
| **Appointment: Reschedule / Cancel** | ✅ (Self) | ✅ (Self) | ❌ | Subject to practice cancellation time window |
| **Appointment: View** | ✅ (Self) | ✅ (Self) | ✅ (Metadata) | Admin sees booking timestamps, not clinical context |
| **Session Notes (SOAP/DAP): Create** | ❌ | ✅ | ❌ | Assigned psychologist only |
| **Session Notes: Edit Draft** | ❌ | ✅ | ❌ | Authoring psychologist only while `isDraft == true` |
| **Session Notes: View Finalized** | ❌ | ✅ (Assigned) | ❌ | **Admin has NO access**. Patient has NO access. |
| **Session Notes: Sign / Lock** | ❌ | ✅ | ❌ | Immutable upon signature; updates require new version |
| **Session Transcripts: View** | ❌ | ✅ (Assigned) | ❌ | Patient must have signed active audio consent |
| **Treatment Plans: Create / Edit** | ❌ | ✅ | ❌ | Assigned psychologist only |
| **Treatment Plans: View** | ✅ (Shared) | ✅ (Assigned) | ❌ | Patient views only clinician-approved patient goals |
| **Diagnostic & Risk Screenings** | ❌ | ✅ (Assigned) | ❌ | Strictly clinician clinical judgment domain |
| **Audit Logs: Read** | ❌ | ❌ | ✅ | Administrative oversight; no PII or clinical notes |
| **Audit Logs: Write** | System | System | System | System-generated append-only logs |

---

## 3. Relationship-Based Access Control (ReBAC) Rules

Standard RBAC is insufficient for healthcare SaaS. Psyco AI layers Relationship-Based Access Control on top of role checks:

### Rule 1: Therapeutic Assignment Prerequisite
A psychologist cannot query patient records, past sessions, or intake responses unless a valid relationship exists in the database:
$$\text{Assigned}(\text{psychologistId}, \text{patientId}) = \text{true}$$

### Rule 2: Administrative Clinical Boundary
An Administrator account **never** bypasses the therapeutic assignment rule to read clinical records. If an administrator attempts to query `sessionNotes/{noteId}` or `sessionTranscripts/{sessionId}`, the backend returns `403 Forbidden` (`INSUFFICIENT_RESOURCE_PRIVILEGE`).

### Rule 3: Clinical Note Immutability & Versioning
Once a session note is marked `isDraft: false` and timestamped with `signedAt`:
* In-place modification is rejected.
* Any amendments create a new incremented version in `versionHistory`, capturing author, timestamp, and edit delta.

### Rule 4: Consent Verification for Transcription
Before AssemblyAI ambient transcription or audio capture can be initiated for a session:
* The system checks `consentRecords` for the patient ID where:
  - `consentType == "audio_transcription_consent"`
  - `granted == true`
  - `revocationDate == null`
* If consent is absent, session audio processing is rejected at the API gateway level.
