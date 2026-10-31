import React from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { contactConfig } from '../../config/contactConfig';
import { HelpCircle, CheckCircle2, Eye, Keyboard, Monitor, ShieldCheck, AlertCircle } from 'lucide-react';

export function AccessibilityPage() {
  const toc = [
    { id: 'commitment', label: '1. Accessibility Commitment' },
    { id: 'implemented-features', label: '2. Code-Verified Accessibility Features' },
    { id: 'navigation-semantics', label: '3. Keyboard Navigation & Screen Readers' },
    { id: 'contrast-typography', label: '4. Visual Contrast & Typography' },
    { id: 'compliance-truth', label: '5. Assessment & Certification Status' },
    { id: 'feedback-support', label: '6. Reporting Accessibility Barriers' },
  ];

  return (
    <LegalDocumentLayout
      title="Accessibility Statement"
      subtitle="Documentation of implemented accessibility features, semantic HTML standards, and ongoing assistive technology accommodations."
      category="Security and Technical Architecture"
      toc={toc}
    >
      {/* 1. Commitment */}
      <section id="commitment" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-softTeal" />
          1. Accessibility Commitment
        </h2>
        <p>
          Psyco AI is committed to ensuring digital accessibility for patients, clinical psychologists, and administrators,
          including individuals with visual, auditory, motor, or cognitive disabilities.
          Mental health services require an inclusive, calm, and distraction-free digital environment.
        </p>
      </section>

      {/* 2. Implemented Features */}
      <section id="implemented-features" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-calmGreen" />
          2. Code-Verified Accessibility Features
        </h2>
        <p>Based on our frontend component architecture, the following accessibility mechanisms are actively implemented:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" />
              Keyboard Navigation
            </h3>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside pl-1">
              <li>Full logical Tab navigation across all forms, buttons, links, and calendar slots.</li>
              <li>Visible high-contrast focus rings (<code>focus-visible:ring-2 focus-visible:ring-softTeal</code>).</li>
              <li>Modal dialogs support instant dismissal via the <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">Escape</kbd> key.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <h3 className="font-semibold text-softTeal text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />
              Semantic HTML & Screen Readers
            </h3>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside pl-1">
              <li>HTML5 landmark elements (<code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;aside&gt;</code>, <code>&lt;footer&gt;</code>).</li>
              <li>Form inputs linked to explicit <code>&lt;label&gt;</code> elements with programmatic IDs.</li>
              <li>Icon-only buttons include descriptive <code>aria-label</code> tags (e.g. theme toggle, mobile navigation).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Navigation Semantics */}
      <section id="navigation-semantics" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">3. Keyboard Navigation & Assistive Technologies</h2>
        <p>
          Forms on Psyco AI (such as patient onboarding, clinical intake questionnaires, and booking flows)
          are built with accessible states:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li><strong>Error Announcements:</strong> Validation failures are surfaced in live banner regions with clear descriptive text.</li>
          <li><strong>Non-Preselected Consents:</strong> In accordance with ethical healthcare standards, informed consent checkboxes are never pre-checked.</li>
          <li><strong>Responsive Scaling:</strong> The UI supports browser zoom levels up to 200% without loss of functional controls or text clipping.</li>
        </ul>
      </section>

      {/* 4. Contrast & Typography */}
      <section id="contrast-typography" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <Eye className="w-5 h-5 text-softTeal" />
          4. Visual Contrast & Typography Standards
        </h2>
        <p>
          Our design system uses curated color tokens engineered for visual clarity in low-light and clinical settings:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-300">
          <li><strong>Primary Text:</strong> High-luminance slate (<code>#F8FAFC</code>) against dark midnight navy (<code>#0F172A</code>), delivering a contrast ratio exceeding <strong>14:1</strong> (well above the WCAG Level AA minimum of 4.5:1).</li>
          <li><strong>Secondary Text:</strong> Muted slate (<code>#94A3B8</code>) providing a contrast ratio exceeding <strong>5.5:1</strong>.</li>
          <li><strong>Accent Highlights:</strong> Soft teal (<code>#2DD4BF</code>) and calm green (<code>#34D399</code>) tested for distinguishability.</li>
        </ul>
      </section>

      {/* 5. Compliance Truth */}
      <section id="compliance-truth" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-mutedAmber" />
          5. Assessment & Certification Status
        </h2>
        <div className="p-4 rounded-xl border border-mutedAmber/30 bg-mutedAmber/10 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-primaryText">Formal Certification Disclaimer:</p>
          <p>
            While Psyco AI is actively designed in alignment with <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standards,
            the application has not yet undergone a formal, independent third-party accessibility certification audit.
            We make no claim of statutory WCAG or ADA certification at this staging evaluation stage.
          </p>
        </div>
      </section>

      {/* 6. Feedback & Support */}
      <section id="feedback-support" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">6. Reporting Accessibility Barriers</h2>
        <p>
          If you encounter any difficulty navigating the platform, interacting with forms, or using assistive technologies,
          please contact us so we can implement accommodations:
        </p>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1">
          <p><strong>Accessibility Contact:</strong> {contactConfig.contactPerson} ({contactConfig.designation})</p>
          <p><strong>Email:</strong> <a href={contactConfig.emailHref} className="text-softTeal hover:underline">{contactConfig.email}</a></p>
          <p><strong>Phone:</strong> <a href={contactConfig.phoneHref} className="text-calmGreen hover:underline">{contactConfig.phone}</a></p>
        </div>
      </section>
    </LegalDocumentLayout>
  );
}
