/**
 * PSYCO AI — STAGING-ONLY DATABASE RECOVERY SCRIPT
 * 
 * Strict Disaster Recovery utility for the Staging environment.
 * 
 * SAFETY INVARIANTS:
 * 1. Strictly rejects production project 'psyco-9c13d'.
 * 2. Requires explicit '--staging-only' command-line assertion.
 * 3. Requires explicit confirmation flag '--confirm-staging-restore'.
 * 4. Takes an immutable pre-restoration backup snapshot before modifying staging data.
 * 5. Strictly validates backup payload against the Zero-Binary Media Invariant.
 * 6. Never logs passwords, tokens, or credentials.
 * 
 * USAGE (Staging Only):
 * node --env-file=.env.staging scripts/restoreStagingBackup.js \
 *   --staging-only \
 *   --confirm-staging-restore \
 *   --backup-file=path/to/backup.json
 */

import fs from 'fs';
import path from 'path';
import config from '../src/config/index.js';
import { firebaseRtdbAdapter } from '../src/integrations/firebase/firebaseRtdbAdapter.js';
import { logger } from '../src/utils/logger.js';

const PRODUCTION_PROJECT_IDS = ['psyco-9c13d'];
const PRODUCTION_DB_URLS = ['https://psyco-9c13d-default-rtdb.firebaseio.com'];

export async function restoreStagingBackup(options = {}) {
  const currentProjectId = config.firebase.projectId;
  const currentDbUrl = config.firebase.databaseURL;
  const isDryRun = Boolean(options.dryRun || process.argv.includes('--dry-run'));
  const isStagingOnly = Boolean(options.stagingOnly || process.argv.includes('--staging-only'));
  const isConfirmed = Boolean(options.confirm || process.argv.includes('--confirm-staging-restore'));
  const backupFilePath = options.backupFile || process.argv.find(arg => arg.startsWith('--backup-file='))?.split('=')[1];

  console.log('================================================================');
  console.log('PSYCO AI — STAGING-ONLY DATABASE RESTORATION UTILITY');
  console.log('================================================================');
  console.log(`Target Project:     ${currentProjectId || '[MISSING]'}`);
  console.log(`Database URL:       ${currentDbUrl || '[MISSING]'}`);
  console.log(`Execution Mode:     ${isDryRun ? 'DRY-RUN (VALIDATION ONLY)' : 'LIVE RESTORE'}`);
  console.log(`Backup Source:      ${backupFilePath || '[MISSING]'}`);
  console.log(`Staging Flag:       ${isStagingOnly ? 'YES' : 'NO'}`);
  console.log(`Confirmation Flag:  ${isConfirmed ? 'YES' : 'NO'}`);

  // Safeguard 1: Reject missing configuration
  if (!currentProjectId || !currentDbUrl) {
    throw new Error('RECOVERY ABORTED: Missing target Firebase project ID or Database URL.');
  }

  // Safeguard 2: Explicitly reject production project & URLs
  const isProductionTarget = PRODUCTION_PROJECT_IDS.includes(currentProjectId) ||
                             PRODUCTION_DB_URLS.some(url => currentDbUrl.includes(url));

  if (isProductionTarget) {
    console.error('\n[CRITICAL SAFETY VIOLATION DETECTED]');
    console.error('Target configuration points to the PRODUCTION project or database URL.');
    console.error(` -> Project ID: ${currentProjectId}`);
    console.error(` -> DB URL:     ${currentDbUrl}`);
    console.error('This recovery utility is strictly barred from executing against production.\n');
    throw new Error('Refusing to restore backup: Production environment detected.');
  }

  // Safeguard 3: Require explicit --staging-only flag
  if (!isStagingOnly) {
    throw new Error('RECOVERY ABORTED: The --staging-only flag is required to prevent accidental invocation.');
  }

  // Safeguard 4: Require explicit operator confirmation flag
  if (!isConfirmed && !isDryRun) {
    throw new Error('RECOVERY ABORTED: Explicit confirmation required. Pass --confirm-staging-restore to proceed.');
  }

  // Safeguard 5: Validate backup file existence and format
  if (!backupFilePath) {
    throw new Error('RECOVERY ABORTED: Missing backup file path. Pass --backup-file=<path_to_json>');
  }

  const resolvedPath = path.resolve(process.cwd(), backupFilePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`RECOVERY ABORTED: Backup file not found at: ${resolvedPath}`);
  }

  let backupData;
  try {
    const rawContent = fs.readFileSync(resolvedPath, 'utf8');
    backupData = JSON.parse(rawContent);
  } catch (err) {
    throw new Error(`RECOVERY ABORTED: Invalid JSON file: ${err.message}`);
  }

  if (!backupData || typeof backupData !== 'object' || Array.isArray(backupData)) {
    throw new Error('RECOVERY ABORTED: Backup JSON root must be a dictionary of collections.');
  }

  // Safeguard 6: Enforce Zero-Binary Media Invariant on backup payload
  console.log('\nValidating backup data against clinical zero-binary invariant...');
  firebaseRtdbAdapter.assertValidPayload(backupData);
  console.log(' [✓] Backup validated: Zero binary media detected, schema clean.');

  const collectionKeys = Object.keys(backupData);
  console.log(`Found ${collectionKeys.length} root collections in backup:`, collectionKeys.join(', '));

  if (isDryRun) {
    console.log('\n[DRY RUN COMPLETE] Backup file is valid and safe for staging restore. 0 records written.');
    return { success: true, dryRun: true, collections: collectionKeys };
  }

  // Safeguard 7: Capture pre-restoration snapshot before modifying staging
  const backupDir = path.resolve(process.cwd(), 'data/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const preRestoreTimestamp = Date.now();
  const preRestorePath = path.join(backupDir, `pre_restore_backup_${preRestoreTimestamp}.json`);
  console.log(`\nCapturing pre-restoration backup to: ${preRestorePath}...`);

  try {
    const currentLiveState = {};
    for (const key of collectionKeys) {
      currentLiveState[key] = (await firebaseRtdbAdapter.get(key)) || null;
    }
    fs.writeFileSync(preRestorePath, JSON.stringify(currentLiveState, null, 2), 'utf8');
    console.log(' [✓] Pre-restoration backup successfully written.');
  } catch (err) {
    throw new Error(`RECOVERY ABORTED: Failed to create pre-restoration backup: ${err.message}`);
  }

  // Live Restoration Step
  console.log(`\nExecuting live restoration of ${collectionKeys.length} collections into staging RTDB...`);
  for (const collection of collectionKeys) {
    const data = backupData[collection];
    await firebaseRtdbAdapter.set(collection, data);
    console.log(` [✓] Restored collection: ${collection}`);
  }

  console.log('\n================================================================');
  console.log('STAGING RESTORATION COMPLETED SUCCESSFULLY');
  console.log(`Pre-restore backup saved at: ${preRestorePath}`);
  console.log('================================================================\n');

  return {
    success: true,
    preRestorePath,
    restoredCollections: collectionKeys,
    timestamp: new Date().toISOString(),
  };
}

// CLI Execution check
if (process.argv[1] && process.argv[1].endsWith('restoreStagingBackup.js')) {
  restoreStagingBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\nRestoration halted:', err.message);
      process.exit(1);
    });
}
