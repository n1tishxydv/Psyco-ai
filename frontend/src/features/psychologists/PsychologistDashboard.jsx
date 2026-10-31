import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { StatsCardSkeleton, AppointmentCardSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { clinicalService } from '../../services/clinicalService';
import { practiceService } from '../../services/practiceService';
import { googleCalendarService } from '../../services/googleCalendarService';
import { RiskReviewBanner } from '../clinical/RiskReviewBanner';
import { DocumentationQualityWidget } from '../clinical/DocumentationQualityWidget';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  Users,
  Video,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Sliders,
  Sparkles,
  ClipboardCheck,
  FileText,
  Activity,
  PlusCircle,
  ChevronDown,
} from 'lucide-react';

export function PsychologistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState({ connected: false });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals for Appointment Management
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, appointmentId: null, reason: '' });
  const [proposeModal, setProposeModal] = useState({
    open: false,
    appointmentId: null,
    date: '',
    startTime: '10:00',
    endTime: '10:50',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [aptRes, patRes, wsRes, calRes] = await Promise.all([
        appointmentService.getAppointments().catch(() => ({ data: { appointments: [] } })),
        clinicalService.getPatients().catch(() => ({ data: { patients: [] } })),
        practiceService.getWorkspace().catch(() => ({ data: null })),
        googleCalendarService.getConnectionStatus().catch(() => ({ data: { connected: false } })),
      ]);

      setAppointments(aptRes.data?.appointments || []);
      setPatients(patRes.data?.patients || []);
      setWorkspace(wsRes.data || null);
      setCalendarStatus(calRes.data || { connected: false });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const psych = user?.profile || {};
  const displayName = user?.fullName || psych.fullName || 'Clinician';
  const isApproved = psych.approvalStatus === 'approved' || psych.verified === true;

  // Active Practice Context Name
  const activePracticeName = useMemo(() => {
    if (!workspace) return 'Private Practice';
    const active = workspace.availableContexts?.find((c) => c.isCurrent);
    return active ? active.name : workspace.independentPractice?.practiceName || 'Independent Practice';
  }, [workspace]);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Appointment Calculations
  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const aDate = a.date || (a.startTime ? a.startTime.split('T')[0] : '');
      return aDate === todayStr && a.status === 'confirmed';
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [appointments, todayStr]);

  const pendingRequests = useMemo(() => {
    return appointments.filter((a) => a.status === 'pending');
  }, [appointments]);

  const upcomingConsultations = useMemo(() => {
    return appointments.filter((a) => a.status === 'confirmed' && new Date(a.startTime) > now);
  }, [appointments, now]);

  const completedSessions = useMemo(() => {
    return appointments.filter((a) => a.status === 'completed');
  }, [appointments]);

  // Handle Practice Context Switch
  const handleSwitchPractice = async (practiceId) => {
    try {
      setActionLoading(true);
      await practiceService.switchContext(practiceId);
      setSuccessMsg('Active practice context updated.');
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to switch practice context.');
    } finally {
      setActionLoading(false);
    }
  };

  // Appointment Actions
  const handleAcceptAppointment = async (appointmentId) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await appointmentService.acceptAppointment(appointmentId);
      setSuccessMsg('Appointment accepted and confirmed.');
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason || rejectModal.reason.trim().length < 3) {
      setErrorMsg('Please specify a rejection reason (minimum 3 characters).');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await appointmentService.rejectAppointment(rejectModal.appointmentId, rejectModal.reason);
      setSuccessMsg('Appointment declined.');
      setRejectModal({ open: false, appointmentId: null, reason: '' });
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to decline appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!proposeModal.date || !proposeModal.startTime || !proposeModal.endTime) {
      setErrorMsg('Please select a valid proposal date and time interval.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const proposedStart = `${proposeModal.date}T${proposeModal.startTime}:00.000Z`;
      const proposedEnd = `${proposeModal.date}T${proposeModal.endTime}:00.000Z`;
      await appointmentService.proposeAlternativeSlot(proposeModal.appointmentId, {
        startTime: proposedStart,
        endTime: proposedEnd,
        reason: proposeModal.reason,
      });
      setSuccessMsg('Alternative consultation time proposed to patient.');
      setProposeModal({ open: false, appointmentId: null, date: '', startTime: '10:00', endTime: '10:50', reason: '' });
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to propose alternative time.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 rounded-3xl border border-teal-500/20 shadow-2xl">
        <div className="flex items-start sm:items-center gap-4">
          <InitialsAvatar name={displayName} email={user?.email} size="xl" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant={isApproved ? 'green' : 'amber'} size="sm">
                {isApproved ? 'Verified Clinician' : 'Verification Review'}
              </Badge>
              <Badge variant="teal" size="sm">
                License: {psych.licenseNumber || 'Active Clinical Practice'}
              </Badge>
              <Badge variant="neutral" size="sm">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              {greeting}, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Clinical Practice Management, Autonomous Scheduling & Therapeutic Workspace.
            </p>
          </div>
        </div>

        {/* Practice Context Switcher & Setup Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {workspace?.availableContexts?.length > 1 && (
            <div className="relative">
              <select
                value={workspace.activePracticeId}
                onChange={(e) => handleSwitchPractice(e.target.value)}
                disabled={actionLoading}
                className="w-full px-3 py-2 bg-slate-950 border border-teal-500/40 rounded-xl text-xs text-teal-300 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                {workspace.availableContexts.map((ctx) => (
                  <option key={ctx.practiceId} value={ctx.practiceId}>
                    {ctx.name} ({ctx.type === 'independent' ? 'Private' : 'Clinic'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link to="/psychologist/practice-setup">
            <Button variant="secondary" size="sm" className="flex items-center justify-center gap-2 text-xs w-full sm:w-auto">
              <Sliders className="w-4 h-4 text-teal-400" />
              Practice Setup
            </Button>
          </Link>

          <Link to="/psychologist/profile">
            <Button variant="ghost" size="sm" className="flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white w-full sm:w-auto">
              <User className="w-4 h-4" />
              Profile
            </Button>
          </Link>
        </div>
      </div>

      {errorMsg && <AlertBanner type="error" title="Notice" message={errorMsg} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Practice Risk Review Alert Banner */}
      <RiskReviewBanner />

      {/* Incomplete Setup Guidance Banner */}
      {workspace && !workspace.independentPractice?.setupCompleted && (
        <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-teal-200">
            <Sparkles className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-teal-300 block">Complete Your Practice Configuration:</span>
              Configure your practice brand, offered modes, and office locations to optimize patient booking.
            </div>
          </div>
          <Link to="/psychologist/practice-setup" className="self-start sm:self-auto flex-shrink-0">
            <Button variant="primary" size="sm" className="text-xs bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold">
              Complete Setup
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics Overview Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card className="border-slate-800 bg-slate-900/90 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Today's Schedule
                  </div>
                  <div className="text-2xl font-bold text-slate-100 mt-1">
                    {todayAppointments.length}
                  </div>
                  <div className="text-[10px] text-teal-400 mt-0.5">
                    {todayAppointments.length === 1 ? '1 Consultation' : `${todayAppointments.length} Consultations`}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Pending Requests
                  </div>
                  <div className="text-2xl font-bold text-slate-100 mt-1">
                    {pendingRequests.length}
                  </div>
                  <div className="text-[10px] text-amber-400 mt-0.5">
                    {pendingRequests.length > 0 ? 'Requires Clinician Review' : 'All clear'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Active Patient Roster
                  </div>
                  <div className="text-2xl font-bold text-slate-100 mt-1">
                    {patients.length}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    Assigned therapeutic cases
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Upcoming Consultations
                  </div>
                  <div className="text-2xl font-bold text-slate-100 mt-1">
                    {upcomingConsultations.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Confirmed future sessions
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 text-teal-400">
                  <Calendar className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Section: Today's Schedule & Incoming Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Today's Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              Today's Clinical Schedule ({new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })})
            </h2>
            <Link to="/psychologist/appointments">
              <Button variant="ghost" size="sm" className="text-xs text-teal-300 hover:text-teal-200">
                View Full Calendar <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No Consultations Scheduled for Today</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have no confirmed therapy sessions today. Review incoming appointment requests or manage availability.
              </p>
              <Link to="/psychologist/availability" className="inline-block pt-2">
                <Button variant="secondary" size="sm" className="text-xs">
                  Manage Availability Hours
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => {
                const isOnline = apt.sessionMode === 'online';
                const start = new Date(apt.startTime);
                const end = new Date(apt.endTime);

                return (
                  <Card
                    key={apt.id}
                    className="border-slate-800 bg-slate-900/90 shadow-md hover:border-slate-700 transition-all"
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <InitialsAvatar name={apt.patientName} size="md" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-100">{apt.patientName}</h4>
                            <StatusBadge status={apt.status} size="sm" />
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-2 font-medium">
                            <Clock className="w-3.5 h-3.5 text-teal-400" />
                            <span>
                              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                              {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                              ({apt.durationMinutes || 50} mins)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            {isOnline ? (
                              <>
                                <Video className="w-3.5 h-3.5 text-teal-400" />
                                <span>Online Telehealth Session</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                                <span>{apt.location?.addressOrUrl || 'In-Person Practice Clinic'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        {isOnline && apt.googleMeetUrl && (
                          <a
                            href={apt.googleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-all"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Video
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}

                        <Link to={`/psychologist/sessions/appointment/${apt.id}`}>
                          <Button variant="primary" size="sm" className="text-xs flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5" />
                            Clinical Workspace
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (1 span): Incoming Requests & Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Incoming Requests ({pendingRequests.length})
            </h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-semibold text-slate-300">No Pending Requests</h4>
              <p className="text-[11px] text-slate-500">
                All incoming patient booking requests have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-slate-900 rounded-2xl border border-amber-500/30 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{req.patientName}</h4>
                      <p className="text-[11px] text-slate-400">
                        {new Date(req.startTime).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <Badge variant="amber" size="sm">Pending</Badge>
                  </div>

                  {req.reason && (
                    <p className="text-[11px] text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      "{req.reason}"
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptAppointment(req.id)}
                      disabled={actionLoading}
                      className="text-xs py-1 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const d = req.startTime.split('T')[0];
                        setProposeModal({
                          open: true,
                          appointmentId: req.id,
                          date: d,
                          startTime: '11:00',
                          endTime: '11:50',
                          reason: 'Scheduling adjustment',
                        });
                      }}
                      disabled={actionLoading}
                      className="text-xs py-1"
                    >
                      Propose Time
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRejectModal({ open: true, appointmentId: req.id, reason: '' })}
                      disabled={actionLoading}
                      className="text-xs py-1 text-slate-400 hover:text-red-400"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Google Calendar Connection Status Pill */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-teal-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Google Calendar</span>
                <span className="text-[10px] text-slate-400">
                  {calendarStatus.connected ? 'Synchronized & Active' : 'Not Connected'}
                </span>
              </div>
            </div>
            <Link to="/psychologist/practice-setup">
              <Button variant="ghost" size="sm" className="text-xs text-teal-300">
                {calendarStatus.connected ? 'Settings' : 'Connect'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Dock */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Clinical Management Dock</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/psychologist/patients">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition-all text-center space-y-2 group">
              <Users className="w-6 h-6 text-teal-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Patient Directory</div>
              <div className="text-[10px] text-slate-500">Access medical charts</div>
            </div>
          </Link>

          <Link to="/psychologist/appointments">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition-all text-center space-y-2 group">
              <Calendar className="w-6 h-6 text-teal-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Calendar & Agenda</div>
              <div className="text-[10px] text-slate-500">Manage consultations</div>
            </div>
          </Link>

          <Link to="/psychologist/availability">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition-all text-center space-y-2 group">
              <Clock className="w-6 h-6 text-teal-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Availability Rules</div>
              <div className="text-[10px] text-slate-500">Working hours & leave</div>
            </div>
          </Link>

          <Link to="/psychologist/treatment-plans">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition-all text-center space-y-2 group">
              <ClipboardCheck className="w-6 h-6 text-teal-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-200">Treatment Plans</div>
              <div className="text-[10px] text-slate-500">Interventions & goals</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Documentation Completeness & Audits */}
      <DocumentationQualityWidget />

      {/* Reject Appointment Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Decline Appointment Request</h3>
            <p className="text-xs text-slate-400">
              Please provide a brief reason for declining. The patient will be notified in accordance with practice policy.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="e.g. Unforeseen clinical emergency or out of office."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRejectModal({ open: false, appointmentId: null, reason: '' })}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={actionLoading}>
                  Confirm Decline
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Alternative Time Modal */}
      {proposeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Propose Alternative Time</h3>
            <p className="text-xs text-slate-400">
              Select an alternative slot to offer to the patient.
            </p>
            <form onSubmit={handleProposeSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={proposeModal.date}
                  onChange={(e) => setProposeModal({ ...proposeModal, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={proposeModal.startTime}
                    onChange={(e) => setProposeModal({ ...proposeModal, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={proposeModal.endTime}
                    onChange={(e) => setProposeModal({ ...proposeModal, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule conflict during requested hour."
                  value={proposeModal.reason}
                  onChange={(e) => setProposeModal({ ...proposeModal, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProposeModal({ open: false, appointmentId: null, date: '', startTime: '10:00', endTime: '10:50', reason: '' })}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  Send Alternative Proposal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
