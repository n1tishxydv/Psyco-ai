import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { Textarea } from '../../components/common/Textarea';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppointmentCardSkeleton } from '../../components/common/LoadingSkeleton';
import { appointmentService } from '../../services/appointmentService';
import { availabilityService } from '../../services/availabilityService';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  XCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  Search,
  ArrowRight,
} from 'lucide-react';

export function PatientAppointmentsPage() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [filterTab, setFilterTab] = useState('upcoming'); // 'upcoming' | 'pending' | 'past' | 'cancelled'
  const [searchTerm, setSearchTerm] = useState('');

  // Cancellation Modal State
  const [cancellingApt, setCancellingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Rescheduling Modal State
  const [reschedulingApt, setReschedulingApt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentService.getAppointments();
      setAppointments(res?.data?.appointments || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // When opening reschedule modal, fetch slots
  useEffect(() => {
    if (!reschedulingApt || !rescheduleDate) return;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await availabilityService.getAvailableSlots(
          reschedulingApt.psychologistId,
          rescheduleDate,
          reschedulingApt.sessionMode
        );
        setAvailableSlots(res?.data?.slots || []);
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [reschedulingApt, rescheduleDate]);

  // Handle direct cancellation
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason || cancelReason.trim().length < 3) {
      setErrorMsg('Please provide a reason of at least 3 characters.');
      return;
    }
    setCancelLoading(true);
    setErrorMsg(null);
    try {
      const res = await appointmentService.cancelAppointment(cancellingApt.id, cancelReason);
      setSuccessMsg(res.data.message || 'Appointment cancelled successfully.');
      setCancellingApt(null);
      setCancelReason('');
      await fetchAppointments();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle Rescheduling
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('Please select a new open slot.');
      return;
    }
    setRescheduleLoading(true);
    setErrorMsg(null);
    try {
      const res = await appointmentService.rescheduleAppointment(reschedulingApt.id, {
        newStartTime: selectedSlot.startTime,
        newEndTime: selectedSlot.endTime,
        reason: rescheduleReason,
      });
      setSuccessMsg(res.data.message || 'Appointment rescheduled.');
      setReschedulingApt(null);
      setSelectedSlot(null);
      setRescheduleReason('');
      await fetchAppointments();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Rescheduling failed.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Handle Response to Clinician Alternative Proposal
  const handleProposalResponse = async (appointmentId, action) => {
    setErrorMsg(null);
    try {
      const res = await appointmentService.respondToAlternative(appointmentId, action);
      setSuccessMsg(res.data.message || 'Response recorded.');
      await fetchAppointments();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit response.');
    }
  };

  const now = new Date().toISOString();

  const filteredAppointments = appointments.filter((apt) => {
    let matchesTab = true;
    if (filterTab === 'upcoming') {
      matchesTab = (apt.status === 'confirmed' || apt.status === 'reschedule_requested') && apt.startTime >= now;
    } else if (filterTab === 'pending') {
      matchesTab = apt.status === 'pending' || apt.status === 'cancellation_requested';
    } else if (filterTab === 'past') {
      matchesTab = apt.status === 'completed' || (apt.status === 'confirmed' && apt.startTime < now);
    } else if (filterTab === 'cancelled') {
      matchesTab = apt.status === 'cancelled' || apt.status === 'rejected';
    }

    if (!matchesTab) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const nameMatch = (apt.psychologistName || '').toLowerCase().includes(q);
      const idMatch = (apt.id || '').toLowerCase().includes(q);
      return nameMatch || idMatch;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Patient Care Portal</Badge>
            <Badge variant="neutral" size="sm">{appointments.length} Total Bookings</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-teal-400" />
            My Consultation Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your upcoming therapy sessions, online meeting details, and manage appointments.
          </p>
        </div>

        <Link to="/find-psychologist">
          <Button variant="primary" size="sm" className="flex items-center gap-2 self-start sm:self-auto">
            <Search className="w-4 h-4" />
            Book New Session
          </Button>
        </Link>
      </div>

      {errorMsg && <AlertBanner type="error" title="Notice" message={errorMsg} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterTab === 'upcoming'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upcoming Confirmed
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterTab === 'pending'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Requests
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('past')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterTab === 'past'
                ? 'bg-slate-800 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Past Sessions
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('cancelled')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              filterTab === 'cancelled'
                ? 'bg-slate-800 text-red-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cancelled / Declined
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by clinician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-200">No {filterTab} appointments found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm
              ? `No appointments matching "${searchTerm}" in this tab.`
              : 'You currently have no consultations listed in this tab. Schedule a consultation with any of our verified practitioners.'}
          </p>
          <Link to="/find-psychologist" className="inline-block mt-2">
            <Button variant="secondary" size="sm">
              Discover Clinicians
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAppointments.map((apt) => {
            const isOnline = apt.sessionMode === 'online';
            const start = new Date(apt.startTime);
            const end = new Date(apt.endTime);
            const hasProposal = Boolean(apt.proposedSlot);

            return (
              <Card
                key={apt.id}
                className="border-slate-800 bg-slate-900/90 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={apt.psychologistName} size="md" />
                      <div>
                        <h3 className="text-base font-bold text-slate-100">
                          {apt.psychologistName}
                        </h3>
                        <div className="text-[11px] text-teal-400 font-medium">
                          {isOnline ? 'Online Video Session' : 'In-Person Consultation'}
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={apt.status} size="sm" />
                  </div>

                  {/* Alternative Slot Proposal Notice */}
                  {hasProposal && (
                    <div className="p-3.5 bg-teal-950/40 border border-teal-500/40 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
                        <Clock className="w-3.5 h-3.5" />
                        Clinician Proposed New Time:
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        {new Date(apt.proposedSlot.startTime).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      {apt.proposedSlot.note && (
                        <p className="text-[11px] text-slate-400 italic">
                          "{apt.proposedSlot.note}"
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleProposalResponse(apt.id, 'accept')}
                          className="text-xs py-1"
                        >
                          Accept Time
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProposalResponse(apt.id, 'decline')}
                          className="text-xs py-1 text-slate-400 hover:text-red-300"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Date & Time */}
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-200">
                      <CalendarIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <span className="font-semibold">
                        {start.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <span>
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        ({apt.durationMinutes || 50} mins)
                      </span>
                    </div>

                    {isOnline ? (
                      <div className="flex items-center gap-2 text-slate-300 pt-1 border-t border-slate-800/80">
                        <Video className="w-4 h-4 text-teal-400 flex-shrink-0" />
                        {apt.googleMeetUrl ? (
                          <a
                            href={apt.googleMeetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            Join Google Meet Session
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">
                            Google Meet link will be generated upon clinician confirmation.
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-300 pt-1 border-t border-slate-800/80">
                        <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0" />
                        <span>{apt.location?.addressOrUrl || 'In-Person Practice Clinic'}</span>
                      </div>
                    )}
                  </div>

                  {/* Session PIN & Reference */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="font-mono text-[11px]">Ref: {apt.id}</span>
                    {apt.sessionPin && (
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>Session PIN:</span>
                        <span className="font-mono font-bold text-emerald-400">{apt.sessionPin}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for Active Bookings */}
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReschedulingApt(apt);
                          setRescheduleDate(apt.startTime.split('T')[0]);
                        }}
                        className="text-xs text-slate-300 hover:text-teal-300 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reschedule
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancellingApt(apt)}
                        className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Cancel Appointment</h3>
                <p className="text-xs text-slate-400">Session with {cancellingApt.psychologistName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Appointments cancelled less than 24 hours before the scheduled start time require clinician review in accordance with practice policy.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <Textarea
                label="Reason for Cancellation *"
                required
                rows={3}
                placeholder="Please explain briefly why you need to cancel this appointment"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCancellingApt(null); setCancelReason(''); }}
                  disabled={cancelLoading}
                >
                  Keep Appointment
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={cancelLoading}
                  className="flex items-center gap-1.5"
                >
                  {cancelLoading ? <LoadingSpinner size="sm" /> : <XCircle className="w-4 h-4" />}
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rescheduling Modal */}
      {reschedulingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Reschedule Consultation</h3>
                <p className="text-xs text-slate-400">Select an alternative available slot</p>
              </div>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Choose New Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200"
                />
              </div>

              {/* Slot picker */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Available Slots
                </label>
                {loadingSlots ? (
                  <div className="p-6 text-center">
                    <LoadingSpinner size="sm" className="text-teal-400" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 border border-dashed border-slate-800 rounded-lg text-center">
                    No open slots on this date. Please choose another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {availableSlots.map((slot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 rounded-lg text-xs border text-center transition-all ${
                          selectedSlot?.startTime === slot.startTime
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Textarea
                label="Reason for Rescheduling (Optional)"
                rows={2}
                placeholder="Brief reason for moving the appointment"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setReschedulingApt(null); setSelectedSlot(null); }}
                  disabled={rescheduleLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!selectedSlot || rescheduleLoading}
                  className="flex items-center gap-1.5"
                >
                  {rescheduleLoading ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
