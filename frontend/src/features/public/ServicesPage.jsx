import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  UserCheck,
  Calendar,
  FileText,
  Clock,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function ServicesPage() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'patients' | 'psychologists'

  const patientServices = [
    {
      title: 'Discover Psychologists',
      phase: 'Phase 2 & 3',
      icon: Search,
      desc: 'Explore licensed clinical psychologists by clinical specialization, practice approach, and verified credentials.',
      benefits: ['Search by specialty (CBT, trauma, anxiety)', 'Review verified credentials and licenses', 'Transparent consultation rates'],
    },
    {
      title: 'Review Professional Profiles',
      phase: 'Phase 2',
      icon: UserCheck,
      desc: 'Access detailed therapist profiles with clinical backgrounds, philosophies of care, and clinic location details.',
      benefits: ['Transparent practitioner bio', 'Verified qualifications', 'In-person clinic addresses and online options'],
    },
    {
      title: 'Request Appointments',
      phase: 'Phase 3',
      icon: Calendar,
      desc: 'Submit consultation requests for open slots. Choose in-person consultation as the default or online Google Meet.',
      benefits: ['Interactive available slot selector', 'In-person consultation default', 'Automatic Google Meet link generation'],
    },
    {
      title: 'Manage Your Appointments',
      phase: 'Phase 3',
      icon: Clock,
      desc: 'View upcoming consultations, request cancellations or rescheduling within your clinician’s permitted time windows.',
      benefits: ['Clear consultation itinerary', 'Structured cancellation requests', 'Upcoming session reminders'],
    },
    {
      title: 'Access Authorized Treatment Information',
      phase: 'Phase 4',
      icon: FileText,
      desc: 'Securely view clinical summaries and treatment resources that your psychologist explicitly publishes for your review.',
      benefits: ['Clinician-approved summary view', 'Confidential and isolated to your account', 'No exposure of raw clinician notes'],
    },
    {
      title: 'Track Treatment Goals & Follow-ups',
      phase: 'Phase 4 & 7',
      icon: Activity,
      desc: 'Follow your therapeutic progress over time with shared goal milestones and structured psychological screening scores.',
      benefits: ['Active milestone tracking', 'Longitudinal progress indicators', 'Home practice exercises and follow-up plans'],
    },
  ];

  const psychologistServices = [
    {
      title: 'Appointment Management',
      phase: 'Phase 3',
      icon: Calendar,
      desc: 'Review incoming booking requests, accept or propose alternate times, and manage your overall clinic caseload.',
      benefits: ['One-click request confirmation', 'Automated slot reservation', 'Cancellation window enforcement'],
    },
    {
      title: 'Calendar & Availability Controls',
      phase: 'Phase 3',
      icon: Clock,
      desc: 'Set custom weekly hours, session duration (default: 50 min), buffer times between appointments, and Google Calendar sync.',
      benefits: ['Configurable buffer intervals', 'Bidirectional Google Calendar sync', 'Timezone-aware scheduling (Asia/Kolkata default)'],
    },
    {
      title: 'Patient Information Management',
      phase: 'Phase 2',
      icon: Users,
      desc: 'Centralize patient demographic data, emergency contacts, and digital clinical intake questionnaires in one organized space.',
      benefits: ['Pre-session medical intake review', 'Emergency contact accessibility', 'Relationship-Based Access Control'],
    },
    {
      title: 'Session Organization',
      phase: 'Phase 4',
      icon: ShieldCheck,
      desc: 'Track completed, ongoing, and upcoming consultations with exact timestamps, session modes, and attendance statuses.',
      benefits: ['Session attendance log', 'In-person vs online tracking', 'Direct linkage to clinical notes'],
    },
    {
      title: 'Structured Clinical Documentation',
      phase: 'Phase 4',
      icon: FileText,
      desc: 'Draft, revise, and digitally sign standardized clinical notes utilizing SOAP, DAP, or BIRP documentation formats.',
      benefits: ['Full revision history snapshots', 'Digital clinician sign-off', 'Immutable historical records in Firebase RTDB'],
    },
    {
      title: 'Treatment Plan Management',
      phase: 'Phase 4',
      icon: CheckCircle2,
      desc: 'Create structured treatment plans with diagnostic codes (ICD-11/DSM-5), target interventions, and scheduled review milestones.',
      benefits: ['Measurable clinical goals', 'Intervention catalogs', 'Configurable review intervals (weeks)'],
    },
    {
      title: 'Reports & Progress Tracking',
      phase: 'Phase 4 & 7',
      icon: Activity,
      desc: 'Generate clinical summaries and assess psychometric tracking scores (PHQ-9, GAD-7) with longitudinal trajectory graphs.',
      benefits: ['Structured text report export', 'Psychometric severity trending', 'Zero permanent PDF file bloat'],
    },
    {
      title: 'Future AI-Assisted Documentation Copilot',
      phase: 'Phase 6',
      icon: Brain,
      desc: 'Gemini-assisted draft note synthesis and symptom extraction. Accelerates paperwork while preserving 100% clinician sign-off.',
      benefits: ['Draft note proposals in seconds', 'Strict Human-in-the-Loop review', 'Zero unreviewed auto-finalization'],
    },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="teal">Comprehensive Platform Capabilities</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primaryText">
          Services & Practice Management Architecture
        </h1>
        <p className="text-sm sm:text-base text-secondaryText max-w-2xl mx-auto leading-relaxed">
          Psyco AI brings clinical excellence, administrative ease, and responsible assistance together. Explore the tailored capabilities designed for patients and clinicians.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-deepBlueGray rounded-xl border border-slate-700 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-elevatedSlate text-primaryText shadow-sm'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            All Services
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'patients'
                ? 'bg-elevatedSlate text-softTeal shadow-sm'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            For Patients
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('psychologists')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'psychologists'
                ? 'bg-elevatedSlate text-calmGreen shadow-sm'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            For Psychologists
          </button>
        </div>
      </div>

      {/* Patient Services Section */}
      {(activeTab === 'all' || activeTab === 'patients') && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-primaryText flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-softTeal" />
                Patient Services & Care Experience
              </h2>
              <p className="text-xs text-secondaryText">Empowering clients with dignified, transparent mental health access.</p>
            </div>
            <Link to="/for-patients">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                Patient Overview
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patientServices.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <Card key={idx} hoverEffect className="flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-softTeal/15 text-softTeal">
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="teal" size="sm">{svc.phase}</Badge>
                    </div>
                    <h3 className="text-base font-semibold text-primaryText">{svc.title}</h3>
                    <p className="text-xs text-secondaryText leading-relaxed">{svc.desc}</p>
                    <ul className="space-y-1.5 pt-2 border-t border-slate-800">
                      {svc.benefits.map((b, bIdx) => (
                        <li key={bIdx} className="text-[11px] text-secondaryText flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-softTeal shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Psychologist Services Section */}
      {(activeTab === 'all' || activeTab === 'psychologists') && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-primaryText flex items-center gap-2">
                <Users className="w-5 h-5 text-calmGreen" />
                Psychologist Services & Clinical Suite
              </h2>
              <p className="text-xs text-secondaryText">Structured practice management, notes, and ethical AI drafting.</p>
            </div>
            <Link to="/for-psychologists">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                Clinician Overview
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {psychologistServices.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <Card key={idx} hoverEffect className="flex flex-col justify-between border-deepJade/30">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-calmGreen/15 text-calmGreen">
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="green" size="sm">{svc.phase}</Badge>
                    </div>
                    <h3 className="text-base font-semibold text-primaryText">{svc.title}</h3>
                    <p className="text-xs text-secondaryText leading-relaxed">{svc.desc}</p>
                    <ul className="space-y-1.5 pt-2 border-t border-slate-800">
                      {svc.benefits.map((b, bIdx) => (
                        <li key={bIdx} className="text-[11px] text-secondaryText flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-calmGreen shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Honest Roadmap Notice */}
      <div className="bg-midnightNavy border border-slate-800 rounded-2xl p-5 text-xs text-secondaryText flex items-start gap-3 max-w-3xl mx-auto">
        <Sparkles className="w-4 h-4 text-mutedAmber shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-primaryText">Roadmap Note:</strong> The services outlined above represent the comprehensive architectural blueprint for Psyco AI. Each capability will be implemented sequentially according to our Phase Roadmap, ensuring rigorous clinical verification and zero security shortcuts.
        </p>
      </div>
    </div>
  );
}
