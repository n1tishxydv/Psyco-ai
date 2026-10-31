import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { useAuth } from '../../context/AuthContext';
import { directoryService } from '../../services/directoryService';
import { availabilityService } from '../../services/availabilityService';
import { appointmentService } from '../../services/appointmentService';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Building,
  Sparkles,
} from 'lucide-react';

export function BookingPage() {
  const { psychologistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [psychologist, setPsychologist] = useState(null);
  const [loadingPsych, setLoadingPsych] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [selectedMode, setSelectedMode] = useState('in_person');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Tomorrow as default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  const upcomingDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short' });
      const dayNum = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      days.push({ iso, label, dayNum });
    }
    return days;
  }, []);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Load Clinician
  useEffect(() => {
    async function fetchPsych() {
      try {
        const res = await directoryService.getPsychologistById(psychologistId);
        if (res?.data?.psychologist) {
          const psych = res.data.psychologist;
          setPsychologist(psych);
          if (psych.defaultMode) {
            setSelectedMode(psych.defaultMode);
          } else if (psych.offeredModes === 'online') {
            setSelectedMode('online');
          }
        } else {
          setErrorMsg('Psychologist profile not found.');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Could not load clinician details.');
      } finally {
        setLoadingPsych(false);
      }
    }
    fetchPsych();
  }, [psychologistId]);

  // Load Available Slots whenever date or mode changes
  useEffect(() => {
    if (!psychologistId || !selectedDate) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await availabilityService.getAvailableSlots(psychologistId, selectedDate, selectedMode);
        setAvailableSlots(res?.data?.slots || []);
      } catch (err) {
        console.warn('Slot calculation note:', err.message);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [psychologistId, selectedDate, selectedMode]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be signed in to confirm an appointment. Please log in or create an account.');
      return;
    }

    if (!selectedSlot) {
      setErrorMsg('Please select an available time slot.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await appointmentService.createAppointment({
        psychologistId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        sessionMode: selectedMode,
        reason,
      });

      setConfirmedAppointment(res.data.appointment);
    } catch (err) {
      console.error('Booking failed:', err);
      let msg = err.message || 'Failed to submit appointment request.';
      if (err.code === 'SLOT_ALREADY_RESERVED') {
        msg = 'This time slot was just reserved by another booking. Please choose another available slot.';
      } else if (msg.includes('Access denied')) {
        msg = 'Your session needs a quick refresh to confirm your booking role. Please try again or refresh the page.';
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPsych) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <LoadingSpinner size="lg" className="text-teal-400 mb-4" />
        <p className="text-sm text-slate-400">Loading clinician scheduling calendar...</p>
      </div>
    );
  }

  if (!psychologist) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <AlertBanner type="error" title="Clinician Unavailable" message="This psychologist profile is not available." />
        <Link to="/find-psychologist">
          <Button variant="secondary" size="sm">
            Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  // Confirmation Success View
  if (confirmedAppointment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="border-teal-500/40 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <Badge variant="teal" size="sm">Booking Request Submitted</Badge>
            <h2 className="text-2xl font-bold text-slate-100">Appointment Scheduled</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your appointment request with <span className="text-teal-300 font-semibold">{psychologist.fullName}</span> has been securely recorded.
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-500">Appointment Reference</span>
              <span className="font-mono text-teal-300 font-semibold">{confirmedAppointment.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-500">Scheduled Date & Time</span>
              <span className="font-semibold text-slate-100">
                {new Date(confirmedAppointment.startTime).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-500">Consultation Mode</span>
              <span className="capitalize font-semibold text-teal-300">
                {confirmedAppointment.sessionMode === 'in_person' ? 'In-Person Consultation' : 'Online (Google Meet)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-500">Current Status</span>
              <Badge variant="amber" size="sm" className="capitalize">
                {confirmedAppointment.status}
              </Badge>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Confidential Session PIN</span>
              <span className="font-mono text-base font-bold text-emerald-400 tracking-wider">
                {confirmedAppointment.sessionPin}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="primary" size="md" onClick={() => navigate('/patient/appointments')}>
              View My Appointments
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate('/patient/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const offeredModes = psychologist.offeredModes || 'both';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Clinician Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-start sm:items-center gap-4">
          <InitialsAvatar name={psychologist.fullName} size="xl" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="teal" size="sm">Consultation Booking</Badge>
              <Badge variant="green" size="sm">License: {psychologist.licenseNumber}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{psychologist.fullName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {(psychologist.specializations || []).join(' • ')}
            </p>
          </div>
        </div>

        <Link to="/find-psychologist">
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <ArrowLeft className="w-4 h-4" /> Change Clinician
          </Button>
        </Link>
      </div>

      {errorMsg && <AlertBanner type="error" title="Booking Error" message={errorMsg} />}

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Step 1: Session Mode Selection */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-md">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-teal-300 flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-400" />
              1. Select Consultation Mode
            </h3>
            <p className="text-xs text-slate-400">
              In-person consultation is the default mode for Psyco AI clinical practices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* In-Person Option */}
              <button
                type="button"
                disabled={offeredModes === 'online'}
                onClick={() => setSelectedMode('in_person')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'in_person'
                    ? 'bg-teal-950/30 border-teal-500/70 text-teal-200 ring-1 ring-teal-500/30'
                    : offeredModes === 'online'
                    ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-950/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-100 text-xs">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    In-Person Consultation (Default)
                  </div>
                  {selectedMode === 'in_person' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {psychologist.clinicAddress?.city
                    ? `Physical clinic attendance at ${psychologist.clinicAddress.city}, ${psychologist.clinicAddress.state || ''}`
                    : 'Physical clinic appointment directly with your practitioner.'}
                </div>
              </button>

              {/* Online Video Option */}
              <button
                type="button"
                disabled={offeredModes === 'in_person'}
                onClick={() => setSelectedMode('online')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'online'
                    ? 'bg-teal-950/30 border-teal-500/70 text-teal-200 ring-1 ring-teal-500/30'
                    : offeredModes === 'in_person'
                    ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-950/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-100 text-xs">
                    <Video className="w-4 h-4 text-teal-400" />
                    Online Video (Google Meet)
                  </div>
                  {selectedMode === 'online' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Private telehealth video conference link generated automatically upon confirmation.
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Date & Available Time Slot Selection */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-teal-300 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-400" />
                2. Select Appointment Date & Open Slot
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Times displayed in {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </div>

            {/* Quick Pick Day Selector Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Quick Select Date
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {upcomingDays.map((day) => {
                  const isCurrent = selectedDate === day.iso;
                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setSelectedDate(day.iso)}
                      className={`px-3 py-2 rounded-xl text-left border flex-shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-semibold ring-1 ring-teal-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">{day.label}</div>
                      <div className="text-xs font-bold text-slate-200">{day.dayNum}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-w-xs pt-1">
              <label className="text-[11px] text-slate-400 block mb-1">
                Or pick any specific date:
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            {/* Slots Grid */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Available Time Slots for {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </label>

              {loadingSlots ? (
                <div className="p-8 text-center">
                  <LoadingSpinner size="md" className="text-teal-400 mb-2" />
                  <p className="text-xs text-slate-400">Checking clinician schedule & conflict buffer...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-1">
                  <Clock className="w-5 h-5 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No open slots available on this date.</p>
                  <p className="text-[11px] text-slate-500">
                    The clinician may not have scheduled hours, is on leave, or all intervals are booked. Please pick another date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableSlots.map((slot, index) => {
                    const startFormatted = new Date(slot.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const endFormatted = new Date(slot.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isSelected = selectedSlot?.startTime === slot.startTime;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold shadow-md ring-1 ring-teal-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs">{startFormatted}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">to {endFormatted}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Brief Reason & Sensitive Clinical Privacy Notice */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-md">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-teal-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-400" />
              3. Appointment Reason & Privacy Guard
            </h3>

            {/* Privacy Disclaimer Notice */}
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-amber-300">Privacy Notice Regarding Appointment Notes:</span>
                Please provide only a brief summary topic (e.g. "Initial consultation for anxiety" or "Work stress follow-up"). Do not enter highly sensitive traumatic disclosures or private therapeutic details into general scheduling fields.
              </div>
            </div>

            <Textarea
              label="Brief Reason for Consultation (Optional)"
              rows={2}
              placeholder="e.g. Initial counseling consultation for anxiety management and mindfulness techniques"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="pt-2 space-y-3 border-t border-slate-800">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                By requesting this appointment, you agree to our{' '}
                <a href="/terms#appointments" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                  Appointment & Cancellation Policy
                </a>{' '}
                and acknowledge the{' '}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                  Privacy Policy
                </a>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {selectedSlot ? (
                    <span>
                      Selected: <span className="text-teal-300 font-semibold">{new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> ({selectedMode.replace('_', ' ')})
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Please select a time slot above.</span>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!selectedSlot || submitting}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <CalendarIcon className="w-4 h-4" />}
                  Confirm & Request Booking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
