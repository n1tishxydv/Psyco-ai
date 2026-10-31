# Psyco AI — Accessibility Statement

**Document Reference:** `PSYCO-LEGAL-009`  
**Classification:** `READY FOR LEGAL REVIEW`  
**Version:** `1.0.0-staging`  
**Effective Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app`)  
**Production Isolation:** Production project `psyco-9c13d` strictly isolated  

---

## 1. Accessibility Commitment

Psyco AI is engineered to provide an accessible digital workspace for mental healthcare, accommodating users with visual, auditory, cognitive, and motor impairments.

---

## 2. Implemented Accessibility Features

Based on code-level inspection of the React frontend:

1. **Keyboard Navigation:** Full logical Tab navigation across forms, calendar time-slots, and action buttons; visible focus indicators (`focus-visible:ring-2 focus-visible:ring-softTeal`); modal dismissal via the `Escape` key.
2. **Semantic Hierarchy:** HTML5 landmark tags (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`), descriptive `aria-label` tags on icon buttons, and logical `<h1>`–`<h6>` heading progression.
3. **High-Contrast Dark Theme:** Primary text (`#F8FAFC`) against midnight navy (`#0F172A`) yields a contrast ratio exceeding **14:1** (exceeding WCAG 2.1 Level AA minimum of 4.5:1). Secondary text (`#94A3B8`) yields **5.5:1**.
4. **Accessible Forms:** Explicit `<label>` elements linked via IDs, live error alert banners, and non-preselected consent checkboxes.

---

## 3. Assessment & Certification Status

Psyco AI aligns with **WCAG 2.1 Level AA** standards. However, the application has not yet undergone formal third-party accessibility certification. No statutory certification is claimed at this staging phase.

---

## 4. Accessibility Feedback

To report an accessibility barrier or request assistive accommodation:
- **Contact:** Nitish Yadav (Psyco AI Platform Contact)
- **Email:** [n1tishxydv@gmail.com](mailto:n1tishxydv@gmail.com)
- **Phone:** [+91 9996844107](tel:+919996844107)
