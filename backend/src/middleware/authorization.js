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
