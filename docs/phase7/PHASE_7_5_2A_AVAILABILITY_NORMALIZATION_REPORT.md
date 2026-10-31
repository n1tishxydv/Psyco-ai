# PSYCO AI — PHASE 7.5.2A: AVAILABILITY NORMALIZATION REPORT
**Document ID:** `PHASE_7_5_2A_AVAILABILITY_NORMALIZATION_REPORT.md`  
**Defect Reference:** `DEF-7.5.2-01` (Reported Severity: P2)  
**Status:** RESOLVED & VERIFIED  
**Auditor / Architect:** Principal Backend Engineer & QA Lead  
**Timestamp:** 2026-11-01T00:43:00Z  

---

## 1. Executive Summary
During Phase 7.5.2 authenticated staging testing, seeded clinician accounts caused `GET /api/v1/psychologists/:psychologistId/available-slots` to crash with HTTP 500 (`TypeError: Cannot read properties of undefined (reading 'split')`). Investigation revealed a structural schema naming divergence between database seed generation (`{ start, end }`) and scheduling calculation logic (`{ startTime, endTime }`).

In Phase 7.5.2A, a single authoritative canonical schema was established, a centralized normalization utility was introduced at the application boundary, seed generation templates were updated to canonical formats, and defensive normalization was implemented across all scheduling calculation pipelines.

---

## 2. Root Cause Analysis
1. **Seeder Inconsistency (`backend/scripts/seedStagingEnvironment.js`):**
   Clinician availability records for `psych_staging_01` (Dr. Rebecca Jenkins) and `psych_staging_02` (Dr. Marcus Vance) were seeded with:
   ```json
   "weeklySchedule": {
     "monday": [{ "start": "09:00", "end": "17:00" }],
     "wednesday": [{ "start": "09:00", "end": "17:00" }],
     "friday": [{ "start": "09:00", "end": "17:00" }]
   }
   ```
2. **Scheduling Engine Assumption (`backend/src/services/scheduling.service.js`):**
   `getAvailableSlots` performed unchecked property lookups:
   ```javascript
   const [startH, startM] = period.startTime.split(':').map(Number);
   const [endH, endM] = period.endTime.split(':').map(Number);
   ```
   Because `period.startTime` was undefined on seeded records, an unhandled exception crashed the request, returning HTTP 500 on untouched seeded clinician profiles.
3. **Top-Level Parameter Discrepancies:**
   Seeded objects also used legacy names `bufferMinutes`, `sessionDuration`, `bookingLeadTimeHours`, `maxAdvanceBookingDays`, while the scheduling engine referenced `bufferTimeMinutes`, `sessionDurationMinutes`, and `bookingWindow: { minNoticeHours, maxAdvanceDays }`.

---

## 3. Canonical Availability Schema
The canonical availability model across the entire Psyco AI architecture is formalized as:

```json
{
  "psychologistId": "string",
  "weeklySchedule": {
    "monday": [
      {
        "startTime": "09:00",
        "endTime": "17:00",
        "mode": "both"
      }
    ],
    "tuesday": [],
    "wednesday": [
      {
        "startTime": "09:00",
        "endTime": "17:00",
        "mode": "both"
      }
    ],
    "thursday": [],
    "friday": [
      {
        "startTime": "09:00",
        "endTime": "17:00",
        "mode": "both"
      }
    ],
    "saturday": [],
    "sunday": []
  },
  "sessionDurationMinutes": 50,
  "bufferTimeMinutes": 10,
  "bookingWindow": {
    "minNoticeHours": 2,
    "maxAdvanceDays": 60
  },
  "cancellationPolicy": {
    "cutoffHours": 24
  },
  "reschedulingPolicy": {
    "cutoffHours": 24
  },
  "timezone": "Asia/Kolkata",
  "offeredModes": "both",
  "defaultMode": "in_person",
  "blockedDates": [],
  "leavePeriods": []
}
```

---

## 4. Centralized Normalization Architecture
A centralized utility was established in `backend/src/utils/availabilityNormalizer.js`:
- `normalizeSchedulePeriod(period)`: Normalizes individual time windows. Accepts canonical `{ startTime, endTime, mode }` and supported legacy `{ start, end, mode }`. Enforces strict regex validation (`/^([01]\d|2[0-3]):([0-5]\d)$/`), disallows inverted intervals (`startTime > endTime`) and zero-duration intervals (`startTime === endTime`). Throws controlled 400 errors (`MISSING_START_TIME`, `MISSING_END_TIME`, `INVALID_TIME_FORMAT`, `START_TIME_EQUALS_END_TIME`, `START_TIME_AFTER_END_TIME`).
- `normalizeWeeklySchedule(rawSchedule)`: Iterates over the seven days of the week, safely normalizing arrays of periods, single-day UI state objects `{ enabled, startTime, endTime, mode }`, or disabled days (`enabled: false`).
- `normalizeAvailability(raw)`: Maps legacy top-level properties (`bufferMinutes`, `sessionDuration`, `bookingLeadTimeHours`, `maxAdvanceBookingDays`, `cancellationCutoffHours`) to canonical properties (`bufferTimeMinutes`, `sessionDurationMinutes`, `bookingWindow`, `cancellationPolicy`).

---

## 5. Files Modified
1. `backend/src/utils/availabilityNormalizer.js` (NEW): Centralized normalization functions and validation constants.
2. `backend/src/services/scheduling.service.js`: Integrated `normalizeAvailability` into `getAvailability` and `updateAvailability`. Added safe per-period parsing in `getAvailableSlots`.
3. `backend/src/controllers/availability.controller.js`: Cleaned up controller input boundary to pass all updates through `normalizeAvailability`.
4. `backend/src/validators/availability.validators.js`: Updated Zod input schema to accept either canonical or legacy input property names.
5. `backend/scripts/seedStagingEnvironment.js`: Converted all synthetic seeding blocks to 100% canonical format.

---

## 6. Validation & Test Coverage
Automated tests in `backend/src/tests/phase7_5_2a_remediation.test.js`:
- `TASK A1`: Canonical `{startTime, endTime}` normalized to canonical schema.
- `TASK A2`: Legacy `{start, end}` normalized seamlessly to canonical schema.
- `TASK A3`: Missing start time produces HTTP 400 `MISSING_START_TIME`.
- `TASK A4`: Missing end time produces HTTP 400 `MISSING_END_TIME`.
- `TASK A5`: Malformed time strings (`9:00`, `25:00`, `09:65`) produce HTTP 400 `INVALID_TIME_FORMAT`.
- `TASK A6`: Start time equal to end time produces HTTP 400 `START_TIME_EQUALS_END_TIME`.
- `TASK A7`: Inverted times (`18:00` to `10:00`) produce HTTP 400 `START_TIME_AFTER_END_TIME`.
- `TASK A8`: Full availability normalization maps all legacy fields.
- `TASK A9`: Untouched seeded clinician accounts generate consultation slots without HTTP 500.
- `TASK A10`: Unauthorized schedule modification is rejected with HTTP 403.

---

## 7. Remaining Compatibility Limitations
- The system supports legacy `{ start, end }` for backward compatibility with existing records in RTDB snapshots. All new records written via `PUT /api/v1/availability/mine` are strictly converted and stored in the canonical schema.
- Client applications should continue submitting canonical `{ startTime, endTime }`.
