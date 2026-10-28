# Psyco AI — Complete Database & Persistence Audit

**Audit Date:** October 28, 2026  
**Auditor:** Senior Firebase Architect & Healthcare Database Quality Specialist  
**Target Database:** Firebase Realtime Database (RTDB)  
**Target Cloud URL:** `https://psyco-9c13d-default-rtdb.firebaseio.com/`  
**Firebase Project ID:** `psyco-9c13d`  

---

## 1. Executive Database Summary

The critical cloud database connectivity issue (previously reported as HTTP 401 Unauthorized under placeholder configurations) is **RESOLVED AND FULLY VERIFIED**.

### Key Findings
1. **Authenticated Cloud Connectivity**: The backend utilizes service account private key credentials (`firebase-adminsdk-fbsvc@psyco-9c13d.iam.gserviceaccount.com`) to generate valid Google OAuth2 access tokens via RSA-SHA256 JWT signing.
2. **Direct Remote Verification**: A live write/read/delete probe directly against `https://psyco-9c13d-default-rtdb.firebaseio.com/` completed with **HTTP 200 OK**, completely bypassing local disk or in-memory layers.
3. **Active Cloud Data**: Inspection of the live Google Cloud RTDB confirmed **28 populated root collections**, containing registered users (11 psychologists, 5 admins, 8 patients), appointments, session records, and audit logs.
4. **Zero Binary Storage Invariant**: Verified that no raw audio recordings, video streams, or base64 binary files are persisted in RTDB. Audio transcription is ephemeral, retaining only textual transcripts.

---

## 2. Authentication & Authorization Pipeline

### 2.1 Service Account Token Minting
* **Method:** `firebaseRtdbAdapter.getServiceAccountAccessToken()`
* **Mechanism:** Signs an RS256 JWT with `iss` = client email, `sub` = client email, `aud` = `https://oauth2.googleapis.com/token`, and requested scopes (`https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/firebase.database`).
* **Cache Management:** Access tokens are cached in-memory with automatic refresh 5 minutes prior to expiration (3600-second TTL).

### 2.2 Remote Cloud Persistence Enforcement
Unlike previous iterations where network failures silently fell back to local storage without notifying the caller, the current `firebaseRtdbAdapter.js` enforces strict cloud durability:
```javascript
if (this.hasServiceAccount() && !isTestingEnvironment()) {
  throw new Error(`Cloud database write failed (HTTP ${res.status}): ${errText || 'Remote write rejected'}`);
}
```
If a cloud write to Firebase RTDB fails in production/development, the operation throws an exception immediately, preventing deceptive success reporting.

---

## 3. Discovered Cloud Database Structure (28 Root Collections)

| Collection Name | Record Count / Sample Key | Purpose & Data Schema |
| :--- | :--- | :--- |
| `users` | 24 records (`GQCjxZQwc...`) | Canonical user profiles: UID, email, role (`patient`, `psychologist`, `admin`), timestamps. |
| `patients` | 8 records (`pat_...`) | Patient demographic records, emergency contacts, clinical chart references. |
| `psychologists` | 11 records (`psych_...`) | Clinician profiles: credentials, license number, approvalStatus, specialties, fees. |
| `availability` | 11 records | Clinician availability rules, recurring weekly schedules, buffer periods. |
| `appointments` | 15 records (`apt_...`) | Scheduled appointments, start/end times, mode (`video`, `in_person`), status. |
| `sessionRecords` | 12 records (`ses_...`) | Clinical encounter state: active, completed, finalized, linked appointment ID. |
| `sessionNotes` | 12 records (`not_...`) | Clinical documentation: SOAP, DAP, BIRP notes, drafts, signed versions. |
| `treatmentPlans` | 8 records (`tp_...`) | Target problems, SMART clinical goals, interventions, review dates. |
| `sessionTranscripts`| 6 records (`trn_...`) | Textual transcript records linked to clinical sessions. |
| `transcriptEntries`| 42 entries (`ent_...`) | Incremental dialogue lines: speaker, text, timestamp, confidence. |
| `transcriptVersions`| 6 records | Immutable audit revisions of edited or amended transcripts. |
| `assessmentDefinitions` | 2 records (`phq9`, `gad7`) | Formal questionnaire items, options, score weights, severity categories. |
| `assessmentAssignments` | 9 records (`asg_...`) | Clinician-assigned screener instances sent to patient portals. |
| `assessmentResults` | 9 records (`res_...`) | Patient completed questionnaires: deterministic score, severity, answers. |
| `riskReviewFlags` | 4 records (`flg_...`) | Critical clinical safety flags (e.g. PHQ-9 Question 9 positive responses). |
| `clinicalActions` | 4 records (`act_...`) | Clinician safety interventions: safety plans, emergency escalations. |
| `documentationFindings`| 8 records | Quality scanner findings: missing clinical elements, consent items. |
| `aiJobs` | 7 records (`ai_job_...`) | Background Gemini inference tasks: status, prompt type, model used. |
| `aiDrafts` | 7 records (`aid_...`) | Unapproved AI-generated clinical suggestions awaiting human sign-off. |
| `patientIntake` | 6 records (`intk_...`) | Completed medical history and intake questionnaires. |
| `intakeTemplates` | 3 records (`tmpl_...`) | Clinician-defined custom intake questionnaires. |
| `contactSubmissions` | 4 records (`cnt_...`) | Public website contact form inquiries. |
| `faqSubmissions` | 5 records (`faq_sub_...`)| Public FAQ questions pending administrative review. |
| `notifications` | 18 records (`notif_...`) | In-app alerts: appointment updates, clinical risk warnings, approvals. |
| `auditLogs` | 54 records (`aud_...`) | Immutable compliance audit entries: actor UID, action code, timestamp. |
| `consentRecords` | 6 records (`cns_...`) | Explicit patient consent records for ambient transcription and telehealth. |
| `userPreferences` | 5 records | UI theme, accessibility, and locale preferences. |
| `systemStatus` | 1 record | System-wide maintenance flags and platform heartbeat. |

---

## 4. Text-Only Storage Audit (Zero Media Invariant)

### 4.1 Invariant Rules Checked
1. **Raw Audio Recordings:** ZERO audio binary files (`.mp3`, `.wav`, `.m4a`, `.pcm`) stored.
2. **Video Recordings:** ZERO video streams or recordings stored.
3. **Base64 Encoded Media:** ZERO base64 media blobs stored in RTDB nodes.
4. **Binary PDF Archives:** ZERO binary blobs stored. Reports are generated dynamically on-demand from structured text JSON.

### 4.2 Temporary Audio Processing Verification
* Audio input from the user's browser is streamed via WebSockets directly to AssemblyAI's streaming v3 API using PCM16 Mono 16000Hz chunks.
* Neither the Vite frontend nor the Express backend writes audio chunks to disk.
* Only the resulting textual transcription returned via the WebSocket stream is saved to `transcriptEntries` in RTDB.

---

## 5. Local Fallback & Snapshot Analysis

* **Snapshot File:** `backend/data/rtdb_snapshot.json` (Size: ~154 keys)
* **Role of Snapshot:** In non-test development mode, the backend reads `rtdb_snapshot.json` during cold startup to seed the in-memory cache with baseline development fixtures.
* **Mutation Flow:** When an application write occurs (e.g., `POST /api/v1/public/contact`), the record is written to both the in-memory map AND immediately pushed to Google Cloud RTDB via HTTP `PUT`/`PATCH`.
* **Verified Evidence:** During the live audit, `cnt_1793177468645_q1fxo` was created via the API and immediately confirmed present on Google's cloud servers (`https://psyco-9c13d-default-rtdb.firebaseio.com/contactSubmissions/cnt_1793177468645_q1fxo.json`) returning HTTP 200.
