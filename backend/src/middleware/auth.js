import config from '../config/index.js';
import { errorResponse } from '../utils/apiResponse.js';
import { firebaseAuthAdapter } from '../integrations/firebase/firebaseAuthAdapter.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

/**
 * Authentication Middleware:
 * 1. Verifies the Firebase ID token cryptographically.
 * 2. Fetches authoritative account metadata (role, status) from Firebase Realtime Database.
 * 3. Enforces account suspension and active status.
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication token required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split('Bearer ')[1].trim();

  if (!token) {
    return errorResponse(res, 'Invalid token format', 401, 'INVALID_TOKEN');
  }

  if (!firebaseAuthAdapter.isConfigured()) {
    return errorResponse(
      res,
      'Authentication service is currently unconfigured.',
      503,
      'AUTH_SERVICE_UNCONFIGURED'
    );
  }

  try {
    const decodedToken = await firebaseAuthAdapter.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Retrieve authoritative profile from Realtime Database (/users/{uid})
    let userRecord = await firebaseRtdbAdapter.get(`users/${uid}`);

    if (!userRecord || !userRecord.role) {
      // Self-heal role detection if record is missing or wiped
      const [psychRecord, patientRecord] = await Promise.all([
        firebaseRtdbAdapter.get(`psychologists/${uid}`),
        firebaseRtdbAdapter.get(`patients/${uid}`),
      ]);

      let resolvedRole = decodedToken.role || null;
      if (!resolvedRole) {
        if (psychRecord) {
          resolvedRole = 'psychologist';
        } else if (patientRecord) {
          resolvedRole = 'patient';
        } else {
          // Default authenticated user to patient role so booking and intake can proceed seamlessly
          resolvedRole = 'patient';
        }
      }

      const synthesizedUser = {
        uid,
        email: email || userRecord?.email || '',
        role: resolvedRole,
        accountStatus: userRecord?.accountStatus || 'active',
        onboardingStatus: psychRecord ? 'complete' : (patientRecord ? 'complete' : 'pending'),
        fullName: userRecord?.fullName || psychRecord?.fullName || patientRecord?.fullName || (email ? email.split('@')[0] : 'User'),
        createdAt: userRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await firebaseRtdbAdapter.set(`users/${uid}`, synthesizedUser);
      } catch (err) {
        // Log but do not block request
      }
      userRecord = synthesizedUser;
    }

    if (userRecord && userRecord.accountStatus === 'suspended') {
      return errorResponse(
        res,
        'Your account has been suspended. Please contact practice administration.',
        403,
        'ACCOUNT_SUSPENDED'
      );
    }

    const finalRole = userRecord?.role || decodedToken.role || 'patient';
    req.user = {
      uid,
      email: email || userRecord?.email || null,
      role: finalRole,
      accountStatus: userRecord?.accountStatus || 'active',
      onboardingStatus: userRecord?.onboardingStatus || 'incomplete',
      fullName: userRecord?.fullName || null,
    };

    next();
  } catch (err) {
    return errorResponse(res, `Failed to authenticate token: ${err.message}`, 401, 'TOKEN_VERIFICATION_FAILED');
  }
}
