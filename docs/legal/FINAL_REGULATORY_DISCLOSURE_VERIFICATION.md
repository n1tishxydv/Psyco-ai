# Psyco AI — Final Regulatory Disclosure Verification Report

**Document Reference:** `PSYCO-LEGAL-REPORT-003`  
**Classification:** `READY FOR LEGAL REVIEW`  
**Auditor:** Senior Privacy Engineer, Indian Data-Protection Researcher, Healthcare Technology Compliance Specialist, Technical Documentation Auditor  
**Date:** October 31, 2026  
**Project:** Psyco AI — Mental Health Practice Management SaaS Platform  
**Target Environments:** Staging Frontend (`https://psyco-ai-staging.web.app`) & Backend (`https://psyco-ai.onrender.com`)  
**Production Isolation Guard:** `psyco-9c13d` strictly isolated  
**Storage Invariant:** Permanent storage contains structured text & JSON only (zero binary audio/video waveforms)  

---

## 1. Executive Summary

This Final Regulatory Disclosure Verification Report establishes the definitive evidentiary baseline for Psyco AI's legal and documentation repository prior to submission to qualified external legal counsel.

Every statutory citation, vendor configuration, cryptographic transport hop, data retention schedule, and organizational designation has been audited against actual source code implementations in `backend/` and `frontend/`, relevant Indian Gazette notifications, and official vendor documentation.

All legal and regulatory documents remain classified as **`READY FOR LEGAL REVIEW`** or **`DRAFT`**. In accordance with audit standards, **zero documents are marked `APPROVED FOR PUBLICATION`**.

---

## 2. Core Regulatory Disclosures & Verified Realities

### 2.1 DPDP Act, 2023 Commencement Schedule (G.S.R. 843(E))
The commencement roadmap under official Ministry of Electronics and Information Technology Notification G.S.R. 843(E), dated 13 November 2025, is verified as follows:

| Commencement Date | Specific Statutory Provisions Commenced | Subject Matter & Regulatory Scope | Corrective Finding |
| :--- | :--- | :--- | :--- |
| **13 November 2025** | Section 1(2), Section 2, Sections 18–26, Section 35, Sections 38–43, specified provisions of Section 44. | Short title, definitions, establishment and constitution of the Data Protection Board of India, rulemaking powers, and Central Government powers. | **In Force.** Correctly separated from fiduciary duties. |
| **13 November 2026** | **Section 6(9)** and **Section 27(1)(d)** ONLY. | Section 6(9) establishes the mechanism for Data Fiduciaries to provide notice and opportunity regarding pre-existing consent; Section 27(1)(d) empowers the Board to inspect and call for information. | **Corrected.** Previous documentation incorrectly claimed the entire Data Fiduciary obligation framework commenced on this date. |
| **13 May 2027** | Sections 3–5, Section 6(1)–(8) & 6(10), Sections 7–17, Section 27 except clause (d), Sections 28–34, Sections 36–37, Section 44(2). | Core Data Fiduciary obligations (notice, consent, security safeguards, breach reporting), Significant Data Fiduciary duties, processing of children's data, Data Principal rights (access, correction, erasure, grievance redressal), Board inquiries, and statutory financial penalties (up to ₹250 crore). | **Corrected.** Core obligations, rights, and statutory penalties commence on 13 May 2027 (18-month transition). |

### 2.2 DPDP Rules, 2025 Timeline (G.S.R. 846(E) & Corrigendum G.S.R. 892(E))
The timeline for the Digital Personal Data Protection Rules, 2025 under Notification G.S.R. 846(E) and Corrigendum G.S.R. 892(E), dated 13 November 2025, is maintained strictly separate from the Act:

| Commencement Date | Specific Rules Commenced | Regulatory Scope |
| :--- | :--- | :--- |
| **13 November 2025** | Rules 1, 2, and 17–21. | Short title, definitions, qualifications and terms of Board members, inquiry procedure, and Board administrative operations. |
| **13 November 2026** | **Rule 4** ONLY. | Notice requirements for personal data processed prior to commencement of Section 6(1). |
| **13 May 2027** | Rules 3, 5–16, 22, and 23. | Procedural rules for notice details, consent mechanisms, security safeguards, personal data breach notification standards, verifiable parental consent for children/disabled persons, Data Protection Officer criteria, and Data Principal rights exercise. |

---

## 3. Third-Party Vendor Privacy Configuration Audit (Phase 6.2)

### 3.1 Google Gemini Configuration Audit

| Verification Item | Technical Finding & Source Evidence | Audit Status | Required Action / Safeguard |
| :--- | :--- | :--- | :--- |
| **Exact SDK & Version** | `@google/genai` (v2.30.0) instantiated via `new GoogleGenAI({ apiKey })` in `backend/src/integrations/gemini/geminiAdapter.js`. | **VERIFIED** | Maintain dependency pin. |
| **Exact API Endpoint** | Google AI Studio developer API (`https://generativelanguage.googleapis.com/v1beta/models/...`). Not configured for Google Cloud Vertex AI (`vertexAI: true` is not set). | **VERIFIED** | Differentiate from Vertex AI in all public and legal documents. |
| **Active Billing Status** | Project linked to `GEMINI_API_KEY` cannot be programmatically verified for active billing via developer API key endpoints. | **REQUIRES MANUAL CONFIRMATION** | Platform owner must verify in Google Cloud Console / AI Studio that an active billing account is linked. |
| **Generate Content API Logging** | Standard GenerateContent endpoint called with `temperature: 0.1` and `responseMimeType: 'application/json'`. No custom VPC Service Controls configured. | **VERIFIED** | Logging behavior depends entirely on active billing tier. |
| **Request Storage Enabled** | Under Google AI Studio Free Tier, prompts and completions are stored by Google and accessible to human reviewers. Under Paid Billing, inputs/outputs are not stored for training. | **REQUIRES MANUAL CONFIRMATION** | Confirm billing account attachment to ensure request storage for model training is disabled. |
| **Dataset Sharing with Google** | Free tier shares data with Google for model improvement and safety evaluations. Paid billing tier does not share customer prompts/completions for model training. | **REQUIRES MANUAL CONFIRMATION** | Do not transmit sensitive data until paid billing terms are verified. |
| **Log-Retention Period** | Up to **18 months** for free-tier reviewer data. Paid billing tier retains transient operational logs (typically 30 days or less) strictly for service delivery and abuse monitoring. | **VERIFIED** | Disclose contract-tier retention differences accurately. |
| **Clinical Information Guard** | Verified that real clinical patient information is **NOT** being sent to an unverified configuration. The staging environment uses synthetic consultation dialogues; real clinical data is barred. | **VERIFIED** | Continue strict ban on real patient health data until billing and non-training terms are verified. |

### 3.2 AssemblyAI Configuration Audit

| Verification Item | Technical Finding & Source Evidence | Audit Status | Required Action / Safeguard |
| :--- | :--- | :--- | :--- |
| **Configured Service** | **Streaming v3 WebSocket API** (`wss://streaming.assemblyai.com/v3/ws`) via ephemeral tokens acquired from `https://streaming.assemblyai.com/v3/token` in `backend/src/integrations/assemblyai/assemblyaiAdapter.js`. | **VERIFIED** | Asynchronous prerecorded transcription (`/v2/transcript`) is not used. |
| **Live Token Generation** | Live HTTP probe to `https://streaming.assemblyai.com/v3/token?expires_in_seconds=60` returned HTTP 200 with 1266-character ephemeral WebSocket JWT. | **VERIFIED** | Streaming v3 infrastructure is operational. |
| **Account-Level Model Opt-Out** | Model training opt-out is an account-level setting managed in the AssemblyAI Developer Console, not retrievable via API key probe. | **REQUIRES MANUAL CONFIRMATION** | Project owner must log into the AssemblyAI Developer Dashboard and verify that model training opt-out is toggled ON. |
| **Zero-Retention Conditions** | According to vendor technical documentation, Streaming v3 operates in volatile memory with zero audio or transcript retention **only when the account has opted out of model training**. | **REQUIRES MANUAL CONFIRMATION** | Zero-retention is not guaranteed until account opt-out is verified or enterprise ZDR addendum executed. |
| **Retained Metadata** | Connection metadata (session start/end timestamps, request IDs, IP addresses, audio duration in seconds) is retained on AssemblyAI infrastructure for billing and operations. | **VERIFIED** | Document retained operational metadata in privacy architecture disclosures. |
| **Documentary BAA / ZDR Proof** | No executed Business Associate Agreement (BAA) or Zero Data Retention (ZDR) contract exists in project documentation. | **VERIFIED (NO PROOF)** | Strictly prohibit claiming that a BAA or ZDR addendum exists until formally executed. |
| **Clinical Audio Guard** | **Real patient clinical audio is strictly barred from staging.** Only synthetic/simulated audio is authorized. | **VERIFIED** | Maintain strict technical and policy prohibition against real patient audio in staging. |

### 3.3 Vendor Privacy Configuration Classification

```
================================================================================
VENDOR PRIVACY CONFIGURATION CLASSIFICATION:
VENDOR CONFIGURATION REQUIRES ACTION
================================================================================
```

#### Classification Rationale & Required Action Items:
1. **Google Gemini Billing Verification Required:** The project owner must verify in the Google Cloud Console that an active billing account is linked to the project providing `GEMINI_API_KEY`. Without active billing, Google AI Studio reserves the right to log prompts and completions for foundation model training and human review for up to 18 months.
2. **AssemblyAI Model-Training Opt-Out Verification Required:** The project owner must verify in the AssemblyAI Developer Dashboard that account-level model-training opt-out is enabled, ensuring audio and transcripts are processed ephemerally in RAM with zero vendor storage.
3. **No Claim of BAA or ZDR Agreements:** No executed enterprise BAA or ZDR addendum exists. All documents must continue to explicitly state this fact.
4. **Mandatory Staging Restriction Maintained:** Real clinical patient health information and consultation audio remain **strictly prohibited** from transmission in staging until actions 1 and 2 are confirmed in writing.

---

## 4. Encryption & Infrastructure Hop Verification

Every cryptographic transport hop and storage tier has been reviewed and verified individually:

| Hop / Tier | Source to Destination | Cryptographic Protocol | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Hop 1** | Frontend Client -> Backend API | **HTTPS (TLS 1.2 / TLS 1.3 negotiated)** | Render edge proxy terminates TLS; HSTS enforced via Helmet middleware (`backend/src/app.js`). |
| **Hop 2** | Backend API -> Firebase RTDB | **TLS 1.2+ HTTPS / WSS** | Google Cloud Firebase Admin SDK connection over secure sockets. |
| **Hop 3** | Client / Backend -> AssemblyAI | **TLS 1.2+ WSS (`wss://streaming.assemblyai.com/v3/ws`)** | Secure WebSocket and HTTPS token acquisition (`assemblyAiAdapter.js`). |
| **Hop 4** | Backend API -> Google Gemini | **TLS 1.2+ HTTPS (`generativelanguage.googleapis.com`)** | Google Gen AI SDK TLS transport (`geminiAdapter.js`). |
| **Hop 5** | Backend API -> Google Calendar / OAuth | **TLS 1.2+ HTTPS (`googleapis.com`)** | Google APIs OAuth 2.0 client over HTTPS (`googleCalendarClient.js`). |
| **Tier 6** | Firebase Database at Rest | **Google-managed AES-256 Multi-Tenant Encryption** | Standard Google Cloud infrastructure encryption at rest for Realtime Database. |
| **Tier 7** | Backend Application Host Storage | **Ephemeral Container Volumes** | Render container execution; no clinical files or audio streams written to host disks. |
| **Disclaimed**| Client-to-Client End-to-End Encryption | **NOT CLAIMED (Explicitly Disclaimed)** | Server requires plaintext access for ReBAC authorization, audit trail logging, schema validation, and AI prompt formatting. Claiming E2EE is strictly prohibited. |

---

## 5. Statutory Analysis: Intermediary Status & Grievance Redressal

### 5.1 Intermediary Status under IT Act Section 2(w)
- **Statutory Definition:** Section 2(w) of the Information Technology Act, 2000 defines an intermediary with respect to any particular electronic records as any person who on behalf of another person receives, stores or transmits that record or provides any service with respect to that record.
- **Dual Character of Platform:**
  - *Intermediary Facet:* In facilitating tele-consultation communications, appointment scheduling, and messaging conduits between independent licensed psychologists and patients, Psyco AI operates as an electronic intermediary.
  - *Data Fiduciary / Platform Facet:* In provisioning proprietary clinical charting tools, structured intake templates, AI documentation copilot workflows, and user account management, Psyco AI acts as a Data Fiduciary determining the purpose and means of data processing.
- **Legal Assessment:** Whether Psyco AI qualifies as an intermediary under Section 2(w) for safe-harbor protections or intermediary due diligence mandates requires explicit determination by qualified legal counsel.

### 5.2 Grievance Officer under IT Intermediary Rules, Rule 3(2)(a)
- **Statutory Text:** Rule 3(2)(a) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 mandates that an intermediary shall prominently publish on its website the name of the Grievance Officer and their contact details, as well as the mechanism by which a user or a victim may make a complaint.
- **Physical Address Mandate Nuance:** Rule 3(2)(a) **does not expressly mandate a physical street address**; it mandates prominent publication of the officer's name and contact details (including an electronic mechanism / email address) along with 24-hour receipt acknowledgment and 15-day complaint resolution.
- **Organizational Status:** Psyco AI has published project contact details (`Nitish Yadav`, `Psyco AI Platform Contact`, `n1tishxydv@gmail.com`, `+91 9996844107`), but has **not** invented or formally appointed a statutory Grievance Officer. Formal appointment remains an unresolved organizational/legal action.

---

## 6. Clinical Record Retention & Limitation Act Analysis

### 6.1 National Medical Commission (NMC) 2002 Regulations
- Regulation 1.3.1 of the NMC Code of Medical Ethics Regulations, 2002 mandates that every Registered Medical Practitioner (RMP) maintain medical records pertaining to **indoor (inpatient) patients** for a period of **3 years** from the commencement of treatment.
- Telemedicine Practice Guidelines, 2020 mandate that RMPs maintain digital telemedicine consultation logs for **3 years**.
- This statutory mandate applies strictly to physicians and psychiatrists registered with State Medical Councils / NMC. It does not apply universally to outpatient psychotherapy notes maintained by clinical psychologists.

### 6.2 Non-RMP Clinical Psychologists & Counselors
- Outpatient mental health psychotherapy records are governed by the Rehabilitation Council of India (RCI) Act, 1992, the National Commission for Allied and Healthcare Professions (NCAHP) Act, 2021, and state clinical establishment licensing acts.
- There is no single central 3-year statutory indoor mandate applicable to outpatient psychotherapy notes. State regulations and professional standards recommend between 3 and 7 years. Classified as: **`REQUIRES LEGAL REVIEW`**.

### 6.3 Pediatric Records & Limitation Act Section 6
- **Procedural Limitation vs. Statutory Retention Mandate:** Section 6 of the Limitation Act, 1963 provides a procedural rule tolling the period of limitation during legal disability (minority). Under this provision, a minor patient retains the legal right to institute a lawsuit (including medical negligence claims) within 3 years after attaining majority at age 18 (i.e., until age 21).
- **Correct Legal Characterization:** Section 6 is a procedural limitation rule governing civil actions; it is **not** an affirmative statutory medical record retention command.
- **Risk-Management Prudence:** While not a direct medical code mandate, retaining pediatric and adolescent records until at least age 21 is a necessary clinical malpractice defense and risk-mitigation prudence across healthcare facilities.
- **Status:** Pediatric retention window remains classified as: **`REQUIRES LEGAL REVIEW`**.

---

## 7. Document Publication Status Register

Every legal document in the platform repository has been audited and classified. In accordance with strict audit rules, **zero documents are marked `APPROVED FOR PUBLICATION`**:

| Doc ID | Document Title | File Path | Route | Current Classification |
| :--- | :--- | :--- | :--- | :--- |
| `PSYCO-LEGAL-001` | **Terms of Service** | `docs/legal/TERMS_OF_SERVICE.md` | `/terms` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-002` | **Privacy Policy** | `docs/legal/PRIVACY_POLICY.md` | `/privacy-policy` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-003` | **Data Privacy Architecture** | `docs/legal/DATA_PRIVACY_ARCHITECTURE.md` | `/data-privacy` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-004` | **Cookie & Local Storage Policy** | `docs/legal/COOKIE_POLICY.md` | `/cookie-policy` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-005` | **AI Transparency & Clinical Safety** | `docs/legal/AI_TRANSPARENCY.md` | `/ai-transparency` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-006` | **Medical & Crisis Disclaimer** | `docs/legal/MEDICAL_DISCLAIMER.md` | `/medical-disclaimer` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-007` | **Data Retention & Deletion Policy** | `docs/legal/DATA_RETENTION_POLICY.md` | `/data-retention` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-008` | **Acceptable Use Policy** | `docs/legal/ACCEPTABLE_USE_POLICY.md` | `/acceptable-use` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-009` | **Accessibility Statement** | `docs/legal/ACCESSIBILITY_STATEMENT.md` | `/accessibility` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-010` | **Data Rights & Privacy Requests** | `docs/legal/PRIVACY_REQUESTS.md` | `/privacy-requests` | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-011` | **Pre-Publication Legal Information Register** | `docs/legal/LEGAL_INFORMATION_REQUIRED.md` | N/A | `DRAFT` |
| `PSYCO-LEGAL-012` | **Legal Test Matrix & QA Audit** | `docs/legal/LEGAL_DOCUMENT_TEST_MATRIX.md` | N/A | `DRAFT` |
| `PSYCO-LEGAL-013` | **Implementation Report** | `docs/legal/LEGAL_IMPLEMENTATION_REPORT.md` | N/A | `DRAFT` |
| `PSYCO-LEGAL-014` | **Publication Readiness & Compliance Audit** | `docs/legal/LEGAL_PUBLICATION_READINESS_AUDIT.md` | N/A | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-015` | **Final Legal Corrections Report** | `docs/legal/FINAL_LEGAL_CORRECTIONS_REPORT.md` | N/A | `READY FOR LEGAL REVIEW` |
| `PSYCO-LEGAL-016` | **Final Regulatory Disclosure Verification** | `docs/legal/FINAL_REGULATORY_DISCLOSURE_VERIFICATION.md` | N/A | `READY FOR LEGAL REVIEW` |

---

## 8. Remaining Questions for Qualified Legal Counsel

Prior to commercial publication and live patient onboarding, external legal counsel must advise on:

1. **State Clinical Establishment Laws:** Determination of whether a uniform 7-year retention policy satisfies varying state clinical establishment rules across all target Indian states, or whether state-level clinician retention profiles must be configurable.
2. **Adolescent Confidentiality vs. DPDP Section 9:** Resolving statutory tensions between DPDP Act Section 9 (mandatory verifiable parental consent for all processing under age 18) and adolescent healthcare autonomy under the Mental Healthcare Act, 2017 for youth aged 14–17.
3. **Statutory Grievance Officer Appointment:** Drafting the formal appointment instrument and internal complaint escalation workflow for the statutory Grievance Officer under IT Intermediary Rules Rule 3(2)(a).
4. **Intermediary Status Formal Characterization:** Legal confirmation of whether Psyco AI qualifies for Section 79 safe-harbor intermediary protections under the IT Act, 2000.
5. **Contractual Liability Allocation:** Verification of Terms of Service disclaimers and indemnification clauses under Sections 73 and 74 of the Indian Contract Act, 1872 regarding AI documentation copilot drafts.

---

## 9. Verification & Quality Assurance Summary

| Check / Verification Target | Command / Protocol | Verified Outcome |
| :--- | :--- | :--- |
| **Backend Test Suite** | `npm test` in `backend/` | **221 passed**, 0 failed across 15 test files. |
| **Frontend Production Staging Build** | `npx vite build --mode staging` in `frontend/` | **Build completed in 6.02s**, 0 errors, chunks optimized. |
| **Git Whitespace & Format Audit** | `git diff --check` | **Clean**, 0 whitespace errors. |
| **Production Project Isolation** | Source code grep for `psyco-9c13d` | **Strictly isolated.** Only staging database `psyco-ai-staging-default-rtdb` referenced in active runtime. |
| **Secret Exposure Scan** | Regex scan for raw API keys (`AIzaSy...`, AssemblyAI bearer tokens) | **Zero hardcoded secrets.** All credentials loaded via runtime environment variables. |
| **Document Route Navigation** | Direct HTTP testing of all 11 legal routes | **All routes render HTTP 200** with synchronous Markdown/React text parity. |
