# Psyco AI — Product Specification

**Version:** 1.0.0 (Phase 0 Foundation)  
**Status:** Architectural Baseline  
**Product Category:** AI-Powered Mental Health Practice-Management Platform  
**Product Tagline:** *"Less time on paperwork. More time for patient care."*

---

## 1. Executive Summary

Psyco AI is a modern, web-based practice management SaaS tailored specifically for mental health professionals (clinical psychologists, psychotherapists, and mental health counselors) and their patients. The platform bridges administrative friction—such as appointment scheduling, intake processing, clinical notes, and treatment tracking—with clinical ergonomics and ethical, human-in-the-loop AI assistance.

The overarching design objective is to eliminate clinical burnout caused by repetitive documentation while upholding the highest ethical and regulatory standards for sensitive mental health information.

---

## 2. Core Personas and Portals

The application strictly defines three primary personas and dedicated portal contexts:

### 2.1 The Patient
* **Profile:** Individuals seeking or receiving mental health care.
* **Key Needs:** Transparent provider discovery, friction-free booking, self-service intake completion, clear visibility into scheduled sessions (both in-person and online), and secure access to authorized treatment resources and clinical reports.
* **Constraints:** Must only ever view their own demographic, intake, appointment, and explicitly published report data. No access to raw clinician notes, diagnostic deliberations, or other patients' data.

### 2.2 The Psychologist
* **Profile:** Licensed clinical psychologists, therapists, or counselors running private practices or clinic branches.
* **Key Needs:** Practice autonomy (working hours, session durations, buffer times, fees), calendar management, patient progress tracking, session notes, treatment planning, and AI-assisted drafting of clinical documentation.
* **Constraints:** Cannot view or manipulate data belonging to other clinicians' practices unless explicitly assigned. Cannot bypass human review of AI-generated content. Must approve and sign off on all clinical records.

### 2.3 The Administrator
* **Profile:** System administrators and clinic operations managers.
* **Key Needs:** User account governance, psychologist credential and registration reviews, platform status monitoring, FAQ management, and immutable security audit logs.
* **Strict Privacy Constraint:** Administrative role **does not** grant automatic backdoor access to private patient clinical records, diagnosis notes, or session transcripts. Record access remains strictly governed by therapist-patient therapeutic relationships.

---

## 3. Product Principles and Defaults

1. **Default Session Mode:**
   * **In-Person Consultations** represent the default and primary session mode.
   * **Online Consultations** are fully supported via integrated Google Meet video links when chosen.
2. **Timezone Policy:**
   * Default platform timezone is set to **`Asia/Kolkata`** (IST, UTC+5:30).
   * The architecture supports per-psychologist and per-patient timezone preferences, storing all timestamps in standard UTC ISO 8601 format.
3. **Strict Data Storage Policy (No Binary Media):**
   * **All persistent application records must be stored as structured JSON/text in Firebase Realtime Database.**
   * Permanent audio recordings, video recordings, raw session media, and binary attachments are **strictly prohibited**.
   * Future in-person or online audio transcription uses transient streaming buffers that are purged immediately after transcript text generation.
   * Reports are rendered dynamically or as ephemeral downloads; their authoritative storage representation is structured JSON text.
4. **Human-in-the-Loop Clinical AI:**
   * AI-generated summaries, notes, and treatment plans are always created as **drafts**.
   * No AI-generated output is automatically committed to an authoritative patient chart without explicit psychologist review, editing, and cryptographic/audit sign-off.

---

## 4. Key Functional Modules Overview

| Module | Purpose | Target Phase |
| :--- | :--- | :--- |
| **Public Portal & Marketing** | Branded landing pages, service descriptions, pricing, FAQ, clinician directories, and educational content. | Phase 1 |
| **Authentication & Profiles** | Firebase Auth (Email/Password, Google Sign-In), role verification, clinician credential onboarding, patient profiles. | Phase 2 |
| **Intake & Consents** | Multi-step medical/psychological intake forms, informed consent, HIPAA/telehealth agreements. | Phase 2 |
| **Scheduling & Availability** | Psychologist slot management, buffer times, cancellation/reschedule rules, recurring availability. | Phase 3 |
| **Calendar Sync & Meet** | Google Calendar bidirectional sync, automated Google Meet link generation. | Phase 3 |
| **Clinical Records & Notes** | SOAP/DAP/BIRP notes, longitudinal patient histories, session tracking, versioned revisions. | Phase 4 |
| **Treatment Planning** | Goal setting, interventions, target dates, progress evaluations, and outcome metrics. | Phase 4 |
| **Session Transcription** | Ambient/transient speech-to-text with AssemblyAI; text-only persistence with timestamp and speaker segmentation. | Phase 5 |
| **AI Copilot & Synthesis** | Gemini-powered clinical documentation drafting, symptom extraction, and diagnostic support suggestions. | Phase 6 |
| **Assessments & Risk Alerts** | Standardized mental health screenings (PHQ-9, GAD-7), automated risk review cues, longitudinal score graphs. | Phase 7 |
| **Security & Compliance Audits**| Immutable audit trail, token rotation, access verification, and administrative operational controls. | Phase 8 |

---

## 5. Non-Functional Requirements

* **Performance:** Sub-100ms API response time for typical CRUD queries; Sub-1.5s initial bundle load for web applications.
* **Accessibility:** WCAG 2.1 AA compliance across all patient and provider user interfaces.
* **Security:** Transport Layer Security (TLS 1.3), Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), rate-limited authentication endpoints, sanitized logging without PII or clinical notes.
* **Reliability:** Graceful degradation when external services (Google Calendar, Gemini, AssemblyAI) are unconfigured or unavailable.
