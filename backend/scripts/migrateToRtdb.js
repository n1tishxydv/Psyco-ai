#!/usr/bin/env node
/**
 * Psyco AI - Safe RTDB Migration Utility
 * 
 * Safely inspects, validates, backs up, and idempotently migrates local snapshot
 * records into the configured Firebase Realtime Database.
 * 
 * Usage:
 *   node scripts/migrateToRtdb.js             # Dry-run analysis and integrity scan
 *   node scripts/migrateToRtdb.js --execute   # Idempotent live migration (requires credentials)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../src/config/index.js';
import { firebaseRtdbAdapter } from '../src/integrations/firebase/firebaseRtdbAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_FILE = path.resolve(__dirname, '../data/rtdb_snapshot.json');
const BACKUP_DIR = path.resolve(__dirname, '../data/backups');

async function runMigration() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');

  console.log('\n======================================================');
  console.log('       PSYCO AI — SAFE REALTIME DATABASE MIGRATION     ');
  console.log('======================================================');
  console.log(`Timestamp:        ${new Date().toISOString()}`);
  console.log(`Target Project:   ${config.firebase.projectId || 'NOT SET'}`);
  console.log(`Target RTDB URL:  ${config.firebase.databaseURL || 'NOT SET'}`);
  console.log(`Execution Mode:   ${isExecute ? 'LIVE EXECUTION' : 'DRY RUN (Analysis Only)'}`);
  console.log(`Service Account:  ${firebaseRtdbAdapter.hasServiceAccount() ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log('------------------------------------------------------\n');

  // Step 1: Target Verification
  if (!config.firebase.projectId || !config.firebase.databaseURL) {
    console.error('[FATAL] Missing FIREBASE_PROJECT_ID or FIREBASE_DATABASE_URL in configuration.');
    process.exit(1);
  }

  if (!config.firebase.databaseURL.includes('psyco-9c13d')) {
    console.warn(`[WARN] Configured RTDB URL (${config.firebase.databaseURL}) does not match expected project psyco-9c13d.`);
  }

  // Step 2: Read Local Snapshot
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    console.error(`[FATAL] Local snapshot file not found at: ${SNAPSHOT_FILE}`);
    process.exit(1);
  }

  const rawSnapshot = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
  let snapshotData;
  try {
    snapshotData = JSON.parse(rawSnapshot);
  } catch (err) {
    console.error('[FATAL] Failed to parse local snapshot JSON:', err.message);
    process.exit(1);
  }

  const keys = Object.keys(snapshotData);
  console.log(`Loaded ${keys.length} top-level/nested keys from local snapshot.`);

  // Step 3: Entity Classification & Integrity Scan
  const entityCounts = {};
  const binaryViolations = [];
  const malformedKeys = [];
  const syntheticRecords = [];

  for (const [key, value] of Object.entries(snapshotData)) {
    const rootEntity = key.split('/')[0];
    entityCounts[rootEntity] = (entityCounts[rootEntity] || 0) + 1;

    // Check Text-Only / Zero-Binary Invariant
    const serialized = JSON.stringify(value);
    if (
      /data:image\/[a-zA-Z]+;base64/i.test(serialized) ||
      /data:audio\/[a-zA-Z]+;base64/i.test(serialized) ||
      /data:video\/[a-zA-Z]+;base64/i.test(serialized) ||
      (serialized && serialized.length > 5 * 1024 * 1024)
    ) {
      binaryViolations.push(key);
    }

    // Check for malformed data
    if (value === null || value === undefined) {
      malformedKeys.push(key);
    }

    // Identify synthetic test fixtures
    if (
      key.includes('test_') ||
      key.includes('_p3_') ||
      key.includes('_p4_') ||
      key.includes('_p5_') ||
      key.includes('_pre8_') ||
      (typeof value === 'object' && value?.email?.includes('@test.'))
    ) {
      syntheticRecords.push(key);
    }
  }

  console.log('\nEntity Distribution:');
  console.table(
    Object.entries(entityCounts).map(([entity, count]) => ({
      Entity: entity,
      Records: count,
    }))
  );

  console.log(`Integrity Check:`);
  console.log(`  Binary/Oversized Violations: ${binaryViolations.length} ${binaryViolations.length === 0 ? '✓ (Clean: 100% Text/Structured JSON)' : '✗'}`);
  console.log(`  Malformed Null Nodes:        ${malformedKeys.length}`);
  console.log(`  Identified Synthetic Fixtures: ${syntheticRecords.length}`);

  if (binaryViolations.length > 0) {
    console.error('\n[POLICY VIOLATION] Binary payloads found in snapshot:');
    binaryViolations.forEach(k => console.error(`  - ${k}`));
    console.error('Migration aborted: Zero-binary persistence invariant violated.');
    process.exit(1);
  }

  // Step 4: Backup Local Snapshot
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const backupPath = path.join(BACKUP_DIR, `snapshot_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, rawSnapshot, 'utf8');
  console.log(`\nLocal Snapshot Backup Created:`);
  console.log(`  ${backupPath} (${(rawSnapshot.length / 1024).toFixed(1)} KB)`);

  // Step 5: Check Live Migration Prerequisites
  if (isExecute) {
    if (!firebaseRtdbAdapter.hasServiceAccount()) {
      console.error('\n[BLOCKED] Live cloud migration requires valid service account credentials:');
      console.error('  - FIREBASE_CLIENT_EMAIL');
      console.error('  - FIREBASE_PRIVATE_KEY');
      console.error('\nTo configure, please obtain the Firebase Service Account JSON from:');
      console.error('  Firebase Console -> Project Settings -> Service Accounts -> Generate new private key');
      console.error('and add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to backend/.env.');
      console.error('\nLocal snapshot remains fully preserved and functional.');
      process.exit(1);
    }

    console.log('\nAttempting Live Migration to Firebase Realtime Database...');
    let successCount = 0;
    let failCount = 0;

    for (const [key, value] of Object.entries(snapshotData)) {
      try {
        await firebaseRtdbAdapter.set(key, value);
        successCount++;
      } catch (err) {
        console.error(`Failed to migrate ${key}: ${err.message}`);
        failCount++;
      }
    }

    console.log(`\nLive Migration Finished:`);
    console.log(`  Successfully Migrated: ${successCount}`);
    console.log(`  Failed Records:       ${failCount}`);
  } else {
    console.log('\n[DRY RUN COMPLETE] Snapshot is fully validated and ready for cloud synchronization.');
    console.log('To execute live migration once service account credentials are added:');
    console.log('  node scripts/migrateToRtdb.js --execute\n');
  }
}

runMigration().catch((err) => {
  console.error('[FATAL MIGRATION ERROR]:', err);
  process.exit(1);
});
