import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { clinicalService } from '../../services/clinicalService';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  User,
  RefreshCw,
  Search,
  FileText,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function TreatmentPlansPage() {
  const [plans, setPlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Plan Modal State
  const [newPlanModal, setNewPlanModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [presentingProblem, setPresentingProblem] = useState('');
  const [diagnosisCodeInput, setDiagnosisCodeInput] = useState('F41.1 Generalized Anxiety Disorder');
  const [reviewWeeks, setReviewWeeks] = useState(4);
  const [sharedWithPatient, setSharedWithPatient] = useState(true);
  const [goals, setGoals] = useState([
    { description: '', measurableObjective: '', targetDate: '' },
  ]);

  // Goal update modal
  const [goalModal, setGoalModal] = useState({ open: false, planId: null, goal: null, status: 'active', notes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch patients
      const pRes = await clinicalService.getPatients();
      const patList = Array.isArray(pRes) ? pRes : (pRes?.data?.patients || pRes?.patients || []);
      setPatients(patList);

      // Collect treatment plans across all assigned patients
      const allPlans = [];
      for (const pat of patList) {
        try {
          const chartRes = await clinicalService.getPatientChart(pat.id);
          const pPlans = chartRes.data?.chart?.treatmentPlans || [];
          for (const pl of pPlans) {
            allPlans.push({
              ...pl,
              patientName: pat.fullName,
            });
          }
        } catch (e) {
          console.error(`Error loading plans for ${pat.id}:`, e);
        }
      }
      setPlans(allPlans);
    } catch (err) {
      console.error('Failed to load treatment plans:', err);
      setError(err.message || 'Failed to fetch treatment plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Goal list handlers
  const handleAddGoalField = () => {
    setGoals([...goals, { description: '', measurableObjective: '', targetDate: '' }]);
  };

  const handleGoalChange = (idx, field, value) => {
    const updated = [...goals];
    updated[idx][field] = value;
    setGoals(updated);
  };

  const handleRemoveGoalField = (idx) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== idx));
    }
  };

  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient for this treatment plan.');
      return;
    }
    try {
      await clinicalService.createTreatmentPlan({
        patientId: selectedPatientId,
        title: planTitle,
        presentingProblem,
        diagnosisCodes: [diagnosisCodeInput],
        reviewFrequencyWeeks: Number(reviewWeeks),
        sharedWithPatient,
        goals: goals.filter((g) => g.description.trim()),
      });
      setNewPlanModal(false);
      setPlanTitle('');
      setPresentingProblem('');
      setGoals([{ description: '', measurableObjective: '', targetDate: '' }]);
      await fetchData();
    } catch (err) {
      alert(`Error creating plan: ${err.message}`);
    }
  };

  const handleUpdateGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      await clinicalService.updatePlanGoal(goalModal.planId, goalModal.goal.id, {
        status: goalModal.status,
        progressNotes: goalModal.notes,
      });
      setGoalModal({ open: false, planId: null, goal: null, status: 'active', notes: '' });
      await fetchData();
    } catch (err) {
      alert(`Error updating goal: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="green" size="sm">Clinical Workspace</Badge>
            <Badge variant="neutral" size="sm">{plans.length} Treatment Plans</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Treatment Plans & Clinical Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Formulate personalized care plans, measurable therapeutic objectives, and monitor goal milestones.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 self-start sm:self-auto"
          onClick={() => setNewPlanModal(true)}
        >
          <Plus className="w-4 h-4" />
          Create Treatment Plan
        </Button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
          Loading treatment plans...
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <EmptyState
              icon={Target}
              title="No Treatment Plans Recorded"
              description="Establish structured clinical treatment plans with objectives and progress tracking."
              actionLabel="Create First Treatment Plan"
              onAction={() => setNewPlanModal(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-100">{plan.title}</h3>
                      <Badge variant={plan.status === 'active' ? 'green' : 'neutral'} size="sm">
                        {plan.status}
                      </Badge>
                      {plan.sharedWithPatient && (
                        <Badge variant="teal" size="sm">Visible in Patient Portal</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Patient: <span className="font-semibold text-slate-200">{plan.patientName}</span> • Review Cycle: Every {plan.reviewFrequencyWeeks} weeks
                    </p>
                  </div>

                  <Link to={`/psychologist/patients/${plan.patientId}`}>
                    <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1">
                      Patient Chart
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 block mb-0.5">Presenting Concern & Formulation:</span>
                  <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {plan.presentingProblem}
                  </p>
                </div>

                {/* Goals */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Therapeutic Goals & Milestones:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(plan.goals || []).map((g) => (
                      <div
                        key={g.id}
                        className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-200">{g.description}</span>
                            <Badge
                              variant={
                                g.status === 'achieved'
                                  ? 'green'
                                  : g.status === 'revised'
                                  ? 'amber'
                                  : 'teal'
                              }
                              size="sm"
                              className="capitalize flex-shrink-0"
                            >
                              {g.status}
                            </Badge>
                          </div>
                          {g.measurableObjective && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              Objective: {g.measurableObjective}
                            </p>
                          )}
                          {g.progressNotes && (
                            <p className="text-[11px] text-emerald-400 mt-1 italic">
                              Progress: "{g.progressNotes}"
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Target: {g.targetDate || 'Ongoing'}</span>
                          <button
                            onClick={() =>
                              setGoalModal({
                                open: true,
                                planId: plan.id,
                                goal: g,
                                status: g.status || 'active',
                                notes: g.progressNotes || '',
                              })
                            }
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            Update Progress
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Treatment Plan Modal */}
      {newPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Establish New Clinical Treatment Plan
            </h3>
            <form onSubmit={handleCreatePlanSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Patient</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Assigned Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cognitive Behavioral Treatment Plan for Generalized Anxiety"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Presenting Problem Formulation</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Diagnostic context, primary stressors, and functional impairment..."
                  value={presentingProblem}
                  onChange={(e) => setPresentingProblem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Diagnosis Code</label>
                  <input
                    type="text"
                    value={diagnosisCodeInput}
                    onChange={(e) => setDiagnosisCodeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Review Frequency (Weeks)</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={reviewWeeks}
                    onChange={(e) => setReviewWeeks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Goal Builder */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Treatment Goals & Objectives</span>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddGoalField} className="text-emerald-400 text-xs">
                    + Add Goal
                  </Button>
                </div>

                {goals.map((goal, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">Goal #{idx + 1}</span>
                      {goals.length > 1 && (
                        <button type="button" onClick={() => handleRemoveGoalField(idx)} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Goal description (e.g., Reduce panic attacks to 0 per week)"
                      value={goal.description}
                      onChange={(e) => handleGoalChange(idx, 'description', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Measurable objective (e.g., GAD-7 score < 5)"
                        value={goal.measurableObjective}
                        onChange={(e) => handleGoalChange(idx, 'measurableObjective', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="date"
                        value={goal.targetDate}
                        onChange={(e) => handleGoalChange(idx, 'targetDate', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="share-plan"
                  checked={sharedWithPatient}
                  onChange={(e) => setSharedWithPatient(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="share-plan" className="text-slate-200 cursor-pointer">
                  Publish goals to Patient Care Portal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <Button type="button" variant="ghost" size="sm" onClick={() => setNewPlanModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Establish Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Progress Update Modal */}
      {goalModal.open && goalModal.goal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Update Goal Progress
            </h3>
            <p className="text-xs text-slate-300 font-semibold">{goalModal.goal.description}</p>

            <form onSubmit={handleUpdateGoalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Status</label>
                <select
                  value={goalModal.status}
                  onChange={(e) => setGoalModal({ ...goalModal, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="active">Active (In Progress)</option>
                  <option value="achieved">Achieved / Met</option>
                  <option value="revised">Revised Target</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clinician Progress Notes</label>
                <textarea
                  rows={3}
                  placeholder="Note progress observed during consultations..."
                  value={goalModal.notes}
                  onChange={(e) => setGoalModal({ ...goalModal, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setGoalModal({ open: false, planId: null, goal: null, status: 'active', notes: '' })}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Save Progress
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
