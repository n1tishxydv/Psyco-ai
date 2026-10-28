# Psyco AI — Complete Defect Register

**Audit Date:** October 28, 2026  
**Auditor:** Quality Assurance Specialist & Security Architect  
**Classification Standard:** Software Quality Severity (Critical, High, Medium, Low, Informational)  

---

## Defect Summary

| Defect ID | Severity | Module / Feature | Current State | Remediation Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **DEF-AUTH-01** | **HIGH** | Google OAuth Consent Screen Test Users | Configuration Blocked | Low (Google Cloud Console setting) |
| **DEF-INT-01** | **MEDIUM** | Google Calendar OAuth Token Callback | Configuration Incomplete | Medium (OAuth Verification & Redirect) |
| **DEF-PERF-01** | **LOW** | Large Frontend Bundle Size Warning | Optimization Opportunity | Low (Vite Rollup chunk splitting) |
| **DEF-SEO-01** | **LOW** | Mental Health Practice JSON-LD Metadata | Feature Enhancement | Low (Add schema.org script tags) |

---

## Detailed Defect Reports

### Defect DEF-AUTH-01: Google Sign-In Blocked by OAuth Consent Screen Test User Policy
* **Severity:** **HIGH**
* **Affected Feature:** Public Authentication (`/login`, `/register`) — "Continue with Google"
* **Reproduction Steps:**
  1. Open browser to `http://localhost:5173/login`.
  2. Click the "Continue with Google" button.
  3. Enter Google account credentials in the popup.
* **Expected Behavior:** Firebase OAuth popup authenticates the user and returns valid ID token to frontend application.
* **Actual Behavior:** Google displays `Access blocked: Psyco AI has not completed the Google verification process. Error 403: access_denied` if the testing email is not registered in the Google Cloud project's OAuth consent screen test user list.
* **Root Cause:** In Google Cloud Console, OAuth consent screens in "Testing" mode only permit access to explicitly listed test user email addresses.
* **Recommended Correction:**
  1. Log into Google Cloud Console for project `psyco-9c13d` (or OAuth client project `143160785926`).
  2. Navigate to **APIs & Services > OAuth consent screen**.
  3. Under **Test users**, click **Add Users** and input the authorized test accounts (e.g., `admin.staging@psyco.clinic`).
  4. Alternatively, publish the OAuth consent screen to production if domain ownership verification is complete.

---

### Defect DEF-INT-01: Google Calendar Live Synchronization Requires Clinician OAuth Consent
* **Severity:** **MEDIUM**
* **Affected Feature:** Psychologist Calendar Sync (`/psychologist/calendar`)
* **Reproduction Steps:**
  1. Navigate to `/psychologist/calendar` as an authenticated psychologist.
  2. Attempt to synchronize appointments with an external Google Calendar.
* **Expected Behavior:** Seamless two-way synchronization of booked sessions with Google Calendar.
* **Actual Behavior:** The backend generates a valid OAuth authorization URL (`/api/v1/integrations/google/auth-url`), but live token exchange (`/api/v1/integrations/google/callback`) cannot complete until the clinician navigates through the Google OAuth consent flow and grants the `https://www.googleapis.com/auth/calendar.events` scope.
* **Root Cause:** External OAuth 2.0 requires active user consent and approved redirect URI matching the hosting domain.
* **Recommended Correction:** Ensure development callback URL `http://localhost:5000/api/v1/integrations/google/callback` is registered under Authorized Redirect URIs in the Google Developer Console.

---

### Defect DEF-PERF-01: Frontend Javascript Bundle Exceeds 500kB Chunk Limit
* **Severity:** **LOW**
* **Affected Feature:** Initial Page Load Performance & Optimization
* **Reproduction Steps:**
  1. Run `npm run build` in `frontend/`.
  2. Observe Vite build output warning:
     ```
     dist/assets/index-CPiSydzu.js   1,154.91 kB │ gzip: 259.62 kB
     (!) Some chunks are larger than 500 kB after minification.
     ```
* **Expected Behavior:** Javascript bundle is code-split into modular chunks under 500kB.
* **Actual Behavior:** Single monolithic bundle is 1,154 kB (259 kB gzip).
* **Root Cause:** Dynamic `React.lazy()` route-based code-splitting is not configured in `vite.config.js` or `routes/index.jsx`.
* **Recommended Correction:** Update `vite.config.js` with `build.rollupOptions.output.manualChunks` to split vendor libraries (`firebase`, `lucide-react`, `react-router-dom`) into separate vendor chunks.

---

### Defect DEF-SEO-01: Missing Schema.org MedicalBusiness / MentalHealthClinic Structured Data
* **Severity:** **LOW**
* **Affected Feature:** Public SEO & Search Engine Indexing
* **Reproduction Steps:** Inspect public pages (`/`, `/about`, `/services`) for `<script type="application/ld+json">`.
* **Expected Behavior:** Rich snippet metadata describing the mental health clinic, operating hours, emergency crisis hotline, and services.
* **Actual Behavior:** Basic meta tags are present, but structured JSON-LD schema is absent.
* **Root Cause:** SEO structured data tags were not yet added to `frontend/index.html`.
* **Recommended Correction:** Add structured JSON-LD block in `frontend/index.html` referencing `@type: "MedicalBusiness"`.
