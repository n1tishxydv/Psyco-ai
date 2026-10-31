# Psyco AI — Data Privacy Architecture & Technical Specification

**Document Reference:** `PSYCO-LEGAL-003`  
**Classification:** `READY FOR LEGAL REVIEW`  
**Version:** `1.0.0-staging`  
**Effective Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app` / `https://psyco-ai.onrender.com`)  
**Database URL:** `https://psyco-ai-staging-default-rtdb.firebaseio.com/`  
**Production Isolation Guard:** `psyco-9c13d` strictly isolated  

---

## 1. Architectural Invariants

Psyco AI is engineered to satisfy three core technical invariants:

```
+--------------------------------------------------------------------------------+
|                        PSYCO AI CORE ARCHITECTURAL INVARIANTS                   |
+--------------------------------------------------------------------------------+
| 1. ZERO BINARY MEDIA INVARIANT                                                 |
|    - Permanent storage contains structured text & JSON only.                   |
|    - Zero permanent audio, video, or image files stored on disk or RTDB.       |
|                                                                                |
| 2. ADMINISTRATIVE CLINICAL LOCKOUT                                             |
|    - Administrators mathematically barred from clinical records.               |
|    - Enforced via Express middleware (403) and Firebase RTDB rules.            |
|                                                                                |
| 3. HUMAN-IN-THE-LOOP (HITL) AI COPILOT                                        |
|    - AI drafts require explicit licensed clinician digital signature.          |
|    - No autonomous psychiatric diagnosis or pharmaceutical prescribing.        |
+--------------------------------------------------------------------------------+
```

---

## 2. Technical Stack Specification

### 2.1 Frontend Client Tier
- **Framework:** React 18, Vite 6, Tailwind CSS.
- **Routing & State:** React Router v6 with lazy-loaded code-split chunks for clinical and admin features.
- **Token Handling:** Silent token renewal interceptor with concurrency locking to prevent 401 loops.

### 2.2 Backend API Tier
- **Runtime:** Node.js with Express framework deployed on Render container service.
- **Validation:** Strict request parsing via Zod schemas (`backend/src/validators/`).
- **Security Middleware:** Helmet (CSP, HSTS, frame-guard), CORS, tiered express-rate-limit.
- **Error Handling:** Centralized Express error handler sanitizing internal stack traces from public responses.

### 2.3 Authoritative Database
- **Engine:** Firebase Realtime Database (`psyco-ai-staging`).
- **Data Model:** Normalized JSON nodes partitioned by user ID and entity reference keys.
- **Rules Enforcement:** Cryptographically enforced access rules in `database.rules.json`.

---

## 3. Access Control Architecture

### 3.1 Dual-Tier Security: RBAC + ReBAC

1. **Role-Based Access Control (RBAC):** Users are categorized into `patient`, `psychologist`, or `admin`.
2. **Relationship-Based Access Control (ReBAC):** A psychologist cannot query patient records unless an explicit therapeutic relationship exists via `assignedPsychologistIds`.

### 3.2 Administrative Clinical Lockout Implementation
- **API Middleware:** `requireClinicalRole` rejects administrators with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`.
- **Database Rules:** `sessionNotes`, `sessionTranscripts`, and `patientIntake` explicitly evaluate `root.child('users').child(auth.uid).child('role').val() != 'admin'`.

---

## 4. AI & Transcription Data Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Clinician as Treating Psychologist
    actor Patient as Patient
    participant Client as Web Client
    participant API as Backend API
    participant Speech as AssemblyAI Streaming v3
    participant LLM as Google Gemini (AI Studio Developer API)
    participant RTDB as Firebase RTDB

    Patient->>Client: Electronic Consent Granted
    Clinician->>Client: Activate Ambient Transcription
    Note over Client,Speech: Audio streamed over TLS 1.2+ WSS (RAM buffer)
    Client->>Speech: Stream PCM Chunks to wss://streaming.assemblyai.com/v3/ws
    Speech-->>Client: Return Derived Transcript Text Packets
    Note over Speech: Ephemeral processing in RAM; zero retention if account opted out of training
    Note over Client: Client purges audio buffer from RAM immediately
    Client->>API: Submit Transcript Text (No audio binary)
    API->>LLM: Send Structured SOAP Prompt via TLS 1.2+ HTTPS
    Note over LLM: Google AI Studio API: Non-training under paid billing; free tier logs
    LLM-->>API: Return Preliminary SOAP Draft
    API->>RTDB: Save Draft (/aiDrafts, status: 'draft')
    Clinician->>Client: Review & Edit SOAP Draft
    Clinician->>API: Apply Digital Signature (License + Timestamp)
    API->>RTDB: Finalize Note (/sessionNotes, status: 'signed')
```

### 4.1 Speech Processing & Zero Data Retention (ZDR) Contract Mandate
- **Actual Integrated Endpoint:** Psyco AI utilizes AssemblyAI **Streaming v3** (`wss://streaming.assemblyai.com/v3/ws`) via ephemeral session tokens generated by `https://streaming.assemblyai.com/v3/token`. It does **not** use AssemblyAI's asynchronous prerecorded file transcription API (`/v2/transcript`).
- **Streaming Retention vs. Asynchronous:** Vendor technical documentation indicates that the Streaming API operates ephemerally in RAM and provides **zero audio and transcript retention** when the customer account has actively opted out of model training, retaining only minimal connection metadata for logging and billing. The standard 30-day asynchronous file retention policy does not apply to streaming.
- **No Presumption of Opt-Out:** Psyco AI does not presume that account-level opt-out has been toggled, nor does it claim an executed enterprise Zero Data Retention (ZDR) addendum or Business Associate Agreement (BAA) without documentary proof.
- **Mandatory Pilot Rule:** Real clinical audio from actual patients must NOT be processed during the staging pilot. Only synthetic test audio is authorized until processor configuration, account-level opt-out settings, and contractual enterprise addenda are formally executed and legally verified.

---

## 5. Security & Encryption Truths

### 5.1 Provider-by-Provider Cryptography Verification
Transport security and encryption at rest are verified per hop across our infrastructure:
1. **Frontend Client to Backend API:** Enforced over HTTPS / TLS (TLS 1.2 / TLS 1.3 negotiated via Render edge proxies).
2. **Backend API to Firebase Realtime Database:** Enforced over TLS 1.2+ HTTPS / WSS managed by Google Cloud infrastructure.
3. **Client / Backend to AssemblyAI:** Enforced over TLS 1.2+ WSS (`wss://streaming.assemblyai.com/v3/ws`) and HTTPS token endpoints.
4. **Backend API to Google Gemini:** Enforced over TLS 1.2+ HTTPS connecting to the Google AI Studio developer API (`generativelanguage.googleapis.com`).
5. **Backend API to Google Calendar / OAuth:** Enforced over TLS 1.2+ HTTPS connecting to Google Identity and Google Calendar API endpoints.
6. **Authoritative Database at Rest (Firebase RTDB):** Encrypted at rest via Google Cloud default multi-tenant storage encryption using Google-managed AES-256 keys.
7. **Application Runtime Storage:** Ephemeral container file systems hosted on Render. No clinical database files or audio waveforms are written to server host disks.

### 5.2 What Psyco AI Explicitly Does NOT Claim
1. **No End-to-End Encryption (E2EE):** Psyco AI does **NOT** provide client-side end-to-end encryption where the server is blind to plaintext data. The backend application server requires access to plaintext for relationship-based access validation (ReBAC), audit trail logging, structured validation, and AI prompt formatting. Claiming E2EE would be a fraudulent misrepresentation of cloud healthcare SaaS architecture.
2. **No Blanket DPDP Compliance:** Psyco AI does **NOT** claim full statutory DPDP compliance or formal government certification. Technical safeguards are aligned with core privacy principles, but statutory obligations commence on a phased timeline under official Gazette notifications:
   - **Act (G.S.R. 843(E)):** Section 6(9) and Section 27(1)(d) commence on **13 November 2026**; general Data Fiduciary obligations (Sections 4–10), Data Principal rights (Sections 11–14), and statutory penalties (Sections 33–34) commence on **13 May 2027**.
   - **Rules (G.S.R. 846(E) & 892(E)):** Rule 4 commences on **13 November 2026**; core procedural rules (Rules 3, 5–16, 22, 23) commence on **13 May 2027**.
3. **No Statutory Healthcare Accreditations:** Psyco AI does not claim third-party certifications (e.g., SOC 2 Type II, ISO 27001, HIPAA) at this staging phase.
