# Psyco AI — Missing Legal Information & Pre-Publication Review Register

**Document Reference:** `PSYCO-LEGAL-011`  
**Classification:** `DRAFT`  
**Version:** `1.0.0-staging`  
**Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app`)  

---

## 1. Executive Summary

This register catalogs all factual legal, corporate, operational, and regulatory parameters that remain **unconfirmed** or pending formal legal determination. 

In strict adherence to the project rules:
- **No placeholders that look like completed legal disclosures have been published.**
- **No company registration details, CIN, GSTIN, registered office addresses, or corporate entity names have been invented.**
- **Nitish Yadav is designated strictly as "Psyco AI Platform Contact" and not as an attorney, licensed medical doctor, registered psychologist, statutory Grievance Officer, or DPO.**
- **All public documents carry explicit disclaimers indicating they are operational drafts subject to formal review by qualified legal counsel.**

---

## 2. Unresolved Legal Facts Matrix

| Item # | Missing Information | Legal & Regulatory Requirement | Where It Appears in Platform | Who Must Confirm | Publication Blocker? | Operational Workaround in Staging |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LIR-01** | **Registered Legal Entity Name** | Required under Indian Companies Act / Consumer Protection (E-Commerce) Rules for contracting parties. | Footer, Terms of Service §1, Privacy Policy §1. | Corporate Legal Counsel / Founders. | **YES (Blocks Public Launch)** | Use "Psyco AI" as the platform brand name; disclose staging evaluation status. |
| **LIR-02** | **Registered Office Address** | Statutory requirement for service of legal notices and consumer protection disclosures in India. | Contact Page, Terms of Service §14, Privacy Policy §1. | Corporate Legal Counsel / Founders. | **YES (Blocks Public Launch)** | State operational region as "Asia/Kolkata (IST Standard Time)"; exclude fictional physical street addresses. |
| **LIR-03** | **Corporate Identification Number (CIN) & GSTIN** | Mandated for commercial e-commerce entities in India under tax and corporate statutes. | Invoice templates, Footer legal notices. | Chartered Accountant / Company Secretary. | **YES (Blocks Commercial Launch)** | Do not publish CIN/GSTIN; platform currently processes no commercial payments. |
| **LIR-04** | **Statutory Grievance Officer Formal Appointment** | Mandatory designation under Information Technology Act, 2000 (Intermediary Guidelines) and DPDPA 2023. | Privacy Policy §13, Privacy Requests Page, Footer. | Legal Counsel / Management. | **YES (Blocks Commercial Launch)** | Designate Nitish Yadav as "Psyco AI Platform Contact" with direct email and phone channels. |
| **LIR-05** | **Exact Statutory Clinical Record Retention Periods** | Reconciling Mental Healthcare Act, 2017 (MHCA), National Medical Commission (NMC) regulations, and state-level clinical establishment laws (3 vs. 7 years; pediatric record preservation rules). | Data Retention Policy §2, Privacy Policy §9. | Healthcare Regulatory Counsel. | **YES (Blocks Production Clinical Onboarding)** | Document baseline 3 to 7 years in policy; flag that clinical notes must not be deleted during active care. |
| **LIR-06** | **Sub-Processor Data Storage Geographies** | Determining whether patient data stored in Google Firebase / Render complies with cross-border data transfer rules under DPDPA 2023 (Blacklist / Negative List notifications). | Data Privacy Architecture §3, Privacy Policy §6. | Cloud Infrastructure Architect & Legal Counsel. | **NO (Staging OK, Blocks Public Launch)** | Staging database is deployed in Google Cloud `us-central1`. Documented transparently in architectural policies. |
| **LIR-07** | **Formal Subscription Pricing & Refund Policy** | Necessary if psychologists or clinics pay SaaS platform fees or if patients pay consultation fees through the platform. | Terms of Service §6, Pricing Pages. | Commercial Operations / Product Management. | **NO (Not implemented in Staging)** | Psyco AI currently includes no integrated billing gateway. Commercial payment terms omitted to avoid inventing false policies. |
| **LIR-08** | **Statutory Response Window for Privacy Requests** | Awaiting formal gazette notification of the Digital Personal Data Protection Rules, 2025 regarding mandatory response deadlines. | Privacy Requests Page §4, Privacy Policy §12. | Privacy Legal Counsel. | **NO (Staging OK)** | Policy states requests are acknowledged within standard business hours; no unsubstantiated statutory timelines promised. |
| **LIR-09** | **Third-Party Tele-Mental Health Accreditation** | Telemedicine Practice Guidelines (2020) requirements for clinical psychologist tele-consultations. | Terms of Service §5, Patient Onboarding. | Clinical Governance Board. | **NO (Pilot OK)** | Platform requires clinicians to warrant independent licensure and jurisdiction before tele-health activation. |

---

## 3. Publication Safety Clearance Checklist

Before Psyco AI transitions from Staging Pilot to Public Commercial Launch:

- [ ] Retain qualified Indian healthcare legal counsel to audit all policies against DPDPA 2023, IT Act 2000, and MHCA 2017.
- [ ] Incorporate registered legal entity name and physical registered office address.
- [ ] Formally appoint and publish statutory Grievance Officer details.
- [ ] Confirm clinical retention schedules for adult and pediatric mental health records with clinical advisors.
- [ ] Verify DPDPA cross-border data transfer compliance for cloud hosting regions.
- [ ] Execute formal third-party security, penetration testing, and accessibility (WCAG) audits.
