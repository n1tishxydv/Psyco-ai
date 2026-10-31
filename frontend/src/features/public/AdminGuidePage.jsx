import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { Building, ShieldCheck, EyeOff, Lock, UserCheck, AlertTriangle, FileText } from 'lucide-react';

export function AdminGuidePage() {
  const toc = [
    { id: 'admin-scope', label: '1. Administrative Governance Scope' },
    { id: 'clinical-lockout-mandate', label: '2. The Clinical Privacy Lockout Mandate' },
    { id: 'psychologist-verification', label: '3. Psychologist Verification Protocol' },
    { id: 'clinic-management', label: '4. Clinic & Facility Oversight' },
    { id: 'suspension-protocol', label: '5. User Suspension & Account Safeguards' },
    { id: 'audit-inspection', label: '6. System Audit Log Inspection' },
  ];

  return (
    <LegalDocumentLayout
      title="Platform Administrator & Governance Guide"
      subtitle="Standard operating procedures, credential verification workflows, and clinical privacy boundaries for platform administrators."
      category="User Guides and Support"
      toc={toc}
    >
      {/* 1. Scope */}
      <section id="admin-scope" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Building className="w-5 h-5 text-softTeal" />
          1. Administrative Governance Scope
        </h2>
        <p>
          Platform administrators on Psyco AI are responsible for technical platform maintenance,
          reviewing psychologist credentials, managing clinic registrations, addressing support tickets,
          and monitoring system health.
        </p>
      </section>

      {/* 2. Clinical Lockout */}
      <section id="clinical-lockout-mandate" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-mutedAmber" />
          2. The Clinical Privacy Lockout Mandate
        </h2>
        <div className="p-4 rounded-xl border border-mutedAmber/40 bg-mutedAmber/10 space-y-2 text-xs text-slate-200">
          <p className="font-bold text-sm text-mutedAmber">
            ADMINISTRATORS ARE PROHIBITED FROM ACCESSING CLINICAL DATA.
          </p>
          <p className="leading-relaxed">
            By design, administrator accounts cannot read patient intake disclosures, therapy session notes,
            clinical recommendations, or speech transcripts. Any technical attempt to access clinical nodes
            is blocked by backend middleware with HTTP 403 <code>ADMIN_CLINICAL_ACCESS_PROHIBITED</code>
            and rejected by Firebase Realtime Database rules.
          </p>
        </div>
      </section>

      {/* 3. Verification Protocol */}
      <section id="psychologist-verification" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-calmGreen" />
          3. Psychologist Verification Protocol
        </h2>
        <p>
          When a psychologist registers, their account is placed in <code>approvalStatus: 'pending'</code>.
          Administrators must verify:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li>The clinician's declared professional license number against relevant state or national licensing boards.</li>
          <li>Accreditation of highest clinical qualification degrees (e.g. M.Phil in Clinical Psychology, Psy.D, Ph.D).</li>
          <li>Accuracy of physical clinic address for in-person consultation offerings.</li>
        </ul>
        <p className="text-xs text-slate-400">
          Approvals and rejections are executed via <code>PUT /api/v1/admin/psychologists/:id/verification</code> and logged immutably to <code>/auditLogs</code>.
        </p>
      </section>

      {/* 4. Clinic Management */}
      <section id="clinic-management" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">4. Clinic & Facility Oversight</h2>
        <p>
          Administrators register and oversee clinic entities, verifying operating hours and practitioner memberships.
          Clinicians operating independently do not require a clinic association.
        </p>
      </section>

      {/* 5. Suspension Protocol */}
      <section id="suspension-protocol" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Lock className="w-5 h-5 text-softTeal" />
          5. User Suspension & Account Safeguards
        </h2>
        <p>
          In the event of fraudulent activity, credential falsification, or policy breach, an administrator may immediately
          suspend a user via <code>PUT /api/v1/admin/users/:userId/suspend</code>. Suspension immediately denies API access
          and prevents subsequent logins.
        </p>
      </section>

      {/* 6. Audit Inspection */}
      <section id="audit-inspection" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <FileText className="w-5 h-5 text-softTeal" />
          6. System Audit Log Inspection
        </h2>
        <p>
          Administrators review append-only security logs in the Admin Dashboard to track authentication failures,
          privilege modifications, and anomalous request patterns. Client writes to <code>/auditLogs</code> are locked to prevent tampering.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
