import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService.js';
import { Card, CardContent } from '../../components/cards/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Send,
  Lock,
} from 'lucide-react';

export function PatientAssessmentRunnerPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [instrument, setInstrument] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assessmentService.getAssignment(assignmentId);
      setAssignment(res.assignment);
      setInstrument(res.assignment.instrument);

      // Pre-initialize responses map
      const initialResponses = {};
      res.assignment.instrument.items.forEach((item) => {
        initialResponses[item.id] = null;
      });
      setResponses(initialResponses);
    } catch (err) {
      setError(err.message || 'Failed to load assigned assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (itemId, val) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: Number(val),
    }));
  };

  const answeredCount = Object.values(responses).filter((v) => v !== null && v !== undefined).length;
  const totalItemsCount = instrument?.items?.length || 0;
  const progressPercent = totalItemsCount > 0 ? Math.round((answeredCount / totalItemsCount) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answeredCount < totalItemsCount) {
      setError(`Please complete all ${totalItemsCount} questions before submitting.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await assessmentService.submitResponses(assignmentId, responses);
      setSubmittedResult(res);
    } catch (err) {
      setError(err.message || 'Failed to submit assessment responses.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 p-6 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your confidential assessment...</p>
        </div>
      </div>
    );
  }

  if (submittedResult) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-lg w-full bg-slate-900 border-emerald-500/30 text-center p-8 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Assessment Submitted</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Thank you for completing the <strong className="text-slate-200">{instrument?.name}</strong>. Your responses have been encrypted and securely transmitted to your psychologist's clinical chart for your upcoming review.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Completion Status:</span>
              <Badge variant="green" size="sm">Completed & Recorded</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Timestamp:</span>
              <span className="font-mono text-slate-300 text-[11px]">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/patient/dashboard">
              <Button variant="primary" size="md" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold">
                Return to Patient Portal
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          to="/patient/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        {/* Header Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-400" />
                <h1 className="text-lg font-bold text-slate-100">{instrument?.name}</h1>
              </div>
              <Badge variant="teal" size="sm">Confidential Assessment</Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {instrument?.instructions}
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Progress: {answeredCount} of {totalItemsCount} questions answered</span>
                <span className="font-mono text-teal-400">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Question Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {instrument?.items.map((item, idx) => {
            const selectedVal = responses[item.id];
            const isAnswered = selectedVal !== null && selectedVal !== undefined;

            return (
              <Card
                key={item.id}
                className={`bg-slate-900 transition border ${
                  isAnswered ? 'border-slate-800' : 'border-slate-850'
                }`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-teal-400 bg-teal-500/10 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border border-teal-500/20">
                      {idx + 1}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-200 leading-relaxed pt-0.5">
                      {item.text}
                    </h3>
                  </div>

                  {/* Options Selector Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                    {instrument.options.map((opt) => {
                      const isOptionSelected = selectedVal === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(item.id, opt.value)}
                          className={`p-3 rounded-xl text-xs font-medium text-left transition flex items-center justify-between border ${
                            isOptionSelected
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isOptionSelected ? 'border-teal-400 bg-teal-500' : 'border-slate-700'
                            }`}
                          >
                            {isOptionSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Submission Card & Privacy Notice */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>
                  Responses are securely transmitted via encrypted channels directly to your psychologist. No data is shared with third parties.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  {answeredCount === totalItemsCount
                    ? 'All questions completed. Ready to submit.'
                    : `${totalItemsCount - answeredCount} questions remaining.`}
                </span>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting || answeredCount < totalItemsCount}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting Responses...' : 'Submit Completed Assessment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default PatientAssessmentRunnerPage;
