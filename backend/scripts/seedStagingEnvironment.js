/**
 * PSYCO AI — STAGING ENVIRONMENT SYNTHETIC SEEDING UTILITY
 * 
 * Safely provisions isolated, synthetic testing data for Staging UAT.
 * INVARIANT: Never run against production databases with real patient data.
 */

import config from '../src/config/index.js';
import { firebaseRtdbAdapter } from '../src/integrations/firebase/firebaseRtdbAdapter.js';
import { logger } from '../src/utils/logger.js';

const PRODUCTION_PROJECT_IDS = ['psyco-9c13d'];
const PRODUCTION_DB_URLS = ['https://psyco-9c13d-default-rtdb.firebaseio.com'];

export async function seedStagingEnvironment(options = {}) {
  const isDryRun = Boolean(options.dryRun || process.argv.includes('--dry-run'));
  const currentProjectId = config.firebase.projectId;
  const currentDbUrl = config.firebase.databaseURL;

  console.log('================================================================');
  console.log('PSYCO AI — STAGING SYNTHETIC DATA SEEDING UTILITY');
  console.log('================================================================');
  console.log(`Execution Mode:            ${isDryRun ? 'DRY-RUN (NO WRITES)' : 'LIVE SEEDING'}`);
  console.log(`Target Firebase Project ID: ${currentProjectId || '[MISSING]'}`);
  console.log(`Target Database URL:       ${currentDbUrl || '[MISSING]'}`);
  console.log(`Runtime Environment:       ${config.env}`);

  // Safety Assertion 1: Fail closed if target project or database URL is missing
  if (!currentProjectId || !currentDbUrl) {
    console.error('\n[ABORTED] SAFETY VIOLATION DETECTED:');
    console.error('Target Firebase Project ID or Database URL is not established.');
    throw new Error('Refusing to seed: Missing target project or database URL.');
  }

  // Safety Assertion 2: Explicitly reject production targets
  const isProductionTarget = PRODUCTION_PROJECT_IDS.includes(currentProjectId) ||
                             PRODUCTION_DB_URLS.some(url => currentDbUrl.includes(url));

  if (isProductionTarget && !options.allowSubpathTest) {
    console.error('\n[ABORTED] SAFETY VIOLATION DETECTED:');
    console.error('The active configuration points to the primary/production database:');
    console.error(` -> Project: ${currentProjectId}`);
    console.error(` -> DB URL:  ${currentDbUrl}`);
    console.error('To run staging seeding, configure a dedicated staging RTDB instance');
    console.error('(e.g., https://psyco-ai-staging-default-rtdb.firebaseio.com) or pass --allow-subpath-test for non-destructive test.\n');
    throw new Error('Refusing to seed synthetic staging data into primary/production database.');
  }

  const prefix = options.allowSubpathTest ? 'stagingTestFixture/' : '';
  const timestamp = new Date().toISOString();

  if (isDryRun) {
    console.log('\n[DRY RUN] Simulating planned synthetic staging fixtures:');
    console.log(' 1. Synthetic Administrator        -> users/admin_staging_01');
    console.log(' 2. Synthetic Psychologist User    -> users/psych_staging_01');
    console.log('    Synthetic Clinician Profile    -> psychologists/psych_staging_01 (PSY-STAGING-001, Approved)');
    console.log(' 3. Synthetic Patient User         -> users/patient_staging_01');
    console.log('    Synthetic Patient Profile      -> patients/patient_staging_01 (Alex Mercer, age 29)');
    console.log(' 4. Clinician Availability         -> availability/psych_staging_01 (Mon/Wed/Fri 09:00-17:00)');
    console.log(' 5. Synthetic Appointment          -> appointments/apt_staging_001 (Confirmed)');
    console.log(' 6. Clinical Session Record        -> sessionRecords/ses_staging_001 (In Progress)');
    console.log(' 7. SOAP Clinical Note Draft       -> sessionNotes/not_staging_001 (Status: draft, Format: SOAP)');
    console.log(' 8. Clinical Treatment Plan        -> treatmentPlans/tp_staging_001 (Generalized Anxiety Features)');
    console.log(' 9. PHQ-9 Screener Assignment      -> assessmentAssignments/asg_staging_001');
    console.log('    PHQ-9 Screener Result          -> assessmentResults/res_staging_001 (Score: 7, Mild)');
    console.log(' 10. Risk Review Flag              -> riskReviewFlags/flg_staging_001 (Category: stress_overload, Reviewed)');
    console.log(' 11. Public Submissions            -> contactSubmissions/cnt_staging_001, faqSubmissions/faq_sub_staging_001');
    console.log('\n[DRY RUN COMPLETE] 11 synthetic entities validated. 0 records written.');
    return { success: true, dryRun: true, count: 11, timestamp };
  }

  console.log(`\nSeeding synthetic entities under prefix: "${prefix || 'root'}"...`);

  // 1. Synthetic Administrator
  const adminUid = 'admin_staging_01';
  await firebaseRtdbAdapter.set(`${prefix}users/${adminUid}`, {
    uid: adminUid,
    email: 'staging.admin@psyco.clinic',
    fullName: '[STAGING] Administrator Quality Assurance',
    role: 'admin',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Admin: staging.admin@psyco.clinic');

  // 2. Synthetic Approved Psychologist
  const psychUid = 'psych_staging_01';
  await firebaseRtdbAdapter.set(`${prefix}users/${psychUid}`, {
    uid: psychUid,
    email: 'dr.staging.clinician@psyco.clinic',
    fullName: '[STAGING] Dr. Sarah Jenkins, PsyD',
    role: 'psychologist',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}psychologists/${psychUid}`, {
    id: psychUid,
    userId: psychUid,
    fullName: '[STAGING] Dr. Sarah Jenkins, PsyD',
    email: 'dr.staging.clinician@psyco.clinic',
    licenseNumber: 'PSY-STAGING-001',
    licensingState: 'CA',
    specialties: ['Adult Cognitive Behavioral Therapy', 'Anxiety & Panic Disorders', 'Depression'],
    languages: ['English', 'Hindi'],
    bio: '[STAGING TEST IDENTITY] Licensed clinical psychologist practicing evidence-based psychotherapy.',
    sessionFee: 150,
    approvalStatus: 'approved',
    approvedAt: timestamp,
    onboardingStatus: 'completed',
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Approved Psychologist: dr.staging.clinician@psyco.clinic');

  // 3. Synthetic Patient
  const patientUid = 'patient_staging_01';
  await firebaseRtdbAdapter.set(`${prefix}users/${patientUid}`, {
    uid: patientUid,
    email: 'staging.patient@example.com',
    fullName: '[STAGING] Alex Mercer',
    role: 'patient',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}patients/${patientUid}`, {
    id: patientUid,
    userId: patientUid,
    fullName: '[STAGING] Alex Mercer',
    preferredName: 'Alex',
    email: 'staging.patient@example.com',
    phone: '+1-555-0199',
    gender: 'non-binary',
    age: 29,
    assignedPsychologistIds: { [psychUid]: true },
    intakeStatus: 'completed',
    emergencyContact: {
      name: 'Jordan Mercer',
      relation: 'Sibling',
      phone: '+1-555-0198',
    },
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Patient: staging.patient@example.com');

  // 4. Psychologist Availability Rules
  await firebaseRtdbAdapter.set(`${prefix}availability/${psychUid}`, {
    psychologistId: psychUid,
    weeklySchedule: {
      monday: [{ start: '09:00', end: '17:00' }],
      wednesday: [{ start: '09:00', end: '17:00' }],
      friday: [{ start: '09:00', end: '17:00' }],
    },
    bufferMinutes: 10,
    sessionDuration: 50,
    bookingLeadTimeHours: 24,
    maxAdvanceBookingDays: 30,
    updatedAt: timestamp,
  });
  console.log(' [✓] Seeded Clinician Availability Rules (Mon/Wed/Fri 09:00-17:00, 50m session, 10m buffer)');

  // 5. Synthetic Appointment
  const aptId = 'apt_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}appointments/${aptId}`, {
    id: aptId,
    patientId: patientUid,
    psychologistId: psychUid,
    startTime: '2026-11-04T10:00:00Z',
    endTime: '2026-11-04T10:50:00Z',
    sessionMode: 'online',
    status: 'confirmed',
    type: 'individual_therapy',
    notes: '[STAGING] Initial cognitive restructuring consultation',
    calendarSyncStatus: 'not_connected',
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Appointment: apt_staging_001');

  // 6. Synthetic Clinical Session Record
  const sessionId = 'ses_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}sessionRecords/${sessionId}`, {
    id: sessionId,
    appointmentId: aptId,
    patientId: patientUid,
    psychologistId: psychUid,
    status: 'in_progress',
    startTime: '2026-11-04T10:00:00Z',
    durationMinutes: 50,
    type: 'individual_therapy',
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Session Record: ses_staging_001');

  // 7. Synthetic Clinical Note (SOAP Draft)
  const noteId = 'not_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}sessionNotes/${noteId}`, {
    id: noteId,
    sessionId: sessionId,
    patientId: patientUid,
    psychologistId: psychUid,
    format: 'SOAP',
    status: 'draft',
    content: {
      subjective: '[STAGING] Patient reports moderate work-related performance anxiety and difficulty initiating sleep.',
      objective: 'Alert, cooperative, speech rate normal, affect anxious but engaged.',
      assessment: 'Generalized anxiety symptoms with situational insomnia. Responsive to psychoeducation.',
      plan: '1. Introduce diaphragmatic breathing.\n2. Implement 30-min bedtime wind-down routine.\n3. Complete PHQ-9 screener.',
    },
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic SOAP Clinical Note: not_staging_001');

  // 8. Synthetic Treatment Plan
  const planId = 'tp_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}treatmentPlans/${planId}`, {
    id: planId,
    patientId: patientUid,
    psychologistId: psychUid,
    status: 'active',
    diagnosisDescription: '[STAGING] Generalized Anxiety Features (Preliminary Evaluation)',
    targetProblems: ['Performance anxiety in professional meetings', 'Sleep-onset insomnia'],
    goals: [
      {
        id: 'goal_1',
        description: 'Reduce subjective anxiety intensity from 7/10 to 3/10 during presentations.',
        targetDate: '2026-12-15',
        status: 'in_progress',
      },
    ],
    interventions: ['Cognitive reframing of catastrophic thoughts', 'Progressive muscle relaxation'],
    sharedWithPatient: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Treatment Plan: tp_staging_001');

  // 9. Synthetic Assessment Assignment & Results (PHQ-9)
  const asgId = 'asg_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}assessmentAssignments/${asgId}`, {
    id: asgId,
    patientId: patientUid,
    psychologistId: psychUid,
    instrumentId: 'phq-9',
    status: 'completed',
    instructions: 'Please complete the standard 9-item symptom questionnaire.',
    assignedAt: timestamp,
    completedAt: timestamp,
  });

  const resId = 'res_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}assessmentResults/${resId}`, {
    id: resId,
    assignmentId: asgId,
    patientId: patientUid,
    psychologistId: psychUid,
    instrumentId: 'phq-9',
    totalScore: 7,
    severityCategory: 'Mild Depression',
    questionResponses: {
      phq9_1: 1, phq9_2: 1, phq9_3: 1, phq9_4: 1,
      phq9_5: 1, phq9_6: 1, phq9_7: 1, phq9_8: 0, phq9_9: 0,
    },
    criticalSafetyTriggered: false,
    completedAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic PHQ-9 Screener Assignment & Result (Score: 7, Mild)');

  // 10. Synthetic Risk-Review Flag (Acknowledged)
  const flagId = 'flg_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}riskReviewFlags/${flagId}`, {
    id: flagId,
    sessionId: sessionId,
    patientId: patientUid,
    psychologistId: psychUid,
    category: 'stress_overload',
    severity: 'low',
    reviewStatus: 'reviewed',
    clinicalAction: 'Psychoeducation on boundary management provided.',
    reviewedBy: psychUid,
    reviewedAt: timestamp,
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Risk Flag: flg_staging_001');

  // 11. Synthetic Public Submissions
  const cntId = 'cnt_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}contactSubmissions/${cntId}`, {
    id: cntId,
    name: '[STAGING] Synthetic Prospective Patient',
    email: 'prospective@example.com',
    subject: 'Inquiry regarding adolescent therapy openings',
    message: 'Testing public inquiry routing and moderation in staging environment.',
    status: 'new',
    createdAt: timestamp,
  });

  const faqId = 'faq_sub_staging_001';
  await firebaseRtdbAdapter.set(`${prefix}faqSubmissions/${faqId}`, {
    id: faqId,
    question: '[STAGING] How does insurance reimbursement work for telehealth sessions?',
    category: 'Billing',
    submittedBy: 'Synthetic User',
    status: 'pending_moderation',
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Public Contact & FAQ Submissions');

  console.log('\n>>> STAGING SYNTHETIC DATA SEEDING COMPLETE <<<\n');
  return { success: true, count: 11, timestamp };
}

// CLI Execution check
if (process.argv[1] && process.argv[1].endsWith('seedStagingEnvironment.js')) {
  const allowSubpath = process.argv.includes('--allow-subpath-test');
  const dryRun = process.argv.includes('--dry-run');
  seedStagingEnvironment({ allowSubpathTest: allowSubpath, dryRun })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seeding halted:', err.message);
      process.exit(1);
    });
}
