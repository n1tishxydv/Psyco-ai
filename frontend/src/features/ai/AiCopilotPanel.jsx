import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Shield,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Send,
  Lock,
  Eye,
  Check,
  ListTodo,
  CalendarCheck,
  ClipboardList,
  Zap,
  Languages,
} from 'lucide-react';
import { aiService } from '../../services/aiService.js';
import { Card, CardContent } from '../../components/cards/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';

const JOB_TYPE_META = {
  GENERATE_TREATMENT_PLAN_DRAFT: {
    label: 'Treatment Plan',
    icon: CalendarCheck,
    desc: 'Measurable goals, objectives, and intervention plan',
    color: 'indigo',
    featured: true,
  },
  GENERATE_SOAP: {
    label: 'SOAP Note',
    icon: FileText,
    desc: 'Structured Subjective, Objective, Assessment & Plan',
    color: 'emerald',
    featured: true,
  },
  GENERATE_DAP: {
    label: 'DAP Note',
    icon: ClipboardList,
    desc: 'Data, Assessment & Plan clinical documentation',
    color: 'teal',
  },
  GENERATE_BIRP: {
    label: 'BIRP Note',
    icon: Layers,
    desc: 'Behavior, Intervention, Response & Plan format',
    color: 'cyan',
  },
  GENERATE_SESSION_SUMMARY: {
    label: 'Session Summary',
    icon: Sparkles,
    desc: 'Comprehensive clinical themes and presenting concerns',
    color: 'purple',
  },
  GENERATE_HOMEWORK_SUGGESTIONS: {
    label: 'Homework Tasks',
    icon: ListTodo,
    desc: 'Evidence-aligned between-session exercises',
    color: 'amber',
  },
  GENERATE_FOLLOW_UP_SUGGESTIONS: {
    label: 'Care Continuity',
    icon: RefreshCw,
    desc: 'Recommended scheduling and referral follow-ups',
    color: 'blue',
  },
  CHECK_DOCUMENTATION_COMPLETENESS: {
    label: 'Quality Check',
    icon: Shield,
    desc: 'Documentation completeness & evidence review',
    color: 'violet',
  },
};

export default function AiCopilotPanel({ sessionId, appointment, onDraftApproved, autoTriggerTask }) {
  const [copilotStatus, setCopilotStatus] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [draftsList, setDraftsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Edit states for current draft
  const [editedContent, setEditedContent] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  // Approval options
  const [finalizeImmediately, setFinalizeImmediately] = useState(false);
  const [sharedWithPatient, setSharedWithPatient] = useState(false);
  const [patientVisibleSummary, setPatientVisibleSummary] = useState('');
  const [selectedTaskIndices, setSelectedTaskIndices] = useState([0]);

  // Polling ref map: jobId -> intervalId
  const pollTimersRef = useRef({});
  const triggeredTaskRef = useRef(null);

  // Fetch initial status & drafts
  useEffect(() => {
    fetchStatus();
    if (sessionId) {
      loadDrafts();
    }
    return () => {
      Object.values(pollTimersRef.current).forEach(clearInterval);
    };
  }, [sessionId]);

  const fetchStatus = async () => {
    try {
      const res = await aiService.getStatus();
      setCopilotStatus(res.copilot);
    } catch (err) {
      console.warn('Could not fetch AI status:', err.message);
    }
  };

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const res = await aiService.listDraftsForSession(sessionId);
      const drafts = res.drafts || [];
      setDraftsList(drafts);
      if (drafts.length > 0 && !activeDraft) {
        selectDraft(drafts[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectDraft = (draft) => {
    setActiveDraft(draft);
    setEditedContent(draft.content || {});
    setIsDirty(false);
    setError(null);
    setSuccessMsg(null);
  };

  // Auto-trigger requested job if provided (e.g. from completion banner)
  useEffect(() => {
    if (
      autoTriggerTask &&
      sessionId &&
      triggeredTaskRef.current !== autoTriggerTask &&
      !actionLoading
    ) {
      triggeredTaskRef.current = autoTriggerTask;
      if (autoTriggerTask === 'GENERATE_BOTH') {
        handleStartDualGeneration('GENERATE_SOAP');
      } else {
        handleStartGeneration(autoTriggerTask);
      }
    }
  }, [autoTriggerTask, sessionId]);

  // 1-Click Dual Generation: Treatment Plan + Clinical Notes
  const handleStartDualGeneration = async (noteFormat = 'GENERATE_SOAP') => {
    try {
      setError(null);
      setSuccessMsg(null);
      setActionLoading(true);

      const [resPlan, resNote] = await Promise.all([
        aiService.createJob({
          sessionId,
          jobType: 'GENERATE_TREATMENT_PLAN_DRAFT',
          idempotencyKey: `idemp_${sessionId}_plan_${Date.now()}`,
        }),
        aiService.createJob({
          sessionId,
          jobType: noteFormat,
          idempotencyKey: `idemp_${sessionId}_note_${Date.now()}`,
        }),
      ]);

      const newJobs = [
        { id: resPlan.jobId, status: resPlan.status || 'queued', jobType: 'GENERATE_TREATMENT_PLAN_DRAFT' },
        { id: resNote.jobId, status: resNote.status || 'queued', jobType: noteFormat },
      ];

      setActiveJobs(newJobs);
      setActiveJob(newJobs[0]);

      startJobPolling(resPlan.jobId);
      startJobPolling(resNote.jobId);
    } catch (err) {
      setError(err.message || 'Failed to initialize dual documentation generation.');
      setActionLoading(false);
    }
  };

  // Trigger New Single Generation Job
  const handleStartGeneration = async (jobType) => {
    try {
      setError(null);
      setSuccessMsg(null);
      setActionLoading(true);

      const res = await aiService.createJob({
        sessionId,
        jobType,
        idempotencyKey: `idemp_${sessionId}_${jobType}_${Date.now()}`,
      });

      const initialJob = {
        id: res.jobId,
        status: res.status || 'queued',
        jobType,
      };
      setActiveJob(initialJob);
      setActiveJobs((prev) => [initialJob, ...prev.filter((j) => j.id !== res.jobId)]);

      // Start polling for job completion
      startJobPolling(res.jobId);
    } catch (err) {
      setError(err.message || 'Failed to initialize AI drafting job.');
      setActionLoading(false);
    }
  };

  const startJobPolling = (jobId) => {
    if (pollTimersRef.current[jobId]) clearInterval(pollTimersRef.current[jobId]);
    let consecutiveErrors = 0;

    pollTimersRef.current[jobId] = setInterval(async () => {
      try {
        const res = await aiService.getJob(jobId);
        consecutiveErrors = 0;
        const job = res.job;

        setActiveJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: job.status, errorMessage: job.errorMessage } : j))
        );
        setActiveJob((prev) => (prev?.id === jobId ? job : prev));

        if (job.status === 'completed') {
          clearInterval(pollTimersRef.current[jobId]);
          delete pollTimersRef.current[jobId];

          const remainingActive = Object.keys(pollTimersRef.current).length;
          if (remainingActive === 0) {
            setActionLoading(false);
            setSuccessMsg(`Clinical documentation generated! Both drafts are ready for review.`);
          }

          // Load the generated draft
          if (job.draftId) {
            const draftRes = await aiService.getDraft(job.draftId);
            setActiveDraft(draftRes.draft);
            setEditedContent(draftRes.draft.content || {});
            setIsDirty(false);
          }
          await loadDrafts();
        } else if (job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(pollTimersRef.current[jobId]);
          delete pollTimersRef.current[jobId];
          const remainingActive = Object.keys(pollTimersRef.current).length;
          if (remainingActive === 0) {
            setActionLoading(false);
          }
          setError(job.errorMessage || `AI job failed with code: ${job.errorCode || 'PROCESSING_ERROR'}`);
        }
      } catch (err) {
        consecutiveErrors += 1;
        // If transient rate limit error (429) or temporary network hiccup, do not abort polling
        if (err.message?.includes('429') || err.message?.includes('Too many requests') || consecutiveErrors < 4) {
          console.warn(`Polling note (attempt ${consecutiveErrors}): ${err.message}. Retrying shortly...`);
          return;
        }
        clearInterval(pollTimersRef.current[jobId]);
        delete pollTimersRef.current[jobId];
        const remainingActive = Object.keys(pollTimersRef.current).length;
        if (remainingActive === 0) {
          setActionLoading(false);
        }
        setError(`Error checking job status: ${err.message}`);
      }
    }, 2500);
  };

  // Edit field in draft content
  const handleFieldChange = (field, value) => {
    setEditedContent((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  // Save Clinician Edits
  const handleSaveEdits = async () => {
    if (!activeDraft) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await aiService.updateDraft(activeDraft.id, {
        content: editedContent,
      });
      setActiveDraft(res.draft);
      setIsDirty(false);
      setSuccessMsg('Draft modifications saved successfully.');
      await loadDrafts();
    } catch (err) {
      setError(`Failed to save edits: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject / Discard Draft
  const handleRejectDraft = async () => {
    if (!activeDraft) return;
    const reason = prompt('Please specify a reason for rejecting this clinical draft:', 'Clinician decided to discard or regenerate.');
    if (!reason) return;

    try {
      setActionLoading(true);
      setError(null);
      const res = await aiService.rejectDraft(activeDraft.id, reason);
      setActiveDraft(res.draft);
      setSuccessMsg('Draft rejected and archived.');
      await loadDrafts();
    } catch (err) {
      setError(`Failed to reject draft: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Explicit Human Clinical Approval
  const handleApproveDraft = async () => {
    if (!activeDraft) return;

    const confirmPrompt =
      'Approve and commit this AI-assisted clinical document into authoritative patient records? You confirm that you have reviewed and validated all statements.';
    if (!confirm(confirmPrompt)) return;

    try {
      setActionLoading(true);
      setError(null);

      // If user had unsaved edits, save them first
      if (isDirty) {
        await aiService.updateDraft(activeDraft.id, { content: editedContent });
      }

      const res = await aiService.approveDraft(activeDraft.id, {
        finalizeImmediately,
        sharedWithPatient,
        patientVisibleSummary,
        selectedIndices: selectedTaskIndices,
      });

      setSuccessMsg('Clinical draft approved and committed to official records!');
      setActiveDraft((prev) => ({
        ...prev,
        approvalStatus: 'approved',
        isDraft: false,
        approvedAt: res.approvedAt,
      }));

      await loadDrafts();

      // Notify parent component to refresh session records
      if (onDraftApproved) {
        onDraftApproved(res);
      }
    } catch (err) {
      setError(`Approval error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Copilot Header Card */}
      <Card className="bg-slate-900 border-purple-500/30">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Clinical Documentation Copilot
                  <Badge variant={copilotStatus?.sandboxMode || copilotStatus?.status === 'SANDBOX_MOCK_ACTIVE' ? 'amber' : 'purple'} size="sm">
                    {copilotStatus?.sandboxMode || copilotStatus?.status === 'SANDBOX_MOCK_ACTIVE'
                      ? 'AI Sandbox: Mock Provider'
                      : (copilotStatus?.model || 'gemini-3.8-flash')}
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evidence-grounded drafting assistant. Psychologists retain complete clinical oversight and approval responsibility.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5" />
                Human-in-the-Loop Enforced
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                Text-Only RTDB Persistence
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 6.3 AI Sandbox Safeguard Notice */}
      {(copilotStatus?.sandboxMode || copilotStatus?.status === 'SANDBOX_MOCK_ACTIVE') && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 shadow-sm">
          <Shield className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-200">AI Sandbox Mode Active (Staging Pilot):</span> External Google Gemini API calls are disabled. All generated documentation drafts are synthetic mock outputs (<code className="text-amber-200 font-mono text-[11px]">isSynthetic: true</code>). Real patient records are not transmitted externally. Psychologist review and digital signature remain strictly mandatory before clinical commitment.
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Generation Actions Grid */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-purple-300">English & Hinglish Understood:</span> Spoken audio or typed dialogue in English, Hinglish, or code-mixed Hindi-English is synthesized by Gemini into formal clinical documentation.
            </div>
          </div>
          <Badge variant="purple" size="sm" className="self-start sm:self-auto shrink-0">
            Gemini 3.5 / Flash Live
          </Badge>
        </div>

        {/* 1-Click Dual Generation Hero Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900 border-2 border-purple-500/50 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  1-Click Automation
                </span>
                <span className="text-xs text-purple-300 font-semibold flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5" />
                  English & Hinglish Understood
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                Generate Both Treatment Plan & Notes in 1 Click
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Synthesize the consultation transcript dialogue into both an evidence-based <strong>Treatment Plan</strong> (clinical goals & interventions) and structured <strong>SOAP Notes</strong> simultaneously with Gemini.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="button"
                variant="primary"
                disabled={actionLoading}
                onClick={() => handleStartDualGeneration('GENERATE_SOAP')}
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-purple-950/60 flex items-center gap-2 border border-purple-400/40 transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Both with Gemini...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-amber-300" />
                    ⚡ Generate Both in 1-Click
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pt-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Or Generate Individual Documentation
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(JOB_TYPE_META).map(([typeKey, meta]) => {
            const Icon = meta.icon;
            const isProcessingThis = activeJobs.some((j) => j.jobType === typeKey && ['queued', 'processing', 'validating'].includes(j.status)) ||
              (activeJob?.jobType === typeKey && ['queued', 'processing'].includes(activeJob.status));

            return (
              <button
                key={typeKey}
                type="button"
                disabled={actionLoading}
                onClick={() => handleStartGeneration(typeKey)}
                className={`p-3.5 rounded-xl border transition text-left space-y-2 group disabled:opacity-50 relative ${
                  meta.featured
                    ? 'bg-gradient-to-b from-purple-950/30 to-slate-900 border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/40 shadow-sm shadow-purple-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-purple-500/40 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    meta.featured
                      ? 'bg-purple-500/20 text-purple-300 group-hover:bg-purple-500/30'
                      : 'bg-slate-850 text-slate-300 group-hover:bg-purple-500/20 group-hover:text-purple-300'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {meta.featured && (
                      <span className="text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Primary
                      </span>
                    )}
                    {isProcessingThis && (
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition">
                    {meta.label}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {meta.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Job Progress Notifications (Single or Dual) */}
      {(activeJobs.length > 0 ? activeJobs : (activeJob ? [activeJob] : []))
        .filter((j) => ['queued', 'processing', 'validating'].includes(j.status))
        .map((job) => (
          <Card key={job.id} className="bg-slate-900/90 border-purple-500/40 animate-pulse">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                <div>
                  <span className="text-xs font-semibold text-purple-300">
                    Background Processing: {JOB_TYPE_META[job.jobType]?.label || job.jobType}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Status: <span className="font-mono text-purple-400">{job.status}</span>. Durable queue worker is synthesizing transcript evidence.
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Job ID: {job.id}</span>
            </CardContent>
          </Card>
        ))}

      {/* Drafts Tab Selector if multiple exist */}
      {draftsList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-2">Available Drafts:</span>
          {draftsList.map((d) => {
            const isSelected = activeDraft?.id === d.id;
            const meta = JOB_TYPE_META[d.draftType] || {};
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => selectDraft(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{meta.label || d.draftType}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    d.approvalStatus === 'approved'
                      ? 'bg-emerald-400'
                      : d.approvalStatus === 'rejected'
                      ? 'bg-rose-400'
                      : 'bg-amber-400'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Active Draft Review & Editing Studio */}
      {activeDraft ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 space-y-6">
            {/* Draft Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    {JOB_TYPE_META[activeDraft.draftType]?.label || activeDraft.draftType}
                  </h3>
                  <Badge
                    variant={
                      activeDraft.approvalStatus === 'approved'
                        ? 'green'
                        : activeDraft.approvalStatus === 'rejected'
                        ? 'red'
                        : 'amber'
                    }
                    size="sm"
                  >
                    {activeDraft.approvalStatus === 'approved'
                      ? 'Approved Clinical Record'
                      : activeDraft.approvalStatus === 'rejected'
                      ? 'Rejected & Discarded'
                      : activeDraft.approvalStatus === 'edited'
                      ? 'Clinician Edited Draft'
                      : 'Pending Clinician Review'}
                  </Badge>
                  {(activeDraft.isSynthetic || activeDraft.isMock || activeDraft.sandboxMode) && (
                    <Badge variant="amber" size="sm">
                      Synthetic Sandbox Draft
                    </Badge>
                  )}
                  <span className="text-[11px] text-slate-400">Version {activeDraft.version || 1}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Source Transcript Version: {activeDraft.sourceTranscriptVersion || 1} • Model: {activeDraft.modelUsed || 'Mock Clinical Engine'} • Mode: {activeDraft.isSynthetic ? 'Deterministic Synthetic' : 'Live'}
                </p>
              </div>

              {activeDraft.approvalStatus !== 'approved' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleRejectDraft}
                    className="text-rose-400 hover:text-rose-300 border-rose-500/20 hover:bg-rose-500/10"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Discard Draft
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={actionLoading || !isDirty}
                    onClick={handleSaveEdits}
                  >
                    Save Edits
                  </Button>
                </div>
              )}
            </div>

            {/* Missing Information Callout */}
            {activeDraft.missingInformation && activeDraft.missingInformation.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Missing or Incomplete Clinical Information Requiring Clinician Input:
                </div>
                <ul className="text-xs space-y-1 list-disc list-inside text-amber-200/90 pl-1">
                  {activeDraft.missingInformation.map((info, idx) => (
                    <li key={idx}>{info}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structured Content Fields */}
            <div className="space-y-4">
              {/* SOAP Formats */}
              {activeDraft.draftType === 'GENERATE_SOAP' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-400">S — Subjective (Patient Report)</label>
                    <textarea
                      rows={3}
                      value={editedContent.subjective || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('subjective', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-teal-400">O — Objective (Observed Data)</label>
                    <textarea
                      rows={3}
                      value={editedContent.objective || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('objective', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-cyan-400">A — Assessment (Clinical Formulation)</label>
                    <textarea
                      rows={3}
                      value={editedContent.assessment || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('assessment', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-indigo-400">P — Plan (Interventions & Next Steps)</label>
                    <textarea
                      rows={3}
                      value={editedContent.plan || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('plan', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* DAP Format */}
              {activeDraft.draftType === 'GENERATE_DAP' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-teal-400">D — Data (Subjective & Objective)</label>
                    <textarea
                      rows={4}
                      value={editedContent.data || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('data', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-cyan-400">A — Assessment</label>
                    <textarea
                      rows={3}
                      value={editedContent.assessment || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('assessment', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-indigo-400">P — Plan</label>
                    <textarea
                      rows={3}
                      value={editedContent.plan || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('plan', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* BIRP Format */}
              {activeDraft.draftType === 'GENERATE_BIRP' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-400">B — Behavior</label>
                    <textarea
                      rows={3}
                      value={editedContent.behavior || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('behavior', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-teal-400">I — Intervention</label>
                    <textarea
                      rows={3}
                      value={editedContent.intervention || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('intervention', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-cyan-400">R — Response</label>
                    <textarea
                      rows={3}
                      value={editedContent.response || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('response', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-indigo-400">P — Plan</label>
                    <textarea
                      rows={3}
                      value={editedContent.plan || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('plan', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                </>
              )}

              {/* Treatment Plan Format */}
              {activeDraft.draftType === 'GENERATE_TREATMENT_PLAN_DRAFT' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Plan Title</label>
                    <input
                      type="text"
                      value={editedContent.title || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Presenting Problem</label>
                    <textarea
                      rows={2}
                      value={editedContent.presentingProblem || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('presentingProblem', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Proposed Short-Term Objectives</label>
                    <div className="space-y-2 mt-1">
                      {(editedContent.shortTermObjectives || []).map((obj, i) => (
                        <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                          <span className="font-semibold text-purple-400">Objective {i + 1}:</span> {obj.objective}
                          <div className="text-[11px] text-slate-400 mt-1">
                            Measurable Criteria: {obj.measurableCriteria || 'N/A'} (Target: {obj.targetWeeks || 4} weeks)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Homework Format */}
              {activeDraft.draftType === 'GENERATE_HOMEWORK_SUGGESTIONS' && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-300">Select Tasks to Assign to Patient:</label>
                  {(editedContent.suggestions || []).map((sug, i) => {
                    const isSelected = selectedTaskIndices.includes(i);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (activeDraft.approvalStatus === 'approved') return;
                          setSelectedTaskIndices((prev) =>
                            isSelected ? prev.filter((idx) => idx !== i) : [...prev, i]
                          );
                        }}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-slate-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-300">{sug.title}</span>
                          <span className="text-[11px] font-mono text-slate-400">Due: {sug.dueDateDays || 7} days</span>
                        </div>
                        <p className="text-xs mt-1 text-slate-300">{sug.description}</p>
                        <p className="text-[11px] mt-1 text-slate-400 italic">Rationale: {sug.therapeuticRationale}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Session Summary & Other Formats */}
              {activeDraft.draftType === 'GENERATE_SESSION_SUMMARY' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-purple-400">Clinical Observations</label>
                    <textarea
                      rows={3}
                      value={(editedContent.clinicalObservations || []).join('\n')}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('clinicalObservations', e.target.value.split('\n'))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-purple-400">Progress Notes & Formulations</label>
                    <textarea
                      rows={3}
                      value={editedContent.progressNotes || ''}
                      disabled={activeDraft.approvalStatus === 'approved'}
                      onChange={(e) => handleFieldChange('progressNotes', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Documentation Completeness */}
              {activeDraft.draftType === 'CHECK_DOCUMENTATION_COMPLETENESS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-xs font-semibold text-slate-300">Overall Documentation Completeness Score</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {editedContent.overallCompletenessScore || 85}/100
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(editedContent.findings || []).map((f, i) => (
                      <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{f.domain}</span>
                          <Badge variant={f.severity === 'critical' ? 'red' : 'amber'} size="sm">
                            {f.severity}
                          </Badge>
                        </div>
                        <p className="text-slate-300 mt-1">{f.finding}</p>
                        <p className="text-slate-400 mt-0.5 italic">Recommendation: {f.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Drawer Toggle */}
            {activeDraft.evidenceReferences && activeDraft.evidenceReferences.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEvidence((prev) => !prev)}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showEvidence ? 'Hide Source Evidence' : 'View Source Transcript Citations'}
                  {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showEvidence && (
                  <div className="mt-3 space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    {activeDraft.evidenceReferences.map((ref, idx) => (
                      <div key={idx} className="text-xs text-slate-300 border-l-2 border-purple-500 pl-2 py-0.5">
                        <span className="text-[11px] text-purple-400 font-mono">Turn #{ref.turnOrder || idx + 1}:</span>{' '}
                        <span className="italic">"{ref.quote}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Approval Controls */}
            {activeDraft.approvalStatus !== 'approved' && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-400" />
                      Human Clinical Approval & Record Commitment
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Approving commits this verified draft to the official patient records in Firebase RTDB.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    disabled={actionLoading}
                    onClick={handleApproveDraft}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve & Commit Record
                  </Button>
                </div>

                {/* Additional Clinical Options */}
                {['GENERATE_SOAP', 'GENERATE_DAP', 'GENERATE_BIRP'].includes(activeDraft.draftType) && (
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-purple-500/20 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={finalizeImmediately}
                        onChange={(e) => setFinalizeImmediately(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Digitally sign and finalize note immediately</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sharedWithPatient}
                        onChange={(e) => setSharedWithPatient(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Release summary to patient portal</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900 border-slate-800 text-center py-10">
          <CardContent className="space-y-3">
            <Sparkles className="w-8 h-8 text-purple-400 mx-auto opacity-75" />
            <h4 className="text-sm font-bold text-slate-200">No AI Draft Selected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select one of the actions above to generate a structured, evidence-grounded clinical draft from the session's verified transcript.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
