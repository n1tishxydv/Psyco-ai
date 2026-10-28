# Psyco AI — Application Security Plan & Baseline

**Version:** 1.0.0 (Phase 0 Foundation)  
**Status:** Security Baseline  
**Disclaimer:** This document articulates the security architecture, controls, and roadmap for Psyco AI. Implementing security controls does not automatically confer HIPAA, GDPR, or SOC2 certification. Formal compliance requires rigorous third-party audits, administrative policies, and operational enforcement.

---

## 1. Threat Modeling & Core Defense Principles

Mental health applications safeguard some of the most sensitive personal data in existence: therapy notes, diagnostic assessments, psychological histories, and crisis deliberations. Our security posture is built on four core tenets:

1. **Defense-in-Depth:** Never rely solely on client-side routing, token presence, or database rules. Validate every request at the network gateway, middleware, controller, and database adapter.
2. **Zero Clinical Backdoor:** Administrative privileges govern identity lifecycle and operational health, but are mathematically barred from accessing private therapeutic records.
3. **Strict Data Minimization & Text-Only Invariant:** Eliminate exposure by refusing to store persistent binary media, raw audio recordings, or unencrypted biometric markers.
4. **Human-in-the-Loop AI Accountability:** AI models provide drafting suggestions; licensed human clinicians bear legal and clinical sign-off accountability.

---

## 2. Authentication & Session Management

* **Identity Provider:** Firebase Authentication handles password hashing (scrypt), multi-factor authentication, email verification, and OAuth federated tokens (Google Sign-In).
* **Server-Side Token Verification:** All authenticated REST requests require an `Authorization: Bearer <ID_TOKEN>` header. The backend validates token authenticity, expiration, and issuer via the Firebase Admin SDK.
* **Revocation and Expiry:** Firebase ID tokens expire after 60 minutes. Token refresh happens via the client SDK. Account suspension flags in the database revoke API access immediately.

---

## 3. Authorization & Relationship-Based Access Control (ReBAC)

Access control combines Role-Based Access Control (RBAC) with dynamic Relationship-Based Access Control:

* **Role Verification:** Middleware validates that the user possesses the required role (`patient`, `psychologist`, or `admin`).
* **Resource Ownership Guard:** A patient can strictly only query or update resources where `resource.patientId == request.auth.uid`.
* **Therapeutic Assignment Guard:** A psychologist can only access notes, intake records, and session history for patients who have an active therapeutic assignment with that psychologist.
* **Administrative Isolation:** Administrators receive `403 Forbidden` if attempting to query `sessionNotes`, `treatmentPlans`, or `transcripts`.

---

## 4. Input Validation & Defense Against Injection

* **Strict Zod Schemas:** Every inbound POST, PUT, and PATCH payload is validated against a typed Zod schema before reaching business logic.
* **Rejection of Unknown Keys:** Requests with unexpected or malicious payload fields are rejected with `400 Bad Request`.
* **Sanitization:** String inputs are trimmed and stripped of dangerous script tags to eliminate Stored Cross-Site Scripting (XSS).

---

## 5. Network Security & Gateway Defenses

* **Security Headers (Helmet):**
  - Content Security Policy (CSP) restricting script and frame sources.
  - HTTP Strict Transport Security (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
  - `X-Content-Type-Options: nosniff`.
  - `X-Frame-Options: DENY`.
* **CORS Policy:** Strict origin whitelisting configured via environment variable (`FRONTEND_URL`), disallowing wildcards (`*`) in production.
* **Rate Limiting:** IP and user-based throttles applied via `express-rate-limit`:
  - Auth endpoints: 5 attempts per 15 minutes.
  - General API endpoints: 100 requests per 15 minutes per IP.

---

## 6. Sensitive Data Sanitization & Logging Policy

* **Sanitized Request Logger:**
  - Standard request logs capture: HTTP Method, Route Path, Status Code, Latency, and IP.
  - **Explicitly Scrubbed:** The logger automatically scrubs Authorization headers, passwords, session transcripts, intake health questionnaires, and clinical note contents.
* **Centralized Error Handling:**
  - Production errors return standardized envelopes with generic error messages (`INTERNAL_SERVER_ERROR`).
  - Raw database error objects, memory dumps, and stack traces are suppressed from client responses.

---

## 7. Informed Consent & Ambient Transcription Security

* **Explicit Digital Consent:** Prior to any ambient transcription (Phase 5), the patient must sign a specific `audio_transcription_consent` record.
* **Revocation Workflow:** Patients retain the right to revoke transcription consent at any time, immediately halting automated speech processing.
* **Zero Audio Persistence:** Live audio buffers are transiently piped into AssemblyAI's streaming API and destroyed in memory immediately. Stored transcripts are text-only JSON representations.

---

## 8. Incident Response & Audit Logging

* **Immutable Audit Trail:** High-significance security and clinical events (logins, consent grants, record updates, note signatures) are committed to `/auditLogs`.
* **Immutability:** Audit log nodes are append-only; update and delete operations are rejected by database rules.
* **Breach Protocol:** In the event of suspected unauthorized access, affected sessions can be revoked instantly via the administrative portal, and audit logs exported for forensic analysis.
