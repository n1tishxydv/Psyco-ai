import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { clinicalService } from '../../services/clinicalService';
import { appointmentService } from '../../services/appointmentService';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Play,
  Square,
  Lock,
  Save,
  FileText,
  KeyRound,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  RefreshCw,
  Edit3,
  Mic,
  Upload,
  Sparkles,
} from 'lucide-react';
import { LiveTranscriptionWidget } from '../transcription/LiveTranscriptionWidget';
import { GoogleMeetImportWidget } from '../transcription/GoogleMeetImportWidget';
import { ManualImportModal } from '../transcription/ManualImportModal';
import AiCopilotPanel from '../ai/AiCopilotPanel';

export function SessionWorkspacePage() {
  const { appointmentId: routeAptId, sessionId: routeSessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // Workspace active tab: 'notes' | 'transcription' | 'ai_copilot'
  const initialTab = searchParams.get('tab') || 'notes';
  const initialTask = searchParams.get('task') || null;
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(initialTab);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [requestedAiTask, setRequestedAiTask] = useState(initialTask);

  // Note editor state
  const [noteFormat, setNoteFormat] = useState('SOAP');
  const [noteContent, setNoteContent] = useState({});
  const [sharedWithPatient, setSharedWithPatient] = useState(false);
  const [patientVisibleSummary, setPatientVisibleSummary] = useState('');
  const [noteStatus, setNoteStatus] = useState('draft');
  const [noteVersion, setNoteVersion] = useState(1);
  const [noteId, setNoteId] = useState(null);

  // Amendment modal state
  const [amendModal, setAmendModal] = useState(false);
  const [amendReason, setAmendReason] = useState('');

  const fetchSessionAndAppointment = async () => {
    try {
      setLoading(true);
      setError(null);
      let targetAptId = routeAptId;
      let sesData = null;

      if (!targetAptId && routeSessionId) {
        sesData = await clinicalService.getSession(routeSessionId);
        targetAptId = sesData.appointmentId;
      }

      if (!targetAptId) {
        throw new Error('Appointment ID could not be determined.');
      }

      // 1. Fetch appointment details
      const aptRes = await appointmentService.getAppointmentById(targetAptId);
      const aptData = aptRes.data?.appointment;
      setAppointment(aptData);

      // 2. Idempotently get or create session
      if (!sesData) {
        const sesRes = await clinicalService.createOrGetSession(targetAptId);
        sesData = sesRes.data?.session || sesRes;
      }
      setSession(sesData);

      // 3. If session has note, load note
      if (sesData.noteId) {
        setNoteId(sesData.noteId);
        const chartRes = await clinicalService.getPatientChart(aptData.patientId);
        const existingNote = (chartRes.data?.chart?.notes || []).find((n) => n.id === sesData.noteId);
        if (existingNote) {
          setNoteFormat(existingNote.format || 'SOAP');
          setNoteContent(existingNote.content || {});
          setSharedWithPatient(Boolean(existingNote.sharedWithPatient));
          setPatientVisibleSummary(existingNote.patientVisibleSummary || '');
          setNoteStatus(existingNote.status || 'draft');
          setNoteVersion(existingNote.version || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError(err.message || 'Failed to initialize session workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeAptId || routeSessionId) {
      fetchSessionAndAppointment();
    }
  }, [routeAptId, routeSessionId]);

  // Handle Note Field Edit
  const handleContentChange = (field, value) => {
    setNoteContent((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveStatus('Unsaved edits');
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!session || !appointment) return;
    try {
      setActionLoading(true);
      const res = await clinicalService.saveNoteDraft({
        sessionId: session.id,
        patientId: appointment.patientId,
        format: noteFormat,
        content: noteContent,
        sharedWithPatient,
        patientVisibleSummary,
      });
      setNoteId(res.data?.note?.id);
      setNoteStatus(res.data?.note?.status);
      setSaveStatus(`Draft saved at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      alert(`Save draft error: ${err.message}`);
      setSaveStatus('Save failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Finalize Note
  const handleFinalizeNote = async () => {
    if (!noteId) {
      await handleSaveDraft();
    }
    const targetNoteId = noteId || `not_${session.id.replace(/^ses_/, '')}`;
    if (!confirm('Digitally sign and finalize this clinical note? This will lock the record from direct edits.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await clinicalService.finalizeNote(targetNoteId);
      setNoteStatus(res.data?.note?.status);
      setNoteVersion(res.data?.note?.version);
      setSaveStatus('Finalized & Signed');
      await fetchSessionAndAppointment();
    } catch (err) {
      alert(`Finalization error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Amend Note
  const handleAmendSubmit = async (e) => {
    e.preventDefault();
    if (!amendReason.trim()) {
      alert('Please specify the clinical reason for this amendment.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await clinicalService.amendNote(noteId, {
        reason: amendReason,
        amendedContent: noteContent,
        patientVisibleSummary,
      });
      setNoteStatus(res.data?.note?.status);
      setNoteVersion(res.data?.note?.version);
      setAmendModal(false);
      setAmendReason('');
      setSaveStatus(`Amended (v${res.data?.note?.version})`);
      await fetchSessionAndAppointment();
    } catch (err) {
      alert(`Amendment error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Start Session
  const handleStartSession = async () => {
    try {
      setActionLoading(true);
      const res = await clinicalService.startSession(session.id);
      setSession(res.data?.session);
    } catch (err) {
      alert(`Error starting session: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Session
  const handleCompleteSession = async () => {
    try {
      setActionLoading(true);
      const res = await clinicalService.completeSession(session.id);
      setSession(res.data?.session);
    } catch (err) {
      alert(`Error concluding session: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Finalize Session
  const handleFinalizeSession = async () => {
    try {
      setActionLoading(true);
      const res = await clinicalService.finalizeSession(session.id);
      setSession(res.data?.session);
    } catch (err) {
      alert(`Error locking session: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
        Initializing clinical session workspace...
      </div>
    );
  }

  if (error || !appointment || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
          <h3 className="text-lg font-bold">Session Access Failed</h3>
          <p className="text-xs text-rose-400">{error || 'Session could not be opened.'}</p>
          <Link to="/psychologist/appointments">
            <Button variant="secondary" size="sm">
              Return to Calendar
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Link to="/psychologist/appointments" className="hover:text-slate-200 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Appointments
          </Link>
          <span>/</span>
          <Link to={`/psychologist/patients/${appointment.patientId}`} className="hover:text-slate-200">
            {appointment.patientName} Chart
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium">Session Workspace</span>
        </div>

        {saveStatus && (
          <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {saveStatus}
          </span>
        )}
      </div>

      {/* Session Overview Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" size="sm">Clinical Workspace</Badge>
            <Badge
              variant={
                session.sessionStatus === 'finalized'
                  ? 'green'
                  : session.sessionStatus === 'in_progress'
                  ? 'amber'
                  : 'teal'
              }
              size="sm"
              className="capitalize"
            >
              Status: {session.sessionStatus?.replace('_', ' ')}
            </Badge>
            <Badge variant="neutral" size="sm" className="capitalize">
              {appointment.sessionMode || appointment.mode}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            {appointment.patientName} — Consultation Session
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 flex items-center gap-3">
            <span>Date: {appointment.date || appointment.startTime?.split('T')[0]}</span>
            <span>•</span>
            <span>Time: {appointment.startTime?.split('T')[1]?.slice(0, 5)} - {appointment.endTime?.split('T')[1]?.slice(0, 5)}</span>
            <span>•</span>
            <span>Duration: {session.durationMinutes} mins</span>
          </p>
        </div>

        {/* Lifecycle Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {session.sessionStatus === 'scheduled' && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              onClick={handleStartSession}
              disabled={actionLoading}
            >
              <Play className="w-4 h-4 fill-white" />
              Start Consultation
            </Button>
          )}

          {session.sessionStatus === 'in_progress' && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5"
              onClick={handleCompleteSession}
              disabled={actionLoading}
            >
              <Square className="w-4 h-4 fill-white" />
              Conclude Consultation
            </Button>
          )}

          {session.sessionStatus === 'documentation_review' && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              onClick={handleFinalizeSession}
              disabled={actionLoading}
            >
              <Lock className="w-4 h-4" />
              Finalize Session
            </Button>
          )}

          {/* Google Meet Launcher if online */}
          {(appointment.sessionMode === 'online' || appointment.mode === 'online') && appointment.googleMeetUrl && (
            <a
              href={appointment.googleMeetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
            >
              <Video className="w-4 h-4" />
              Launch Meet
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Grid: Left Column Verification PIN & Session Details, Right Column Note Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Verification & Patient Context */}
        <div className="space-y-6">
          {/* Session PIN Card */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  Session Verification PIN
                </span>
                <Badge variant="green" size="sm">Active</Badge>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="font-mono text-3xl font-extrabold text-emerald-400 tracking-widest">
                  {appointment.sessionPin || '123456'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Provide this PIN to the patient to confirm authenticated participant presence before starting consultation.
              </p>
            </CardContent>
          </Card>

          {/* Consultation Notes from Booking */}
          {appointment.patientNotes && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-5 space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">Patient Booking Note</h4>
                <p className="text-xs text-slate-300 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                  "{appointment.patientNotes}"
                </p>
              </CardContent>
            </Card>
          )}

          {/* Privacy & Clinical Guard */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5 space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Documentation Integrity
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Psyco AI manual documentation maintains strict revision versioning. Finalized records cannot be modified without appending a documented amendment rationale.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Note Editor Suite & Transcription Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workspace Mode Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeWorkspaceTab === 'notes'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Clinical Notes ({noteFormat})
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('transcription')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeWorkspaceTab === 'transcription'
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/50'
                }`}
              >
                <Mic className="w-4 h-4" />
                Transcription & Audio
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('ai_copilot')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  activeWorkspaceTab === 'ai_copilot'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                Gemini Copilot
              </button>
            </div>

            {activeWorkspaceTab === 'transcription' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManualModalOpen(true)}
                  className="border-navy-700 text-slate-300 hover:bg-navy-800 text-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Manual Text Import
                </Button>
                <Link to={`/psychologist/sessions/${session.sessionId || session.id}/transcript`}>
                  <Button variant="outline" size="sm" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 text-xs">
                    Review Studio
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {activeWorkspaceTab === 'transcription' ? (
            <div className="space-y-6">
              <LiveTranscriptionWidget
                session={session}
                appointment={appointment}
                onTranscriptCompleted={() => {
                  setSaveStatus('Transcript finalized. Ready for Gemini Copilot!');
                }}
                onNavigateToCopilot={(targetTask) => {
                  setRequestedAiTask(targetTask);
                  setActiveWorkspaceTab('ai_copilot');
                }}
              />
              <GoogleMeetImportWidget
                session={session}
                appointment={appointment}
                onTranscriptCompleted={() => {
                  setSaveStatus('Google Meet transcript imported.');
                }}
                onNavigateToCopilot={(targetTask) => {
                  setRequestedAiTask(targetTask);
                  setActiveWorkspaceTab('ai_copilot');
                }}
              />
            </div>
          ) : activeWorkspaceTab === 'ai_copilot' ? (
            <AiCopilotPanel
              sessionId={session.sessionId || session.id}
              appointment={appointment}
              autoTriggerTask={requestedAiTask}
              onDraftApproved={async () => {
                await fetchSessionAndAppointment();
                setActiveWorkspaceTab('notes');
              }}
            />
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 space-y-6">
                {/* Header & Format Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100">Clinical Documentation</h3>
                      <Badge
                        variant={noteStatus === 'finalized' ? 'green' : noteStatus === 'amended' ? 'amber' : 'neutral'}
                        size="sm"
                      >
                        {noteStatus === 'finalized' ? 'Signed & Locked' : noteStatus === 'amended' ? `Amended (v${noteVersion})` : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Select documentation framework template</p>
                  </div>
                </div>

                {/* Framework Selector (disabled if finalized) */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {['SOAP', 'DAP', 'BIRP', 'GENERAL'].map((fmt) => (
                    <button
                      key={fmt}
                      disabled={noteStatus === 'finalized'}
                      onClick={() => setNoteFormat(fmt)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        noteFormat === fmt
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Note Fields based on Format */}
              <div className="space-y-4">
                {noteFormat === 'SOAP' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        S — Subjective (Patient-reported experience, symptoms, mood)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.subjective || ''}
                        onChange={(e) => handleContentChange('subjective', e.target.value)}
                        placeholder="Patient reports anxiety triggered by work deadlines..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        O — Objective (Clinician observations, affect, speech, orientation)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.objective || ''}
                        onChange={(e) => handleContentChange('objective', e.target.value)}
                        placeholder="Alert and oriented x4. Flat affect initially, relaxed during mindfulness..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        A — Assessment (Clinical formulation, progress towards goals)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.assessment || ''}
                        onChange={(e) => handleContentChange('assessment', e.target.value)}
                        placeholder="Mild to moderate Generalized Anxiety Disorder (GAD). Demonstrates cognitive insight..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        P — Plan (Next steps, interventions, homework, next session)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.plan || ''}
                        onChange={(e) => handleContentChange('plan', e.target.value)}
                        placeholder="Continue weekly CBT. Assigned 10-minute thought record. Next session in 7 days..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                  </>
                )}

                {noteFormat === 'DAP' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        D — Data (Subjective report & objective clinical observations)
                      </label>
                      <textarea
                        rows={4}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.data || ''}
                        onChange={(e) => handleContentChange('data', e.target.value)}
                        placeholder="Patient discussed conflict with manager; speech rapid, thought process linear..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        A — Assessment (Interpretation, therapeutic response)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.assessment || ''}
                        onChange={(e) => handleContentChange('assessment', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        P — Plan (Target objectives & homework)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.plan || ''}
                        onChange={(e) => handleContentChange('plan', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                  </>
                )}

                {noteFormat === 'BIRP' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        B — Behavior (Presenting symptoms, demeanor, observations)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.behavior || ''}
                        onChange={(e) => handleContentChange('behavior', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        I — Intervention (Clinician techniques used during session)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.intervention || ''}
                        onChange={(e) => handleContentChange('intervention', e.target.value)}
                        placeholder="Cognitive restructuring, behavioral activation, grounding exercises..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        R — Response (Patient reaction to therapeutic interventions)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.response || ''}
                        onChange={(e) => handleContentChange('response', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        P — Plan (Follow-up & assigned activities)
                      </label>
                      <textarea
                        rows={3}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.plan || ''}
                        onChange={(e) => handleContentChange('plan', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                  </>
                )}

                {noteFormat === 'GENERAL' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">
                        Presenting Concerns & Clinical Notes
                      </label>
                      <textarea
                        rows={6}
                        disabled={noteStatus === 'finalized'}
                        value={noteContent.general || ''}
                        onChange={(e) => handleContentChange('general', e.target.value)}
                        placeholder="Comprehensive clinical session notes..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Patient-Visible Portal Summary (Isolated from private clinical interpretation) */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shared-check"
                      checked={sharedWithPatient}
                      onChange={(e) => setSharedWithPatient(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                    <label htmlFor="shared-check" className="text-xs font-semibold text-slate-200 cursor-pointer">
                      Share Summary with Patient Care Portal
                    </label>
                  </div>
                  <Badge variant="teal" size="sm">Confidentiality Guard</Badge>
                </div>
                <p className="text-[11px] text-slate-400">
                  Private clinician formulations (Subjective, Objective, Assessment) remain confidential. Only the therapeutic summary below will be rendered in the patient's portal when shared.
                </p>
                {sharedWithPatient && (
                  <textarea
                    rows={2}
                    value={patientVisibleSummary}
                    onChange={(e) => setPatientVisibleSummary(e.target.value)}
                    placeholder="Enter an encouraging, plain-language summary for the patient..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="text-[11px] text-slate-500">
                  Version: <span className="font-mono text-slate-300">v{noteVersion}</span>
                </div>

                <div className="flex items-center gap-2">
                  {noteStatus !== 'finalized' ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSaveDraft}
                        disabled={actionLoading}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Draft
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleFinalizeNote}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Sign & Finalize
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAmendModal(true)}
                      disabled={actionLoading}
                      className="text-xs flex items-center gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-950/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Amend Finalized Note
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Manual Text Import Modal */}
      {/* Manual Text Import Modal */}
      {session && (
        <ManualImportModal
          sessionId={session.sessionId || session.id}
          isOpen={manualModalOpen}
          onClose={() => setManualModalOpen(false)}
          onSuccess={() => {
            setSaveStatus('Transcript imported! Generating Treatment Plan & SOAP Notes with Gemini in 1-click...');
            setRequestedAiTask('GENERATE_BOTH');
            setActiveWorkspaceTab('ai_copilot');
          }}
        />
      )}

      {/* Amendment Reason Modal */}
      {amendModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              Amend Finalized Clinical Note
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Medical record compliance mandates documenting the clinical reason for amending a signed note. A new incremented version will be stored and the previous version will be preserved in version history.
            </p>
            <form onSubmit={handleAmendSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Amendment Clinical Rationale</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Patient clarified symptom duration during follow-up phone call..."
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setAmendModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
                  Commit Amendment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
