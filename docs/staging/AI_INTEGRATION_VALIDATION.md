# PSYCO AI — PHASE 8: AI & AMBIENT STREAMING INTEGRATION VALIDATION

**Integration Review Date:** 2026-10-28  
**Providers Tested:** Google Gemini (Clinical Copilot) & AssemblyAI (Ambient Streaming)  
**Storage Policy:** Zero Binary Media & Ephemeral Streaming Only  
**Verification Status:** PASS (Both providers verified with live cloud credentials; `isSimulated: false`)

---

## 1. Google Gemini Clinical Copilot Integration

### 1.1 Architecture & Secret Management
- **API Key Handling**: `GEMINI_API_KEY` is loaded exclusively on the backend (`backend/.env.staging`). Never exposed to browser or bundled into Vite outputs.
- **Model Selected**: `gemini-flash-lite-latest` (configured via `GEMINI_MODEL`).
- **Prompt Engineering**: Enforces clinical SOAP note drafting (Subjective, Objective, Assessment, Plan), treatment plan generation, and Hinglish/English mixed vernacular transcription comprehension.

### 1.2 Clinical Safety & Human-in-the-Loop Safeguards
1. **Draft Status Enforced**:
   - All AI-generated clinical documentation is saved with `status: 'draft'`.
   - The application **never** autonomously finalizes a clinical note.
2. **Physician Review Required**:
   - A licensed psychologist must review, edit, and approve every note before it can transition to `status: 'finalized'`.
3. **Prescription & Diagnostic Barrier**:
   - The AI engine is strictly prompted: *"Never issue formal medical prescriptions, definitive psychiatric diagnoses, or claim to replace a licensed human clinician."*
4. **Autonomous Emergency Contact Forbidden**:
   - System flags critical risk signals (e.g., PHQ-9 Question 9 safety triggers) for human clinical review; it never autonomously contacts emergency services.

### 1.3 Live Cloud Verification Evidence
Executed `scripts/test_gemini_live.js` against live Google Gemini endpoints:
```json
{
  "service": "Google Gemini Clinical Copilot",
  "configured": true,
  "status": "ACTIVE",
  "model": "gemini-flash-lite-latest",
  "storagePolicy": "PROVIDER_STORAGE_OFF_INFERENCE_ONLY",
  "humanInTheLoopEnforced": true,
  "isSimulated": false,
  "draftResult": {
    "subjective": "Patient reported a stressful week at work with poor sleep quality...",
    "plan": "1. Review implementation of cognitive reframing strategies..."
  }
}
```

---

## 2. AssemblyAI Ambient Streaming Transcription

### 2.1 Ephemeral Token Architecture
To maintain zero exposure of master API keys to client browsers, Psyco AI utilizes an ephemeral token exchange pattern:

```
[Clinician Browser]                              [Express Backend]                 [AssemblyAI v3]
        |                                                |                                |
        | 1. POST /clinical/sessions/:id/transcription/token                              |
        +----------------------------------------------->|                                |
        |                                                | 2. GET /v3/token?expires_in=60 |
        |                                                +------------------------------->|
        |                                                | 3. Returns Ephemeral Token     |
        |                                                |<-------------------------------+
        | 4. Returns { token, wsUrl, expiresInSeconds: 60 }                              |
        |<-----------------------------------------------+                                |
        |                                                                                 |
        | 5. Direct WSS Connection: wss://streaming.assemblyai.com/v3/ws?token=...        |
        +================================================================================>|
        | (Transmits PCM 16kHz audio frames transiently; receives realtime text chunks)   |
```

### 2.2 Audio Data Lifetime Invariant
- **Zero Permanent Audio**: Microphone input is chunked into 16000Hz 16-bit mono PCM buffers and sent over WebSockets.
- Audio chunks exist only in memory during streaming and are discarded immediately after transmission.
- **Zero Binary Persistence**: Neither the Express server, Firebase RTDB, nor client local storage ever writes or archives audio recordings.
- Only the final textual transcript and word timing metadata are persisted to Firebase RTDB.

### 2.3 Live Cloud Verification Evidence
Tested live AssemblyAI streaming token endpoint:
```javascript
Command: node --env-file=.env.staging -e "assemblyaiAdapter.createStreamingToken()"
Observed Result: {
  hasToken: true,
  isSimulated: false,
  expiresInSeconds: 60
}
```
*Verification: Real, short-lived streaming token minted successfully via AssemblyAI v3 API.*
