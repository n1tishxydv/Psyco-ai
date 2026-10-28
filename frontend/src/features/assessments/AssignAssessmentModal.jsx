import React, { useState } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { assessmentService } from '../../services/assessmentService';
import { X, ClipboardCheck, AlertTriangle, Info, Sparkles, Check } from 'lucide-react';

const INSTRUMENTS = [
  {
    id: 'phq9',
    name: 'PHQ-9 (Patient Health Questionnaire-9)',
    version: '1.0.0',
    description: 'Standardized 9-item depression symptom severity screener based on DSM-IV depression criteria.',
    itemsCount: 9,
    scoreRange: '0 - 27',
    badge: 'Standardized Psychometric',
    badgeVariant: 'teal',
  },
  {
    id: 'gad7',
    name: 'GAD-7 (Generalized Anxiety Disorder-7)',
    version: '1.0.0',
    description: 'Standardized 7-item anxiety severity screener measuring generalized anxiety symptoms over past 2 weeks.',
    itemsCount: 7,
    scoreRange: '0 - 21',
    badge: 'Standardized Psychometric',
    badgeVariant: 'teal',
  },
  {
    id: 'cssrs_screener',
    name: 'C-SSRS Screener (Columbia Suicide Severity)',
    version: '1.0.0',
    description: 'Official Columbia-Suicide Severity Rating Scale screener with lifetime and past-month ideation items.',
    itemsCount: 6,
    scoreRange: 'Categorical Risk Indicators',
    badge: 'Safety Screener',
    badgeVariant: 'rose',
    warning: 'Governed safety instrument. Positive affirmative answers automatically trigger clinician risk-review flags.',
  },
];

export function AssignAssessmentModal({ patientId, patientName, isOpen, onClose, onAssigned }) {
  const [selectedInstrument, setSelectedInstrument] = useState('phq9');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await assessmentService.assignAssessment({
        patientId,
        instrumentId: selectedInstrument,
        instructions: instructions.trim() || undefined,
      });
      if (onAssigned) onAssigned();
      onClose();
    } catch (err) {
      console.error('Failed to assign assessment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to assign assessment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Assign Standardized Assessment</h3>
              <p className="text-xs text-slate-400">Patient: <span className="text-slate-200 font-medium">{patientName || patientId}</span></p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Verified Psychometric Instrument
            </label>
            <div className="space-y-3">
              {INSTRUMENTS.map((inst) => {
                const isSelected = selectedInstrument === inst.id;
                return (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstrument(inst.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-950/20 shadow-md ring-1 ring-teal-500/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">{inst.name}</span>
                          <Badge variant={inst.badgeVariant} size="sm">{inst.badge}</Badge>
                          <span className="text-[11px] font-mono text-slate-400">v{inst.version}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{inst.description}</p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span>Items: <strong className="text-slate-300">{inst.itemsCount}</strong></span>
                          <span>Score Scale: <strong className="text-slate-300">{inst.scoreRange}</strong></span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-teal-400 bg-teal-500 text-slate-950' : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {inst.warning && isSelected && (
                      <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>{inst.warning}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Clinician Instructions to Patient (Optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Please fill out this questionnaire reflecting your feelings over the last 14 days before our session on Thursday."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-slate-400 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              All scores are evaluated via deterministic psychometric algorithms on the backend. No score is inferred via generative AI.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Questionnaire'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
