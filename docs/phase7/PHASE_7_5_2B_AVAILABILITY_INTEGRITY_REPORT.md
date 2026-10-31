# PSYCO AI — PHASE 7.5.2B
## INDEPENDENT AVAILABILITY INTEGRITY & NORMALIZATION REPORT

**Auditor:** Principal Backend Engineer & Healthcare SaaS Security Auditor  
**Date:** November 1, 2026  
**Audited Modules:**
- [`backend/src/utils/availabilityNormalizer.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/utils/availabilityNormalizer.js)
- [`backend/src/validators/availability.validators.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/validators/availability.validators.js)
- [`backend/src/controllers/availability.controller.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/controllers/availability.controller.js)
- [`backend/src/services/scheduling.service.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/services/scheduling.service.js)
- [`backend/scripts/seedStagingEnvironment.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/scripts/seedStagingEnvironment.js)

---

## 1. CANONICAL VS LEGACY SCHEMA COMPARISON

During the Phase 7.5.2 authenticated staging smoke tests, defect **DEF-7.5.2-01** was detected: legacy staging database records and seeder fixtures used `{ start: '09:00', end: '17:00' }` whereas newer slot generation algorithms expected `{ startTime: '09:00', endTime: '17:00' }`. When clinicians viewed or queried slots, `period.startTime.split(':')` failed with `TypeError: Cannot read properties of undefined (reading 'split')`, returning HTTP 500.

Phase 7.5.2A established a single authoritative normalization utility [`backend/src/utils/availabilityNormalizer.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/utils/availabilityNormalizer.js).

### Schema Mapping Matrix

| Property Category | Canonical Schema (Phase 7.5.2A+) | Legacy Formats Accepted & Normalised | Fallback Default |
| :--- | :--- | :--- | :--- |
| **Schedule Period Start** | `startTime: "09:00"` | `start: "09:00"` | *None (Throws 400 `MISSING_START_TIME`)* |
| **Schedule Period End** | `endTime: "17:00"` | `end: "17:00"` | *None (Throws 400 `MISSING_END_TIME`)* |
| **Consultation Mode** | `mode: "both" \| "online" \| "in_person"` | Omitted / invalid string | `"both"` |
| **Buffer Duration** | `bufferTimeMinutes: 10` | `bufferMinutes: 10` | `10` |
| **Session Duration** | `sessionDurationMinutes: 50` | `sessionDuration: 50` | `50` |
| **Min Booking Notice** | `bookingWindow.minNoticeHours: 2` | `minNoticeHours`, `bookingLeadTimeHours` | `2` hours |
| **Max Advance Window** | `bookingWindow.maxAdvanceDays: 60` | `maxAdvanceDays`, `maxAdvanceBookingDays` | `60` days |
| **Cancellation Policy** | `cancellationPolicy.cutoffHours: 24` | `cancellationCutoffHours` | `24` hours |
| **Rescheduling Policy** | `reschedulingPolicy.cutoffHours: 24` | `reschedulingCutoffHours` | `24` hours |
| **Timezone** | `timezone: "Asia/Kolkata"` | String identifier | `"Asia/Kolkata"` |

---

## 2. NORMALIZATION UTILITY ARCHITECTURE

The normalizer [`availabilityNormalizer.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/utils/availabilityNormalizer.js) exposes three core functions:

1. `normalizeSchedulePeriod(period)`:
   - Validates that period is an object.
   - Extracts `rawStart` (`period.startTime ?? period.start`) and `rawEnd` (`period.endTime ?? period.end`).
   - Enforces 24-hour time regex: `/^([01]\d|2[0-3]):([0-5]\d)$/`.
   - Asserts boundary logic:
     - `startTime === endTime` $\implies$ throws `START_TIME_EQUALS_END_TIME` (HTTP 400).
     - `startTime > endTime` $\implies$ throws `START_TIME_AFTER_END_TIME` (HTTP 400).
   - Sanitizes consultation mode to `'in_person'`, `'online'`, or `'both'`.
2. `normalizeWeeklySchedule(rawSchedule)`:
   - Iterates through the seven standard day keys: `monday` through `sunday`.
   - Handles arrays of periods or single-day enabled objects `{ enabled: true, start, end }`.
   - Filters disabled days (`enabled: false`) to empty arrays `[]`.
3. `normalizeAvailability(raw)`:
   - Deeply normalizes the weekly schedule.
   - Maps legacy top-level properties (`bufferMinutes`, `sessionDuration`, `bookingLeadTimeHours`, `cancellationCutoffHours`) into nested canonical objects (`bookingWindow`, `cancellationPolicy`, `reschedulingPolicy`).

---

## 3. VALIDATION ENGINE INTEGRATION

The Zod validator in [`backend/src/validators/availability.validators.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/validators/availability.validators.js) was synchronized to accept both canonical and legacy keys:
```javascript
const timeSlotSchema = z.object({
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  start: z.string().regex(timeRegex).optional(),
  end: z.string().regex(timeRegex).optional(),
  mode: z.enum(['in_person', 'online', 'both']).default('both'),
}).refine(
  (data) => {
    const s = data.startTime || data.start;
    const e = data.endTime || data.end;
    return Boolean(s && e && s < e);
  },
  { message: 'Valid start and end times in HH:MM format are required and start time must precede end time' }
);
```

Controlled rejections (HTTP 400 Bad Request) are generated for malformed payloads instead of unhandled 500 crashes.

---

## 4. SEEDED ACCOUNT BEHAVIOR AUDIT

### 4.1 Staging Seeder Verification
Inspection of [`backend/scripts/seedStagingEnvironment.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/scripts/seedStagingEnvironment.js#L282-L331) confirms that seeded availability records for both synthetic clinicians:
- `psych_staging_01` (Dr. Sarah Jenkins): Mon/Wed/Fri 09:00–17:00, `startTime`/`endTime`, `mode: 'both'`
- `psych_staging_02` (Dr. Marcus Vance): Tue/Thu 10:00–18:00, `startTime`/`endTime`, `mode: 'both'`
are formatted strictly according to the canonical schema.

### 4.2 Legacy Database Backward Compatibility (Task A9 Verification)
In [`backend/src/tests/phase7_5_2a_remediation.test.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/tests/phase7_5_2a_remediation.test.js#L214-L240), an untouched clinician account with purely legacy fields:
```json
{
  "weeklySchedule": {
    "monday": [{ "start": "10:00", "end": "18:00" }]
  },
  "bufferMinutes": 10,
  "sessionDuration": 50,
  "bookingLeadTimeHours": 1,
  "maxAdvanceBookingDays": 60
}
```
was queried via `GET /api/v1/psychologists/:id/available-slots?date=YYYY-MM-DD`.
- **Result:** Returned HTTP 200 OK with fully generated available slots.
- **Slot Output:** `10:00:00.000Z` to `10:50:00.000Z`, duration 50m, buffer 10m.
- **Verification:** Legacy databases do not require destructive migrations to maintain availability functionality.

---

## 5. TIMEZONE CONVERSION BEHAVIOR

- **Practice Timezone:** Evaluated in clinician's local timezone (default `Asia/Kolkata`, IST UTC+05:30).
- **Public API Representation:** Available slot timestamps are converted and returned as ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Input Flexibility:** Clients may submit booking requests with:
  1. Separate `date` (`YYYY-MM-DD`) and `startTime` (`HH:MM`).
  2. Full ISO 8601 UTC strings (`...Z`).
  3. Full ISO 8601 offset strings (`...+05:30`).
- **Canonical Standardization:** In [`appointment.controller.js`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/src/controllers/appointment.controller.js#L40-L48), timestamps are standardized via `new Date(startTime).toISOString()`.
- **Slot Key Determinism:** `getCanonicalSlotKey(startTime)` generates identical keys for identical instants regardless of input timezone formatting.

---

## 6. AUDIT CONCLUSION

The availability normalization architecture has achieved full integrity. Legacy seeded records, modern canonical records, and edge-case invalid inputs are handled safely and deterministically.

**AVAILABILITY NORMALIZATION STATUS: VERIFIED AND RESOLVED.**
