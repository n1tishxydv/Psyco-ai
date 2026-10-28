import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { analyticsService } from '../../services/analyticsService';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';

export function RiskReviewModal({ flag, isOpen, onClose, onAcknowledged }) {
  const [resolutionStatus, setResolutionStatus] = useState('acknowledged_action_taken');
  const [actionNotes, setActionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !flag) return null;

  const isResolved = flag.status === 'resolved' || flag.status === 'acknowledged';

  const handleAcknowledge = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await analyticsService.acknowledgeRiskFlag(flag.id, {
        status: resolutionStatus,
        actionNotes: actionNotes.trim(),
      });
      if (onAcknowledged) onAcknowledged();
      onClose();
    } catch (err) {
      console.error('Failed to acknowledge risk flag:', err);
      setError(err.response?.data?.message || err.message || 'Failed to acknowledge flag');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Clinical Risk-Review Flag</h3>
                <Badge variant={flag.severity === 'high' ? 'rose' : 'amber'} size="sm">
                  {(flag.severity || 'HIGH').toUpperCase()} PRIORITY
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Detected: {new Date(flag.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Clinical Reason Box */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Flag Reason & Category</span>
            <p className="text-sm font-semibold text-slate-200">{flag.reason}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span>Category: <strong className="text-slate-300 capitalize">{flag.category || 'Self-Harm / Suicide'}</strong></span>
              <span>Source: <strong className="text-slate-300 capitalize">{flag.sourceType || 'Session Transcript'}</strong></span>
              <span>Method: <strong className="text-slate-300 capitalize">{flag.detectionMethod || 'Deterministic Rule'}</strong></span>
            </div>
          </div>

          {/* Verbatim Excerpt */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-400" />
              Verbatim Supporting Source Excerpt
            </span>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-xs text-rose-200/90 leading-relaxed relative">
              "{flag.excerpt || flag.supportingText || 'Excerpt preserved in clinical record.'}"
              {flag.turnIndex != null && (
                <div className="mt-2 text-[11px] text-slate-500">
                  Transcript Turn Reference: #{flag.turnIndex}
                </div>
              )}
            </div>
          </div>

          {/* Disclaimers & Decision Support Notice */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300/90 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-200">Clinical Decision Support Safeguard</p>
              <p className="text-[11px] leading-relaxed text-amber-300/80">
                This flag is an assistive signal designed to prevent oversight. It does not replace professional clinical judgment. The absence of a flag does not imply absence of risk. Psyco AI never autonomously calls emergency contacts.
              </p>
            </div>
          </div>

          {/* Review & Acknowledgment Form */}
          {!isResolved ? (
            <form onSubmit={handleAcknowledge} className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Clinical Determination
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="acknowledged_action_taken">Acknowledged — Safety Plan / Action Implemented</option>
                  <option value="reviewed_no_immediate_risk">Reviewed — No Immediate Action Required (Low Acute Concern)</option>
                  <option value="false_positive_context_benign">Reviewed — Benign Mention / Figurative Language</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Clinical Action & Response Notes
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Document your clinical risk assessment, safety plan discussion, or rationale for future audit and care continuity..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
                  Dismiss Without Saving
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Record Clinical Acknowledgment'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Flag Acknowledged by Clinician</span>
              </div>
              <p className="text-xs text-slate-300">
                Action notes: {flag.actionNotes || 'Documented in patient clinical chart.'}
              </p>
              <span className="text-[11px] text-slate-500">
                Status: {flag.status} on {new Date(flag.updatedAt || flag.createdAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        {isResolved && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
