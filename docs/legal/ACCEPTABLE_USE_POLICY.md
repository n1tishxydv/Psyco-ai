# Psyco AI — Acceptable Use Policy

**Document Reference:** `PSYCO-LEGAL-008`  
**Classification:** `READY FOR LEGAL REVIEW`  
**Version:** `1.0.0-staging`  
**Effective Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app`)  
**Production Isolation:** Production project `psyco-9c13d` strictly isolated  

---

## 1. Scope & Purpose

This Acceptable Use Policy establishes ethical rules and security boundaries for all users of Psyco AI (patients, clinicians, administrators, and visitors).

---

## 2. Prohibited Conduct

1. **Clinical Privacy Lockout Violations:**
   - Any attempt by administrative accounts to read or intercept clinical therapy session notes, speech transcripts, or intake questionnaires.
   - Any attempt by psychologists to access patient records outside their assigned therapeutic caseload.
2. **Professional Impersonation & Fraud:**
   - Submitting fabricated license numbers, unaccredited degrees, or forged credentials.
   - Practicing clinical psychology without an active, lawful license.
3. **Security Probing & Attacks:**
   - Probing, scanning, or fuzzing platform REST endpoints or database rules without written authorization.
   - Attempting Cross-Site Scripting (XSS), SQL/NoSQL injection, or Denial of Service attacks.
4. **Scraping & Reverse Engineering:**
   - Utilizing bots, scrapers, or automated crawlers to harvest clinician directories or patient data.
   - Extracting or reverse-engineering proprietary AI prompt structures.
5. **Binary Media Uploads:**
   - Attempting to bypass the text-only invariant by uploading base64-encoded audio/video files into text input fields.

---

## 3. Enforcement & Sanctions

Violations result in immediate administrative account suspension (`PUT /api/v1/admin/users/:id/suspend`), revocation of session tokens, and reporting to relevant licensing bodies or statutory law enforcement.

---

## 4. Reporting Violations

- **Contact Person:** Nitish Yadav (Psyco AI Platform Contact)
- **Email:** [n1tishxydv@gmail.com](mailto:n1tishxydv@gmail.com)
- **Phone:** [+91 9996844107](tel:+919996844107)
