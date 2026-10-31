# Psyco AI — Cookie & Browser Storage Policy

**Document Reference:** `PSYCO-LEGAL-004`  
**Classification:** `READY FOR LEGAL REVIEW`  
**Version:** `1.0.0-staging`  
**Effective Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app`)  
**Production Isolation:** Production project `psyco-9c13d` strictly isolated  

---

## 1. Overview & Code Verification

Psyco AI enforces strict client-side data minimization. An inspection of our production bundle confirms that **Psyco AI does not deploy advertising trackers, behavioral profiling cookies, or third-party marketing pixels**.

Client-side storage is restricted to essential technologies required for authentication, session security, and interface preferences.

---

## 2. Storage Inventory

| Storage Key | Storage Mechanism | Classification | Lifespan | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `psyco_theme` | `localStorage` | Functional | Persistent | Stores user preference for dark or light UI theme mode. |
| `firebase:authUser:[apiKey]` | `IndexedDB` / `localStorage` | Strictly Essential | Session / Revocable | Stores Firebase Authentication identity tokens and refresh credentials. |
| `psyco_session_filter` | `sessionStorage` | Functional | Browser Tab Lifetime | Preserves psychologist directory search parameters during navigation. |

---

## 3. Verification of Zero Third-Party Advertising Trackers

An audit of our codebase, HTML entry point, and network dependencies confirms that:
- No Google Analytics (`gtag.js` / `analytics.js`) or Google Tag Manager scripts are loaded.
- No Meta / Facebook Pixels, TikTok pixels, or retargeting beacons are integrated.
- No cross-site tracking cookies are set.

---

## 4. How Users Manage Browser Storage

Users can inspect, manage, or delete local storage keys through browser developer settings:
- **Chrome:** Settings > Privacy and security > Site settings > Cookies and site data.
- **Firefox:** Settings > Privacy & Security > Cookies and Site Data > Manage Data.
- **Safari:** Preferences > Privacy > Manage Website Data.

*Note: Clearing essential authentication tokens will terminate active user sessions and require re-authentication.*

---

## 5. Contact Information

- **Designation:** Psyco AI Platform Contact
- **Contact Person:** Nitish Yadav
- **Email:** [n1tishxydv@gmail.com](mailto:n1tishxydv@gmail.com)
- **Phone:** [+91 9996844107](tel:+919996844107)
