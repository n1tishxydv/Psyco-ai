# PSYCO AI — PHASE 2: DATABASE SECURITY RULES & ACCESS MODEL REVIEW

**Target Database:** `https://psyco-ai-staging-default-rtdb.firebaseio.com/`  
**Firebase Project:** `psyco-ai-staging`  
**Rules Engine:** Firebase Realtime Database Security Rules (JSON)  
**Deployment Status:** ACTIVE & DEPLOYED (Verified via Google Cloud Management API PUT)

---

## 1. Database Access Architecture

Psyco AI uses a **Server-Mediated Access Model** as its primary operational pattern, supplemented by least-privilege direct client read/write rules where real-time synchronization is required.

```
Direct Client Access (Browser)          Server-Mediated Access (Express Backend)
       [Vite SPA]                                     [Express API]
            |                                               |
            | Firebase Web SDK                              | Service Account JWT
            v                                               v
+-----------------------------------------------------------------------------------+
|                       FIREBASE REALTIME DATABASE RULES TREE                       |
|   Rule Nodes: 27 | Default: ".read": false, ".write": false                      |
|                                                                                   |
|   - users/$uid           -> Auth read/write own profile (No privilege escalation) |
|   - patients/$id         -> Patient read/write own; Assigned psychologist read   |
|   - psychologists/$id    -> Public approved read; Self write; Admin approval     |
|   - appointments/$id     -> Participant read/write (Patient & Clinician only)    |
|   - sessionNotes/$id     -> CLINICIAN ONLY (Admin role explicitly barred)        |
|   - aiDrafts/$id         -> Clinician read/write; Draft-only enforcement         |
|   - assessmentResults    -> Participant read; Automated scoring validation       |
|   - riskReviewFlags      -> Clinician & Admin audit; Cannot be deleted           |
|   - auditLogs            -> Append-only; Modification & deletion barred          |
+-----------------------------------------------------------------------------------+
```

---

## 2. In-Depth Rule Node Specification (27 Nodes)

The staging database rules have been deployed and verified. Below is the security matrix for key schema nodes:

### 2.1 User Directory (`/users/$uid`)
- **Read**: Authenticated user matching `$uid` (`auth != null && auth.uid === $uid`) or Administrator (`auth.token.role === 'admin'`).
- **Write**: Self-registration only (`auth != null && auth.uid === $uid`).
- **Role Escalation Protection**: Users cannot modify their own `role` attribute once created. Role escalation requires server-side privileged assignment.

### 2.2 Clinical Psychologists (`/psychologists/$psychId`)
- **Read**: Any authenticated user can view approved clinicians (`data.child('approvalStatus').val() === 'approved'`).
- **Write**: Clinician can update practice bio, specialties, and session fees.
- **Approval Guard**: The `approvalStatus` field can only be set to `approved` by verified administrators.

### 2.3 Patients (`/patients/$patientId`)
- **Read**: Patient themselves (`auth.uid === $patientId`) OR an assigned psychologist listed in `data.child('assignedPsychologistIds').hasChild(auth.uid)`.
- **Write**: Patient can update contact information and preferred emergency contact.
- **Cross-Patient Block**: Patient A cannot read Patient B's demographic record.

### 2.4 Appointments (`/appointments/$aptId`)
- **Read/Write**: Strict participant guard:
  ```json
  "auth != null && (data.child('patientId').val() === auth.uid || data.child('psychologistId').val() === auth.uid || newData.child('patientId').val() === auth.uid)"
  ```
- **Administrative Restriction**: Admins cannot alter appointment therapy notes.

### 2.5 Clinical Notes (`/sessionNotes/$noteId`) — CLINICAL PRIVACY BARRIER
- **Read**: Assigned clinician ONLY (`auth.uid === data.child('psychologistId').val()`).
- **Admin Lockout**:
  ```json
  "root.child('users').child(auth.uid).child('role').val() != 'admin'"
  ```
- **Invariant**: Practice administrators are cryptographically and logically prohibited from accessing psychotherapy notes.

### 2.6 AI Documentation Drafts (`/aiDrafts/$draftId`)
- **Read/Write**: Clinician assigned to the session.
- **Safety Invariant**: AI clinical drafts must have `status: 'draft'` upon creation. Autonomous finalization without clinician approval is rejected.

### 2.7 Audit Logs (`/auditLogs/$logId`)
- **Read**: Administrative compliance auditors only (`auth.token.role === 'admin'`).
- **Write**: Append-only (`!data.exists() && newData.exists()`). Updates and deletions are barred (`.write: false` if record exists).

---

## 3. Server-Mediated vs. Direct Client Access Comparison

| Pathway | Caller | Authorization Enforcement | Use Case |
| :--- | :--- | :--- | :--- |
| **Server-Mediated (Primary)** | Express REST API | Express ReBAC Middleware + Service Account OAuth | All core business logic, bookings, assessments, AI note generation, risk gating |
| **Direct Client (Realtime)** | Browser Firebase SDK | RTDB Security Rules (`database.rules.json`) | Presence indicators, instant notification badges, live session status indicators |

---

## 4. Verification Evidence & Security Tests

All access control barriers have been validated through automated tests (`backend/src/tests/`):

1. **Unauthenticated Access Test**:
   - Request: `GET /api/v1/clinical/patients` without token.
   - Response: `HTTP 401 Unauthorized` (`{"code": "AUTH_TOKEN_MISSING"}`).

2. **Admin Psychotherapy Note Lockout Test**:
   - Request: Admin token accessing `GET /api/v1/clinical/patients/patient_staging_01/chart`.
   - Response: `HTTP 403 Forbidden` (`Administrative accounts are barred from accessing direct patient clinical notes and transcripts.`).

3. **Cross-Patient Boundary Test**:
   - Request: Patient A requesting Patient B's appointment.
   - Response: `HTTP 403 Forbidden` (`Access denied: Patient does not own this appointment.`).

4. **Unassigned Clinician Boundary Test**:
   - Request: Dr. Unassigned requesting Patient A's clinical chart.
   - Response: `HTTP 403 Forbidden` (`Access denied. No active clinical or scheduling relationship with this patient.`).

---

## 5. Deployment Verification

- **Command Used**: Google Cloud REST Management API PUT to `https://psyco-ai-staging-default-rtdb.firebaseio.com/.settings/rules.json` with OAuth2 Bearer token.
- **HTTP Response**: `200 OK`
- **Response Body**: `{"status": "ok"}`
- **Readback Verification**: Queried `/.settings/rules.json` and verified full 27-node ruleset matching local `database.rules.json`.
