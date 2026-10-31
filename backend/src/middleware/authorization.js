import { errorResponse } from '../utils/apiResponse.js';

export const ROLES = {
  PATIENT: 'patient',
  PSYCHOLOGIST: 'psychologist',
  ADMIN: 'admin',
};

/**
 * Validates that the authenticated user possesses one of the allowed roles.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking permissions', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Allowed roles: ${allowedRoles.join(', ')}`,
        403,
        'INSUFFICIENT_ROLE_PERMISSIONS'
      );
    }

    next();
  };
}

/**
 * Validates that the requested resource belongs to the requesting patient.
 */
export function requirePatientOwnership(paramKey = 'patientId') {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const requestedId = req.params[paramKey] || req.body[paramKey];

    // Patients can only access their own resources
    if (req.user.role === ROLES.PATIENT && req.user.uid !== requestedId) {
      return errorResponse(
        res,
        'Access denied. Patients may only access their own personal records.',
        403,
        'FORBIDDEN_RESOURCE_ACCESS'
      );
    }

    next();
  };
}

/**
 * Enforces that administrators cannot read protected clinical notes or transcripts.
 */
export function blockAdminFromClinicalRecords() {
  return (req, res, next) => {
    if (req.user && req.user.role === ROLES.ADMIN) {
      return errorResponse(
        res,
        'Administrative accounts are barred from accessing direct patient clinical notes and transcripts.',
        403,
        'ADMIN_CLINICAL_ACCESS_PROHIBITED'
      );
    }
    next();
  };
}

/**
 * Enforces that only active, administrator-approved psychologists can access clinical functionality.
 * Rejects pending or rejected psychologists with HTTP 403.
 */
export function requireVerifiedPsychologist() {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking permissions', 401, 'UNAUTHORIZED');
    }

    if (req.user.role !== ROLES.PSYCHOLOGIST) {
      return errorResponse(
        res,
        'Access denied. Clinician role required.',
        403,
        'INSUFFICIENT_ROLE_PERMISSIONS'
      );
    }

    if (req.user.accountStatus === 'suspended') {
      return errorResponse(
        res,
        'Access denied. Clinician account is suspended.',
        403,
        'ACCOUNT_SUSPENDED'
      );
    }

    // Fast-path: Check approvalStatus on user object if already populated
    if (req.user.approvalStatus === 'approved') {
      return next();
    }
    if (req.user.approvalStatus && req.user.approvalStatus !== 'approved') {
      return errorResponse(
        res,
        'Access denied. Clinician credentials are pending administrator verification or rejected.',
        403,
        'PSYCHOLOGIST_NOT_VERIFIED'
      );
    }

    // Fallback: Query RTDB for authoritative approval status
    try {
      const { firebaseRtdbAdapter } = await import('../integrations/firebase/firebaseRtdbAdapter.js');
      const psych = await firebaseRtdbAdapter.get(`psychologists/${req.user.uid}`);
      const isApproved = psych?.approvalStatus === 'approved' || (psych?.verified === true && psych?.approvalStatus !== 'rejected');
      if (!isApproved) {
        return errorResponse(
          res,
          'Access denied. Clinician credentials are pending administrator verification or rejected.',
          403,
          'PSYCHOLOGIST_NOT_VERIFIED'
        );
      }
      req.user.approvalStatus = 'approved';
      next();
    } catch (err) {
      next(err);
    }
  };
}
