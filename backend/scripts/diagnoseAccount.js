#!/usr/bin/env node
/**
 * Psyco AI - Safe Account & Authorization Diagnostic Tool (Operator Only)
 * 
 * Usage:
 *   node scripts/diagnoseAccount.js --uid <firebase_uid>
 *   node scripts/diagnoseAccount.js --email <user_email>
 */

import 'dotenv/config';
import { firebaseRtdbAdapter } from '../src/integrations/firebase/firebaseRtdbAdapter.js';
import { firebaseAuthAdapter } from '../src/integrations/firebase/firebaseAuthAdapter.js';
import config from '../src/config/index.js';

async function runDiagnostic() {
  const args = process.argv.slice(2);
  let targetUid = null;
  let targetEmail = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--uid' && args[i + 1]) {
      targetUid = args[i + 1];
    } else if (args[i] === '--email' && args[i + 1]) {
      targetEmail = args[i + 1];
    }
  }

  console.log('\n=== PSYCO AI ACCOUNT & AUTHORIZATION DIAGNOSTIC ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Configured Firebase Project: ${config.firebase.projectId || 'NOT SET'}`);
  console.log(`Configured RTDB URL: ${config.firebase.databaseURL || 'NOT SET'}`);
  console.log(`Auth Service Status: ${firebaseAuthAdapter.getStatus().status}`);
  console.log('===================================================\n');

  if (!targetUid && !targetEmail) {
    console.log('Listing known user accounts in database snapshot:\n');
    const usersMap = await firebaseRtdbAdapter.get('users') || {};
    const uids = Object.keys(usersMap);
    if (uids.length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(
        uids.map((uid) => {
          const u = usersMap[uid] || {};
          return {
            UID: uid.substring(0, 12) + '...',
            Email: u.email || 'N/A',
            Role: u.role || 'unassigned',
            Status: u.accountStatus || 'active',
            Onboarding: u.onboardingStatus || 'pending',
          };
        })
      );
    }
    console.log('\nTo diagnose a specific account:');
    console.log('  node scripts/diagnoseAccount.js --uid <uid>');
    console.log('  node scripts/diagnoseAccount.js --email <email>\n');
    return;
  }

  let resolvedUid = targetUid;
  if (!resolvedUid && targetEmail) {
    const usersMap = await firebaseRtdbAdapter.get('users') || {};
    for (const [uid, user] of Object.entries(usersMap)) {
      if (user?.email?.toLowerCase() === targetEmail.toLowerCase()) {
        resolvedUid = uid;
        break;
      }
    }
  }

  if (!resolvedUid) {
    console.error(`[ERROR] No user found with identifier: ${targetUid || targetEmail}`);
    process.exit(1);
  }

  console.log(`Diagnosing User UID: ${resolvedUid}`);

  const [userProfile, psychProfile, patientProfile] = await Promise.all([
    firebaseRtdbAdapter.get(`users/${resolvedUid}`),
    firebaseRtdbAdapter.get(`psychologists/${resolvedUid}`),
    firebaseRtdbAdapter.get(`patients/${resolvedUid}`),
  ]);

  console.log('\n--- Canonical User Profile (/users/{uid}) ---');
  if (userProfile) {
    console.log(`  Email:            ${userProfile.email || 'N/A'}`);
    console.log(`  Full Name:        ${userProfile.fullName || 'N/A'}`);
    console.log(`  Role:             ${userProfile.role || 'unassigned'}`);
    console.log(`  Account Status:   ${userProfile.accountStatus || 'active'}`);
    console.log(`  Onboarding:       ${userProfile.onboardingStatus || 'pending'}`);
    console.log(`  Created At:       ${userProfile.createdAt || 'N/A'}`);
  } else {
    console.log('  [WARN] No record found in /users/{uid}!');
  }

  console.log('\n--- Role-Specific Profile Details ---');
  if (psychProfile) {
    console.log('  [Psychologist Profile Found]');
    console.log(`    Title/Specialty:   ${psychProfile.title || psychProfile.specialty || 'General'}`);
    console.log(`    Approval Status:   ${psychProfile.approvalStatus || 'pending'}`);
    console.log(`    License State:     ${psychProfile.licenseState || 'N/A'}`);
    console.log(`    Can Access Dash:   ${psychProfile.approvalStatus === 'approved' ? 'YES' : 'NO (Approval Pending)'}`);
  } else if (patientProfile) {
    console.log('  [Patient Profile Found]');
    console.log(`    Intake Complete:   ${Boolean(patientProfile.intakeCompleted)}`);
    console.log(`    Assigned Clinician: ${patientProfile.assignedPsychologistId || 'None'}`);
  } else {
    console.log('  No specialized profile record in /psychologists or /patients.');
  }

  console.log('\n--- Route Guard Authorization Matrix ---');
  const role = userProfile?.role;
  console.log(`  /patient/* routes:       ${role === 'patient' ? 'AUTHORIZED' : 'DENIED (403)'}`);
  console.log(`  /psychologist/* routes:  ${role === 'psychologist' && (!psychProfile || psychProfile.approvalStatus === 'approved') ? 'AUTHORIZED' : 'DENIED (Role/Approval mismatch)'}`);
  console.log(`  /admin/* routes:         ${role === 'admin' ? 'AUTHORIZED' : 'DENIED (403)'}`);

  console.log('\n=== DIAGNOSTIC COMPLETE ===\n');
}

runDiagnostic().catch((err) => {
  console.error('[FATAL DIAGNOSTIC ERROR]:', err);
  process.exit(1);
});
