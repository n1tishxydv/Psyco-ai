import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { AlertBanner } from '../../components/common/AlertBanner';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Lock, Mail, KeyRound, CheckCircle, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle, requestPasswordReset, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isSessionExpired = location.state?.sessionExpired || queryParams.get('sessionExpired') === 'true';
  const returnUrlParam = queryParams.get('returnUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);

  const handlePostLoginRedirect = (profile) => {
    // If a returnUrl was preserved during session expiration or protected route bounce
    const targetUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : location.state?.from?.pathname;
    if (targetUrl && targetUrl !== '/login' && targetUrl !== '/register') {
      navigate(targetUrl, { replace: true });
      return;
    }

    if (!profile || profile.onboardingStatus !== 'completed') {
      navigate('/onboarding', { replace: true });
    } else if (profile.role === 'patient') {
      navigate('/patient/dashboard', { replace: true });
    } else if (profile.role === 'psychologist') {
      navigate('/psychologist/dashboard', { replace: true });
    } else if (profile.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { profile } = await loginWithEmail(email, password);
      handlePostLoginRedirect(profile);
    } catch (err) {
      console.error('Login error:', err);
      let message = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please reset your password or try again later.';
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);

    try {
      const { profile } = await loginWithGoogle();
      handlePostLoginRedirect(profile);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed popup
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Sign-in popup was blocked by browser. Please allow popups or use email & password.');
      } else if (err.message && (err.message.includes('developer-approved testers') || err.message.includes('access_denied'))) {
        setErrorMsg('Google Sign-In is currently restricted to developer-approved testers on Google Cloud Platform. Please sign in using your email & password or contact the system administrator to add your Google account to test users.');
      } else {
        setErrorMsg(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);

    try {
      await requestPasswordReset(resetEmail);
      setResetSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setResetError(err.message || 'Unable to send password reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="teal" size="sm">Secure Sign In</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-primaryText">Welcome to Psyco AI</h1>
          <p className="text-sm text-secondaryText">
            Sign in to access your clinical practice or patient care portal.
          </p>
        </div>

        {isSessionExpired && (
          <AlertBanner
            type="warning"
            title="Session Expired"
            message="Your session has expired due to inactivity. Please sign in again to continue."
          />
        )}

        {errorMsg && (
          <AlertBanner type="error" title="Authentication Error" message={errorMsg} />
        )}

        <Card className="shadow-xl border-slate-700/60 bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-5">
            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-3 border-slate-700 hover:bg-slate-800 text-slate-200"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-700/80 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-400 uppercase tracking-wider">
                Or with email
              </span>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                placeholder="clinician@practice.com"
                disabled={loading || googleLoading}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetSuccess(false);
                      setResetError(null);
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  placeholder="••••••••"
                  disabled={loading || googleLoading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full flex items-center justify-center gap-2 mt-2"
                disabled={loading || googleLoading}
              >
                {loading ? <LoadingSpinner size="sm" /> : <LogIn className="w-4 h-4" />}
                Sign In to Platform
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-800 text-center text-xs text-secondaryText">
              <span>New to Psyco AI? </span>
              <Link to="/register" className="text-softTeal hover:underline font-semibold ml-1">
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Reset Your Password</h3>
                <p className="text-xs text-slate-400">We'll email you a secure link to reset it.</p>
              </div>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-teal-950/40 border border-teal-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-teal-300 font-medium text-sm">
                  <CheckCircle className="w-5 h-5 text-teal-400" />
                  Password Reset Email Sent
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Please check your inbox at <span className="text-teal-400 font-semibold">{resetEmail}</span> and follow the instructions to choose a new password.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowForgotModal(false)}
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <AlertBanner type="error" title="Reset Error" message={resetError} />
                )}
                <Input
                  label="Registered Account Email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  icon={Mail}
                />
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForgotModal(false)}
                    disabled={resetLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={resetLoading}
                    className="flex items-center gap-2"
                  >
                    {resetLoading ? <LoadingSpinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
