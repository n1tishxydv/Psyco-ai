import React from 'react';
import { ShieldCheck, Brain, Lock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/cards/Card';
import { Badge } from '../../../components/common/Badge';

export function ResponsibleAiSection() {
  const principles = [
    {
      title: 'Human-in-the-Loop Clinical Authority',
      icon: Brain,
      color: 'text-softTeal',
      desc: 'AI drafts are strictly proposals. No automated note, treatment plan, or clinical summary is ever committed to a patient record without review, edit, and digital sign-off by the licensed clinician.',
    },
    {
      title: 'Zero Permanent Audio Storage',
      icon: Lock,
      color: 'text-calmGreen',
      desc: 'Therapy sessions are never recorded permanently. Future ambient transcription uses short-lived, transient streaming buffers in memory, which are purged immediately upon transcript generation.',
    },
    {
      title: 'Strict Text & Structured JSON Invariant',
      icon: FileText,
      color: 'text-mutedAmber',
      desc: 'All authoritative persistence is anchored in Firebase Realtime Database as structured text. Binary media, raw audio archives, and image payloads are prohibited by database architecture.',
    },
    {
      title: 'Zero Clinical Backdoors for Administrators',
      icon: ShieldCheck,
      color: 'text-slate-300',
      desc: 'Administrative privileges are isolated to user governance and operational uptime. Platform administrators cannot read, export, or browse private therapeutic session notes or transcripts.',
    },
  ];

  return (
    <section className="space-y-8 py-8 border-t border-slate-800/80">
      <div className="text-center space-y-3">
        <Badge variant="teal">Ethical Baseline</Badge>
        <h2 className="text-3xl font-bold tracking-tight text-primaryText">
          Responsible AI & Clinical Privacy Invariants
        </h2>
        <p className="text-sm text-secondaryText max-w-2xl mx-auto leading-relaxed">
          Mental health software requires exceptional ethical standards. We build around core principles that safeguard both the therapist's license and the patient's confidentiality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {principles.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="bg-deepBlueGray/70 border-slate-700/80">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-elevatedSlate ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-secondaryText leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance & Certification Transparency Notice */}
      <div className="bg-midnightNavy/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-secondaryText max-w-3xl mx-auto">
        <AlertCircle className="w-4 h-4 text-mutedAmber shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-primaryText">Regulatory & Verification Transparency:</strong> Psyco AI implements defensive technical controls, server-side authorization guards, and strict data-minimization architecture. However, formal HIPAA, GDPR, or SOC2 certification requires independent third-party audits and formal administrative policies. We report our technical security posture honestly without claiming unverified certifications.
        </p>
      </div>
    </section>
  );
}
