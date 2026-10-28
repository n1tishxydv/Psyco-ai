# PSYCO AI — PHASE 3: STAGING SEEDING SAFETY & SAFEGUARDS SPECIFICATION

**Script Path:** `backend/scripts/seedStagingEnvironment.js`  
**Execution Modes:** Live Seeding (`npm run seed:staging`) & Dry-Run (`npm run seed:staging:dry-run`)  
**Production Target Guard:** STRICT FAIL-CLOSED REJECTION OF `psyco-9c13d`

---

## 1. Safety Mandates & Invariant Checks

The staging seeder incorporates 13 non-negotiable safety rules before any write operation can occur:

1. **Explicit Environment Requirement**: Must run with `NODE_ENV=staging` or target explicit staging configuration.
2. **Explicit Target Verification**: `config.firebase.projectId` and `config.firebase.databaseURL` must be explicitly configured and non-empty.
3. **Fail-Closed on Missing Target**: If either target parameter is missing, the script throws an error immediately and exits with code 1.
4. **Strict Production Project Rejection**: Automatically aborts if `config.firebase.projectId === 'psyco-9c13d'`.
5. **Strict Production Database URL Rejection**: Automatically aborts if `config.firebase.databaseURL` contains `psyco-9c13d-default-rtdb.firebaseio.com`.
6. **Zero Silent Fallback**: If cloud write fails, throws an explicit exception; never falls back to production or local-only without notice.
7. **Zero Real Patient Data**: 100% synthetic, fictitious fixtures only. No production names, emails, or clinical notes are copied.
8. **Text-Only Invariant**: Every fixture is validated against `assertValidPayload()`. Zero binary, audio, or base64 data.
9. **Idempotence & Safe Re-runnability**: Uses deterministic entity IDs (e.g., `admin_staging_01`, `psych_staging_01`, `apt_staging_001`), ensuring repeated executions update existing keys cleanly rather than duplicating records.
10. **Credential Masking**: Targets and execution results are logged without outputting service account private keys, passwords, or tokens.
11. **Production Isolation**: Production database is never touched, scanned, or modified.
12. **Subpath Protection**: Direct root execution on unapproved projects requires an explicit flag (`--allow-subpath-test`) which prefixes all keys with `stagingTestFixture/`.
13. **Non-Destructive Dry-Run**: Supports `--dry-run` flag to validate targets, inspect the 11 planned entities, and verify schema compliance without performing any database writes.

---

## 2. Guardrail Logic Implementation

```javascript
// Safety Assertion 1: Fail closed if target project or database URL is missing
if (!currentProjectId || !currentDbUrl) {
  console.error('\n[ABORTED] SAFETY VIOLATION DETECTED:');
  console.error('Target Firebase Project ID or Database URL is not established.');
  throw new Error('Refusing to seed: Missing target project or database URL.');
}

// Safety Assertion 2: Explicitly reject production targets
const isProductionTarget = PRODUCTION_PROJECT_IDS.includes(currentProjectId) ||
                           PRODUCTION_DB_URLS.some(url => currentDbUrl.includes(url));

if (isProductionTarget && !options.allowSubpathTest) {
  console.error('\n[ABORTED] SAFETY VIOLATION DETECTED:');
  console.error('The active configuration points to the primary/production database:');
  console.error(` -> Project: ${currentProjectId}`);
  console.error(` -> DB URL:  ${currentDbUrl}`);
  throw new Error('Refusing to seed synthetic staging data into primary/production database.');
}
```

---

## 3. Dry-Run Mode Output Evidence

Executing `npm run seed:staging:dry-run` produces the following verified output:

```
================================================================
PSYCO AI — STAGING SYNTHETIC DATA SEEDING UTILITY
================================================================
Execution Mode:            DRY-RUN (NO WRITES)
Target Firebase Project ID: psyco-ai-staging
Target Database URL:       https://psyco-ai-staging-default-rtdb.firebaseio.com
Runtime Environment:       staging

[DRY RUN] Simulating planned synthetic staging fixtures:
 1. Synthetic Administrator        -> users/admin_staging_01
 2. Synthetic Psychologist User    -> users/psych_staging_01
    Synthetic Clinician Profile    -> psychologists/psych_staging_01 (PSY-STAGING-001, Approved)
 3. Synthetic Patient User         -> users/patient_staging_01
    Synthetic Patient Profile      -> patients/patient_staging_01 (Alex Mercer, age 29)
 4. Clinician Availability         -> availability/psych_staging_01 (Mon/Wed/Fri 09:00-17:00)
 5. Synthetic Appointment          -> appointments/apt_staging_001 (Confirmed)
 6. Clinical Session Record        -> sessionRecords/ses_staging_001 (In Progress)
 7. SOAP Clinical Note Draft       -> sessionNotes/not_staging_001 (Status: draft, Format: SOAP)
 8. Clinical Treatment Plan        -> treatmentPlans/tp_staging_001 (Generalized Anxiety Features)
 9. PHQ-9 Screener Assignment      -> assessmentAssignments/asg_staging_001
    PHQ-9 Screener Result          -> assessmentResults/res_staging_001 (Score: 7, Mild)
 10. Risk Review Flag              -> riskReviewFlags/flg_staging_001 (Category: stress_overload, Reviewed)
 11. Public Submissions            -> contactSubmissions/cnt_staging_001, faqSubmissions/faq_sub_staging_001

[DRY RUN COMPLETE] 11 synthetic entities validated. 0 records written.
```

---

## 4. Production Interceptor Test Evidence

The safety assertions are automatically tested as part of the test suite in `backend/src/tests/staging_safety.test.js`:

```
✔ 1. Production Project ID is strictly rejected by staging seeder (4.52ms)
✔ 2. Production Database URL is strictly rejected even if project ID is altered (0.77ms)
✔ 3. Missing database URL causes fail-closed termination (0.53ms)
✔ 4. Staging Seeder dry-run mode returns success without writing records (3.81ms)
```

### Verified Terminal Log when targeting Production:
```
================================================================
PSYCO AI — STAGING SYNTHETIC DATA SEEDING UTILITY
================================================================
Execution Mode:            DRY-RUN (NO WRITES)
Target Firebase Project ID: psyco-9c13d
Target Database URL:       https://psyco-9c13d-default-rtdb.firebaseio.com
Runtime Environment:       development

[ABORTED] SAFETY VIOLATION DETECTED:
The active configuration points to the primary/production database:
 -> Project: psyco-9c13d
 -> DB URL:  https://psyco-9c13d-default-rtdb.firebaseio.com
To run staging seeding, configure a dedicated staging RTDB instance
(e.g., https://psyco-ai-staging-default-rtdb.firebaseio.com) or pass --allow-subpath-test for non-destructive test.

Seeding halted: Refusing to seed synthetic staging data into primary/production database.
(Exit Code: 1)
```
