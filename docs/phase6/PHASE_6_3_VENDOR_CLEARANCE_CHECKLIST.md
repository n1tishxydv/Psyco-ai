# PHASE 6.3 — VENDOR PRIVACY & CONTRACTUAL CLEARANCE CHECKLIST

**Document ID:** `DOC-P63-VENDOR-CLEARANCE-001`  
**Version:** `1.0.0`  
**Classification:** Confidential — Healthcare Privacy, Legal Compliance & Vendor Governance  
**Project:** Psyco AI  
**Effective Date:** 31 October 2026  
**Status:** ACTIVE GATING CHECKLIST (UNBLOCKING PREREQUISITES)  

---

## 1. Purpose & Scope

This checklist establishes the mandatory contractual, technical, and compliance milestones that **MUST** be formally executed and verified before Psyco AI can transition from Phase 6.3 AI Sandbox Mode (`AI_SANDBOX_MODE=true`) to Live Vendor Integration (`AI_SANDBOX_MODE=false`).

Under no circumstances may developers toggle feature flags to enable live Google Gemini or AssemblyAI calls in clinical production or live patient consultations without documented sign-off from legal counsel and the privacy officer on every item below.

---

## 2. Google Gemini / Google Cloud Clearance Checklist

### Current Status: **SUSPENDED IN CLINICAL WORKFLOWS (SANDBOX MOCK ACTIVE)**

The current integration uses `@google/genai` targeting Google AI Studio Developer API (`generativelanguage.googleapis.com`). Active billing on Google AI Studio does **NOT** resolve healthcare compliance restrictions.

| Item ID | Clearance Requirement | Category | Responsible Party | Verification Evidence Required | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **G-01** | **Migrate from Google AI Studio to Google Cloud Vertex AI** | Technical Architecture | Engineering Lead | Service account integration using Google Cloud Vertex AI client (`@google-cloud/vertexai`) pointing to Google Cloud Project with Enterprise Agreement. | **PENDING** |
| **G-02** | **Execute Google Cloud HIPAA Business Associate Agreement (BAA)** | Legal / Contractual | Legal Counsel | Countersigned Google Cloud BAA covering Vertex AI API services. Must verify Psyco AI entity as Covered Entity/Business Associate. | **PENDING** |
| **G-03** | **Enforce Indian Data Residency (Vertex AI asia-south1 / asia-south2)** | Infrastructure / Regulatory | Cloud Architect | Endpoint configuration restricted to Mumbai (`asia-south1`) or Delhi (`asia-south2`) to satisfy DISHA / DPDP Act guidelines. | **PENDING** |
| **G-04** | **Zero Data Retention & Training Opt-Out Verification** | Security / Privacy | Privacy Officer | Written confirmation from Google Enterprise Support verifying customer prompts and generated clinical responses are not cached for abuse monitoring beyond ephemeral processing and are excluded from model training. | **PENDING** |
| **G-05** | **Cloud Logging & Audit Trail Sanitization** | DevSecOps | Backend Architect | Verification in Google Cloud Console that Request/Response payload logging in Cloud Logging is disabled for Vertex AI `generateContent` endpoints. | **PENDING** |
| **G-06** | **Google Cloud Enterprise Billing & SLA Contract** | Procurement / Finance | Operations Lead | Active enterprise billing contract with committed support and uptime SLA. | **PENDING** |

---

## 3. AssemblyAI Ambient Speech-to-Text Clearance Checklist

### Current Status: **SUSPENDED FOR LIVE CLINICAL AUDIO (SYNTHETIC SANDBOX ACTIVE)**

The integration uses Streaming v3 WebSocket (`wss://streaming.assemblyai.com/v3/ws`). Client token generation is operational, but account-level opt-out and zero data retention have not been contractually certified.

| Item ID | Clearance Requirement | Category | Responsible Party | Verification Evidence Required | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A-01** | **Account-Level Model-Training Opt-Out** | Privacy / Legal | Privacy Officer | Formal written confirmation from AssemblyAI Support / Account Executive that account `bdaf024e...` is opted out of all model training, evaluation, and human review. | **PENDING** |
| **A-02** | **Execute Zero Data Retention (ZDR) Addendum** | Legal / Contractual | Legal Counsel | Executed Data Processing Addendum (DPA) containing explicit Zero Data Retention clause stipulating audio and transcript streams are purged immediately upon WebSocket connection close. | **PENDING** |
| **A-03** | **Execute AssemblyAI Healthcare BAA** | Legal / Contractual | Legal Counsel | Signed Business Associate Agreement (BAA) with AssemblyAI, Inc. covering streaming transcription endpoints. | **PENDING** |
| **A-04** | **Data Residency & Cross-Border Transfer Assessment** | Regulatory / Compliance | Privacy Counsel | Legal assessment of cross-border data transfer under Section 16 of DPDP Act 2023 for transient streaming speech ingestion. | **PENDING** |
| **A-05** | **Ephemeral Token TTL Hardening** | Security Engineering | Backend Engineer | Token expiration strictly capped at 60 seconds (`expires_in_seconds=60`) with single-session redemption. *(Implemented in Phase 6.3)* | **VERIFIED** |
| **A-06** | **Client Zero-Audio-Persistence Invariant** | Technical Architecture | Frontend Engineer | Verification that browser `AudioStreamer` discards audio chunks immediately after transmission and does not persist local audio blobs. *(Implemented in Phase 6.3)* | **VERIFIED** |

---

## 4. Psyco AI Application Governance Checklist

| Item ID | Governance Requirement | Category | Responsible Party | Verification Evidence Required | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **APP-01** | **Server-Side Feature Flag Fail-Closed Startup** | Security Architecture | Backend Architect | Server immediately aborts startup if configuration permits live external calls while `AI_SANDBOX_MODE=true`. | **VERIFIED** |
| **APP-02** | **Deterministic Mock AI Provider for Staging** | Clinical Engineering | AI Architect | Mock drafts generated for SOAP, DAP, BIRP, Treatment Plans, and Summaries without external network traffic. | **VERIFIED** |
| **APP-03** | **Mandatory Psychologist Review & Digital Signature** | Clinical Governance | Clinical Lead | AI drafts cannot finalize into clinical charts without explicit psychologist approval. Admin access prohibited. | **VERIFIED** |
| **APP-04** | **Sanitized Audit Trail (No PII / PHI / Tokens)** | Privacy Engineering | Compliance Engineer | Audit logs record provider mode, sandbox flags, and timestamps; zero clinical content or tokens logged. | **VERIFIED** |
| **APP-05** | **Zero Binary Media Persistence in Firebase** | Database Architecture | Database Engineer | All transcripts and drafts stored in Firebase Realtime Database are strictly text/JSON. No binary audio blobs stored. | **VERIFIED** |
| **APP-06** | **Prominent Tester Notice in UI** | Product / UX | Frontend Lead | Ambient transcription and AI copilot panels prominently display sandbox banners to staging testers. | **VERIFIED** |

---

## 5. Formal Unblocking Protocol (Transition to Live Mode)

Before any deployment setting `AI_SANDBOX_MODE=false` is permitted:
1. All items in Section 2 (**G-01 through G-06**) must show status **VERIFIED** with documented legal attachments.
2. All items in Section 3 (**A-01 through A-06**) must show status **VERIFIED** with countersigned agreements.
3. Dual approval must be signed off below by the Clinical Director and Data Protection Officer (DPO).

### Sign-off Authorization Block:

- **Clinical Director Approval:** ___________________________ Date: ____________
- **Data Protection Officer (DPO) Approval:** _______________ Date: ____________
- **Lead Security Architect Approval:** ____________________ Date: ____________
