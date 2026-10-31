import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { useAuth } from '../../context/AuthContext';
import { practiceService } from '../../services/practiceService';
import { googleCalendarService } from '../../services/googleCalendarService';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Video,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Info,
  Check,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Professional Credentials' },
  { id: 2, title: 'Practice Arrangement' },
  { id: 3, title: 'Practice Details' },
  { id: 4, title: 'Clinic Affiliation' },
  { id: 5, title: 'Calendar Integration' },
  { id: 6, title: 'Review & Activation' },
];

export function PracticeSetupPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Practice state
  const [workspace, setWorkspace] = useState(null);
  const [practiceArrangement, setPracticeArrangement] = useState('independent');
  const [practiceName, setPracticeName] = useState('');
  const [professionalBio, setProfessionalBio] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [offeredModes, setOfferedModes] = useState('both');
  const [defaultMode, setDefaultMode] = useState('in_person');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [locations, setLocations] = useState([]);

  // New location draft
  const [newLocName, setNewLocName] = useState('');
  const [newLocLine1, setNewLocLine1] = useState('');
  const [newLocCity, setNewLocCity] = useState('');
  const [newLocState, setNewLocState] = useState('');
  const [newLocPostal, setNewLocPostal] = useState('');

  // Clinics & Calendar
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [affiliationNote, setAffiliationNote] = useState('');
  const [calendarStatus, setCalendarStatus] = useState({ connected: false });
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [wsRes, clinRes, calRes] = await Promise.all([
          practiceService.getWorkspace(),
          practiceService.getClinics().catch(() => ({ data: { clinics: [] } })),
          googleCalendarService.getConnectionStatus().catch(() => ({ data: { connected: false } })),
        ]);

        const ws = wsRes.data;
        setWorkspace(ws);
        setPracticeArrangement(ws.practiceArrangement || 'independent');

        const indep = ws.independentPractice || {};
        setPracticeName(indep.practiceName || (user?.fullName ? `${user.fullName} Private Practice` : 'My Practice'));
        setProfessionalBio(indep.professionalBio || user?.profile?.bio || '');
        setContactEmail(indep.contactEmail || user?.email || '');
        setContactPhone(indep.contactPhone || user?.profile?.phone || '');
        setTimezone(indep.timezone || user?.profile?.timezone || 'Asia/Kolkata');
        setOfferedModes(indep.offeredModes || 'both');
        setDefaultMode(indep.defaultMode || 'in_person');
        setDurationMinutes(indep.appointmentDurationMinutes || 50);
        setBufferMinutes(indep.bufferTimeMinutes !== undefined ? indep.bufferTimeMinutes : 10);
        setLocations(indep.locations || []);

        setClinics(clinRes.data?.clinics || []);
        setCalendarStatus(calRes.data || { connected: false });
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load practice configuration.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleAddLocation = async () => {
    if (!newLocLine1.trim() || !newLocCity.trim()) {
      setErrorMsg('Please provide at least a street address and city.');
      return;
    }
    setErrorMsg(null);
    try {
      const res = await practiceService.addLocation({
        name: newLocName.trim() || 'Consultation Office',
        address: {
          line1: newLocLine1.trim(),
          city: newLocCity.trim(),
          state: newLocState.trim(),
          postalCode: newLocPostal.trim(),
        },
        isDefault: locations.length === 0,
      });
      setLocations([...locations, res.data.location]);
      setNewLocName('');
      setNewLocLine1('');
      setNewLocCity('');
      setNewLocState('');
      setNewLocPostal('');
      setSuccessMsg('Office location added.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add location.');
    }
  };

  const handleDeleteLocation = async (locId) => {
    try {
      await practiceService.deleteLocation(locId);
      setLocations(locations.filter((l) => l.id !== locId));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to remove location.');
    }
  };

  const handleConnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      const res = await googleCalendarService.getAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate Google Calendar authorization.');
      setCalendarLoading(false);
    }
  };

  const handleRequestAffiliation = async () => {
    if (!selectedClinicId) {
      setErrorMsg('Please select a registered clinic.');
      return;
    }
    try {
      await practiceService.requestAffiliation(selectedClinicId, affiliationNote);
      setSuccessMsg('Membership request submitted to clinic coordinator.');
      const wsRes = await practiceService.getWorkspace();
      setWorkspace(wsRes.data);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit clinic affiliation request.');
    }
  };

  const handleSaveAndActivate = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await practiceService.updateSettings({
        practiceName,
        professionalBio,
        contactEmail,
        contactPhone,
        timezone,
        offeredModes,
        defaultMode,
        practiceArrangement,
        appointmentDurationMinutes: durationMinutes,
        bufferTimeMinutes: bufferMinutes,
        setupCompleted: true,
      });

      await refreshProfile();
      setSuccessMsg('Practice setup successfully activated!');
      setTimeout(() => {
        navigate('/psychologist/dashboard');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to activate practice setup.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 min-h-[50vh]">
        <LoadingSpinner size="lg" className="text-teal-400 mb-3" />
        <p className="text-sm text-slate-400">Loading your practice workspace...</p>
      </div>
    );
  }

  const psych = user?.profile || {};
  const isApproved = workspace?.isApproved;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Clinician Practice Workspace</Badge>
            <Badge variant={isApproved ? 'green' : 'amber'} size="sm">
              {isApproved ? 'Verified Practitioner' : 'Verification Review'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-teal-400" />
            Practice Setup & Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure your independent practice branding, consultation modes, office locations, and calendar sync.
          </p>
        </div>

        <Link to="/psychologist/dashboard">
          <Button variant="ghost" size="sm" className="text-xs">
            Skip to Dashboard
          </Button>
        </Link>
      </div>

      {errorMsg && <AlertBanner type="error" title="Notice" message={errorMsg} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Stepper Indicator */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 border-b border-slate-800/80">
        {STEPS.map((s) => {
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : isDone
                  ? 'text-emerald-400 hover:bg-slate-800/60'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive
                    ? 'bg-teal-400 text-slate-950'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : s.id}
              </span>
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step 1: Professional Information */}
      {currentStep === 1 && (
        <Card className="border-slate-800 bg-slate-900 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <InitialsAvatar name={user?.fullName || 'Clinician'} size="lg" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{user?.fullName || 'Clinician'}</h3>
                  <Badge variant="teal" size="sm">License: {psych.licenseNumber || 'Active'}</Badge>
                </div>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <p className="text-xs text-teal-300 font-medium">
                  {(psych.specializations || ['Clinical Psychology']).join(' • ')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/30 text-xs text-teal-200/90 leading-relaxed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-teal-300 block mb-0.5">Verified Professional Identity</span>
                Your professional qualifications and board license are established in accordance with healthcare compliance guidelines. Only verified clinicians can activate public booking and clinical chart records.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Qualifications</span>
                <span className="text-slate-200 font-medium">
                  {(psych.qualifications || ['M.Phil Clinical Psychology', 'Licensed Clinical Psychologist']).join(', ')}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Languages Spoken</span>
                <span className="text-slate-200 font-medium">
                  {(psych.languages || ['English']).join(', ')}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button variant="primary" size="md" onClick={() => setCurrentStep(2)} className="flex items-center gap-2">
                Continue to Practice Arrangement
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Practice Arrangement Selection */}
      {currentStep === 2 && (
        <Card className="border-slate-800 bg-slate-900 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Select Practice Arrangement</h3>
              <p className="text-xs text-slate-400 mt-1">
                Psyco AI supports independent practitioners, clinic-affiliated clinicians, and hybrid practices.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Option A: Independent */}
              <button
                type="button"
                onClick={() => setPracticeArrangement('independent')}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  practiceArrangement === 'independent'
                    ? 'bg-teal-950/30 border-teal-500 text-teal-200 ring-1 ring-teal-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 font-bold text-slate-100 text-sm">
                    <User className="w-5 h-5 text-teal-400" />
                    Independent Private Practice (Recommended)
                  </div>
                  {practiceArrangement === 'independent' && <CheckCircle2 className="w-5 h-5 text-teal-400" />}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You operate completely independently. You manage your own availability, brand, patients, offline or online consultations, notes, and fees. A clinic ID is <strong className="text-teal-300">never required</strong>.
                </p>
              </button>

              {/* Option B: Clinic Affiliated */}
              <button
                type="button"
                onClick={() => setPracticeArrangement('clinic_affiliated')}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  practiceArrangement === 'clinic_affiliated'
                    ? 'bg-teal-950/30 border-teal-500 text-teal-200 ring-1 ring-teal-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 font-bold text-slate-100 text-sm">
                    <Building2 className="w-5 h-5 text-teal-400" />
                    Clinic-Affiliated Practice
                  </div>
                  {practiceArrangement === 'clinic_affiliated' && <CheckCircle2 className="w-5 h-5 text-teal-400" />}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You work under an authorized healthcare clinic or mental health center. You practice within clinic locations, clinic policies, and receive assigned patients.
                </p>
              </button>

              {/* Option C: Hybrid */}
              <button
                type="button"
                onClick={() => setPracticeArrangement('hybrid')}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  practiceArrangement === 'hybrid'
                    ? 'bg-teal-950/30 border-teal-500 text-teal-200 ring-1 ring-teal-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 font-bold text-slate-100 text-sm">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    Hybrid Practice (Independent + Clinic Affiliation)
                  </div>
                  {practiceArrangement === 'hybrid' && <CheckCircle2 className="w-5 h-5 text-teal-400" />}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You maintain your own private patients while also holding approved affiliations with clinics. You can toggle your active practice context at any time with total data isolation.
                </p>
              </button>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setCurrentStep(3)} className="flex items-center gap-2">
                Configure Practice Details
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Independent Practice Configuration */}
      {currentStep === 3 && (
        <Card className="border-slate-800 bg-slate-900 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Practice Details & Consultation Modes</h3>
              <p className="text-xs text-slate-400 mt-1">
                Define your practice identity, consultation modes, office locations, and scheduling rules.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Practice Name *
                </label>
                <input
                  type="text"
                  required
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder="e.g. Dr. Alex Mercer Psychological Practice"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Practice Description / Introduction
                </label>
                <textarea
                  rows={3}
                  value={professionalBio}
                  onChange={(e) => setProfessionalBio(e.target.value)}
                  placeholder="Describe your clinical practice approach, areas of expertise, and therapeutic philosophy..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              {/* Consultation Modes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Offered Consultation Modes
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setOfferedModes('in_person')}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                      offeredModes === 'in_person'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                    In-Person Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferedModes('online')}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                      offeredModes === 'online'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Video className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                    Online Video Only (Telehealth)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferedModes('both')}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                      offeredModes === 'both'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                    Both (In-Person & Online)
                  </button>
                </div>
              </div>

              {/* Duration & Buffer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Standard Consultation Duration (minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={50}>50 Minutes (Standard Clinical Hour)</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes (Assessment / Intake)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Buffer Time Between Sessions (minutes)
                  </label>
                  <select
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    <option value={0}>0 Minutes (Back-to-back)</option>
                    <option value={10}>10 Minutes (Standard Note Buffer)</option>
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Physical Office Locations (Optional for online-only) */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      Physical Consultation Locations
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {offeredModes === 'online'
                        ? 'Optional: You offer online consultations only, so an office address is not required.'
                        : 'Register one or more private office locations where patients attend in person.'}
                    </p>
                  </div>
                </div>

                {locations.length > 0 && (
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100">{loc.name}</span>
                            {loc.isDefault && <Badge variant="teal" size="sm">Primary Office</Badge>}
                          </div>
                          <p className="text-slate-400 mt-0.5">
                            {loc.address.line1}, {loc.address.city}, {loc.address.state} {loc.address.postalCode}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Office Form */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 space-y-3">
                  <h5 className="text-xs font-semibold text-slate-300">Add an Office Location</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Location Name (e.g. Downtown Office)"
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Street Address (Line 1)"
                      value={newLocLine1}
                      onChange={(e) => setNewLocLine1(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={newLocCity}
                      onChange={(e) => setNewLocCity(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="State"
                        value={newLocState}
                        onChange={(e) => setNewLocState(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={newLocPostal}
                        onChange={(e) => setNewLocPostal(e.target.value)}
                        className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddLocation}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Location
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(practiceArrangement === 'independent' ? 5 : 4)}
                className="flex items-center gap-2"
              >
                {practiceArrangement === 'independent' ? 'Proceed to Calendar Sync' : 'Clinic Affiliation'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Clinic Affiliation (if applicable) */}
      {currentStep === 4 && (
        <Card className="border-slate-800 bg-slate-900 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Clinic Affiliation Configuration</h3>
              <p className="text-xs text-slate-400 mt-1">
                Request or review authorized affiliations with registered clinical facilities.
              </p>
            </div>

            {/* Existing Affiliations */}
            {workspace?.affiliations?.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Your Clinic Affiliations</h4>
                {workspace.affiliations.map((aff) => (
                  <div
                    key={aff.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-100 block">{aff.clinicName}</span>
                      <span className="text-slate-500 font-mono text-[11px]">ID: {aff.clinicId}</span>
                    </div>
                    <StatusBadge status={aff.status} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                You do not currently have any active or pending clinic memberships.
              </div>
            )}

            {/* Request Membership */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-teal-300">Request Membership to a Registered Clinic</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clinic affiliations require affirmative approval by the clinic's authorized director before clinic appointments and facilities are granted.
              </p>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Clinic</label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="">-- Choose a registered clinic --</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Application Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Part-time telehealth psychologist application"
                  value={affiliationNote}
                  onChange={(e) => setAffiliationNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleRequestAffiliation}
                disabled={!selectedClinicId}
                className="text-xs"
              >
                Submit Affiliation Request
              </Button>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setCurrentStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setCurrentStep(5)} className="flex items-center gap-2">
                Continue to Calendar Integration
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Calendar Integration */}
      {currentStep === 5 && (
        <Card className="border-slate-800 bg-slate-900 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Google Calendar & Google Meet Integration</h3>
              <p className="text-xs text-slate-400 mt-1">
                Synchronize your practice appointments with Google Calendar and automatically generate Google Meet video links for confirmed sessions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-100">Google Calendar Integration</h4>
                    <Badge variant={calendarStatus.connected ? 'green' : 'neutral'} size="sm">
                      {calendarStatus.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {calendarStatus.connected
                      ? `Synchronized with ${calendarStatus.email || 'your Google account'}`
                      : 'Connect your personal Google account to automate video room links and conflict blocking.'}
                  </p>
                </div>
              </div>

              {calendarStatus.connected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await googleCalendarService.disconnect();
                    setCalendarStatus({ connected: false });
                  }}
                  className="text-xs text-red-400 hover:text-red-300 self-start sm:self-auto"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnectCalendar}
                  disabled={calendarLoading}
                  className="flex items-center gap-2 text-xs self-start sm:self-auto"
                >
                  {calendarLoading ? <LoadingSpinner size="sm" /> : <ExternalLink className="w-4 h-4" />}
                  Connect Google Calendar
                </Button>
              )}
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <span className="font-semibold text-slate-200 block">Privacy Guarantee Regarding Calendar Sync:</span>
              <p className="leading-relaxed text-slate-400">
                Psyco AI requests minimal calendar permissions strictly to insert confirmed consultation appointments and receive Google Meet video links. Personal events on your Google Calendar are never harvested, read, or permanently retained.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setCurrentStep(practiceArrangement === 'independent' ? 3 : 4)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setCurrentStep(6)} className="flex items-center gap-2">
                Review & Activate Practice
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Review & Practice Activation */}
      {currentStep === 6 && (
        <Card className="border-teal-500/40 bg-slate-900 shadow-2xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Review Practice Setup</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Confirm your practice configuration. You can modify these settings anytime from your practice settings.
              </p>
            </div>

            {/* Checklist */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Practice Brand</span>
                <span className="font-semibold text-slate-200">{practiceName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Arrangement</span>
                <span className="font-semibold text-teal-300 capitalize">{practiceArrangement.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Consultation Modes</span>
                <span className="font-semibold text-slate-200 capitalize">{offeredModes.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Practice Timezone</span>
                <span className="font-mono text-slate-200">{timezone}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Physical Offices</span>
                <span className="font-semibold text-slate-200">
                  {locations.length > 0 ? `${locations.length} Registered Office(s)` : 'None (Online Telehealth)'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Google Calendar</span>
                <span className="font-semibold text-slate-200">
                  {calendarStatus.connected ? 'Connected' : 'Optional / Manual'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-800">
              <Button variant="ghost" size="md" onClick={() => setCurrentStep(5)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous Step
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAndActivate}
                disabled={saving}
                className="flex items-center justify-center gap-2"
              >
                {saving ? <LoadingSpinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                Activate Practice & Open Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
