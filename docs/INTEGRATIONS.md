# Psyco AI — Integration Boundaries & External Services Specification

**Version:** 1.0.0 (Phase 0 Foundation)  
**Status:** Architectural Specification & Boundary Adapters  
**Philosophy:** No fake operational status. Every integration adapter exposes an explicit `isConfigured()` check, handles missing credentials gracefully, and logs clean diagnostic indicators without crashing the host process.

---

## 1. Boundary Adapter Pattern

All external service interactions must occur through an isolated adapter adhering to the following interface:

```javascript
class ExternalServiceAdapter {
  isConfigured() {
    // Returns boolean based on environment variable presence
  }

  getStatus() {
    // Returns { configured: boolean, serviceName: string, status: string, error?: string }
  }
}
```

---

## 2. Integration Catalog

### 2.1 Firebase (Authentication & Realtime Database)
* **Target Phases:** Phase 2 (Auth), Phase 0–8 (Database)
* **Protocol:** Firebase Admin SDK (Node.js) & Firebase Web SDK v10 (Client)
* **Required Environment Variables:**
  - Client: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
  - Server: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`
* **Boundary Rules:**
  - Database access strictly for structured JSON records.
  - Zero binary media storage permitted (no Firebase Storage bucket configured).
  - Unconfigured fallback: System health endpoint accurately marks Firebase as `NOT_CONFIGURED` without crashing server startup.

### 2.2 Google Calendar API
* **Target Phase:** Phase 3 (Scheduling & Calendars)
* **Protocol:** Google APIs Node Client (`googleapis`) via OAuth 2.0 / Service Account
* **Required Environment Variables:**
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
* **Purpose:** Bidirectional synchronization of psychologist availability and confirmed appointments to eliminate double-booking with external personal calendars.
* **Failure Handling:** If sync fails or is unconfigured, appointments still save successfully to the internal Firebase Realtime Database. The appointment is marked `calendarSyncStatus: "unconfigured"` or `"pending"`.

### 2.3 Google Meet API
* **Target Phase:** Phase 3 (Online Consultations)
* **Protocol:** Google Calendar Event Creation with `conferenceDataVersion: 1`
* **Required Environment Variables:** Same as Google Calendar API.
* **Purpose:** Automatically provisions unique, secure Google Meet video room links for appointments booked with `mode: "online"`.
* **Fallback Behavior:** If unconfigured, online bookings are created with `location.addressOrUrl: "Google Meet integration not configured - consult administrator"`.

### 2.4 Google Gemini API
* **Target Phase:** Phase 6 (Clinical Documentation & Copilot)
* **Protocol:** Google Gen AI SDK (`@google/genai` or `@google/generative-ai`)
* **Required Environment Variables:**
  - `GEMINI_API_KEY`
* **Purpose:** Assists clinicians by transforming session transcripts and intake responses into draft SOAP notes, clinical summaries, and treatment plan proposals.
* **Clinical Safety Invariants:**
  - No patient data is processed until explicitly initiated by the psychologist.
  - All output is tagged `isDraft: true`.
  - Clinician must edit or accept before the note can be finalized.
  - Fallback: When unconfigured, the UI clearly displays "AI Copilot is unconfigured on this instance; manual note drafting is available."

### 2.5 AssemblyAI API
* **Target Phase:** Phase 5 (Ambient Session Transcription)
* **Protocol:** AssemblyAI REST / WebSocket Streaming SDK
* **Required Environment Variables:**
  - `ASSEMBLYAI_API_KEY`
* **Purpose:** Converts live or near-real-time spoken audio into speaker-diarized text transcripts.
* **Zero-Persistence Audio Invariant:**
  - Streaming audio is fed into the AssemblyAI WebSocket.
  - The client and server retain only text transcript chunks and timestamps.
  - No `.mp3`, `.wav`, or other audio recordings are stored in the database or filesystem.
* **Fallback Behavior:** If unconfigured, manual note taking is retained as the operational standard.

### 2.6 Background Job Queue & Worker Process
* **Target Phase:** Phase 6 (Durable Async Jobs)
* **Protocol:** Redis-backed BullMQ or lightweight database-backed queue
* **Required Environment Variables:**
  - `REDIS_URL` (optional)
* **Purpose:** Isolates heavy AI summarization and large transcript processing from the HTTP request-response cycle, preventing gateway timeouts.
* **Worker Isolation:** The worker process operates as an independent script (`backend/src/workers/aiWorker.js`), ensuring web server availability is unaffected by compute-intensive tasks.

---

## 3. Integration Status Matrix (Phase 0 Scaffold State)

| Integration | Phase 0 Adapter Status | Credentials Required in Phase 0? | Behavior in Phase 0 |
| :--- | :---: | :---: | :--- |
| **Firebase RTDB** | Scaffolded Boundary | No (Optional) | Returns `UNCONFIGURED` in health check unless `.env` provided |
| **Firebase Auth** | Scaffolded Boundary | No (Optional) | Development mode bypass stub available for route structure verification |
| **Google Calendar** | Isolated Skeleton | No | `isConfigured() === false`; non-blocking |
| **Google Meet** | Isolated Skeleton | No | `isConfigured() === false`; non-blocking |
| **Google Gemini** | Isolated Skeleton | No | `isConfigured() === false`; non-blocking |
| **AssemblyAI** | Isolated Skeleton | No | `isConfigured() === false`; non-blocking |
| **Worker Queue** | Isolated Skeleton | No | Inactive in Phase 0 |
