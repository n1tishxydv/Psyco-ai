import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { analyticsService } from '../../services/analyticsService';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  Activity,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Table,
  LineChart as ChartIcon,
  ShieldAlert,
} from 'lucide-react';

export function PatientProgressDashboard({ patientId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState('phq9');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'

  const [trends, setTrends] = useState(null);
  const [goalMetrics, setGoalMetrics] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [trendRes, goalRes, attRes, timeRes] = await Promise.all([
        analyticsService.getAssessmentTrends(patientId, selectedInstrument),
        analyticsService.getTreatmentGoalProgress(patientId),
        analyticsService.getAttendanceMetrics(patientId),
        analyticsService.getPatientTimeline(patientId),
      ]);
      setTrends(trendRes.data?.data || null);
      setGoalMetrics(goalRes.data?.data || null);
      setAttendance(attRes.data?.data || null);
      setTimeline(timeRes.data?.data?.timeline || []);
    } catch (err) {
      console.error('Failed to load progress analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadData();
    }
  }, [patientId, selectedInstrument]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
        <p className="text-xs">Computing longitudinal progress analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData}>
          Retry
        </Button>
      </div>
    );
  }

  const history = trends?.history || [];
  const hasHistory = history.length > 0;
  const maxScaleScore = selectedInstrument === 'phq9' ? 27 : 21;

  // Compute SVG chart coordinates
  const svgWidth = 650;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 40 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const points = hasHistory
    ? history.map((h, i) => {
        const x =
          history.length === 1
            ? padding.left + chartW / 2
            : padding.left + (i / (history.length - 1)) * chartW;
        const y = padding.top + chartH - (h.score / maxScaleScore) * chartH;
        return { ...h, x, y };
      })
    : [];

  const pathD = points.length > 0 ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '') : '';
  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`
      : '';

  return (
    <div className="space-y-6">
      {/* Top Controls: Instrument Selector & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">Standardized Symptom Trajectory</h3>
            <p className="text-xs text-slate-400">Deterministic longitudinal comparison across verified administrations.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setSelectedInstrument('phq9')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedInstrument === 'phq9' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PHQ-9 (Depression)
            </button>
            <button
              onClick={() => setSelectedInstrument('gad7')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                selectedInstrument === 'gad7' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GAD-7 (Anxiety)
            </button>
          </div>

          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('chart')}
              className={`p-1.5 rounded-md transition ${viewMode === 'chart' ? 'bg-slate-700 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="Chart View"
            >
              <ChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-slate-700 text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trajectory Metrics Header (Baseline vs Latest vs Delta) */}
      {hasHistory ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Baseline Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">{trends.baselineScore}</span>
                <span className="text-xs text-slate-500">/ {maxScaleScore}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {trends.baselineDate ? new Date(trends.baselineDate).toLocaleDateString() : 'Initial'}
              </span>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Latest Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">{trends.latestScore}</span>
                <span className="text-xs text-slate-500">/ {maxScaleScore}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {trends.latestDate ? new Date(trends.latestDate).toLocaleDateString() : 'Current'}
              </span>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Delta</span>
              <div className="flex items-center gap-1.5">
                {trends.scoreDelta < 0 ? (
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                ) : trends.scoreDelta > 0 ? (
                  <TrendingUp className="w-5 h-5 text-rose-400" />
                ) : (
                  <Minus className="w-5 h-5 text-slate-400" />
                )}
                <span className={`text-2xl font-bold ${
                  trends.scoreDelta < 0 ? 'text-emerald-400' : trends.scoreDelta > 0 ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {trends.scoreDelta > 0 ? `+${trends.scoreDelta}` : trends.scoreDelta}
                </span>
                <span className="text-xs text-slate-500">pts</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {trends.percentageChange != null ? `${Math.abs(trends.percentageChange)}% change` : 'No prior baseline'}
              </span>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clinical Trajectory</span>
              <div className="pt-1">
                <Badge
                  variant={
                    trends.trendDirection === 'improved'
                      ? 'green'
                      : trends.trendDirection === 'worsened'
                      ? 'rose'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {(trends.trendDirection || 'stable').toUpperCase()}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-tight">
                {trends.trendSummary || 'Consistent psychometric monitoring.'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
          <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No {selectedInstrument.toUpperCase()} Records Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Assign and complete this assessment to begin plotting symptom progress and trajectory curves over time.
          </p>
        </div>
      )}

      {/* Chart or Table Rendering */}
      {hasHistory && viewMode === 'chart' && (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardContent className="p-6">
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[500px]">
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Severity bands background guidelines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const yVal = padding.top + chartH * (1 - ratio);
                  const scoreLabel = Math.round(ratio * maxScaleScore);
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={yVal}
                        x2={svgWidth - padding.right}
                        y2={yVal}
                        stroke="#334155"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={yVal + 3}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {scoreLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient area under curve */}
                {areaD && <path d={areaD} fill="url(#scoreGradient)" />}

                {/* Score trajectory line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Individual observation points & date labels */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#042f2e"
                      stroke="#2dd4bf"
                      strokeWidth="2"
                      className="cursor-pointer transition hover:scale-125"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      fill="#f1f5f9"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.score}
                    </text>
                    <text
                      x={p.x}
                      y={padding.top + chartH + 18}
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {new Date(p.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 mt-2">
              <span>Higher score = Higher symptom severity</span>
              <span>Lower score = Symptom reduction / Improvement</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accessible Table View */}
      {hasHistory && viewMode === 'table' && (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date Completed</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Severity Classification</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Safety Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((h, i) => (
                  <tr key={h.id || i} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 text-slate-200">
                      {new Date(h.completedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-400">
                      {h.score} / {maxScaleScore}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize">{h.severity?.replace('_', ' ') || 'Normal'}</span>
                    </td>
                    <td className="py-3 px-4">
                      {h.reviewStatus === 'reviewed' ? (
                        <Badge variant="green" size="sm">Reviewed</Badge>
                      ) : (
                        <Badge variant="amber" size="sm">Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {h.safetyTriggered ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Flagged
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Treatment Goals & Attendance Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Treatment Goal Completion Progress */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-bold text-slate-100">Treatment Plan Goal Completion</h4>
              </div>
              <Badge variant="teal" size="sm">
                {goalMetrics?.completionRate != null ? `${goalMetrics.completionRate}% Met` : '0%'}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${goalMetrics?.completionRate || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Completed: <strong className="text-slate-200">{goalMetrics?.completedGoals || 0}</strong></span>
                <span>Active: <strong className="text-slate-200">{goalMetrics?.activeGoals || 0}</strong></span>
                <span>Total: <strong className="text-slate-200">{goalMetrics?.totalGoals || 0}</strong></span>
              </div>
            </div>

            {/* Goals list */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              {goalMetrics?.goals && goalMetrics.goals.length > 0 ? (
                goalMetrics.goals.slice(0, 4).map((g, idx) => (
                  <div key={g.id || idx} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${g.status === 'completed' ? 'text-teal-400' : 'text-slate-500'}`} />
                      <span className="truncate text-slate-200">{g.description}</span>
                    </div>
                    <Badge variant={g.status === 'completed' ? 'green' : 'neutral'} size="sm">
                      {g.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-2 text-center">No individualized goals recorded.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance & Session Reliability */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-bold text-slate-100">Session Attendance & Reliability</h4>
              </div>
              <Badge variant="green" size="sm">
                {attendance?.attendanceRate != null ? `${attendance.attendanceRate}% Attendance` : '100%'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Completed Sessions</span>
                <span className="text-xl font-bold text-slate-100">{attendance?.completedSessions || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Scheduled</span>
                <span className="text-xl font-bold text-slate-100">{attendance?.totalAppointments || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Cancellations</span>
                <span className="text-xl font-bold text-slate-100">{attendance?.cancelledAppointments || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">No-Shows</span>
                <span className="text-xl font-bold text-slate-100">{attendance?.noShows || 0}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              Attendance reflects documented appointments; not an automated indicator of engagement motivation.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Patient Care Timeline */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              <h4 className="text-sm font-bold text-slate-100">Integrated Care Timeline</h4>
            </div>
            <span className="text-xs text-slate-500">{timeline.length} clinical events</span>
          </div>

          <div className="space-y-3 pt-2">
            {timeline.length > 0 ? (
              timeline.slice(0, 8).map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{evt.title}</span>
                      <Badge
                        variant={
                          evt.type === 'session'
                            ? 'teal'
                            : evt.type === 'assessment'
                            ? 'amber'
                            : evt.type === 'goal'
                            ? 'green'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {evt.type}
                      </Badge>
                    </div>
                    {evt.description && <p className="text-xs text-slate-400">{evt.description}</p>}
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                    {new Date(evt.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">No care timeline events recorded.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
