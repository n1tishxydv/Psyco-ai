# PSYCO AI — PHASE 7.5.2A: ATOMIC BOOKING DESIGN REPORT
**Document ID:** `PHASE_7_5_2A_ATOMIC_BOOKING_DESIGN.md`  
**Defect Reference:** `DEF-7.5.2-02` (Escalated Severity: P1)  
**Status:** RESOLVED & VERIFIED  
**Auditor / Architect:** Principal Backend Engineer & Firebase Realtime Database Architect  
**Timestamp:** 2026-11-01T00:43:30Z  

---

## 1. Executive Summary & Defect Escalation
During Phase 7.5.2 authenticated testing, an automated concurrency probe demonstrated that when two booking requests for the exact same psychologist and slot arrived simultaneously via `Promise.all`, both succeeded with HTTP 201. Because double-booking creates medical conflict, privacy violations, and clinician schedule corruption in a healthcare platform, defect `DEF-7.5.2-02` was escalated from P2 to P1.

This report documents the architectural root cause, the deterministic slot reservation model, the transaction boundary implementation in Firebase Realtime Database, failure recovery, idempotency, and cancellation/rescheduling consistency.

---

## 2. Root Cause Analysis (The Check-Then-Write Race)
Prior to remediation, `createAppointment` executed a non-atomic two-step flow:
1. **Read/Check:** `await schedulingService.assertNoConflicts(psychologistId, startTime, endTime)`:
   - Fetched all existing appointments via `firebaseRtdbAdapter.get('appointments')`.
   - Iterated through appointment objects looking for overlap.
2. **Write:** `await firebaseRtdbAdapter.set('appointments/' + appointmentId, appointment)`.

When Request A and Request B arrived simultaneously:
- Request A read `appointments` (no conflict found).
- Request B read `appointments` (Request A had not written its appointment yet; no conflict found).
- Request A generated `appointmentId_A` and saved to `appointments/appointmentId_A`.
- Request B generated `appointmentId_B` and saved to `appointments/appointmentId_B`.
- Both requests returned HTTP 201 `Created`.

This classic check-then-write concurrency flaw cannot be prevented by client-side validations, sequential UI steps, or non-transactional database checks.

---

## 3. Atomic Slot Reservation Architecture

### 3.1. Deterministic Slot Identity (`slotKey`)
A unique, canonical, path-safe slot key is computed from the UTC start time of the session:
```javascript
export function getCanonicalSlotKey(startTime) {
  const d = new Date(startTime);
  if (isNaN(d.getTime())) {
    const err = new Error('Invalid appointment time boundaries.');
    err.code = 'INVALID_TIME_INTERVAL';
    err.status = 400;
    throw err;
  }
  // Deterministic UTC ISO string formatted for RTDB path safety
  // e.g., '2026-12-04T11:00:00.000Z' -> '2026-12-04T11_00_00_000Z'
  return d.toISOString().replace(/[:.]/g, '_');
}
```
All equivalent instants expressed in supported ISO formats (e.g. `2026-12-04T16:30:00+05:30` vs `2026-12-04T11:00:00.000Z`) resolve to the exact same slot key.

### 3.2. Targeted Database Path
Instead of placing broad transactional locks across the database root or entire appointments tree, the reservation path is scoped to the smallest safe transaction boundary:
`slotReservations/${psychologistId}/${slotKey}`

Data payload structure:
```json
{
  "slotKey": "2026-11-23T09_00_00_000Z",
  "psychologistId": "psych_rem_01",
  "startTime": "2026-11-23T09:00:00.000Z",
  "endTime": "2026-11-23T09:50:00.000Z",
  "patientId": "patient_rem_01",
  "appointmentId": "apt_1793473933160_5cu6l",
  "idempotencyKey": "idem_abc_123",
  "status": "reserved",
  "createdAt": "2026-11-01T00:30:00.000Z"
}
```

### 3.3. Transaction Execution & Mutex Primitives
In `firebaseRtdbAdapter.js`, `runTransaction(path, transactionFn, options)` was implemented:
- In Node.js server runtimes, an asynchronous path-keyed mutex (`_transactionLocks.get(lockKey)`) serializes concurrent executions on identical paths.
- Within the critical section, the current state of the node is retrieved and cloned.
- `transactionFn(clonedCurrent)` evaluates availability:
  - If node has `status: 'reserved'` or `'confirmed'` for a different patient, it aborts and throws HTTP 409 `SLOT_ALREADY_RESERVED`.
  - If the node is unreserved (or `released`), it claims the slot atomically.
- The transaction commits the new reservation before releasing the lock.
- Any concurrent request queued on the mutex lock immediately observes the updated reservation upon entry, failing fast with HTTP 409.

---

## 4. Lifecycle & Safety Guarantees

### 4.1. Failure Recovery & Rollback
If appointment persistence to `appointments/${appointmentId}` fails (e.g., database timeout or network partition), the catch block immediately invokes `schedulingService.releaseSlotReservation(psychologistId, startTime, appointmentId)`. This prevents "phantom reservations" from permanently blocking the slot.

### 4.2. Idempotency Support
Clients and retry loops may include an idempotency header (`X-Idempotency-Key` or `Idempotency-Key` or body `idempotencyKey`).
- Idempotency records are scoped per user: `idempotency/${user.uid}/${idempotencyKey}`.
- If a patient retries a request with the same key, the server returns the cached 201 response with the original appointment object.
- Reusing another patient's idempotency key is strictly prevented by the `${user.uid}` path partition.

### 4.3. Safe Cancellation
When an appointment is cancelled directly:
- `appointment.status` is set to `'cancelled'`.
- `schedulingService.releaseSlotReservation(psychologistId, appointment.startTime, appointmentId)` is called.
- The release operation checks `current.appointmentId === appointmentId`. If the slot was already re-assigned or belongs to another appointment, it is never released.

### 4.4. Safe Rescheduling
When an appointment is rescheduled:
1. `schedulingService.rescheduleSlotAtomically(...)` first claims the NEW slot via atomic reservation.
2. If claiming the new slot fails (e.g. HTTP 409), the original appointment and its existing slot reservation remain 100% active and untouched.
3. Once the new slot is claimed, the appointment record is updated.
4. The OLD slot reservation is released.
5. If the appointment write fails during reschedule, the newly claimed slot reservation is rolled back, preserving the old slot.

---

## 5. Security & Privacy Guarantees
- **Information Leakage Prevention:** Rejection responses return a generic machine-readable error:
  ```json
  {
    "success": false,
    "error": {
      "message": "The requested appointment slot conflicts with an existing booking or buffer window.",
      "code": "SLOT_ALREADY_RESERVED"
    }
  }
  ```
  No clinical information, patient IDs, or competitor names are exposed.
- **Authorization Enforcement:** Clinician verification, patient account status, and session mode compatibility are validated prior to slot reservation.
