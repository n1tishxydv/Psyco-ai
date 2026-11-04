# Phase 7.6.2.2: Google Calendar Redirect & Portal Routing Implementation Report

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_2_REDIRECT_IMPLEMENTATION_REPORT.md`  
**Classification**: Implementation & Architectural Hardening Report  

---

## 1. Executive Summary

Phase 7.6.2.2 resolves the post-authorization Google Calendar redirect failure and layout bleed observed during external testing. The implementation introduces strict server-side destination allowlisting, eliminates obsolete route references across the frontend codebase, encapsulates authenticated routes within their designated portal layouts, and decouples UI connection status from insecure or forgeable URL parameters.

---

## 2. Backend Implementation Details

### 2.1 Server-Side Safe Redirect Resolver (`backend/src/controllers/googleCalendar.controller.js`)

A dedicated allowlist and sanitizer function `resolveSafeReturnPath` was integrated into the OAuth controller:

```javascript
export const ALLOWED_CALENDAR_REDIRECTS = {
  patient: '/patient/settings?tab=integrations',
  psychologist: '/psychologist/settings?tab=integrations',
  admin: '/admin/dashboard',
};

export const resolveSafeReturnPath = (requestedPath, role = 'psychologist') => {
  const defaultPath = ALLOWED_CALENDAR_REDIRECTS[role] || ALLOWED_CALENDAR_REDIRECTS.psychologist;
  if (!requestedPath || typeof requestedPath !== 'string') return defaultPath;

  const trimmed = requestedPath.trim();
  // 1. Prevent open redirect and protocol smuggling
  if (trimmed.startsWith('//') || trimmed.includes('://') || /^\w+:/i.test(trimmed)) {
    return defaultPath;
  }
  // 2. Reject obsolete or dangerous routes
  if (trimmed.includes('clinical/reports') || trimmed.startsWith('/reports')) {
    return defaultPath;
  }
  // 3. Strictly validate portal prefixes
  const validPrefixes = [
    '/psychologist/settings',
    '/patient/settings',
    '/psychologist/calendar',
    '/psychologist/practice-setup',
    '/psychologist/dashboard',
    '/patient/dashboard',
  ];
  const isAllowed = validPrefixes.some(prefix => trimmed === prefix || trimmed.startsWith(prefix + '?'));
  return isAllowed ? trimmed : defaultPath;
};
```

### 2.2 Controller Endpoints Updated
1. **`getAuthUrl` (`GET /api/v1/integrations/google/auth-url`)**:
   - Sanitizes `req.query.returnTo` using `resolveSafeReturnPath(req.query.returnTo, role)` prior to embedding into the encrypted OAuth state.
2. **`handleOAuthCallback` (`GET /api/v1/integrations/google/callback`)**:
   - Decrypts state and re-verifies destination with `resolveSafeReturnPath(state.returnTo, state.role)`.
   - Handles query string delimiters intelligently: checks whether `safeReturn` already contains `?` to append `&calendar_connected=true` or `?calendar_connected=true`.
   - Re-routes cancellations and errors (`access_denied`, `invalid_state`, `token_exchange_failed`) to the safe return path with descriptive error flags: `&calendar_error=access_denied&error_description=...`.

### 2.3 Adapter Defaults (`backend/src/integrations/googleCalendar/googleCalendarAdapter.js`)
- `generateAuthUrl` was updated to default `returnTo` role-sensitively (`ALLOWED_CALENDAR_REDIRECTS[role]`) rather than leaving it empty.

---

## 3. Frontend Implementation Details

### 3.1 Obsolete Link Elimination (`frontend/src/components/layout/Navbar.jsx`)
- Replaced hardcoded `/clinical/reports` with `/psychologist/reports` at lines 234 and 449.
- Verified zero remaining occurrences of `/clinical/reports` in the entire frontend repository.

### 3.2 Component Hardening (`frontend/src/features/integrations/GoogleCalendarIntegrationCard.jsx`)
- **Authentication Hydration Guard**:
  ```jsx
  const { user, loading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && user) {
      fetchStatus();
    }
  }, [user, authLoading, fetchStatus]);
  ```
  Prevents unauthenticated calls to `getConnectionStatus()` when redirecting back from OAuth before Firebase auth state has hydrated.
- **Independent Status Verification**:
  - `status.connected` is driven strictly by backend API `googleCalendarService.getConnectionStatus()`.
  - The URL parameter `calendar_connected=true` is used solely to trigger a success toast and immediate status refresh, after which it is purged from browser history via `setSearchParams(searchParams, { replace: true })`.
- **Descriptive Error Messaging**:
  - Displays user-friendly alerts for `access_denied`, `user_cancelled`, `invalid_state`, and `expired_state`.

### 3.3 Explicit Return Destinations
- `AvailabilitySettingsPage.jsx`: Configured `getAuthUrl('/psychologist/settings?tab=integrations')`.
- `PracticeSetupPage.jsx`: Configured `getAuthUrl('/psychologist/settings?tab=integrations')`.
- `SettingsPage.jsx`: Configured `GoogleCalendarIntegrationCard` with `returnTo={role === 'patient' ? '/patient/settings?tab=integrations' : '/psychologist/settings?tab=integrations'}`.

### 3.4 Route Layout Encapsulation (`frontend/src/routes/index.jsx`)
1. **Unmounted `/settings` and Catch-All from `PublicLayout`**:
   - Generic `/settings` now routes through `SettingsRedirect`, navigating authenticated clinicians to `/psychologist/settings` (inside `PsychologistLayout`) and patients to `/patient/settings` (inside `PatientLayout`).
2. **Backward-Compatibility Redirect for `/clinical/reports`**:
   ```jsx
   <Route 
     path="/clinical/reports" 
     element={<ProtectedRoute allowedRoles={['psychologist']}><Navigate to="/psychologist/reports" replace /></ProtectedRoute>} 
   />
   ```
3. **Portal-Specific 404 Handlers**:
   - Added nested `<Route path="/patient/*" element={<NotFoundPage />} />` inside `PatientLayout`.
   - Added nested `<Route path="/psychologist/*" element={<NotFoundPage />} />` inside `PsychologistLayout`.
   - Clinicians and patients encountering invalid URLs within their portals now retain their respective navigation sidebars without falling out into the public marketing page.
4. **Context-Aware `NotFoundPage`**:
   - `NotFoundPage` inspects the user role and presents a direct "Return to Dashboard" action pointing to `/patient/dashboard` or `/psychologist/dashboard`.

---

## 4. Automated Backend Test Additions

Five dedicated unit tests were added to `backend/src/tests/phase7_6_2_google_calendar.test.js`:

| Test Identifier | Test Case Description | Verified Behavior |
|---|---|---|
| `TEST-CAL-14` | Role-sensitive default fallback | Returns `/psychologist/settings?tab=integrations` for clinicians; `/patient/settings?tab=integrations` for patients. |
| `TEST-CAL-15` | Rejection of obsolete `/clinical/reports` | Fallbacks to role default setting path. |
| `TEST-CAL-16` | Prevention of open redirect & protocol smuggling | Rejects `//malicious.com`, `https://phishing.site`, and `javascript:...`. |
| `TEST-CAL-17` | Whitelisted path preservation | Permits whitelisted paths like `/psychologist/calendar`. |
| `TEST-CAL-18` | OAuth error callback redirect generation | Generates 302 redirect with safe path and sanitized error flags. |

---

## 5. Build and Test Verification

- **Frontend Production Build**: Vite v6.4.5 built successfully with exit code 0 (`✓ built in 6.97s`).
- **Backend Test Suite**: Full suite executed with 349 passing tests, 0 failures, 0 skipped (`duration_ms: 7377ms`).

