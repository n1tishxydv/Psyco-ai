import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { intakeService } from '../../services/intakeService';
import {
  ClipboardCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  PhoneCall,
  User,
  Activity,
  FileText,
  Lock,
  Edit3,
} from 'lucide-react';

const CONCERN_OPTIONS = [
  'Generalized Anxiety',
  'Panic Attacks',
  'Depression & Low Mood',
  'Work & Career Burnout',
  'Relationship / Marital Stress',
  'Trauma & PTSD',
  'Grief & Bereavement',
  'Sleep Disturbances / Insomnia',
  'ADHD / Focus Challenges',
  'Self-Esteem & Identity',
  'Life Transitions',
];

export function PatientIntakePage() {
  const { user, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [stepError, setStepError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Symptoms, 2 = Medical History, 3 = Review & Consent
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Intake State Structure matching Backend Zod Schema
  const [intakeData, setIntakeData] = useState({
    status: 'draft',
    sectionA: {
      occupation: '',
      maritalStatus: 'Single',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
    },
    sectionB: {
      primaryReasons: [],
      symptomDuration: '1-6 months',
      severityRating: 6,
      therapyGoals: '',
    },
    sectionC: {
      previousTherapy: false,
      previousDiagnoses: '',
      currentMedications: '',
      familyMentalHealthHistory: '',
      medicalConditions: '',
    },
    sectionD: {
      sleepQuality: 'fair',
      exerciseFrequency: 'occasional',
      supportSystemRating: 3,
      substanceUseDetails: '',
    },
    sectionE: {
      suicidalIdeationPastMonth: false,
      selfHarmHistory: false,
      immediateRiskAcknowledged: false,
      safetyNotes: '',
    },
    sectionF: {
      consentToTreatment: false,
      aiAssistanceAcknowledged: false,
      telehealthConsent: false,
      privacyNoticeAcknowledged: false,
      signatureName: user?.fullName || '',
    },
  });

  // Load existing intake on mount
  useEffect(() => {
    async function loadIntake() {
      try {
        const res = await intakeService.getMyIntake();
        if (res?.data?.intake && res.data.intake.status !== 'not_started') {
          setIntakeData((prev) => ({
            ...prev,
            ...res.data.intake,
            sectionF: {
              ...prev.sectionF,
              signatureName: res.data.intake.sectionF?.signatureName || user?.fullName || '',
              ...(res.data.intake.sectionF || {}),
            },
          }));
          if (res.data.intake.updatedAt) {
            setLastSavedTime(new Date(res.data.intake.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch existing intake:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadIntake();
  }, [user]);

  // Handle Crisis Screening Check
  const handleSafetyChange = (field, value) => {
    const updatedSectionE = { ...intakeData.sectionE, [field]: value };
    setIntakeData({ ...intakeData, sectionE: updatedSectionE });

    if ((field === 'suicidalIdeationPastMonth' || field === 'immediateRiskAcknowledged') && value === true) {
      setShowCrisisModal(true);
    }
  };

  // Toggle Concern Tags
  const toggleConcern = (concern) => {
    const current = intakeData.sectionB.primaryReasons || [];
    if (current.includes(concern)) {
      setIntakeData({
        ...intakeData,
        sectionB: {
          ...intakeData.sectionB,
          primaryReasons: current.filter((c) => c !== concern),
        },
      });
    } else {
      setIntakeData({
        ...intakeData,
        sectionB: {
          ...intakeData.sectionB,
          primaryReasons: [...current, concern],
        },
      });
    }
  };

  // Save Draft (Secure, authenticated, patient-scoped backend persistence)
  const handleSaveDraft = async () => {
    setErrorMsg(null);
    setStepError(null);
    setSuccessMsg(null);
    setSavingDraft(true);

    try {
      await intakeService.saveDraft(intakeData);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      setSuccessMsg(`Draft intake saved securely at ${timeStr}. You can return and complete it anytime.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    setStepError(null);
    if (!intakeData.sectionA.emergencyContactName?.trim()) {
      setStepError('Please enter your emergency contact full name in Step 1.');
      return false;
    }
    if (!intakeData.sectionA.emergencyContactPhone?.trim()) {
      setStepError('Please enter your emergency contact phone number in Step 1.');
      return false;
    }
    if (!intakeData.sectionB.primaryReasons || intakeData.sectionB.primaryReasons.length === 0) {
      setStepError('Please select at least one primary concern/symptom in Step 1.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    setStepError(null);
    // Medical & History are optional except safety questionnaire awareness
    return true;
  };

  // Step 3 Validation & Final Submit
  const handleSubmitFinal = async () => {
    setErrorMsg(null);
    setStepError(null);
    setSubmitting(true);

    try {
      if (!validateStep1()) {
        setCurrentStep(1);
        throw new Error('Please complete all required fields in Step 1 (Symptoms & Contact).');
      }

      if (
        !intakeData.sectionF.consentToTreatment ||
        !intakeData.sectionF.aiAssistanceAcknowledged ||
        !intakeData.sectionF.telehealthConsent ||
        !intakeData.sectionF.privacyNoticeAcknowledged
      ) {
        throw new Error('Please review and check all 4 required clinical consent items in Step 3.');
      }

      if (!intakeData.sectionF.signatureName || intakeData.sectionF.signatureName.trim().length < 2) {
        throw new Error('Please enter your full legal name as your digital signature in Step 3.');
      }

      const payload = {
        ...intakeData,
        sectionA: {
          ...intakeData.sectionA,
          emergencyContactRelationship: intakeData.sectionA.emergencyContactRelationship?.trim() || 'Contact',
        },
        sectionB: {
          ...intakeData.sectionB,
          therapyGoals: intakeData.sectionB.therapyGoals?.trim() || 'Improve mental health and overall well-being',
        },
      };

      const res = await intakeService.submitIntake(payload);
      setIntakeData(res.data.intake);
      setSuccessMsg('Your clinical intake questionnaire has been successfully submitted and verified.');
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please verify all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setStepError(null);
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <LoadingSpinner size="lg" className="text-teal-400 mb-4" />
        <p className="text-sm text-slate-400">Loading your confidential clinical intake form...</p>
      </div>
    );
  }

  const isSubmitted = intakeData.status === 'submitted';

  const threeSteps = [
    { num: 1, title: 'Symptoms & Concerns', description: 'Presenting issues, goals & contact', icon: Activity },
    { num: 2, title: 'Medical History', description: 'Clinical history, lifestyle & safety', icon: FileText },
    { num: 3, title: 'Review & Consent', description: 'Summary, disclosures & signature', icon: ClipboardCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Confidential Intake Assessment</Badge>
            {isSubmitted ? (
              <Badge variant="green" size="sm">Submitted & Verified</Badge>
            ) : (
              <Badge variant="neutral" size="sm">Draft in Progress</Badge>
            )}
            {lastSavedTime && !isSubmitted && (
              <span className="text-[11px] text-slate-400">
                (Saved at {lastSavedTime})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Patient Clinical Intake
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            This confidential assessment helps your psychologist personalize your treatment plan and clinical sessions.
          </p>
        </div>

        {!isSubmitted && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex items-center gap-2 self-start sm:self-auto text-xs"
          >
            {savingDraft ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            Save Draft
          </Button>
        )}
      </div>

      {errorMsg && <AlertBanner type="error" title="Intake Form Error" message={errorMsg} />}
      {stepError && <AlertBanner type="error" title="Required Fields Incomplete" message={stepError} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Persistent 3-Step Progress Indicator */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {threeSteps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num || isSubmitted;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < currentStep || isSubmitted) {
                  setCurrentStep(s.num);
                } else if (s.num === 2 && validateStep1()) {
                  setCurrentStep(2);
                } else if (s.num === 3 && validateStep1() && validateStep2()) {
                  setCurrentStep(3);
                }
              }}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-teal-950/40 border-teal-500 text-teal-300 shadow-md ring-1 ring-teal-500/30'
                  : isDone
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                  : 'bg-slate-950/50 border-slate-800/60 text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold tracking-wider uppercase">
                  Step {s.num} of 3
                </span>
                {isDone && !isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="text-xs sm:text-sm font-semibold truncate text-slate-100">{s.title}</div>
              <div className="text-[11px] text-slate-400 hidden sm:block truncate mt-0.5">{s.description}</div>
            </button>
          );
        })}
      </div>

      {/* Submitted View */}
      {isSubmitted && (
        <Card className="border-emerald-500/30 bg-emerald-950/20 shadow-xl">
          <CardContent className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Intake Completed & Verified</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Your confidential clinical questionnaire was submitted on{' '}
              <span className="text-emerald-400 font-semibold">
                {new Date(intakeData.submittedAt || Date.now()).toLocaleDateString()}
              </span>{' '}
              under digital signature{' '}
              <span className="font-mono text-emerald-300 font-semibold">
                {intakeData.sectionF?.signatureName}
              </span>
              . Your psychologist can now review your assessment before your next appointment.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link to="/patient/dashboard">
                <Button variant="primary" size="sm">Go to Patient Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                Print / Save PDF Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form Body */}
      {!isSubmitted && (
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* STEP 1: SYMPTOMS & CONCERNS (Section A & Section B) */}
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Section B: Presenting Concerns & Goals (First priority) */}
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-teal-400" />
                      Presenting Concerns & Therapy Goals
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Select the primary symptom areas where you are seeking support.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Primary Concerns & Symptoms (Select all that apply) <span className="text-teal-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {CONCERN_OPTIONS.map((concern) => {
                        const isSelected = intakeData.sectionB.primaryReasons?.includes(concern);
                        return (
                          <button
                            key={concern}
                            type="button"
                            onClick={() => toggleConcern(concern)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                              isSelected
                                ? 'bg-teal-500/20 border-teal-500/60 text-teal-300'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {concern}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Select
                      label="How long have you experienced these concerns?"
                      value={intakeData.sectionB.symptomDuration}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          sectionB: { ...intakeData.sectionB, symptomDuration: e.target.value },
                        })
                      }
                      options={[
                        { label: 'Less than 1 month', value: 'Less than 1 month' },
                        { label: '1 - 6 months', value: '1-6 months' },
                        { label: '6 months - 1 year', value: '6 months - 1 year' },
                        { label: '1 - 3 years', value: '1-3 years' },
                        { label: 'More than 3 years', value: 'More than 3 years' },
                      ]}
                    />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300">Overall Severity (1 - 10)</span>
                        <span className="text-teal-400 font-mono font-bold text-sm">
                          {intakeData.sectionB.severityRating} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={intakeData.sectionB.severityRating}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionB: { ...intakeData.sectionB, severityRating: parseInt(e.target.value, 10) },
                          })
                        }
                        className="w-full accent-teal-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>1: Mild</span>
                        <span>5: Moderate</span>
                        <span>10: Severe Disruption</span>
                      </div>
                    </div>
                  </div>

                  <Textarea
                    label="What are your main goals for therapy?"
                    rows={3}
                    placeholder="What would positive change look like for you over the coming months? (e.g., manage work stress, improve sleep, navigate anxiety)"
                    value={intakeData.sectionB.therapyGoals}
                    onChange={(e) =>
                      setIntakeData({
                        ...intakeData,
                        sectionB: { ...intakeData.sectionB, therapyGoals: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Section A: Demographics & Emergency Contact */}
                <div className="space-y-5 pt-4 border-t border-slate-800">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-400" />
                      Demographics & Emergency Contact
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Confirm basic background and mandatory emergency contact details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Current Occupation / Field"
                      placeholder="e.g. Software Engineer, Teacher, Student"
                      value={intakeData.sectionA.occupation}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          sectionA: { ...intakeData.sectionA, occupation: e.target.value },
                        })
                      }
                    />

                    <Select
                      label="Marital / Relationship Status"
                      value={intakeData.sectionA.maritalStatus}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          sectionA: { ...intakeData.sectionA, maritalStatus: e.target.value },
                        })
                      }
                      options={[
                        { label: 'Single', value: 'Single' },
                        { label: 'Married', value: 'Married' },
                        { label: 'In a Relationship', value: 'In a Relationship' },
                        { label: 'Divorced / Separated', value: 'Divorced / Separated' },
                        { label: 'Widowed', value: 'Widowed' },
                        { label: 'Prefer not to say', value: 'Prefer not to say' },
                      ]}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                      Mandatory Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Contact Full Name *"
                        required
                        placeholder="Jane Doe"
                        value={intakeData.sectionA.emergencyContactName}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionA: { ...intakeData.sectionA, emergencyContactName: e.target.value },
                          })
                        }
                      />

                      <Input
                        label="Relationship *"
                        required
                        placeholder="Spouse / Parent / Friend"
                        value={intakeData.sectionA.emergencyContactRelationship}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionA: { ...intakeData.sectionA, emergencyContactRelationship: e.target.value },
                          })
                        }
                      />

                      <Input
                        label="Phone Number *"
                        required
                        type="tel"
                        placeholder="+1 555-0144"
                        value={intakeData.sectionA.emergencyContactPhone}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionA: { ...intakeData.sectionA, emergencyContactPhone: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: MEDICAL HISTORY (Section C, D & E) */}
            {currentStep === 2 && (
              <div className="space-y-8">
                {/* Section C: Mental Health & Medical History */}
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-400" />
                      Mental Health & Medical History
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Previous clinical care, diagnoses, and current medical treatments.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Have you previously attended counseling or psychotherapy?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="previousTherapy"
                          checked={intakeData.sectionC.previousTherapy === true}
                          onChange={() =>
                            setIntakeData({
                              ...intakeData,
                              sectionC: { ...intakeData.sectionC, previousTherapy: true },
                            })
                          }
                          className="accent-teal-400"
                        />
                        Yes, previously in therapy
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="previousTherapy"
                          checked={intakeData.sectionC.previousTherapy === false}
                          onChange={() =>
                            setIntakeData({
                              ...intakeData,
                              sectionC: { ...intakeData.sectionC, previousTherapy: false },
                            })
                          }
                          className="accent-teal-400"
                        />
                        No, this is my first time
                      </label>
                    </div>
                  </div>

                  <Textarea
                    label="Previous Diagnoses (if any)"
                    rows={2}
                    placeholder="e.g. Diagnosed with Major Depressive Disorder in 2022, or 'None'"
                    value={intakeData.sectionC.previousDiagnoses}
                    onChange={(e) =>
                      setIntakeData({
                        ...intakeData,
                        sectionC: { ...intakeData.sectionC, previousDiagnoses: e.target.value },
                      })
                    }
                  />

                  <Textarea
                    label="Current Medications (Psychiatric or Physical)"
                    rows={2}
                    placeholder="List medications, dosage, and prescribing doctor if applicable"
                    value={intakeData.sectionC.currentMedications}
                    onChange={(e) =>
                      setIntakeData({
                        ...intakeData,
                        sectionC: { ...intakeData.sectionC, currentMedications: e.target.value },
                      })
                    }
                  />

                  <Textarea
                    label="Family Mental Health History"
                    rows={2}
                    placeholder="Any family history of depression, anxiety, addiction, or bipolar disorder?"
                    value={intakeData.sectionC.familyMentalHealthHistory}
                    onChange={(e) =>
                      setIntakeData({
                        ...intakeData,
                        sectionC: { ...intakeData.sectionC, familyMentalHealthHistory: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Section D: Lifestyle, Habits & Social Support */}
                <div className="space-y-5 pt-4 border-t border-slate-800">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-teal-400" />
                      Lifestyle, Habits & Social Support
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Understanding your day-to-day routine and support network.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Average Sleep Quality"
                      value={intakeData.sectionD.sleepQuality}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          sectionD: { ...intakeData.sectionD, sleepQuality: e.target.value },
                        })
                      }
                      options={[
                        { label: 'Poor (Insomnia, frequent waking)', value: 'poor' },
                        { label: 'Fair (Disrupted or restless)', value: 'fair' },
                        { label: 'Good (6-8 hours restful)', value: 'good' },
                        { label: 'Excellent (Consistently restorative)', value: 'excellent' },
                      ]}
                    />

                    <Select
                      label="Physical Exercise / Activity"
                      value={intakeData.sectionD.exerciseFrequency}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          sectionD: { ...intakeData.sectionD, exerciseFrequency: e.target.value },
                        })
                      }
                      options={[
                        { label: 'Sedentary (Rarely exercise)', value: 'sedentary' },
                        { label: 'Occasional (1-2 times weekly)', value: 'occasional' },
                        { label: 'Regular (3-4 times weekly)', value: 'regular' },
                        { label: 'Daily (Consistent daily activity)', value: 'daily' },
                      ]}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">
                        Social Support Network Strength (1 - 5)
                      </span>
                      <span className="text-teal-400 font-mono font-bold text-sm">
                        {intakeData.sectionD.supportSystemRating} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={intakeData.sectionD.supportSystemRating}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          sectionD: { ...intakeData.sectionD, supportSystemRating: parseInt(e.target.value, 10) },
                        })
                      }
                      className="w-full accent-teal-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>1: Feel isolated</span>
                      <span>3: Moderate support</span>
                      <span>5: Strong, loving network</span>
                    </div>
                  </div>

                  <Textarea
                    label="Substance Use (Alcohol, Nicotine, Caffeine, Medications, etc.)"
                    rows={2}
                    placeholder="Frequency and quantity of alcohol, nicotine, or other substances"
                    value={intakeData.sectionD.substanceUseDetails}
                    onChange={(e) =>
                      setIntakeData({
                        ...intakeData,
                        sectionD: { ...intakeData.sectionD, substanceUseDetails: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Section E: Safety & Crisis Screening */}
                <div className="space-y-5 pt-4 border-t border-slate-800">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      Safety & Crisis Screening
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      We ask these questions of all patients to ensure safety and provide appropriate resources.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-200">
                          In the past month, have you experienced thoughts of hurting yourself or wishing you were not here?
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Answering honestly ensures you receive the correct clinical support.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSafetyChange('suicidalIdeationPastMonth', true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            intakeData.sectionE.suicidalIdeationPastMonth
                              ? 'bg-red-500/20 border-red-500 text-red-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSafetyChange('suicidalIdeationPastMonth', false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            !intakeData.sectionE.suicidalIdeationPastMonth
                              ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-200">
                          Do you have a history of intentional self-harm?
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSafetyChange('selfHarmHistory', true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            intakeData.sectionE.selfHarmHistory
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSafetyChange('selfHarmHistory', false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            !intakeData.sectionE.selfHarmHistory
                              ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-200">
                          Are you currently in immediate danger of acting on harmful thoughts?
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSafetyChange('immediateRiskAcknowledged', true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            intakeData.sectionE.immediateRiskAcknowledged
                              ? 'bg-red-500/20 border-red-500 text-red-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSafetyChange('immediateRiskAcknowledged', false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            !intakeData.sectionE.immediateRiskAcknowledged
                              ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>

                  <Textarea
                    label="Safety Notes or Context (Optional)"
                    rows={2}
                    placeholder="Any additional details you want your psychologist to know regarding your emotional safety"
                    value={intakeData.sectionE.safetyNotes}
                    onChange={(e) =>
                      setIntakeData({
                        ...intakeData,
                        sectionE: { ...intakeData.sectionE, safetyNotes: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & LEGAL CONSENT */}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Review Summary of Prior Steps */}
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-teal-400" />
                        Summary of Entered Responses
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Please review your responses before providing final legal consent.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-teal-300">Step 1: Symptoms & Contact</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div>
                        <span className="text-slate-400">Primary Concerns: </span>
                        <span className="text-slate-200 font-medium">
                          {intakeData.sectionB.primaryReasons?.join(', ') || 'None selected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Duration & Severity: </span>
                        <span className="text-slate-200">
                          {intakeData.sectionB.symptomDuration} (Severity {intakeData.sectionB.severityRating}/10)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Emergency Contact: </span>
                        <span className="text-slate-200">
                          {intakeData.sectionA.emergencyContactName} ({intakeData.sectionA.emergencyContactRelationship}), {intakeData.sectionA.emergencyContactPhone}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-teal-300">Step 2: Medical & Lifestyle</span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                      <div>
                        <span className="text-slate-400">Prior Therapy: </span>
                        <span className="text-slate-200">{intakeData.sectionC.previousTherapy ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Sleep & Activity: </span>
                        <span className="text-slate-200 capitalize">
                          {intakeData.sectionD.sleepQuality} sleep, {intakeData.sectionD.exerciseFrequency} activity
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Safety Screening: </span>
                        <span className="text-slate-200">
                          {intakeData.sectionE.suicidalIdeationPastMonth ? 'Identified ideation (Reviewed)' : 'No recent crisis risk'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section F: Consent, AI Assistance Notice & Disclosures */}
                <div className="space-y-5 pt-4 border-t border-slate-800">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-teal-400" />
                      Consent & Clinical Disclosures
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Review and check each mandatory legal agreement to complete submission.
                    </p>
                  </div>

                  {/* AI Assistance Notice */}
                  <div className="p-4 bg-teal-950/30 border border-teal-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      Psyco AI Clinical Documentation Assistant Notice
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      During clinical consultations, your psychologist may utilize Psyco AI to assist in summarizing session dialogue into draft clinical notes. Audio is processed ephemerally in-memory and is never retained. Your clinician retains total authority, clinical oversight, and final editing responsibility for all medical records.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeData.sectionF.consentToTreatment}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionF: { ...intakeData.sectionF, consentToTreatment: e.target.checked },
                          })
                        }
                        className="mt-1 accent-teal-400 rounded"
                      />
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-100 block">Consent to Psychotherapy & Consultation *</span>
                        I voluntarily agree to receive mental health assessment and therapeutic care provided by licensed clinicians on Psyco AI. (See{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/medical-disclaimer" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                          Medical Disclaimer
                        </a>)
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeData.sectionF.aiAssistanceAcknowledged}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionF: { ...intakeData.sectionF, aiAssistanceAcknowledged: e.target.checked },
                          })
                        }
                        className="mt-1 accent-teal-400 rounded"
                      />
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-100 block">AI Documentation Assistant Acknowledgement *</span>
                        I acknowledge that Psyco AI assists clinicians with clinical documentation summaries and that all documentation is verified by human professionals. (See{' '}
                        <a href="/ai-transparency" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                          AI Transparency Framework
                        </a>)
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeData.sectionF.telehealthConsent}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionF: { ...intakeData.sectionF, telehealthConsent: e.target.checked },
                          })
                        }
                        className="mt-1 accent-teal-400 rounded"
                      />
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-100 block">Session Delivery & Telehealth Consent *</span>
                        I agree to the practice policies regarding in-person clinic attendance and secure online telehealth video sessions. (See{' '}
                        <a href="/terms#appointments" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                          Appointment Policies
                        </a>)
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeData.sectionF.privacyNoticeAcknowledged}
                        onChange={(e) =>
                          setIntakeData({
                            ...intakeData,
                            sectionF: { ...intakeData.sectionF, privacyNoticeAcknowledged: e.target.checked },
                          })
                        }
                        className="mt-1 accent-teal-400 rounded"
                      />
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-semibold text-slate-100 block">Data Privacy & Clinical Confidentiality *</span>
                        I have read and agree to the Psyco AI Privacy Policy and technical architecture governing confidential clinical records. (See{' '}
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                          Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href="/data-privacy" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">
                          Data Privacy Architecture
                        </a>)
                      </div>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <Input
                      label="Legal Digital Signature (Type Full Legal Name) *"
                      required
                      placeholder="e.g. Jane Margaret Doe"
                      value={intakeData.sectionF.signatureName}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          sectionF: { ...intakeData.sectionF, signatureName: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="p-4 bg-teal-950/30 border border-teal-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-teal-300">Ready to Submit?</div>
                      <div className="text-[11px] text-slate-300">
                        Once submitted, your intake questionnaire is locked for clinical review.
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSubmitFinal}
                      disabled={submitting}
                      className="flex items-center gap-2 self-stretch sm:self-auto justify-center"
                    >
                      {submitting ? <LoadingSpinner size="sm" /> : <ClipboardCheck className="w-4 h-4" />}
                      Submit Intake Questionnaire
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={currentStep === 1}
                onClick={handlePrev}
                className="flex items-center gap-2 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </Button>

              <div className="text-xs text-slate-400 font-medium">
                Step {currentStep} of 3
              </div>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  className="flex items-center gap-2 text-xs"
                >
                  Continue to Step {currentStep + 1}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Immediate Crisis Alert Modal */}
      {showCrisisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Immediate Support Is Available</h3>
                <p className="text-xs text-slate-300 mt-1">
                  You indicated experiencing thoughts of harm. We want you to be safe. Psyco AI is not an emergency crisis intervention service.
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-red-200">24/7 Free & Confidential Hotlines:</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg">
                  <span className="text-slate-200 font-medium">USA / Canada Suicide & Crisis Lifeline</span>
                  <a href="tel:988" className="text-teal-400 font-bold flex items-center gap-1 hover:underline">
                    <PhoneCall className="w-3.5 h-3.5" /> Call or Text 988
                  </a>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg">
                  <span className="text-slate-200 font-medium">India Vandrevala Foundation</span>
                  <a href="tel:+919999666555" className="text-teal-400 font-bold flex items-center gap-1 hover:underline">
                    <PhoneCall className="w-3.5 h-3.5" /> +91 9999 666 555
                  </a>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg">
                  <span className="text-slate-200 font-medium">AASRA Helpline</span>
                  <a href="tel:+919820466726" className="text-teal-400 font-bold flex items-center gap-1 hover:underline">
                    <PhoneCall className="w-3.5 h-3.5" /> +91 98204 66726
                  </a>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              If you or someone you know is in immediate physical danger, please call your local emergency services (911 / 112) or go to the nearest hospital emergency room.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCrisisModal(false)}
              >
                I Understand & Wish to Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientIntakePage;
