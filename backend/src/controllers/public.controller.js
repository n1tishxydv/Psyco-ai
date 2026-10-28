import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

// Curated initial product FAQ entries
const INITIAL_CURATED_FAQS = [
  {
    id: 'faq_01',
    category: 'Product Overview',
    question: 'What is Psyco AI?',
    answer: 'Psyco AI is a dedicated mental health practice-management platform designed for clinical psychologists, therapists, and their patients. It centralizes appointment scheduling, patient intake, structured clinical notes, and treatment plans in a calm, accessible workspace.',
  },
  {
    id: 'faq_02',
    category: 'Target Audience',
    question: 'Who is Psyco AI designed for?',
    answer: 'The platform serves three distinct roles: (1) Patients seeking streamlined provider discovery and appointment management, (2) Psychologists running independent practices or clinics, and (3) Practice administrators managing provider verification and system health.',
  },
  {
    id: 'faq_03',
    category: 'Session Modes',
    question: 'Which consultation modes are supported?',
    answer: 'In-person consultation is the primary and default session mode, tailored to traditional clinical psychology practices. Online consultations via Google Meet video links are seamlessly supported when chosen by the psychologist or patient.',
  },
  {
    id: 'faq_04',
    category: 'Privacy & Storage',
    question: 'Does Psyco AI store permanent audio recordings of therapy sessions?',
    answer: 'No. Psyco AI enforces a strict zero-binary-media policy. Session audio for future transcription features will be processed transiently in memory to extract text, and the audio buffer is wiped immediately. No audio files or raw voice recordings are stored.',
  },
  {
    id: 'faq_05',
    category: 'Clinical AI Ethics',
    question: 'Does AI replace the psychologist or diagnose patients autonomously?',
    answer: 'Never. All AI capabilities operate under a strict Human-in-the-Loop paradigm. Gemini produces draft notes that must be reviewed, edited, and digitally signed by the licensed psychologist before becoming part of the patient record.',
  },
  {
    id: 'faq_06',
    category: 'Access & Governance',
    question: 'Can an administrator access confidential patient therapy notes?',
    answer: 'No. The platform architecture employs Relationship-Based Access Control (ReBAC). Administrators manage accounts and verifications, but are explicitly barred from viewing confidential clinical notes, transcripts, or treatment plans.',
  },
  {
    id: 'faq_07',
    category: 'Roadmap',
    question: 'Which capabilities are being introduced in later phases?',
    answer: 'Phase 2 introduces Firebase Authentication and Clinical Patient Intake. Phase 3 adds Availability & Calendar sync. Phase 4 provides the Clinical Notes workspace. Phase 5 adds Ambient Transcription, and Phase 6 introduces the Gemini Clinical Copilot.',
  },
];

/**
 * GET /api/v1/public/faqs
 * Retrieves published FAQ items
 */
export async function getPublishedFaqs(req, res, next) {
  try {
    const isDbConfigured = firebaseRtdbAdapter.isConfigured();

    if (isDbConfigured) {
      // In live environment with Firebase RTDB, query /faqs node where published == true
      const dbFaqs = await firebaseRtdbAdapter.get('faqs');
      if (dbFaqs && typeof dbFaqs === 'object') {
        const publishedList = Object.entries(dbFaqs)
          .map(([id, item]) => ({ id, ...item }))
          .filter((item) => item.status === 'published' || item.published === true);

        if (publishedList.length >= 5) {
          return successResponse(res, {
            faqs: publishedList,
            source: 'firebase_rtdb',
            databaseConfigured: true,
          });
        } else if (publishedList.length > 0) {
          const existingIds = new Set(publishedList.map(f => f.id));
          const combined = [...publishedList, ...INITIAL_CURATED_FAQS.filter(f => !existingIds.has(f.id))];
          return successResponse(res, {
            faqs: combined,
            source: 'firebase_rtdb_curated_hybrid',
            databaseConfigured: true,
          });
        }
      }
    }

    // Curated initial fallback
    return successResponse(res, {
      faqs: INITIAL_CURATED_FAQS,
      source: 'curated_initial_content',
      databaseConfigured: isDbConfigured,
      note: isDbConfigured
        ? 'Using baseline curated FAQs (no custom published entries found in RTDB).'
        : 'Firebase Realtime Database is unconfigured in development. Displaying baseline curated product FAQs.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/public/contact
 * Receives public contact inquiries
 */
export async function submitContact(req, res, next) {
  try {
    const { name, email, subject, message, hp_website } = req.body;

    // Check honeypot field
    if (hp_website) {
      logger.warn('Spam submission detected and dropped via honeypot.');
      return successResponse(res, { message: 'Inquiry received.' }, 200);
    }

    const submissionId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const submissionRecord = {
      id: submissionId,
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
      status: 'new',
      ipAddress: req.ip || 'unknown',
    };

    // Log operational metadata only (strictly avoid logging full message body or PII)
    logger.info(`Public Contact Submission: [${submissionId}] from email domain: ${email.split('@')[1] || 'unknown'}`);

    if (!firebaseRtdbAdapter.isConfigured()) {
      return errorResponse(
        res,
        'The contact submission service is currently offline because the database is not configured. Please contact support directly or configure Firebase credentials in backend/.env.',
        503,
        'DATABASE_UNCONFIGURED',
        {
          retryable: true,
          databaseConfigured: false,
        }
      );
    }

    // Persist to Firebase Realtime Database
    await firebaseRtdbAdapter.set(`contactSubmissions/${submissionId}`, submissionRecord);

    return successResponse(
      res,
      {
        message: 'Your inquiry has been received. Our clinical support team will review it shortly.',
        submissionId,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/public/faq-submissions
 * Allows visitors to suggest or ask questions
 */
export async function submitFaqQuestion(req, res, next) {
  try {
    const { question, name, email, hp_website } = req.body;

    // Honeypot check
    if (hp_website) {
      logger.warn('FAQ question dropped via honeypot.');
      return successResponse(res, { message: 'Question received.' }, 200);
    }

    const submissionId = `faq_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const submissionRecord = {
      id: submissionId,
      question,
      name: name || null,
      email: email || null,
      createdAt: new Date().toISOString(),
      status: 'pending_review', // Strict invariant: cannot be self-published
      ipAddress: req.ip || 'unknown',
    };

    logger.info(`Public FAQ Question Submitted: [${submissionId}]`);

    if (!firebaseRtdbAdapter.isConfigured()) {
      return errorResponse(
        res,
        'FAQ question submission is currently unavailable because the database is not configured. Please configure Firebase credentials in backend/.env.',
        503,
        'DATABASE_UNCONFIGURED',
        {
          retryable: true,
          databaseConfigured: false,
        }
      );
    }

    await firebaseRtdbAdapter.set(`faqSubmissions/${submissionId}`, submissionRecord);

    return successResponse(
      res,
      {
        message: 'Thank you! Your question has been submitted for editorial review and will be considered for our FAQ section.',
        submissionId,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}
