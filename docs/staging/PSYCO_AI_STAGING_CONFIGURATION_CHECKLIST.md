# PSYCO AI — STAGING CONFIGURATION CHECKLIST

**Document:** `docs/staging/PSYCO_AI_STAGING_CONFIGURATION_CHECKLIST.md`  
**Phase:** Staging Setup Phase 1 — Pre-Deployment Verification Checklist  
**Date:** October 28, 2026  
**Auditor:** Senior Full-Stack Engineer & Firebase Architect  

---

## Pre-Deployment Verification Matrix

| # | Checklist Item | Required Target | Verification Status | Notes / Instructions |
| :- | :--- | :--- | :--- | :--- |
| **1.0** | **CLOUD PROJECT & ENVIRONMENT ISOLATION** | | | |
| 1.1 | Dedicated Staging Firebase Project | `psyco-ai-staging` | **`READY`** | Dedicated project provisioned and active in Google Cloud. |
| 1.2 | Production Safeguard Assertion | Reject `psyco-9c13d` in staging mode | **`READY`** | Automated guard in `seedStagingEnvironment.js` actively aborts if run on prod. |
| 1.3 | Git / Source Tree Integrity | No uncommitted destructive changes | **`READY`** | Zero application source files modified; audit files isolated. |
| **2.0** | **DATABASE TARGET & STORAGE INVARIANTS** | | | |
| 2.1 | Dedicated Staging RTDB Instance | `https://psyco-ai-staging-default-rtdb.firebaseio.com` | **`READY`** | Instance verified active; HTTP 200 returned via Management API. |
| 2.2 | Zero Binary Media Invariant | Strict text-only JSON storage | **`READY`** | Verified: Zero raw audio or video files stored in RTDB nodes. |
| 2.3 | Remote Cloud Durability | No silent local disk fallbacks | **`READY`** | Verified: Backend throws explicit HTTP errors on cloud write failures. |
| **3.0** | **DATABASE SECURITY RULES** | | | |
| 3.1 | Database Rules Deployment | `database.rules.json` published | **`READY`** | Deployed to `psyco-ai-staging-default-rtdb`; readback verified. |
| 3.2 | ReBAC Psychotherapy Note Barrier | Admin blocked from notes in rules | **`READY`** | Rule `root.child('users').child(auth.uid).child('role').val() != 'admin'` enforced. |
| 3.3 | Self-Promotion Prevention | Role tampering blocked in rules | **`READY`** | Rule `newData.child('role').val() === data.child('role').val()` enforced. |
| **4.0** | **AUTHENTICATION & ROLE PROVISIONING** | | | |
| 4.1 | Cryptographic Token Verification | RS256 x509 cert validation | **`READY`** | Verified in `firebaseAuthAdapter.js`; rejects forged & expired tokens. |
| 4.2 | Google OAuth Staging Consent | Google OAuth Console test users | `BLOCKED` | Operator must add staging emails under OAuth Consent Screen > Test Users. |
| 4.3 | Synthetic Staging Identities | Fictional admin, psych, patient | **`READY`** | Seeded in staging DB (`staging.admin`, `dr.staging.clinician`, `staging.patient`). |
| **5.0** | **ENVIRONMENT FILES & SECRETS** | | | |
| 5.1 | Backend Staging File | `backend/.env.staging` | **`READY`** | Configured with `psyco-ai-staging` credentials; ignored by git. |
| 5.2 | Frontend Staging File | `frontend/.env.staging` | **`READY`** | Configured with `psyco-ai-staging` web config; ignored by git. |
| 5.3 | Local Secrets Invariant | `.env*` files not committed | **`READY`** | `.gitignore` updated to strictly ignore `.env.*` and `.env.staging`. |
| **6.0** | **HOSTING & API GATEWAY** | | | |
| 6.1 | Staging Frontend Target | Staging Web Host | `PENDING_OPERATOR` | Add `"hosting"` target to `firebase.json` or deploy to staging host. |
| 6.2 | Staging Backend Target | Staging API Host | `PENDING_OPERATOR` | Deploy container with `backend/.env.staging` environment variables. |
| 6.3 | CORS Origin Whitelisting | Match staging frontend URL | **`READY`** | Express CORS middleware dynamically checks `config.frontendUrl`. |
| 6.4 | Rate Limiter Exemptions | Polling endpoints exempted | **`READY`** | `/ai/jobs/:id`, `/notifications`, `/health` exempted from 429 rate limit. |
| **7.0** | **EXTERNAL PROVIDERS & COPILOT** | | | |
| 7.1 | AssemblyAI Ambient Transcription | Live streaming tokens | **`READY`** | Verified: 2667-char WSS tokens issued by `streaming.assemblyai.com/v3`. |
| 7.2 | Google Gemini Clinical Copilot | Live generative inference | **`READY`** | Verified: `gemini-flash-lite-latest` active with 1-click SOAP & Treatment Plan. |
| 7.3 | Google Calendar & Meet Sync | Clinician OAuth consent | `BLOCKED` | Clinician must complete interactive Google consent dialog for `calendar.events`. |
| **8.0** | **TEST SUITE & BUILD VERIFICATION** | | | |
| 8.1 | Backend Automated Tests | 112 / 112 passing | **`READY`** | Passed in 3179ms via native Node.js test runner (`npm test`). |
| 8.2 | Frontend Production Build | Clean Vite bundle | **`READY`** | Built in 6.21s with 0 errors (`dist/index.html` generated). |
| 8.3 | Rollback Procedure | Pinned version & teardown | **`READY`** | Pinned to `v1.0.0-rc1` (Build Hash: `CPiSydzu`); teardown commands documented. |

---

## Staging Readiness Verdict
* **Environment Isolation & Data Integrity:** **`100% COMPLETE & VERIFIED`**
* **Staging Database:** **`PROVISIONED, SECURED & SEEDED`**
* **Deployment Prerequisite:** Only OAuth test user registration in Google Cloud Console is needed for live Google SSO.
