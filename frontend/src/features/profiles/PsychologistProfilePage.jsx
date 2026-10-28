import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import {
  Stethoscope,
  Award,
  MapPin,
  Video,
  Languages,
  Edit3,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

const toCommaSeparated = (val, defaultVal = '') => {
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'string') return val;
  return defaultVal;
};

export function PsychologistProfilePage() {
  const { user, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const psych = user?.profile || {};

  const [formData, setFormData] = useState({
    bio: psych.bio || '',
    specializations: toCommaSeparated(psych.specializations, 'Cognitive Behavioral Therapy (CBT)'),
    languages: toCommaSeparated(psych.languages, 'English'),
    offeredModes: psych.offeredModes || 'both',
    defaultMode: psych.defaultMode || 'in_person',
    timezone: psych.timezone || 'Asia/Kolkata',
    clinicAddress: {
      line1: psych.clinicAddress?.line1 || '',
      city: psych.clinicAddress?.city || '',
      state: psych.clinicAddress?.state || '',
      postalCode: psych.clinicAddress?.postalCode || '',
    },
  });

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        bio: user.profile.bio || '',
        specializations: toCommaSeparated(user.profile.specializations, 'Cognitive Behavioral Therapy (CBT)'),
        languages: toCommaSeparated(user.profile.languages, 'English'),
        offeredModes: user.profile.offeredModes || 'both',
        defaultMode: user.profile.defaultMode || 'in_person',
        timezone: user.profile.timezone || 'Asia/Kolkata',
        clinicAddress: {
          line1: user.profile.clinicAddress?.line1 || '',
          city: user.profile.clinicAddress?.city || '',
          state: user.profile.clinicAddress?.state || '',
          postalCode: user.profile.clinicAddress?.postalCode || '',
        },
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const specs = (formData.specializations || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const langs = (formData.languages || '')
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const payload = {
        bio: formData.bio?.trim() || 'Licensed clinical psychologist providing mental health care and therapy.',
        specializations: specs.length > 0 ? specs : ['General Counseling'],
        languages: langs.length > 0 ? langs : ['English'],
        offeredModes: formData.offeredModes || 'both',
        defaultMode: formData.defaultMode || 'in_person',
        timezone: formData.timezone || 'Asia/Kolkata',
      };

      if (formData.clinicAddress?.line1?.trim()) {
        payload.clinicAddress = {
          line1: formData.clinicAddress.line1.trim(),
          city: formData.clinicAddress.city?.trim() || '',
          state: formData.clinicAddress.state?.trim() || '',
          postalCode: formData.clinicAddress.postalCode?.trim() || '',
        };
      }

      await profileService.updatePsychologistProfile(payload);
      await refreshProfile();
      setEditing(false);
      setSuccessMsg('Psychologist practice profile updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Clinician Profile</Badge>
            <Badge variant="green" size="sm">
              {psych.approvalStatus === 'approved' ? 'Verified Practitioner' : 'Pending Verification'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Professional Practice Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your clinical credentials, session modes, and clinic location.
          </p>
        </div>

        {!editing ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            Edit Practice Profile
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            className="self-start sm:self-auto"
          >
            Cancel
          </Button>
        )}
      </div>

      {errorMsg && <AlertBanner type="error" title="Error" message={errorMsg} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Practice Autonomy Callout: Intake Template Builder */}
      <Card className="border-teal-500/30 bg-teal-950/20 shadow-md">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Practice Intake Questionnaire Builder</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                Customize your practice's intake questions. Patients will be prompted to answer these tailored clinical questions during onboarding.
              </p>
            </div>
          </div>

          <Link to="/psychologist/intake-settings">
            <Button variant="primary" size="sm" className="flex items-center gap-2 flex-shrink-0">
              Configure Questions
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Credentials */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl p-6 flex flex-col items-center text-center space-y-4">
          <InitialsAvatar
            name={user?.fullName || psych.fullName || 'Doctor'}
            email={user?.email}
            size="2xl"
          />

          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {user?.fullName || psych.fullName || 'Clinical Psychologist'}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-teal-400 font-mono mt-1">
              <Award className="w-3.5 h-3.5" />
              <span>License: {psych.licenseNumber || 'Unverified'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-slate-800/80 space-y-2 text-left text-xs">
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Session Mode</span>
              <span className="capitalize font-medium">{(formData.offeredModes || 'both').replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Default</span>
              <span className="capitalize font-medium text-teal-300">{(formData.defaultMode || 'in_person').replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Languages</span>
              <span className="font-medium">{formData.languages}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Timezone</span>
              <span className="font-medium">{formData.timezone}</span>
            </div>
          </div>
        </Card>

        {/* Right Columns: Bio, Specializations, Clinic Address */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardContent className="p-6">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <h3 className="text-sm font-semibold text-teal-300 mb-2">Edit Practice Information</h3>

                  <Textarea
                    label="Professional Bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />

                  <Input
                    label="Clinical Specializations (comma separated)"
                    value={formData.specializations}
                    onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Offered Session Modes"
                      value={formData.offeredModes}
                      onChange={(e) => setFormData({ ...formData, offeredModes: e.target.value })}
                      options={[
                        { label: 'Both In-Person & Online', value: 'both' },
                        { label: 'In-Person Clinic Only', value: 'in_person' },
                        { label: 'Online Telehealth Only', value: 'online' },
                      ]}
                    />

                    <Select
                      label="Default Session Mode"
                      value={formData.defaultMode}
                      onChange={(e) => setFormData({ ...formData, defaultMode: e.target.value })}
                      options={[
                        { label: 'In-Person (Default)', value: 'in_person' },
                        { label: 'Online Telehealth', value: 'online' },
                      ]}
                    />
                  </div>

                  <Input
                    label="Languages Spoken"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  />

                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Building className="w-4 h-4 text-teal-400" />
                      Clinic Physical Address (for In-Person Appointments)
                    </h4>
                    <Input
                      label="Street Address"
                      placeholder="Suite 400, 100 Medical Center Way"
                      value={formData.clinicAddress.line1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clinicAddress: { ...formData.clinicAddress, line1: e.target.value },
                        })
                      }
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="City"
                        placeholder="San Francisco"
                        value={formData.clinicAddress.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clinicAddress: { ...formData.clinicAddress, city: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="State / Province"
                        placeholder="CA"
                        value={formData.clinicAddress.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clinicAddress: { ...formData.clinicAddress, state: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="Postal Code"
                        placeholder="94103"
                        value={formData.clinicAddress.postalCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clinicAddress: { ...formData.clinicAddress, postalCode: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      About the Clinician
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      {psych.bio || formData.bio || 'No professional bio currently provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Specializations & Modalities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(psych.specializations)
                        ? psych.specializations
                        : typeof formData.specializations === 'string'
                        ? formData.specializations.split(',')
                        : ['General Counseling']
                      )
                        .map((s) => String(s || '').trim())
                        .filter(Boolean)
                        .map((spec, i) => (
                          <Badge key={i} variant="teal" size="sm">
                            {spec}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      Clinic Location
                    </h3>
                    {formData.clinicAddress?.line1 ? (
                      <div className="text-xs text-slate-200">
                        <div>{formData.clinicAddress.line1}</div>
                        <div className="text-slate-400">
                          {formData.clinicAddress.city}, {formData.clinicAddress.state} {formData.clinicAddress.postalCode}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No physical clinic address entered.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
