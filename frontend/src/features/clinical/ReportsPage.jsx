import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clinicalService } from '../../services/clinicalService';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import {
  FileText,
  Printer,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Shield,
  Download,
  CheckCircle2,
  Stethoscope,
  Info
} from 'lucide-react';

const REPORT_TYPES = [
  {
    id: 'session_summary',
    name: 'Session Summary',
    description: 'Synthesizes documented clinical notes, interventions, and patient progress from recent sessions.'
  },
  {
    id: 'treatment_summary',
    name: 'Treatment Plan Summary',
    description: 'Summarizes active clinical goals, measurable objectives, target dates, and review milestones.'
  },
  {
    id: 'progress_report',
    name: 'Comprehensive Progress Report',
    description: 'Detailed clinical progress across attendance, goal completion, and therapeutic recommendations.'
  },
  {
    id: 'discharge_summary',
    name: 'Discharge Summary',
    description: 'Final clinical synopsis detailing presenting problems, interventions delivered, outcome status, and follow-up guidance.'
  },
  {
    id: 'appointment_history',
    name: 'Consultation & Attendance Log',
    description: 'Chronological consultation history, modes (telehealth/in-person), and attendance verification.'
  }
];

export function ReportsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('session_summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Generation State
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch assigned patients on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchPatients() {
      try {
        setLoadingPatients(true);
        setError(null);
        const data = await clinicalService.getAssignedPatients();
        if (!isMounted) return;

        let normalizedList = [];
        if (Array.isArray(data)) {
          normalizedList = data;
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.data?.patients)) {
            normalizedList = data.data.patients;
          } else if (Array.isArray(data.patients)) {
            normalizedList = data.patients;
          } else if (Array.isArray(data.data)) {
            normalizedList = data.data;
          }
        }

        setPatients(normalizedList);
        if (normalizedList.length > 0) {
          const firstId = normalizedList[0].patientId || normalizedList[0].id || '';
          setSelectedPatientId(firstId);
        } else {
          setSelectedPatientId('');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load assigned patients:', err);
        setError(err?.message || 'Could not load assigned patient roster.');
        setPatients([]);
      } finally {
        if (isMounted) {
          setLoadingPatients(false);
        }
      }
    }
    fetchPatients();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select a patient.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setGeneratedReport(null);

      const payload = {
        reportType: selectedReportType,
        dateRange: {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        },
        additionalNotes: additionalNotes.trim() || undefined
      };

      const res = await clinicalService.generateReport(selectedPatientId, payload);
      const normalizedReport = res?.data?.report || res?.report || res?.data || res;
      setGeneratedReport(normalizedReport);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err?.message || 'Error generating clinical report from records.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!generatedReport) return;
    const sectionsText = Array.isArray(generatedReport.sections)
      ? generatedReport.sections.map(s => `${(s.title || '').toUpperCase()}:\n${s.content || ''}`).join('\n\n')
      : '';
    const text = `PSYCO AI CLINICAL REPORT: ${generatedReport.title || 'Summary'}\n` +
      `Date: ${new Date(generatedReport.generatedAt || Date.now()).toLocaleDateString()}\n` +
      `Patient ID: ${generatedReport.patientId || 'N/A'}\n` +
      `Clinician: ${generatedReport.psychologistName || user?.fullName || 'Psychologist'}\n\n` +
      `SUMMARY:\n${generatedReport.summary || 'N/A'}\n\n` +
      sectionsText;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const safePatients = Array.isArray(patients) ? patients : [];
  const selectedPatient = safePatients.find(
    p => (p?.patientId && p.patientId === selectedPatientId) || (p?.id && p.id === selectedPatientId)
  ) || null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Clinical Documentation</Badge>
            <Badge variant="neutral" size="sm">Text & JSON Authoritative</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <FileText className="w-7 h-7 text-teal-400" />
            Clinical Report Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Synthesize formal clinical reports, progress evaluations, and attendance records from verified chart data.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Generator Controls + Report Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <Card className="border-slate-800 bg-slate-900 shadow-md">
            <CardHeader className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                Report Parameters
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select patient, report scope, and optional period constraints.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGenerateReport} className="space-y-5">
                {/* Patient Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Select Patient <span className="text-teal-400">*</span>
                  </label>
                  {loadingPatients ? (
                    <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                      Loading assigned roster...
                    </div>
                  ) : safePatients.length === 0 ? (
                    <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
                      No patients assigned yet. Consultations must be booked first.
                    </div>
                  ) : (
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                    >
                      {safePatients.map((p) => {
                        const pid = p?.patientId || p?.id;
                        return (
                          <option key={pid} value={pid}>
                            {p?.name || p?.fullName || p?.email || pid} ({p?.totalSessions || 0} sessions)
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Report Type Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Report Type <span className="text-teal-400">*</span>
                  </label>
                  <div className="space-y-2">
                    {REPORT_TYPES.map((type) => {
                      const isSelected = selectedReportType === type.id;
                      return (
                        <label
                          key={type.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-950/30 border-teal-500/50 text-slate-100 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportType"
                            value={type.id}
                            checked={isSelected}
                            onChange={() => setSelectedReportType(type.id)}
                            className="mt-0.5 text-teal-500 focus:ring-teal-400"
                          />
                          <div>
                            <div className={`text-xs font-semibold ${isSelected ? 'text-teal-300' : 'text-slate-200'}`}>
                              {type.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                              {type.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Date Constraints */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      From Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      To Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                {/* Additional Clinical Annotations */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Clinician Impressions / Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Enter any tailored observations or diagnostic qualifiers to attach to this formal summary..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={generating || !selectedPatientId || safePatients.length === 0}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Synthesizing Chart Records...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Official Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Privacy Notice Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Strict Storage & Privacy Standard</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Reports are synthesized directly from authenticated Realtime Database records. Authoritative copies persist as structured JSON text. PDF rendering is generated on-demand without binary file archive storage.
            </p>
          </div>
        </div>

        {/* Right Column: Generated Report Preview & Document Canvas */}
        <div className="lg:col-span-7">
          {generatedReport ? (
            <div className="space-y-4">
              {/* Document Action Bar */}
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 print:hidden">
                <div className="flex items-center gap-2">
                  <Badge variant="green" size="sm">Report Synthesized</Badge>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Ref: <code className="text-teal-300 font-mono text-[11px]">{generatedReport.reportId?.slice(0, 10)}</code>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Text
                      </>
                    )}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Export PDF
                  </Button>
                </div>
              </div>

              {/* The Printed Document Canvas (Clean white paper style for professional printing) */}
              <div className="bg-slate-950 sm:bg-white sm:text-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-800 sm:border-slate-300 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 space-y-6">
                {/* Clinic Header */}
                <div className="flex items-start justify-between border-b sm:border-slate-300 pb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-teal-400 sm:text-slate-900">
                      Psyco AI Practice Management
                    </h2>
                    <p className="text-xs text-slate-400 sm:text-slate-600 mt-0.5">
                      Clinical Psychology & Outpatient Care Suite
                    </p>
                    <p className="text-[11px] text-slate-500 sm:text-slate-500">
                      Authoritative Clinical Summary Document
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-300 sm:text-slate-800">
                      CONFIDENTIAL
                    </div>
                    <div className="text-[11px] text-slate-400 sm:text-slate-600">
                      Generated: {new Date(generatedReport.generatedAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Patient & Provider Demographics Banner */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 sm:bg-slate-100 text-xs">
                  <div>
                    <div className="font-semibold text-slate-200 sm:text-slate-900">
                      Patient: {selectedPatient?.name || generatedReport.patientName || 'Confidential Patient'}
                    </div>
                    <div className="text-slate-400 sm:text-slate-600 mt-0.5">
                      Email / ID: {selectedPatient?.email || generatedReport.patientId}
                    </div>
                    <div className="text-slate-400 sm:text-slate-600">
                      Intake Status: {selectedPatient?.intakeStatus === 'submitted' ? 'Verified Intake' : 'Standard'}
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <div className="font-semibold text-slate-200 sm:text-slate-900">
                      Clinician: {generatedReport.psychologistName || user?.fullName || 'Attending Psychologist'}
                    </div>
                    <div className="text-slate-400 sm:text-slate-600 mt-0.5">
                      License: {user?.profile?.licenseNumber || 'Verified Practice'}
                    </div>
                    <div className="text-slate-400 sm:text-slate-600">
                      Scope: Clinical Psychology
                    </div>
                  </div>
                </div>

                {/* Report Title */}
                <div>
                  <h3 className="text-lg font-bold text-slate-100 sm:text-slate-900 border-b sm:border-slate-200 pb-2">
                    {generatedReport.title || 'Clinical Evaluation & Summary'}
                  </h3>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 sm:text-teal-800">
                    Executive Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 sm:text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {generatedReport.summary || 'Summary compiled from documented clinical notes and verified consultation history.'}
                  </p>
                </div>

                {/* Report Sections */}
                {generatedReport.sections && generatedReport.sections.length > 0 && (
                  <div className="space-y-5 pt-2">
                    {generatedReport.sections.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 sm:text-teal-800 border-b sm:border-slate-200 pb-1">
                          {section.title}
                        </h4>
                        <div className="text-xs sm:text-sm text-slate-300 sm:text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Clinician Annotations if supplied */}
                {generatedReport.additionalNotes && (
                  <div className="space-y-2 pt-2 border-t sm:border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 sm:text-teal-800">
                      Clinician Remarks & Diagnostic Qualifiers
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 sm:text-slate-800 leading-relaxed whitespace-pre-wrap italic">
                      "{generatedReport.additionalNotes}"
                    </p>
                  </div>
                )}

                {/* Formal Signature Block */}
                <div className="pt-8 border-t sm:border-slate-300 flex items-end justify-between">
                  <div className="text-[11px] text-slate-500 sm:text-slate-600 max-w-sm">
                    This document was compiled from clinical entries in Psyco AI. Electronic records maintain verifiable audit histories and revision timestamps.
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-200 sm:text-slate-900 text-xs">
                      {generatedReport.psychologistName || user?.fullName || 'Psychologist'}
                    </div>
                    <div className="text-[11px] text-slate-400 sm:text-slate-600">
                      Licensed Clinical Psychologist
                    </div>
                    <div className="text-[10px] text-emerald-400 sm:text-emerald-700 font-mono mt-1">
                      [Digitally Certified: {new Date().toLocaleDateString()}]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
              <EmptyState
                icon={FileText}
                title="No Report Preview Active"
                description="Select a patient from your assigned roster, configure report scope on the left, and click 'Generate Official Report'."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
