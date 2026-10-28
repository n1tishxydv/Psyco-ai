import React, { useState, useEffect } from 'react';
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
  const [successMsg, setSuccessMsg] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

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

  // Save Draft
  const handleSaveDraft = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSavingDraft(true);

    try {
      await intakeService.saveDraft(intakeData);
      setSuccessMsg('Draft intake saved securely. You can return and complete it anytime.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Final
  const handleSubmitFinal = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    try {
      // Client-side validation with direct step navigation
      if (!intakeData.sectionA.emergencyContactName?.trim() || !intakeData.sectionA.emergencyContactPhone?.trim()) {
        setCurrentStep(1);
        throw new Error('Please fill out your emergency contact name and phone number in Section 1 (Personal & Emergency).');
      }
      if (!intakeData.sectionB.primaryReasons || intakeData.sectionB.primaryReasons.length === 0) {
        setCurrentStep(2);
        throw new Error('Please select at least one primary concern in Section 2 (Concerns & Goals).');
      }
      if (
        !intakeData.sectionF.consentToTreatment ||
        !intakeData.sectionF.aiAssistanceAcknowledged ||
        !intakeData.sectionF.telehealthConsent ||
        !intakeData.sectionF.privacyNoticeAcknowledged
      ) {
        setCurrentStep(6);
        throw new Error('Please review and check all required clinical consent items in Section 6 (Consent & Disclosures).');
      }
      if (!intakeData.sectionF.signatureName || intakeData.sectionF.signatureName.trim().length < 2) {
        setCurrentStep(6);
        throw new Error('Please enter your full legal name as your digital signature in Section 6 (Consent & Disclosures).');
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
      setCurrentStep(7); // Completed view
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please verify all required fields.');
    } finally {
      setSubmitting(false);
    }
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

  const steps = [
    { num: 1, title: 'Personal & Emergency', icon: User },
    { num: 2, title: 'Concerns & Goals', icon: Activity },
    { num: 3, title: 'Clinical History', icon: FileText },
    { num: 4, title: 'Lifestyle & Support', icon: HeartHandshake },
    { num: 5, title: 'Safety & Screening', icon: ShieldAlert },
    { num: 6, title: 'Consent & Disclosures', icon: Lock },
    { num: 7, title: 'Review & Status', icon: ClipboardCheck },
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
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            {savingDraft ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            Save Draft
          </Button>
        )}
      </div>

      {errorMsg && <AlertBanner type="error" title="Intake Form Error" message={errorMsg} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Stepper Navigation */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num || isSubmitted;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                isActive
                  ? 'bg-teal-950/40 border-teal-500/70 text-teal-300 shadow-md ring-1 ring-teal-500/30'
                  : isDone
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-slate-950/50 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isDone && !isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-tight line-clamp-1">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form Body */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-sm">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Section A - Personal & Emergency */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-400" />
                  Section A: Demographics & Emergency Contact
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Confirm your emergency point of contact and basic background.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Current Occupation / Field"
                  placeholder="e.g. Software Engineer, Teacher, Student"
                  value={intakeData.sectionA.occupation}
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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

              <div className="pt-3 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-teal-300 mb-3">
                  Mandatory Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Contact Full Name *"
                    required
                    placeholder="Jane Smith"
                    value={intakeData.sectionA.emergencyContactName}
                    disabled={isSubmitted}
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
                    disabled={isSubmitted}
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
                    disabled={isSubmitted}
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
          )}

          {/* STEP 2: Section B - Presenting Concerns & Goals */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  Section B: Presenting Concerns & Therapy Goals
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select the main areas where you are looking for support.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Primary Concerns & Symptoms (Select all that apply) *
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CONCERN_OPTIONS.map((concern) => {
                    const isSelected = intakeData.sectionB.primaryReasons?.includes(concern);
                    return (
                      <button
                        key={concern}
                        type="button"
                        disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                    disabled={isSubmitted}
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
                    <span>1: Mild / Manageable</span>
                    <span>5: Moderate</span>
                    <span>10: Severe Disruption</span>
                  </div>
                </div>
              </div>

              <Textarea
                label="What are your main goals for therapy? *"
                required
                rows={3}
                placeholder="What would positive change or healing look like for you over the next few months?"
                value={intakeData.sectionB.therapyGoals}
                disabled={isSubmitted}
                onChange={(e) =>
                  setIntakeData({
                    ...intakeData,
                    sectionB: { ...intakeData.sectionB, therapyGoals: e.target.value },
                  })
                }
              />
            </div>
          )}

          {/* STEP 3: Section C - Mental Health & Medical History */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Section C: Mental Health & Medical History
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
                      disabled={isSubmitted}
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
                      disabled={isSubmitted}
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
                disabled={isSubmitted}
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
                disabled={isSubmitted}
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
                disabled={isSubmitted}
                onChange={(e) =>
                  setIntakeData({
                    ...intakeData,
                    sectionC: { ...intakeData.sectionC, familyMentalHealthHistory: e.target.value },
                  })
                }
              />
            </div>
          )}

          {/* STEP 4: Section D - Lifestyle & Support System */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-teal-400" />
                  Section D: Lifestyle, Habits & Social Support
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Understanding your day-to-day routine and support network.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Average Sleep Quality"
                  value={intakeData.sectionD.sleepQuality}
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  <span>1: Feel isolated / No support</span>
                  <span>3: Moderate support</span>
                  <span>5: Strong, loving network</span>
                </div>
              </div>

              <Textarea
                label="Substance Use (Alcohol, Nicotine, Caffeine, Medications, etc.)"
                rows={2}
                placeholder="Frequency and quantity of alcohol, nicotine, or other substances"
                value={intakeData.sectionD.substanceUseDetails}
                disabled={isSubmitted}
                onChange={(e) =>
                  setIntakeData({
                    ...intakeData,
                    sectionD: { ...intakeData.sectionD, substanceUseDetails: e.target.value },
                  })
                }
              />
            </div>
          )}

          {/* STEP 5: Section E - Safety & Crisis Screening */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Section E: Safety & Crisis Screening
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
                      disabled={isSubmitted}
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
                      disabled={isSubmitted}
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
                      disabled={isSubmitted}
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
                      disabled={isSubmitted}
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
                      disabled={isSubmitted}
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
                      disabled={isSubmitted}
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
                disabled={isSubmitted}
                onChange={(e) =>
                  setIntakeData({
                    ...intakeData,
                    sectionE: { ...intakeData.sectionE, safetyNotes: e.target.value },
                  })
                }
              />
            </div>
          )}

          {/* STEP 6: Section F - Consent, AI Assistance Notice & Disclosures */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-teal-400" />
                  Section F: Consent & AI Clinical Assistant Disclosure
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Please review and check each required consent agreement.
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
                    disabled={isSubmitted}
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
                    I voluntarily agree to receive mental health assessment and therapeutic care provided by licensed clinicians on Psyco AI.
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intakeData.sectionF.aiAssistanceAcknowledged}
                    disabled={isSubmitted}
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
                    I acknowledge that Psyco AI assists clinicians with clinical documentation summaries and that all documentation is verified by human professionals.
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intakeData.sectionF.telehealthConsent}
                    disabled={isSubmitted}
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
                    I agree to the practice policies regarding in-person clinic attendance and secure online telehealth video sessions.
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intakeData.sectionF.privacyNoticeAcknowledged}
                    disabled={isSubmitted}
                    onChange={(e) =>
                      setIntakeData({
                        ...intakeData,
                        sectionF: { ...intakeData.sectionF, privacyNoticeAcknowledged: e.target.checked },
                      })
                    }
                    className="mt-1 accent-teal-400 rounded"
                  />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-100 block">Data Privacy & HIPAA Principles *</span>
                    I have read and agree to the Psyco AI Data Privacy Policy and terms governing confidential clinical records.
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <Input
                  label="Legal Digital Signature (Type Full Legal Name) *"
                  required
                  placeholder="e.g. Jane Margaret Doe"
                  value={intakeData.sectionF.signatureName}
                  disabled={isSubmitted}
                  onChange={(e) =>
                    setIntakeData({
                      ...intakeData,
                      sectionF: { ...intakeData.sectionF, signatureName: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* STEP 7: Review & Submission Summary */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                  Intake Assessment Status & Summary
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isSubmitted
                    ? 'Your clinical intake questionnaire is officially submitted and attached to your clinical profile.'
                    : 'Review your details prior to final submission.'}
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">Intake Completed & Verified</h3>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                    Submitted on <span className="text-emerald-400 font-semibold">{new Date(intakeData.submittedAt || Date.now()).toLocaleDateString()}</span> under digital signature <span className="font-mono text-emerald-300 font-semibold">{intakeData.sectionF?.signatureName}</span>. Your psychologist can now review your assessment before your first appointment.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <Button variant="secondary" size="sm" onClick={() => window.location.href = '/patient/dashboard'}>
                      Go to Patient Dashboard
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      Print / Save Summary
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-slate-400 font-semibold mb-1">Emergency Contact</div>
                      <div className="text-slate-200 font-medium">
                        {intakeData.sectionA.emergencyContactName || 'Not specified'} (
                        {intakeData.sectionA.emergencyContactRelationship || 'None'})
                      </div>
                      <div className="text-slate-400">{intakeData.sectionA.emergencyContactPhone || 'No phone'}</div>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-slate-400 font-semibold mb-1">Primary Concerns</div>
                      <div className="text-slate-200 font-medium">
                        {intakeData.sectionB.primaryReasons?.join(', ') || 'None selected'}
                      </div>
                      <div className="text-slate-400">
                        Severity Rating: {intakeData.sectionB.severityRating} / 10
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-teal-950/30 border border-teal-500/30 rounded-xl flex items-center justify-between">
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
                      className="flex items-center gap-2"
                    >
                      {submitting ? <LoadingSpinner size="sm" /> : <ClipboardCheck className="w-4 h-4" />}
                      Submit Intake Questionnaire
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stepper Footer Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous Section
            </Button>

            <div className="text-xs text-slate-500">
              Section {currentStep} of {steps.length}
            </div>

            {currentStep < 7 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
                className="flex items-center gap-2"
              >
                Next Section
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

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
