# Phase 7.6.3: Clinical Workflow, Safety Gate & Transcript Audit

**Project**: Psyco AI — Mental Health Practice Management Platform
**Target Environments**: Staging (`psyco-ai-staging.web.app` / `psyco-ai.onrender.com`), Production (`psyco-9c13d`)
**Audit Date**: 2026-11-04
**Auditor**: Clinical Workflow Engineer & Healthcare AI Safety Specialist
**Document Reference**: `docs/phase7_6_3/PHASE_7_6_3_CLINICAL_WORKFLOW_AUDIT.md`
**Classification**: Clinical Safety & Documentation Integrity Audit

---

## 1. Executive Summary

This audit assesses the clinical documentation, suicide risk assessment safeguards, psychotherapy transcript provenance, and AI Sandbox boundaries active on Psyco AI.

Clinical documentation integrity requires that AI-generated clinical assistance remains strictly advisory: every clinical note, treatment plan, and risk flag requires deliberate human clinician review, approval, and cryptographic signing before entering the permanent medical record.

---

## 2. Clinical Safety & Q9 Suicide Risk Gate

- **Risk Flag Detection**: During intake and session documentation, responses indicating elevated suicide risk (e.g. PHQ-9 Question 9 score > 0 or explicit crisis indicators) trigger a server-side clinical risk flag (`flg_...`).
- **Session Finalization Gate**:
  - The backend `finalizeSession` service inspects all open flags associated with the session:
    ```javascript
    if (activeFlags.length > 0) {
      throw new Error('Cannot finalize session: active clinical risk-review flags require clinician acknowledgment.');
    }
    ```
  - Attempting to finalize an unacknowledged high-risk session yields HTTP 412 `PRECONDITION_FAILED`.
  - The clinician must explicitly review the safety plan, acknowledge the risk flag via `POST /api/v1/risk-review/flags/:id/acknowledge`, and sign the record before the session can transition to `FINALIZED`.

---

## 3. Psychotherapy Transcripts & AI Sandbox Mode

- **AI Sandbox Enforced**:
  - `AI_SANDBOX_MODE=true`
  - `GEMINI_PROVIDER=mock`
  - `GEMINI_CLINICAL_LIVE_ENABLED=false`
  - `ASSEMBLYAI_LIVE_ENABLED=false`
- **Zero Microphone Audio Recording**: Real-time microphone capture is completely disabled in the staging environment.
- **Transcript Provenance**: All displayed transcript demonstrations are explicitly labeled as synthetic clinical training dialogues. Simulated dialogue is never misrepresented as captured patient speech.
- **Human-in-the-Loop Enforced**: AI-assisted summaries remain in `DRAFT` status until explicitly reviewed, edited, approved, and signed by the licensed psychologist.
