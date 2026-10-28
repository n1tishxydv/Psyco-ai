import config from '../config/index.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { firebaseAuthAdapter } from '../integrations/firebase/firebaseAuthAdapter.js';
import { auditService } from '../services/audit.service.js';

export async function registerPatient(req, res, next) {
  try {
    if (!firebaseAuthAdapter.isConfigured()) {
      return errorResponse(
        res,
        'User registration requires configured Firebase Authentication. Please configure Firebase credentials in backend/.env (Planned for Phase 2).',
        503,
        'FIREBASE_AUTH_UNCONFIGURED'
      );
    }

    const { fullName, email, gender, age } = req.body;

    // Full registration implementation executes in Phase 2 with Firebase Admin Auth
    return successResponse(res, {
      message: 'Registration endpoint scaffolded. Firebase integration will complete account creation in Phase 2.',
      candidate: { fullName, email, gender, age, role: 'patient' },
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function registerPsychologist(req, res, next) {
  try {
    if (!firebaseAuthAdapter.isConfigured()) {
      return errorResponse(
        res,
        'Psychologist registration requires configured Firebase Authentication (Planned for Phase 2).',
        503,
        'FIREBASE_AUTH_UNCONFIGURED'
      );
    }

    const { fullName, email, licenseNumber, specializations, consultationModes } = req.body;

    return successResponse(res, {
      message: 'Psychologist onboarding scaffolded.',
      candidate: { fullName, email, licenseNumber, specializations, consultationModes, role: 'psychologist' },
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    if (!firebaseAuthAdapter.isConfigured()) {
      return errorResponse(
        res,
        'Authentication service requires configured Firebase Authentication (Planned for Phase 2).',
        503,
        'FIREBASE_AUTH_UNCONFIGURED'
      );
    }

    // In production, the client authenticates with Firebase Client SDK, acquires an ID token,
    // and sends it to the backend for verification.
    return successResponse(res, {
      message: 'Client must authenticate via Firebase Client SDK and supply Bearer token.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res) {
  return successResponse(res, {
    user: req.user,
    message: 'User profile retrieved via verified token claims.',
  });
}
