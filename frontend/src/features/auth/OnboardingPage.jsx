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
import { User, Stethoscope, ArrowRight } from 'lucide-react';

export function OnboardingPage() {
  const { user, firebaseUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const initialName = firebaseUser?.displayName || user?.fullName || '';

  const [patientForm, setPatientForm] = useState({
    fullName: initialName,
    gender: 'female',
    age: '28',
    phone: '',
    preferredName: initialName,
  });

  const [psychologistForm, setPsychologistForm] = useState({
    fullName: initialName,
    licenseNumber: '',
    bio: '',
    specializations: 'Cognitive Behavioral Therapy (CBT)',
    offeredModes: 'both',
    defaultMode: 'in_person',
    languages: 'English',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (role === 'patient') {
        await profileService.onboardPatient({
          fullName: patientForm.fullName,
          gender: patientForm.gender,
          age: parseInt(patientForm.age, 10),
          phone: patientForm.phone,
          preferredName: patientForm.preferredName || patientForm.fullName,
        });
        await refreshProfile();
        navigate('/patient/intake', { replace: true });
      } else {
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
        navigate('/psychologist/profile', { replace: true });
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setErrorMsg(err.message || 'Failed to complete profile onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="teal" size="sm">Complete Account Setup</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-primaryText">Welcome to Psyco AI</h1>
          <p className="text-sm text-secondaryText">
            Please choose how you will be using the platform to configure your workspace.
          </p>
        </div>

        {errorMsg && (
          <AlertBanner type="error" title="Onboarding Error" message={errorMsg} />
        )}

        {/* Role Choice */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              role === 'patient'
                ? 'bg-teal-950/30 border-teal-500/60 shadow-lg text-teal-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-3">
              <User className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-100">I am a Patient</div>
            <div className="text-xs text-slate-400 mt-1">Seeking care, consultation, and intake management.</div>
          </button>

          <button
            type="button"
            onClick={() => setRole('psychologist')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              role === 'psychologist'
                ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg text-emerald-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-100">I am a Clinician</div>
            <div className="text-xs text-slate-400 mt-1">Psychologist managing clinical practice and patients.</div>
          </button>
        </div>

        <Card className="shadow-xl border-slate-700/60 bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {role === 'patient' ? (
                <>
                  <Input
                    label="Full Name"
                    required
                    value={patientForm.fullName}
                    onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Gender"
                      required
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
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
                      value={patientForm.age}
                      onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Phone Number"
                    placeholder="+1 555-0199"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="Full Name & Clinical Credentials"
                    required
                    value={psychologistForm.fullName}
                    onChange={(e) => setPsychologistForm({ ...psychologistForm, fullName: e.target.value })}
                  />
                  <Input
                    label="Clinical License Number"
                    required
                    placeholder="PSY-94820-CA"
                    value={psychologistForm.licenseNumber}
                    onChange={(e) => setPsychologistForm({ ...psychologistForm, licenseNumber: e.target.value })}
                  />
                  <Textarea
                    label="Professional Bio"
                    required
                    rows={3}
                    placeholder="Brief background and clinical focus..."
                    value={psychologistForm.bio}
                    onChange={(e) => setPsychologistForm({ ...psychologistForm, bio: e.target.value })}
                  />
                  <Input
                    label="Specializations (comma separated)"
                    required
                    value={psychologistForm.specializations}
                    onChange={(e) => setPsychologistForm({ ...psychologistForm, specializations: e.target.value })}
                  />
                  <Select
                    label="Session Modes"
                    value={psychologistForm.offeredModes}
                    onChange={(e) => setPsychologistForm({ ...psychologistForm, offeredModes: e.target.value })}
                    options={[
                      { label: 'Both In-Person & Online', value: 'both' },
                      { label: 'In-Person Only', value: 'in_person' },
                      { label: 'Online Telehealth Only', value: 'online' },
                    ]}
                  />
                </>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full flex items-center justify-center gap-2 pt-3"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
                Complete Setup & Enter Platform
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
