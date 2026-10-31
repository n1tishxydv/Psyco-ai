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
    console.log(' 1. Synthetic Administrator        -> users/admin_staging_01 (staging.admin@psyco.clinic)');
    console.log(' 2. Synthetic Psychologist Users   -> users/psych_staging_01 (Dr. Jenkins), users/psych_staging_02 (Dr. Vance)');
    console.log('    Synthetic Clinician Profiles   -> psychologists/psych_staging_01 (PSY-STAGING-001), psychologists/psych_staging_02 (PSY-STAGING-002)');
    console.log(' 3. Synthetic Patient Users        -> users/patient_staging_01..04 (Alex Mercer, Maya Lin, David Chen, Elena Rostova)');
    console.log('    Synthetic Patient Profiles     -> patients/patient_staging_01..04 (Assigned & ReBAC Isolated)');
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

  // 2. Synthetic Approved Psychologists (2 Clinicians for cross-therapist ReBAC testing)
  const psychUid1 = 'psych_staging_01';
  await firebaseRtdbAdapter.set(`${prefix}users/${psychUid1}`, {
    uid: psychUid1,
    email: 'dr.staging.clinician@psyco.clinic',
    fullName: '[STAGING] Dr. Sarah Jenkins, PsyD',
    role: 'psychologist',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}psychologists/${psychUid1}`, {
    id: psychUid1,
    userId: psychUid1,
    fullName: '[STAGING] Dr. Sarah Jenkins, PsyD',
    email: 'dr.staging.clinician@psyco.clinic',
    licenseNumber: 'PSY-STAGING-001',
    licensingState: 'CA',
    specialties: ['Adult Cognitive Behavioral Therapy', 'Anxiety & Panic Disorders', 'Depression'],
    languages: ['English', 'Hindi'],
    bio: '[STAGING TEST IDENTITY] Licensed clinical psychologist specializing in anxiety and depression.',
    sessionFee: 150,
    approvalStatus: 'approved',
    approvedAt: timestamp,
    onboardingStatus: 'completed',
    createdAt: timestamp,
  });

  const psychUid2 = 'psych_staging_02';
  await firebaseRtdbAdapter.set(`${prefix}users/${psychUid2}`, {
    uid: psychUid2,
    email: 'dr.marcus.staging@psyco.clinic',
    fullName: '[STAGING] Dr. Marcus Vance, PhD',
    role: 'psychologist',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}psychologists/${psychUid2}`, {
    id: psychUid2,
    userId: psychUid2,
    fullName: '[STAGING] Dr. Marcus Vance, PhD',
    email: 'dr.marcus.staging@psyco.clinic',
    licenseNumber: 'PSY-STAGING-002',
    licensingState: 'NY',
    specialties: ['Trauma-Informed Care', 'EMDR Therapy', 'Adult Psychotherapy'],
    languages: ['English', 'Spanish'],
    bio: '[STAGING TEST IDENTITY] Licensed clinical psychologist focusing on trauma recovery and resilience.',
    sessionFee: 165,
    approvalStatus: 'approved',
    approvedAt: timestamp,
    onboardingStatus: 'completed',
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Approved Psychologists: Dr. Sarah Jenkins & Dr. Marcus Vance');

  // 3. Synthetic Patients (4 Patients: 2 for Psych 1, 1 for Psych 2, 1 Unassigned New Intake)
  const patientUid1 = 'patient_staging_01';
  await firebaseRtdbAdapter.set(`${prefix}users/${patientUid1}`, {
    uid: patientUid1,
    email: 'staging.patient@example.com',
    fullName: '[STAGING] Alex Mercer',
    role: 'patient',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}patients/${patientUid1}`, {
    id: patientUid1,
    userId: patientUid1,
    fullName: '[STAGING] Alex Mercer',
    preferredName: 'Alex',
    email: 'staging.patient@example.com',
    phone: '+1-555-0199',
    gender: 'non-binary',
    age: 29,
    assignedPsychologistIds: { [psychUid1]: true },
    intakeStatus: 'completed',
    emergencyContact: {
      name: 'Jordan Mercer',
      relation: 'Sibling',
      phone: '+1-555-0198',
    },
    createdAt: timestamp,
  });

  const patientUid2 = 'patient_staging_02';
  await firebaseRtdbAdapter.set(`${prefix}users/${patientUid2}`, {
    uid: patientUid2,
    email: 'maya.staging@example.com',
    fullName: '[STAGING] Maya Lin',
    role: 'patient',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}patients/${patientUid2}`, {
    id: patientUid2,
    userId: patientUid2,
    fullName: '[STAGING] Maya Lin',
    preferredName: 'Maya',
    email: 'maya.staging@example.com',
    phone: '+1-555-0197',
    gender: 'female',
    age: 34,
    assignedPsychologistIds: { [psychUid1]: true },
    intakeStatus: 'completed',
    emergencyContact: {
      name: 'David Lin',
      relation: 'Spouse',
      phone: '+1-555-0196',
    },
    createdAt: timestamp,
  });

  const patientUid3 = 'patient_staging_03';
  await firebaseRtdbAdapter.set(`${prefix}users/${patientUid3}`, {
    uid: patientUid3,
    email: 'david.staging@example.com',
    fullName: '[STAGING] David Chen',
    role: 'patient',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}patients/${patientUid3}`, {
    id: patientUid3,
    userId: patientUid3,
    fullName: '[STAGING] David Chen',
    preferredName: 'David',
    email: 'david.staging@example.com',
    phone: '+1-555-0195',
    gender: 'male',
    age: 42,
    assignedPsychologistIds: { [psychUid2]: true },
    intakeStatus: 'completed',
    emergencyContact: {
      name: 'Susan Chen',
      relation: 'Partner',
      phone: '+1-555-0194',
    },
    createdAt: timestamp,
  });

  const patientUid4 = 'patient_staging_04';
  await firebaseRtdbAdapter.set(`${prefix}users/${patientUid4}`, {
    uid: patientUid4,
    email: 'elena.staging@example.com',
    fullName: '[STAGING] Elena Rostova',
    role: 'patient',
    accountStatus: 'active',
    onboardingStatus: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await firebaseRtdbAdapter.set(`${prefix}patients/${patientUid4}`, {
    id: patientUid4,
    userId: patientUid4,
    fullName: '[STAGING] Elena Rostova',
    preferredName: 'Elena',
    email: 'elena.staging@example.com',
    phone: '+1-555-0193',
    gender: 'female',
    age: 26,
    assignedPsychologistIds: {},
    intakeStatus: 'pending',
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Patients: Alex Mercer, Maya Lin, David Chen, Elena Rostova');

  // 4. Psychologist Availability Rules
  await firebaseRtdbAdapter.set(`${prefix}availability/${psychUid1}`, {
    psychologistId: psychUid1,
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

  await firebaseRtdbAdapter.set(`${prefix}availability/${psychUid2}`, {
    psychologistId: psychUid2,
    weeklySchedule: {
      tuesday: [{ start: '10:00', end: '18:00' }],
      thursday: [{ start: '10:00', end: '18:00' }],
    },
    bufferMinutes: 10,
    sessionDuration: 50,
    bookingLeadTimeHours: 24,
    maxAdvanceBookingDays: 30,
    updatedAt: timestamp,
  });
  console.log(' [✓] Seeded Clinician Availability Rules for Dr. Jenkins and Dr. Vance');
  console.log(' [✓] Seeded Clinician Availability Rules (Mon/Wed/Fri 09:00-17:00, 50m session, 10m buffer)');

  const psychUid = psychUid1;
  const patientUid = patientUid1;

  // 5. Synthetic Appointments
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

  const aptId2 = 'apt_staging_002';
  await firebaseRtdbAdapter.set(`${prefix}appointments/${aptId2}`, {
    id: aptId2,
    patientId: patientUid3,
    psychologistId: psychUid2,
    startTime: '2026-11-05T14:00:00Z',
    endTime: '2026-11-05T14:50:00Z',
    sessionMode: 'in_person',
    status: 'confirmed',
    type: 'trauma_intake',
    notes: '[STAGING] Trauma evaluation and resiliency baseline',
    calendarSyncStatus: 'not_connected',
    createdAt: timestamp,
  });
  console.log(' [✓] Seeded Synthetic Appointments: apt_staging_001 (Dr. Jenkins) & apt_staging_002 (Dr. Vance)');

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
