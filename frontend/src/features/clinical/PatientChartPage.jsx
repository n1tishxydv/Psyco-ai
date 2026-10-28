import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { EmptyState } from '../../components/common/EmptyState';
import { clinicalService } from '../../services/clinicalService';
import { assessmentService } from '../../services/assessmentService';
import { AssignAssessmentModal } from '../assessments/AssignAssessmentModal';
import { AssessmentResultViewerModal } from '../assessments/AssessmentResultViewerModal';
import { PatientProgressDashboard } from '../analytics/PatientProgressDashboard';
import { RiskReviewBanner } from './RiskReviewBanner';
import { DocumentationQualityWidget } from './DocumentationQualityWidget';
import {
  User,
  ClipboardList,
  Calendar,
  FileText,
  Target,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Plus,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Activity,
  ShieldAlert,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'intake', label: 'Intake Review', icon: ClipboardList },
  { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
  { id: 'analytics', label: 'Progress Analytics', icon: Activity },
  { id: 'appointments', label: 'Appointments & Sessions', icon: Calendar },
  { id: 'notes', label: 'Clinical Notes', icon: FileText },
  { id: 'plans', label: 'Treatment Plans', icon: Target },
  { id: 'tasks', label: 'Homework & Tasks', icon: CheckSquare },
  { id: 'recs', label: 'Recommendations', icon: Sparkles },
];

export function PatientChartPage() {
  const { patientId } = useParams();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [newTaskModal, setNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [newRecModal, setNewRecModal] = useState(false);
  const [recCategory, setRecCategory] = useState('therapeutic_exercise');
  const [recTitle, setRecTitle] = useState('');
  const [recDetails, setRecDetails] = useState('');

  // Phase 7 Assessment Modals & Data State
  const [assignAssessmentModal, setAssignAssessmentModal] = useState(false);
  const [viewResultModal, setViewResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [assessmentAssignments, setAssessmentAssignments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  const loadAssessments = async () => {
    try {
      setAssessmentsLoading(true);
      const [resRes, assignRes] = await Promise.all([
        assessmentService.getPatientResults(patientId),
        assessmentService.getPatientAssignments(patientId),
      ]);
      setAssessmentResults(resRes.data?.data?.results || []);
      setAssessmentAssignments(assignRes.data?.data?.assignments || []);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clinicalService.getPatientChart(patientId);
      setChart(res.data?.chart || null);
    } catch (err) {
      console.error('Failed to load patient chart:', err);
      setError(err.message || 'Failed to fetch patient chart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchChart();
      loadAssessments();
    }
  }, [patientId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await clinicalService.createTask({
        patientId,
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate || undefined,
        sharedWithPatient: true,
      });
      setNewTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      await fetchChart();
    } catch (err) {
      alert(`Error assigning task: ${err.message}`);
    }
  };

  const handleCreateRec = async (e) => {
    e.preventDefault();
    try {
      await clinicalService.createRecommendation({
        patientId,
        category: recCategory,
        title: recTitle,
        details: recDetails,
        sharedWithPatient: true,
      });
      setNewRecModal(false);
      setRecTitle('');
      setRecDetails('');
      await fetchChart();
    } catch (err) {
      alert(`Error adding recommendation: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
        Loading clinical medical chart...
      </div>
    );
  }

  if (error || !chart) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <h3 className="text-lg font-bold">Chart Access Restricted</h3>
          <p className="text-xs text-rose-400 mt-1">{error || 'Patient record could not be loaded.'}</p>
          <Link to="/psychologist/patients">
            <Button variant="secondary" size="sm" className="mt-4">
              Return to Patient Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { patient, intake, appointments, sessions, notes, treatmentPlans, tasks, recommendations } = chart;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation & Patient Header */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/psychologist/patients" className="hover:text-slate-200 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Patient Directory
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">{patient.fullName}</span>
      </div>

      <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={patient.fullName} email={patient.email} size="lg" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="green" size="sm">Active Clinical Chart</Badge>
              <Badge variant="neutral" size="sm">
                {patient.gender} • {patient.age ? `${patient.age} yrs` : 'Age unrecorded'}
              </Badge>
              {patient.intakeStatus === 'submitted' && (
                <Badge variant="teal" size="sm">Intake Signed</Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              {patient.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Contact: {patient.email} {patient.phone ? `• ${patient.phone}` : ''} • Timezone: {patient.timezone || 'Asia/Kolkata'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/psychologist/reports?patientId=${patient.id}`}>
            <Button variant="secondary" size="sm">
              Generate Report
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={fetchChart} className="text-slate-400 hover:text-slate-200">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Clinical Risk Review Banner */}
      <RiskReviewBanner patientId={patientId} onFlagUpdated={() => { fetchChart(); loadAssessments(); }} />

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto space-x-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-800 md:col-span-2 space-y-4 p-6">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Patient Demographics & Clinical Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Full Legal Name:</span>
                <span className="font-semibold text-slate-200">{patient.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Preferred Name:</span>
                <span className="font-semibold text-slate-200">{patient.preferredName || 'Same as legal'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Email:</span>
                <span className="font-semibold text-slate-200">{patient.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number:</span>
                <span className="font-semibold text-slate-200">{patient.phone || 'Unrecorded'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Total Practice Consultations:</span>
                <span className="font-semibold text-slate-200">{appointments.length} scheduled</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Active Treatment Plan:</span>
                <span className="font-semibold text-emerald-400">
                  {treatmentPlans.find((p) => p.status === 'active')?.title || 'None active'}
                </span>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Emergency Point of Contact</h4>
              {patient.emergencyContact?.name ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 block">Name:</span>
                    <span className="text-slate-200 font-medium">{patient.emergencyContact.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Relationship:</span>
                    <span className="text-slate-200 font-medium">{patient.emergencyContact.relationship}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Phone:</span>
                    <span className="text-slate-200 font-medium">{patient.emergencyContact.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No emergency contact recorded.</p>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200">Clinical Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
                  onClick={() => setActiveTab('appointments')}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  View Consultations
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs flex items-center justify-center gap-1.5"
                  onClick={() => setActiveTab('notes')}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Document Session Notes
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs flex items-center justify-center gap-1.5"
                  onClick={() => setActiveTab('plans')}
                >
                  <Target className="w-3.5 h-3.5" />
                  Manage Treatment Plan
                </Button>
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-5 space-y-2">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Data Protection Guard
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All records in this clinical chart are protected under medical privacy protocols. Unassigned clinicians and system administrators cannot access psychotherapy notes or psychological interpretations.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Intake Review */}
      {activeTab === 'intake' && (
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                Confidential Patient Intake Questionnaire
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Completed and electronically signed by patient prior to initial assessment.
              </p>
            </div>
            <Badge variant={intake?.status === 'submitted' ? 'green' : 'amber'} size="sm">
              {intake?.status === 'submitted' ? 'Signed & Submitted' : 'Not Completed'}
            </Badge>
          </div>

          {!intake || !intake.sectionB ? (
            <EmptyState
              icon={ClipboardList}
              title="Intake Questionnaire Not Yet Submitted"
              description="The patient has not finalized their intake assessment survey. Once submitted, their medical history, presenting concerns, and therapy goals will appear here."
            />
          ) : (
            <div className="space-y-6 text-xs">
              {/* Section B: Presenting concerns */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-emerald-400">Primary Reasons for Therapy & Goals</h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Presenting Symptoms / Diagnoses:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(intake.sectionB.primaryReasons || []).map((r, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-medium">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Symptom Duration:</span>
                    <span className="text-slate-200">{intake.sectionB.symptomDuration || 'Unspecified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Self-Reported Distress Rating:</span>
                    <span className="text-slate-200 font-bold">{intake.sectionB.severityRating || 'N/A'}/10</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Patient Goals for Therapy:</span>
                    <p className="text-slate-200 italic">{intake.sectionB.therapyGoals || 'None stated'}</p>
                  </div>
                </div>
              </div>

              {/* Section C: Medical & Mental Health Background */}
              {intake.sectionC && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-teal-400">Medical & Psychiatric Background</h4>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Prior Mental Health Therapy:</span>
                      <span className="text-slate-200">{intake.sectionC.previousTherapy ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Current Medications:</span>
                      <span className="text-slate-200">{intake.sectionC.currentMedications || 'None recorded'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Medical Conditions:</span>
                      <span className="text-slate-200">{intake.sectionC.medicalConditions || 'None recorded'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Phase 7 Tab: Standardized Assessments */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Standardized Psychometric Assessments</h3>
                <p className="text-xs text-slate-400">
                  Administer verified PHQ-9, GAD-7, and C-SSRS instruments. Scores are evaluated deterministically.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAssignAssessmentModal(true)}
              className="flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Assign New Assessment
            </Button>
          </div>

          {/* Section 1: Completed Assessment Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Completed Results & Clinical History ({assessmentResults.length})
              </h4>
              <span className="text-[11px] text-slate-500">Official scoring algorithm versions preserved</span>
            </div>

            {assessmentsLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                Loading psychometric records...
              </div>
            ) : assessmentResults.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center">
                <EmptyState
                  icon={ClipboardCheck}
                  title="No Completed Assessments"
                  description="Standardized questionnaires completed by this patient will appear here with score breakdowns and safety triggers."
                  actionLabel="Assign First Assessment"
                  onAction={() => setAssignAssessmentModal(true)}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessmentResults.map((res) => (
                  <Card key={res.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-100">{res.instrumentName || res.instrumentId}</h4>
                            <span className="text-[10px] font-mono text-slate-400">v{res.instrumentVersion}</span>
                          </div>
                          <span className="text-xs text-slate-400 block">
                            Completed: {new Date(res.completedAt || res.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {res.reviewStatus === 'reviewed' ? (
                            <Badge variant="green" size="sm">Reviewed</Badge>
                          ) : (
                            <Badge variant="amber" size="sm">Pending Review</Badge>
                          )}
                          {res.safetyTriggered && (
                            <Badge variant="rose" size="sm" className="flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Safety Alert
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Score Highlight Box */}
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block">Calculated Score</span>
                          <span className="text-xl font-bold text-slate-100 font-mono">
                            {res.score ?? 'N/A'} {res.maxScore && <span className="text-xs text-slate-400">/ {res.maxScore}</span>}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Severity Bracket</span>
                          <span className="text-xs font-semibold text-teal-300 capitalize">
                            {res.severity?.replace('_', ' ') || 'Screening Complete'}
                          </span>
                        </div>
                      </div>

                      {res.clinicianReviewNotes && (
                        <div className="text-xs text-slate-300 bg-slate-800/20 p-2.5 rounded-lg border border-slate-800/80">
                          <strong className="text-teal-400 block text-[11px] mb-0.5">Clinician Note:</strong>
                          <p className="line-clamp-2">{res.clinicianReviewNotes}</p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedResult(res);
                            setViewResultModal(true);
                          }}
                          className="text-xs w-full sm:w-auto"
                        >
                          Inspect Responses & Record Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Pending Assignments */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Pending Assigned Questionnaires ({assessmentAssignments.filter(a => a.status === 'assigned' || a.status === 'pending').length})
            </h4>

            {assessmentAssignments.filter(a => a.status === 'assigned' || a.status === 'pending').length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-900/40 rounded-xl text-center border border-slate-800/60">
                No active pending assignments awaiting completion by this patient.
              </p>
            ) : (
              <div className="space-y-2">
                {assessmentAssignments.filter(a => a.status === 'assigned' || a.status === 'pending').map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 uppercase">{a.instrumentId}</span>
                        <Badge variant="teal" size="sm">Awaiting Patient Submission</Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Assigned on {new Date(a.assignedAt || a.createdAt).toLocaleDateString()}
                        {a.instructions && ` • "${a.instructions}"`}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">ID: {a.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 7 Tab: Longitudinal Progress Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <PatientProgressDashboard patientId={patientId} />
          <div className="pt-2">
            <DocumentationQualityWidget patientId={patientId} />
          </div>
        </div>
      )}

      {/* Tab 3: Appointments & Sessions */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Practice Consultations & Clinical Sessions
            </h3>
            <Badge variant="neutral" size="sm">{appointments.length} Total Appointments</Badge>
          </div>

          {appointments.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <EmptyState
                icon={Calendar}
                title="No Appointments Scheduled"
                description="This patient has no consultation records with your practice."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <Card key={apt.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100">
                          {apt.date || apt.startTime?.split('T')[0]}
                        </span>
                        <Badge
                          variant={
                            apt.status === 'confirmed'
                              ? 'green'
                              : apt.status === 'pending'
                              ? 'amber'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {apt.status}
                        </Badge>
                        <Badge variant="neutral" size="sm" className="capitalize">
                          {apt.sessionMode || apt.mode}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {apt.startTime?.split('T')[1]?.slice(0, 5)} - {apt.endTime?.split('T')[1]?.slice(0, 5)} ({apt.durationMinutes || 50} mins)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/psychologist/sessions/ses_${apt.id.replace(/^apt_/, '')}/transcript`}>
                        <Button variant="outline" size="sm" className="text-xs border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                          Transcript Studio
                        </Button>
                      </Link>
                      <Link to={`/psychologist/sessions/appointment/${apt.id}`}>
                        <Button variant="primary" size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                          Open Session Workspace
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Clinical Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Session Documentation & Notes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                SOAP, DAP, BIRP, and General clinical records. Finalized notes are locked and amended with version histories.
              </p>
            </div>
            <Badge variant="neutral" size="sm">{notes.length} Notes</Badge>
          </div>

          {notes.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <EmptyState
                icon={FileText}
                title="No Clinical Notes Recorded"
                description="Clinical notes can be composed directly from the Session Workspace."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((n) => (
                <Card key={n.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="teal" size="sm">{n.format} Format</Badge>
                        <Badge variant={n.status === 'finalized' ? 'green' : n.status === 'amended' ? 'amber' : 'neutral'} size="sm">
                          {n.status === 'finalized' ? 'Finalized & Signed' : n.status === 'amended' ? `Amended (v${n.version})` : 'Draft'}
                        </Badge>
                        {n.sharedWithPatient && (
                          <Badge variant="neutral" size="sm" className="text-emerald-400 border-emerald-500/30">
                            Shared Summary Visible
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        Recorded: {n.createdAt?.split('T')[0]}
                      </span>
                    </div>

                    {/* Content breakdown */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      {Object.entries(n.content || {}).map(([sec, txt]) => (
                        <div key={sec}>
                          <span className="font-semibold text-emerald-400 uppercase tracking-wide text-[11px] block">
                            {sec}:
                          </span>
                          <p className="text-slate-200 mt-0.5 leading-relaxed">{txt || 'N/A'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Shared Patient Summary */}
                    {n.patientVisibleSummary && (
                      <div className="p-3 bg-teal-950/20 border border-teal-500/30 rounded-xl text-xs">
                        <span className="text-teal-400 font-semibold block mb-0.5">
                          Patient-Visible Summary:
                        </span>
                        <p className="text-slate-300 italic">{n.patientVisibleSummary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Treatment Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Treatment Plans & Goals
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Structured clinical goals, interventions, review dates, and patient portal visibility.
              </p>
            </div>
            <Link to="/psychologist/treatment-plans">
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New Treatment Plan
              </Button>
            </Link>
          </div>

          {treatmentPlans.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <EmptyState
                icon={Target}
                title="No Treatment Plans Established"
                description="Create a structured clinical treatment plan with customized goals and objectives."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {treatmentPlans.map((plan) => (
                <Card key={plan.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-100">{plan.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Presenting: {plan.presentingProblem}
                        </p>
                      </div>
                      <Badge variant={plan.status === 'active' ? 'green' : 'neutral'} size="sm">
                        {plan.status}
                      </Badge>
                    </div>

                    {/* Goals list */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">Goals & Objectives:</span>
                      {(plan.goals || []).map((g, idx) => (
                        <div key={g.id || idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-200">{g.description}</span>
                            {g.measurableObjective && (
                              <p className="text-slate-400 text-[11px] mt-0.5">Objective: {g.measurableObjective}</p>
                            )}
                          </div>
                          <Badge variant={g.status === 'achieved' ? 'green' : 'teal'} size="sm">
                            {g.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Tasks & Homework */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                Assigned Homework & Follow-Up Tasks
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasks assigned for between-session practice. Track completion in real-time.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
              onClick={() => setNewTaskModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Task
            </Button>
          </div>

          {tasks.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <EmptyState
                icon={CheckSquare}
                title="No Homework Tasks Assigned"
                description="Assign therapeutic exercises, reflection journals, or behavioral experiments."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <Card key={t.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{t.title}</span>
                        <Badge variant={t.status === 'completed' ? 'green' : 'amber'} size="sm">
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-slate-300 mt-1">{t.description}</p>
                      {t.dueDate && (
                        <span className="text-slate-400 text-[11px] block mt-1">Due: {t.dueDate}</span>
                      )}
                      {t.patientNotes && (
                        <p className="text-teal-400 italic text-[11px] mt-1 bg-teal-950/20 p-2 rounded-lg">
                          Patient response: "{t.patientNotes}"
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Recommendations */}
      {activeTab === 'recs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Clinical Recommendations & Resources
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Therapeutic exercises, reading, referrals, and wellness recommendations.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs flex items-center gap-1.5"
              onClick={() => setNewRecModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Recommendation
            </Button>
          </div>

          {recommendations.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 p-8 text-center">
              <EmptyState
                icon={Sparkles}
                title="No Clinical Recommendations Recorded"
                description="Share actionable recommendations with your patient."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((r) => (
                <Card key={r.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <Badge variant="teal" size="sm" className="capitalize">
                        {r.category?.replace('_', ' ')}
                      </Badge>
                      <span className="text-slate-400 text-[11px]">{r.createdAt?.split('T')[0]}</span>
                    </div>
                    <h4 className="font-semibold text-slate-100 text-sm">{r.title}</h4>
                    <p className="text-slate-300 leading-relaxed">{r.details}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Task Modal */}
      {newTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Assign Homework Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Daily 10-Minute Thought Record"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  placeholder="Specific directions for between-session practice..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setNewTaskModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Assign Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Recommendation Modal */}
      {newRecModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Add Clinical Recommendation
            </h3>
            <form onSubmit={handleCreateRec} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={recCategory}
                  onChange={(e) => setRecCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="therapeutic_exercise">Therapeutic Exercise (Mindfulness, CBT)</option>
                  <option value="lifestyle">Sleep & Lifestyle Hygiene</option>
                  <option value="reading">Recommended Reading & Bibliotherapy</option>
                  <option value="referral">Clinical / Medical Referral</option>
                  <option value="other">General Recommendation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Diaphragmatic Breathing 4-7-8 Technique"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Details & Rationale</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Clinical guidance and directions for the patient..."
                  value={recDetails}
                  onChange={(e) => setRecDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setNewRecModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Record Recommendation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phase 7 Assessment Modals */}
      <AssignAssessmentModal
        patientId={patientId}
        patientName={patient?.fullName}
        isOpen={assignAssessmentModal}
        onClose={() => setAssignAssessmentModal(false)}
        onAssigned={loadAssessments}
      />

      <AssessmentResultViewerModal
        result={selectedResult}
        isOpen={viewResultModal}
        onClose={() => {
          setViewResultModal(false);
          setSelectedResult(null);
        }}
        onReviewed={loadAssessments}
      />
    </div>
  );
}
