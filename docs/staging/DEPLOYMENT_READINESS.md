# PSYCO AI — PHASE 12: STAGING DEPLOYMENT READINESS REVIEW

**Target Staging Project:** `psyco-ai-staging`  
**Database URL:** `https://psyco-ai-staging-default-rtdb.firebaseio.com/`  
**Build Artifacts:** `frontend/dist/` (Validated Vite Build)  
**Deployment Decision:** DEPLOYMENT PREPARED — PENDING CLOUD HOSTING PROVISIONING

---

## 1. Hosting Architecture Specification

```
                                  +------------------------------------+
                                  |    FIREBASE HOSTING (STAGING)      |
                                  |    psyco-ai-staging.web.app        |
                                  |    Rewrites: /** -> /index.html    |
                                  +-----------------+------------------+
                                                    |
                                    HTTPS API Calls | (Bearer JWT)
                                                    v
+------------------------------------+    +------------------------------------+
|       GOOGLE CLOUD RUN / RENDER    |    |   FIREBASE REALTIME DATABASE       |
|       (Staging Node.js Backend)    |--->|   psyco-ai-staging-default-rtdb    |
|       Port: 5000 / Mode: Staging   |    |   us-central1 (Text/JSON Only)     |
+------------------------------------+    +------------------------------------+
```

### 1.1 Frontend Deployment Target (Firebase Hosting)
- **Public Directory**: `frontend/dist`
- **Routing Engine**: Single-Page Application (SPA) HTML5 History Mode.
- **Rewrites Definition**:
  ```json
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
  ```
- **Environment Ingestion**: Built using `npm run build:frontend:staging` (`vite build --mode staging`), compiling `VITE_API_BASE_URL`, `VITE_FIREBASE_PROJECT_ID=psyco-ai-staging`, and `VITE_FIREBASE_DATABASE_URL=https://psyco-ai-staging-default-rtdb.firebaseio.com`.
- **Secret Scan**: Verified zero private keys or server secrets in output bundle.

### 1.2 Backend Deployment Target (Google Cloud Run / Render)
- **Container Entrypoint**: `node src/server.js` with `NODE_ENV=staging`.
- **Mandatory Environment Variables**:
  - `NODE_ENV=staging`
  - `PORT=5000`
  - `FRONTEND_URL=https://psyco-ai-staging.web.app`
  - `FIREBASE_PROJECT_ID=psyco-ai-staging`
  - `FIREBASE_DATABASE_URL=https://psyco-ai-staging-default-rtdb.firebaseio.com`
  - `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@psyco-ai-staging.iam.gserviceaccount.com`
  - `FIREBASE_PRIVATE_KEY` (Injected via Secret Manager)
  - `GEMINI_API_KEY` (Injected via Secret Manager)
  - `ASSEMBLYAI_API_KEY` (Injected via Secret Manager)
  - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (Injected via Secret Manager)

---

## 2. Production Boundary Enforcement

The staging deployment pipeline strictly enforces production protection:

1. **Zero Production Overwrite**: The CLI command `firebase deploy --only hosting --project psyco-ai-staging` explicitly locks the deployment to the staging project ID.
2. **Never Run Broad Deploy**: Do not run unconstrained `firebase deploy` without `--project` and `--only` targets, which could overwrite production database rules or hosting.
3. **No Automatic Billing Incurrence**: No billable external resources (such as Blaze plan Cloud Functions) are published without explicit operator authorization.

---

## 3. Pre-Deployment Verification Checklist

- [x] Dedicated GCP project exists (`psyco-ai-staging`).
- [x] Dedicated staging Realtime Database exists (`https://psyco-ai-staging-default-rtdb.firebaseio.com/`).
- [x] Staging security rules deployed and verified (27 nodes).
- [x] Staging seeder rejects production `psyco-9c13d`.
- [x] Synthetic fixtures seeded in staging cloud RTDB.
- [x] Remote cloud database CRUD & restart persistence verified.
- [x] Frontend builds with zero errors (`vite build --mode staging`).
- [x] Secret scan verified zero server keys in frontend bundle.
- [x] 122 automated backend tests passing (100%).
- [x] ReBAC clinical note privacy barrier tested.
- [x] Gemini & AssemblyAI live cloud credentials verified.
- [ ] Google OAuth Consent Screen Test Users configured (Operator Action).
- [ ] Clinician interactive Google Calendar OAuth completed (Operator Action).
