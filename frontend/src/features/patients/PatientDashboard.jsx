import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { useAuth } from '../../context/AuthContext';
import { assessmentService } from '../../services/assessmentService';
import {
  ClipboardList,
  User,
  Calendar,
  Settings,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ClipboardCheck,
} from 'lucide-react';

export function PatientDashboard() {
  const { user } = useAuth();
  const intakeStatus = user?.intakeStatus || 'not_started';
  const displayName = user?.fullName || user?.profile?.fullName || 'Patient';

  const [assignments, setAssignments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      try {
        setLoadingAssessments(true);
        const res = await assessmentService.listPatientAssignments(user?.uid);
        const list = res?.data?.assignments || res?.data?.data?.assignments || res?.assignments || [];
        setAssignments(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load assignments:', err);
      } finally {
        setLoadingAssessments(false);
      }
    }
    if (user?.uid) {
      loadAssignments();
    }
  }, [user?.uid]);

  const pendingAssessments = assignments.filter((a) => a.status === 'assigned' || a.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 rounded-2xl border border-teal-500/20 shadow-lg">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={displayName} email={user?.email} size="lg" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="teal" size="sm">Patient Workspace</Badge>
              <Badge variant="neutral" size="sm">Active Account</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              Welcome back, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Your confidential mental health and care management portal.
            </p>
          </div>
        </div>

        <Link to="/patient/profile">
          <Button variant="secondary" size="sm" className="flex items-center gap-2 self-start sm:self-auto">
            <User className="w-4 h-4" />
            My Profile
          </Button>
        </Link>
      </div>

      {/* Phase 7 Standardized Assessments Action Banner */}
      {pendingAssessments.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
              <ClipboardCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-100">
                  Clinical Assessment Assigned ({pendingAssessments.length})
                </h4>
                <Badge variant="teal" size="sm">Action Requested</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your psychologist has assigned a standardized questionnaire to track your treatment progress.
              </p>
            </div>
          </div>

          <Link to={`/patient/assessments/${pendingAssessments[0].id}`}>
            <Button variant="primary" size="sm" className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <span>Complete Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Primary Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Intake Questionnaire Card */}
        <Card className="border-teal-500/30 bg-slate-900 shadow-md hover:border-teal-500/50 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              {intakeStatus === 'submitted' ? (
                <Badge variant="green" size="sm">Verified & Signed</Badge>
              ) : intakeStatus === 'draft' ? (
                <Badge variant="amber" size="sm">Draft in Progress</Badge>
              ) : (
                <Badge variant="neutral" size="sm">Action Required</Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100">Clinical Intake Form</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {intakeStatus === 'submitted'
                  ? 'Your intake assessment and informed consents have been securely recorded for your psychologist.'
                  : 'Complete your confidential background and health survey prior to your consultation.'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/patient/intake">
                <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-2">
                  {intakeStatus === 'submitted' ? 'Review Submitted Intake' : 'Continue Intake Form'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="border-slate-800 bg-slate-900 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-teal-400">
                <User className="w-6 h-6" />
              </div>
              <Badge variant="neutral" size="sm">Personal Record</Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100">Personal Demographics</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Manage your phone number, preferred name, timezone, and emergency point of contact.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/patient/profile">
                <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                  Edit Personal Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Account & Security Settings Card */}
        <Card className="border-slate-800 bg-slate-900 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-teal-400">
                <Settings className="w-6 h-6" />
              </div>
              <Badge variant="neutral" size="sm">System</Badge>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100">Settings & Appearance</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Configure theme (Dark/Light mode), notification alerts, and password security credentials.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/settings">
                <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                  Account Settings
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase 4 Active Feature: Care Plan & Homework */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 flex-shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-100">
                Care Plan, Exercises & Shared Summaries
              </h4>
              <Badge variant="teal" size="sm">Phase 4 Live</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Review your treatment goals, complete assigned between-session homework exercises, and read verified session takeaways shared by your psychologist.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <Link to="/patient/care-plan">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              Open Care Plan
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Phase 3 Active Feature: Appointments & Booking Management */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/30 to-slate-900 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-100">
                Consultation Scheduling & Care Appointments
              </h4>
              <Badge variant="teal" size="sm">Phase 3 Live</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Find licensed clinicians, view real-time availability slots, book in-person or telehealth sessions, and manage your consultation schedule.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <Link to="/find-psychologist">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              Find a Clinician
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/patient/appointments">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              My Appointments
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
