import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, FileText, Brain, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function PsychologistPortalInfoPage() {
  const clinicianCapabilities = [
    {
      title: 'Practice & Schedule Autonomy',
      desc: 'Define working hours, appointment durations, post-session buffer intervals, and consultation fees. Support both in-person clinics and Google Meet.',
      icon: Calendar,
      status: 'Phase 3',
    },
    {
      title: 'Structured Note Drafting (SOAP / DAP / BIRP)',
      desc: 'Purpose-built clinical note editor with full revision histories, digital signatures, and immutable historical archives in Firebase RTDB.',
      icon: FileText,
      status: 'Phase 4',
    },
    {
      title: 'Responsible Gemini Clinical Copilot',
      desc: 'AI-assisted draft note generation, symptom inventory extraction, and treatment goal suggestions—always subject to your explicit review and sign-off.',
      icon: Brain,
      status: 'Phase 6',
    },
    {
      title: 'Ambient Audio Streaming (Zero Audio Persistence)',
      desc: 'Transient real-time speech-to-text processing for in-person consultations. Memory buffers are purged immediately after transcript text generation.',
      icon: Clock,
      status: 'Phase 5',
    },
  ];

  return (
    <div className="flex-1 max-w-5xl mx-auto py-12 px-4 space-y-10">
      <div className="space-y-3 text-center">
        <Badge variant="green">Clinician Workspace</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primaryText">
          The Psyco AI Psychologist Suite
        </h1>
        <p className="text-sm sm:text-base text-secondaryText max-w-2xl mx-auto leading-relaxed">
          Engineered for licensed psychologists and counselors. Reduce administrative overhead while preserving clinical standards and practitioner autonomy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clinicianCapabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <Card key={idx} className="bg-deepBlueGray/80 border-deepJade/30">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-calmGreen/15 text-calmGreen">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base">{cap.title}</CardTitle>
                  </div>
                  <Badge variant="green" size="sm">{cap.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-secondaryText leading-relaxed">{cap.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Clinician Independence Guarantee Card */}
      <Card className="border-deepJade/40 bg-gradient-to-r from-deepBlueGray to-midnightNavy p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-primaryText flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-calmGreen" />
              Complete Clinical Independence
            </h3>
            <p className="text-xs text-secondaryText max-w-2xl leading-relaxed">
              No platform administrator can view or modify your clinical notes. AI drafts never finalize without your manual sign-off. All authoritative data is stored in structured text form.
            </p>
          </div>
          <Link to="/get-started" className="shrink-0">
            <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
              Join as Clinician
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
