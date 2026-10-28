/**
 * Unified Firebase client entry point
 * Bridges Authentication and Realtime Database adapters.
 */
import { firebaseAuthAdapter } from '../integrations/firebase/firebaseAuthAdapter.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

export const firebase = {
  auth: firebaseAuthAdapter,
  database: firebaseRtdbAdapter,
  isConfigured: () => firebaseAuthAdapter.isConfigured() && firebaseRtdbAdapter.isConfigured(),
  getStatus: () => ({
    auth: firebaseAuthAdapter.getStatus(),
    database: firebaseRtdbAdapter.getStatus(),
  }),
};
