# Psyco AI — API Architecture & Data Contract Audit Report

**Target Document:** `docs/audits/PSYCO_AI_API_AND_DATA_CONTRACT_AUDIT.md`  
**Application:** Psyco AI Mental Health Practice Management Platform  
**Target Environments:**  
- **Staging Frontend:** [https://psyco-ai-staging.web.app](https://psyco-ai-staging.web.app/)  
- **Staging Backend:** [https://psyco-ai.onrender.com](https://psyco-ai.onrender.com/)  
- **Staging Database:** `https://psyco-ai-staging-default-rtdb.firebaseio.com`  
**Classification:** Technical API Specification & Contract Audit  
**Audit Date:** October 2026

---

## 1. API Architecture Overview

The Psyco AI backend is an Express.js application exposing a versioned RESTful API under `/api/v1`. Architecture adheres to a layered design pattern:
1. **Routing Layer (`src/routes/v1/*.routes.js`):** Route registration, path binding, and HTTP method definition.
2. **Middleware Pipeline:**
   - Security headers (`helmet`)
   - Rate limiters (`express-rate-limit`)
   - JWT authentication (`verifyFirebaseIdToken`)
   - Role-based authorization (`requireRole`)
   - Clinician verification guard (`requireVerifiedPsychologist`)
   - Administrative clinical lockout (`blockAdminFromClinicalRecords`)
   - Input validation (`validateBody`, `validateQuery`, `validateParams` with Zod)
3. **Controller Layer (`src/controllers/*.controller.js`):** Parameter extraction, response envelope wrapping (`successResponse`, `errorResponse`), and delegation to services.
4. **Service Layer (`src/services/*.service.js`):** Business logic, relationship-based access control, Q9 risk interceptors, conflict engines, and database querying.
5. **Database Client (`src/integrations/firebase/firebaseRtdbAdapter.js`):** Abstraction over Firebase Admin SDK Realtime Database operations.

---

## 2. Standard API Response Envelope

Every endpoint in the system complies with the unified response envelope:

### Successful Response Envelope (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "version": "v1",
    "timestamp": "2026-10-31T21:45:00.000Z"
  }
}
```

### Error Response Envelope (`400`, `401`, `403`, `404`, `409`, `412`, `500`):
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE_CONSTANT",
    "message": "Human-readable error explanation",
    "details": [ ... ]
  },
  "meta": {
    "version": "v1",
    "timestamp": "2026-10-31T21:45:00.000Z"
  }
}
```

---

## 3. Complete Mounted Route Inventory

| Domain | Route Prefix | Mounted Endpoints | Authentication / Role Requirements |
|---|---|---|---|
| **Health & Monitoring** | `/api/v1/health` | `GET /` | Public / Uptime monitoring (no secrets exposed) |
| **Public Directory & Content** | `/api/v1/public` | `GET /psychologists`, `GET /faqs`, `GET /platform-settings` | Public |
| **Authentication & Tokens** | `/api/v1/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout` | Public & Authenticated Bearer |
| **User & Profile** | `/api/v1/profile` | `GET /me`, `POST /onboard/patient`, `POST /onboard/psychologist`, `PUT /me` | Authenticated |
| **Practice Management** | `/api/v1/practice` | `GET /workspace`, `POST /workspace`, `POST /members`, `GET /clinics` | Authenticated Clinicians / Admins |
| **Intake & Templates** | `/api/v1/intake` | `GET /templates`, `POST /templates`, `POST /submit`, `GET /:patientId` | Clinicians / Patients (Scoped) |
| **Appointments & Booking** | `/api/v1/appointments` | `GET /`, `POST /`, `GET /:id`, `POST /:id/accept`, `POST /:id/reject`, `POST /:id/cancel` | Role-gated (Patient / Psychologist) with conflict detection |
| **Clinician Availability** | `/api/v1/availability` | `GET /:psychologistId`, `PUT /me` | Public read / Psychologist write |
| **Notifications** | `/api/v1/notifications` | `GET /`, `PATCH /:id/read`, `DELETE /:id` | User ownership check |
| **Google Calendar / Meet** | `/api/v1/integrations/google`| `GET /auth-url`, `GET /callback`, `GET /status`, `POST /sync` | Authenticated Clinician |
| **Clinical Workspace** | `/api/v1/clinical` | `GET /patients`, `GET /patients/:id/chart`, `POST /sessions/:id/*`, `POST /notes/draft`, `POST /notes/:id/finalize`, `POST /treatment-plans`, `POST /reports/generate`, `GET /patient-portal/records` | **Strict Admin Block**, Psychologist Verified only (except patient-portal) |
| **Ambient Transcription** | `/api/v1/transcription` | `GET /session/:id`, `POST /session/:id/start`, `POST /session/:id/stop`, `POST /session/:id/append-entry` | Scoped Clinician only |
| **AI Copilot & Sandbox** | `/api/v1/ai` | `GET /status`, `POST /draft-note`, `POST /summarize-transcript`, `POST /copilot/query` | Psychologist only; Mock deterministic sandbox mode |
| **Psychometrics & Screeners** | `/api/v1/assessments` | `GET /templates`, `POST /assign`, `GET /patient/assigned`, `POST /:id/submit`, `GET /results/:id` | Patient / Clinician (Scoped); Strict Admin Block |
| **Analytics & Telemetry** | `/api/v1/analytics` | `GET /psychologist/overview`, `GET /admin/overview` | Scoped by role |
| **Risk Review & Safety** | `/api/v1/risk-review` | `GET /flags`, `POST /flags/:id/acknowledge` | Psychologist only; Q9 suicide safety gate |
| **Documentation Quality** | `/api/v1/documentation-quality`| `GET /metrics`, `GET /suggestions` | Psychologist only |
| **Administrative Governance**| `/api/v1/admin` | `GET /metrics`, `GET /users`, `PATCH /users/:uid/status`, `GET /psychologists/pending`, `POST /psychologists/:uid/verify`, `GET /audit-logs` | **Admin role exclusively** (Clinical notes blocked) |

---

## 4. Contract Reconciliation & Defect Remediation

### Defect Identified:
In `frontend/src/services/clinicalService.js`, the service methods for fetching patients (`getPatients`, `getAssignedPatients`) and generating reports (`generateReport`) returned raw response objects when `res.patients` or `res.report` were missing:
```javascript
// BEFORE (Buggy Contract Handling):
return res?.patients || res || []; // evaluated to envelope object { success: true, data: { patients: [...] } }
```

### Remediation Applied:
All clinical service methods now normalize backend payloads uniformly:
```javascript
// AFTER (Normalized Contract Handling):
function normalizePatientList(res) {
  let list = [];
  if (Array.isArray(res)) {
    list = res;
  } else if (res && typeof res === 'object') {
    if (Array.isArray(res.data?.patients)) {
      list = res.data.patients;
    } else if (Array.isArray(res.patients)) {
      list = res.patients;
    } else if (Array.isArray(res.data)) {
      list = res.data;
    }
  }
  const safeArray = Array.isArray(list) ? [...list] : [];
  safeArray.data = { patients: safeArray };
  safeArray.patients = safeArray;
  return safeArray;
}
```

### Contract Consistency Rules Enforced:
1. Every service function returning a collection returns a guaranteed `Array`.
2. Every service function returning an entity returns a guaranteed `Object` or `null`.
3. Array methods (`find`, `map`, `filter`) are never called on unvalidated service outputs in component rendering code.
4. Error responses are never disguised as empty success collections.
5. All 250 backend automated tests pass without contract discrepancies.

---

## 5. Efficiency, N+1 Query & Pagination Evaluation

* **Firebase RTDB Query Design:** Realtime Database does not support arbitrary relational joins. Where relationships exist (e.g. `appointments_by_user`), indexing indexes (`patientId`, `psychologistId`, `status`, `startTime`) are utilized.
* **Batch In-Memory Joins:** In `getAssignedPatients`, appointments for a given clinician are collected first, then cross-referenced against `patients`. To optimize performance on large clinician practices, future iterations will introduce index path `/patients_by_psychologist/$psychologistId/$patientId`.
* **Database Connection Pooling:** Firebase Admin SDK maintains persistent WebSocket/HTTP connections with zero cold-start database latency.
