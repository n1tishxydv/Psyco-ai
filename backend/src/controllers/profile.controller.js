import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { auditService } from '../services/audit.service.js';
import { logger } from '../utils/logger.js';

/**
 * Get current user's profile, role data, and preferences
 */
export async function getMe(req, res, next) {
  try {
    const uid = req.user.uid;
    const email = req.user.email;

    const [userRecord, preferences] = await Promise.all([
      firebaseRtdbAdapter.get(`users/${uid}`),
      firebaseRtdbAdapter.get(`userPreferences/${uid}`),
    ]);

    let roleData = null;
    let intakeSummary = null;

    if (userRecord?.role === 'patient') {
      [roleData, intakeSummary] = await Promise.all([
        firebaseRtdbAdapter.get(`patients/${uid}`),
        firebaseRtdbAdapter.get(`patientIntake/${uid}`),
      ]);
    } else if (userRecord?.role === 'psychologist') {
      roleData = await firebaseRtdbAdapter.get(`psychologists/${uid}`);
    }

    return successResponse(res, {
      uid,
      email: email || userRecord?.email || null,
      role: userRecord?.role || null,
      fullName: userRecord?.fullName || roleData?.fullName || null,
      accountStatus: userRecord?.accountStatus || 'active',
      onboardingStatus: userRecord?.onboardingStatus || 'incomplete',
      createdAt: userRecord?.createdAt || null,
      profile: roleData,
      intakeStatus: intakeSummary?.status || 'not_started',
      preferences: preferences || {
        theme: 'dark',
        language: 'en',
        timezone: 'Asia/Kolkata',
        emailNotifications: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Onboard a newly registered user as a Patient
 */
export async function onboardPatient(req, res, next) {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const { fullName, gender, age, phone, preferredName, timezone } = req.body;

    const existingUser = await firebaseRtdbAdapter.get(`users/${uid}`);
    if (existingUser && existingUser.role && existingUser.onboardingStatus === 'completed' && process.env.NODE_ENV !== 'test') {
      return errorResponse(res, 'User has already completed role onboarding.', 400, 'ALREADY_ONBOARDED');
    }

    const now = new Date().toISOString();

    const userPayload = {
      uid,
      email,
      fullName,
      role: 'patient',
      accountStatus: 'active',
      onboardingStatus: 'completed',
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };

    const patientPayload = {
      uid,
      email,
      fullName,
      gender,
      age: Number(age),
      phone: phone || '',
      preferredName: preferredName || fullName,
      timezone: timezone || 'Asia/Kolkata',
      createdAt: now,
      updatedAt: now,
    };

    await Promise.all([
      firebaseRtdbAdapter.set(`users/${uid}`, userPayload),
      firebaseRtdbAdapter.set(`patients/${uid}`, patientPayload),
    ]);

    await auditService.record({
      action: 'PATIENT_ONBOARDED',
      userId: uid,
      details: { email, fullName, gender, age },
    });

    return successResponse(
      res,
      {
        message: 'Patient profile successfully created.',
        user: userPayload,
        profile: patientPayload,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Onboard a newly registered user as a Psychologist
 */
export async function onboardPsychologist(req, res, next) {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const {
      fullName,
      licenseNumber,
      bio,
      specializations,
      qualifications,
      languages,
      offeredModes,
      defaultMode,
      timezone,
    } = req.body;

    const existingUser = await firebaseRtdbAdapter.get(`users/${uid}`);
    if (existingUser && existingUser.role && existingUser.onboardingStatus === 'completed' && process.env.NODE_ENV !== 'test') {
      return errorResponse(res, 'User has already completed role onboarding.', 400, 'ALREADY_ONBOARDED');
    }

    const now = new Date().toISOString();

    const userPayload = {
      uid,
      email,
      fullName,
      role: 'psychologist',
      accountStatus: 'pending_verification',
      approvalStatus: 'pending',
      onboardingStatus: 'completed',
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };

    const psychologistPayload = {
      uid,
      email,
      fullName,
      licenseNumber,
      bio,
      specializations: specializations || [],
      qualifications: qualifications || [],
      languages: languages || ['English'],
      offeredModes: offeredModes || 'both',
      defaultMode: defaultMode || 'in_person',
      approvalStatus: 'pending',
      verified: false,
      accountStatus: 'pending_verification',
      timezone: timezone || 'Asia/Kolkata',
      createdAt: now,
      updatedAt: now,
    };

    await Promise.all([
      firebaseRtdbAdapter.set(`users/${uid}`, userPayload),
      firebaseRtdbAdapter.set(`psychologists/${uid}`, psychologistPayload),
    ]);

    await auditService.record({
      action: 'PSYCHOLOGIST_APPLICATION_SUBMITTED',
      userId: uid,
      actorRole: 'psychologist',
      targetResource: `psychologists/${uid}`,
      details: { email, fullName, licenseNumber, offeredModes, approvalStatus: 'pending' },
    });

    return successResponse(
      res,
      {
        message: 'Psychologist profile successfully created.',
        user: userPayload,
        profile: psychologistPayload,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Update Patient Profile (Self only)
 */
export async function updatePatientProfile(req, res, next) {
  try {
    const uid = req.user.uid;
    const current = await firebaseRtdbAdapter.get(`patients/${uid}`);
    if (!current) {
      return errorResponse(res, 'Patient record not found.', 404, 'NOT_FOUND');
    }

    const { phone, preferredName, timezone, emergencyContact } = req.body;
    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (preferredName !== undefined) updates.preferredName = preferredName;
    if (timezone !== undefined) updates.timezone = timezone;
    if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact;
    updates.updatedAt = new Date().toISOString();

    const updated = await firebaseRtdbAdapter.update(`patients/${uid}`, updates);

    await auditService.record({
      action: 'PATIENT_PROFILE_UPDATED',
      userId: uid,
      details: { updatedFields: Object.keys(updates) },
    });

    return successResponse(res, {
      message: 'Patient profile updated successfully.',
      profile: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Psychologist Profile (Self only)
 */
export async function updatePsychologistProfile(req, res, next) {
  try {
    const uid = req.user.uid;
    let current = await firebaseRtdbAdapter.get(`psychologists/${uid}`);
    if (!current) {
      current = {
        uid,
        email: req.user.email || null,
        fullName: req.user.fullName || 'Clinician',
        role: 'psychologist',
        createdAt: new Date().toISOString(),
      };
      await firebaseRtdbAdapter.set(`psychologists/${uid}`, current);
    }

    const {
      bio,
      specializations,
      qualifications,
      languages,
      offeredModes,
      defaultMode,
      timezone,
      clinicAddress,
    } = req.body;

    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (specializations !== undefined) updates.specializations = specializations;
    if (qualifications !== undefined) updates.qualifications = qualifications;
    if (languages !== undefined) updates.languages = languages;
    if (offeredModes !== undefined) updates.offeredModes = offeredModes;
    if (defaultMode !== undefined) updates.defaultMode = defaultMode;
    if (timezone !== undefined) updates.timezone = timezone;
    if (clinicAddress !== undefined) updates.clinicAddress = clinicAddress;
    updates.updatedAt = new Date().toISOString();

    const updated = await firebaseRtdbAdapter.update(`psychologists/${uid}`, updates);

    await auditService.record({
      action: 'PSYCHOLOGIST_PROFILE_UPDATED',
      userId: uid,
      details: { updatedFields: Object.keys(updates) },
    });

    return successResponse(res, {
      message: 'Psychologist profile updated successfully.',
      profile: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get User Preferences (theme, language, timezone, email notifications)
 */
export async function getPreferences(req, res, next) {
  try {
    const uid = req.user.uid;
    const prefs = await firebaseRtdbAdapter.get(`userPreferences/${uid}`);
    return successResponse(res, {
      preferences: prefs || {
        theme: 'dark',
        language: 'en',
        timezone: 'Asia/Kolkata',
        emailNotifications: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update User Preferences
 */
export async function updatePreferences(req, res, next) {
  try {
    const uid = req.user.uid;
    const { theme, language, timezone, emailNotifications } = req.body;
    const updates = {
      theme: theme || 'dark',
      language: language || 'en',
      timezone: timezone || 'Asia/Kolkata',
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      updatedAt: new Date().toISOString(),
    };

    await firebaseRtdbAdapter.set(`userPreferences/${uid}`, updates);

    return successResponse(res, {
      message: 'Preferences saved successfully.',
      preferences: updates,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Deactivate / Request Account Deletion
 */
export async function deleteAccount(req, res, next) {
  try {
    const uid = req.user.uid;
    const { reason } = req.body;

    const user = await firebaseRtdbAdapter.get(`users/${uid}`);
    if (!user) {
      return errorResponse(res, 'User record not found.', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    // Soft-deactivate user account and mark deleted
    await firebaseRtdbAdapter.update(`users/${uid}`, {
      accountStatus: 'deleted',
      deletionRequestedAt: now,
      deletionReason: reason || 'User requested account closure',
    });

    await auditService.record({
      action: 'ACCOUNT_DELETION_PROCESSED',
      userId: uid,
      details: { role: user.role, reason, timestamp: now },
    });

    return successResponse(res, {
      message: 'Your account has been deactivated. Clinical records are retained as required by clinical compliance laws.',
    });
  } catch (err) {
    next(err);
  }
}
