import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Stethoscope, ArrowRight, CheckCircle2, Shield, Clock, Heart, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/cards/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export function BenefitsSection() {
  return (
    <section className="space-y-10 py-8">
      <div className="text-center space-y-3">
        <Badge variant="teal">Tailored Experience</Badge>
        <h2 className="text-3xl font-bold tracking-tight text-primaryText">
          Designed for Patients. Built for Psychologists.
        </h2>
        <p className="text-sm text-secondaryText max-w-2xl mx-auto">
          Clear, dedicated workflows engineered for both sides of the therapeutic relationship.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Patient Benefits Card */}
        <Card className="border-slate-700/80 bg-gradient-to-b from-deepBlueGray to-midnightNavy p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-softTeal/15 text-softTeal">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primaryText">For Patients</h3>
                  <p className="text-xs text-secondaryText">Transparent, dignified mental health access</p>
                </div>
              </div>
              <Badge variant="teal" size="sm">Patient Portal</Badge>
            </div>

            <p className="text-xs text-secondaryText leading-relaxed">
              Seeking psychological support should not involve complex paperwork or opaque communication. Psyco AI provides a calm digital environment designed to simplify every step of your care journey.
            </p>

            <ul className="space-y-3 text-xs text-secondaryText">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-softTeal shrink-0 mt-0.5" />
                <span><strong>Direct Provider Discovery:</strong> Explore verified psychologist profiles, qualifications, and specialties with clear consultation fees.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-softTeal shrink-0 mt-0.5" />
                <span><strong>In-Person & Online Choice:</strong> Select your preferred consultation mode—in-person clinic visit or secure online Google Meet link.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-softTeal shrink-0 mt-0.5" />
                <span><strong>Confidential Intake:</strong> Submit medical and therapeutic intake forms securely at your own pace before your first session.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-softTeal shrink-0 mt-0.5" />
                <span><strong>Authorized Treatment Insights:</strong> Access treatment goals and authorized follow-up summaries shared directly by your clinician.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
            <Link to="/for-patients">
              <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
                Learn About Patient Experience
              </Button>
            </Link>
            <Link to="/get-started">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </Card>

        {/* Psychologist Benefits Card */}
        <Card className="border-deepJade/40 bg-gradient-to-b from-deepBlueGray to-midnightNavy p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-calmGreen/15 text-calmGreen">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primaryText">For Psychologists</h3>
                  <p className="text-xs text-secondaryText">Complete practice management & clinical focus</p>
                </div>
              </div>
              <Badge variant="green" size="sm">Clinician Suite</Badge>
            </div>

            <p className="text-xs text-secondaryText leading-relaxed">
              Clinical psychologists frequently spend upwards of 30% of their workday drafting session notes, managing calendar buffers, and updating charts. Psyco AI returns those hours to patient care.
            </p>

            <ul className="space-y-3 text-xs text-secondaryText">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-calmGreen shrink-0 mt-0.5" />
                <span><strong>Practice Autonomy:</strong> Set your working hours, default consultation duration (e.g., 50 minutes), and post-session buffer times.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-calmGreen shrink-0 mt-0.5" />
                <span><strong>Structured Note Templates:</strong> Standardized SOAP, DAP, and BIRP documentation formats with full revision histories and digital signatures.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-calmGreen shrink-0 mt-0.5" />
                <span><strong>Responsible AI Drafting:</strong> Gemini-powered draft synthesis that accelerates documentation without bypassing your clinical approval.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-calmGreen shrink-0 mt-0.5" />
                <span><strong>Zero Binary Clutter:</strong> Pure text/JSON records in Firebase Realtime Database. Zero unencrypted audio files stored on servers.</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
            <Link to="/for-psychologists">
              <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
                Explore Clinician Features
              </Button>
            </Link>
            <Link to="/get-started">
              <Button variant="primary" size="sm">
                Set Up Practice
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
