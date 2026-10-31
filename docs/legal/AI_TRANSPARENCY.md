# Psyco AI — AI Transparency & Clinical Safety Framework

**Document Reference:** `PSYCO-LEGAL-005`  
**Classification:** `READY FOR LEGAL REVIEW`  
**Version:** `1.0.0-staging`  
**Effective Date:** October 31, 2026  
**Environment:** Staging Evaluation (`https://psyco-ai-staging.web.app`)  
**Production Isolation:** Production project `psyco-9c13d` strictly isolated  

---

## 1. Scope of Artificial Intelligence in Psyco AI

Psyco AI uses Google Gemini Large Language Models (LLM) solely as an **assistive documentation copilot** to help licensed psychologists draft structured Subjective-Objective-Assessment-Plan (SOAP) clinical notes.

**AI is never an independent diagnostic or prescribing practitioner.**

---

## 2. Human-in-the-Loop (HITL) Architecture

The platform architecture enforces strict human oversight gates:

```
+-------------------------------------------------------------------------------+
|                       HUMAN-IN-THE-LOOP (HITL) GATES                          |
+-------------------------------------------------------------------------------+
| 1. DRAFT ISOLATION                                                            |
|    - AI outputs are saved with status: 'draft'.                               |
|    - Completely invisible to patients and unauthorized parties.              |
|                                                                               |
| 2. NO AUTONOMOUS FINALIZATION                                                 |
|    - AI algorithms cannot digitally sign or finalize clinical records.        |
|                                                                               |
| 3. MANDATORY CLINICIAN EDITING & SIGNATURE                                    |
|    - Psychologists have full rich-text authority to rewrite or discard drafts.|
|    - Finalizing a note requires psychologist digital signature & timestamp.   |
+-------------------------------------------------------------------------------+
```

---

## 3. Clinical Limitations & Known Hallucination Risks

Large Language Models possess known technical limitations:
1. **Hallucination Risk:** Models may generate plausible-sounding but factually incorrect assertions.
2. **Absence of Non-Verbal Perception:** AI cannot perceive micro-expressions, vocal timbre, eye contact, or bodily tension.
3. **Cultural Nuances:** Models may misinterpret regional idioms or colloquial descriptions of psychological distress.

**Rule:** AI suggestions must never be trusted without expert clinician evaluation.

---

## 4. Absolute Clinical Prohibitions

1. **No Autonomous Diagnosis:** AI will never issue an autonomous psychiatric or psychological diagnosis.
2. **No Medication Prescribing:** Psyco AI does not calculate drug dosages, suggest psychotropic medications, or provide prescribing instructions.
3. **No Crisis Triaging:** AI tools are barred from evaluating acute suicide risk or replacing emergency medical services.

---

## 5. Third-Party AI & Speech Processing Disclosures

### 5.1 Google Gemini (Clinical Note Copilot)
1. **Actual Integrated Service:** Psyco AI integrates Google Gemini models using the official `@google/genai` SDK targeting the **Google AI Studio developer API** (`generativelanguage.googleapis.com`) configured with a `GEMINI_API_KEY`. It does **not** currently use enterprise Google Cloud Vertex AI.
2. **Applicable Account Terms & Training Settings:**
   - **Google AI Studio Developer API (Paid Billing Account):** Under Google AI Studio terms where billing is enabled, prompts and generated completions are treated as confidential and are **not** used by Google to train or fine-tune public foundation models. Data in transit is encrypted via TLS.
   - **Google AI Studio Free / Unpaid Tier:** Free tier developer usage permits Google to log, store, and have human reviewers evaluate prompts and outputs for model improvements and safety training.
   - **Enterprise Vertex AI Contrast:** Commercial Google Cloud Vertex AI is an independent enterprise service offering distinct SLAs, HIPAA BAA eligibility, and customer-managed encryption keys. Psyco AI's current implementation does not utilize Vertex AI.
3. **Clinical Drafting Only:** Gemini processes structured text payloads to suggest draft SOAP notes. It has zero capability or authority to sign records or make diagnostic determinations.

### 5.2 AssemblyAI (Speech-to-Text Transcription)
1. **Actual Integrated Endpoint:** Psyco AI utilizes AssemblyAI **Streaming v3** (`wss://streaming.assemblyai.com/v3/ws`) via ephemeral session tokens generated through `https://streaming.assemblyai.com/v3/token`. It does **not** use AssemblyAI's asynchronous prerecorded file transcription API (`/v2/transcript`).
2. **Streaming Retention & Model Training Opt-Out:**
   - Vendor technical documentation indicates that AssemblyAI's Streaming API provides **zero audio and transcript retention** when the customer account has actively opted out of model training. Under this configuration, audio buffers are processed ephemerally in RAM and purged immediately upon connection termination, while retaining minimal connection metadata (such as timestamps, durations, and request IDs) for logging and billing.
   - The standard 30-day file retention window applicable to asynchronous prerecorded file transcription does **not** apply to the Streaming API.
3. **No Presumption of Opt-Out or Enterprise Addenda:** Psyco AI does **not** presume that account-level model-training opt-out is enabled, nor does it claim an executed enterprise Zero Data Retention (ZDR) addendum or Business Associate Agreement (BAA) without documentary legal proof.
4. **Mandatory Pilot Restriction:** **Real clinical audio from actual patients must NOT be transmitted or used during the staging pilot.** Only synthetic or simulated audio may be used until the exact processor configuration, account-level opt-out settings, and contractual enterprise addenda are formally executed and legally verified.

### 5.3 Technical Storage Invariant
- **Text/JSON-Only Database:** Permanent storage across Firebase Realtime Database consists exclusively of structured text and JSON metadata. No binary audio waveforms (.wav, .mp3, .m4a) are permanently stored on Psyco AI infrastructure.

---

## 6. Clinician Accountability

The licensed treating psychologist remains solely and unalienably responsible for all clinical notes, diagnoses, and care plans. The use of assistive AI does not diminish the practitioner's legal duty of care to the patient.
