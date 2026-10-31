# PSYCO AI — ARCHITECTURAL DEPLOYMENT NOTICE
## SCHEDULING SINGLE-INSTANCE DEPLOYMENT CONSTRAINT & DISTRIBUTED SCALING RESTRICTION

**Document Type:** Permanent Operational Constraint & Architecture Decision Record (ADR)  
**Applicability:** Backend Scheduling & Reservation Engine (`backend/src/services/scheduling.service.js`)  
**Deployment Target:** Staging & Pre-Production Environments  
**Current Enforcement:** Hard Pinning to Single-Instance Execution (`WEB_CONCURRENCY=1`, 1 Web Container)  

---

> [!CAUTION]
> ### CRITICAL ARCHITECTURAL WARNING: DO NOT SCALE HORIZONTALLY
> The current booking and slot reservation system uses an **in-process asynchronous mutex** in [`backend/src/integrations/firebase/firebaseRtdbAdapter.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/integrations/firebase/firebaseRtdbAdapter.js). This mutex serializes concurrent booking requests strictly within the memory heap of a single Node.js process.  
> **IT DOES NOT COORDINATE ACROSS INDEPENDENT RUNTIMES OR MULTIPLE RENDER CONTAINERS.**  
> Running $\ge 2$ instances or enabling horizontal autoscaling without implementing database-authoritative conditional writes (ETags) will permit double-booking race conditions.

---

## 1. TECHNICAL ROOT CAUSE: IN-PROCESS MUTEX VS. DISTRIBUTED LOCK

### 1.1 How Single-Instance Atomicity Works
Within a single Node.js process, [`firebaseRtdbAdapter.runTransaction(path, txFn)`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/integrations/firebase/firebaseRtdbAdapter.js#L578-L626) maintains an internal `Map` of active lock promises:
```javascript
// Local V8 Heap Mutex:
this._transactionLocks = new Map();
```
When Request 1 and Request 2 arrive simultaneously for the same clinician, Request 2 awaits Request 1's lock promise. Request 1 executes interval overlap checks, reserves the slot, and releases the lock. Request 2 wakes up, reads the committed reservation, and is rejected with HTTP 409 `SLOT_ALREADY_RESERVED`.

### 1.2 Why Multiple Instances Violate Uniqueness
If two Render instances (Instance A and Instance B) are deployed behind a load balancer:
1. Instance A and Instance B possess completely separate Node.js memory heaps.
2. `this._transactionLocks` on Instance A knows nothing about `this._transactionLocks` on Instance B.
3. If Patient 1 connects to Instance A and Patient 2 connects to Instance B at the same millisecond for the exact same slot:
   - Both instances acquire their *local* mutexes without contention.
   - Both instances send an HTTP `GET /slotReservations/{psychologistId}.json` to Firebase RTDB.
   - Both observe the slot as unreserved.
   - Both instances issue an unconditional HTTP `PUT /slotReservations/{psychologistId}.json`.
   - The second `PUT` overwrites the first `PUT`.
   - Both instances believe they won the reservation and proceed to write appointments.
   - **Result:** Two active appointments are created for the same clinician at the same time (DOUBLE BOOKING).

---

## 2. MANDATORY OPERATIONAL CONSTRAINTS

To maintain absolute scheduling integrity, the following runtime topology rules are strictly enforced:

1. **Instance Count Pinning:** Exactly **ONE (1)** web service instance must be active in Render.
2. **Autoscaling Prohibited:** Horizontal autoscaling (min/max instances > 1) is strictly forbidden.
3. **Single Process Execution:** Node.js clustering (`cluster.fork()`), PM2 cluster mode, or multi-threaded worker dispatch for appointment endpoints is strictly prohibited.
4. **No Secondary Scheduling Services:** No background cron worker or secondary API service may write to the `slotReservations/` path.
5. **Zero Participant Traffic During Deployments:** During container restarts or deployments, incoming booking traffic must be halted until the previous container has terminated and the single healthy replacement instance is operational.

---

## 3. PREREQUISITES FOR HORIZONTAL SCALING

Horizontal scaling of the Psyco AI backend may **NOT** be enabled until one of the following distributed transaction architectures is implemented and validated:

### Option A: RTDB REST Conditional Requests (ETags)
- Firebase Realtime Database REST API supports HTTP conditional requests.
- When performing `GET /path.json`, Firebase returns an `ETag` response header (e.g. `ETag: "B6Xq12..."`).
- When performing `PUT /path.json`, passing the request header `if-match: <etag>` instructs the database server to perform an atomic compare-and-swap.
- If another process wrote to that path, Firebase rejects the `PUT` with HTTP 412 (Precondition Failed).
- On HTTP 412, the client retries the transaction loop from the beginning.

### Option B: Firebase Admin SDK Native Transactions
- Migrate from HTTP REST requests to the official `@firebase/database` or `firebase-admin` SDK.
- Use native `admin.database().ref(path).transaction(currentData => ...)` which coordinates transactions at the database server tier.

### Option C: Distributed Redis / Redlock Manager
- Introduce an external distributed lock manager (e.g. Redis Redlock) shared by all backend instances.

### Required Verification Before Scaling:
Before relaxing this single-instance restriction, a multi-process cross-instance load test must be conducted with $\ge 2$ independent worker processes issuing simultaneous requests across a shared synchronization barrier to prove that cross-dyno contention produces zero double-bookings.

---

## 4. AUDIT & RELEASE SUMMARY

- **Current Architecture Status:** Verified and approved strictly for single-instance staging pilot sessions.
- **Production Readiness:** **NOT READY FOR MULTI-INSTANCE OR HORIZONTAL SCALE.**
- **Approved Operating Mode:** Single Render Web Container (`WEB_CONCURRENCY=1`, `plan: free`).
