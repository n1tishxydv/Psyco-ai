import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { Shield, Lock, Database, Cpu, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function PrivacyPage() {
  const toc = [
    { id: 'introduction', label: '1. Introduction & Platform Operator' },
    { id: 'scope', label: '2. Scope & Applicability' },
    { id: 'data-collected', label: '3. Personal Information Collected' },
    { id: 'transient-audio-ai', label: '4. Audio Processing & AI Services' },
    { id: 'purposes-legal-basis', label: '5. Purpose of Collection & Statutory Framework' },
    { id: 'third-party-processors', label: '6. Third-Party Data Processors' },
    { id: 'storage-architecture', label: '7. Text-Only Storage & Encryption Truths' },
    { id: 'security-lockout', label: '8. Access Control & Clinical Lockout' },
    { id: 'data-retention-deletion', label: '9. Clinical Retention by Practitioner Type' },
    { id: 'breach-notification', label: '10. Security Incident & Breach Handling' },
    { id: 'children-data', label: '11. Minors & Guardian Consent' },
    { id: 'user-rights', label: '12. Your Data Privacy Rights' },
    { id: 'policy-updates-contact', label: '13. Policy Updates & Contact Details' },
  ];

  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      subtitle="Complete disclosure of how Psyco AI collects, processes, transiently analyzes, and protects personal, professional, and clinical health data."
      category="Legal Documents"
      toc={toc}
    >
      {/* 1. Introduction & Platform Operator */}
      <section id="introduction" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Shield className="w-5 h-5 text-softTeal" />
          1. Introduction & Platform Operator
        </h2>
        <p>
          Welcome to <strong>Psyco AI</strong> ("we", "our", or "the Platform"). Psyco AI is a dedicated mental health practice-management
          technology platform designed to streamline clinical appointment scheduling, patient intake, structured SOAP/DAP documentation,
          and practice administration for independent clinical psychologists, therapy clinics, and their patients.
        </p>
        <p>
          This platform is currently operated in a controlled evaluation staging environment. The designated platform contact is:
        </p>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs space-y-1">
          <p><strong>Platform Contact:</strong> {contactConfig.contactPerson}</p>
          <p><strong>Designation:</strong> {contactConfig.designation}</p>
          <p><strong>Telephone:</strong> <a href={contactConfig.phoneHref} className="text-calmGreen hover:underline">{contactConfig.phone}</a></p>
          <p><strong>Email:</strong> <a href={contactConfig.emailHref} className="text-softTeal hover:underline">{contactConfig.email}</a></p>
          <p><strong>Operational Region:</strong> {contactConfig.operationalRegion}</p>
        </div>
      </section>

      {/* 2. Scope */}
      <section id="scope" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">2. Scope & Applicability</h2>
        <p>
          This Privacy Policy governs the processing of personal data collected through our web application located at{' '}
          <a href={contactConfig.website} className="text-softTeal hover:underline">{contactConfig.website}</a> and our associated API services.
          It applies to all platform users:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Patients:</strong> Individuals seeking, scheduling, and attending mental health consultations.</li>
          <li><strong>Psychologists:</strong> Licensed mental health professionals managing independent, clinic-affiliated, or hybrid practices.</li>
          <li><strong>Practice Administrators:</strong> Authorized personnel managing practitioner verifications, clinics, and platform oversight.</li>
          <li><strong>Website Visitors:</strong> Individuals browsing public informational pages, documentation, or FAQs.</li>
        </ul>
      </section>

      {/* 3. Data Collected */}
      <section id="data-collected" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">3. Personal Information Collected</h2>
        <p>
          We adhere strictly to the principle of <em>data minimisation</em>. The specific categories of information collected depend upon your role:
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">A. Account & Authentication Data</h3>
            <p>
              When you register via email/password or authorized OAuth, we record your email address, cryptographically hashed passwords
              (managed by Firebase Authentication), assigned unique system user ID (UID), creation timestamp, role (<code>patient</code>,{' '}
              <code>psychologist</code>, or <code>admin</code>), and account status (<code>active</code>, <code>pending</code>, or <code>suspended</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">B. Patient Profile & Intake Information</h3>
            <p>
              When a patient completes onboarding or confidential intake, we collect full legal name, contact telephone, date of birth / age,
              biological sex / gender identity, emergency contact name and phone number, general medical history, current psychiatric symptoms,
              and lifestyle context.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">C. Psychologist Professional Credentials</h3>
            <p>
              For clinicians, we collect full legal name, professional license number, issuing state / jurisdiction, highest qualification degrees,
              clinical specializations, years of experience, independent practice addresses (for in-person visits), clinic memberships, and default consultation modes.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">D. Appointment & Scheduling Information</h3>
            <p>
              Consultation start and end timestamps (UTC), consultation mode (<code>in_person</code> or <code>online</code>), appointment status
              (<code>requested</code>, <code>confirmed</code>, <code>completed</code>, <code>cancelled</code>), cancellation reason codes, and confidential session PINs.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">E. Clinical Notes & Records</h3>
            <p>
              Subjective-Objective-Assessment-Plan (SOAP) records, diagnostic impressions (ICD-11/DSM-5 cross-references), treatment plans,
              clinician digital signatures, timestamped amendments, and psychologist-patient assignment relationships.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Audio Processing & AI Services */}
      <section id="transient-audio-ai" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Cpu className="w-5 h-5 text-softTeal" />
          4. Audio Processing & AI Services Transparency
        </h2>
        <div className="p-4 rounded-xl border border-softTeal/30 bg-softTeal/10 space-y-2">
          <p className="font-semibold text-primaryText">The Absolute Zero-Binary-Media Invariant:</p>
          <p>
            Unlike conventional tele-health platforms, <strong>Psyco AI strictly prohibits the persistent storage of raw audio or video recordings</strong> on its infrastructure.
            Permanent storage across Firebase Realtime Database consists exclusively of structured text and JSON metadata.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
            <h4 className="font-semibold text-softTeal">Speech-to-Text Processing & AssemblyAI Streaming Terms</h4>
            <p className="text-slate-300">
              Psyco AI integrates strictly with <strong>AssemblyAI Streaming v3</strong> (<code>wss://streaming.assemblyai.com/v3/ws</code>, using short-lived tokens obtained via <code>https://streaming.assemblyai.com/v3/token</code>). The platform does not use AssemblyAI's asynchronous prerecorded file upload service.
            </p>
            <p className="text-slate-300">
              Under AssemblyAI documentation for Streaming v3, audio data and transcripts are processed transiently in memory with zero vendor retention when the account has opted out of model training (with operational metadata retained solely for connection logging, metrics, and billing).
            </p>
            <p className="text-slate-300">
              Psyco AI does not assume that model-training opt-out has been activated in the external account settings, nor does it claim an executed enterprise Zero Data Retention (ZDR) addendum or BAA without documentary proof.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 space-y-1 text-xs text-slate-300">
            <p className="font-semibold text-primaryText flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-mutedAmber" />
              Pilot Restriction: Real Patient Audio Strictly Prohibited
            </p>
            <p>
              <strong>Real clinical audio from actual patients must NOT be processed during the staging pilot.</strong> Only synthetic or simulated test audio is authorized until account model-training opt-out status and contractual data-processing terms are formally verified.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
            <h4 className="font-semibold text-softTeal">Google Gemini AI — Google AI Studio Developer API</h4>
            <p className="text-slate-300">
              Psyco AI utilizes the <strong>Google AI Studio developer API</strong> via the <code>@google/genai</code> SDK with an API key, rather than Google Cloud Vertex AI enterprise infrastructure. Free-tier keys permit Google to log and review prompts for product evaluation, while paid billing projects operate under non-training terms.
            </p>
            <p className="text-slate-300">
              Gemini produces preliminary drafts (<code>status: 'draft'</code>) that are invisible to patients and cannot be signed or finalized without explicit human clinician review and digital signature.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Purpose & Legal Basis */}
      <section id="purposes-legal-basis" className="space-y-4">
        <h2 className="text-lg font-bold text-primaryText">5. Purpose of Collection & Statutory Framework</h2>
        <p>We process personal data under the following legitimate bases:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-slate-800 rounded-xl overflow-hidden text-xs">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 border-b border-slate-800">Processing Purpose</th>
                <th className="p-3 border-b border-slate-800">Data Categories</th>
                <th className="p-3 border-b border-slate-800">Operational & Legal Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-400">
              <tr>
                <td className="p-3 font-medium text-slate-200">Account Creation & Authentication</td>
                <td className="p-3">Email, UID, Password hash, Role</td>
                <td className="p-3">Contractual necessity to provide portal access.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Psychologist Verification</td>
                <td className="p-3">License number, State, Degree credentials</td>
                <td className="p-3">Compliance with healthcare safety & patient protection standards.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Consultation Scheduling</td>
                <td className="p-3">Appointment times, Modality, Session PIN</td>
                <td className="p-3">Explicit request of patient and psychologist.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Clinical Documentation (SOAP)</td>
                <td className="p-3">Intake history, Therapy progress, Notes</td>
                <td className="p-3">Informed consent to healthcare treatment & professional therapeutic duty.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Speech-to-Text Transcription</td>
                <td className="p-3">Transient audio buffer, Derived text</td>
                <td className="p-3">Separate, unbundled informed electronic consent.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DPDP Act Commencement Schedule */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 text-xs text-slate-300">
          <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">
            Digital Personal Data Protection Act, 2023: Phased Commencement Schedule
          </h3>
          <p>
            Governed by Ministry of Electronics and Information Technology <strong>Notification G.S.R. 843(E), dated 13 November 2025</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong>13 November 2025:</strong> Section 1(2), Section 2, Sections 18–26 (Data Protection Board of India setup and powers), Section 35, Sections 38–43 (Rulemaking and miscellaneous powers), and specified provisions of Section 44.</li>
            <li><strong>13 November 2026:</strong> Section 6(9) (notice regarding previously consented data) and Section 27(1)(d) (Board call for information under Section 6(9)).</li>
            <li><strong>13 May 2027:</strong> Sections 3–5, Section 6(1)–(8) and 6(10) (consent framework), Sections 7–17 (fiduciary duties, children's data, significant data fiduciaries, data principal rights, cross-border transfers), Section 27 except clause (d), Sections 28–34 (Board inquiries, appeals, financial penalties), Sections 36–37, and Section 44(2) (repeal of IT Act Section 43A).</li>
          </ul>
          <p className="text-[11px] text-mutedAmber mt-1">
            * Note: The general Data Fiduciary obligation framework, Data Principal rights, and statutory financial penalties commence on 13 May 2027, NOT in November 2026.
          </p>
        </div>

        {/* DPDP Rules Timeline */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 text-xs text-slate-300">
          <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">
            Digital Personal Data Protection Rules, 2025: Commencement Timeline
          </h3>
          <p>
            Notified under <strong>Notification G.S.R. 846(E), dated 13 November 2025</strong> (as corrected by Corrigendum <strong>G.S.R. 892(E)</strong>):
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong>13 November 2025:</strong> Rules 1, 2, and 17–21 (Board qualifications, terms, proceedings).</li>
            <li><strong>13 November 2026:</strong> Rule 4 (Notice regarding previously processed personal data under Section 6(9)).</li>
            <li><strong>13 May 2027:</strong> Rule 3 (Notice for consent), Rules 5–16 (Consent managers, security safeguards, breach notification, erasure, children's verifiable consent, Significant Data Fiduciary obligations, Data Principal rights), and Rules 22–23 (Board inquiries and undertakings).</li>
          </ul>
        </div>

        {/* IT Act / SPDI Rules: Obligations vs Controls */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 text-xs text-slate-300">
          <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider">
            IT Act, 2000 & SPDI Rules, 2011: Obligations vs. Implemented Controls
          </h3>
          <p>
            Mental health records constitute Sensitive Personal Data or Information (SPDI). Technical safeguards do not equate to complete legal compliance:
          </p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden text-[11px]">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="p-2 border-b border-slate-800">SPDI Obligation</th>
                  <th className="p-2 border-b border-slate-800">Implemented Technical Control</th>
                  <th className="p-2 border-b border-slate-800">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-400">
                <tr>
                  <td className="p-2 font-medium text-slate-200">Rule 4 (Privacy Policy)</td>
                  <td className="p-2">Published policy with granular disclosures at /privacy-policy</td>
                  <td className="p-2 text-softTeal">Ready for Legal Review</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-slate-200">Rule 5 (Consent Prior to Collection)</td>
                  <td className="p-2">Unbundled checkboxes in onboarding and intake (zod validated)</td>
                  <td className="p-2 text-calmGreen">Controls Active</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-slate-200">Rule 6 (Disclosure Restrictions)</td>
                  <td className="p-2">Administrative lockout & ReBAC database rules prevent leakage</td>
                  <td className="p-2 text-calmGreen">Controls Active</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-slate-200">Rule 8 (Reasonable Security)</td>
                  <td className="p-2">Transport TLS, Google AES-256 cloud encryption at rest</td>
                  <td className="p-2 text-mutedAmber">Controls Active; Not Certified</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-slate-200">Intermediary Grievance Officer</td>
                  <td className="p-2">Platform contact published; formal statutory appointment pending</td>
                  <td className="p-2 text-mutedAmber">Requires Legal Appointment</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            <strong>Intermediary & Grievance Officer Caveats:</strong> Whether Psyco AI qualifies as an intermediary under Section 2(w) of the IT Act involves legal nuances (facilitating clinician-patient communications vs. providing proprietary SaaS tools). Furthermore, Rule 3(2)(a) of the IT Intermediary Rules mandates prominent publication of the Grievance Officer's name and contact details, but does not expressly state a requirement for a physical street address. Formal appointment remains an unresolved legal action.
          </p>
        </div>
      </section>

      {/* 6. Third-Party Processors */}
      <section id="third-party-processors" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">6. Third-Party Data Processors</h2>
        <p>
          We never sell, rent, or trade your personal or clinical data. Infrastructure sub-processors include:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-primaryText text-xs">Google Firebase (Alphabet Inc.)</h4>
            <p className="text-[11px] text-slate-400">
              User authentication, identity token validation, hosting, and authoritative Realtime Database persistence. Encrypted at rest via Google-managed cloud storage encryption.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-primaryText text-xs">Render Services Inc.</h4>
            <p className="text-[11px] text-slate-400">
              Containerized Node.js/Express backend API hosting with ephemeral container storage and negotiated TLS edge termination.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-primaryText text-xs">AssemblyAI Inc.</h4>
            <p className="text-[11px] text-slate-400">
              Streaming v3 speech-to-text processing. Processed transiently in memory; model-training opt-out status requires formal account verification.
            </p>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-primaryText text-xs">Google Gemini (Google AI Studio)</h4>
            <p className="text-[11px] text-slate-400">
              Generates assistive SOAP note drafts via Google AI Studio API key. Commercial billing project binding required for non-training terms.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Storage Architecture */}
      <section id="storage-architecture" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Database className="w-5 h-5 text-softTeal" />
          7. Text-Only Storage Architecture & Encryption Truths
        </h2>
        <p>
          All persistent data is stored strictly in structured text/JSON form in Firebase Realtime Database.
          We do not provision binary file buckets (e.g. AWS S3, Google Cloud Storage) for permanent patient audio or video files.
        </p>
        <p>
          <strong>Encryption Details:</strong> Network traffic between clients, backend servers, and sub-processors uses Transport Layer Security (TLS 1.2/1.3 negotiated based on client cipher support). Database records in Firebase Realtime Database are encrypted at rest using Google-managed cloud storage encryption (AES-256 standard).
        </p>
        <div className="p-3 rounded-lg border border-mutedAmber/30 bg-mutedAmber/10 text-xs text-slate-300">
          <strong className="text-primaryText">Explicit Disclaimer — No End-to-End Encryption (E2EE):</strong> Psyco AI does NOT provide client-side end-to-end encryption. The application server must process plaintext records for relationship-based access enforcement (ReBAC), audit trail logging, structured validation, and AI prompt formatting.
        </div>
      </section>

      {/* 8. Access Control & Clinical Lockout */}
      <section id="security-lockout" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Lock className="w-5 h-5 text-calmGreen" />
          8. Access Control & Administrative Clinical Lockout
        </h2>
        <p>
          Access to clinical records is governed by strict <strong>Relationship-Based Access Control (ReBAC)</strong>:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>A psychologist can only access notes, intake questionnaires, and care plans for patients with whom they have an active therapeutic assignment.</li>
          <li>Patients can only inspect their own demographic profile, submitted intake data, and treatment summaries explicitly designated as <code>sharedWithPatient: true</code>.</li>
          <li>
            <strong className="text-primaryText">Strict Administrative Lockout:</strong> Platform administrators have zero access to clinical session notes, therapy transcripts, or intake questionnaires.
            Backend middleware returns HTTP 403 <code>ADMIN_CLINICAL_ACCESS_PROHIBITED</code>, and Realtime Database rules lock clinical nodes against administrative reads.
          </li>
        </ul>
      </section>

      {/* 9. Data Retention & Deletion */}
      <section id="data-retention-deletion" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">9. Clinical Data Retention by Practitioner Type & Applicable Law</h2>
        <p>
          Retention of clinical records depends strictly on practitioner classification, patient age, and applicable statutory guidelines:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-slate-800 rounded-xl overflow-hidden text-xs">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 border-b border-slate-800">Practitioner / Record Type</th>
                <th className="p-3 border-b border-slate-800">Regulatory Framework</th>
                <th className="p-3 border-b border-slate-800">Retention Characterization</th>
                <th className="p-3 border-b border-slate-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-400">
              <tr>
                <td className="p-3 font-medium text-slate-200">Psychiatrists / RMPs</td>
                <td className="p-3">NMC Medical Ethics Regs 2002 (Reg 1.3.1) & Telemedicine 2020</td>
                <td className="p-3">3 years (inpatient / telemedicine)</td>
                <td className="p-3 text-calmGreen">Statutory Guideline</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Clinical Psychologists / Counselors</td>
                <td className="p-3">NCAHP Act 2021, RCI, State Clinical Establishment Rules</td>
                <td className="p-3">3 to 7 years (varies by state)</td>
                <td className="p-3 text-mutedAmber">Requires Legal Review</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Minor Patients (&lt; 18 years)</td>
                <td className="p-3">Limitation Act 1963 Section 6 (procedural disability rule)</td>
                <td className="p-3">Until age 21 minimum (risk management / litigation defense)</td>
                <td className="p-3 text-mutedAmber">Requires Legal Review</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Account Profiles & Auth</td>
                <td className="p-3">DPDP Act (Purpose cessation)</td>
                <td className="p-3">Active account lifespan + 30-day purge</td>
                <td className="p-3 text-softTeal">Platform Policy</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Security Audit Logs</td>
                <td className="p-3">CERT-In Directives under IT Act s.70B</td>
                <td className="p-3">180 days to 1 year minimum</td>
                <td className="p-3 text-calmGreen">Statutory Mandate</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          <strong>Limitation Act Clarification:</strong> Section 6 of the Limitation Act, 1963 is a procedural statute of limitations governing legal disability and lawsuit filing windows; it does not constitute a statutory health-code retention command. Retaining pediatric records until age 21 is a risk-mitigation practice to preserve evidence against potential claims. All retention periods for non-RMP practitioners and minor records remain classified as <strong>REQUIRES LEGAL REVIEW</strong>.
        </p>
      </section>

      {/* 10. Breach Notification */}
      <section id="breach-notification" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">10. Security Incident & Breach Handling</h2>
        <p>
          In the event of a verified security incident affecting the integrity or confidentiality of personal data,
          Psyco AI executes the containment protocols defined in our Operational Incident Response Guide.
          Affected participants and applicable authorities (such as CERT-In or the Data Protection Board of India, as required by law)
          will be notified without undue delay.
        </p>
      </section>

      {/* 11. Minors */}
      <section id="children-data" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">11. Minors & Guardian Consent</h2>
        <p>
          Psyco AI is intended for individuals aged 18 and older. For patients under 18 years of age, account registration
          and consultation scheduling require verifiable informed consent from a parent or legal guardian in accordance with
          applicable child data protection laws.
        </p>
      </section>

      {/* 12. User Privacy Rights */}
      <section id="user-rights" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">12. Your Data Privacy Rights</h2>
        <p>
          Under the Digital Personal Data Protection Act, 2023 and general privacy principles, you have the right to:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Right to Access:</strong> Request a summary of personal data being processed.</li>
          <li><strong>Right to Correction:</strong> Correct inaccurate or incomplete personal information.</li>
          <li><strong>Right to Erasure:</strong> Request deletion of personal data, subject to mandatory medical record retention laws.</li>
          <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for non-essential processing (such as speech-to-text transcription).</li>
          <li><strong>Right of Grievance Redressal:</strong> Submit a complaint regarding personal data processing.</li>
        </ul>
        <p>
          To exercise any of these rights, visit our <a href="/privacy-requests" className="text-softTeal underline">Data Rights & Privacy Requests Page</a>.
        </p>
      </section>

      {/* 13. Policy Updates */}
      <section id="policy-updates-contact" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">13. Policy Updates & Contact Details</h2>
        <p>
          We may update this Privacy Policy periodically to reflect enhancements in technology, statutory regulations, or healthcare standards.
          When revisions occur, the "Effective Date" at the top of this document will be revised accordingly.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
