# PSYCO AI — PHASE 6: GOOGLE SIGN-IN AUDIT & VALIDATION REPORT

**Status:** BLOCKED: OPERATOR ACTION REQUIRED (OAuth Consent Screen Test User Registration)  
**Firebase Project:** `psyco-ai-staging`  
**Web App ID:** `1:651213878079:web:09848e67fa97d2dfbfd98a`  
**Authentication Provider:** Google Sign-In (Firebase Authentication)

---

## 1. Architectural Separation

In Psyco AI, **Google Sign-In** and **Google Calendar OAuth** are strictly independent integrations:

```
[User Browser]
      |
      +---> [Google Sign-In]  ---> Firebase Authentication (Identity & JWT Token Issuance)
      |
      +---> [Google Calendar] ---> Backend Express OAuth2 (Calendar & Google Meet Token Exchange)
```

1. **Google Sign-In (Authentication)**: Handled via the client-side Firebase Auth SDK (`signInWithPopup(auth, googleProvider)`). It authenticates identity, returns a Firebase ID token, and mounts user profiles under `/users/$uid`.
2. **Google Calendar (API Integration)**: Handled via backend OAuth 2.0 authorization code grant to generate Google Calendar events and Google Meet conference links.

---

## 2. Technical Audit & Configuration State

### 2.1 Firebase Auth Client Configuration
- Configured in `frontend/.env.staging`:
  - `VITE_FIREBASE_API_KEY`: Configured
  - `VITE_FIREBASE_AUTH_DOMAIN`: `psyco-ai-staging.firebaseapp.com`
  - `VITE_FIREBASE_PROJECT_ID`: `psyco-ai-staging`
- Auth Provider: Google provider initialized in `frontend/src/services/firebase.js`.

### 2.2 Authorized Domains
Firebase Authentication in `psyco-ai-staging` requires authorized domains:
- `localhost` (Default for local development and testing)
- `psyco-ai-staging.firebaseapp.com`
- `psyco-ai-staging.web.app`

### 2.3 Role Assignment Security Invariant
- Signing in with Google does **not** grant administrative privileges.
- When a user signs in for the first time via Google, their account role defaults to `patient` (or requires onboarding role selection through validated server-side logic).
- Self-assignment of `admin` or `psychologist` roles via frontend state manipulation is strictly rejected by database security rules and backend middlewares.

---

## 3. Reason for Blocker: Google OAuth Consent Screen Testing Mode

When a Google Cloud project's OAuth Consent Screen is in **"Testing"** publishing status, Google's authorization servers block external logins with error:
`Access blocked: Psyco AI has not completed the Google verification process (Error 403: access_denied)`.

Only accounts explicitly listed under **Audience > Test Users** in the Google Cloud Console are allowed to authenticate during this stage.

---

## 4. Operator Action Required

To unblock live Google Sign-In on the staging environment:

1. Open the [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent?project=psyco-ai-staging).
2. Ensure project **`psyco-ai-staging`** is selected in the top navigation.
3. Under the **Test users** section, click **+ ADD USERS**.
4. Enter the email addresses intended for testing (e.g., your QA Gmail account).
5. Click **SAVE**.

*Note: Never paste passwords or session tokens into chat. Once added in the Google Cloud Console, the specified account can immediately sign in through the staging login page.*
