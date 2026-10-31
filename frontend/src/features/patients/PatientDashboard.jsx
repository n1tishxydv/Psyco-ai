import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppointmentCard } from '../../components/common/AppointmentCard';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { StatsCardSkeleton, AppointmentCardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { AlertBanner } from '../../components/common/AlertBanner';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
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
  Sparkles,
  CalendarPlus,
  HeartHandshake,
  FileText,
  Activity,
  CalendarCheck,
} from 'lucide-react';

export function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loadingApts, setLoadingApts] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Cancellation Modal State
  const [cancellingApt, setCancellingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const displayName = user?.fullName || user?.profile?.fullName || 'Patient';
  const intakeStatus = user?.intakeStatus || 'not_started';

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Fetch appointments and assessments
  const loadData = async () => {
    try {
      setLoadingApts(true);
      const res = await appointmentService.getAppointments();
      const list = res?.data?.appointments || [];
      setAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Could not load appointments:', err);
    } finally {
      setLoadingApts(false);
    }

    if (user?.uid) {
      try {
        setLoadingAssessments(true);
        const res = await assessmentService.listPatientAssignments(user.uid);
        const list = res?.data?.assignments || res?.assignments || [];
        setAssignments(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Could not load assessments:', err);
      } finally {
        setLoadingAssessments(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  // Derived appointment categories
  const { nextAppointment, upcomingApts, pendingApts, completedApts } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const upcoming = [];
    const pending = [];
    const completed = [];

    appointments.forEach((apt) => {
      const isPast = apt.date && apt.date < todayStr;
      if (apt.status === 'completed' || isPast) {
        completed.push(apt);
      } else if (apt.status === 'confirmed') {
        upcoming.push(apt);
      } else if (apt.status === 'pending') {
        pending.push(apt);
      }
    });

    // Sort upcoming by date ascending
    upcoming.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));
    pending.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));

    // Next appointment is earliest upcoming confirmed, or earliest pending request
    const next = upcoming[0] || pending[0] || null;

    return {
      nextAppointment: next,
      upcomingApts: upcoming,
      pendingApts: pending,
      completedApts: completed,
    };
  }, [appointments]);

  const pendingAssessments = assignments.filter((a) => a.status === 'assigned' || a.status === 'pending');

  // Handle Cancellation from Dashboard
  const handleConfirmCancel = async () => {
    if (!cancellingApt || !cancelReason || cancelReason.trim().length < 3) return;
    setCancelLoading(true);
    setErrorMsg(null);
    try {
      await appointmentService.cancelAppointment(cancellingApt.id, cancelReason.trim());
      setSuccessMsg('Your consultation was successfully cancelled.');
      setCancellingApt(null);
      setCancelReason('');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-teal-950/40 via-deepBlueGray to-slate-900 rounded-2xl border border-teal-500/20 shadow-lg">
        <div className="flex items-center gap-4">
          <InitialsAvatar
            name={displayName}
            email={user?.email}
            size="lg"
            className="border-2 border-teal-500/40 shadow-sm"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm">Patient Portal</Badge>
              <Badge variant="green" size="sm">Active Account</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              {greeting}, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Welcome to your confidential mental health workspace and consultation schedule.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link to="/find-psychologist">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4" />
              <span>Book Session</span>
            </Button>
          </Link>

          <Link to="/patient/profile">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && <AlertBanner variant="error" message={errorMsg} />}
      {successMsg && <AlertBanner variant="success" message={successMsg} />}

      {/* Standardized Assessment Notification (Phase 7) */}
      {pendingAssessments.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
              <ClipboardCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-100">
                  Standardized Health Assessment Assigned ({pendingAssessments.length})
                </h4>
                <Badge variant="teal" size="sm">Action Requested</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your psychologist has assigned a progress evaluation questionnaire (PHQ-9 / GAD-7) to review your care.
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

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingApts ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            {/* Metric 1: Upcoming Sessions */}
            <Card className="border-slate-800 bg-deepBlueGray/80">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Upcoming Sessions
                  </span>
                  <div className="p-2 rounded-lg bg-softTeal/15 text-softTeal">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {upcomingApts.length}
                </div>
                <p className="text-[11px] text-slate-500">
                  Confirmed sessions on your calendar
                </p>
              </CardContent>
            </Card>

            {/* Metric 2: Pending Requests */}
            <Card className="border-slate-800 bg-deepBlueGray/80">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pending Requests
                  </span>
                  <div className="p-2 rounded-lg bg-mutedAmber/15 text-mutedAmber">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {pendingApts.length}
                </div>
                <p className="text-[11px] text-slate-500">
                  Awaiting clinician confirmation
                </p>
              </CardContent>
            </Card>

            {/* Metric 3: Completed Consultations */}
            <Card className="border-slate-800 bg-deepBlueGray/80">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Past Consultations
                  </span>
                  <div className="p-2 rounded-lg bg-calmGreen/15 text-calmGreen">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {completedApts.length}
                </div>
                <p className="text-[11px] text-slate-500">
                  Total completed therapy hours
                </p>
              </CardContent>
            </Card>

            {/* Metric 4: Intake Questionnaire */}
            <Card className="border-slate-800 bg-deepBlueGray/80">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Clinical Intake
                  </span>
                  <div className="p-2 rounded-lg bg-slate-800 text-softTeal">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <div className="pt-1">
                  <StatusBadge status={intakeStatus} size="sm" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {intakeStatus === 'submitted' ? 'Verified & signed by you' : 'Background & health survey'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Spotlight: Next Appointment */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Next Scheduled Consultation</h2>
            <Badge variant="teal" size="sm">Spotlight</Badge>
          </div>
          <Link
            to="/patient/appointments"
            className="text-xs font-medium text-softTeal hover:underline flex items-center gap-1"
          >
            <span>View All ({appointments.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingApts ? (
          <AppointmentCardSkeleton />
        ) : nextAppointment ? (
          <AppointmentCard
            appointment={nextAppointment}
            onCancel={(apt) => setCancellingApt(apt)}
            onReschedule={() => navigate('/patient/appointments')}
          />
        ) : (
          <Card className="border-dashed border-slate-800 bg-slate-900/40">
            <CardContent className="p-8">
              <EmptyState
                icon={Calendar}
                title="No Upcoming Consultations"
                description="You do not have any upcoming mental health consultations scheduled at this time. Discover licensed psychologists and book a session that fits your schedule."
                actionLabel="Find a Psychologist"
                onAction={() => navigate('/find-psychologist')}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Primary Navigation & Care Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Intake Questionnaire Card */}
        <Card className="border-teal-500/20 bg-deepBlueGray/80 shadow-md hover:border-teal-500/40 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-softTeal/10 text-softTeal">
                <ClipboardList className="w-6 h-6" />
              </div>
              <StatusBadge status={intakeStatus} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-100">Clinical Intake Form</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {intakeStatus === 'submitted'
                  ? 'Your medical background and consents are securely recorded and accessible to your treating clinician.'
                  : 'Complete your health history, therapy goals, and safety disclosures before your appointment.'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/patient/intake">
                <Button variant="primary" size="sm" className="w-full flex items-center justify-center gap-2">
                  <span>{intakeStatus === 'submitted' ? 'Review Intake Record' : 'Continue Intake Form'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Care Plan & Exercises Card */}
        <Card className="border-slate-800 bg-deepBlueGray/80 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-softTeal">
                <Activity className="w-6 h-6" />
              </div>
              <Badge variant="teal" size="sm">Care Management</Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-100">Care Plan & Homework</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review individualized treatment goals, between-session exercises, and verified session summaries.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/patient/care-plan">
                <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                  <span>Open Care Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Directory Card */}
        <Card className="border-slate-800 bg-deepBlueGray/80 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-slate-800 text-softTeal">
                <User className="w-6 h-6" />
              </div>
              <Badge variant="green" size="sm">Verified Directory</Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-100">Find a Psychologist</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse verified clinical specialists by therapeutic focus (CBT, Trauma, Anxiety) and schedule sessions.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <Link to="/find-psychologist">
                <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-2">
                  <span>Browse Clinicians</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancellation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(cancellingApt)}
        onClose={() => {
          setCancellingApt(null);
          setCancelReason('');
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this consultation? This action releases the reserved time slot back to the clinician."
        confirmLabel="Confirm Cancellation"
        confirmVariant="danger"
        loading={cancelLoading}
        requireReason={true}
        reasonValue={cancelReason}
        onReasonChange={setCancelReason}
        reasonPlaceholder="Please share the reason for cancellation (required)..."
      />
    </div>
  );
}

export default PatientDashboard;
