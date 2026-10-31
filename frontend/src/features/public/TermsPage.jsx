import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { Scale, ShieldAlert, AlertTriangle, CheckCircle2, UserCheck, Stethoscope, Lock } from 'lucide-react';

export function TermsPage() {
  const toc = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'eligibility-account', label: '2. Eligibility & Account Security' },
    { id: 'patient-terms', label: '3. Patient Responsibilities' },
    { id: 'psychologist-terms', label: '4. Psychologist Responsibilities & Credentials' },
    { id: 'practice-modalities', label: '5. Practice Modalities (Independent & Clinic)' },
    { id: 'appointments-cancellation', label: '6. Appointment Scheduling & Cancellation' },
    { id: 'clinical-documentation', label: '7. Clinical Documentation & Digital Signatures' },
    { id: 'ai-features', label: '8. AI Copilot & Assistive Drafting Rules' },
    { id: 'intellectual-property', label: '9. Intellectual Property & User Content' },
    { id: 'prohibited-conduct', label: '10. Prohibited Activities & Misuse' },
    { id: 'suspension-termination', label: '11. Account Suspension & Termination' },
    { id: 'disclaimer-liability', label: '12. Warranty Disclaimers & Limitation of Liability' },
    { id: 'governing-law', label: '13. Governing Law & Dispute Resolution' },
    { id: 'contact-amendments', label: '14. Amendments & Contact Details' },
  ];

  return (
    <LegalDocumentLayout
      title="Terms of Service"
      subtitle="Standard platform conditions governing user accounts, clinician practice management, appointment bookings, and clinical documentation."
      category="Legal Documents"
      toc={toc}
    >
      {/* 1. Acceptance */}
      <section id="acceptance" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Scale className="w-5 h-5 text-softTeal" />
          1. Acceptance of Terms
        </h2>
        <p>
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you") and the operators
          of <strong>Psyco AI</strong> ("we", "us", or "the Platform"). By accessing, creating an account, or using our services at{' '}
          <a href={contactConfig.website} className="text-softTeal hover:underline">{contactConfig.website}</a>, you acknowledge that you
          have read, understood, and agree to be bound by these Terms and our companion <a href="/privacy-policy" className="text-softTeal underline">Privacy Policy</a>.
        </p>
        <p>
          If you do not agree to these Terms, you must immediately discontinue use of the platform.
        </p>
      </section>

      {/* 2. Eligibility & Account */}
      <section id="eligibility-account" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">2. Eligibility & Account Security</h2>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><strong>Age Requirement:</strong> You must be at least 18 years of age to register an account independently. Minor patients may only access services with verifiable parent or legal guardian consent.</li>
          <li><strong>Account Integrity:</strong> You agree to provide true, accurate, and current information during registration and to maintain password security.</li>
          <li><strong>Credential Non-Transferability:</strong> Account credentials must not be shared. You are responsible for all activities conducted under your authenticated session.</li>
        </ul>
      </section>

      {/* 3. Patient Responsibilities */}
      <section id="patient-terms" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-softTeal" />
          3. Patient Responsibilities
        </h2>
        <p>As a patient utilizing the platform, you agree to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Provide accurate health and intake disclosures to assist your treating psychologist in clinical assessments.</li>
          <li>Maintain scheduled appointments and provide timely advance notice in the event of cancellation or rescheduling.</li>
          <li>Acknowledge that Psyco AI is a practice-management technology intermediary and does not independently provide medical or psychological treatment.</li>
        </ul>
      </section>

      {/* 4. Psychologist Responsibilities */}
      <section id="psychologist-terms" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-calmGreen" />
          4. Psychologist Responsibilities & Credentials
        </h2>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li><strong>Professional Licensure:</strong> Psychologists registering on Psyco AI warrant that they hold valid, active licenses or certifications to practice mental healthcare in their declared jurisdiction.</li>
          <li><strong>Verification Process:</strong> Clinicians must submit license numbers and credential details for administrative verification. Psyco AI reserves the right to suspend or reject any account where credentials cannot be verified.</li>
          <li><strong>Independent Clinical Judgment:</strong> Treating psychologists retain unalienable, independent responsibility for clinical diagnoses, assessments, therapy plans, and emergency safety interventions.</li>
        </ul>
      </section>

      {/* 5. Practice Modalities */}
      <section id="practice-modalities" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">5. Practice Modalities (Independent & Clinic)</h2>
        <p>Psyco AI supports three distinct practice configurations:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1">
            <h4 className="font-semibold text-softTeal">Independent Practice</h4>
            <p className="text-slate-400">Clinician operates independently without a clinic association. Supports online tele-health and independent office visits.</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1">
            <h4 className="font-semibold text-softTeal">Clinic-Affiliated</h4>
            <p className="text-slate-400">Clinician belongs to an organized mental health facility or multi-provider clinic operating under administrative coordination.</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1">
            <h4 className="font-semibold text-softTeal">Hybrid Practice</h4>
            <p className="text-slate-400">Clinician combines independent private practice hours with affiliated institutional clinic hours seamlessly.</p>
          </div>
        </div>
      </section>

      {/* 6. Appointments & Cancellation */}
      <section id="appointments-cancellation" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">6. Appointment Scheduling & Cancellation</h2>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><strong>Lead-Time Requirement:</strong> New bookings require a minimum advance lead time of 30 minutes to prevent uncoordinated schedule conflicts.</li>
          <li><strong>Conflict Engine:</strong> Our scheduling engine mathematically prevents double-booking for the same clinician slot.</li>
          <li><strong>Cancellation Policy:</strong> Both patients and psychologists may cancel appointments through their portals. Specific cancellation fee policies (if any) are determined independently by treating clinicians.</li>
          <li><strong>Consultation Modes:</strong> In-person consultations occur at the psychologist's verified office address; online video consultations occur via Google Meet.</li>
        </ul>
      </section>

      {/* 7. Clinical Documentation */}
      <section id="clinical-documentation" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Lock className="w-5 h-5 text-softTeal" />
          7. Clinical Documentation & Digital Signatures
        </h2>
        <p>
          Psyco AI facilitates structured SOAP documentation. Once signed by a psychologist, clinical notes are locked against modification.
          Subsequent modifications must be appended as versioned addenda, preserving an immutable historical audit record.
          Administrative roles are mathematically barred from accessing clinical session content.
        </p>
      </section>

      {/* 8. AI Features */}
      <section id="ai-features" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">8. AI Copilot & Assistive Drafting Rules</h2>
        <div className="p-4 rounded-xl border border-softTeal/30 bg-softTeal/10 space-y-2">
          <p className="font-semibold text-primaryText">Human-in-the-Loop Principle:</p>
          <p>
            AI tools provided on the platform (Gemini AI and AssemblyAI speech-to-text) operate under a strict
            <strong> Human-in-the-Loop paradigm</strong>. AI suggestions are strictly advisory drafts.
            The software never diagnoses conditions, prescribes medication, or signs clinical notes independently.
            The psychologist is solely responsible for reviewing, editing, and verifying all final entries.
          </p>
        </div>
      </section>

      {/* 9. IP */}
      <section id="intellectual-property" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">9. Intellectual Property & User Content</h2>
        <p>
          The Psyco AI brand, source code, UI designs, and documentation are the exclusive intellectual property of the platform operators.
          Users retain ownership of the factual content they submit, granting Psyco AI a limited, non-exclusive license solely to process and store
          that data to deliver practice management functionality.
        </p>
      </section>

      {/* 10. Prohibited Conduct */}
      <section id="prohibited-conduct" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">10. Prohibited Activities & Misuse</h2>
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Attempt unauthorized access to clinical records, transcripts, or another user's account.</li>
          <li>Scrape, extract, or reverse-engineer platform databases, APIs, or AI prompts.</li>
          <li>Submit false, fraudulent, or impersonated professional credentials.</li>
          <li>Upload binary media (audio, video, image files) into text-only database fields.</li>
        </ul>
      </section>

      {/* 11. Suspension & Termination */}
      <section id="suspension-termination" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">11. Account Suspension & Termination</h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate these Terms, fail credential verification,
          or present security risks to platform participants. Suspended users are immediately denied API authorization.
        </p>
      </section>

      {/* 12. Limitation of Liability */}
      <section id="disclaimer-liability" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">12. Warranty Disclaimers & Limitation of Liability</h2>
        <p>
          The platform is provided on an "AS IS" and "AS AVAILABLE" basis during the current staging evaluation.
          To the maximum extent permitted by applicable law, Psyco AI disclaims all express or implied warranties.
          The platform operators shall not be liable for indirect, incidental, or consequential damages resulting from platform use.
        </p>
      </section>

      {/* 13. Governing Law */}
      <section id="governing-law" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">13. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection
          with these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
        </p>
      </section>

      {/* 14. Amendments */}
      <section id="contact-amendments" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">14. Amendments & Contact Details</h2>
        <p>
          We may modify these Terms at any time by posting the updated terms with a revised Effective Date.
          Continued use of the platform constitutes acceptance of the revised Terms.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
