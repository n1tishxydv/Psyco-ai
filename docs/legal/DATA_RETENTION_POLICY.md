# Psyco AI — Data Retention & Deletion Policy

**Document Reference:** `PSYCO-LEGAL-007`  
**Classification:** `READY FOR LEGAL REVIEW`  
**Version:** `1.0.0-staging`  
**Effective Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app`)  
**Production Isolation:** Production project `psyco-9c13d` strictly isolated  

---

## 1. Retention Principles & The Zero-Binary Media Invariant

Psyco AI adheres to data minimization:
- **Audio & Video Streams:** Zero permanent retention (purged immediately from volatile RAM upon speech-to-text conversion).
- **Text & JSON Records:** Stored in Firebase Realtime Database and retained only as long as necessary for clinical care and legal compliance.

---

## 2. Retention Schedule by Data Category

| Category | Storage Path | Stated Retention Window | Legal & Technical Basis | Status |
| :--- | :--- | :--- | :--- | :--- |
| **User Accounts** | `/users/$uid` | Active account lifespan + 30 days post-deletion. | Authentication management and account recovery. Stored in RTDB; soft-delete flag applied. | `REQUIRES LEGAL REVIEW` |
| **Patient Demographics** | `/patients/$uid` | Duration of active therapeutic care. | Clinical patient identification and emergency contacts. | `REQUIRES LEGAL REVIEW` |
| **Psychologist Credentials** | `/psychologists/$uid` | Duration of affiliation + 3 years. | Licensure verification and credential audit trail. | `REQUIRES LEGAL REVIEW` |
| **Appointment Logs** | `/appointments/$id` | 3 years minimum. | Attendance reconciliation, billing dispute defense, and tele-consult audit logs. | `REQUIRES LEGAL REVIEW` |
| **Psychiatrist / RMP Clinical Records** | `/sessionNotes/$id` | 3 years minimum (indoor records) / 3 years tele-consults. | National Medical Commission (NMC) Code of Medical Ethics Regulations, 2002 (Regulation 1.3.1 mandates 3 years for indoor patient records of Registered Medical Practitioners) and Telemedicine Practice Guidelines, 2020. | `REQUIRES LEGAL REVIEW` |
| **Psychologist / Therapy Session Notes** | `/sessionNotes/$id` | Subject to state rules / 3 to 7 years. | Outpatient psychotherapy records are not governed by a single uniform NMC 3-year rule; governed by NCAHP Act 2021, state clinical establishment rules, and institutional policy. | `REQUIRES LEGAL REVIEW` |
| **Pediatric / Minor Clinical Records** | `/sessionNotes/$id` | Recommended until patient reaches age 21+ (7 to 10+ years). | Section 6 of the Limitation Act, 1963 tolls the limitation period during legal disability (minority), enabling legal claims up to 3 years after reaching age 18 (age 21). While not an affirmative statutory healthcare retention mandate, retaining records until age 21 is a necessary risk-management and litigation-defense measure. | `REQUIRES LEGAL REVIEW` |
| **Cybersecurity Audit Logs** | `/auditLogs` | 12 months minimum. | Append-only cybersecurity audit trail in RTDB. Aligned with CERT-In directions. | `REQUIRES LEGAL REVIEW` |
| **Contact Submissions** | `/contactSubmissions` | 180 days post-resolution. | Administrative customer inquiry resolution. | `REQUIRES LEGAL REVIEW` |
| **Consultation Audio / Video Streams** | Ephemeral RAM | Zero permanent retention (purged immediately upon conversion). | Transient speech-to-text processing; zero-binary media invariant enforced in application code. | `VERIFIED` |

---

## 3. Clinical Data Retention: Practitioner Classifications & Legal Nuances

Clinical record retention in India is **not uniform across all mental health professionals**. Psyco AI documentation explicitly distinguishes between provider categories:

### 3.1 Registered Medical Practitioners (RMPs / Psychiatrists)
- **Governing Regulation:** National Medical Commission (NMC) Code of Medical Ethics Regulations, 2002 (Regulation 1.3.1).
- **Scope:** Mandates that every physician shall maintain medical records pertaining to **indoor (inpatient) patients** for a period of **3 years** from the date of commencement of treatment.
- **Telemedicine Scope:** The Telemedicine Practice Guidelines, 2020 mandate that RMPs maintain digital logs and consultation records for 3 years.
- **Application:** Applies strictly to physicians and psychiatrists registered with State Medical Councils / NMC. It does **not** automatically apply to non-medical psychotherapists.

### 3.2 Clinical Psychologists & Counselors
- **Governing Regulation:** Regulated under the Rehabilitation Council of India (RCI) Act, 1992 and the National Commission for Allied and Healthcare Professions (NCAHP) Act, 2021.
- **Scope:** There is **no single central statutory 3-year retention mandate** codified for outpatient psychotherapy session notes. Retention requirements depend on state clinical establishment licensing rules, state mental health authority directives, and professional ethical standards.
- **Classification:** Retention schedules for non-RMP psychologists remain marked **`REQUIRES LEGAL REVIEW`**.

### 3.3 Pediatric & Adolescent Care (Minors under 18) & Limitation Act Nuance
- **Limitation Period Consideration:** Section 6 of the Limitation Act, 1963 provides a procedural rule for legal disability: the period of limitation does not expire while an individual is a minor, allowing a former minor to institute legal proceedings within the statutory period (typically 3 years) after attaining majority at age 18 (i.e., up to age 21).
- **Not a Universal Statutory Healthcare Mandate:** Section 6 is a procedural limitation rule governing civil and tort actions; it is **not** an affirmative statutory command enacted under healthcare legislation directing healthcare facilities to store medical charts.
- **Risk-Management Prudence:** Retaining pediatric and adolescent records until at least age 21 is an essential malpractice defense and risk-mitigation prudence across clinical institutions to safeguard practitioners against delayed litigation.
- **Status:** The specific operational retention window for minor clinical charts remains marked **`REQUIRES LEGAL REVIEW`** pending consultation with healthcare legal counsel.

### 3.4 Technical Implementation Status
> [!NOTE]
> In Psyco AI's staging environment, data records persist indefinitely in Firebase Realtime Database. The platform has **not implemented automated time-based self-destruct cron jobs**. Stated retention windows represent legal preservation obligations and maximum holding limits, which require formal sign-off by healthcare legal counsel.

---

## 4. Deletion Procedure

1. Submit a formal request via the [Privacy Requests Portal](file:///c:/Users/Nitish%20kumar/projects/time%20pass/psyco/docs/legal/PRIVACY_REQUESTS.md).
2. The platform contact verifies registered email identity.
3. Non-clinical account records in Firebase Auth and `/users/$uid` are deactivated and purged within operational timeframes.
4. Finalized clinical therapy notes remain preserved in accordance with treating practitioner legal obligations.
