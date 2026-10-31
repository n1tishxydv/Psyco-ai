import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profileService';
import {
  User,
  Phone,
  Clock,
  Heart,
  ClipboardList,
  Edit3,
  Save,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export function PatientProfilePage() {
  const { user, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    phone: user?.profile?.phone || '',
    preferredName: user?.profile?.preferredName || '',
    timezone: user?.profile?.timezone || 'Asia/Kolkata',
    emergencyContact: {
      name: user?.profile?.emergencyContact?.name || '',
      relationship: user?.profile?.emergencyContact?.relationship || '',
      phone: user?.profile?.emergencyContact?.phone || '',
    },
  });

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        phone: user.profile.phone || '',
        preferredName: user.profile.preferredName || user.fullName || '',
        timezone: user.profile.timezone || 'Asia/Kolkata',
        emergencyContact: {
          name: user.profile.emergencyContact?.name || '',
          relationship: user.profile.emergencyContact?.relationship || '',
          phone: user.profile.emergencyContact?.phone || '',
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
      await profileService.updatePatientProfile(formData);
      await refreshProfile();
      setEditing(false);
      setSuccessMsg('Your patient profile was successfully updated.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const patient = user?.profile || {};
  const intakeStatus = user?.intakeStatus || 'not_started';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">Patient Workspace</Badge>
            <Badge variant="neutral" size="sm">Active Account</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
            Personal Profile & Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your personal contact details, preferences, and clinical intake.
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
            Edit Profile
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

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Identity */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl p-6 flex flex-col items-center text-center space-y-4">
          <InitialsAvatar
            name={user?.fullName || patient.fullName || 'Patient'}
            email={user?.email}
            size="2xl"
          />

          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {user?.fullName || patient.fullName || 'Registered Patient'}
            </h2>
            <p className="text-xs text-teal-400 font-medium capitalize mt-0.5">
              {patient.preferredName ? `Prefers: "${patient.preferredName}"` : 'Patient Account'}
            </p>
            <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-slate-800/80 space-y-2 text-left text-xs">
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Gender</span>
              <span className="capitalize font-medium">{patient.gender?.replace('_', ' ') || 'Unspecified'}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Age</span>
              <span className="font-medium">{patient.age ? `${patient.age} years` : 'Unspecified'}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Timezone</span>
              <span className="font-medium">{formData.timezone}</span>
            </div>
          </div>
        </Card>

        {/* Right Columns: Details & Intake Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Intake Status Card */}
          <Card className="border-teal-500/30 bg-teal-950/20 shadow-md">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-100">Clinical Intake Assessment</h3>
                    {intakeStatus === 'submitted' ? (
                      <Badge variant="green" size="sm">Completed</Badge>
                    ) : intakeStatus === 'draft' ? (
                      <Badge variant="amber" size="sm">Draft in Progress</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Not Started</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    {intakeStatus === 'submitted'
                      ? 'Your assessment has been securely signed and submitted for clinical review.'
                      : 'Complete your confidential background and health history so your clinician can prepare for your sessions.'}
                  </p>
                </div>
              </div>

              <Link to="/patient/intake" className="flex-shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <span>{intakeStatus === 'submitted' ? 'View Intake' : 'Open Intake Form'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Details / Edit Form */}
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardContent className="p-6">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <h3 className="text-sm font-semibold text-teal-300 mb-2">Edit Contact Details</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Preferred Name / Nickname"
                      value={formData.preferredName}
                      onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  />

                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-300 mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Name"
                        value={formData.emergencyContact.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="Relationship"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="Phone"
                        value={formData.emergencyContact.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
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
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-200">Contact & Emergency Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 font-semibold block">Primary Phone</span>
                      <span className="text-slate-200 font-medium">
                        {patient.phone || formData.phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 font-semibold block">Timezone</span>
                      <span className="text-slate-200 font-medium">{formData.timezone}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      Emergency Point of Contact
                    </span>
                    <div className="text-xs text-slate-200">
                      {formData.emergencyContact?.name ? (
                        <div>
                          <span className="font-semibold">{formData.emergencyContact.name}</span> (
                          {formData.emergencyContact.relationship || 'Contact'}):{' '}
                          <span className="text-teal-400">{formData.emergencyContact.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No emergency contact currently configured.</span>
                      )}
                    </div>
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
