import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import { isBackendConfigured } from '../../services/apiClient';
import {
  User,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  Lock,
  Phone,
  Sparkles,
  ClipboardList,
  Calendar,
} from 'lucide-react';

export function OnboardingPage() {
  const { user, firebaseUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const initialName = firebaseUser?.displayName || user?.fullName || '';
  const initialEmail = firebaseUser?.email || user?.email || '';

  // Patient Multi-Step Form State
  const [patientForm, setPatientForm] = useState({
    fullName: initialName,
    preferredName: initialName,
    email: initialEmail,
    phone: '',
    age: '28',
    gender: 'female',
    timezone: 'Asia/Kolkata',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    consultationModePref: 'both', // 'online' | 'in_person' | 'both'
    languagePref: 'en',
    consentTreatment: false,
    consentPrivacy: false,
    consentAiTransparency: false,
  });

  // Psychologist Form State (Alternative role)
  const [psychologistForm, setPsychologistForm] = useState({
    fullName: initialName,
    licenseNumber: '',
    bio: '',
    specializations: 'Cognitive Behavioral Therapy (CBT), Anxiety Disorders',
    offeredModes: 'both',
    defaultMode: 'in_person',
    languages: 'English',
  });

  // Client Validation for Patient Steps
  const validateCurrentStep = () => {
    setErrorMsg(null);
    if (role === 'psychologist') return true;

    if (currentStep === 1) {
      if (!patientForm.fullName || patientForm.fullName.trim().length < 2) {
        setErrorMsg('Please enter your full legal or registered name (at least 2 characters).');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      const ageNum = parseInt(patientForm.age, 10);
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
        setErrorMsg('Please enter a valid age between 10 and 120.');
        return false;
      }
      if (!patientForm.gender) {
        setErrorMsg('Please select a gender option.');
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      // Preferences: all have defaults
      return true;
    }

    if (currentStep === 4) {
      if (!patientForm.consentTreatment) {
        setErrorMsg('Informed consent to mental health consultation services is required.');
        return false;
      }
      if (!patientForm.consentPrivacy) {
        setErrorMsg('Acknowledgment of the patient privacy policy is required.');
        return false;
      }
      if (!patientForm.consentAiTransparency) {
        setErrorMsg('Acknowledgment of AI assistant disclosure is required.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!isBackendConfigured()) {
      setErrorMsg(
        'The backend service is currently not connected. Profile submission will be available once the backend service is deployed.'
      );
      return;
    }

    setLoading(true);

    try {
      if (role === 'patient') {
        // 1. Submit core onboarding
        await profileService.onboardPatient({
          fullName: patientForm.fullName.trim(),
          gender: patientForm.gender,
          age: parseInt(patientForm.age, 10),
          phone: patientForm.phone.trim(),
          preferredName: patientForm.preferredName.trim() || patientForm.fullName.trim(),
          timezone: patientForm.timezone,
        });

        // 2. Save emergency contact if provided
        if (patientForm.emergencyContactName && patientForm.emergencyContactPhone) {
          try {
            await profileService.updatePatientProfile({
              emergencyContact: {
                name: patientForm.emergencyContactName.trim(),
                phone: patientForm.emergencyContactPhone.trim(),
                relationship: patientForm.emergencyContactRelationship.trim() || 'Emergency Contact',
              },
            });
          } catch (err) {
            console.warn('Optional emergency contact sync note:', err);
          }
        }

        // 3. Save preferences
        try {
          await profileService.updatePreferences({
            language: patientForm.languagePref,
            timezone: patientForm.timezone,
          });
        } catch (err) {
          console.warn('Optional preference sync note:', err);
        }

        await refreshProfile();
        setSuccessMsg('Your patient profile was successfully created.');
        setTimeout(() => {
          navigate('/patient/intake', { replace: true });
        }, 1200);
      } else {
        // Psychologist Onboarding
        const specs = psychologistForm.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const langs = psychologistForm.languages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean);

        const bio = psychologistForm.bio?.trim().length >= 5
          ? psychologistForm.bio.trim()
          : 'Licensed clinical psychologist providing evidence-based mental health care.';

        const license = psychologistForm.licenseNumber?.trim() || 'LIC-PENDING';

        await profileService.onboardPsychologist({
          fullName: psychologistForm.fullName?.trim() || 'Clinician',
          licenseNumber: license,
          bio,
          specializations: specs.length > 0 ? specs : ['General Counseling'],
          languages: langs.length > 0 ? langs : ['English'],
          offeredModes: psychologistForm.offeredModes,
          defaultMode: psychologistForm.defaultMode,
        });

        await refreshProfile();
        setSuccessMsg('Psychologist profile submitted for verification.');
        setTimeout(() => {
          navigate('/psychologist/profile', { replace: true });
        }, 1200);
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setErrorMsg(err.message || 'Failed to complete profile onboarding. Please review your entries and try again.');
    } finally {
      setLoading(false);
    }
  };

  const patientSteps = [
    { num: 1, title: 'Account' },
    { num: 2, title: 'Profile' },
    { num: 3, title: 'Care Preferences' },
    { num: 4, title: 'Privacy & Consents' },
    { num: 5, title: 'Review & Confirm' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <Badge variant="teal" size="sm" className="inline-flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-softTeal" />
          <span>Psyco AI Patient Workspace</span>
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Complete Your Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Set up your confidential account to connect with licensed clinical psychologists and manage your care.
        </p>
      </div>

      {/* Role Toggle Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setRole('patient');
            setErrorMsg(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'patient'
              ? 'bg-softTeal text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>I am a Patient</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('psychologist');
            setErrorMsg(null);
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            role === 'psychologist'
              ? 'bg-softTeal text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>I am a Psychologist</span>
        </button>
      </div>

      {/* Error & Success Feedback */}
      {errorMsg && <AlertBanner variant="error" message={errorMsg} />}
      {successMsg && <AlertBanner variant="success" message={successMsg} />}

      {/* PATIENT MULTI-STEP FLOW */}
      {role === 'patient' ? (
        <Card className="border-slate-800 bg-deepBlueGray/90 shadow-xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Step Progress Bar */}
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Step {currentStep} of 5: {patientSteps[currentStep - 1].title}</span>
                <span className="text-softTeal">{Math.round((currentStep / 5) * 100)}% Complete</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-softTeal transition-all duration-300 rounded-full"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: Account Information */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-100">
                    Welcome to Psyco AI
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verify your legal name and contact details for appointment booking and care records.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={patientForm.fullName}
                    onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                  />

                  <Input
                    label="Preferred First Name"
                    placeholder="e.g. Alex (optional)"
                    value={patientForm.preferredName}
                    onChange={(e) => setPatientForm({ ...patientForm, preferredName: e.target.value })}
                  />

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Registered Email
                    </label>
                    <input
                      type="text"
                      disabled
                      value={patientForm.email}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Account email linked to your secure Firebase Authentication session.
                    </p>
                  </div>

                  <Input
                    label="Phone Number"
                    placeholder="+91 98765 43210"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Personal Profile & Demographics */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-100">
                    Personal Demographics & Safety
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This basic demographic information allows clinicians to tailor evidence-based therapeutic care.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Age"
                    type="number"
                    required
                    min={10}
                    max={120}
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  />

                  <Select
                    label="Gender Identity"
                    required
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                    options={[
                      { value: 'female', label: 'Female' },
                      { value: 'male', label: 'Male' },
                      { value: 'non_binary', label: 'Non-Binary' },
                      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                    ]}
                  />

                  <div className="sm:col-span-2">
                    <Select
                      label="Primary Timezone"
                      value={patientForm.timezone}
                      onChange={(e) => setPatientForm({ ...patientForm, timezone: e.target.value })}
                      options={[
                        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
                        { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
                        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
                        { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                        { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+4)' },
                      ]}
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="sm:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-softTeal" />
                      <span>Emergency Point of Contact (Recommended)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Contact Name"
                        placeholder="e.g. Morgan Mercer"
                        value={patientForm.emergencyContactName}
                        onChange={(e) => setPatientForm({ ...patientForm, emergencyContactName: e.target.value })}
                      />

                      <Input
                        label="Relationship"
                        placeholder="e.g. Spouse, Sibling, Friend"
                        value={patientForm.emergencyContactRelationship}
                        onChange={(e) => setPatientForm({ ...patientForm, emergencyContactRelationship: e.target.value })}
                      />

                      <div className="sm:col-span-2">
                        <Input
                          label="Emergency Phone"
                          placeholder="+91 99887 76655"
                          value={patientForm.emergencyContactPhone}
                          onChange={(e) => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Care Preferences */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-100">
                    Consultation & Care Preferences
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Set your preferred consultation format to quickly match with available psychologists.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Select
                    label="Preferred Consultation Mode"
                    value={patientForm.consultationModePref}
                    onChange={(e) => setPatientForm({ ...patientForm, consultationModePref: e.target.value })}
                    options={[
                      { value: 'both', label: 'Both Telehealth Video & In-Person Clinic' },
                      { value: 'online', label: 'Telehealth Video Only (Remote)' },
                      { value: 'in_person', label: 'In-Person Clinic Visits Only' },
                    ]}
                  />

                  <Select
                    label="Preferred Communication Language"
                    value={patientForm.languagePref}
                    onChange={(e) => setPatientForm({ ...patientForm, languagePref: e.target.value })}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'hi', label: 'Hindi' },
                      { value: 'es', label: 'Spanish' },
                    ]}
                  />

                  {/* Informational Box */}
                  <div className="p-4 rounded-xl bg-softTeal/5 border border-softTeal/20 space-y-1.5">
                    <h4 className="text-xs font-semibold text-softTeal flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4" />
                      <span>Next Step: Comprehensive Clinical Intake</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Following profile completion, you will be invited to complete your confidential clinical intake form covering health background, presenting concerns, and lifestyle habits.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Privacy & Legal Consents */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-100">
                    Privacy, Disclosures & Informed Consent
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Please review and check each disclosure. In accordance with healthcare standards, consents are explicit and not preselected.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Consent 1: Informed Consent */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={patientForm.consentTreatment}
                      onChange={(e) => setPatientForm({ ...patientForm, consentTreatment: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-softTeal focus:ring-softTeal focus:ring-offset-midnightNavy"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-100 block">
                        Informed Consent for Psychotherapy & Clinical Consultations *
                      </span>
                      <span className="text-[11px] text-slate-400 block leading-relaxed">
                        I understand that consultations are provided by licensed mental health professionals and that I have the right to discuss treatment plans, risks, and alternatives. (See{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-softTeal underline hover:text-teal-300">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/medical-disclaimer" target="_blank" rel="noopener noreferrer" className="text-softTeal underline hover:text-teal-300">
                          Medical Disclaimer
                        </a>)
                      </span>
                    </div>
                  </label>

                  {/* Consent 2: AI Assistant Disclosure */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={patientForm.consentAiTransparency}
                      onChange={(e) => setPatientForm({ ...patientForm, consentAiTransparency: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-softTeal focus:ring-softTeal focus:ring-offset-midnightNavy"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-100 block">
                        AI Clinical Copilot & Ephemeral Transcription Disclosure *
                      </span>
                      <span className="text-[11px] text-slate-400 block leading-relaxed">
                        I acknowledge that Psyco AI provides ephemeral ambient documentation assistance. Audio is never persistently stored on disk; AI drafts are reviewed and approved exclusively by licensed clinicians. (See{' '}
                        <a href="/ai-transparency" target="_blank" rel="noopener noreferrer" className="text-softTeal underline hover:text-teal-300">
                          AI Transparency & Safety Policy
                        </a>)
                      </span>
                    </div>
                  </label>

                  {/* Consent 3: Privacy & Data Protection */}
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={patientForm.consentPrivacy}
                      onChange={(e) => setPatientForm({ ...patientForm, consentPrivacy: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-softTeal focus:ring-softTeal focus:ring-offset-midnightNavy"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-100 block">
                        Data Confidentiality & Privacy Architecture Notice *
                      </span>
                      <span className="text-[11px] text-slate-400 block leading-relaxed">
                        I agree to the Psyco AI Privacy Policy. Protected health data is encrypted and accessible only to me and my designated treating psychologist under strict ReBAC controls. (See{' '}
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-softTeal underline hover:text-teal-300">
                          Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href="/data-privacy" target="_blank" rel="noopener noreferrer" className="text-softTeal underline hover:text-teal-300">
                          Data Privacy Architecture
                        </a>)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 5: Review & Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-100">
                    Review Your Information
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Verify that your profile details are accurate before submitting.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Legal Name:</span>
                      <span className="font-semibold text-slate-200">{patientForm.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Preferred Name:</span>
                      <span className="font-semibold text-slate-200">{patientForm.preferredName || patientForm.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Age:</span>
                      <span className="font-semibold text-slate-200">{patientForm.age} years</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gender:</span>
                      <span className="font-semibold text-slate-200 capitalize">{patientForm.gender.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phone:</span>
                      <span className="font-semibold text-slate-200">{patientForm.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Timezone:</span>
                      <span className="font-semibold text-slate-200">{patientForm.timezone}</span>
                    </div>
                  </div>

                  {patientForm.emergencyContactName && (
                    <div className="pb-3 border-b border-slate-800">
                      <span className="text-slate-500 block">Emergency Contact:</span>
                      <span className="font-semibold text-slate-200">
                        {patientForm.emergencyContactName} ({patientForm.emergencyContactRelationship || 'Contact'}) — {patientForm.emergencyContactPhone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-calmGreen">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>All informed consents and privacy agreements verified and agreed.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleNextStep}
                  className="flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Submitting...' : 'Complete & Continue to Intake'}</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* PSYCHOLOGIST ONBOARDING (Preserved) */
        <Card className="border-slate-800 bg-deepBlueGray/90 shadow-xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-100">
                Psychologist Professional Credentials
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your clinical credentials for verification by the medical director.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Professional Name"
                required
                placeholder="e.g. Dr. Sarah Connor, Ph.D."
                value={psychologistForm.fullName}
                onChange={(e) => setPsychologistForm({ ...psychologistForm, fullName: e.target.value })}
              />

              <Input
                label="Clinical License Number"
                required
                placeholder="e.g. PSY-99281"
                value={psychologistForm.licenseNumber}
                onChange={(e) => setPsychologistForm({ ...psychologistForm, licenseNumber: e.target.value })}
              />

              <Textarea
                label="Professional Clinical Bio"
                rows={3}
                placeholder="Summarize your clinical philosophy and therapeutic approach..."
                value={psychologistForm.bio}
                onChange={(e) => setPsychologistForm({ ...psychologistForm, bio: e.target.value })}
              />

              <Input
                label="Specializations (comma-separated)"
                placeholder="CBT, Trauma & PTSD, Anxiety"
                value={psychologistForm.specializations}
                onChange={(e) => setPsychologistForm({ ...psychologistForm, specializations: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Consultation Modes"
                  value={psychologistForm.offeredModes}
                  onChange={(e) => setPsychologistForm({ ...psychologistForm, offeredModes: e.target.value })}
                  options={[
                    { value: 'both', label: 'Both Video & In-Person' },
                    { value: 'online', label: 'Video (Telehealth) Only' },
                    { value: 'in_person', label: 'In-Person Clinic Only' },
                  ]}
                />

                <Input
                  label="Languages"
                  placeholder="English, Hindi"
                  value={psychologistForm.languages}
                  onChange={(e) => setPsychologistForm({ ...psychologistForm, languages: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-softTeal" />
                  <span>Credential Verification Policy</span>
                </p>
                <p>
                  Psychologist registrations are submitted in <code>pending_verification</code> status. An administrator reviews credentials before public listing.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={loading}
                  disabled={loading}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Submitting...' : 'Submit Clinician Application'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OnboardingPage;
