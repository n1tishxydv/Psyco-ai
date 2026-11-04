import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { googleCalendarService } from '../../services/googleCalendarService';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Video,
  Clock,
  LogOut,
  Info,
} from 'lucide-react';

export function GoogleCalendarIntegrationCard({ returnTo }) {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState({
    connected: false,
    status: 'NOT_CONNECTED',
    connectedEmail: null,
    connectedAt: null,
    lastSyncedAt: null,
    isConfigured: true,
  });
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const effectiveReturnTo =
    returnTo ||
    (user?.role === 'psychologist' || user?.activeRole === 'psychologist'
      ? '/psychologist/settings?tab=integrations'
      : '/patient/settings?tab=integrations');

  // Load connection status from backend (Authoritative verification)
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await googleCalendarService.getConnectionStatus();
      if (res.data) {
        setStatus(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch Google Calendar status:', err);
      // Fallback offline state
      setStatus((prev) => ({ ...prev, connected: false, status: 'NOT_CONNECTED' }));
    } finally {
      setLoading(false);
    }
  };

  // Wait for authentication state before querying status
  useEffect(() => {
    if (!authLoading && user) {
      fetchStatus();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  // Read URL params from OAuth callback redirects
  useEffect(() => {
    const calendarConnected = searchParams.get('calendar_connected');
    const calendarError = searchParams.get('calendar_error');
    const errorDescription = searchParams.get('error_description');

    if (calendarConnected === 'true') {
      setSuccessMsg('Verifying Google Calendar connection status...');
      // Re-trigger authoritative status check
      fetchStatus().then(() => {
        setSuccessMsg('Google Calendar connected successfully! Your upcoming sessions will sync automatically.');
      });
      searchParams.delete('calendar_connected');
      setSearchParams(searchParams, { replace: true });
    } else if (calendarError) {
      if (calendarError === 'access_denied') {
        setErrorMsg(
          'Google Calendar access was not granted (OAuth 403). Check that your Google account is approved for this application\'s testing mode.'
        );
      } else if (calendarError === 'missing_code_or_state') {
        setErrorMsg('Google Calendar connection was cancelled. Your existing Psyco AI account and appointments are unchanged.');
      } else if (calendarError.includes('expired')) {
        setErrorMsg('Your authorization request expired. Please connect Google Calendar again.');
      } else if (calendarError.includes('signature')) {
        setErrorMsg('Security validation error (OAuth state signature mismatch). Please initiate connection again.');
      } else {
        setErrorMsg(`Calendar connection failed: ${calendarError}${errorDescription ? ` - ${errorDescription}` : ''}`);
      }
      searchParams.delete('calendar_error');
      searchParams.delete('error_description');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleConnect = async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      const res = await googleCalendarService.getAuthUrl(effectiveReturnTo);
      const authUrl = res.data?.url || res.data?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setErrorMsg('Backend did not provide a valid Google authorization URL.');
        setConnecting(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate Google Calendar connection.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setErrorMsg(null);
    try {
      await googleCalendarService.disconnect();
      setShowDisconnectModal(false);
      setSuccessMsg('Google Calendar disconnected cleanly.');
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to disconnect Google Calendar.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-psyco-steel/70 bg-psyco-slate shadow-xl">
        <CardContent className="p-8 flex flex-col items-center justify-center space-y-3">
          <LoadingSpinner size="md" />
          <p className="text-xs text-psyco-coolGrey">Checking Google Calendar connection...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-psyco-steel/70 bg-psyco-slate shadow-xl">
      <CardContent className="p-6 space-y-6">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-psyco-steel/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-psyco-softGrey">
                  Google Calendar & Telehealth Sync
                </h3>
                {status.connected ? (
                  <Badge variant="green" size="sm" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Not Connected</Badge>
                )}
              </div>
              <p className="text-xs text-psyco-coolGrey mt-0.5">
                Automatically synchronize consultations with your Google Calendar and generate secure Google Meet video links.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              className="text-xs text-psyco-coolGrey hover:text-psyco-softGrey flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <AlertBanner
            type="error"
            title="Google Calendar Error"
            message={errorMsg}
            onDismiss={() => setErrorMsg(null)}
          />
        )}
        {successMsg && (
          <AlertBanner
            type="success"
            title="Calendar Synchronized"
            message={successMsg}
            onDismiss={() => setSuccessMsg(null)}
          />
        )}

        {/* Testing Mode Informational Banner */}
        <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200/90 leading-relaxed">
            <span className="font-semibold text-blue-100">OAuth Staging Testing Mode:</span> Psyco AI uses Google OAuth 2.0. During staging verification, access is restricted to accounts registered on the approved Google Cloud Console Test Users list.
          </div>
        </div>

        {/* MAIN BODY: Connected vs Disconnected */}
        {status.connected ? (
          <div className="space-y-6">
            {/* Connection Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-psyco-darkNavy/60 rounded-xl border border-psyco-steel/50">
              <div>
                <p className="text-[11px] text-psyco-coolGrey uppercase tracking-wider font-semibold">Connected Account</p>
                <p className="text-sm font-medium text-psyco-softGrey mt-0.5 truncate">
                  {status.connectedEmail || 'Authorized Google Account'}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-psyco-coolGrey uppercase tracking-wider font-semibold">Synchronization State</p>
                <p className="text-sm font-medium text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active & Synced
                </p>
              </div>

              <div>
                <p className="text-[11px] text-psyco-coolGrey uppercase tracking-wider font-semibold">Connected Since</p>
                <p className="text-sm font-medium text-psyco-softGrey mt-0.5">
                  {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : 'Active'}
                </p>
              </div>
            </div>

            {/* Sync Features Active */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-psyco-coolGrey uppercase tracking-wider">Active Integrations</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-psyco-darkNavy/40 rounded-lg border border-psyco-steel/40 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-xs text-psyco-softGrey">Two-way appointment time & reschedule synchronization</span>
                </div>
                <div className="p-3 bg-psyco-darkNavy/40 rounded-lg border border-psyco-steel/40 flex items-center gap-3">
                  <Video className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs text-psyco-softGrey">Automated Google Meet conference link generation</span>
                </div>
              </div>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="p-3.5 bg-psyco-darkNavy/70 rounded-xl border border-psyco-steel/40 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-psyco-coolGrey leading-relaxed">
                <span className="font-semibold text-psyco-softGrey">Clinical Privacy Guarantee:</span> Events appear as generic "Psyco AI Appointment". No patient names, diagnoses, transcripts, or clinical notes are ever transmitted to Google Calendar.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} />
                Reconnect Account
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDisconnectModal(true)}
                className="flex items-center gap-2 text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Calendar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Value Proposition Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-psyco-darkNavy/50 rounded-xl border border-psyco-steel/40 space-y-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <h4 className="text-xs font-semibold text-psyco-softGrey">Automatic Reminders</h4>
                <p className="text-[11px] text-psyco-coolGrey leading-relaxed">
                  Appointments automatically populate in your primary Google Calendar with alerts.
                </p>
              </div>

              <div className="p-4 bg-psyco-darkNavy/50 rounded-xl border border-psyco-steel/40 space-y-2">
                <Video className="w-5 h-5 text-blue-400" />
                <h4 className="text-xs font-semibold text-psyco-softGrey">Google Meet Ready</h4>
                <p className="text-[11px] text-psyco-coolGrey leading-relaxed">
                  Virtual consultations generate direct Google Meet video conferencing links.
                </p>
              </div>

              <div className="p-4 bg-psyco-darkNavy/50 rounded-xl border border-psyco-steel/40 space-y-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-semibold text-psyco-softGrey">Strict Clinical Privacy</h4>
                <p className="text-[11px] text-psyco-coolGrey leading-relaxed">
                  Zero clinical notes, therapy transcripts, or diagnostic information are shared.
                </p>
              </div>
            </div>

            {/* Scope & Permission Transparency */}
            <div className="p-4 bg-psyco-darkNavy/70 rounded-xl border border-psyco-steel/40 space-y-2">
              <h4 className="text-xs font-semibold text-psyco-softGrey flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Requested OAuth Scope: Calendar Events Owned
              </h4>
              <p className="text-xs text-psyco-coolGrey leading-relaxed">
                Psyco AI requests the minimized <code className="text-teal-300 bg-psyco-deepNavy px-1 py-0.5 rounded text-[11px]">calendar.events.owned</code> permission. This allows the application to manage only events on your owned calendars. Psyco AI cannot view or modify your emails, contacts, or unrelated personal calendars.
              </p>
            </div>

            {/* Connect CTA Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-psyco-coolGrey">
                Clicking connect will securely redirect you to Google's consent screen.
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 font-semibold shadow-lg shadow-teal-500/20"
              >
                {connecting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Redirecting to Google...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Connect Google Calendar</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Disconnect Confirmation Modal */}
        {showDisconnectModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-psyco-darkNavy border border-psyco-steel/80 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-psyco-softGrey">
                    Disconnect Google Calendar?
                  </h3>
                  <p className="text-xs text-psyco-coolGrey mt-1 leading-relaxed">
                    This will revoke Psyco AI's access to your Google Calendar and remove the connection. Your existing appointments inside Psyco AI will remain intact, but future sessions will no longer synchronize.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-psyco-steel/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDisconnectModal(false)}
                  disabled={disconnecting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-xs flex items-center gap-1.5"
                >
                  {disconnecting ? <LoadingSpinner size="sm" /> : <LogOut className="w-3.5 h-3.5" />}
                  Confirm Disconnect
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

