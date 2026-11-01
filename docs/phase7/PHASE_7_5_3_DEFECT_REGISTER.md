# PSYCO AI — PHASE 7.5.3
## USABILITY DEFECT REGISTER & INCIDENT TRACKER

**Execution Phase:** Phase 7.5.3 — Supervised Human Usability Pilot  
**Target Environment:** Staging Portal (`https://psyco-ai-staging.web.app`) & Staging API (`https://psyco-ai.onrender.com`)  
**Commit SHA:** `cb708be1ccdef3ec64cf7b647ef2a56276e73781`  
**Quality Lead:** QA Lead & Senior UX Lead  
**Current Register Status:** **ZERO OPEN DEFECTS LOGGED (AWAITING HUMAN TEST SESSIONS)**  

---

## 1. DEFECT SEVERITY CLASSIFICATION TAXONOMY

In accordance with healthcare software safety regulations (IEC 62304 / ISO 9241-110), defects identified during human usability sessions are classified under a 4-tier severity hierarchy:

| Severity Tier | Definition & Healthcare Context | Protocol Action | Resolution SLA |
| :---: | :--- | :--- | :---: |
| **P0 — Critical Safety / Confidentiality** | Unauthorized access to clinical psychotherapy notes; PHI data leak; cross-tenant data exposure; failure of clinical lockout. | **IMMEDIATELY HALT AFFECTED TASK.** Notify release coordinator. Freeze pilot. | Immediate blocker |
| **P1 — Core Workflow Blocker** | Inability to complete a primary healthcare workflow (e.g., booking transaction fails, clinician cannot sign SOAP note, crash/white-screen). | Facilitator attempts workaround; logs blocker. | Pre-expansion fix required |
| **P2 — Major Ergonomic Friction** | High cognitive effort, misleading clinical terminology, confusing multi-step form flow, failure to locate core action without assistance. | Facilitator provides standard prompt; documents friction. | Prioritize in Phase 7.5 remediation |
| **P3 — Minor Visual / Cosmetic Polish** | Minor alignment defect, secondary label ambiguity, non-blocking visual glitch, minor layout inconsistency on specific viewport. | Record for polish; proceed with task. | Backlog refinement |

---

## 2. IMMEDIATE STOP PROTOCOL: DATA INTEGRITY & PRIVACY ESCALATION

> [!CAUTION]
> ### CLINICAL SAFETY STOP TRIGGER
> If a human participant encounters any of the following events:
> 1. An Administrator (P1) is able to view psychotherapy notes, psychiatric intake forms, or patient diagnoses.
> 2. A Patient (P4–P7) is able to view another patient's appointment details or medical history.
> 3. A Psychologist (P2/P3) is able to view unassigned patients' clinical charts without explicit clinical assignment.
> 4. Real patient Protected Health Information (PHI) is observed anywhere in staging.
> 
> **FACILITATOR ACTION:** Stop the scenario immediately. Instruct the participant to close the window. Do not take screenshots of clinical text. Document the reproduction path in Section 3 and notify the DevOps Lead.

---

## 3. ACTIVE DEFECT REGISTER (LOGGED ISSUES)

*No defects have been logged during Phase 7.5.3 staging pre-flight. The table below will be populated as genuine human sessions are executed.*

| Defect ID | Participant & Role | Task ID | Severity | Defect Summary & Actual vs Expected Behavior | Reproduction Steps | User Impact | Recommended Remediation | Resolution Status |
| :---: | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| — | — | — | — | *No active defects logged. Sessions currently in NOT STARTED state.* | — | — | — | **NONE LOGGED** |

---

## 4. DEFECT ENTRY TEMPLATE (FOR FACILITATOR USE)

When an issue is discovered during a live session, copy and complete this entry block:

```markdown
### [DEFECT-7.5.3-XXX]: [Short Descriptive Title]
- **Participant ID & Role:** [ e.g. P2 - Psychologist ]
- **Task ID:** [ e.g. PSY-05 ]
- **Severity Level:** [ P0 | P1 | P2 | P3 ]
- **Device / OS / Browser:** [ e.g. Windows 11 / Chrome 131 ]
- **Expected Behavior:** [ What the healthcare user reasonably expected to occur ]
- **Actual Behavior:** [ What actually occurred on screen or in network traffic ]
- **Step-by-Step Reproduction:**
  1. Navigate to ...
  2. Click on ...
  3. Enter ...
  4. Observe error ...
- **User Impact:** [ How did this impede clinical workflow, patient confidence, or task completion? ]
- **Root Cause Hypothesis:** [ Frontend state / Backend API / Validation mismatch / CSS styling ]
- **Recommended Correction:** [ Specific code or architectural change needed ]
- **Validation Criteria:** [ How to verify the fix in staging regression testing ]
```

---

## 5. HISTORICAL AUDIT DEFECT RESOLUTION SUMMARY

For governance traceability, the following key defects identified in earlier Phase 7 audits were resolved prior to Phase 7.5.3 entry:

| Prior Defect | Root Cause | Resolution in Commit `cb708be` | Verification Status |
| :--- | :--- | :--- | :---: |
| **DEF-7.5.2A-01** (Availability 500) | Legacy `start`/`end` schema caused crash in slot generator | Normalized via `availabilityNormalizer.js` | **VERIFIED PASS** (HTTP 200, 8 slots) |
| **DEF-7.5.2A-02** (Concurrent Double Booking) | Unprotected race on simultaneous slot claim | In-process serialized mutex in `firebaseRtdbAdapter.js` | **VERIFIED PASS** (201 Created, 409 Conflict) |
| **DEF-7.5.2A-03** (Timezone Inconsistency) | IST offset string bypasses slot collision check | Canonical UTC slot key formatting (`getCanonicalSlotKey`) | **VERIFIED PASS** (409 Conflict) |
| **DEF-7.5.2A-04** (Idempotency Payload Tamper) | Reused idempotency key allowed different appointment payload | Added payload hash verification | **VERIFIED PASS** (409 Conflict) |
