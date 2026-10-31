import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { Cpu, ShieldCheck, Lock, AlertTriangle, CheckCircle2, UserCheck, Stethoscope } from 'lucide-react';

export function AiTransparencyPage() {
  const toc = [
    { id: 'purpose-model', label: '1. Model Deployment & Scope of Use' },
    { id: 'clinical-hitl', label: '2. Human-in-the-Loop (HITL) Workflow' },
    { id: 'draft-generation', label: '3. How SOAP Drafts Are Generated' },
    { id: 'limitations-risks', label: '4. Clinical Limitations & Known Hallucination Risks' },
    { id: 'prohibitions', label: '5. Absolute Clinical Prohibitions' },
    { id: 'privacy-guardrails', label: '6. Third-Party AI & Speech Processing Disclosures' },
    { id: 'clinician-accountability', label: '7. Clinician Accountability & Ethics' },
  ];

  return (
    <LegalDocumentLayout
      title="AI Transparency & Clinical Safety Framework"
      subtitle="An in-depth disclosure of how artificial intelligence is utilized in Psyco AI under strict Human-in-the-Loop governance."
      category="Clinical Safety and AI Transparency"
      toc={toc}
    >
      {/* 1. Purpose & Model */}
      <section id="purpose-model" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Cpu className="w-5 h-5 text-softTeal" />
          1. Model Deployment & Scope of Use
        </h2>
        <p>
          Psyco AI utilizes Google's <strong>Gemini Large Language Model (LLM)</strong> solely as an administrative
          and clinical documentation copilot. The sole operational scope of AI in Psyco AI is to assist licensed psychologists
          in drafting structured clinical consultation records (SOAP notes).
        </p>
        <p>
          AI features are designed to reduce administrative documentation burden, allowing mental health professionals
          to dedicate more time to empathetic patient care. <strong>AI is never an autonomous agent or practitioner on the platform.</strong>
        </p>
      </section>

      {/* 2. HITL Workflow */}
      <section id="clinical-hitl" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-calmGreen" />
          2. Human-in-the-Loop (HITL) Architecture
        </h2>
        <div className="p-4 rounded-xl border border-calmGreen/30 bg-calmGreen/10 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-primaryText flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-calmGreen" />
            Mandatory Clinical Oversight Invariant
          </p>
          <p>
            Every AI-generated suggestion is categorized in the database as an unverified <code>draft</code>.
            The system enforces the following non-negotiable gates:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>An AI draft is completely invisible to patients and external parties.</li>
            <li>The AI system has zero algorithmic capability or permission to sign, finalize, or publish a note.</li>
            <li>A note only transitions to the authoritative patient chart when a verified psychologist reviews, edits, and applies their personal digital cryptographic signature.</li>
          </ul>
        </div>
      </section>

      {/* 3. Draft Generation */}
      <section id="draft-generation" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">3. How SOAP Drafts Are Generated</h2>
        <p>When a clinician requests AI assistance after an authorized session:</p>
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1 text-xs">
            <h4 className="font-semibold text-softTeal">Step A: Structured Prompt Engineering</h4>
            <p className="text-slate-300">
              The platform formats consultation transcript text into a rigorous clinical schema adhering to the SOAP framework:
              Subjective (patient statements), Objective (clinician observations), Assessment (clinical impressions), and Plan (interventions & homework).
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1 text-xs">
            <h4 className="font-semibold text-softTeal">Step B: Interactive Clinician Editing</h4>
            <p className="text-slate-300">
              The draft is loaded into an editable rich-text workspace in the psychologist portal. The psychologist can rewrite,
              expand, strike out, or completely discard any portion of the AI draft.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1 text-xs">
            <h4 className="font-semibold text-softTeal">Step C: Digital Signature & Versioned Addenda</h4>
            <p className="text-slate-300">
              Upon clinical satisfaction, the psychologist signs the note with their license number and timestamp.
              Once signed, the original text is locked against retroactive alterations; any subsequent edits must be recorded as timestamped addenda.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Limitations & Risks */}
      <section id="limitations-risks" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-mutedAmber" />
          4. Clinical Limitations & Known Hallucination Risks
        </h2>
        <p>Users and clinicians must recognize the inherent technical limitations of Large Language Models:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
          <li><strong>Hallucinations & Inaccuracies:</strong> LLMs may occasionally fabricate details, misinterpret nuanced colloquial speech, or introduce factual inaccuracies not present in the dialogue.</li>
          <li><strong>Absence of Clinical Empathy:</strong> AI models cannot perceive subtle body language, micro-expressions, emotional cadence, or interpersonal dynamics.</li>
          <li><strong>Cultural Nuances:</strong> Models may reflect bias or lack comprehension of local idioms and regional cultural expressions common in mental health discussions.</li>
        </ul>
        <p className="text-xs text-slate-400">
          For these reasons, AI output must <em>never</em> be treated as authoritative clinical truth without human verification.
        </p>
      </section>

      {/* 5. Absolute Prohibitions */}
      <section id="prohibitions" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Lock className="w-5 h-5 text-mutedAmber" />
          5. Absolute Clinical Prohibitions
        </h2>
        <div className="p-4 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-primaryText">The platform enforces the following strict prohibitions:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li><strong>No Autonomous Psychiatric Diagnosis:</strong> The AI will never issue an official diagnosis directly to a patient.</li>
            <li><strong>No Pharmaceutical Prescribing:</strong> Psyco AI does not calculate drug dosages, suggest psychotropic medications, or provide prescribing instructions.</li>
            <li><strong>No Crisis Triaging:</strong> AI tools are strictly barred from evaluating acute suicide risk or replacing emergency medical services.</li>
          </ul>
        </div>
      </section>

      {/* 6. Privacy & Non-Training */}
      <section id="privacy-guardrails" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-softTeal" />
          6. Third-Party AI & Speech Processing Disclosures
        </h2>
        <p>
          We implement strict, transparent data boundaries when interacting with external AI and speech infrastructure:
        </p>
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
            <h4 className="font-semibold text-softTeal">Google Gemini — Developer API Integration & Training Controls</h4>
            <p className="text-slate-300">
              Psyco AI integrates Google Gemini models using the official SDK configured with the <strong>Google AI Studio developer API</strong> (<code>generativelanguage.googleapis.com</code>), not Google Cloud Vertex AI. Under developer accounts with paid billing enabled, customer inputs and outputs are not used to train foundation models. In free/unpaid developer tiers, standard terms permit vendor logging and human review. Psyco AI does not claim enterprise Vertex AI terms or SLAs for this integration.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5 text-xs">
            <h4 className="font-semibold text-softTeal">AssemblyAI — Streaming v3 Transcription & Retention Verification</h4>
            <p className="text-slate-300">
              Ambient transcription utilizes AssemblyAI's <strong>Streaming v3 WebSocket API</strong> (<code>wss://streaming.assemblyai.com/v3/ws</code>), not asynchronous prerecorded transcription. While vendor technical documentation specifies zero audio and transcript retention for Streaming sessions when the account has actively opted out of model training, Psyco AI does not presume account opt-out or claim executed enterprise Zero Data Retention (ZDR) addenda or Business Associate Agreements (BAAs) without verified documentary proof. Asynchronous 30-day retention policies do not apply to streaming.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 space-y-1.5 text-xs text-slate-300">
            <h4 className="font-semibold text-primaryText flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-mutedAmber" />
              Mandatory Pilot Guardrail: No Real Clinical Audio
            </h4>
            <p>
              <strong>Real clinical audio from actual patients must NOT be used during the staging pilot.</strong> Only synthetic, simulated, or test audio is authorized until exact processor configuration, account-level opt-out settings, and contractual enterprise addenda are formally executed and legally verified.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Clinician Accountability */}
      <section id="clinician-accountability" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-softTeal" />
          7. Clinician Accountability & Professional Ethics
        </h2>
        <p>
          Under applicable healthcare regulations, medical council guidelines, and clinical ethics codes,
          <strong> the licensed treating psychologist remains solely and personally accountable for every record in the patient chart</strong>.
          The use of assistive AI does not diminish or transfer the practitioner's legal duty of care to the patient.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
