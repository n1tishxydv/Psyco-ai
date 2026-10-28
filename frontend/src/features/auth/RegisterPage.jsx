import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { UserPlus, User, Stethoscope, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

export function RegisterPage() {
  const { registerWithEmail, loginWithGoogle, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [roleTab, setRoleTab] = useState('patient'); // 'patient' | 'psychologist'
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Patient registration form state
  const [patientData, setPatientData] = useState({
    fullName: '',
    email: '',
    password: '',
    gender: 'female',
    age: '28',
    phone: '',
    preferredName: '',
  });

  // Psychologist registration form state
  const [psychologistData, setPsychologistData] = useState({
    fullName: '',
    email: '',
    password: '',
    licenseNumber: '',
    bio: '',
    specializations: 'Cognitive Behavioral Therapy (CBT), Anxiety, Depression',
    offeredModes: 'both',
    defaultMode: 'in_person',
    languages: 'English',
  });

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Create Firebase Auth account
      await registerWithEmail(patientData.email, patientData.password);

      // 2. Commit authoritative patient profile to RTDB via backend
      await profileService.onboardPatient({
        fullName: patientData.fullName,
        gender: patientData.gender,
        age: parseInt(patientData.age, 10),
        phone: patientData.phone,
        preferredName: patientData.preferredName || patientData.fullName,
      });

      await refreshProfile();
      // Route patient directly to clinical intake stepper
      navigate('/patient/intake', { replace: true });
    } catch (err) {
      console.error('Patient registration error:', err);
      let msg = err.message || 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePsychologistSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Create Firebase Auth account
      await registerWithEmail(psychologistData.email, psychologistData.password);

      // 2. Commit authoritative psychologist profile to RTDB via backend
      const specs = psychologistData.specializations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const langs = psychologistData.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await profileService.onboardPsychologist({
        fullName: psychologistData.fullName,
        licenseNumber: psychologistData.licenseNumber,
        bio: psychologistData.bio,
        specializations: specs.length > 0 ? specs : ['General Counseling'],
        languages: langs.length > 0 ? langs : ['English'],
        offeredModes: psychologistData.offeredModes,
        defaultMode: psychologistData.defaultMode,
      });

      await refreshProfile();
      // Route psychologist directly to professional profile
      navigate('/psychologist/profile', { replace: true });
    } catch (err) {
      console.error('Psychologist registration error:', err);
      let msg = err.message || 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleQuickstart = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);

    try {
      const { profile } = await loginWithGoogle();
      if (!profile || profile.onboardingStatus !== 'completed') {
        navigate('/onboarding', { replace: true });
      } else if (profile.role === 'patient') {
        navigate('/patient/dashboard', { replace: true });
      } else {
        navigate('/psychologist/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Google quickstart error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed popup
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Sign-in popup was blocked by browser. Please allow popups or use email & password.');
      } else if (err.message && (err.message.includes('developer-approved testers') || err.message.includes('access_denied'))) {
        setErrorMsg('Google Sign-In is currently restricted to developer-approved testers on Google Cloud Platform. Please register using your email & password or contact the system administrator to add your Google account to test users.');
      } else {
        setErrorMsg(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="teal" size="sm">Create Account</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-primaryText">Join Psyco AI</h1>
          <p className="text-sm text-secondaryText">
            Connect to mental health practice management with clinical privacy.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex p-1.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => { setRoleTab('patient'); setErrorMsg(null); }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-sm font-semibold rounded-xl transition-all ${
              roleTab === 'patient'
                ? 'bg-slate-800 text-teal-300 border border-teal-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 text-teal-400" />
            Patient Registration
          </button>
          <button
            type="button"
            onClick={() => { setRoleTab('psychologist'); setErrorMsg(null); }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-sm font-semibold rounded-xl transition-all ${
              roleTab === 'psychologist'
                ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            Psychologist Registration
          </button>
        </div>

        {errorMsg && (
          <AlertBanner type="error" title="Registration Error" message={errorMsg} />
        )}

        <Card className="shadow-xl border-slate-700/60 bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-6">
            {/* Quickstart with Google */}
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-3 border-slate-700 hover:bg-slate-800 text-slate-200"
              onClick={handleGoogleQuickstart}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              Sign up with Google (Select Role Next)
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-700/80 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-wider">
                Or register with email
              </span>
            </div>

            {roleTab === 'patient' ? (
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="Jane Doe"
                  value={patientData.fullName}
                  onChange={(e) => setPatientData({ ...patientData, fullName: e.target.value })}
                  disabled={loading}
                />

                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                  icon={Mail}
                  value={patientData.email}
                  onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                  disabled={loading}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Gender"
                    required
                    value={patientData.gender}
                    onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                    disabled={loading}
                    options={[
                      { label: 'Female', value: 'female' },
                      { label: 'Male', value: 'male' },
                      { label: 'Non-binary', value: 'non_binary' },
                      { label: 'Prefer not to say', value: 'prefer_not_to_say' },
                    ]}
                  />

                  <Input
                    label="Age"
                    type="number"
                    min="10"
                    max="120"
                    required
                    placeholder="28"
                    value={patientData.age}
                    onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="+1 555-0199"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    disabled={loading}
                  />

                  <Input
                    label="Preferred Name (Optional)"
                    placeholder="What should we call you?"
                    value={patientData.preferredName}
                    onChange={(e) => setPatientData({ ...patientData, preferredName: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  icon={Lock}
                  value={patientData.password}
                  onChange={(e) => setPatientData({ ...patientData, password: e.target.value })}
                  disabled={loading}
                />

                <div className="p-3 bg-teal-950/20 border border-teal-500/20 rounded-xl text-xs text-teal-300/90 leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Your personal demographics are encrypted. Full clinical history and intake assessment take place confidentially in the next step.
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full flex items-center justify-center gap-2 pt-3"
                  disabled={loading || googleLoading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
                  Register & Continue to Clinical Intake
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePsychologistSubmit} className="space-y-4">
                <Input
                  label="Full Name & Clinical Credentials"
                  required
                  placeholder="Dr. Eleanor Vance, Ph.D."
                  value={psychologistData.fullName}
                  onChange={(e) => setPsychologistData({ ...psychologistData, fullName: e.target.value })}
                  disabled={loading}
                />

                <Input
                  label="Professional Email"
                  type="email"
                  required
                  placeholder="dr.vance@practice.com"
                  icon={Mail}
                  value={psychologistData.email}
                  onChange={(e) => setPsychologistData({ ...psychologistData, email: e.target.value })}
                  disabled={loading}
                />

                <Input
                  label="Clinical License Number"
                  required
                  placeholder="PSY-94820-CA"
                  value={psychologistData.licenseNumber}
                  onChange={(e) => setPsychologistData({ ...psychologistData, licenseNumber: e.target.value })}
                  disabled={loading}
                />

                <Textarea
                  label="Professional Bio"
                  required
                  rows={3}
                  placeholder="Licensed clinical psychologist specializing in evidence-based cognitive therapy..."
                  value={psychologistData.bio}
                  onChange={(e) => setPsychologistData({ ...psychologistData, bio: e.target.value })}
                  disabled={loading}
                />

                <Input
                  label="Specializations (comma separated)"
                  required
                  placeholder="CBT, Trauma, Anxiety, Depression"
                  value={psychologistData.specializations}
                  onChange={(e) => setPsychologistData({ ...psychologistData, specializations: e.target.value })}
                  disabled={loading}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Offered Consultation Modes"
                    value={psychologistData.offeredModes}
                    onChange={(e) => setPsychologistData({ ...psychologistData, offeredModes: e.target.value })}
                    disabled={loading}
                    options={[
                      { label: 'Both In-Person & Online', value: 'both' },
                      { label: 'In-Person Only', value: 'in_person' },
                      { label: 'Online Telehealth Only', value: 'online' },
                    ]}
                  />

                  <Select
                    label="Default Session Mode"
                    value={psychologistData.defaultMode}
                    onChange={(e) => setPsychologistData({ ...psychologistData, defaultMode: e.target.value })}
                    disabled={loading}
                    options={[
                      { label: 'In-Person (Default)', value: 'in_person' },
                      { label: 'Online Video', value: 'online' },
                    ]}
                  />
                </div>

                <Input
                  label="Languages Spoken"
                  placeholder="English, Spanish"
                  value={psychologistData.languages}
                  onChange={(e) => setPsychologistData({ ...psychologistData, languages: e.target.value })}
                  disabled={loading}
                />

                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  icon={Lock}
                  value={psychologistData.password}
                  onChange={(e) => setPsychologistData({ ...psychologistData, password: e.target.value })}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full flex items-center justify-center gap-2 pt-3"
                  disabled={loading || googleLoading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Stethoscope className="w-4 h-4" />}
                  Register Clinician Practice
                </Button>
              </form>
            )}

            <div className="pt-4 border-t border-slate-800 text-center text-xs text-secondaryText">
              <span>Already have an account? </span>
              <Link to="/login" className="text-softTeal hover:underline font-semibold ml-1">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
