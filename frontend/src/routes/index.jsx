import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PublicLayout } from '../components/layout/PublicLayout';
import { PatientLayout } from '../components/layout/PatientLayout';
import { PsychologistLayout } from '../components/layout/PsychologistLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Public Feature Pages (Static direct imports for immediate first paint)
import { HomePage } from '../features/public/HomePage';
import { AboutPage } from '../features/public/AboutPage';
import { ServicesPage } from '../features/public/ServicesPage';
import { FaqPage } from '../features/public/FaqPage';
import { ContactPage } from '../features/public/ContactPage';
import { PrivacyPage } from '../features/public/PrivacyPage';
import { TermsPage } from '../features/public/TermsPage';
import { DataPrivacyPage } from '../features/public/DataPrivacyPage';
import { GetStartedPage } from '../features/public/GetStartedPage';
import { PatientPortalInfoPage } from '../features/public/PatientPortalInfoPage';
import { PsychologistPortalInfoPage } from '../features/public/PsychologistPortalInfoPage';

// Auth & Onboarding Feature Pages (Static direct imports for instant auth flow)
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { OnboardingPage } from '../features/auth/OnboardingPage';
import { WorkspaceChooserPage } from '../features/auth/WorkspaceChooserPage';

// Directory & Public Booking
import { PsychologistDirectoryPage } from '../features/directory/PsychologistDirectoryPage';
import { BookingPage } from '../features/appointments/BookingPage';

// Prioritized Lazy-Loaded Route Components (Admin & Clinical Workspaces)
const AdminDashboard = lazy(() =>
  import('../features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const SessionWorkspacePage = lazy(() =>
  import('../features/clinical/SessionWorkspacePage').then((m) => ({ default: m.SessionWorkspacePage }))
);
const PatientChartPage = lazy(() =>
  import('../features/clinical/PatientChartPage').then((m) => ({ default: m.PatientChartPage }))
);
const PatientDirectoryPage = lazy(() =>
  import('../features/clinical/PatientDirectoryPage').then((m) => ({ default: m.PatientDirectoryPage }))
);
const TreatmentPlansPage = lazy(() =>
  import('../features/clinical/TreatmentPlansPage').then((m) => ({ default: m.TreatmentPlansPage }))
);
const ReportsPage = lazy(() =>
  import('../features/clinical/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const PatientCarePlanPage = lazy(() =>
  import('../features/patients/PatientCarePlanPage').then((m) => ({ default: m.PatientCarePlanPage }))
);
const TranscriptStudioPage = lazy(() =>
  import('../features/transcription/TranscriptStudioPage').then((m) => ({ default: m.TranscriptStudioPage }))
);
const PatientAssessmentRunnerPage = lazy(() =>
  import('../features/assessments/PatientAssessmentRunnerPage').then((m) => ({ default: m.PatientAssessmentRunnerPage }))
);

// Lazy-Loaded Portals & Dashboards
const PatientDashboard = lazy(() =>
  import('../features/patients/PatientDashboard').then((m) => ({ default: m.PatientDashboard }))
);
const PsychologistDashboard = lazy(() =>
  import('../features/psychologists/PsychologistDashboard').then((m) => ({ default: m.PsychologistDashboard }))
);
const AppointmentsPage = lazy(() =>
  import('../features/appointments/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage }))
);
const ClinicalNotesPage = lazy(() =>
  import('../features/clinicalNotes/ClinicalNotesPage').then((m) => ({ default: m.ClinicalNotesPage }))
);
const PatientAppointmentsPage = lazy(() =>
  import('../features/appointments/PatientAppointmentsPage').then((m) => ({ default: m.PatientAppointmentsPage }))
);
const PsychologistCalendarPage = lazy(() =>
  import('../features/appointments/PsychologistCalendarPage').then((m) => ({ default: m.PsychologistCalendarPage }))
);
const AvailabilitySettingsPage = lazy(() =>
  import('../features/psychologists/AvailabilitySettingsPage').then((m) => ({ default: m.AvailabilitySettingsPage }))
);
const PracticeSetupPage = lazy(() =>
  import('../features/psychologists/PracticeSetupPage').then((m) => ({ default: m.PracticeSetupPage }))
);
const PatientIntakePage = lazy(() =>
  import('../features/intake/PatientIntakePage').then((m) => ({ default: m.PatientIntakePage }))
);
const PatientProfilePage = lazy(() =>
  import('../features/profiles/PatientProfilePage').then((m) => ({ default: m.PatientProfilePage }))
);
const PsychologistProfilePage = lazy(() =>
  import('../features/profiles/PsychologistProfilePage').then((m) => ({ default: m.PsychologistProfilePage }))
);
const IntakeTemplateSettingsPage = lazy(() =>
  import('../features/psychologists/IntakeTemplateSettingsPage').then((m) => ({ default: m.IntakeTemplateSettingsPage }))
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

// Lazy-Loaded Legal, Privacy & Documentation Pages
const DocumentationCentrePage = lazy(() =>
  import('../features/public/DocumentationCentrePage').then((m) => ({ default: m.DocumentationCentrePage }))
);
const CookiePolicyPage = lazy(() =>
  import('../features/public/CookiePolicyPage').then((m) => ({ default: m.CookiePolicyPage }))
);
const AiTransparencyPage = lazy(() =>
  import('../features/public/AiTransparencyPage').then((m) => ({ default: m.AiTransparencyPage }))
);
const MedicalDisclaimerPage = lazy(() =>
  import('../features/public/MedicalDisclaimerPage').then((m) => ({ default: m.MedicalDisclaimerPage }))
);
const DataRetentionPolicyPage = lazy(() =>
  import('../features/public/DataRetentionPolicyPage').then((m) => ({ default: m.DataRetentionPolicyPage }))
);
const AcceptableUsePage = lazy(() =>
  import('../features/public/AcceptableUsePage').then((m) => ({ default: m.AcceptableUsePage }))
);
const AccessibilityPage = lazy(() =>
  import('../features/public/AccessibilityPage').then((m) => ({ default: m.AccessibilityPage }))
);
const PrivacyRequestsPage = lazy(() =>
  import('../features/public/PrivacyRequestsPage').then((m) => ({ default: m.PrivacyRequestsPage }))
);
const AdminGuidePage = lazy(() =>
  import('../features/public/AdminGuidePage').then((m) => ({ default: m.AdminGuidePage }))
);

// 404 Not Found Page
import { EmptyState } from '../components/common/EmptyState';
import { FileQuestion } from 'lucide-react';

function NotFoundPage() {
  const { user } = useAuth();
  const dashboardPath =
    user?.role === 'psychologist' || user?.activeRole === 'psychologist'
      ? '/psychologist/dashboard'
      : user?.role === 'patient' || user?.activeRole === 'patient'
      ? '/patient/dashboard'
      : '/';

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <EmptyState
          icon={FileQuestion}
          title="Page Not Found"
          description="The requested URL was not found on the Psyco AI platform."
          actionLabel={user ? 'Return to Dashboard' : 'Return to Home'}
          onAction={() => (window.location.href = dashboardPath)}
        />
      </div>
    </div>
  );
}

function SettingsRedirect() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const isPsychologist =
    user?.role === 'psychologist' || user?.activeRole === 'psychologist';
  return (
    <Navigate
      to={isPsychologist ? `/psychologist/settings${queryString}` : `/patient/settings${queryString}`}
      replace
    />
  );
}

function AppointmentsRedirect() {
  const { user } = useAuth();
  const isPsychologist =
    user?.role === 'psychologist' || user?.activeRole === 'psychologist';
  return (
    <Navigate
      to={isPsychologist ? '/psychologist/appointments' : '/patient/appointments'}
      replace
    />
  );
}

function RouteLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[50vh] space-y-3" role="status">
      <LoadingSpinner size="lg" />
      <p className="text-xs text-psyco-coolGrey animate-pulse">Loading workspace...</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* ========================================================= */}
        {/* 1. PUBLIC MARKETING, LEGAL, AUTH & ONBOARDING ROUTES      */}
        {/*    Wrapped in PublicLayout (Navbar + Footer)              */}
        {/* ========================================================= */}
        <Route element={<PublicLayout />}>
          {/* Core Public Website */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/get-started" element={<GetStartedPage />} />

          {/* Portal Information & Guides */}
          <Route path="/for-patients" element={<PatientPortalInfoPage />} />
          <Route path="/patient-portal" element={<Navigate to="/for-patients" replace />} />
          <Route path="/patient-guide" element={<Navigate to="/for-patients" replace />} />
          <Route path="/for-psychologists" element={<PsychologistPortalInfoPage />} />
          <Route path="/psychologist-portal" element={<Navigate to="/for-psychologists" replace />} />
          <Route path="/psychologist-guide" element={<Navigate to="/for-psychologists" replace />} />
          <Route path="/admin-guide" element={<AdminGuidePage />} />

          {/* Central Documentation Centre & Legal Policies */}
          <Route path="/legal" element={<DocumentationCentrePage />} />
          <Route path="/documentation" element={<Navigate to="/legal" replace />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/data-privacy" element={<DataPrivacyPage />} />
          <Route path="/security-overview" element={<Navigate to="/data-privacy" replace />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/ai-transparency" element={<AiTransparencyPage />} />
          <Route path="/medical-disclaimer" element={<MedicalDisclaimerPage />} />
          <Route path="/data-retention" element={<DataRetentionPolicyPage />} />
          <Route path="/acceptable-use" element={<AcceptableUsePage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/privacy-requests" element={<PrivacyRequestsPage />} />

          {/* Authentication & Multi-Role Selection */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/workspace-select"
            element={
              <ProtectedRoute allowUnonboarded={true}>
                <WorkspaceChooserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowUnonboarded={true}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Directory & Booking */}
          <Route path="/find-psychologist" element={<PsychologistDirectoryPage />} />
          <Route path="/book/:psychologistId" element={<BookingPage />} />

          {/* Shared Authenticated Account Settings Redirect */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <AppointmentsRedirect />
              </ProtectedRoute>
            }
          />

          {/* Obsolete / Deprecated Route Redirections */}
          <Route
            path="/clinical/reports"
            element={
              <ProtectedRoute>
                <Navigate to="/psychologist/reports" replace />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ========================================================= */}
        {/* 2. AUTHENTICATED PATIENT WORKSPACE                       */}
        {/*    Wrapped in PatientLayout (Persistent Portal Nav)       */}
        {/* ========================================================= */}
        <Route element={<PatientLayout />}>
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/intake"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <PatientIntakePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <PatientProfilePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <PatientAppointmentsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/care-plan"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <PatientCarePlanPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/assessments/:assignmentId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <PatientAssessmentRunnerPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/settings"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['patient']}>
                  <SettingsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/patient/*" element={<NotFoundPage />} />
        </Route>

        {/* ========================================================= */}
        {/* 3. AUTHENTICATED CLINICAL WORKSPACE                      */}
        {/*    Wrapped in PsychologistLayout (Clinical Nav & Tools)   */}
        {/* ========================================================= */}
        <Route element={<PsychologistLayout />}>
          <Route
            path="/psychologist/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PsychologistDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/profile"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PsychologistProfilePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/intake-settings"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <IntakeTemplateSettingsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/practice-setup"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PracticeSetupPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/appointments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PsychologistCalendarPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/calendar"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PsychologistCalendarPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PsychologistCalendarPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/availability"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <AvailabilitySettingsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/patients"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PatientDirectoryPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/patients/:patientId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <PatientChartPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/sessions/appointment/:appointmentId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <SessionWorkspacePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/sessions/:sessionId"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <SessionWorkspacePage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/sessions/:sessionId/transcript"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <TranscriptStudioPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/transcripts"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <TranscriptStudioPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/treatment-plans"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <TreatmentPlansPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/reports"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <ReportsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <ClinicalNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/psychologist/settings"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['psychologist']}>
                  <SettingsPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/psychologist/*" element={<NotFoundPage />} />
        </Route>

        {/* ========================================================= */}
        {/* 4. AUTHENTICATED SYSTEM GOVERNANCE (ADMIN)               */}
        {/*    Wrapped in AdminLayout (Governance & Lockout Nav)      */}
        {/* ========================================================= */}
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Role Base Route Shortcuts */}
        <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/psychologist" element={<Navigate to="/psychologist/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
