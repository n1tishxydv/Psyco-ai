# Psyco AI — Legal & Documentation Verification Test Matrix

**Document Reference:** `PSYCO-TEST-008`  
**Version:** `1.0.0`  
**Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app` / `https://psyco-ai.onrender.com`)  
**Backend Automated Suite:** 218 Tests Passing (`npm test`)  
**Frontend Production Build:** Successful Code Splitting (`dist/assets/`, Vite 6)  

---

## 1. Route Navigation & Direct URL Verification Matrix

| Route | Component | Code Split Chunk | Direct URL Test | Browser Refresh | Mobile Layout | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/legal` | `DocumentationCentrePage` | `DocumentationCentrePage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/documentation` | Redirect to `/legal` | N/A | PASSED | PASSED | Responsive | **VERIFIED** |
| `/privacy-policy` | `PrivacyPage` | Static / Direct | PASSED | PASSED | Responsive | **VERIFIED** |
| `/privacy` | Redirect to `/privacy-policy` | N/A | PASSED | PASSED | Responsive | **VERIFIED** |
| `/terms` | `TermsPage` | Static / Direct | PASSED | PASSED | Responsive | **VERIFIED** |
| `/data-privacy` | `DataPrivacyPage` | Static / Direct | PASSED | PASSED | Responsive | **VERIFIED** |
| `/security-overview` | Redirect to `/data-privacy`| N/A | PASSED | PASSED | Responsive | **VERIFIED** |
| `/cookie-policy` | `CookiePolicyPage` | `CookiePolicyPage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/ai-transparency` | `AiTransparencyPage` | `AiTransparencyPage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/medical-disclaimer`| `MedicalDisclaimerPage` | `MedicalDisclaimerPage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/data-retention` | `DataRetentionPolicyPage` | `DataRetentionPolicyPage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/acceptable-use` | `AcceptableUsePage` | `AcceptableUsePage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/accessibility` | `AccessibilityPage` | `AccessibilityPage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/privacy-requests` | `PrivacyRequestsPage` | `PrivacyRequestsPage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |
| `/contact` | `ContactPage` | Static / Direct | PASSED | PASSED | Responsive | **VERIFIED** |
| `/for-patients` | `PatientPortalInfoPage` | Static / Direct | PASSED | PASSED | Responsive | **VERIFIED** |
| `/patient-guide` | Redirect to `/for-patients` | N/A | PASSED | PASSED | Responsive | **VERIFIED** |
| `/for-psychologists`| `PsychologistPortalInfoPage`| Static / Direct | PASSED | PASSED | Responsive | **VERIFIED** |
| `/psychologist-guide`| Redirect to `/for-psychologists`| N/A | PASSED | PASSED | Responsive | **VERIFIED** |
| `/admin-guide` | `AdminGuidePage` | `AdminGuidePage-*.js` | PASSED | PASSED | Responsive | **VERIFIED** |

---

## 2. Interactive Feature & Layout Validation

| Test Item | Verification Method | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Global Footer Navigation** | Click all 19 links in the 4 footer groups. | Every link routes cleanly without 404. | All 19 links navigate to live, dedicated pages. | **PASSED** |
| **Clickable Phone Link** | Click `tel:+919996844107`. | Triggers default device telephony handler. | Phone link formatted with `tel:` URI. | **PASSED** |
| **Clickable Email Link** | Click `mailto:n1tishxydv@gmail.com`. | Opens default mail client with recipient pre-filled. | Mail link formatted with `mailto:` URI. | **PASSED** |
| **Document Search Bar** | Input query `"ReBAC"`, `"Gemini"`, `"erasure"`. | Real-time filtering of document cards in Documentation Centre. | Cards filter instantaneously by keywords and tags. | **PASSED** |
| **Category Filter Pills** | Click "Legal Documents", "Privacy", "Clinical Safety". | Only cards matching the selected category are displayed. | Category filtering operates seamlessly. | **PASSED** |
| **Table of Contents Jump** | Click anchor link `#security-lockout`. | Smoothly scrolls to target section. | Target section brought into view smoothly. | **PASSED** |
| **Print / Save as PDF** | Click "Print / Save PDF" button. | Invokes native `window.print()` with clean layout. | Media print stylesheet hides navbars and formats content. | **PASSED** |
| **Copy Link to Clipboard** | Click "Share" button on document header. | Copies URL to clipboard and shows "Link Copied" state. | URL copied to clipboard with 2-second confirmation badge. | **PASSED** |
| **Contact Form Validation** | Submit with empty fields or invalid email. | Blocks submission and displays red alert banner. | Client-side validation prevents invalid submissions. | **PASSED** |
| **Honeypot Bot Protection** | Submit form with hidden `hp_website` populated. | Backend silently drops spam with HTTP 200 without DB write. | Honeypot drops spam and logs security notice. | **PASSED** |
| **Privacy Request Submission** | Submit valid data principal request. | Validates payload, stores under `/contactSubmissions`, returns ID. | Record stored with unique reference ID. | **PASSED** |

---

## 3. Consent Flow Linkage Validation

| Flow | File & Component | Link Implemented | Verification Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Patient Onboarding** | `OnboardingPage.jsx` | `/terms`, `/medical-disclaimer`, `/ai-transparency`, `/privacy-policy`, `/data-privacy` | Links open in separate tabs (`target="_blank"`); non-preselected checkboxes enforced. | **PASSED** |
| **Patient Registration** | `RegisterPage.jsx` | `/terms`, `/privacy-policy`, `/medical-disclaimer` | Disclosure banner placed above registration submit button. | **PASSED** |
| **Clinician Registration** | `RegisterPage.jsx` | `/terms`, `/ai-transparency`, `/data-privacy` | Disclosure banner placed above clinician practice submit button. | **PASSED** |
| **Patient Intake Form** | `PatientIntakePage.jsx` | `/terms`, `/medical-disclaimer`, `/ai-transparency`, `/privacy-policy`, `/data-privacy` | Section 6 consent checkboxes provide explicit clickable links. | **PASSED** |
| **Appointment Booking** | `BookingPage.jsx` | `/terms#appointments`, `/privacy-policy` | Booking confirmation card discloses cancellation & privacy terms. | **PASSED** |

---

## 4. Security & Safety Invariants Audit

| Safety Invariant | Test Verification | Result | Status |
| :--- | :--- | :--- | :--- |
| **Administrator Clinical Privacy Lockout** | Automated test `Phase 5: Administrator Portal & Privacy Lockout` checks GET `/clinical/patients/:id/chart` with admin token. | Returns HTTP 403 `ADMIN_CLINICAL_ACCESS_PROHIBITED`. | **PASSED** |
| **Patient Data Isolation** | Automated test `Phase 3: Patient Portal Functionality & Isolation` queries unrelated patient charts. | Returns HTTP 403 Forbidden. Cross-patient leakage blocked. | **PASSED** |
| **Zero Binary Media Invariant** | Automated test `Phase 8: Text-Only Invariant & Binary Media Denial` tests base64 image/audio insertion into RTDB. | Rejected by validation schemas and security rules. | **PASSED** |
| **No Production Firebase Connection** | Automated test `Phase 13: Staging Safety & Repeatable Environment Guards` checks that `psyco-9c13d` is rejected. | Fail-closed termination if target is production `psyco-9c13d`. | **PASSED** |
| **Frontend Secret Exposure** | Inspection of Vite bundle `dist/assets/*.js`. | No service account keys, private tokens, or backend credentials present. | **PASSED** |
| **XSS & Injection Protection** | Script tags injected into contact form inputs. | React JSX automatic escaping and backend Zod trimming sanitize input. | **PASSED** |
