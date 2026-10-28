import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { availabilityService } from '../../services/availabilityService';
import { googleCalendarService } from '../../services/googleCalendarService';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  KeyRound,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Send,
  CalendarCheck2,
  Ban,
  Unlock,
  Sliders,
  PlusCircle,
  Sparkles,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function PsychologistCalendarPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'all'
  const [actionLoading, setActionLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Availability & Slots State
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [slotFilter, setSlotFilter] = useState('all'); // 'all' | 'available' | 'booked' | 'blocked'
  const [walkInModal, setWalkInModal] = useState({
    open: false,
    slot: null,
    patientName: '',
    sessionMode: 'in_person',
    reason: '',
  });

  // Modals state
  const [rejectModal, setRejectModal] = useState({ open: false, appointmentId: null, reason: '' });
  const [proposeModal, setProposeModal] = useState({
    open: false,
    appointmentId: null,
    date: '',
    startTime: '10:00',
    endTime: '10:50',
    reason: '',
  });
  const [cancelModal, setCancelModal] = useState({ open: false, appointmentId: null, reason: '' });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appointmentService.getAppointments();
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      setAvailabilityLoading(true);
      const res = await availabilityService.getOwnAvailability();
      const data = res.data?.availability || null;
      if (data) {
        setAvailability(data);
      }
    } catch (err) {
      console.warn('Availability load note:', err.message);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const checkCalendarStatus = async () => {
    try {
      const res = await googleCalendarService.getConnectionStatus();
      setCalendarConnected(res.data?.connected || false);
    } catch {
      setCalendarConnected(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchAvailability();
    checkCalendarStatus();
  }, []);

  // Block a specific slot for the selected date
  const handleBlockSlot = async (slot) => {
    if (!slot) return;
    try {
      setActionLoading(true);
      await availabilityService.addBlockedDate({
        date: selectedDate,
        startTime: slot.startTimeHHMM,
        endTime: slot.endTimeHHMM,
        isFullDay: false,
        reason: 'Unavailable / Reserved',
      });
      await fetchAvailability();
    } catch (err) {
      alert(`Failed to block slot: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Unblock a specific slot
  const handleUnblockSlot = async (blockId) => {
    if (!blockId) return;
    try {
      setActionLoading(true);
      await availabilityService.removeBlockedDate(blockId);
      await fetchAvailability();
    } catch (err) {
      alert(`Failed to unblock slot: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle full day block on selected date
  const handleToggleFullDayBlock = async () => {
    const fullDayBlock = (availability?.blockedDates || []).find((b) => b.date === selectedDate && b.isFullDay);
    try {
      setActionLoading(true);
      if (fullDayBlock) {
        await availabilityService.removeBlockedDate(fullDayBlock.id);
      } else {
        await availabilityService.addBlockedDate({
          date: selectedDate,
          isFullDay: true,
          reason: 'Full day blocked by clinician',
        });
      }
      await fetchAvailability();
    } catch (err) {
      alert(`Failed to toggle day block: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Direct walk-in / clinician reservation submit
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInModal.slot) return;
    try {
      setActionLoading(true);
      await appointmentService.createAppointment({
        psychologistId: user?.uid,
        startTime: walkInModal.slot.startIso,
        endTime: walkInModal.slot.endIso,
        sessionMode: walkInModal.sessionMode,
        reason: walkInModal.reason || 'Direct Clinician Reservation',
        patientName: walkInModal.patientName || 'Walk-In Patient',
      });
      setWalkInModal({
        open: false,
        slot: null,
        patientName: '',
        sessionMode: 'in_person',
        reason: '',
      });
      await Promise.all([fetchAppointments(), fetchAvailability()]);
    } catch (err) {
      alert(`Failed to create walk-in appointment: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter pending requests
  const pendingRequests = useMemo(() => {
    return appointments.filter((apt) => apt.status === 'pending');
  }, [appointments]);

  // Appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.date === selectedDate && apt.status !== 'cancelled' && apt.status !== 'rejected')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate]);

  // Compute calculated working slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    const fallbackSchedule = {
      monday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
      tuesday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
      wednesday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
      thursday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
      friday: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
      saturday: [{ startTime: '10:00', endTime: '16:00', mode: 'both' }],
      sunday: [{ startTime: '10:00', endTime: '14:00', mode: 'both' }],
    };

    const dateObj = new Date(`${selectedDate}T00:00:00Z`);
    if (isNaN(dateObj.getTime())) return [];

    const dayName = DAY_NAMES[dateObj.getUTCDay()];
    const weeklySchedule = availability?.weeklySchedule || fallbackSchedule;
    let dayRules = weeklySchedule[dayName] || [];

    // If dayRules is an object { enabled, startTime, endTime }
    if (dayRules && !Array.isArray(dayRules) && typeof dayRules === 'object') {
      if (dayRules.enabled !== false && dayRules.startTime && dayRules.endTime) {
        dayRules = [{ startTime: dayRules.startTime, endTime: dayRules.endTime, mode: dayRules.mode || 'both' }];
      } else {
        dayRules = [];
      }
    }

    if (!Array.isArray(dayRules) || dayRules.length === 0) {
      return [];
    }

    const durationMin = availability?.sessionDurationMinutes || 50;
    const bufferMin = availability?.bufferTimeMinutes || availability?.bufferMinutes || 10;
    const durationMs = durationMin * 60 * 1000;
    const bufferMs = bufferMin * 60 * 1000;

    // Check full day blocked
    const fullDayBlock = (availability?.blockedDates || []).find((b) => b.date === selectedDate && b.isFullDay);

    // Check leave
    const onLeave = (availability?.leavePeriods || []).find(
      (l) => selectedDate >= l.startDate && selectedDate <= l.endDate
    );

    const partialBlocks = (availability?.blockedDates || []).filter(
      (b) => b.date === selectedDate && !b.isFullDay
    );

    const computed = [];

    for (const period of dayRules) {
      if (!period.startTime || !period.endTime) continue;
      const [startH, startM] = period.startTime.split(':').map(Number);
      const [endH, endM] = period.endTime.split(':').map(Number);

      const pStart = new Date(`${selectedDate}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00Z`).getTime();
      const pEnd = new Date(`${selectedDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00Z`).getTime();

      let cur = pStart;
      while (cur + durationMs <= pEnd) {
        const slotStart = cur;
        const slotEnd = cur + durationMs;
        cur = slotEnd + bufferMs;

        const startIso = new Date(slotStart).toISOString();
        const endIso = new Date(slotEnd).toISOString();

        const sD = new Date(slotStart);
        const eD = new Date(slotEnd);
        const startTimeHHMM = `${String(sD.getUTCHours()).padStart(2, '0')}:${String(sD.getUTCMinutes()).padStart(2, '0')}`;
        const endTimeHHMM = `${String(eD.getUTCHours()).padStart(2, '0')}:${String(eD.getUTCMinutes()).padStart(2, '0')}`;

        // Match with appointment
        const matchedApt = selectedDateAppointments.find((apt) => {
          if (!apt.startTime) return false;
          const aStart = apt.startTime.includes('T')
            ? new Date(apt.startTime).getTime()
            : new Date(`${selectedDate}T${apt.startTime}:00Z`).getTime();
          const aEnd = apt.endTime.includes('T')
            ? new Date(apt.endTime).getTime()
            : new Date(`${selectedDate}T${apt.endTime}:00Z`).getTime();
          return slotStart < aEnd && slotEnd > aStart;
        });

        // Match with partial block
        const matchedBlock = partialBlocks.find((b) => {
          if (!b.startTime || !b.endTime) return false;
          const [bStartH, bStartM] = b.startTime.split(':').map(Number);
          const [bEndH, bEndM] = b.endTime.split(':').map(Number);
          const bStartMs = new Date(`${selectedDate}T${String(bStartH).padStart(2, '0')}:${String(bStartM).padStart(2, '0')}:00Z`).getTime();
          const bEndMs = new Date(`${selectedDate}T${String(bEndH).padStart(2, '0')}:${String(bEndM).padStart(2, '0')}:00Z`).getTime();
          return slotStart < bEndMs && slotEnd > bStartMs;
        });

        let status = 'available';
        let blockId = null;

        if (onLeave) {
          status = 'leave';
        } else if (fullDayBlock) {
          status = 'full_day_blocked';
          blockId = fullDayBlock.id;
        } else if (matchedApt) {
          status = 'booked';
        } else if (matchedBlock) {
          status = 'blocked';
          blockId = matchedBlock.id;
        }

        computed.push({
          slotStart,
          slotEnd,
          startIso,
          endIso,
          startTimeHHMM,
          endTimeHHMM,
          mode: period.mode || 'both',
          status,
          appointment: matchedApt || null,
          blockId,
        });
      }
    }

    return computed;
  }, [availability, selectedDate, selectedDateAppointments]);

  const handleEnableDayWorkingHours = async () => {
    const dateObj = new Date(`${selectedDate}T00:00:00Z`);
    const dayName = DAY_NAMES[dateObj.getUTCDay()];
    try {
      setActionLoading(true);
      const curWeekly = availability?.weeklySchedule || {};
      const updatedWeekly = {
        ...curWeekly,
        [dayName]: [{ startTime: '09:00', endTime: '17:00', mode: 'both' }],
      };
      await availabilityService.updateOwnAvailability({ weeklySchedule: updatedWeekly });
      await fetchAvailability();
    } catch (err) {
      alert(`Failed to update hours: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const slotStats = useMemo(() => {
    const total = slotsForSelectedDate.length;
    const available = slotsForSelectedDate.filter((s) => s.status === 'available').length;
    const booked = slotsForSelectedDate.filter((s) => s.status === 'booked').length;
    const blocked = slotsForSelectedDate.filter((s) => s.status === 'blocked' || s.status === 'full_day_blocked').length;
    return { total, available, booked, blocked };
  }, [slotsForSelectedDate]);

  const filteredSlots = useMemo(() => {
    if (slotFilter === 'available') return slotsForSelectedDate.filter((s) => s.status === 'available');
    if (slotFilter === 'booked') return slotsForSelectedDate.filter((s) => s.status === 'booked');
    if (slotFilter === 'blocked') return slotsForSelectedDate.filter((s) => s.status === 'blocked' || s.status === 'full_day_blocked');
    return slotsForSelectedDate;
  }, [slotsForSelectedDate, slotFilter]);

  // Handle Accept
  const handleAccept = async (appointmentId) => {
    try {
      setActionLoading(true);
      await appointmentService.acceptAppointment(appointmentId);
      await fetchAppointments();
    } catch (err) {
      alert(`Acceptance error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason.trim()) {
      alert('Please provide a reason for declining.');
      return;
    }
    try {
      setActionLoading(true);
      await appointmentService.rejectAppointment(rejectModal.appointmentId, rejectModal.reason);
      setRejectModal({ open: false, appointmentId: null, reason: '' });
      await fetchAppointments();
    } catch (err) {
      alert(`Error rejecting appointment: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Propose Alternative
  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    if (!proposeModal.date || !proposeModal.startTime || !proposeModal.endTime) {
      alert('Please provide a date, start time, and end time.');
      return;
    }
    try {
      setActionLoading(true);
      await appointmentService.proposeAlternativeSlot(proposeModal.appointmentId, {
        date: proposeModal.date,
        startTime: proposeModal.startTime,
        endTime: proposeModal.endTime,
        reason: proposeModal.reason || undefined,
      });
      setProposeModal({
        open: false,
        appointmentId: null,
        date: '',
        startTime: '10:00',
        endTime: '10:50',
        reason: '',
      });
      await fetchAppointments();
    } catch (err) {
      alert(`Error proposing slot: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModal.reason.trim()) {
      alert('Please state a reason for cancellation.');
      return;
    }
    try {
      setActionLoading(true);
      await appointmentService.cancelAppointment(cancelModal.appointmentId, cancelModal.reason);
      setCancelModal({ open: false, appointmentId: null, reason: '' });
      await fetchAppointments();
    } catch (err) {
      alert(`Error cancelling appointment: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Date navigation helpers
  const handlePrevDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" size="sm">Clinician Schedule</Badge>
            {calendarConnected ? (
              <Badge variant="teal" size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> Google Calendar Synced
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm" className="flex items-center gap-1 text-slate-400">
                Google Calendar Disconnected
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Appointments & Practice Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage your daily consultations, incoming booking requests, and telehealth sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/psychologist/availability">
            <Button variant="secondary" size="sm">
              Availability Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Incoming Booking Requests Alert Banner */}
      {pendingRequests.length > 0 && (
        <div className="p-5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  {pendingRequests.length} Pending Booking {pendingRequests.length === 1 ? 'Request' : 'Requests'}
                </h3>
                <p className="text-xs text-slate-400">
                  Review and confirm or propose alternative consultation slots.
                </p>
              </div>
            </div>
            <Badge variant="amber" size="sm">{pendingRequests.length} Action Needed</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="bg-slate-900 border-amber-500/20 shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar name={req.patientName || 'Patient'} size="md" />
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          {req.patientName || 'Confidential Patient'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {req.mode === 'in_person' ? 'Clinic In-Person' : 'Telehealth Video'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="amber" size="sm">Pending</Badge>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-800/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{req.date} ({req.startTime} - {req.endTime})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>{req.durationMinutes || 50} mins consultation</span>
                    </div>
                  </div>

                  {req.patientNotes && (
                    <div className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                      "{req.patientNotes}"
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs py-1.5"
                      onClick={() => handleAccept(req.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs py-1.5 px-2.5"
                      onClick={() =>
                        setProposeModal({
                          open: true,
                          appointmentId: req.id,
                          date: req.date,
                          startTime: req.startTime,
                          endTime: req.endTime,
                          reason: '',
                        })
                      }
                      disabled={actionLoading}
                    >
                      Propose Slot
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs p-1.5"
                      onClick={() => setRejectModal({ open: true, appointmentId: req.id, reason: '' })}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Date Selector & Day Navigation */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" />
                  Select Schedule Date
                </h3>
                <Button variant="ghost" size="sm" onClick={handleToday} className="text-xs text-emerald-400">
                  Today
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <button
                  onClick={handlePrevDay}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none text-center cursor-pointer"
                />
                <button
                  onClick={handleNextDay}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
                  title="Next Day"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* View filter */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setViewMode('day')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                    viewMode === 'day'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Selected Day ({selectedDateAppointments.length})
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                    viewMode === 'all'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Active ({appointments.filter((a) => a.status === 'confirmed').length})
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Practice Summary Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Consultation Integrity
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Confirmed sessions automatically generate a confidential 6-digit Session Verification PIN. Give this PIN to your patient at the start of consultation to unlock Phase 4 ambient AI documentation.
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Google Meet Integration:</span>
                  <span className="text-slate-200 font-medium">Automatic</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Buffer Time:</span>
                  <span className="text-slate-200 font-medium">10 mins reserved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Practice Slots Management & Consultations Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Practice Slots & Live Availability */}
          {viewMode === 'day' && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Practice Availability & Slots
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-300 font-medium">
                        {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString([], {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-400" />
                      Consultation Slots
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleFullDayBlock}
                      disabled={actionLoading}
                      className="text-xs text-slate-300 hover:text-slate-100 border border-slate-800"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1 text-rose-400" />
                      {(availability?.blockedDates || []).some((b) => b.date === selectedDate && b.isFullDay)
                        ? 'Unblock Entire Day'
                        : 'Block Entire Day'}
                    </Button>
                    <Link to="/psychologist/availability">
                      <Button variant="secondary" size="sm" className="text-xs">
                        <Sliders className="w-3.5 h-3.5 mr-1 text-teal-400" />
                        Weekly Hours
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Stat pills and filter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="teal" size="sm">
                      {slotStats.available} Available
                    </Badge>
                    <Badge variant="green" size="sm">
                      {slotStats.booked} Booked
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {slotStats.blocked} Blocked
                    </Badge>
                    <span className="text-slate-500 text-[11px]">
                      ({slotStats.total} total slots, {availability?.sessionDurationMinutes || 50}m each)
                    </span>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    {['all', 'available', 'booked', 'blocked'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setSlotFilter(tab)}
                        className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                          slotFilter === tab
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slots rendering */}
                {availabilityLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Calculating practice slots...
                  </div>
                ) : slotsForSelectedDate.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/50 space-y-3">
                    <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">No Working Slots Configured For This Day</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Your weekly schedule does not currently have active consultation hours set for this weekday.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnableDayWorkingHours}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      Enable Standard Hours (09:00 - 17:00)
                    </Button>
                  </div>
                ) : filteredSlots.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No slots matching the "{slotFilter}" filter on this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {filteredSlots.map((slot, idx) => {
                      const isAvailable = slot.status === 'available';
                      const isBooked = slot.status === 'booked';
                      const isBlocked = slot.status === 'blocked' || slot.status === 'full_day_blocked';
                      const isLeave = slot.status === 'leave';

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isBooked
                              ? 'bg-slate-950/80 border-teal-500/30'
                              : isBlocked
                              ? 'bg-slate-950/50 border-rose-500/20 opacity-80'
                              : isLeave
                              ? 'bg-slate-950/50 border-amber-500/20 opacity-80'
                              : 'bg-slate-950/90 border-slate-800 hover:border-emerald-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="text-sm font-bold text-slate-100 font-mono">
                                {slot.startTimeHHMM} - {slot.endTimeHHMM}
                              </div>
                              <div className="text-[11px] text-slate-400 capitalize">
                                {slot.mode === 'in_person' ? 'Clinic In-Person' : slot.mode === 'online' ? 'Telehealth Video' : 'In-Person & Online'}
                              </div>
                            </div>

                            <div>
                              {isAvailable && <Badge variant="green" size="sm">Open</Badge>}
                              {isBooked && <Badge variant="teal" size="sm">Booked</Badge>}
                              {isBlocked && <Badge variant="rose" size="sm">Blocked</Badge>}
                              {isLeave && <Badge variant="amber" size="sm">On Leave</Badge>}
                            </div>
                          </div>

                          {/* Detail / Action Row */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            {isBooked && (
                              <div className="text-xs text-slate-300 truncate">
                                Patient: <span className="font-semibold text-teal-300">{slot.appointment?.patientName || 'Confidential'}</span>
                              </div>
                            )}

                            {isBlocked && (
                              <div className="text-[11px] text-rose-300/80 italic truncate">
                                Blocked by clinician
                              </div>
                            )}

                            {isAvailable && (
                              <div className="text-[11px] text-emerald-400 font-medium">
                                Ready for booking
                              </div>
                            )}

                            {isLeave && (
                              <div className="text-[11px] text-amber-300/80 italic">
                                Practice Leave
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              {isAvailable && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleBlockSlot(slot)}
                                    disabled={actionLoading}
                                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 transition"
                                    title="Block this slot from online bookings"
                                  >
                                    Block
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setWalkInModal({
                                        open: true,
                                        slot,
                                        patientName: '',
                                        sessionMode: slot.mode === 'online' ? 'online' : 'in_person',
                                        reason: '',
                                      })
                                    }
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1"
                                    title="Book a direct walk-in client"
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    Walk-In
                                  </button>
                                </>
                              )}

                              {isBlocked && slot.blockId && (
                                <button
                                  type="button"
                                  onClick={() => handleUnblockSlot(slot.blockId)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border border-slate-800 transition flex items-center gap-1"
                                  title="Unblock slot and allow patients to book"
                                >
                                  <Unlock className="w-3 h-3 text-emerald-400" />
                                  Unblock
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 2: Detailed Consultations & Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-2">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-emerald-400" />
                {viewMode === 'day' ? `Confirmed Appointments for ${selectedDate}` : 'All Confirmed Appointments'}
              </h2>
              <Badge variant="neutral" size="sm">
                {viewMode === 'day' ? `${selectedDateAppointments.length} Scheduled` : `${appointments.length} Total`}
              </Badge>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
                Loading practice calendar...
              </div>
            ) : viewMode === 'day' && selectedDateAppointments.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6 text-center text-xs text-slate-400">
                  No confirmed clinical appointments scheduled for this date. Open slots above are available for patient booking.
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-4">
              {(viewMode === 'day'
                ? selectedDateAppointments
                : appointments.filter((a) => a.status === 'confirmed')
              ).map((apt) => (
                <Card
                  key={apt.id}
                  className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all shadow-md"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={apt.patientName || 'Patient'} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100">{apt.patientName || 'Confidential Patient'}</span>
                            <Badge
                              variant={
                                apt.status === 'confirmed'
                                  ? 'green'
                                  : apt.status === 'pending'
                                  ? 'amber'
                                  : apt.status === 'rescheduled'
                                  ? 'teal'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="capitalize">{apt.mode === 'in_person' ? 'Clinic In-Person' : 'Telehealth Video'}</span>
                            <span>•</span>
                            <span>{apt.durationMinutes || 50} mins</span>
                          </div>
                        </div>
                      </div>

                      {/* Time badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-right sm:self-auto self-start">
                        <div className="text-xs text-emerald-400 font-semibold">{apt.date}</div>
                        <div className="text-xs text-slate-300 font-mono">{apt.startTime} - {apt.endTime}</div>
                      </div>
                    </div>

                    {/* Mode specific details & Meeting link */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5 font-medium">Session Verification PIN:</span>
                        <span className="font-mono text-emerald-400 text-sm font-bold tracking-wider">
                          {apt.sessionPin || '123456'}
                        </span>
                      </div>

                      <div>
                        {apt.mode === 'online' ? (
                          apt.googleMeetLink ? (
                            <a
                              href={apt.googleMeetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-medium mt-1"
                            >
                              <Video className="w-4 h-4" />
                              Launch Google Meet
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 italic mt-1 block">
                              Telehealth link generated upon acceptance
                            </span>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-300 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Clinic Practice Room</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <div className="text-slate-500">
                        Appointment ID: <span className="font-mono">{apt.id?.slice(0, 8)}...</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.status === 'confirmed' && (
                          <>
                            <Link to={`/psychologist/sessions/appointment/${apt.id}`}>
                              <Button
                                variant="primary"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                Open Session Workspace
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs"
                              onClick={() => setCancelModal({ open: true, appointmentId: apt.id, reason: '' })}
                              disabled={actionLoading}
                            >
                              Cancel Session
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                Decline Consultation
              </h3>
              <button
                onClick={() => setRejectModal({ open: false, appointmentId: null, reason: '' })}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please communicate the reason to the patient. This will notify them immediately so they can select another slot or specialist.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                rows={3}
                required
                placeholder="Reason for declining (e.g., schedule conflict, clinical scope)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                  disabled={actionLoading}
                >
                  Confirm Decline
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Alternative Slot Modal */}
      {proposeModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-400" />
                Propose Alternative Slot
              </h3>
              <button
                onClick={() =>
                  setProposeModal({
                    open: false,
                    appointmentId: null,
                    date: '',
                    startTime: '10:00',
                    endTime: '10:50',
                    reason: '',
                  })
                }
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Offer a different consultation time to the patient. They can accept or decline this proposal in their portal.
            </p>
            <form onSubmit={handleProposeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={proposeModal.date}
                  onChange={(e) => setProposeModal({ ...proposeModal, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={proposeModal.startTime}
                    onChange={(e) => setProposeModal({ ...proposeModal, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={proposeModal.endTime}
                    onChange={(e) => setProposeModal({ ...proposeModal, endTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Note to Patient</label>
                <input
                  type="text"
                  placeholder="e.g., I have an earlier slot opening available..."
                  value={proposeModal.reason}
                  onChange={(e) => setProposeModal({ ...proposeModal, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setProposeModal({
                      open: false,
                      appointmentId: null,
                      date: '',
                      startTime: '10:00',
                      endTime: '10:50',
                      reason: '',
                    })
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  disabled={actionLoading}
                >
                  Send Proposal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Cancel Consultation
              </h3>
              <button
                onClick={() => setCancelModal({ open: false, appointmentId: null, reason: '' })}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cancelling a confirmed appointment will notify the patient and release the reserved calendar interval.
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                rows={3}
                required
                placeholder="Reason for cancellation (e.g., unexpected illness, emergency)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelModal({ open: false, appointmentId: null, reason: '' })}
                >
                  Keep Appointment
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-500 text-white"
                  disabled={actionLoading}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Walk-In / Direct Reservation Modal */}
      {walkInModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Reserve Consultation Slot
              </h3>
              <button
                onClick={() =>
                  setWalkInModal({
                    open: false,
                    slot: null,
                    patientName: '',
                    sessionMode: 'in_person',
                    reason: '',
                  })
                }
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Directly book or hold this slot for a walk-in patient or private booking.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">Time Interval:</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {selectedDate} ({walkInModal.slot?.startTimeHHMM} - {walkInModal.slot?.endTimeHHMM})
              </span>
            </div>
            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe / Walk-in Client"
                  value={walkInModal.patientName}
                  onChange={(e) => setWalkInModal({ ...walkInModal, patientName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Consultation Mode</label>
                <select
                  value={walkInModal.sessionMode}
                  onChange={(e) => setWalkInModal({ ...walkInModal, sessionMode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="in_person">In-Person Consultation (Clinic)</option>
                  <option value="online">Online Video (Google Meet)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Clinical Note / Reason</label>
                <input
                  type="text"
                  placeholder="e.g., Walk-in assessment or urgent consultation"
                  value={walkInModal.reason}
                  onChange={(e) => setWalkInModal({ ...walkInModal, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setWalkInModal({
                      open: false,
                      slot: null,
                      patientName: '',
                      sessionMode: 'in_person',
                      reason: '',
                    })
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  disabled={actionLoading}
                >
                  Confirm Reservation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
