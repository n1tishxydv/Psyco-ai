import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { AlertTriangle, Phone, ShieldAlert, HeartHandshake, Stethoscope, Lock } from 'lucide-react';

export function MedicalDisclaimerPage() {
  const toc = [
    { id: 'emergency-crisis', label: '1. Acute Emergency & Crisis Protocol' },
    { id: 'not-medical-provider', label: '2. Platform Intermediary Disclaimer' },
    { id: 'no-autonomous-diagnosis', label: '3. No Autonomous Medical Diagnosis' },
    { id: 'clinician-responsibility', label: '4. Clinician Responsibility' },
    { id: 'verified-helplines', label: '5. Verified Official Crisis Resources' },
    { id: 'international-guidance', label: '6. International Emergency Guidance' },
  ];

  return (
    <LegalDocumentLayout
      title="Medical & Clinical Disclaimer"
      subtitle="Critical notice regarding platform scope, non-emergency status, clinical responsibility, and verified national crisis contacts."
      category="Legal Documents"
      toc={toc}
    >
      {/* 1. Emergency Crisis */}
      <section id="emergency-crisis" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-mutedAmber" />
          1. Acute Emergency & Crisis Protocol
        </h2>
        <div className="p-4 rounded-xl border border-mutedAmber/40 bg-mutedAmber/10 space-y-2 text-xs text-slate-200">
          <p className="font-bold text-sm text-mutedAmber">
            PSYCO AI IS NOT AN EMERGENCY HOTLINE OR ACUTE CRISIS RESPONSE SERVICE.
          </p>
          <p className="leading-relaxed">
            If you, a patient, or someone you know is experiencing acute psychiatric distress, severe panic, thoughts of self-harm,
            suicidal ideation, or is in immediate physical danger, <strong>DO NOT rely on this website or wait for an appointment booking</strong>.
            Immediately contact national emergency medical services or call one of the verified helplines listed below.
          </p>
        </div>
      </section>

      {/* 2. Platform Intermediary */}
      <section id="not-medical-provider" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-softTeal" />
          2. Platform Intermediary Disclaimer
        </h2>
        <p>
          <strong>Psyco AI is a technology platform and practice management software.</strong>
          Psyco AI does not practice medicine, psychotherapy, clinical psychology, or psychiatric pharmacology.
          The platform operates as a secure technical infrastructure connecting patients with independent licensed clinicians
          and assisting those clinicians with administrative documentation workflows.
        </p>
        <p>
          Nothing on this website—including feature descriptions, FAQs, documentation, assessment questionnaires,
          or AI-generated text—should be construed as medical, psychological, or psychiatric advice from Psyco AI.
        </p>
      </section>

      {/* 3. No Autonomous Diagnosis */}
      <section id="no-autonomous-diagnosis" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-calmGreen" />
          3. No Autonomous Medical Diagnosis or Prescribing
        </h2>
        <p>
          Artificial intelligence tools deployed within Psyco AI (such as Google Gemini) serve strictly as documentation assistants
          for licensed psychologists. The platform:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li><strong>Does NOT diagnose:</strong> Algorithmic drafts are preliminary text suggestions requiring psychologist review and modification.</li>
          <li><strong>Does NOT prescribe:</strong> Psyco AI does not prescribe, endorse, or recommend pharmaceutical drugs, psychotropic medications, or dosage regimens.</li>
          <li><strong>Does NOT substitute for a doctor:</strong> Any health decisions must be made in consultation with a qualified, licensed healthcare professional.</li>
        </ul>
      </section>

      {/* 4. Clinician Responsibility */}
      <section id="clinician-responsibility" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">4. Treating Clinician Responsibility</h2>
        <p>
          The therapeutic relationship exists exclusively between the patient and their treating mental health professional.
          Treating psychologists retain sole and independent clinical judgment for diagnostic evaluation, therapy plans,
          risk management, and crisis referral decisions. Psyco AI is not liable for clinical advice or treatment outcomes.
        </p>
      </section>

      {/* 5. Verified Helplines */}
      <section id="verified-helplines" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Phone className="w-5 h-5 text-calmGreen" />
          5. Verified Official Crisis Resources (India)
        </h2>
        <p className="text-xs text-slate-400">
          The following emergency resources have been verified from official government announcements and established helplines:
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-primaryText text-sm">Tele-MANAS (Govt. of India Tele Mental Health)</span>
              <a href="tel:14416" className="font-mono text-softTeal text-sm font-semibold hover:underline">
                14416 / 1800-891-4416
              </a>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              National Tele Mental Health Programme launched by the Ministry of Health and Family Welfare (MoHFW), Govt. of India.
              Available 24 hours a day, 7 days a week, toll-free across India in multiple regional languages.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-primaryText text-sm">KIRAN (National Mental Health Helpline)</span>
              <a href="tel:18005990019" className="font-mono text-softTeal text-sm font-semibold hover:underline">
                1800-599-0019
              </a>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              24/7 toll-free helpline initiated by the Department of Empowerment of Persons with Disabilities,
              Ministry of Social Justice & Empowerment, Govt. of India, providing first-line counseling and psychological support.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-bold text-primaryText text-sm">National Emergency Services (India)</span>
              <a href="tel:112" className="font-mono text-calmGreen text-sm font-semibold hover:underline">
                112
              </a>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Unified emergency phone number for immediate police, fire, or emergency medical dispatch across India.
            </p>
          </div>
        </div>
      </section>

      {/* 6. International Guidance */}
      <section id="international-guidance" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">6. International Emergency Guidance</h2>
        <p>
          If you are accessing Psyco AI from outside India:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li><strong>United States & Canada:</strong> Call or text <strong>988</strong> to reach the Suicide & Crisis Lifeline, or dial <strong>911</strong> for emergency medical dispatch.</li>
          <li><strong>United Kingdom:</strong> Call <strong>111</strong> for NHS mental health services or dial <strong>999</strong> for emergency services.</li>
          <li><strong>Other Countries:</strong> Please proceed immediately to your nearest hospital emergency department or contact your local national emergency services.</li>
        </ul>
      </section>
    </LegalDocumentLayout>
  );
}
