# PSYCO AI — PHASE 10: LOCAL STAGING EXECUTION RUNBOOK

**Target Operating System:** Windows 10/11 (PowerShell & Command Prompt)  
**Node.js Version:** v20+ (ESM Supported)  
**Staging Configuration:** `backend/.env.staging` & `frontend/.env.staging`  
**Database Host:** `https://psyco-ai-staging-default-rtdb.firebaseio.com/`

---

## 1. Prerequisites & Environment Check

Before running the staging environment, ensure Node.js is installed and you are in the project root directory:

```powershell
# Verify Node.js version (must be >= v20.0.0)
node -v

# Ensure dependencies are installed across workspaces
npm run install:all
```

---

## 2. Command Reference Guide

### 2.1 Start the Backend in Staging Mode
Loads `backend/.env.staging` targeting the isolated `psyco-ai-staging` Firebase project and RTDB:

```powershell
# From Repository Root
npm run dev:backend:staging

# Or directly inside the backend directory:
cd backend
npm run dev:staging
```
- **Listening Port**: `5000`
- **Prefix**: `/api/v1`
- **Output Confirmation**: `Psyco AI Backend Server started on port 5000 [staging]`

---

### 2.2 Start the Frontend in Staging Mode
Runs Vite in staging mode (`--mode staging`), injecting `frontend/.env.staging`:

```powershell
# From Repository Root
npm run dev:frontend:staging

# Or directly inside the frontend directory:
cd frontend
npm run dev -- --mode staging
```
- **Local URL**: `http://localhost:5173`
- **Injected Auth Domain**: `psyco-ai-staging.firebaseapp.com`
- **Injected Database URL**: `https://psyco-ai-staging-default-rtdb.firebaseio.com`

---

### 2.3 Verify Backend Health
Query the backend health diagnostic endpoint via PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health" -Method Get | ConvertTo-Json -Depth 5
```

**Expected JSON Response:**
```json
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "service": "Psyco AI API Server",
    "storagePolicy": {
      "database": "Firebase Realtime Database (Fixed)",
      "binaryMediaAllowed": false,
      "persistentAudioSaved": false
    },
    "integrations": {
      "firebaseAuth": { "configured": true },
      "firebaseRtdb": { "configured": true, "status": "CLOUD_AUTHENTICATED" },
      "geminiClinicalCopilot": { "configured": true, "status": "ACTIVE" },
      "assemblyaiTranscription": { "configured": true, "status": "CONFIGURED" }
    }
  }
}
```

---

### 2.4 Execute Automated Test Suite
Run the 122 automated backend security, privacy, and workflow tests:

```powershell
# From Repository Root
npm test

# Or inside backend directory:
cd backend
npm test
```
*Expected: `tests 122, pass 122, fail 0` in ~3.3 seconds.*

---

### 2.5 Build the Frontend for Staging
Validate that the React SPA compiles with staging environment variables:

```powershell
# From Repository Root
npm run build:frontend:staging

# Or inside frontend directory:
cd frontend
npm run build -- --mode staging
```
*Expected: Clean Vite build to `frontend/dist/` in ~6.5 seconds.*

---

### 2.6 Perform Non-Destructive Staging Safety Dry-Run
Inspect the planned synthetic staging fixtures without performing database writes:

```powershell
# From Repository Root
npm run seed:staging:dry-run

# Or inside backend directory:
cd backend
npm run seed:staging:dry-run
```
*Expected: Validates target `psyco-ai-staging`, displays 11 planned entities, returns 0 records written.*

---

### 2.7 Seed Synthetic Staging Fixtures
Populate the remote staging database (`https://psyco-ai-staging-default-rtdb.firebaseio.com`) with the 11 synthetic clinical test entities:

```powershell
# From Repository Root
npm run seed:staging

# Or inside backend directory:
cd backend
npm run seed:staging
```
*Expected: `>>> STAGING SYNTHETIC DATA SEEDING COMPLETE <<<` (11 entities seeded).*

---

### 2.8 Clean Shutdown of Services
To terminate running processes in Windows PowerShell:

```powershell
# Identify processes listening on port 5000 and 5173
Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess

# Terminate backend process (replace <PID> with OwningProcess number)
Stop-Process -Id <PID> -Force
```
*When running via terminal window, pressing `Ctrl + C` triggers graceful shutdown (`HTTP server closed. Exiting process.`).*
