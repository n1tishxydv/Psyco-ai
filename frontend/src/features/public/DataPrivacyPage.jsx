import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import {
  ShieldCheck,
  Lock,
  Database,
  Cpu,
  Layers,
  Key,
  Server,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  GitBranch,
} from 'lucide-react';

export function DataPrivacyPage() {
  const toc = [
    { id: 'overview', label: '1. Architectural Principles' },
    { id: 'frontend-backend', label: '2. Frontend & Backend Stack' },
    { id: 'auth-rtdb', label: '3. Identity & Authoritative Database' },
    { id: 'access-control-lockout', label: '4. ReBAC & Administrator Lockout' },
    { id: 'audit-logging', label: '5. Immutable Security Audit Logging' },
    { id: 'ai-transcription-pipeline', label: '6. AI & Transcription Pipeline' },
    { id: 'third-party-integrations', label: '7. Calendar & Video Meeting Architecture' },
    { id: 'storage-lifecycle-diagrams', label: '8. Data Lifecycle & Technical Workflows' },
    { id: 'transport-security', label: '9. Transport Security & Error Handling' },
    { id: 'verified-limits', label: '10. Verified Technical Limits' },
  ];

  return (
    <LegalDocumentLayout
      title="Data Privacy & Technical Architecture"
      subtitle="A transparent engineering specification of how Psyco AI enforces data isolation, cryptographic access controls, and zero-binary-media persistence."
      category="Security and Technical Architecture"
      toc={toc}
    >
      {/* 1. Overview */}
      <section id="overview" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-softTeal" />
          1. Architectural Principles & Storage Invariants
        </h2>
        <p>
          Psyco AI is engineered around strict healthcare data boundaries rather than general consumer web patterns.
          Our architecture is governed by three non-negotiable invariants:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl border border-softTeal/30 bg-softTeal/10 space-y-1.5">
            <h4 className="font-semibold text-primaryText text-xs flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-softTeal" />
              1. Zero Binary Media
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Permanent application storage consists strictly of structured text and JSON. Raw voice recordings, therapy audio files,
              and video buffers are never written to permanent disk or database nodes.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-calmGreen/30 bg-calmGreen/10 space-y-1.5">
            <h4 className="font-semibold text-primaryText text-xs flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-calmGreen" />
              2. Clinical Lockout
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Administrative accounts have zero access to clinical session records, intake questionnaires, or transcripts.
              Enforced mathematically at both API middleware and database security levels.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 space-y-1.5">
            <h4 className="font-semibold text-primaryText text-xs flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-mutedAmber" />
              3. Human-in-the-Loop AI
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              AI models generate preliminary clinical drafts only. AI services cannot autonomously finalize, prescribe,
              or sign medical documentation without licensed clinician approval.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Stack */}
      <section id="frontend-backend" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Layers className="w-5 h-5 text-softTeal" />
          2. Frontend & Backend Application Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              Frontend Client Tier
            </h3>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside pl-1">
              <li><strong>Framework:</strong> Single Page Application (SPA) built with React 18 and Vite.</li>
              <li><strong>Code Splitting:</strong> Lazy-loaded clinical workspaces (<code>SessionWorkspacePage</code>, <code>TranscriptStudioPage</code>, <code>PatientChartPage</code>) separated via dynamic imports to minimize browser memory footprint.</li>
              <li><strong>Security:</strong> Client-side input sanitization, token refresh concurrency mutex, and no local caching of sensitive clinical notes in unauthenticated memory.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              Backend REST API Tier
            </h3>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside pl-1">
              <li><strong>Runtime:</strong> Node.js with Express framework deployed on Render container infrastructure.</li>
              <li><strong>Request Validation:</strong> Strict Zod schema validation applied to every incoming payload before route execution.</li>
              <li><strong>Security Headers:</strong> Helmet middleware enforcing Content Security Policy (CSP), anti-clickjacking (<code>X-Frame-Options</code>), and HSTS.</li>
              <li><strong>Rate Limiting:</strong> Tiered rate limiters protect public contact endpoints and authentication routes.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Identity & Authoritative DB */}
      <section id="auth-rtdb" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Database className="w-5 h-5 text-softTeal" />
          3. Identity & Authoritative Database Architecture
        </h2>
        <div className="space-y-3">
          <p>
            <strong>Firebase Authentication:</strong> User identity is authenticated via Firebase Auth using JSON Web Tokens (JWTs).
            Tokens carry a verified 60-minute lifetime. The frontend API client interceptor manages silent token renewal with a single-retry guard,
            deduplicating concurrent requests to prevent infinite authorization loops.
          </p>
          <p>
            <strong>Authoritative Database (Firebase Realtime Database):</strong> The single source of truth for Psyco AI is
            Firebase Realtime Database (<code>psyco-ai-staging-default-rtdb.firebaseio.com</code>).
            The platform does not utilize Cloud Firestore. Data is modeled in normalized JSON trees partitioned by user ID and entity reference keys.
          </p>
        </div>
      </section>

      {/* 4. ReBAC & Lockout */}
      <section id="access-control-lockout" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Lock className="w-5 h-5 text-calmGreen" />
          4. Relationship-Based Access Control (ReBAC) & Administrative Lockout
        </h2>
        <p>
          Authorization in Psyco AI uses a dual-layer security model combining Role-Based Access Control (RBAC)
          with <strong>Relationship-Based Access Control (ReBAC)</strong>:
        </p>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-calmGreen shrink-0 mt-0.5" />
            <div>
              <strong className="text-primaryText text-xs">Patient-Psychologist Therapeutic Relationship:</strong>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                A psychologist cannot query or access medical charts, intake disclosures, or session notes for any patient
                unless that patient has an explicit therapeutic relationship with them (managed via <code>assignedPsychologistIds</code>).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-calmGreen shrink-0 mt-0.5" />
            <div>
              <strong className="text-primaryText text-xs">Shared vs. Private Clinical Content:</strong>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Clinical records contain explicit flags (e.g. <code>sharedWithPatient: true</code>). Patients can only read
                collaborative care plan goals and treatment summaries explicitly shared by their psychologist; raw therapist process notes remain private to the clinician.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-mutedAmber shrink-0 mt-0.5" />
            <div>
              <strong className="text-primaryText text-xs">Cryptographic Administrative Lockout:</strong>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Administrator accounts manage clinic approvals, provider verification, and system health. Administrators are
                strictly prohibited from viewing clinical data. In <code>database.rules.json</code>:
              </p>
              <pre className="mt-1.5 p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-slate-300 border border-slate-800 overflow-x-auto">
{`"sessionNotes": {
  "$noteId": {
    ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() != 'admin' && ...",
    ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'psychologist'"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Audit Logging */}
      <section id="audit-logging" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-softTeal" />
          5. Immutable Security Audit Logging
        </h2>
        <p>
          Every critical security event is written to an append-only audit trail in Realtime Database (<code>/auditLogs</code>) via our backend service account:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li><strong>Recorded Operations:</strong> Account logins, role modifications, psychologist verification decisions, account suspensions, appointment status transitions, and clinical note signings.</li>
          <li><strong>Event Metadata:</strong> Timestamp (ISO-8601), actor UID, actor role, targeted resource ID, action identifier, and client IP address.</li>
          <li><strong>Immutability Guarantee:</strong> In <code>database.rules.json</code>, client writes to <code>/auditLogs</code> are locked to <code>".write": false</code>. Logs cannot be modified or deleted through client sessions.</li>
        </ul>
      </section>

      {/* 6. AI & Transcription Pipeline */}
      <section id="ai-transcription-pipeline" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Cpu className="w-5 h-5 text-softTeal" />
          6. AI Integration & Ambient Transcription Pipeline
        </h2>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Ambient consultation transcription is designed with zero persistent media storage on Psyco AI infrastructure:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 pl-1">
            <li>
              <strong>Explicit In-Session Consent:</strong> Prior to microphone activation, both the psychologist and patient must provide electronic consent.
              The state is validated against <code>/consentRecords</code> before audio streaming begins.
            </li>
            <li>
              <strong>Streaming v3 & Processor Retention:</strong> Audio chunks stream over TLS 1.2+ WSS directly to AssemblyAI's Streaming v3 WebSocket (<code>wss://streaming.assemblyai.com/v3/ws</code>). Vendor technical documentation specifies zero retention of audio and transcripts when the customer account has opted out of model training; standard 30-day asynchronous file retention does not apply to streaming. Psyco AI does not assume account opt-out or claim executed enterprise Zero Data Retention (ZDR) addenda or Business Associate Agreements (BAAs) without verified proof.
            </li>
            <li>
              <strong>Gemini Prompt Construction:</strong> The derived transcript text is combined with structured clinical prompt templates and sent via TLS 1.2+ HTTPS to Google Gemini via the Google AI Studio developer API (prompts and completions are not used to train models under accounts with paid billing enabled).
            </li>
            <li>
              <strong>Draft Isolation:</strong> The resulting output is saved in <code>/aiDrafts</code> with <code>status: 'draft'</code>.
              It is inaccessible to patients and cannot be merged into the authoritative medical chart until reviewed, edited, and digitally signed by the psychologist.
            </li>
          </ol>
          <div className="p-3 rounded-lg border border-mutedAmber/30 bg-mutedAmber/10 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-primaryText flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-mutedAmber" />
              Pilot Audio Rule: Synthetic Audio Only
            </p>
            <p>
              Real clinical audio from actual patients must NOT be processed during the staging pilot. Only synthetic test recordings are permitted until processor configuration, account-level opt-out settings, and contractual enterprise addenda are formally executed and legally verified.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Third-Party Integrations */}
      <section id="third-party-integrations" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">7. Google Calendar & Google Meet Integration</h2>
        <p>
          For clinicians who connect their Google Workspace accounts:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
          <li><strong>OAuth Token Security:</strong> Google OAuth refresh tokens are stored in private database nodes (<code>/googleConnections</code>) with <code>".read": false, ".write": false</code> in database rules, accessible solely by the backend server.</li>
          <li><strong>Google Meet Links:</strong> When an online appointment is confirmed, the backend requests a Google Meet video link via the Google Calendar API. Psyco AI stores only the meeting URL string; no video streams or recording files are archived on our infrastructure.</li>
        </ul>
      </section>

      {/* 8. Workflows & Diagrams */}
      <section id="storage-lifecycle-diagrams" className="space-y-4">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-softTeal" />
          8. Data Lifecycle & Technical Workflows
        </h2>
        <p className="text-xs text-slate-300">
          The table below illustrates data states across the core user workflows:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border border-slate-800 rounded-xl overflow-hidden text-xs">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 border-b border-slate-800">Workflow</th>
                <th className="p-3 border-b border-slate-800">Transient Data (Purged)</th>
                <th className="p-3 border-b border-slate-800">Persistent Data (Text/JSON in RTDB)</th>
                <th className="p-3 border-b border-slate-800">Security Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-400">
              <tr>
                <td className="p-3 font-medium text-slate-200">Patient Registration</td>
                <td className="p-3">Plaintext password</td>
                <td className="p-3">UID, email, role, status</td>
                <td className="p-3">Firebase Auth hashing</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Appointment Booking</td>
                <td className="p-3">Temporary slot lock</td>
                <td className="p-3">Appointment record, status, session PIN</td>
                <td className="p-3">Conflict engine + 30m lead-time check</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Online Consultation</td>
                <td className="p-3">WebRTC / Meet video streams</td>
                <td className="p-3">Google Meet URL string only</td>
                <td className="p-3">Session PIN access validation</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Audio Transcription</td>
                <td className="p-3">Streaming audio buffers in RAM</td>
                <td className="p-3">Extracted transcript text entries</td>
                <td className="p-3">Explicit signed consent check</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">AI Clinical Note Drafting</td>
                <td className="p-3">Gemini API payload in transit</td>
                <td className="p-3">AI SOAP draft (status: 'draft')</td>
                <td className="p-3">HITL mandate: Cannot self-sign</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Clinical Record Finalization</td>
                <td className="p-3">Unsaved edit state</td>
                <td className="p-3">Signed note, clinician license, timestamp</td>
                <td className="p-3">Psychologist token digital signature</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. Transport & Storage Encryption */}
      <section id="transport-security" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">9. Transport Security, Encryption at Rest & Error Handling</h2>
        <p>
          Encryption is evaluated and verified separately across each architectural hop:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
          <li><strong>Client to Backend:</strong> Enforced HTTPS via TLS 1.2 / TLS 1.3 negotiated through Render edge proxies.</li>
          <li><strong>Backend to Firebase:</strong> Enforced TLS 1.2+ HTTPS / WSS managed by Google Cloud infrastructure.</li>
          <li><strong>Client/Backend to AssemblyAI:</strong> Enforced TLS 1.2+ WSS (Streaming v3) and HTTPS token generation.</li>
          <li><strong>Backend to Google Gemini:</strong> Enforced TLS 1.2+ HTTPS connecting to the Google AI Studio developer API (<code>generativelanguage.googleapis.com</code>).</li>
          <li><strong>Backend to Google Calendar / OAuth:</strong> Enforced TLS 1.2+ HTTPS connecting to Google Identity and Calendar endpoints.</li>
          <li><strong>Firebase Database at Rest:</strong> Encrypted at rest via Google Cloud default multi-tenant cloud storage encryption using Google-managed AES-256 keys.</li>
          <li><strong>Application Runtime Storage:</strong> Ephemeral container execution on Render; no clinical database files stored on host disks.</li>
        </ul>
        <p>
          The backend enforces strict error sanitization through our centralized Express error handler:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li>Internal stack traces, database connection strings, and server paths are suppressed from public HTTP responses.</li>
          <li>Client errors return structured, machine-readable JSON envelopes with specific error codes (e.g. <code>UNAUTHORIZED</code>, <code>INVALID_INPUT</code>).</li>
          <li>Operational diagnostics are logged securely to stdout for infrastructure monitoring.</li>
        </ul>
      </section>

      {/* 10. Verified Limits */}
      <section id="verified-limits" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-mutedAmber" />
          10. Verified Technical Limits & Compliance Truths
        </h2>
        <div className="p-4 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-primaryText">What Psyco AI Does and Does Not Claim:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li><strong>Verified:</strong> Psyco AI enforces verified per-hop TLS transport encryption, Google-managed AES-256 storage encryption at rest for Firebase RTDB, administrative clinical lockout, and zero permanent binary media storage.</li>
            <li><strong>Not Claimed (No End-to-End Encryption):</strong> The platform does NOT claim client-side end-to-end encryption (E2EE) where server processes cannot read text. Server-side processing is required for ReBAC relationship checks, audit trail logging, structured validation, and AI prompt formatting.</li>
            <li><strong>Not Claimed (No Blanket DPDP Compliance):</strong> Psyco AI does NOT claim blanket or certified compliance with the Digital Personal Data Protection Act, 2023. Technical safeguards align with core privacy principles, while statutory obligations commence under official notifications: Act Section 6(9) & 27(1)(d) on 13 November 2026; general Data Fiduciary duties, Data Principal rights, and penalties on 13 May 2027 (G.S.R. 843(E)); Rules commence under G.S.R. 846(E) & 892(E) (Rule 4 on 13 November 2026; Rules 3, 5–16, 22, 23 on 13 May 2027).</li>
            <li><strong>Not Claimed (No Statutory Certifications):</strong> The platform does NOT claim formal third-party statutory certifications (such as DPDP, HIPAA, SOC 2 Type II, or ISO 27001) at this controlled staging stage.</li>
          </ul>
        </div>
      </section>
    </LegalDocumentLayout>
  );
}
