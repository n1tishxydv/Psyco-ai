import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { useAuth } from '../../context/AuthContext';
import { RiskReviewBanner } from '../clinical/RiskReviewBanner';
import { DocumentationQualityWidget } from '../clinical/DocumentationQualityWidget';
import {
  Stethoscope,
  FileSpreadsheet,
  User,
  Calendar,
  Settings,
  ArrowRight,
  Award,
  Sparkles,
  MapPin,
  Clock,
  ClipboardCheck,
  Activity,
} from 'lucide-react';

export function PsychologistDashboard() {
  const { user } = useAuth();
  const psych = user?.profile || {};
  const displayName = user?.fullName || psych.fullName || 'Clinician';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={displayName} email={user?.email} size="lg" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="green" size="sm">Clinician Workspace</Badge>
              <Badge variant="neutral" size="sm">
                License: {psych.licenseNumber || 'Verified Practice'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              Welcome back, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Practice Management, Intake Questionnaire Customization & Clinical Workspace.
            </p>
          </div>
        </div>

        <Link to="/psychologist/profile">
          <Button variant="secondary" size="sm" className="flex items-center gap-2 self-start sm:self-auto">
            <User className="w-4 h-4" />
            Practice Profile
          </Button>
        </Link>
      </div>

      {/* Practice Risk Review Alert Banner */}
      <RiskReviewBanner />

      {/* Primary Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Custom Intake Builder Card */}
        <Card className="border-emerald-500/30 bg-slate-900 shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <Badge variant="green" size="sm">Practice Autonomy</Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100">Intake Questionnaire Builder</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Design custom questions, scale ratings, and multiple choice prompts for incoming patients.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/psychologist/intake-settings">
                <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-2">
                  Configure Questions
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Practice Credentials & Modes Card */}
        <Card className="border-slate-800 bg-slate-900 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-teal-400">
                <Stethoscope className="w-6 h-6" />
              </div>
              <Badge variant="neutral" size="sm">Clinical Record</Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100">Practice & Delivery Modes</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Update offered consultation modes (In-person clinic vs Telehealth video), address, and bio.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/psychologist/profile">
                <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                  Edit Practice Profile
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Settings & Theme Card */}
        <Card className="border-slate-800 bg-slate-900 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-teal-400">
                <Settings className="w-6 h-6" />
              </div>
              <Badge variant="neutral" size="sm">System</Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100">System & Preferences</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sync Dark/Light theme, clinic timezone, email notification rules, and password security.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/settings">
                <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                  Practice Settings
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase 7 Active Feature: Standardized Assessments & Progress Analytics */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 flex-shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-100">
                Standardized Assessments & Progress Analytics
              </h4>
              <Badge variant="teal" size="sm">Phase 7 Live</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Administer verified PHQ-9, GAD-7, and C-SSRS instruments, plot deterministic symptom trajectories, track treatment goal completion, and review safety flags.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
          <Link to="/psychologist/patients">
            <Button variant="primary" size="sm" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold">
              <Activity className="w-4 h-4" />
              Open Patient Charts
            </Button>
          </Link>
        </div>
      </div>

      {/* Documentation Quality & Practice Completeness Audit */}
      <DocumentationQualityWidget />

      {/* Phase 4 Active Feature: Clinical Documentation & Patient Management */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-100">
                Clinical Workspace, Charts & Documentation
              </h4>
              <Badge variant="green" size="sm">Phase 4 Live</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Open assigned patient medical charts, document clinical sessions (SOAP, DAP, BIRP), maintain versioned treatment plans, and generate formal clinical reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
          <Link to="/psychologist/patients">
            <Button variant="primary" size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
              <User className="w-4 h-4" />
              Patient Roster
            </Button>
          </Link>
          <Link to="/psychologist/treatment-plans">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              Treatment Plans
            </Button>
          </Link>
          <Link to="/psychologist/reports">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Phase 3 Active Feature: Calendar & Practice Scheduling */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-100">
                Practice Calendar & Dynamic Availability
              </h4>
              <Badge variant="green" size="sm">Phase 3 Live</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Review incoming patient booking requests, accept or propose alternative slots, manage weekly hours and blocked leave, and synchronize Google Calendar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <Link to="/psychologist/appointments">
            <Button variant="primary" size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Calendar className="w-4 h-4" />
              Practice Calendar
            </Button>
          </Link>
          <Link to="/psychologist/availability">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Availability Rules
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
