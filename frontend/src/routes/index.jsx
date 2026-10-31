import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Public Feature Pages
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

// Auth & Onboarding Feature Pages
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { OnboardingPage } from '../features/auth/OnboardingPage';

// Phase 2 Intake & Profile Pages
import { PatientIntakePage } from '../features/intake/PatientIntakePage';
import { PatientProfilePage } from '../features/profiles/PatientProfilePage';
import { PsychologistProfilePage } from '../features/profiles/PsychologistProfilePage';
import { IntakeTemplateSettingsPage } from '../features/psychologists/IntakeTemplateSettingsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

// Phase 3 Scheduling & Directory Pages
import { PsychologistDirectoryPage } from '../features/directory/PsychologistDirectoryPage';
import { BookingPage } from '../features/appointments/BookingPage';
import { PatientAppointmentsPage } from '../features/appointments/PatientAppointmentsPage';
import { PsychologistCalendarPage } from '../features/appointments/PsychologistCalendarPage';
import { AvailabilitySettingsPage } from '../features/psychologists/AvailabilitySettingsPage';
import { PracticeSetupPage } from '../features/psychologists/PracticeSetupPage';

// Phase 4 Clinical Workspace, Patient Management, Documentation, Treatment Plans & Reports
import { PatientDirectoryPage } from '../features/clinical/PatientDirectoryPage';
import { PatientChartPage } from '../features/clinical/PatientChartPage';
import { SessionWorkspacePage } from '../features/clinical/SessionWorkspacePage';
import { TreatmentPlansPage } from '../features/clinical/TreatmentPlansPage';
import { ReportsPage } from '../features/clinical/ReportsPage';
import { PatientCarePlanPage } from '../features/patients/PatientCarePlanPage';

// Phase 5 Transcription & Review Studio
import { TranscriptStudioPage } from '../features/transcription/TranscriptStudioPage';

// Phase 7 Standardized Assessments
import { PatientAssessmentRunnerPage } from '../features/assessments/PatientAssessmentRunnerPage';

// Portal Dashboards (Phase 2 - 4)
import { PatientDashboard } from '../features/patients/PatientDashboard';
import { PsychologistDashboard } from '../features/psychologists/PsychologistDashboard';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { AppointmentsPage } from '../features/appointments/AppointmentsPage';
import { ClinicalNotesPage } from '../features/clinicalNotes/ClinicalNotesPage';

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

export function AppRoutes() {
  return (
    <AppShell>
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
    </AppShell>
  );
}
