import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { profileService } from '../../services/profileService';
import {
  auth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from '../../services/firebase';
import {
  Settings,
  Moon,
  Sun,
  Shield,
  Bell,
  Lock,
  Trash2,
  AlertTriangle,
  Save,
  CheckCircle2,
  User,
  ArrowRight,
} from 'lucide-react';

export function SettingsPage() {
  const { user, firebaseUser, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('preferences'); // 'preferences' | 'security' | 'danger'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Preferences form state
  const [preferences, setPreferences] = useState({
    theme: theme || 'dark',
    timezone: user?.preferences?.timezone || 'Asia/Kolkata',
    language: user?.preferences?.language || 'en',
    emailNotifications: user?.preferences?.emailNotifications ?? true,
  });

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Danger zone deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        theme: user.preferences.theme || theme || 'dark',
        timezone: user.preferences.timezone || 'Asia/Kolkata',
        language: user.preferences.language || 'en',
        emailNotifications: user.preferences.emailNotifications ?? true,
      });
    }
  }, [user, theme]);

  // Save Preferences
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await profileService.updatePreferences(preferences);
      setTheme(preferences.theme);
      await refreshProfile();
      setSuccessMsg('Your preferences have been saved.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save preferences.');
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No authenticated user session found.');
      }

      // Re-authenticate user before updating sensitive credential
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password in Firebase Auth
      await updatePassword(firebaseUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Your password has been changed successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Password change error:', err);
      let msg = 'Failed to update password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Current password is incorrect. Please check and try again.';
      } else if (err.code === 'auth/requires-recent-login') {
        msg = 'Security requires you to sign in again before changing your password.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete / Deactivate Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      setErrorMsg('You must type DELETE_MY_ACCOUNT exactly to proceed.');
      return;
    }

    setDeleting(true);
    setErrorMsg(null);

    try {
      await profileService.deleteAccount(deleteConfirmation, deleteReason);
      await logout();
      window.location.href = '/?account_closed=true';
    } catch (err) {
      setErrorMsg(err.message || 'Account deactivation failed.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">System Configuration</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Settings className="w-7 h-7 text-teal-400" />
            Account & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your display preferences, notifications, security credentials, and data privacy.
          </p>
        </div>

        {user?.role && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (user.role === 'patient') window.location.href = '/patient/profile';
                else if (user.role === 'psychologist') window.location.href = '/psychologist/profile';
              }}
              className="flex items-center gap-2 text-xs"
            >
              <User className="w-3.5 h-3.5" />
              View {user.role === 'patient' ? 'Patient' : 'Clinician'} Profile
            </Button>
          </div>
        )}
      </div>

      {errorMsg && <AlertBanner type="error" title="Settings Error" message={errorMsg} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Settings Navigation Tabs */}
      <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => { setActiveTab('preferences'); setErrorMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'preferences'
              ? 'bg-slate-800 text-teal-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Preferences & Theme
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('security'); setErrorMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'security'
              ? 'bg-slate-800 text-teal-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Security & Password
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('danger'); setErrorMsg(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'danger'
              ? 'bg-red-950/40 text-red-300 border border-red-500/30 shadow-sm'
              : 'text-slate-400 hover:text-red-400'
          }`}
        >
          Danger Zone
        </button>
      </div>

      {/* TAB 1: Preferences & Theme */}
      {activeTab === 'preferences' && (
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Moon className="w-5 h-5 text-teal-400" />
                Appearance & Theme Preference
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize your display theme. Preference syncs automatically across your devices.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setPreferences({ ...preferences, theme: 'dark' });
                  setTheme('dark');
                }}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  preferences.theme === 'dark'
                    ? 'bg-teal-950/30 border-teal-500/60 text-teal-300 shadow-md ring-1 ring-teal-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Moon className="w-6 h-6 text-teal-400" />
                <span className="text-xs font-semibold">Dark Mode (Default)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreferences({ ...preferences, theme: 'light' });
                  setTheme('light');
                }}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  preferences.theme === 'light'
                    ? 'bg-teal-950/30 border-teal-500/60 text-teal-300 shadow-md ring-1 ring-teal-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sun className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-semibold">Light Mode</span>
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Primary Timezone"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  options={[
                    { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
                    { label: 'America/New_York (EST)', value: 'America/New_York' },
                    { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
                    { label: 'Europe/London (GMT)', value: 'Europe/London' },
                    { label: 'UTC', value: 'UTC' },
                  ]}
                />

                <Select
                  label="Interface Language"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  options={[
                    { label: 'English (US / UK)', value: 'en' },
                    { label: 'Hindi (Scaffolded)', value: 'hi' },
                    { label: 'Spanish (Scaffolded)', value: 'es' },
                  ]}
                />
              </div>

              <div className="pt-3">
                <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-teal-400" />
                  Notifications & Reminders
                </h4>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer max-w-lg">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) =>
                      setPreferences({ ...preferences, emailNotifications: e.target.checked })
                    }
                    className="accent-teal-400 rounded"
                  />
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-100 block">Session & Appointment Reminders</span>
                    Receive automated email alerts for upcoming clinical appointments and intake updates.
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  Save All Preferences
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                Security & Authentication
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Update your account password or review session protection.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                required
                icon={Lock}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Input
                label="New Password (Minimum 8 characters)"
                type="password"
                required
                icon={Lock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={passwordLoading}
                className="flex items-center gap-2 pt-2"
              >
                {passwordLoading ? <LoadingSpinner size="sm" /> : <Lock className="w-4 h-4" />}
                Update Account Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Danger Zone */}
      {activeTab === 'danger' && (
        <Card className="border-red-500/30 bg-red-950/10 shadow-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-red-300">Deactivate / Close Account</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                  Deactivating your account will permanently revoke your access to the Psyco AI platform and remove your credentials. In accordance with healthcare compliance laws, clinical session notes, verified audit logs, and medical charts are retained under strict regulatory data retention schedules.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Proceed to Account Deactivation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Confirm Account Deactivation</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To confirm that you wish to deactivate your Psyco AI account, please type <span className="font-mono text-red-400 font-bold">DELETE_MY_ACCOUNT</span> in the field below.
            </p>

            <Input
              label="Confirmation Code"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE_MY_ACCOUNT"
            />

            <Input
              label="Reason for leaving (Optional)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Tell us why you are closing your account"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE_MY_ACCOUNT' || deleting}
                className="flex items-center gap-2"
              >
                {deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                Confirm Deactivation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
