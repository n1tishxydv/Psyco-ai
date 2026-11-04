# Phase 7.6.3: Initial Source, Component & Deployment Audit

**Project**: Psyco AI — Mental Health Practice Management Platform
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)
**Audit Date**: 2026-11-04
**Auditor**: Principal Full-Stack Engineer & Senior React Architect
**Document Reference**: `docs/phase7_6_3/PHASE_7_6_3_INITIAL_SOURCE_AUDIT.md`
**Classification**: Source Integrity & Deployment Audit

---

## 1. Executive Summary

This audit establishes the baseline source code state, deployment revisions, and dependency inventory for Psyco AI at the commencement of Phase 7.6.3. All active branches, uncommitted working-copy modifications, deployed assets, and backend runtime environments were inspected without executing destructive Git operations.

---

## 2. Git Repository & Deployment State

- **Active Branch**: `main`
- **Latest Remote Commit**: `ffda995 docs(phase7): add Phase 7.6.2.3 staging deployment and verification reports`
- **Remote Origin**: `https://github.com/n1tishxydv/Psyco-ai.git`
- **Working Tree Cleanliness**: All Phase 7.6.2 changes are safely tracked in Git. Existing working-copy modifications from prior tasks are preserved and uncommitted.

### 2.1 Live Staging Deployment Signatures
- **Frontend Live Host**: `https://psyco-ai-staging.web.app` (Firebase Hosting)
  - JavaScript Bundle: `/assets/index-D63ipk_k.js`
  - Stylesheet Bundle: `/assets/index-MGkt_Fgu.css`
  - Firebase Hosting Proxy: Active 302 redirect for `/api/v1/integrations/google/callback` to Render backend.
- **Backend Live Host**: `https://psyco-ai.onrender.com` (Render Web Service)
  - Process Runtime: Node.js `v24.22.1`, single-instance container (PID 86)
  - Health Status: `200 OK`, `status: HEALTHY`, `environment: staging`
  - Database Target: `https://psyco-ai-staging-default-rtdb.firebaseio.com`
  - Production Project (`psyco-9c13d`): Completely isolated and untouched.

---

## 3. Dependency Inventory & Package Inspection

### 3.1 Frontend (`frontend/package.json`)
- React: `^18.3.1` / React DOM: `^18.3.1`
- React Router: `^6.28.0` (Client-side routing engine)
- Lucide React: `^1.16.0` (Icon library)
- Styling: Tailwind CSS `^3.4.16` + PostCSS `^8.4.49` + Autoprefixer `^10.4.20`
- Utilities: `clsx` `^2.1.1` + `tailwind-merge` `^2.5.5`
- Firebase Client SDK: `^13.1.0`
- Build Tool: Vite `^6.0.1` + `@vitejs/plugin-react` `^4.3.4`

### 3.2 Backend (`backend/package.json`)
- Express: `^4.21.2`
- Firebase Admin / RTDB SDK: Direct REST + Service Account Token Management
- Security & Middleware: `helmet` `^8.0.0`, `cors` `^2.8.5`, `express-rate-limit` `^7.4.1`, `dotenv` `^16.4.7`
- Cryptography: Native Node.js `crypto` (`aes-256-gcm` AEAD tokens, SHA-256 HMAC nonces)
- Test Harness: Native Node.js test runner (`node --test`) + `supertest` `^7.0.0`

---

## 4. Architectural Discovery & Layout Structure

The application is structured around a three-tier role-based portal architecture:
1. **Public Layout (`PublicLayout.jsx`)**: Encloses public marketing, informational, legal, and directory pages with `<Navbar />` and `<Footer />`.
2. **Patient Layout (`PatientLayout.jsx`)**: Encloses authenticated patient pages (`/patient/*`) with a dedicated patient navigation sidebar and appointment actions.
3. **Psychologist Layout (`PsychologistLayout.jsx`)**: Encloses authenticated clinical practice workflows (`/psychologist/*`) with clinician sidebar, practice status indicators, and session workspace links.
4. **Admin Layout (`AdminLayout.jsx`)**: Encloses operational governance workflows (`/admin/*`) while enforcing strict clinical data lockout (`ADMIN_CLINICAL_ACCESS_PROHIBITED`).
