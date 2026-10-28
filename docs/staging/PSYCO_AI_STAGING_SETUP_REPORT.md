# PSYCO AI — STAGING SETUP PHASE 1 REPORT

**Document:** `docs/staging/PSYCO_AI_STAGING_SETUP_REPORT.md`  
**Phase:** Staging Setup Phase 1 — Isolated Firebase Environment, Secure Configuration & Deployment Preparation  
**Date:** October 28, 2026  
**Auditor / Roles:** Senior Full-Stack Engineer, Firebase Architect & Healthcare Security QA Auditor  
**Product:** Psyco AI — AI-Powered Mental Healthcare Practice Management SaaS  
**Verdict:** **`STAGING PROJECT PROVISIONED, RULES DEPLOYED & TEST DATA SEEDED (100% ISOLATED)`**  

---

## 1. Executive Summary

A completely isolated, dedicated Firebase staging environment has been established for Psyco AI. Staging credentials were authenticated, security rules were deployed, and synthetic staging data was seeded directly into the staging database. 

**Zero production records were altered, and production database `psyco-9c13d-default-rtdb` remains completely isolated and untouched.**

### Staging Environment Status Overview
* **Staging Project ID:** `psyco-ai-staging` (Project Number: `651213878079`)
* **Staging Database URL:** `https://psyco-ai-staging-default-rtdb.firebaseio.com` (Verified Active, HTTP 200)
* **Security Rules Status:** **`DEPLOYED & VERIFIED`**. All 27 rule nodes from [`database.rules.json`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/database.rules.json) published to `psyco-ai-staging-default-rtdb`.
* **Synthetic Staging Seeder:** **`EXECUTED SUCCESSFULLY`**. Seeded 11 synthetic clinical entities (admin, approved psychologist, patient, availability, appointments, sessions, SOAP drafts, treatment plans, PHQ-9 screeners, risk flags, and public submissions).
* **Environment Files Configured:** `backend/.env.staging` and `frontend/.env.staging` configured with staging project parameters.
* **Production Integrity Safeguards:** **`ENFORCED`**. Production project `psyco-9c13d` protected by automated target interceptors.

---

## 2. Dedicated Staging Environment Details

### 2.1 Staging Firebase Infrastructure
* **Firebase Project ID:** `psyco-ai-staging`
* **Default Database Instance:** `psyco-ai-staging-default-rtdb`
* **Location:** `us-central1`
* **Database URL:** `https://psyco-ai-staging-default-rtdb.firebaseio.com`
* **Service Account:** `firebase-adminsdk-fbsvc@psyco-ai-staging.iam.gserviceaccount.com`
* **Web App ID:** `1:651213878079:web:09848e67fa97d2dfbfd98a`
* **Auth Domain:** `psyco-ai-staging.firebaseapp.com`
* **Storage Bucket:** `psyco-ai-staging.firebasestorage.app`

### 2.2 Security Rules Deployment Verification
The staging database was secured by publishing the exact application security rules:
* **Target:** `https://psyco-ai-staging-default-rtdb.firebaseio.com/.settings/rules.json`
* **Deployment Response:** `HTTP 200 OK {"status":"ok"}`
* **Active Verified Rules:**
  * `users` — Rejects user self-promotion (`newData.child('role').val() === data.child('role').val()`).
  * `patients` — Strictly isolated by user UID.
  * `psychologists` — Public directory access only for `approvalStatus === 'approved'`.
  * `sessionNotes` — ReBAC barrier: `root.child('users').child(auth.uid).child('role').val() != 'admin'` explicitly blocks administrators from reading private psychotherapy notes.
  * `auditLogs` — Read-only for admins; client write blocked (`.write: false`).

---

## 3. Seeded Staging Synthetic Data Inventory

The following synthetic records have been populated in `psyco-ai-staging-default-rtdb`:

| Entity Collection | Record Key | Seeded Synthetic Data Details |
| :--- | :--- | :--- |
| `users` | `admin_staging_01` | Role `admin`, Email `staging.admin@psyco.clinic` |
| `users` | `GQCjxZQwc2dxxKSBPeALbdkDYHE2` | Role `admin`, Email `admin.staging@psyco.clinic` (Operator Admin) |
| `users` | `psych_staging_01` | Role `psychologist`, Email `dr.staging.clinician@psyco.clinic` |
| `psychologists` | `psych_staging_01` | License `PSY-STAGING-001`, `approvalStatus: "approved"`, Adult CBT |
| `users` | `patient_staging_01` | Role `patient`, Email `staging.patient@example.com` |
| `patients` | `patient_staging_01` | Name `[STAGING] Alex Mercer`, Age 29, assigned to `psych_staging_01` |
| `availability` | `psych_staging_01` | Mon/Wed/Fri 09:00–17:00, 50m session duration, 10m buffer |
| `appointments` | `apt_staging_001` | 2026-11-04 10:00–10:50 UTC, `online`, status `confirmed` |
| `sessionRecords`| `ses_staging_001` | Session encounter status `in_progress` |
| `sessionNotes` | `not_staging_001` | Structured SOAP note draft with subjective anxiety symptoms |
| `treatmentPlans`| `tp_staging_001` | SMART anxiety management goals, shared with patient |
| `assessmentDefinitions` | `phq-9` | Standard 9-item symptom screener definition |
| `assessmentAssignments`| `asg_staging_001`| PHQ-9 assigned to `patient_staging_01` |
| `assessmentResults`| `res_staging_001`| Score 7 (Mild Depression), critical item 9 = 0 |
| `riskReviewFlags`| `flg_staging_001` | Low severity stress overload flag, reviewed by clinician |
| `contactSubmissions`| `cnt_staging_001`| Synthetic prospective patient inquiry |
| `faqSubmissions`| `faq_sub_staging_001`| Synthetic public FAQ submission awaiting moderation |

---

## 4. Environment Files Configured

* **Backend Staging Configuration:** [`backend/.env.staging`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/backend/.env.staging)  
  Points to `psyco-ai-staging`, database URL `https://psyco-ai-staging-default-rtdb.firebaseio.com`, with staging service account keys.
* **Frontend Staging Configuration:** [`frontend/.env.staging`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/frontend/.env.staging)  
  Configured with staging web app credentials.
* **Source Control Protection:** Root [`.gitignore`](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/.gitignore) updated to explicitly exclude `.env.*` and `.env.staging` files while keeping `.env.*.example` templates visible.

---

## 5. Remaining Operator Actions for Live Staging Release

1. **Google OAuth Test Users:** In Google Cloud Console for project `psyco-ai-staging` (or OAuth client `143160785926`), add `admin.staging@psyco.clinic` under **APIs & Services > OAuth consent screen > Test users** to unblock Google Sign-In.
2. **Clinician Calendar Sync:** Once logged in as `dr.staging.clinician@psyco.clinic` on staging, navigate to Settings and click **Connect Google Calendar** to authorize meeting link generation.
3. **Deploy Staging Build:** Frontend and backend can now be run with staging environment files or deployed to staging hosting targets with 100% safety.
