import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Stethoscope, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export function GetStartedPage() {
  return (
    <div className="flex-1 max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="teal">Select Your Portal Experience</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primaryText">
          Welcome to Psyco AI
        </h1>
        <p className="text-sm sm:text-base text-secondaryText max-w-2xl mx-auto leading-relaxed">
          Choose the pathway that matches your role. Each workspace provides tailored tools, strict privacy boundaries, and an intuitive clinical interface.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Patient Selection Card */}
        <Card className="border-slate-700/80 bg-gradient-to-b from-deepBlueGray to-midnightNavy p-6 sm:p-8 flex flex-col justify-between hover:border-softTeal/40 transition-all duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-softTeal/15 text-softTeal">
                <UserCheck className="w-8 h-8" />
              </div>
              <Badge variant="teal" size="sm">Patient Experience</Badge>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primaryText mb-2">I am a Patient</h2>
              <p className="text-xs text-secondaryText leading-relaxed">
                Connect with licensed psychologists, schedule in-person or online consultations, complete confidential intake forms, and access your authorized treatment goals.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                What you can do:
              </span>
              <ul className="space-y-2 text-xs text-secondaryText">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-softTeal shrink-0" />
                  <span>Discover verified psychologists and check availability</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-softTeal shrink-0" />
                  <span>Request in-person or online consultations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-softTeal shrink-0" />
                  <span>Submit medical and mental health history securely</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-softTeal shrink-0" />
                  <span>Review clinician-shared treatment milestones</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            <Link to="/for-patients" className="block">
              <Button variant="primary" size="md" className="w-full" icon={ArrowRight} iconPosition="right">
                Explore Patient Portal Overview
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-2 text-xs text-secondaryText">
              <span>Looking for account access?</span>
              <Link to="/login" className="text-softTeal hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </div>
        </Card>

        {/* Psychologist Selection Card */}
        <Card className="border-deepJade/40 bg-gradient-to-b from-deepBlueGray to-midnightNavy p-6 sm:p-8 flex flex-col justify-between hover:border-calmGreen/40 transition-all duration-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-calmGreen/15 text-calmGreen">
                <Stethoscope className="w-8 h-8" />
              </div>
              <Badge variant="green" size="sm">Clinician Workspace</Badge>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primaryText mb-2">I am a Psychologist</h2>
              <p className="text-xs text-secondaryText leading-relaxed">
                Take control of your practice. Manage patient queues, customize consultation buffers, maintain versioned clinical notes (SOAP/DAP), and leverage AI documentation assistance.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                What you can do:
              </span>
              <ul className="space-y-2 text-xs text-secondaryText">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-calmGreen shrink-0" />
                  <span>Configure working hours, session durations, and buffers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-calmGreen shrink-0" />
                  <span>Draft, revise, and digitally sign structured clinical notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-calmGreen shrink-0" />
                  <span>Review AI-generated summaries under full human oversight</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-calmGreen shrink-0" />
                  <span>Maintain authoritative, text-only patient records</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            <Link to="/for-psychologists" className="block">
              <Button variant="primary" size="md" className="w-full bg-deepJade hover:bg-deepJade/90" icon={ArrowRight} iconPosition="right">
                Explore Psychologist Suite Overview
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-2 text-xs text-secondaryText">
              <span>Already registered?</span>
              <Link to="/login" className="text-calmGreen hover:underline font-medium">
                Clinician Sign In
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Honest Roadmap Notice */}
      <div className="bg-deepBlueGray/50 border border-slate-800 rounded-2xl p-4 text-xs text-secondaryText flex items-start gap-3 max-w-3xl mx-auto">
        <Sparkles className="w-4 h-4 text-mutedAmber shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-primaryText">Phase Roadmap Transparency:</strong> Interactive account creation and Firebase Authentication are scheduled for Phase 2. The portal overview links above detail each workspace's features and technical boundaries honestly without simulating fake registration.
        </p>
      </div>
    </div>
  );
}
