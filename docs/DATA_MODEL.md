# Psyco AI — Data Model Specification

**Version:** 1.0.0 (Phase 0 Foundation)  
**Database Technology:** Firebase Realtime Database (Hierarchical JSON)  
**Storage Invariant:** Strict Structured Text & JSON Data Only. No Binary Blobs.

---

## 1. Architectural Conventions

* **Identifiers:** Standardized prefixed UUIDv4 or Firebase push IDs (e.g., `usr_...`, `pat_...`, `psy_...`, `apt_...`, `ses_...`, `not_...`, `aud_...`).
* **Timestamps:** ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`) for cross-timezone reliability.
* **Denormalization:** Read-heavy relationships (e.g. appointment summary on patient profile) are denormalized for fast reads, maintained via atomic multi-path writes.
* **Security & Access Rule:** Patient cannot read raw clinical notes or other patients' nodes. Psychologists only read/write their assigned patients. Administrators govern accounts without direct clinical notes access.

---

## 2. Core Realtime Database Schema Tree

```
/ (root)
├── users/
│   └── {userId}/
│       ├── uid: string
│       ├── email: string
│       ├── role: "patient" | "psychologist" | "admin"
│       ├── status: "active" | "pending_verification" | "suspended"
│       ├── createdAt: ISO8601
│       └── updatedAt: ISO8601
│
├── patients/
│   └── {patientId}/
│       ├── userId: string (ref: users.uid)
│       ├── fullName: string
│       ├── email: string
│       ├── gender: "male" | "female" | "non_binary" | "prefer_not_to_say"
│       ├── age: number
│       ├── emergencyContact: { name, relationship, phone }
│       ├── intakeStatus: "pending" | "submitted" | "reviewed"
│       ├── intakeData: { medicalHistory, previousTherapy, presentingProblems, currentMedications }
│       ├── assignedPsychologistIds: { [psychologistId]: boolean }
│       ├── createdAt: ISO8601
│       └── updatedAt: ISO8601
│
├── psychologists/
│   └── {psychologistId}/
│       ├── userId: string (ref: users.uid)
│       ├── fullName: string
│       ├── email: string
│       ├── licenseNumber: string
│       ├── specialization: [string]
│       ├── qualifications: [string]
│       ├── bio: string
│       ├── verified: boolean
│       ├── consultationModes: { inPerson: boolean, online: boolean }
│       ├── defaultSessionDurationMinutes: number (default: 50)
│       ├── bufferTimeMinutes: number (default: 10)
│       ├── timezone: string (default: "Asia/Kolkata")
│       ├── clinicAddress: { line1, city, state, postalCode }
│       ├── createdAt: ISO8601
│       └── updatedAt: ISO8601
│
├── availability/
│   └── {psychologistId}/
│       ├── weeklySchedule: {
│       │     monday: [{ startTime: "09:00", endTime: "17:00", mode: "both" }],
│       │     tuesday: [...],
│       │     wednesday: [...],
│       │     thursday: [...],
│       │     friday: [...],
│       │     saturday: [...],
│       │     sunday: [...]
│       │   }
│       ├── overrides: {
│       │     "2026-10-25": [{ startTime: "10:00", endTime: "14:00", isBlocked: boolean }]
│       │   }
│       └── updatedAt: ISO8601
│
├── appointments/
│   └── {appointmentId}/
│       ├── id: string
│       ├── patientId: string (ref: patients)
│       ├── psychologistId: string (ref: psychologists)
│       ├── startTime: ISO8601
│       ├── endTime: ISO8601
│       ├── mode: "in_person" | "online"
│       ├── status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show"
│       ├── location: { type: "clinic" | "google_meet", addressOrUrl: string }
│       ├── cancellationReason: string | null
│       ├── sessionRecordId: string | null (ref: sessionRecords)
│       ├── createdAt: ISO8601
│       └── updatedAt: ISO8601
│
├── calendarEvents/
│   └── {psychologistId}/
│       └── {eventId}/
│           ├── appointmentId: string
│           ├── googleCalendarEventId: string | null
│           ├── syncStatus: "synced" | "pending" | "failed" | "unconfigured"
│           ├── lastSyncedAt: ISO8601 | null
│           └── eventSummary: string
│
├── sessionRecords/
│   └── {sessionId}/
│       ├── id: string
│       ├── appointmentId: string (ref: appointments)
│       ├── patientId: string
│       ├── psychologistId: string
│       ├── scheduledAt: ISO8601
│       ├── actualStartTime: ISO8601
│       ├── actualEndTime: ISO8601
│       ├── sessionMode: "in_person" | "online"
│       ├── sessionStatus: "in_progress" | "concluded" | "abandoned"
│       ├── hasTranscript: boolean
│       ├── notesFinalized: boolean
│       └── createdAt: ISO8601
│
├── sessionNotes/
│   └── {noteId}/
│       ├── id: string
│       ├── sessionId: string (ref: sessionRecords)
│       ├── patientId: string
│       ├── psychologistId: string
│       ├── format: "SOAP" | "DAP" | "BIRP" | "CUSTOM"
│       ├── content: {
│       │     subjective: string,
│       │     objective: string,
│       │     assessment: string,
│       │     plan: string
│       │   }
│       ├── isDraft: boolean
│       ├── aiAssisted: boolean
│       ├── signedAt: ISO8601 | null
│       ├── version: number
│       ├── versionHistory: [{ version: number, modifiedAt: ISO8601, modifiedBy: string, contentSnapshot: object }]
│       └── createdAt: ISO8601
│
├── treatmentPlans/
│   └── {planId}/
│       ├── id: string
│       ├── patientId: string
│       ├── psychologistId: string
│       ├── diagnosisCodes: [string] (e.g. ICD-11 / DSM-5)
│       ├── primaryGoals: [{ id: string, description: string, targetDate: string, status: "active" | "achieved" | "revised" }]
│       ├── clinicalInterventions: [string]
│       ├── reviewFrequencyWeeks: number
│       ├── active: boolean
│       ├── approvedByPsychologist: boolean
│       ├── approvedAt: ISO8601
│       └── updatedAt: ISO8601
│
├── consentRecords/
│   └── {consentId}/
│       ├── id: string
│       ├── patientId: string
│       ├── consentType: "general_treatment" | "telehealth_agreement" | "audio_transcription_consent"
│       ├── granted: boolean
│       ├── ipAddress: string
│       ├── userAgent: string
│       ├── signedAt: ISO8601
│       └── revocationDate: ISO8601 | null
│
├── notifications/
│   └── {userId}/
│       └── {notificationId}/
│           ├── id: string
│           ├── title: string
│           ├── message: string
│           ├── type: "appointment_reminder" | "intake_request" | "system_alert"
│           ├── read: boolean
│           └── createdAt: ISO8601
│
└── auditLogs/
    └── {logId}/
        ├── id: string
        ├── timestamp: ISO8601
        ├── actorUserId: string
        ├── actorRole: "patient" | "psychologist" | "admin" | "system"
        ├── action: "LOGIN" | "CREATE_APPOINTMENT" | "VIEW_PATIENT" | "SIGN_NOTE" | "REVOKE_CONSENT"
        ├── targetResource: string (e.g. "sessionNotes/not_123")
        ├── ipAddress: string
        ├── userAgent: string
        └── metadata: object (Strictly no sensitive PII or therapeutic text)
```

---

## 3. Future Nodes Specification (Phases 5 – 7)

* **`sessionTranscripts/{sessionId}`:** Pure text transcript segments with timestamps (`startMs`, `endMs`), speaker tags (`speaker: "psychologist" | "patient"`), and AssemblyAI metadata. No audio binaries stored.
* **`transcriptVersions/{sessionId}/{versionId}`:** History of human-corrected transcript segments.
* **`clinicalSummaries/{sessionId}`:** Structured clinical summary generated by Gemini and reviewed by clinician.
* **`treatmentPlanDrafts/{draftId}`:** Interim AI-generated treatment proposals awaiting clinician sign-off.
* **`assessments/{assessmentId}`:** Clinical definitions of psychometric instruments (e.g. PHQ-9, GAD-7, PCL-5).
* **`assessmentResults/{resultId}`:** Patient item responses, aggregate severity scoring, and threshold categorization.
* **`riskAssessments/{riskId}`:** Clinician-evaluated risk screening (suicidality, self-harm, harm to others) with safety planning flags.
* **`aiJobs/{jobId}`:** Async worker tracking status (`pending`, `processing`, `completed`, `failed`) and run duration for transcription or synthesis tasks.
* **`reports/{reportId}`:** Text-based authoritative medical and discharge summaries.
* **`copilotInteractions/{interactionId}`:** Ephemeral audit of prompt templates and clinician feedback for quality tuning.

---

## 4. Firebase Realtime Database Security Rules Baseline

The security strategy employs Firebase Security Rules coupled with server-side validation:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')"
      }
    },
    "patients": {
      "$patientId": {
        ".read": "auth != null && (data.child('userId').val() === auth.uid || root.child('psychologists').child(auth.uid).exists())",
        ".write": "auth != null && data.child('userId').val() === auth.uid"
      }
    },
    "sessionNotes": {
      "$noteId": {
        ".read": "auth != null && root.child('psychologists').child(auth.uid).exists() && data.child('psychologistId').val() === auth.uid",
        ".write": "auth != null && root.child('psychologists').child(auth.uid).exists() && (newData.child('psychologistId').val() === auth.uid || data.child('psychologistId').val() === auth.uid)"
      }
    },
    "auditLogs": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null"
    }
  }
}
```
*(Complete rules will be finalized alongside respective phase implementations)*
