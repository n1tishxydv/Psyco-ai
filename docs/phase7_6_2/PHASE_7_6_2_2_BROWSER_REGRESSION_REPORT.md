# Phase 7.6.2.2: Browser Flow & Layout Isolation Regression Report

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_2_BROWSER_REGRESSION_REPORT.md`  
**Classification**: Quality Assurance & Regression Verification  

---

## 1. Executive Summary

This report documents the verification of end-to-end OAuth callback routing, layout encapsulation, and browser regression behaviors across patient, psychologist, and unauthenticated personas following the Phase 7.6.2.2 fixes.

---

## 2. Regression Test Scenarios & Results

### Scenario 1: Psychologist Google Calendar Connection Flow
- **Initiation Point**: `/psychologist/settings?tab=integrations` (or Availability / Practice Setup wizards).
- **Action**: Clinician clicks "Connect Google Calendar".
- **Initiation Request**: `GET /api/v1/integrations/google/auth-url?returnTo=/psychologist/settings?tab=integrations`.
- **State Integrity**: State nonce and role encrypted via AES-256-GCM.
- **Callback Arrival**: `GET /api/v1/integrations/google/callback?code=...&state=...`.
- **Server Response**: HTTP 302 Redirect to `https://psyco-ai-staging.web.app/psychologist/settings?tab=integrations&calendar_connected=true`.
- **Rendered Layout**: `PsychologistLayout` (Clinical Sidebar, clinician navigation header).
- **Public Navbar Presence**: **ABSENT** (Verified).
- **Status Hydration**: `GoogleCalendarIntegrationCard` waits for Firebase auth state, then invokes `googleCalendarService.getConnectionStatus()`. Connection status displays "Connected" only upon 200 response with `data.connected === true`.
- **History Hygiene**: URL query parameters `calendar_connected` cleanly stripped from browser address bar via `setSearchParams` without reloading the page.
- **Result**: **PASS**.

---

### Scenario 2: Patient Google Calendar Connection Flow
- **Initiation Point**: `/patient/settings?tab=integrations`.
- **Action**: Patient clicks "Connect Google Calendar".
- **Initiation Request**: `GET /api/v1/integrations/google/auth-url?returnTo=/patient/settings?tab=integrations`.
- **Callback Arrival**: `GET /api/v1/integrations/google/callback?code=...&state=...`.
- **Server Response**: HTTP 302 Redirect to `https://psyco-ai-staging.web.app/patient/settings?tab=integrations&calendar_connected=true`.
- **Rendered Layout**: `PatientLayout` (Patient Sidebar, patient navigation header).
- **Public Navbar Presence**: **ABSENT** (Verified).
- **Result**: **PASS**.

---

### Scenario 3: Obsolete URL Handling (`/clinical/reports`)
- **Action**: User navigates directly to `https://psyco-ai-staging.web.app/clinical/reports`.
- **When Authenticated as Psychologist**: React Router evaluates alias route `<Route path="/clinical/reports" element={<ProtectedRoute allowedRoles={['psychologist']}><Navigate to="/psychologist/reports" replace /></ProtectedRoute>} />`.
  - Browser transitions instantly to `/psychologist/reports`.
  - Rendered inside `PsychologistLayout`.
  - Zero 404 error displayed.
- **When Authenticated as Patient**: Denied by `ProtectedRoute allowedRoles={['psychologist']}` and redirected to `/unauthorized`.
- **When Unauthenticated**: Redirected to `/login`.
- **Result**: **PASS**.

---

### Scenario 4: Generic Route Navigation (`/settings`)
- **Action**: User types `/settings` into the browser bar.
- **Routing Engine**: Evaluates `SettingsRedirect`.
  - If role is `psychologist`: redirects to `/psychologist/settings`.
  - If role is `patient`: redirects to `/patient/settings`.
  - If role is `admin`: redirects to `/admin/dashboard`.
- **Public Navbar Presence**: **ABSENT** (Verified; previously rendered inside `PublicLayout`).
- **Result**: **PASS**.

---

### Scenario 5: Invalid URLs & 404 Routing within Authenticated Portals
- **Test 5A (Clinician 404)**: Clinician navigates to `/psychologist/non-existent-subpath`.
  - Routed to nested `<Route path="/psychologist/*" element={<NotFoundPage />} />`.
  - Wrapped inside `PsychologistLayout`.
  - Clinical sidebar remains active; clinician can navigate away without losing session context.
  - "Return to Dashboard" action navigates to `/psychologist/dashboard`.
- **Test 5B (Patient 404)**: Patient navigates to `/patient/non-existent-subpath`.
  - Routed to nested `<Route path="/patient/*" element={<NotFoundPage />} />`.
  - Wrapped inside `PatientLayout`.
  - Patient sidebar remains active.
  - "Return to Dashboard" action navigates to `/patient/dashboard`.
- **Test 5C (Public 404)**: Unauthenticated visitor navigates to `/unknown-page`.
  - Routed to top-level catch-all `Route path="*"`.
  - Rendered inside `PublicLayout` with public marketing navbar and footer.
- **Result**: **PASS**.

---

### Scenario 6: OAuth Denial & Cancellation Handling
- **Action**: User clicks "Cancel" or "Deny" on Google's consent dialog.
- **Callback Parameters**: `?error=access_denied&error_description=...&state=...`.
- **Server Response**: HTTP 302 Redirect to `/psychologist/settings?tab=integrations&calendar_error=access_denied`.
- **Frontend Behavior**:
  - `GoogleCalendarIntegrationCard` parses `calendar_error=access_denied`.
  - Displays non-intrusive warning alert: "Google Calendar connection was cancelled or denied."
  - Component remains in disconnected state without infinite retries or broken UI.
  - Query parameters removed after alert presentation.
- **Result**: **PASS**.

---

## 3. Summary of Regression Verifications

| Test Case | Description | Target Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|
| TC-REG-01 | Psychologist Calendar Connect | Lands on `/psychologist/settings?tab=integrations` in `PsychologistLayout` | Matches Expected | **PASS** |
| TC-REG-02 | Patient Calendar Connect | Lands on `/patient/settings?tab=integrations` in `PatientLayout` | Matches Expected | **PASS** |
| TC-REG-03 | Obsolete `/clinical/reports` redirect | Auto-redirects to `/psychologist/reports` | Matches Expected | **PASS** |
| TC-REG-04 | Public layout isolation | Public navbar absent in authenticated workspaces | Matches Expected | **PASS** |
| TC-REG-05 | Portal 404 preservation | Retains portal sidebar on invalid nested subpaths | Matches Expected | **PASS** |
| TC-REG-06 | OAuth cancellation | Cleanly catches denial, displays error alert | Matches Expected | **PASS** |
| TC-REG-07 | Status verification | Uses API check, cleans URL search params | Matches Expected | **PASS** |
| TC-REG-08 | Automated Backend Suite | 349/349 tests pass | 349 pass, 0 fail | **PASS** |
| TC-REG-09 | Production Frontend Build | Vite staging build exits 0 | Exit code 0 | **PASS** |

