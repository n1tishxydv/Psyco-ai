import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { RefreshCw, Database, Lock, Clock, ShieldCheck, AlertCircle, FileText } from 'lucide-react';

export function DataRetentionPolicyPage() {
  const toc = [
    { id: 'retention-principles', label: '1. Retention Principles & Zero-Binary Policy' },
    { id: 'retention-schedule', label: '2. Data Category Retention Schedule' },
    { id: 'temporary-data', label: '3. Ephemeral & Volatile Processing Data' },
    { id: 'clinical-retention-conflict', label: '4. Erasure Requests vs. Healthcare Record Retention' },
    { id: 'deletion-procedure', label: '5. Account Deletion & Purge Procedure' },
    { id: 'legal-review-items', label: '6. Items Marked for Statutory Confirmation' },
  ];

  return (
    <LegalDocumentLayout
      title="Data Retention & Deletion Policy"
      subtitle="Operational lifecycle rules governing storage duration, automated purges, and data erasure workflows across Psyco AI."
      category="Privacy and Data Protection"
      toc={toc}
    >
      {/* 1. Principles */}
      <section id="retention-principles" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Clock className="w-5 h-5 text-softTeal" />
          1. Retention Principles & Zero-Binary Policy
        </h2>
        <p>
          Psyco AI retains personal and clinical information strictly for the duration necessary to deliver mental health practice-management
          services, satisfy statutory healthcare record-keeping mandates, and maintain platform security.
        </p>
        <div className="p-4 rounded-xl border border-softTeal/30 bg-softTeal/10 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-primaryText">The Absolute Zero-Binary Retention Rule:</p>
          <p>
            Raw consultation audio, video streams, and temporary speech buffers are never stored on persistent media.
            Their retention period is exactly <strong>0 seconds on persistent storage</strong>.
            Audio streamed for speech-to-text conversion exists in volatile memory only during transcription and is wiped immediately upon text extraction.
          </p>
        </div>
      </section>

      {/* 2. Retention Schedule */}
      <section id="retention-schedule" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Database className="w-5 h-5 text-softTeal" />
          2. Data Category Retention Schedule
        </h2>
        <p className="text-xs text-slate-300">
          The table below outlines our verified storage schedules based on actual backend implementation and healthcare standards:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border border-slate-800 rounded-xl overflow-hidden text-xs">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 border-b border-slate-800">Data Category</th>
                <th className="p-3 border-b border-slate-800">Database Location</th>
                <th className="p-3 border-b border-slate-800">Retention Period</th>
                <th className="p-3 border-b border-slate-800">Statutory Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-400">
              <tr>
                <td className="p-3 font-medium text-slate-200">Account Credentials & Roles</td>
                <td className="p-3 font-mono">/users/$uid</td>
                <td className="p-3">Active account lifespan + 30 days after deletion request.</td>
                <td className="p-3">Account administration and fraud prevention.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Patient Demographic Profiles</td>
                <td className="p-3 font-mono">/patients/$uid</td>
                <td className="p-3">Duration of active care relationship.</td>
                <td className="p-3">Facilitating practitioner identification and emergency referral.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Psychologist Credentials & Licenses</td>
                <td className="p-3 font-mono">/psychologists/$uid</td>
                <td className="p-3">Duration of professional affiliation + 3 years.</td>
                <td className="p-3">Verification audit trail and malpractice compliance.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Appointment Records</td>
                <td className="p-3 font-mono">/appointments/$id</td>
                <td className="p-3">3 years minimum.</td>
                <td className="p-3">Attendance reconciliation, billing defense, and tele-consult audit logs (REQUIRES LEGAL REVIEW).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Psychiatrist / RMP Clinical Records</td>
                <td className="p-3 font-mono">/sessionNotes/$id</td>
                <td className="p-3">3 years minimum (indoor records) / 3 years tele-consults.</td>
                <td className="p-3">National Medical Commission (NMC) 2002 Regulations (Reg 1.3.1) and Telemedicine Practice Guidelines, 2020 (REQUIRES LEGAL REVIEW).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Psychologist Therapy Session Notes</td>
                <td className="p-3 font-mono">/sessionNotes/$id</td>
                <td className="p-3">Subject to state rules / 3 to 7 years.</td>
                <td className="p-3">Outpatient psychotherapy notes governed by NCAHP Act 2021, state establishment rules, and ethics (REQUIRES LEGAL REVIEW).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Pediatric / Minor Patient Records</td>
                <td className="p-3 font-mono">/sessionNotes/$id</td>
                <td className="p-3">Recommended until patient reaches age 21+ (7 to 10+ years).</td>
                <td className="p-3">Limitation Act 1963 Section 6 tolls limitation for legal disability, permitting suits up to age 21 (risk-mitigation prudence, not a direct statutory medical code mandate; REQUIRES LEGAL REVIEW).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Security Audit Logs</td>
                <td className="p-3 font-mono">/auditLogs</td>
                <td className="p-3">12 months minimum (append-only).</td>
                <td className="p-3">IT Act 2000 / CERT-In cybersecurity compliance (REQUIRES LEGAL REVIEW).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-200">Contact & Support Inquiries</td>
                <td className="p-3 font-mono">/contactSubmissions</td>
                <td className="p-3">180 days from resolution.</td>
                <td className="p-3">User assistance and customer feedback review.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Ephemeral Data */}
      <section id="temporary-data" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">3. Ephemeral & Volatile Processing Data</h2>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
          <li><strong>Streaming Audio Chunks:</strong> Retained in volatile RAM for sub-second processing durations and immediately overwritten.</li>
          <li><strong>AI Prompt In-Transit Buffers:</strong> Request payloads sent to the Gemini REST API are discarded from process memory upon HTTP response completion.</li>
          <li><strong>Draft AI Notes (Unsigned):</strong> Unsigned drafts in <code>/aiDrafts</code> may be discarded or replaced by the psychologist during the drafting session.</li>
        </ul>
      </section>

      {/* 4. Conflict with Medical Laws */}
      <section id="clinical-retention-conflict" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-softTeal" />
          4. Erasure Requests vs. Healthcare Record Retention
        </h2>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-primaryText">Important Healthcare Law Distinction:</p>
          <p>
            Under both the Digital Personal Data Protection Act, 2023 (Section 12) and international privacy frameworks,
            the <strong>Right to Erasure is subject to statutory compliance obligations</strong>.
            Because healthcare regulations require mental health professionals to preserve clinical records for a mandatory statutory period:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
            <li>A patient request to delete their account will immediately deactivate their login credentials, revoke active session tokens, and anonymize non-clinical demographic data.</li>
            <li>For Registered Medical Practitioners (RMPs / Psychiatrists), clinical records are subject to NMC 2002 ethics rules (3-year indoor retention) and Telemedicine Practice Guidelines 2020.</li>
            <li>For Clinical Psychologists and Counselors, retention obligations are governed by the NCAHP Act 2021, state clinical establishment guidelines, and professional association codes rather than a single 3-year NMC rule.</li>
            <li>For pediatric and adolescent patients (minors), Section 6 of the Limitation Act, 1963 extends legal disability until age 18, permitting suits up to age 21. While not an affirmative healthcare code mandate, preserving records until at least age 21 is a necessary clinical risk-mitigation practice (REQUIRES LEGAL REVIEW).</li>
            <li>In Psyco AI's current staging database, records persist without automated self-destruct cron jobs; operational schedules require independent legal sign-off.</li>
          </ul>
        </div>
      </section>

      {/* 5. Deletion Procedure */}
      <section id="deletion-procedure" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">5. Account Deletion & Purge Procedure</h2>
        <p>To request permanent deletion of your account and personal data:</p>
        <ol className="list-decimal list-inside space-y-1.5 pl-2 text-xs text-slate-300">
          <li>Submit a formal data request via our <a href="/privacy-requests" className="text-softTeal underline">Privacy Requests Form</a>.</li>
          <li>The platform team verifies your account identity to prevent unauthorized deletion.</li>
          <li>Upon verification, your Firebase Auth account is permanently deleted, and your <code>/users/$uid</code> record is removed.</li>
          <li>Confirmation is provided to your registered email address within reasonable operational timeframes.</li>
        </ol>
      </section>

      {/* 6. Legal Review Items */}
      <section id="legal-review-items" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-mutedAmber" />
          6. Items Marked for Statutory Confirmation
        </h2>
        <p className="text-xs text-slate-400">
          Prior to public commercial rollout, qualified legal counsel must confirm the exact statutory retention periods
          under the Mental Healthcare Act, 2017 (India), the National Medical Commission guidelines, and applicable state regulations.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
