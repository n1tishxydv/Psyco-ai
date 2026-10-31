import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { Lock, ShieldAlert, AlertTriangle, EyeOff, FileText, Ban } from 'lucide-react';

export function AcceptableUsePage() {
  const toc = [
    { id: 'purpose-scope', label: '1. Purpose & Core Standards' },
    { id: 'prohibited-clinical', label: '2. Clinical Privacy & Lockout Violations' },
    { id: 'credential-fraud', label: '3. Professional Impersonation & Credential Fraud' },
    { id: 'security-probing', label: '4. Security Violations & Unauthorized Testing' },
    { id: 'automated-abuse', label: '5. Automated Scraping & Bot Abuse' },
    { id: 'binary-uploads', label: '6. Prohibition of Binary Media Uploads' },
    { id: 'enforcement-suspension', label: '7. Enforcement & Account Suspension' },
    { id: 'reporting-violations', label: '8. How to Report Violations' },
  ];

  return (
    <LegalDocumentLayout
      title="Acceptable Use Policy"
      subtitle="Operational rules, security boundaries, and ethical standards required of all participants on the Psyco AI platform."
      category="Legal Documents"
      toc={toc}
    >
      {/* 1. Purpose */}
      <section id="purpose-scope" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Lock className="w-5 h-5 text-softTeal" />
          1. Purpose & Core Standards
        </h2>
        <p>
          Psyco AI provides a trusted digital environment for mental health practice management.
          To protect patient confidentiality, clinical integrity, and system stability, all users
          (patients, clinicians, administrators, and visitors) must comply with this Acceptable Use Policy.
        </p>
      </section>

      {/* 2. Clinical Privacy */}
      <section id="prohibited-clinical" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-calmGreen" />
          2. Clinical Privacy & Lockout Violations
        </h2>
        <p>The following actions are strictly prohibited and constitute immediate grounds for termination:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
          <li><strong>Bypassing Administrative Lockout:</strong> Any attempt by an administrative user to read, query, intercept, or decrypt clinical session notes, therapy transcripts, or patient intake answers.</li>
          <li><strong>Cross-Patient Record Access:</strong> Any attempt by a psychologist or user to query records for patients outside their explicitly assigned therapeutic caseload.</li>
          <li><strong>Session Snooping:</strong> Intercepting or sniffing another user's consultation sessions, session PINs, or confidential video links.</li>
        </ul>
      </section>

      {/* 3. Credential Fraud */}
      <section id="credential-fraud" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Ban className="w-5 h-5 text-mutedAmber" />
          3. Professional Impersonation & Credential Fraud
        </h2>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
          <li><strong>Fabricated Clinical Credentials:</strong> Registering as a psychologist using false license numbers, fabricated academic degrees, or forged credentials.</li>
          <li><strong>Impersonation:</strong> Impersonating another licensed healthcare practitioner, patient, or platform administrator.</li>
          <li><strong>Unauthorized Practice:</strong> Offering mental health counseling without possessing a valid, lawful license in your operating jurisdiction.</li>
        </ul>
      </section>

      {/* 4. Security Probing */}
      <section id="security-probing" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-mutedAmber" />
          4. Security Violations & Unauthorized Testing
        </h2>
        <p>Except within an explicitly authorized, written penetration test agreement signed by the platform operators, you may not:</p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li>Probe, scan, or test the vulnerability of our APIs, database rules, or staging infrastructure.</li>
          <li>Launch Denial of Service (DoS) attacks or flood backend endpoints with artificial load.</li>
          <li>Inject malicious code, SQL/NoSQL payload injections, or Cross-Site Scripting (XSS) vectors.</li>
        </ul>
      </section>

      {/* 5. Automated Abuse */}
      <section id="automated-abuse" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">5. Automated Scraping & Bot Abuse</h2>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li>Using automated scrapers, bots, or spiders to harvest provider bios, clinic addresses, or patient directories.</li>
          <li>Automating appointment bookings or manipulating availability calendars through script execution.</li>
          <li>Extracting or reverse-engineering proprietary AI prompt structures or clinical schema definitions.</li>
        </ul>
      </section>

      {/* 6. Binary Uploads */}
      <section id="binary-uploads" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Lock className="w-5 h-5 text-softTeal" />
          6. Prohibition of Binary Media Uploads
        </h2>
        <p>
          Psyco AI operates under an absolute <strong>Zero Binary Media Invariant</strong>.
          Users are strictly prohibited from attempting to bypass text validation by uploading, embedding,
          or transmitting base64-encoded audio, video files, or binary executable blobs into text input fields.
        </p>
      </section>

      {/* 7. Enforcement */}
      <section id="enforcement-suspension" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">7. Enforcement & Account Suspension</h2>
        <p>
          We employ automated rate limiters and backend audit trails to detect abusive behavior.
          Upon identifying a violation of this policy, Psyco AI administrators may:
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li>Immediately suspend the account via administrative command (<code>PUT /api/v1/admin/users/:id/suspend</code>).</li>
          <li>Invalidate active authentication sessions and revoke API authorization tokens.</li>
          <li>Report illegal impersonation or unauthorized clinical access to relevant law enforcement and medical licensing boards.</li>
        </ol>
      </section>

      {/* 8. Reporting */}
      <section id="reporting-violations" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">8. How to Report Violations</h2>
        <p>
          If you observe a violation of this policy or discover a security observation, please report it immediately:
        </p>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1">
          <p><strong>Security & Abuse Contact:</strong> {contactConfig.contactPerson} ({contactConfig.designation})</p>
          <p><strong>Email:</strong> <a href={contactConfig.emailHref} className="text-softTeal hover:underline">{contactConfig.email}</a></p>
          <p><strong>Emergency Telephone:</strong> <a href={contactConfig.phoneHref} className="text-calmGreen hover:underline">{contactConfig.phone}</a></p>
        </div>
      </section>
    </LegalDocumentLayout>
  );
}
