import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
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

// 404 Not Found Page
import { EmptyState } from '../components/common/EmptyState';
import { FileQuestion } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <EmptyState
          icon={FileQuestion}
          title="Page Not Found"
          description="The requested URL was not found on the Psyco AI platform."
          actionLabel="Return to Home"
          onAction={() => window.location.href = '/'}
        />
      </div>
    </div>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[50vh] space-y-3" role="status">
      <LoadingSpinner size="lg" />
      <p className="text-xs text-secondaryText animate-pulse">Loading workspace...</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <AppShell>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
        {/* Core Public Website Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/get-started" element={<GetStartedPage />} />

        {/* Portal Information Pages */}
        <Route path="/for-patients" element={<PatientPortalInfoPage />} />
        <Route path="/patient-portal" element={<Navigate to="/for-patients" replace />} />
        <Route path="/for-psychologists" element={<PsychologistPortalInfoPage />} />
        <Route path="/psychologist-portal" element={<Navigate to="/for-psychologists" replace />} />

        {/* Legal & Data Privacy Routes */}
        <Route path="/privacy-policy" element={<PrivacyPage />} />
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/data-privacy" element={<DataPrivacyPage />} />

        {/* Authentication & Onboarding Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowUnonboarded={true}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Directory & Public Booking */}
        <Route path="/find-psychologist" element={<PsychologistDirectoryPage />} />
        <Route path="/book/:psychologistId" element={<BookingPage />} />

        {/* Patient Protected Routes */}
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

        {/* Psychologist Protected Routes */}
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
        {/* Phase 4 Clinical Routes */}
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

        {/* Admin Protected Routes */}
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

        {/* Shared Authenticated Routes */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentsPage />
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

        {/* Shortcuts */}
        <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/psychologist" element={<Navigate to="/psychologist/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </AppShell>
  );
}
