import React from 'react';
import { Search, UserCheck2, CalendarCheck, Users, FileEdit, CheckCircle2, FolderLock } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';

export function HowItWorksWorkflow() {
  const steps = [
    {
      num: '01',
      title: 'Discover & Request',
      actor: 'Patient Action',
      desc: 'The patient explores verified psychologist profiles, reviews practice specialties, and submits an initial appointment request.',
      icon: Search,
      status: 'Phase 2 & 3 Planned',
    },
    {
      num: '02',
      title: 'Psychologist Review',
      actor: 'Clinician Action',
      desc: 'The psychologist reviews the appointment request against practice availability, accepting or proposing an alternate time slot.',
      icon: UserCheck2,
      status: 'Phase 3 Planned',
    },
    {
      num: '03',
      title: 'Schedule & Calendar Mode',
      actor: 'System Coordination',
      desc: 'The session is booked with preferred mode: In-Person Consultation (default) or Online Google Meet session with buffer times.',
      icon: CalendarCheck,
      status: 'Phase 3 Planned',
    },
    {
      num: '04',
      title: 'Conduct Consultation',
      actor: 'Clinical Care',
      desc: 'Therapist and patient conduct the session. Future transcription operates with explicit digital consent; zero permanent audio saved.',
      icon: Users,
      status: 'Phase 5 Planned',
    },
    {
      num: '05',
      title: 'Prepare Documentation',
      actor: 'Clinical Notes',
      desc: 'Session summaries and structured notes (SOAP/DAP) are compiled. Future AI copilot assists with draft generation.',
      icon: FileEdit,
      status: 'Phase 4 & 6 Planned',
    },
    {
      num: '06',
      title: 'Review & Digital Sign-off',
      actor: 'Human Oversight',
      desc: 'The psychologist reviews and refines all notes. AI-generated drafts are never automatically finalized without clinician sign-off.',
      icon: CheckCircle2,
      status: 'Phase 4 Invariant',
    },
    {
      num: '07',
      title: 'Maintain Clinical Record',
      actor: 'Authoritative Charting',
      desc: 'Signed records are committed as immutable text in Firebase Realtime Database to support longitudinal care and reports.',
      icon: FolderLock,
      status: 'Strict Text Policy',
    },
  ];

  return (
    <section id="how-it-works" className="space-y-10 py-10">
      <div className="text-center space-y-3">
        <Badge variant="teal">Intended Patient & Clinician Journey</Badge>
        <h2 className="text-3xl font-bold tracking-tight text-primaryText">
          How Psyco AI Works
        </h2>
        <p className="text-sm text-secondaryText max-w-2xl mx-auto leading-relaxed">
          From initial consultation request to authoritative clinical documentation, every step preserves clinician autonomy and patient confidentiality.
        </p>
      </div>

      <div className="relative">
        {/* Connecting Line on large screens */}
        <div
          className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-0.5 bg-gradient-to-b from-softTeal/40 via-deepJade/40 to-calmGreen/40 -translate-x-1/2 -z-0"
          aria-hidden="true"
        />

        <div className="space-y-6 lg:space-y-8 relative z-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isEven = idx % 2 === 1;

            return (
              <div
                key={step.num}
                className={`flex flex-col lg:flex-row items-center gap-6 ${
                  isEven ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content Card */}
                <div className="w-full lg:w-1/2">
                  <div
                    className={`bg-deepBlueGray/90 border border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all hover:border-softTeal/40 ${
                      isEven ? 'lg:mr-auto lg:text-left' : 'lg:ml-auto lg:text-left'
                    } max-w-xl`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-softTeal bg-softTeal/10 px-2 py-0.5 rounded border border-softTeal/30">
                          Step {step.num}
                        </span>
                        <span className="text-[11px] font-medium text-secondaryText uppercase tracking-wider">
                          {step.actor}
                        </span>
                      </div>
                      <Badge variant="slate" size="sm">{step.status}</Badge>
                    </div>

                    <h3 className="text-base font-semibold text-primaryText mb-1.5 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-softTeal shrink-0" />
                      {step.title}
                    </h3>
                    <p className="text-xs text-secondaryText leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Central Step Marker Badge */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-elevatedSlate border-2 border-softTeal flex items-center justify-center text-xs font-bold text-softTeal shadow-md">
                  {step.num}
                </div>

                {/* Empty spacer for alignment on large screens */}
                <div className="hidden lg:block w-1/2" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
