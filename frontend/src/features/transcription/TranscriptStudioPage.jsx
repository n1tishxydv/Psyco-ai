import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { transcriptionService } from '../../services/transcriptionService';
import { clinicalService } from '../../services/clinicalService';
import {
  FileText,
  Search,
  ArrowLeft,
  Edit3,
  Clock,
  User,
  ShieldCheck,
  History,
  Printer,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Zap,
} from 'lucide-react';

export function TranscriptStudioPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState(null);
  const [entries, setEntries] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Inline edit state
  const [editingEntry, setEditingEntry] = useState(null);
  const [editText, setEditText] = useState('');
  const [editSpeaker, setEditSpeaker] = useState('');
  const [editReason, setEditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Version history modal state
  const [historyModal, setHistoryModal] = useState(false);

  // Copy notification
  const [copied, setCopied] = useState(false);

  // Fetch complete transcript
  const fetchTranscript = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await transcriptionService.getTranscript(sessionId);
      if (res.data) {
        setTranscript(res.data.transcript);
        setEntries(res.data.entries || []);
        setVersions(res.data.versions || []);
      }
    } catch (err) {
      console.error('Failed to load transcript:', err);
      setError(err.message || 'Failed to load session transcript.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchTranscript();
    }
  }, [sessionId]);

  // Handle Review Status Change
  const handleReviewStatusChange = async (newStatus) => {
    if (!transcript) return;
    try {
      const res = await transcriptionService.updateReviewStatus(transcript.id, newStatus);
      setTranscript(res.data.transcript);
    } catch (err) {
      console.error('Failed updating review status:', err);
    }
  };

  // Open edit modal
  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setEditText(entry.text || '');
    setEditSpeaker(entry.speaker || '');
    setEditReason('');
    setEditError(null);
  };

  // Submit correction
  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!editReason.trim()) {
      setEditError('A clinical justification or reason for correction is required.');
      return;
    }

    try {
      setSavingEdit(true);
      setEditError(null);

      const res = await transcriptionService.correctTranscriptEntry(transcript.id, editingEntry.id, {
        text: editText.trim(),
        speaker: editSpeaker.trim(),
        reason: editReason.trim(),
      });

      // Update local state
      setEntries((prev) =>
        prev.map((item) => (item.id === editingEntry.id ? res.data.entry : item))
      );
      setVersions((prev) => [res.data.versionSnapshot, ...prev]);
      setTranscript((prev) => ({
        ...prev,
        version: res.data.newVersion,
      }));

      setEditingEntry(null);
    } catch (err) {
      setEditError(err.message || 'Failed to save transcript correction.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Copy full transcript text
  const handleCopyFullText = () => {
    if (!transcript?.fullText) return;
    navigator.clipboard.writeText(transcript.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Print text
  const handlePrint = () => {
    window.print();
  };

  // Filter entries based on search
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (entry.text || '').toLowerCase().includes(q) ||
      (entry.speaker || '').toLowerCase().includes(q)
    );
  });

  // Highlight matched terms
  const renderHighlightedText = (text) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Format Milliseconds into mm:ss
  const formatMs = (ms) => {
    if (!ms && ms !== 0) return null;
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-teal-400">
          <Clock className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading session transcript...</span>
        </div>
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            to={sessionId ? `/psychologist/sessions/${sessionId}` : '/psychologist/patients'}
            className="inline-flex items-center gap-2 text-xs text-teal-400 hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Session Workspace
          </Link>
          <Card className="border border-red-500/30 bg-navy-900/60 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-100 mb-1">Transcript Not Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              {error || 'No transcript record exists yet for this consultation session.'}
            </p>
            <Link to={`/psychologist/sessions/${sessionId}`}>
              <Button variant="primary" size="sm">
                Return to Session Cockpit
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            to={`/psychologist/sessions/${sessionId}`}
            className="inline-flex items-center gap-2 text-xs text-teal-400 hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Session Workspace
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryModal(true)}
              className="border-navy-700 text-slate-300 hover:bg-navy-800 text-xs"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
              Version History ({versions.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFullText}
              className="border-navy-700 text-slate-300 hover:bg-navy-800 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Copied Text!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Transcript
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-navy-700 text-slate-300 hover:bg-navy-800 text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / PDF
            </Button>
            <Link to={`/psychologist/sessions/${sessionId}?tab=ai_copilot&task=GENERATE_TREATMENT_PLAN_DRAFT`}>
              <Button
                variant="primary"
                size="sm"
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs flex items-center gap-1.5 shadow-md shadow-purple-950/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Process with Gemini Copilot
              </Button>
            </Link>
          </div>
        </div>

        {/* Studio Main Card */}
        <Card className="border border-navy-800 bg-navy-900/80 shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="p-6 border-b border-navy-800 bg-navy-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    Clinical Transcript Studio
                  </h1>
                  <Badge variant="outline" className="border-teal-500/30 text-teal-300 text-xs uppercase font-mono">
                    v{transcript.version || 1}
                  </Badge>
                  <Badge
                    variant={
                      transcript.source === 'assemblyai'
                        ? 'primary'
                        : transcript.source === 'google_meet'
                        ? 'info'
                        : 'secondary'
                    }
                    className="text-xs capitalize"
                  >
                    {transcript.source === 'assemblyai'
                      ? 'AssemblyAI Ambient'
                      : transcript.source === 'google_meet'
                      ? 'Google Meet API v2'
                      : 'Manual Text Import'}
                  </Badge>
                  <Badge
                    variant={
                      transcript.completeness === 'completed'
                        ? 'success'
                        : transcript.completeness === 'partial'
                        ? 'warning'
                        : 'danger'
                    }
                    className="text-xs uppercase"
                  >
                    {transcript.completeness || 'completed'}
                  </Badge>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span>Session: <strong className="text-slate-300 font-mono">{sessionId}</strong></span>
                  <span>•</span>
                  <span>Patient ID: <strong className="text-slate-300 font-mono">{transcript.patientId}</strong></span>
                  <span>•</span>
                  <span>Total Turns: <strong className="text-slate-300">{entries.length}</strong></span>
                  <span>•</span>
                  <span>Updated: {new Date(transcript.updatedAt || transcript.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Review Status Dropdown */}
              <div className="flex items-center gap-2 print:hidden">
                <label className="text-xs text-slate-400 font-medium">Review State:</label>
                <select
                  value={transcript.reviewStatus || 'pending_review'}
                  onChange={(e) => handleReviewStatusChange(e.target.value)}
                  className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium cursor-pointer"
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="in_review">In Review</option>
                  <option value="reviewed">Reviewed & Verified</option>
                </select>
              </div>
            </div>

            {/* In-Browser Search Bar */}
            <div className="mt-5 relative print:hidden">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search spoken dialogue, clinical keywords, or speaker names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-950/80 border border-navy-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 placeholder-slate-500"
              />
              {searchQuery && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-teal-400 font-medium">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'match' : 'matches'}
                </div>
              )}
            </div>

            {/* Post-Transcript Processing with Gemini Action Banner */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-navy-950 to-navy-950 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    Transcript Finalized ({entries.length} turns)
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-normal">
                      English & Hinglish Understood
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Start processing with Gemini Copilot to synthesize structured clinical treatment plans and documentation.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link to={`/psychologist/sessions/${sessionId}?tab=ai_copilot&task=GENERATE_BOTH`}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-md shadow-purple-950/40 font-semibold"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    ⚡ Generate Both in 1-Click
                  </Button>
                </Link>
                <Link to={`/psychologist/sessions/${sessionId}?tab=ai_copilot&task=GENERATE_TREATMENT_PLAN_DRAFT`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs px-2.5 py-1.5 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Plan Only
                  </Button>
                </Link>
                <Link to={`/psychologist/sessions/${sessionId}?tab=ai_copilot&task=GENERATE_SOAP`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs px-2.5 py-1.5 flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    Notes Only
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Transcript Dialogue List */}
          <div className="p-6 space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                {searchQuery ? 'No transcript turns matched your search query.' : 'No speech turns recorded in this transcript.'}
              </div>
            ) : (
              filteredEntries.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className={`p-4 rounded-xl border transition-all ${
                    entry.isCorrected
                      ? 'bg-navy-900/90 border-teal-500/30'
                      : 'bg-navy-950/60 border-navy-800 hover:border-navy-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-navy-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-teal-400">
                        {entry.speaker || 'Speaker'}
                      </span>
                      {entry.isCorrected && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-teal-500/40 text-teal-300">
                          Corrected
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {(entry.startTime !== null && entry.startTime !== undefined) && (
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" />
                          {formatMs(entry.startTime) || entry.startTime}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(entry)}
                        className="text-xs text-slate-400 hover:text-teal-400 transition-colors p-1 rounded hover:bg-navy-800 print:hidden"
                        title="Correct this speech turn"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {renderHighlightedText(entry.text)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-4 bg-navy-900/90 border-t border-navy-800 text-[11px] text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              Confidential Psychotherapy Transcript. Authorized Practitioner Access Only.
            </span>
            <span className="font-mono text-slate-600">RTDB Authoritative Text/JSON</span>
          </div>
        </Card>
      </div>

      {/* Inline Correction Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-navy-900 border border-teal-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-4">
              <div className="flex items-center gap-2 text-teal-400">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-base font-semibold text-slate-100">Correct Transcript Turn</h3>
              </div>
              <span className="text-xs text-slate-400">Turn #{editingEntry.turnOrder + 1}</span>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Speaker Label</label>
                <input
                  type="text"
                  value={editSpeaker}
                  onChange={(e) => setEditSpeaker(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Spoken Utterance Text</label>
                <textarea
                  rows={4}
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-navy-950/70 border border-navy-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Clinical Correction Justification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corrected audio misattribution / clinician clarified symptom phrase"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  A snapshot of the prior text will be preserved in version history before updating.
                </span>
              </div>

              {editError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-navy-800">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingEntry(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={savingEdit || !editText.trim() || !editReason.trim()}
                  className="bg-teal-600 hover:bg-teal-500 text-white"
                >
                  {savingEdit ? 'Archiving Revision...' : 'Save Correction'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Drawer / Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800 mb-4">
              <div className="flex items-center gap-2 text-teal-400">
                <History className="w-5 h-5" />
                <h3 className="text-base font-semibold text-slate-100">Transcript Revision History</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {versions.length} Snapshots
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {versions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs italic">
                  No manual corrections recorded yet. The current transcript represents original provider speech capture.
                </div>
              ) : (
                versions.map((ver, idx) => (
                  <div key={ver.id || idx} className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-teal-400">Version {ver.previousVersion} Snapshot</span>
                      <span>{new Date(ver.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="p-2.5 rounded bg-red-950/20 border border-red-900/30 text-slate-300">
                      <div className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-0.5">Original / Prior Content:</div>
                      <p className="line-through text-slate-400 italic">[{ver.previousSpeaker}]: {ver.previousText}</p>
                    </div>

                    <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 text-slate-300">
                      <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-0.5">Corrected Text:</div>
                      <p className="text-emerald-200">[{ver.correctedSpeaker}]: {ver.correctedText}</p>
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      <strong>Reason:</strong> {ver.reason}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-end border-t border-navy-800 mt-4">
              <Button variant="outline" size="sm" onClick={() => setHistoryModal(false)}>
                Close History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
