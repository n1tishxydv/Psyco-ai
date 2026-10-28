import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  FileText,
  Users,
  Target,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  ClipboardList
} from 'lucide-react';

export function ClinicalNotesPage() {
  const { user } = useAuth();

  // If patient, redirect to their personal care plan & summaries
  if (user?.role === 'patient') {
    return <Navigate to="/patient/care-plan" replace />;
  }

  // If admin, redirect to admin governance dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" size="sm">Clinical Workspace</Badge>
            <Badge variant="neutral" size="sm">Phase 4 Active</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-emerald-400" />
            Clinical Documentation & Charting Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your assigned patient roster, structured session notes (SOAP, DAP, BIRP, General), treatment plans, and clinical reports.
          </p>
        </div>
      </div>

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Roster & Charts */}
        <Card className="border-slate-800 bg-slate-900 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <Badge variant="green" size="sm">Patient Records</Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Patient Directory & Charts</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Open comprehensive patient charts, review completed intake surveys, view chronological consultation histories, and draft session notes.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <Link to="/psychologist/patients">
                <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-2">
                  Open Patient Directory
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Plans Hub */}
        <Card className="border-slate-800 bg-slate-900 hover:border-teal-500/40 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                <Target className="w-6 h-6" />
              </div>
              <Badge variant="teal" size="sm">Care Goals</Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Treatment Plans & Goals</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Design custom care plans, establish measurable objectives, track progress notes, assign homework exercises, and control patient publication.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <Link to="/psychologist/treatment-plans">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                  Manage Treatment Plans
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Reports Generator */}
        <Card className="border-slate-800 bg-slate-900 hover:border-sky-500/40 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
                <FileText className="w-6 h-6" />
              </div>
              <Badge variant="neutral" size="sm">Formal Reports</Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Clinical Report Generator</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Synthesize formal session summaries, progress evaluations, discharge summaries, and consultation logs for export and printing.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <Link to="/psychologist/reports">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                  Generate Clinical Reports
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Calendar & Sessions */}
        <Card className="border-slate-800 bg-slate-900 hover:border-slate-700 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
                <Calendar className="w-6 h-6" />
              </div>
              <Badge variant="neutral" size="sm">Scheduling</Badge>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Appointments & Consultations</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Review your appointment calendar, join Google Meet telehealth sessions, and launch the live Session Workspace with Session PIN verification.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <Link to="/psychologist/appointments">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                  View Appointment Calendar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
