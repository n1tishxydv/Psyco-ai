#!/usr/bin/env node
/**
 * Psyco AI - Safe Administrator Provisioning Utility (Operator Only)
 * 
 * Usage:
 *   node scripts/provisionAdmin.js --uid <uid> --confirm
 *   node scripts/provisionAdmin.js --email <email> --confirm
 */

import 'dotenv/config';
import { firebaseRtdbAdapter } from '../src/integrations/firebase/firebaseRtdbAdapter.js';
import config from '../src/config/index.js';

async function provisionAdmin() {
  const args = process.argv.slice(2);
  let targetUid = null;
  let targetEmail = null;
  const isConfirmed = args.includes('--confirm');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--uid' && args[i + 1]) {
      targetUid = args[i + 1];
    } else if (args[i] === '--email' && args[i + 1]) {
      targetEmail = args[i + 1];
    }
  }

  console.log('\n=== PSYCO AI SAFE ADMINISTRATOR PROVISIONING ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Project:   ${config.firebase.projectId}`);

  if (!targetUid && !targetEmail) {
    console.error('[ERROR] Please specify target account with --uid <uid> or --email <email>.');
    console.log('Example: node scripts/provisionAdmin.js --email admin@psyco.clinic --confirm\n');
    process.exit(1);
  }

  let resolvedUid = targetUid;
  let existingRecord = null;

  if (targetEmail) {
    const usersMap = (await firebaseRtdbAdapter.get('users')) || {};
    for (const [uid, user] of Object.entries(usersMap)) {
      if (user?.email?.toLowerCase() === targetEmail.toLowerCase()) {
        resolvedUid = uid;
        existingRecord = user;
        break;
      }
    }
  } else if (targetUid) {
    existingRecord = await firebaseRtdbAdapter.get(`users/${targetUid}`);
  }

  if (!resolvedUid || !existingRecord) {
    console.error(`[ERROR] User not found in database for identifier: ${targetUid || targetEmail}`);
    process.exit(1);
  }

  console.log(`\nFound Account:`);
  console.log(`  UID:          ${resolvedUid}`);
  console.log(`  Email:        ${existingRecord.email || 'N/A'}`);
  console.log(`  Full Name:    ${existingRecord.fullName || 'N/A'}`);
  console.log(`  Current Role: ${existingRecord.role || 'unassigned'}`);

  if (existingRecord.role === 'admin') {
    console.log('\n[IDEMPOTENT] This account already has the admin role. No changes required.\n');
    return;
  }

  if (!isConfirmed) {
    console.warn('\n[DRY RUN / SAFEGUARD]');
    console.warn('To perform this privileged role promotion, re-run with the --confirm flag:');
    console.warn(`  node scripts/provisionAdmin.js --uid ${resolvedUid} --confirm\n`);
    return;
  }

  // Preserve all existing fields and update role
  const updatedRecord = {
    ...existingRecord,
    role: 'admin',
    updatedAt: new Date().toISOString(),
  };

  await firebaseRtdbAdapter.set(`users/${resolvedUid}`, updatedRecord);

  console.log('\n[SUCCESS] Account successfully provisioned as Administrator!');
  console.log(`  UID:       ${resolvedUid}`);
  console.log(`  New Role:  ${updatedRecord.role}`);
  console.log(`  Updated:   ${updatedRecord.updatedAt}\n`);
}

provisionAdmin().catch((err) => {
  console.error('[FATAL PROVISIONING ERROR]:', err);
  process.exit(1);
});
