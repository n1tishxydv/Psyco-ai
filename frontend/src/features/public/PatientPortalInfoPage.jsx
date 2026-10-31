import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Shield, Calendar, FileText, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function PatientPortalInfoPage() {
  const patientCapabilities = [
    {
      title: 'Therapist Discovery & Profiles',
      desc: 'Browse verified psychologists, review their clinical specializations (e.g., CBT, trauma, anxiety), and view availability.',
      icon: UserCheck,
      status: 'Phase 2 & 3',
    },
    {
      title: 'Appointment Requests (In-Person & Online)',
      desc: 'Request consultation times that fit your schedule. Select an in-person clinic visit or secure online Google Meet video consultation.',
      icon: Calendar,
      status: 'Phase 3',
    },
    {
      title: 'Confidential Clinical Intake',
      desc: 'Complete medical and mental health questionnaires securely at home before your first consultation. Eliminates clipboard delays.',
      icon: FileText,
      status: 'Phase 2',
    },
    {
      title: 'Treatment Goals & Authorized Summaries',
      desc: 'View therapeutic milestones and clinical summaries explicitly shared by your psychologist to support continuity of care.',
      icon: HeartHandshake,
      status: 'Phase 4',
    },
  ];

  return (
    <div className="flex-1 max-w-5xl mx-auto py-12 px-4 space-y-10">
      <div className="space-y-3 text-center">
        <Badge variant="teal">Patient Experience</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primaryText">
          The Psyco AI Patient Experience
        </h1>
        <p className="text-sm sm:text-base text-secondaryText max-w-2xl mx-auto leading-relaxed">
          Mental health care should be transparent, accessible, and grounded in confidentiality. Explore how the platform supports your therapy journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patientCapabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <Card key={idx} className="bg-deepBlueGray/80">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-softTeal/15 text-softTeal">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base">{cap.title}</CardTitle>
                  </div>
                  <Badge variant="slate" size="sm">{cap.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-secondaryText leading-relaxed">{cap.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Patient Privacy Guarantee Card */}
      <Card className="border-softTeal/30 bg-gradient-to-r from-deepBlueGray to-midnightNavy p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-primaryText flex items-center gap-2">
              <Shield className="w-4 h-4 text-softTeal" />
              Patient Confidentiality & Data Rights
            </h3>
            <p className="text-xs text-secondaryText max-w-2xl leading-relaxed">
              Your intake questionnaires and records are protected by Relationship-Based Access Control. Only you and your assigned clinician have access. Session audio is never recorded permanently.
            </p>
          </div>
          <Link to="/data-privacy" className="shrink-0">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              Read Data Privacy Policy
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
