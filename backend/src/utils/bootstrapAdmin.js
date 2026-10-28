import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { logger } from './logger.js';

/**
 * Server-side utility to provision an administrator account.
 * Admins can never register via public registration forms.
 */
export async function bootstrapAdminUser({ uid, email, fullName }) {
  if (!uid || !email) {
    throw new Error('UID and email are required to bootstrap an administrator.');
  }

  const now = new Date().toISOString();
  const adminPayload = {
    uid,
    email,
    fullName: fullName || 'Practice Administrator',
    role: 'admin',
    accountStatus: 'active',
    onboardingStatus: 'completed',
    createdAt: now,
    updatedAt: now,
    isBootstrapAdmin: true,
  };

  await firebaseRtdbAdapter.set(`users/${uid}`, adminPayload);
  logger.info(`Bootstrap admin user created for UID: ${uid} (${email})`);
  return adminPayload;
}
