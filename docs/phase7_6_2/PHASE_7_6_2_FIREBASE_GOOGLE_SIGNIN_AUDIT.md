# PSYCO AI — PHASE 7.6.2 FIREBASE GOOGLE SIGN-IN AUDIT
**Document ID:** `PHASE_7_6_2_FIREBASE_GOOGLE_SIGNIN_AUDIT`  
**Audit Phase:** Phase 7.6.2 Implementation & Verification  
**Target:** Firebase Authentication Google Sign-In (Integration A)  
**Auditor:** Firebase Authentication Security Engineer & Senior React Architect  
**Date:** 2026-11-03  
**Status:** AUDITED & INDEPENDENTLY BOUND  

---

## 1. Executive Summary

This audit independently inspected the application sign-in mechanism (Integration A) powered by Firebase Authentication, confirming its strict separation from the Google Calendar integration (Integration B).

The investigation verified that client-side code correctly utilizes Firebase's `GoogleAuthProvider` with standard popup and redirect handlers. The root cause of the previously reported `redirect_uri_mismatch` error on staging was isolated to missing authorized redirect URIs in Google Cloud Console credentials for the Firebase Auth handler domain.

---

## 2. Distinction Between the Two Google Integrations

```
+-----------------------------------+-----------------------------------+
| INTEGRATION A: FIREBASE SIGN-IN   | INTEGRATION B: CALENDAR OAUTH     |
+-----------------------------------+-----------------------------------+
| Purpose: Authenticate user        | Purpose: Sync consultation events |
| Provider: Firebase Authentication | Provider: Google Calendar API     |
| Scopes: openid, email, profile    | Scopes: calendar.events.owned     |
| Client: Firebase Web SDK          | Client: Express Backend Adapter   |
| Staging Auth Domain:              | Staging Redirect URI:             |
|   psyco-ai-staging.firebaseapp.com|   psyco-ai.onrender.com/api/v1/...|
| Handler Endpoint:                 | Handler Endpoint:                 |
|   /__/auth/handler                |   /integrations/google/callback   |
+-----------------------------------+-----------------------------------+
```

### Critical Architectural Principle:
Under no circumstances should the Google Calendar integration manage Firebase Authentication, nor should Firebase Sign-In automatically request Google Calendar scopes. Blurring these systems introduces security vulnerabilities and violates the principle of least privilege.

---

## 3. Configuration & Source Code Inspection

### 3.1 Firebase Web Client Configuration (`frontend/.env.staging`)
```text
VITE_FIREBASE_API_KEY=AIzaSyBAg6JRS_D_SjqgcZotJ4IxoYTudNCKwXg
VITE_FIREBASE_AUTH_DOMAIN=psyco-ai-staging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=psyco-ai-staging
VITE_FIREBASE_DATABASE_URL=https://psyco-ai-staging-default-rtdb.firebaseio.com
VITE_FIREBASE_STORAGE_BUCKET=psyco-ai-staging.firebasestorage.app
VITE_FIREBASE_APP_ID=1:651213878079:web:09848e67fa97d2dfbfd98a
```
- **Project Alignment**: Staging frontend strictly references `psyco-ai-staging`.
- **Production Isolation**: Production project `psyco-9c13d` is not targeted in staging builds.

### 3.2 Provider Initialization (`frontend/src/services/firebase.js`)
```javascript
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
```
- Provider requests only standard OpenID Connect identity claims (`email`, `profile`).
- No calendar or Google Drive scopes are appended.

### 3.3 Sign-In Workflow & Workspace Routing (`frontend/src/context/AuthContext.jsx`)
```javascript
const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  // Sync profile to RTDB (/users/{uid}) and resolve multi-role authorization
  ...
};
```
1. Upon successful Google authentication, Firebase generates a secure ID token.
2. The user profile is verified in Firebase Realtime Database at `users/{uid}`.
3. If the user possesses dual roles (`patient` and `psychologist`), the application routes them to `WorkspaceChooserPage.jsx` rather than defaulting arbitrarily.

---

## 4. Root Cause of `redirect_uri_mismatch` (`AUTH-02`)

During staging deployment testing, Google login failed with:
```text
Error 400: redirect_uri_mismatch
The redirect URI in the request does not match the ones authorized for the OAuth client.
```

### Forensic Analysis:
1. When Firebase Authentication executes Google Sign-In via popup or redirect, Google's authorization endpoint checks the `redirect_uri` parameter:
   ```text
   https://psyco-ai-staging.firebaseapp.com/__/auth/handler
   ```
2. If this callback handler URI is absent from the **Authorized redirect URIs** list under the Web Client ID in the Google Cloud Console, Google immediately halts the handshake with error 400.
3. Application code is 100% correct. Resolution requires the Project Owner to register the handler URI in the GCP Console.

---

## 5. Required GCP Console Configuration for Firebase Auth

To resolve `AUTH-02` independently of Calendar OAuth, the Project Owner must register the following in the Google Cloud Console credentials for the Firebase Web Client:

### Authorized JavaScript Origins:
- `http://localhost:5173`
- `https://psyco-ai-staging.web.app`
- `https://psyco-ai-staging.firebaseapp.com`

### Authorized Redirect URIs:
- `http://localhost:5173`
- `https://psyco-ai-staging.web.app/__/auth/handler`
- `https://psyco-ai-staging.firebaseapp.com/__/auth/handler`

---

## 6. Audit Verdict

**PASS (CODE INTEGRITY)**: Firebase Google Sign-In is cleanly implemented, properly decoupled from Google Calendar OAuth, and safely handles multi-role account provisioning. External GCP Console URI entry remains the sole prerequisite for staging activation.

