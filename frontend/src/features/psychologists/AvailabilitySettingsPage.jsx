import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { availabilityService } from '../../services/availabilityService';
import { googleCalendarService } from '../../services/googleCalendarService';
import {
  Calendar,
  Clock,
  Shield,
  Trash2,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Video,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function AvailabilitySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Settings state
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { enabled: true, startTime: '09:00', endTime: '17:00', mode: 'both' },
    tuesday: { enabled: true, startTime: '09:00', endTime: '17:00', mode: 'both' },
    wednesday: { enabled: true, startTime: '09:00', endTime: '17:00', mode: 'both' },
    thursday: { enabled: true, startTime: '09:00', endTime: '17:00', mode: 'both' },
    friday: { enabled: true, startTime: '09:00', endTime: '17:00', mode: 'both' },
    saturday: { enabled: false, startTime: '10:00', endTime: '14:00', mode: 'online' },
    sunday: { enabled: false, startTime: '10:00', endTime: '14:00', mode: 'online' },
  });

  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(50);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [minNoticeHours, setMinNoticeHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
  const [cancellationCutoffHours, setCancellationCutoffHours] = useState(24);

  // Blocked dates & leave lists
  const [blockedDates, setBlockedDates] = useState([]);
  const [leavePeriods, setLeavePeriods] = useState([]);

  // New block/leave form state
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newLeaveStart, setNewLeaveStart] = useState('');
  const [newLeaveEnd, setNewLeaveEnd] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');

  // Google Calendar Integration
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await availabilityService.getOwnAvailability();
      const data = res.data?.availability || {};

      if (data.weeklySchedule) setWeeklySchedule(data.weeklySchedule);
      if (data.sessionDurationMinutes) setSessionDurationMinutes(data.sessionDurationMinutes);
      if (data.bufferMinutes !== undefined) setBufferMinutes(data.bufferMinutes);
      if (data.minNoticeHours !== undefined) setMinNoticeHours(data.minNoticeHours);
      if (data.maxAdvanceDays !== undefined) setMaxAdvanceDays(data.maxAdvanceDays);
      if (data.cancellationCutoffHours !== undefined) setCancellationCutoffHours(data.cancellationCutoffHours);

      // Blocked dates and leaves from backend
      setBlockedDates(res.data?.blockedDates || []);
      setLeavePeriods(res.data?.leavePeriods || []);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setError(err.message || 'Failed to fetch availability settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarStatus = async () => {
    try {
      setCalendarLoading(true);
      const res = await googleCalendarService.getConnectionStatus();
      setCalendarConnected(res.data?.connected || false);
      setCalendarEmail(res.data?.googleEmail || null);
    } catch (err) {
      console.error('Failed to check calendar connection:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    fetchCalendarStatus();

    // Check query params for Google OAuth callback status
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected') === 'true') {
      setSuccessMessage('Google Calendar connected successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchCalendarStatus();
    } else if (params.get('calendar_error')) {
      setError(`Google Calendar connection failed: ${params.get('calendar_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Save General Schedule & Parameters
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await availabilityService.updateOwnAvailability({
        weeklySchedule,
        sessionDurationMinutes: Number(sessionDurationMinutes),
        bufferMinutes: Number(bufferMinutes),
        minNoticeHours: Number(minNoticeHours),
        maxAdvanceDays: Number(maxAdvanceDays),
        cancellationCutoffHours: Number(cancellationCutoffHours),
      });

      setSuccessMessage('Weekly availability and scheduling policies saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  // Add Blocked Date
  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    if (!newBlockDate) return;
    try {
      setSaving(true);
      await availabilityService.addBlockedDate({
        date: newBlockDate,
        reason: newBlockReason || 'Clinician Unavailable',
      });
      setNewBlockDate('');
      setNewBlockReason('');
      await fetchAvailability();
    } catch (err) {
      alert(`Error adding blocked date: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Remove Blocked Date
  const handleRemoveBlockedDate = async (blockId) => {
    try {
      setSaving(true);
      await availabilityService.removeBlockedDate(blockId);
      await fetchAvailability();
    } catch (err) {
      alert(`Error removing blocked date: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Add Leave Period
  const handleAddLeavePeriod = async (e) => {
    e.preventDefault();
    if (!newLeaveStart || !newLeaveEnd) return;
    if (newLeaveEnd < newLeaveStart) {
      alert('End date must be after or equal to start date.');
      return;
    }
    try {
      setSaving(true);
      await availabilityService.addLeavePeriod({
        startDate: newLeaveStart,
        endDate: newLeaveEnd,
        reason: newLeaveReason || 'Clinical Leave',
      });
      setNewLeaveStart('');
      setNewLeaveEnd('');
      setNewLeaveReason('');
      await fetchAvailability();
    } catch (err) {
      alert(`Error adding leave: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Remove Leave Period
  const handleRemoveLeavePeriod = async (leaveId) => {
    try {
      setSaving(true);
      await availabilityService.removeLeavePeriod(leaveId);
      await fetchAvailability();
    } catch (err) {
      alert(`Error removing leave: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Google Calendar Connect
  const handleConnectCalendar = async () => {
    try {
      setCalendarLoading(true);
      const res = await googleCalendarService.getAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert('Could not retrieve Google authorization URL.');
      }
    } catch (err) {
      alert(`Google Calendar error: ${err.message}`);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Google Calendar Disconnect
  const handleDisconnectCalendar = async () => {
    if (!confirm('Disconnect Google Calendar? Future appointments will not sync automatically.')) {
      return;
    }
    try {
      setCalendarLoading(true);
      await googleCalendarService.disconnect();
      setCalendarConnected(false);
      setCalendarEmail(null);
      setSuccessMessage('Google Calendar disconnected.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert(`Disconnect error: ${err.message}`);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Helper to update a day's schedule
  const updateDaySchedule = (dayKey, field, value) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="green" size="sm">Clinician Availability</Badge>
          <Badge variant="neutral" size="sm">Dynamic Slot Generation</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Availability & Calendar Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Define your working hours, session durations, buffer intervals, blocked vacation dates, and Google Calendar sync.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Google Calendar & Meet Sync Card */}
      <Card className="bg-slate-900 border-slate-800 shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-100">
                    Google Calendar & Google Meet Integration
                  </h3>
                  {calendarConnected ? (
                    <Badge variant="green" size="sm">Connected</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">Not Connected</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  When enabled, confirmed online consultations automatically create Google Meet conference links and sync to your primary Google Calendar without double-booking.
                </p>
                {calendarConnected && calendarEmail && (
                  <p className="text-xs text-emerald-400 font-mono mt-1">
                    Connected as: {calendarEmail}
                  </p>
                )}
              </div>
            </div>

            <div>
              {calendarConnected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs"
                  onClick={handleDisconnectCalendar}
                  disabled={calendarLoading}
                >
                  Disconnect Calendar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
                  onClick={handleConnectCalendar}
                  disabled={calendarLoading}
                >
                  <ExternalLink className="w-4 h-4" />
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSchedule} className="space-y-8">
        {/* Weekly Schedule Table */}
        <Card className="bg-slate-900 border-slate-800 shadow-md">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Weekly Operating Schedule
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure days when you accept patient consultations, daily hours, and allowed delivery modes.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map(({ key, label }) => {
                const day = weeklySchedule[key] || {
                  enabled: false,
                  startTime: '09:00',
                  endTime: '17:00',
                  mode: 'both',
                };
                return (
                  <div
                    key={key}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                      day.enabled
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-36">
                      <input
                        type="checkbox"
                        id={`check-${key}`}
                        checked={day.enabled}
                        onChange={(e) => updateDaySchedule(key, 'enabled', e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                      <label htmlFor={`check-${key}`} className="text-sm font-medium text-slate-200 cursor-pointer">
                        {label}
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">From</span>
                        <input
                          type="time"
                          value={day.startTime}
                          disabled={!day.enabled}
                          onChange={(e) => updateDaySchedule(key, 'startTime', e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                        />
                        <span className="text-xs text-slate-400">To</span>
                        <input
                          type="time"
                          value={day.endTime}
                          disabled={!day.enabled}
                          onChange={(e) => updateDaySchedule(key, 'endTime', e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Mode</span>
                        <select
                          value={day.mode}
                          disabled={!day.enabled}
                          onChange={(e) => updateDaySchedule(key, 'mode', e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                        >
                          <option value="both">Both (In-Person & Online)</option>
                          <option value="in_person">Clinic In-Person Only</option>
                          <option value="online">Telehealth Online Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Session & Booking Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Duration & Buffer */}
          <Card className="bg-slate-900 border-slate-800 shadow-md">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                Session Duration & Buffer
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Consultation Duration
                </label>
                <select
                  value={sessionDurationMinutes}
                  onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value={30}>30 Minutes (Check-in)</option>
                  <option value={45}>45 Minutes (Short Session)</option>
                  <option value={50}>50 Minutes (Standard Clinical Hour - Recommended)</option>
                  <option value={60}>60 Minutes (Full Hour)</option>
                  <option value={90}>90 Minutes (Extended / Assessment)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Buffer Between Sessions
                </label>
                <select
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value={0}>0 Minutes (No buffer)</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes (Recommended)</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes (Extended rest)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Prevents back-to-back overlaps; reserves clinician transition time between appointments.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Booking Windows & Cancellation Policies */}
          <Card className="bg-slate-900 border-slate-800 shadow-md">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                Booking Windows & Policy
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Minimum Advance Notice
                  </label>
                  <select
                    value={minNoticeHours}
                    onChange={(e) => setMinNoticeHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value={1}>1 hour</option>
                    <option value={2}>2 hours (Standard)</option>
                    <option value={4}>4 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Max Advance Window
                  </label>
                  <select
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days (Standard)</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cancellation Policy Cutoff
                </label>
                <select
                  value={cancellationCutoffHours}
                  onChange={(e) => setCancellationCutoffHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours (Standard policy)</option>
                  <option value={48}>48 hours</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Patients cancelling inside this cutoff receive a policy notice warning.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save button for schedule */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Availability & Policy Settings'}
          </Button>
        </div>
      </form>

      {/* Blocked Dates & Clinical Leave Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800">
        {/* Blocked Dates */}
        <Card className="bg-slate-900 border-slate-800 shadow-md">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Blocked Single Dates
            </h3>
            <p className="text-xs text-slate-400">
              Block individual days from the patient booking calendar.
            </p>

            {/* Add blocked date form */}
            <form onSubmit={handleAddBlockedDate} className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Reason (e.g., Personal)"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Block Date
              </Button>
            </form>

            {/* Blocked dates list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {blockedDates.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-3">No individual dates currently blocked.</p>
              ) : (
                blockedDates.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{block.date}</span>
                      <span className="text-slate-400 ml-2">({block.reason || 'Blocked'})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(block.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinical Leave / Vacation Periods */}
        <Card className="bg-slate-900 border-slate-800 shadow-md">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              Clinical Leave & Vacations
            </h3>
            <p className="text-xs text-slate-400">
              Block a multi-day vacation or conference interval.
            </p>

            {/* Add leave form */}
            <form onSubmit={handleAddLeavePeriod} className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaveStart}
                    onChange={(e) => setNewLeaveStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaveEnd}
                    onChange={(e) => setNewLeaveEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Reason (e.g., Annual Leave / Conference)"
                value={newLeaveReason}
                onChange={(e) => setNewLeaveReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              />
              <Button type="submit" variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Schedule Leave
              </Button>
            </form>

            {/* Leave list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {leavePeriods.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-3">No scheduled leave periods.</p>
              ) : (
                leavePeriods.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">
                        {leave.startDate} to {leave.endDate}
                      </span>
                      <span className="text-slate-400 ml-2">({leave.reason || 'Leave'})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLeavePeriod(leave.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
