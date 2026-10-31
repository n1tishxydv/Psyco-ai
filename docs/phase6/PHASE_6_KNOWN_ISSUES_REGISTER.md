# Phase 6: Known Issues & Operational Limitations Register

**Document Identifier:** `PSYCO-DOC-P6-005`  
**Version:** `1.0.0`  
**Environment:** Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`)  
**Firebase Project:** `psyco-ai-staging`  
**Production Isolation Guard:** `psyco-9c13d` strictly untouched  
**Date:** October 31, 2026  
**Status:** Maintained for Controlled Pilot Operations  

---

## 1. Overview & Purpose

This register tracks all known functional limitations, environment-specific nuances, operational constraints, and technical observations identified during Phases 1–5 and the Phase 6 readiness assessment.

Its purpose is to provide pilot coordinators, technical staff, psychologists, and administrators with clear workarounds and ensure that **operational limitations are explicitly managed and never confused with critical system failures**.

---

## 2. Known Issues & Operational Limitations Matrix

| ID | Category | Summary / Observation | Severity | Pilot Impact | Workaround / Operational Protocol | Resolution Roadmap |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **KIR-001** | Auth / Identity | Google OAuth staging consent screen is restricted to approved Google Cloud test accounts. | Low | Minor | Use pre-seeded email/password synthetic credentials (`test-psychologist@psycoai.internal`, `test-patient@psycoai.internal`, `test-admin@psycoai.internal`) which bypass Google OAuth entirely. | Move OAuth app from "Testing" to "In Production" verification prior to public rollout. |
| **KIR-002** | Infrastructure | Render Web Service experiences container spin-up cold-start (~30–50s) after prolonged inactivity. | Medium | Moderate | Pilot coordinators run an automated warm-up script (`curl https://psyco-ai.onrender.com/health`) 10 minutes prior to scheduled pilot evaluation sessions. | Upgrade Render service to paid tier or configure an active uptime ping during testing hours. |
| **KIR-003** | Observability | Absence of third-party external APM (e.g., Sentry / Datadog) for automated exception capture. | Medium | Moderate | Express error handling logs structured JSON directly to Render stdout streams. Technical leads monitor live Render console logs during pilot windows. | Integrate Sentry SDK in backend and frontend during Post-Pilot Production Hardening. |
| **KIR-004** | Compliance | Architectural safeguards align with HIPAA/GDPR, but no third-party regulatory certification has been performed. | High (Policy) | Strict Policy Constraint | Disclose to all pilot participants that Psyco AI staging is an evaluation platform and must NEVER be used with real patient protected health information (PHI). | Retain external compliance auditor for formal HIPAA/SOC-2 Type II audit prior to production launch. |
| **KIR-005** | Disaster Recovery | Database restoration from automated GCP snapshot relies on manual Firebase Console import. | Low | Low | Detailed, step-by-step restoration runbook is documented in `PHASE_6_INCIDENT_RESPONSE_GUIDE.md`. | Develop an automated CLI restoration script (`npm run db:restore:staging`) for one-command recovery. |
| **KIR-006** | AI Copilot | AI note generation relies on external LLM endpoint; external API latency fluctuations can reach 4–8 seconds. | Medium | Minor | Frontend displays an animated pulsing shimmer state with clear text (`"Generating clinical note draft..."`) to prevent duplicate clicks. | Add Redis/memory caching for prompt templates and evaluate streaming responses (SSE). |
| **KIR-007** | Network Latency | Firebase Realtime Database is deployed in `us-central1`. Non-US testers experience ~200ms latency. | Low | Low | Negligible impact on conversational text and scheduling. Acceptable for controlled pilot. | Evaluate regional caching proxies and Edge CDN routing for international production scaling. |
| **KIR-008** | Client Validation | Browser autofill on complex multi-field clinic address forms may trigger momentary layout reflow. | Low | Cosmetic | Form input fields contain individual `autoComplete` attributes. Manual entry operates smoothly. | Minor frontend CSS fine-tuning during next sprint. |

---

## 3. Implemented Features vs. Operational Workarounds

To maintain rigorous transparency, the table below highlights where the system provides **full, native software enforcement** versus where **operational human protocols** are applied:

| Capability | Native Software Implementation | Operational Pilot Protocol |
| :--- | :--- | :--- |
| **Administrative Clinical Lockout** | **Fully Enforced at Code & DB Level:**<br>Backend middleware `requireClinicalRole` rejects admins with HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`. RTDB security rules prevent read/write to `/transcripts`, `/clinicalNotes`, and `/intakes`. | No operational workaround needed. Lockout is absolute and cryptographically enforced. |
| **AI Clinical Safety (HITL)** | **Fully Enforced:**<br>Drafts are saved with `status: 'draft'`. Digital signature and state transition to `signed` require explicit psychologist authentication. AI cannot sign notes. | Psychologists are trained during onboarding never to approve unedited hallucinations or missing details. |
| **Audit Logging** | **Fully Enforced:**<br>Every security-sensitive operation writes immutable records to `/auditLogs` with actor UID, role, timestamp, action, and IP. RTDB rules prohibit client modifications. | Administrators review audit logs weekly to identify failed access spikes. |
| **Test Account Isolation** | **Fully Enforced:**<br>Automated seeding script creates synthetic personas with deterministic flags (`isSynthetic: true`). | All pilot participants are issued pre-configured synthetic personas. Real identities are prohibited. |
| **Cold-Start Management** | **Backend code is optimized (sub-100ms response when warm).** | Operational warm-up ping before pilot sessions. |
| **Disaster Recovery** | **Google Cloud Platform takes daily automated backups of staging RTDB.** | Manual console import runbook executed by Technical Lead upon declared emergency. |

---

## 4. Participant Incident Reporting Procedure

If a pilot participant encounters an issue not listed in this register:

1. **Submit via In-App Support:**
   - Navigate to `/support` or click the Help & Support icon.
   - Fill in:
     - Category (Technical, Scheduling, AI Output, Account).
     - Subject & Detailed Description.
     - Severity Perception (Cosmetic, Blocking).
   - Click **Submit Ticket**.
2. **Emergency Escalation (P1 Incidents):**
   - For suspected data leakage or complete platform lockout, email the Incident Commander directly: `pilot-support@psycoai.internal`.
   - The ticket triggers the triage protocol outlined in `PHASE_6_INCIDENT_RESPONSE_GUIDE.md`.

---

## 5. Register Maintenance & Review Schedule

- This register is reviewed daily during the Controlled Pilot phase.
- Any defect confirmed by the Technical Lead is appended within 2 hours with an assigned KIR tracking code.
- Resolved issues are marked with a strikethrough and the resolving commit hash is documented before archiving.
