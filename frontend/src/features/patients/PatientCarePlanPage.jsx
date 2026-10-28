import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clinicalService } from '../../services/clinicalService';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  FileText,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Target,
  Smile,
  ArrowRight
} from 'lucide-react';

export function PatientCarePlanPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    activePlans: [],
    sharedNotes: [],
    homeworkTasks: [],
    recommendations: [],
    reports: []
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('homework');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clinicalService.getPatientPortalRecords();
      setData(res || {
        activePlans: [],
        sharedNotes: [],
        homeworkTasks: [],
        recommendations: [],
        reports: []
      });
    } catch (err) {
      console.error('Failed to load patient clinical portal:', err);
      setError('Could not retrieve your shared clinical records. Please refresh shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleToggleHomework = async (taskId, currentStatus) => {
    const isCompleted = currentStatus !== 'completed';
    try {
      setUpdatingTaskId(taskId);
      await clinicalService.toggleHomeworkStatus(taskId, isCompleted);
      // Local state update
      setData((prev) => ({
        ...prev,
        homeworkTasks: prev.homeworkTasks.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                status: isCompleted ? 'completed' : 'pending',
                completedAt: isCompleted ? new Date().toISOString() : null
              }
            : t
        )
      }));
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Unable to update task completion state. Please try again.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const pendingTasks = data.homeworkTasks.filter((t) => t.status !== 'completed');
  const completedTasks = data.homeworkTasks.filter((t) => t.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 rounded-2xl border border-teal-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Personal Care Plan</Badge>
            <Badge variant="neutral" size="sm">Clinician Shared</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <HeartHandshake className="w-7 h-7 text-teal-400" />
            My Care Plan & Clinical Guidance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review shared treatment goals, check off assigned exercises and homework, and read verified session takeaways from your psychologist.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPortalData}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          Refresh Records
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Assigned Homework
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {pendingTasks.length} <span className="text-xs font-normal text-slate-400">pending</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            {completedTasks.length} exercises completed
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Active Treatment Goals
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {data.activePlans.reduce((acc, p) => acc + (p.goals?.length || 0), 0)}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Across {data.activePlans.length} published care plans
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Clinician Summaries
              </p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">
                {data.sharedNotes.length}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Shared takeaways from your appointments
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'homework'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Homework & Exercises ({data.homeworkTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('treatment')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'treatment'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Treatment Goals ({data.activePlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('summaries')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'summaries'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Session Takeaways ({data.sharedNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'recommendations'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommendations ({data.recommendations.length})</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mx-auto" />
          <p className="text-xs text-slate-400">Loading your verified clinical records...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: HOMEWORK & EXERCISES */}
          {activeTab === 'homework' && (
            <div className="space-y-6">
              {data.homeworkTasks.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                  <EmptyState
                    icon={CheckCircle2}
                    title="No Assigned Homework"
                    description="Your psychologist has not assigned any between-session exercises or homework yet."
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Pending Tasks Column */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending Action ({pendingTasks.length})
                    </h3>

                    {pendingTasks.length === 0 ? (
                      <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
                        <Smile className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-300 font-medium">All caught up!</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          You have completed all assigned exercises.
                        </p>
                      </div>
                    ) : (
                      pendingTasks.map((task) => (
                        <Card
                          key={task.taskId}
                          className="border-slate-800 bg-slate-900 hover:border-teal-500/40 transition-all"
                        >
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-semibold text-slate-100">
                                {task.title}
                              </h4>
                              {task.dueDate && (
                                <Badge variant="neutral" size="sm" className="shrink-0 text-[10px]">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              {task.description}
                            </p>

                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500">
                                Assigned: {new Date(task.createdAt || Date.now()).toLocaleDateString()}
                              </span>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={updatingTaskId === task.taskId}
                                onClick={() => handleToggleHomework(task.taskId, task.status)}
                                className="flex items-center gap-1.5 text-xs"
                              >
                                {updatingTaskId === task.taskId ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                Mark Completed
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Completed Tasks Column */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Completed Exercises ({completedTasks.length})
                    </h3>

                    {completedTasks.length === 0 ? (
                      <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
                        <p className="text-xs text-slate-500">No completed tasks yet.</p>
                      </div>
                    ) : (
                      completedTasks.map((task) => (
                        <Card
                          key={task.taskId}
                          className="border-slate-800/60 bg-slate-900/40 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-xs font-medium text-slate-300 line-through">
                                {task.title}
                              </h4>
                              <Badge variant="green" size="sm" className="text-[10px]">
                                Completed
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {task.description}
                            </p>
                            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                              <span>
                                Finished on: {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recorded'}
                              </span>
                              <button
                                onClick={() => handleToggleHomework(task.taskId, task.status)}
                                className="text-teal-400 hover:underline"
                              >
                                Mark Incomplete
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TREATMENT GOALS */}
          {activeTab === 'treatment' && (
            <div className="space-y-6">
              {data.activePlans.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                  <EmptyState
                    icon={Target}
                    title="No Published Care Plans"
                    description="Your psychologist has not published a formal treatment plan to your portal yet."
                  />
                </Card>
              ) : (
                data.activePlans.map((plan) => (
                  <Card key={plan.planId} className="border-slate-800 bg-slate-900 shadow-md">
                    <CardHeader className="border-b border-slate-800 pb-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="teal" size="sm">Published Care Plan</Badge>
                            <Badge variant="green" size="sm" className="capitalize">{plan.status || 'Active'}</Badge>
                          </div>
                          <h3 className="text-lg font-bold text-slate-100">
                            {plan.title || 'Therapeutic Care Plan'}
                          </h3>
                        </div>
                        {plan.targetDate && (
                          <div className="text-right text-xs text-slate-400">
                            Target Completion: <span className="text-slate-200 font-semibold">{new Date(plan.targetDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {plan.presentingProblem && (
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          <strong className="text-teal-300 font-medium">Focus Area:</strong> {plan.presentingProblem}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Care Objectives & Milestones
                      </h4>

                      {(!plan.goals || plan.goals.length === 0) ? (
                        <p className="text-xs text-slate-500 italic">No specific milestones entered in this plan.</p>
                      ) : (
                        <div className="space-y-3">
                          {plan.goals.map((g, idx) => (
                            <div
                              key={g.goalId || idx}
                              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <h5 className="text-xs font-semibold text-slate-100">
                                    {g.description}
                                  </h5>
                                </div>
                                <Badge
                                  variant={g.status === 'achieved' ? 'green' : g.status === 'in_progress' ? 'teal' : 'neutral'}
                                  size="sm"
                                  className="text-[10px] capitalize shrink-0"
                                >
                                  {g.status ? g.status.replace('_', ' ') : 'In Progress'}
                                </Badge>
                              </div>

                              {g.measurableObjective && (
                                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                                  <span className="text-teal-400 font-medium">Target metric:</span> {g.measurableObjective}
                                </p>
                              )}

                              {g.targetDate && (
                                <div className="text-[10px] text-slate-500 pl-7">
                                  Target Milestone: {new Date(g.targetDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SESSION SUMMARIES */}
          {activeTab === 'summaries' && (
            <div className="space-y-5">
              {data.sharedNotes.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                  <EmptyState
                    icon={BookOpen}
                    title="No Shared Session Summaries"
                    description="When your psychologist shares plain-language session takeaways or summaries, they will appear here."
                  />
                </Card>
              ) : (
                data.sharedNotes.map((note) => (
                  <Card key={note.noteId} className="border-slate-800 bg-slate-900 shadow-md">
                    <CardHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="teal" size="sm">Session Takeaway</Badge>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(note.sessionDate || note.updatedAt || Date.now()).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Clinician: {note.psychologistName || 'Your Psychologist'}
                      </span>
                    </CardHeader>

                    <CardContent className="p-6">
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {note.patientVisibleSummary}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 4: RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {data.recommendations.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                  <EmptyState
                    icon={Sparkles}
                    title="No Shared Recommendations"
                    description="Your psychologist has not published any separate therapeutic recommendations or reading lists yet."
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.recommendations.map((rec) => (
                    <Card key={rec.recommendationId} className="border-slate-800 bg-slate-900 p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="teal" size="sm" className="capitalize">
                          {rec.category || 'Therapeutic Guidance'}
                        </Badge>
                        <span className="text-[10px] text-slate-500">
                          {new Date(rec.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-100">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {rec.description}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
