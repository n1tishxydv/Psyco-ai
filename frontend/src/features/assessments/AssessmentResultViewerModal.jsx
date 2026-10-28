import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { assessmentService } from '../../services/assessmentService';
import {
  X,
  ClipboardCheck,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

export function AssessmentResultViewerModal({ result, isOpen, onClose, onReviewed }) {
  const [reviewNotes, setReviewNotes] = useState(result?.clinicianReviewNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !result) return null;

  const isCSSRS = result.instrumentId === 'cssrs_screener';
  const hasSafetyAlert = result.safetyTriggered || (isCSSRS && (result.scoreBreakdown?.hasSuicidalIdeationLifetime || result.scoreBreakdown?.hasSuicidalIdeationPastMonth));

  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await assessmentService.recordClinicianReview(result.id, {
        notes: reviewNotes.trim(),
        status: 'reviewed',
      });
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      console.error('Failed to save review:', err);
      setError(err.response?.data?.message || err.message || 'Failed to record review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${hasSafetyAlert ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>
              {hasSafetyAlert ? <ShieldAlert className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{result.instrumentName || result.instrumentId}</h3>
                <span className="text-[11px] font-mono text-slate-400">v{result.instrumentVersion}</span>
                {result.reviewStatus === 'reviewed' ? (
                  <Badge variant="green" size="sm">Reviewed</Badge>
                ) : (
                  <Badge variant="amber" size="sm">Awaiting Review</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed on {new Date(result.completedAt || result.createdAt).toLocaleString()}
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Safety Trigger Alert Banner */}
          {hasSafetyAlert && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <h4 className="text-sm font-bold text-rose-300">Clinical Safety Alert Triggered</h4>
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                {result.safetyTriggerReason || 'Patient indicated thoughts of self-harm, suicidal ideation, or suicidal intent on this assessment. An active risk-review flag has been generated.'}
              </p>
              <div className="text-[11px] text-rose-400/80 font-mono">
                Trigger code: {result.safetyTriggerCode || 'SAFETY_TRIGGER_AFFIRMATIVE'}
              </div>
            </div>
          )}

          {/* Score & Classification Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calculated Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-100">{result.score ?? 'N/A'}</span>
                {result.maxScore && <span className="text-sm text-slate-400">/ {result.maxScore}</span>}
              </div>
              <span className="text-[11px] text-slate-500 mt-1">Algorithm: {result.scoringAlgorithmVersion || 'v1.0.0'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Severity Classification</span>
                {result.severity && (
                  <Badge
                    variant={
                      ['severe', 'high'].includes(result.severity)
                        ? 'rose'
                        : ['moderately_severe', 'moderate'].includes(result.severity)
                        ? 'amber'
                        : ['mild'].includes(result.severity)
                        ? 'teal'
                        : 'green'
                    }
                    size="sm"
                  >
                    {result.severity.replace('_', ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {result.severityLabel || 'Standard Category'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {result.clinicalInterpretation || 'Based on standard psychometric scoring rules.'}
              </p>
            </div>
          </div>

          {/* Responses Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Item-Level Responses Breakdown
            </h4>
            <div className="space-y-2.5">
              {result.itemResponses && result.itemResponses.length > 0 ? (
                result.itemResponses.map((item, idx) => {
                  const isItemSafetyFlag = item.isSafetyAlert || (item.itemId === 'phq9_q9' && item.value > 0);
                  return (
                    <div
                      key={item.itemId || idx}
                      className={`p-3.5 rounded-xl border transition ${
                        isItemSafetyFlag
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500">#{idx + 1}</span>
                            <span className="text-xs font-medium text-slate-200">{item.itemPrompt || item.itemId}</span>
                          </div>
                          <div className="text-xs text-teal-400 pl-5">
                            Selected: <strong className="text-slate-100">{item.selectedLabel || item.value}</strong>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                            isItemSafetyFlag ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {typeof item.value === 'boolean' ? (item.value ? 'YES' : 'NO') : `${item.value} pts`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center bg-slate-800/20 rounded-xl">
                  Detailed question item breakdown was preserved in raw submission.
                </div>
              )}
            </div>
          </div>

          {/* Clinician Review & Documentation */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold uppercase tracking-wider">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Clinician Interpretation & Action Note</span>
              </div>
              {result.reviewedAt && (
                <span className="text-[11px] text-slate-400">
                  Last reviewed {new Date(result.reviewedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Record your clinical interpretation, changes compared to baseline, therapeutic context, or safety interventions here..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Marking reviewed updates the documentation completeness record.
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveReview}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Clinician Review'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
