# Psyco AI — Complete Development Roadmap

**Version:** 1.0.0 (Phase 0 Foundation)  
**Strategy:** Phased, test-driven delivery separating core practice management from downstream AI capabilities.

---

## Phase 0 — Foundation and Architecture

* **Objectives:** Establish the monorepo scaffold, complete architecture specification, design token foundation, Express.js backend shell with security middleware, and React frontend shell with accessible component library.
* **Main Modules:** Project scaffold, documentation suite, shared design tokens, centralized error handling, boundary adapter skeletons, health check endpoint.
* **Dependencies:** `express`, `helmet`, `cors`, `zod`, `dotenv`, `react`, `react-router-dom`, `vite`, `tailwindcss`, `lucide-react`.
* **Required External Configuration:** Node.js 20+, npm 10+. (No external API keys required for Phase 0 verification).
* **Security Considerations:** Prevent secrets in repository; establish strict no-binary storage policy; configure security headers and sanitized logging.
* **Implementation Deliverables:** Working frontend scaffold with design system, working backend with `/api/v1/health`, complete `docs/` suite, zero lint/build errors.
* **Acceptance Criteria:** Frontend builds cleanly (`npm run build`); backend starts and health endpoint returns 200 with accurate unconfigured statuses; test suite passes.
* **Testing Requirements:** Unit and integration tests for health endpoint, error handler, and route mounts.

---

## Phase 1 — Brand and Public Website

* **Objectives:** Build high-converting, fully accessible, and responsive public marketing pages showcasing Psyco AI's value proposition for both clinicians and patients.
* **Main Modules:** Home, About Us, How It Works, Services, FAQ, Contact, Public Clinician Directory, Legal pages (Privacy Policy, Terms of Service).
* **Dependencies:** Frontend component library, Lucide icons, SEO meta tags.
* **Required External Configuration:** Contact form endpoint / mailer credentials (optional).
* **Security Considerations:** Sanitize public contact form inputs; apply rate limiting to prevent spam; protect SEO integrity.
* **Implementation Deliverables:** Complete static & responsive public website routes with branded imagery, copy, and clean navigation.
* **Acceptance Criteria:** All marketing routes render responsively across mobile, tablet, and desktop viewports; perfect keyboard accessibility; zero broken links.
* **Testing Requirements:** Vitest/Jest component tests, Cypress/Playwright public navigation smoke tests.

---

## Phase 2 — Authentication, Profiles and Patient Intake

* **Objectives:** Deliver production-ready user identity management, multi-role registration, psychologist credential collection, and the comprehensive clinical patient intake workflow.
* **Main Modules:** Firebase Auth integration (Email/Password, Google Sign-In), Role onboarding, Patient Profile & Emergency Contacts, Psychologist Professional Profile, Multi-step Clinical Intake form with digital consent.
* **Dependencies:** `firebase` (client), `firebase-admin` (server), `react-hook-form`, `zod`.
* **Required External Configuration:** Firebase project credentials (`apiKey`, `authDomain`, `databaseURL`, `serviceAccountKey.json`).
* **Security Considerations:** Strict server-side verification of Firebase ID tokens; prevent role escalation (users cannot self-assign `admin` or `psychologist` without approval); encrypt sensitive intake fields; consent timestamping.
* **Implementation Deliverables:** Secure auth state, login/register modals, profile editors, multi-step intake wizard with draft save.
* **Acceptance Criteria:** User can sign up, log in, view role-tailored dashboard; patient can complete intake; data persists in Firebase Realtime Database under strict rules.
* **Testing Requirements:** Auth token validation tests, intake form schema validation tests, unauthorized access rejection tests.

---

## Phase 3 — Availability, Appointments and Calendars

* **Objectives:** Implement psychologist scheduling controls, slot generation, appointment booking (in-person default + online mode), cancellation/reschedule workflows, and Google Calendar sync.
* **Main Modules:** Psychologist Availability Manager, Public/Patient Booking Flow, Appointment Management Dashboard, Google Calendar & Google Meet integration adapters.
* **Dependencies:** `@googleapis/calendar`, `date-fns`.
* **Required External Configuration:** Google OAuth2 Client ID, Secret, and Redirect URI with Calendar API enabled.
* **Security Considerations:** Atomic appointment slot reservation to prevent double-booking; timezone normalization in UTC; strict ownership checks on cancellations.
* **Implementation Deliverables:** Interactive calendar UI, recurring slot manager, booking wizard, automated Google Meet link creation when online mode is selected.
* **Acceptance Criteria:** Patient can book an available slot; psychologist schedule updates atomically; Google Calendar event creates when configured, falls back gracefully when unconfigured.
* **Testing Requirements:** Concurrency tests for booking contention, timezone conversion tests, booking cancellation window validation tests.

---

## Phase 4 — Clinical Workspace and Administration

* **Objectives:** Provide psychologists with a dedicated clinical workspace for session management, versioned clinical notes (SOAP/DAP), treatment planning, and administrative practice governance.
* **Main Modules:** Session Management Hub, Clinical Notes Editor (SOAP, DAP, BIRP), Note Version History & Signing, Treatment Plan Builder, Admin User Governance & Verification Portal.
* **Dependencies:** Rich-text or Markdown editor for structured clinical notes, diff viewer for version history.
* **Required External Configuration:** Firebase Realtime Database indexes for session queries.
* **Security Considerations:** Signed notes are immutable; amendments require version increments; administrators are strictly prohibited from viewing patient notes.
* **Implementation Deliverables:** Clinical dashboard, note editor with auto-save drafts, digital signing workflow, admin user status toggle.
* **Acceptance Criteria:** Clinician can create, save, edit draft, and sign notes; signed notes cannot be modified in-place; admin portal displays system metrics without exposing clinical text.
* **Testing Requirements:** Immutability verification tests, ReBAC permission tests for clinical notes, admin privilege isolation tests.

---

## Phase 5 — Session Transcription and Transcript Management

* **Objectives:** Enable ambient speech-to-text transcription for in-person and online sessions using transient audio processing without storing persistent audio files.
* **Main Modules:** Client-side microphone stream handler (Web Audio API), transient audio streaming gateway, AssemblyAI integration adapter, transcript viewer with speaker diarization.
* **Dependencies:** `assemblyai` SDK, Web Audio API primitives.
* **Required External Configuration:** AssemblyAI API Key (`ASSEMBLYAI_API_KEY`).
* **Security Considerations:** Mandatory signed consent check prior to audio capture; zero-audio-persistence policy (buffers wiped immediately after transcription); end-to-end TLS streaming.
* **Implementation Deliverables:** Live session transcription widget, transcript playback/correction UI, text-only Realtime Database storage.
* **Acceptance Criteria:** Audio streams to AssemblyAI; pure text transcript is persisted with timestamps and speaker tags; zero audio files saved to disk or cloud storage.
* **Testing Requirements:** Consent guard middleware tests, streaming failure resilience tests, transcript text schema validation.

---

## Phase 6 — Durable AI Processing and Gemini Clinical Copilot

* **Objectives:** Integrate Google Gemini to assist psychologists with clinical documentation drafts, diagnostic synthesis, symptom extraction, and treatment goal suggestions.
* **Main Modules:** Gemini API adapter, background job queue (BullMQ / Redis or durable DB queue), clinical prompt templates, Human-in-the-Loop review & accept interface.
* **Dependencies:** `@google/genai` or `@google/generative-ai`, background queue provider.
* **Required External Configuration:** Gemini API Key (`GEMINI_API_KEY`), Redis URL (if utilizing Redis queue).
* **Security Considerations:** De-identification of patient names before prompt dispatch; AI outputs strictly marked as `isDraft: true`; clinician review required before saving.
* **Implementation Deliverables:** AI Copilot sidebar in clinical notes editor, "Generate Draft" action, treatment plan suggestion engine, background task monitor.
* **Acceptance Criteria:** Clinician clicks "Draft Note with AI"; background worker processes transcript; structured SOAP note proposal is returned for clinician editing and explicit sign-off.
* **Testing Requirements:** Mock AI adapter tests, prompt safety guardrail tests, worker job retry and failure tests.

---

## Phase 7 — Assessments, Risk-Review Support and Advanced Analytics

* **Objectives:** Implement standardized psychometric assessments, automated risk-review alerts, and longitudinal outcome metrics.
* **Main Modules:** Assessment Engine (PHQ-9, GAD-7), Scoring and Severity Algorithms, Risk-Review Support (suicidality/crisis detection), Longitudinal Progress Charts.
* **Dependencies:** Charting library (Recharts or Chart.js).
* **Required External Configuration:** None beyond core stack.
* **Security Considerations:** High-priority alerts for elevated risk scores; clear clinical disclaimer that AI/algorithms do not replace emergency crisis intervention; strict audit logging on risk reviews.
* **Implementation Deliverables:** Assessment assignment portal for patients, automated scoring calculators, visual progress trajectory graphs, crisis review banner.
* **Acceptance Criteria:** Patient completes PHQ-9; score calculates accurately; clinician dashboard displays score trend; severe scores trigger immediate risk review workflow.
* **Testing Requirements:** Psychometric scoring algorithm unit tests, crisis keyword alert unit tests.

---

## Phase 8 — Security, End-to-End Testing and Production Readiness

* **Objectives:** Execute comprehensive security audits, end-to-end integration testing, penetration testing preparation, performance optimization, and production deployment automation.
* **Main Modules:** Automated CI/CD pipelines, penetration testing harness, audit log export, data backup routines, rate limit stress tests.
* **Dependencies:** Playwright/Cypress for E2E tests, Lighthouse for performance audits.
* **Required External Configuration:** Production domain, SSL certificates, monitoring/APM service.
* **Security Considerations:** Full HIPAA & GDPR compliance audit; zero-knowledge encryption review for sensitive notes; automated secret scanning in CI.
* **Implementation Deliverables:** Production Dockerfiles / deployment manifests, complete test reports, security compliance documentation, disaster recovery runbook.
* **Acceptance Criteria:** 100% of critical paths covered by automated E2E tests; Lighthouse score $\ge 90$; all security scanners pass with zero critical/high vulnerabilities.
* **Testing Requirements:** Full regression test suite, load testing under simulated clinic concurrency, security vulnerability scans.
