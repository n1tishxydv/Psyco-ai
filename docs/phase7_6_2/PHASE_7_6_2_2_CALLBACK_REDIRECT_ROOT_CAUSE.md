# Phase 7.6.2.2: Google Calendar OAuth Callback & Post-Auth Redirect Root Cause Analysis

**Project**: Psyco AI — Mental Health Practice Management Platform  
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)  
**Document Reference**: `docs/phase7_6_2/PHASE_7_6_2_2_CALLBACK_REDIRECT_ROOT_CAUSE.md`  
**Classification**: High-Priority Forensic Root Cause Analysis  

---

## 1. Executive Summary

During external staging testing of Google Calendar integration for psychologist accounts, users completing the Google consent screen encountered an immediate failure:
- **Observed Browser URL**: `https://psyco-ai-staging.web.app/clinical/reports`
- **Observed Page Content**: "Page Not Found — The requested URL was not found on the Psyco AI platform."
- **Observed Visual Layout**: The public marketing navbar (`Navbar.jsx`) appeared at the top of the screen within what should have been an authenticated, clinical portal experience.

This forensic investigation established the exact technical chain of events that resulted in both the invalid path redirect (`/clinical/reports`) and the public marketing layout leakage into the authenticated workflow.

---

## 2. Forensic Trace of the OAuth Authorization Flow

### Step 1: Authorization Initiation (Frontend)
1. In `AvailabilitySettingsPage.jsx` and `PracticeSetupPage.jsx`, components invoked `googleCalendarService.getAuthUrl()` with no arguments or undefined `returnTo`.
2. In `GoogleCalendarIntegrationCard.jsx`, `handleConnect()` dispatched a GET request to `/api/v1/integrations/google/auth-url?returnTo=...`.

### Step 2: State Packaging & Token Encryption (Backend)
1. `googleCalendar.controller.js` extracted `req.query.returnTo`.
2. The controller constructed an OAuth state object containing:
   - `userId`: Target clinician or patient Firebase UID.
   - `role`: User role (`psychologist` or `patient`).
   - `nonce`: Cryptographically secure random 32-byte hex string.
   - `returnTo`: Desired post-auth relative path.
   - `issuedAt`: Epoch millisecond timestamp.
3. The state was serialized, encrypted using AES-256-GCM via `tokenEncryption.js` with HMAC integrity, and appended to the Google OAuth URL as `&state=...`.
4. Prior to Phase 7.6.2.2, `googleCalendar.controller.js` did not validate or whitelist `returnTo` values, passing through any requested string or falling back to ambiguous paths.

### Step 3: Google Consent & Callback Dispatch
1. The user authorized the application at `accounts.google.com`.
2. Google redirected the browser to:
   `https://psyco-ai.onrender.com/api/v1/integrations/google/callback?code=4/...&state=...`

### Step 4: Callback Processing & Redirect Generation
1. `handleOAuthCallback` decrypted the state object and validated replay/expiration.
2. Tokens were exchanged with Google and encrypted into Firebase RTDB under `/integrations/googleCalendar/${userId}`.
3. The controller assembled the final HTTP 302 redirect. Because `returnTo` contained or defaulted to `/clinical/reports` (or a stale navigation link from earlier prototype configurations), the server issued:
   `Location: https://psyco-ai-staging.web.app/clinical/reports?calendar_connected=true`

---

## 3. Root Cause 1: Derivation of `/clinical/reports`

Forensic codebase analysis uncovered two distinct sources for `/clinical/reports`:

1. **Obsolete Navigation Links in `frontend/src/components/layout/Navbar.jsx`**:
   - Lines 234 and 449 in `Navbar.jsx` contained hardcoded JSX anchor routes:
     ```jsx
     // Line 234 & Line 449 (Legacy)
     <Link to="/clinical/reports" ...>
     ```
   - In contrast, `frontend/src/routes/index.jsx` had declared the authoritative route as:
     ```jsx
     <Route path="/psychologist/reports" element={<ProtectedRoute allowedRoles={['psychologist']}><ReportsPage /></ProtectedRoute>} />
     ```
   - The `/clinical/reports` path was a relic from an earlier unnamespaced prototype layout that had never been purged from `Navbar.jsx`.

2. **Unvalidated Fallback in `googleCalendarAdapter.js`**:
   - When `returnTo` was omitted in API calls from setup wizards, the fallback logic did not enforce role-specific portal namespacing (`/psychologist/settings?tab=integrations`), allowing stale query parameters or improper defaults to propagate through the OAuth callback.

---

## 4. Root Cause 2: Public Marketing Navbar Appearing on 404

Forensic inspection of `frontend/src/routes/index.jsx` revealed an architectural routing flaw:

1. **Catch-All 404 Route Mounted Under `PublicLayout`**:
   - The top-level React Router tree had structured the 404 handler as:
     ```jsx
     <Route element={<PublicLayout />}>
       ...
       <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
       <Route path="*" element={<NotFoundPage />} />
     </Route>
     ```
   - `PublicLayout` unconditionally wraps its children with `<Navbar />` (the public marketing header) and `<Footer />`.
   - Consequently, when the browser hit `https://psyco-ai-staging.web.app/clinical/reports`, React Router matched the catch-all `path="*"`, rendering `NotFoundPage` inside `PublicLayout`.
   - Similarly, navigating to generic `/settings` rendered `SettingsPage` inside `PublicLayout` rather than within `PatientLayout` or `PsychologistLayout`.

2. **Absence of Portal-Specific 404 Catch-Alls**:
   - Neither `PatientLayout` (`/patient/*`) nor `PsychologistLayout` (`/psychologist/*`) had nested fallback catch-all routes. Any mistyped URL or obsolete redirect automatically fell through to the public marketing catch-all.

---

## 5. Security and Privacy Verification

- **OAuth Secret & Code Exposure**: Zero authorization codes, state nonces, or encrypted refresh tokens were exposed in query parameters or browser history.
- **Clinical Data Segregation**: The 404 error prevented unauthorized viewing of data, but the presence of the marketing navbar created clinical cognitive dissonance and degraded user trust.
- **CSRF & Replay Resistance**: State encryption and nonce verification remained intact; the failure was strictly a post-authorization route resolution and layout encapsulation breakdown.

---

## 6. Remediation Roadmap

1. **Server-Side Redirect Whitelist**: Implement `resolveSafeReturnPath(requestedPath, role)` in `googleCalendar.controller.js` to strictly enforce permitted return paths:
   - Patient: `/patient/settings?tab=integrations`
   - Psychologist: `/psychologist/settings?tab=integrations`
   - Rejection of protocol manipulation (`//`, `https://`, JavaScript schemes).
   - Rejection of obsolete `/reports` and `/clinical/reports` destinations.
2. **Navbar Route Corrections**: Replace all stale `/clinical/reports` references in `Navbar.jsx` with `/psychologist/reports`.
3. **Frontend Route Isolation**:
   - Disassociate authenticated `/settings` and catch-all routes from `PublicLayout`.
   - Provide role-aware `SettingsRedirect` (`/settings` -> `/patient/settings` or `/psychologist/settings`).
   - Add alias redirect from `/clinical/reports` to `/psychologist/reports`.
   - Implement nested 404 catch-alls inside `PatientLayout` and `PsychologistLayout` so authenticated clinicians and patients remain within their respective portal sidebars.
4. **State Verification Decoupling**: Update `GoogleCalendarIntegrationCard.jsx` to independently query the backend connection status via `googleCalendarService.getConnectionStatus()` rather than relying on URL parameters alone.

