import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'Does Psyco AI store permanent audio recordings of therapy sessions?',
      a: 'No. Psyco AI enforces a strict zero-binary-media policy. Session audio is processed transiently in memory to generate text transcripts with patient consent, after which the audio buffer is wiped immediately. No raw audio files are stored in the database or filesystem.',
    },
    {
      q: 'Can an administrator view my confidential patient notes?',
      a: 'No. The architecture employs Relationship-Based Access Control (ReBAC). While administrators manage accounts, verification, and platform uptime, administrative accounts are strictly barred from querying clinical notes, transcripts, and treatment plans.',
    },
    {
      q: 'What is the default consultation mode?',
      a: 'In-person consultation is the primary default mode, reflecting standard clinical psychotherapy workflows. Online consultations via Google Meet are fully supported when selected by the psychologist or patient.',
    },
    {
      q: 'Does the AI automatically diagnose patients or finalize documentation?',
      a: 'Never. All AI-assisted documentation operates under a strict Human-in-the-Loop paradigm. Gemini produces draft notes that must be reviewed, edited, and digitally signed by the licensed psychologist before becoming part of the patient record.',
    },
    {
      q: 'Which database powers Psyco AI?',
      a: 'Firebase Realtime Database is the fixed, authoritative database for Psyco AI. All persistent data is modeled as structured JSON/text.',
    },
  ];

  return (
    <div className="flex-1 max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <Badge variant="teal">Knowledge Base</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-primaryText">Frequently Asked Questions</h1>
        <p className="text-xs text-secondaryText">Architectural and clinical safety principles explained.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <Card key={idx} className="cursor-pointer" onClick={() => setOpenIdx(isOpen ? null : idx)}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primaryText">{faq.q}</h3>
                <div className="text-secondaryText">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-secondaryText leading-relaxed">
                  {faq.a}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
