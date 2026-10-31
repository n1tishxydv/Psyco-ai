import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';

export const practiceService = {
  /**
   * Retrieves or initializes the comprehensive practice workspace for a verified psychologist
   * Supports Independent, Clinic-Affiliated, and Hybrid practice contexts
   */
  getPsychologistPracticeWorkspace: async (psychologistId) => {
    const psych = (await firebaseRtdbAdapter.get(`psychologists/${psychologistId}`)) || {};
    const indepId = `indep_${psychologistId}`;

    let indepPractice = await firebaseRtdbAdapter.get(`practices/${indepId}`);
    if (!indepPractice) {
      // Auto-initialize personal independent practice workspace from clinician profile
      const defaultName = psych.fullName
        ? `${psych.fullName} Private Practice`
        : 'Private Clinical Practice';

      const initialLocations = [];
      if (psych.clinicAddress && (psych.clinicAddress.line1 || psych.clinicAddress.city)) {
        initialLocations.push({
          id: `loc_${Date.now()}_default`,
          name: 'Primary Office',
          address: {
            line1: psych.clinicAddress.line1 || '',
            city: psych.clinicAddress.city || '',
            state: psych.clinicAddress.state || '',
            postalCode: psych.clinicAddress.postalCode || '',
          },
          isDefault: true,
          isActive: true,
        });
      }

      indepPractice = {
        id: indepId,
        ownerUid: psychologistId,
        type: 'independent',
        practiceName: defaultName,
        professionalBio: psych.bio || '',
        contactEmail: psych.email || null,
        contactPhone: psych.phone || null,
        timezone: psych.timezone || 'Asia/Kolkata',
        offeredModes: psych.offeredModes || 'both',
        defaultMode: psych.defaultMode || 'in_person',
        locations: initialLocations,
        appointmentDurationMinutes: 50,
        bufferTimeMinutes: 10,
        cancellationCutoffHours: 24,
        setupCompleted: Boolean(psych.bio && (psych.offeredModes === 'online' || initialLocations.length > 0)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firebaseRtdbAdapter.set(`practices/${indepId}`, indepPractice);
    }

    // Fetch clinic affiliations
    const allMemberships = (await firebaseRtdbAdapter.get('practiceMemberships')) || {};
    const affiliations = Object.values(allMemberships).filter(
      (m) => m.psychologistId === psychologistId
    );

    // Active context determination
    const activePracticeId = psych.activePracticeId || indepId;
    const practiceArrangement = psych.practiceArrangement || (affiliations.length > 0 ? 'hybrid' : 'independent');

    // Build available practice contexts list
    const availableContexts = [
      {
        practiceId: indepId,
        name: indepPractice.practiceName,
        type: 'independent',
        role: 'owner',
        isCurrent: activePracticeId === indepId,
      },
      ...affiliations
        .filter((a) => a.status === 'approved')
        .map((a) => ({
          practiceId: a.clinicId,
          name: a.clinicName || 'Affiliated Clinic',
          type: 'clinic',
          role: a.role || 'psychologist',
          isCurrent: activePracticeId === a.clinicId,
        })),
    ];

    return {
      psychologistId,
      practiceArrangement,
      activePracticeId,
      independentPractice: indepPractice,
      affiliations,
      availableContexts,
      isApproved: psych.approvalStatus === 'approved' || psych.verified === true,
    };
  },

  /**
   * Updates settings for the psychologist's independent practice
   */
  updateIndependentPracticeSettings: async (psychologistId, updates) => {
    const indepId = `indep_${psychologistId}`;
    const current = (await firebaseRtdbAdapter.get(`practices/${indepId}`)) || {};

    const merged = {
      ...current,
      id: indepId,
      ownerUid: psychologistId,
      type: 'independent',
      practiceName: updates.practiceName !== undefined ? updates.practiceName.trim() : current.practiceName,
      professionalBio: updates.professionalBio !== undefined ? updates.professionalBio.trim() : current.professionalBio,
      contactPhone: updates.contactPhone !== undefined ? updates.contactPhone.trim() : current.contactPhone,
      contactEmail: updates.contactEmail !== undefined ? updates.contactEmail.trim() : current.contactEmail,
      timezone: updates.timezone || current.timezone || 'Asia/Kolkata',
      offeredModes: updates.offeredModes || current.offeredModes || 'both',
      defaultMode: updates.defaultMode || current.defaultMode || 'in_person',
      appointmentDurationMinutes: Number(updates.appointmentDurationMinutes) || current.appointmentDurationMinutes || 50,
      bufferTimeMinutes: Number(updates.bufferTimeMinutes) !== undefined ? Number(updates.bufferTimeMinutes) : (current.bufferTimeMinutes || 10),
      cancellationCutoffHours: Number(updates.cancellationCutoffHours) || current.cancellationCutoffHours || 24,
      setupCompleted: updates.setupCompleted !== undefined ? Boolean(updates.setupCompleted) : current.setupCompleted,
      updatedAt: new Date().toISOString(),
    };

    await firebaseRtdbAdapter.set(`practices/${indepId}`, merged);

    // Sync baseline directory fields on psychologist record
    const psychUpdates = {
      offeredModes: merged.offeredModes,
      defaultMode: merged.defaultMode,
      timezone: merged.timezone,
      practiceArrangement: updates.practiceArrangement || undefined,
      updatedAt: new Date().toISOString(),
    };

    if (updates.practiceArrangement) {
      psychUpdates.practiceArrangement = updates.practiceArrangement;
    }

    await firebaseRtdbAdapter.update(`psychologists/${psychologistId}`, psychUpdates);

    await auditService.record({
      action: 'INDEPENDENT_PRACTICE_UPDATED',
      userId: psychologistId,
      details: { practiceId: indepId, updatedFields: Object.keys(updates) },
    });

    return merged;
  },

  /**
   * Adds an authorized physical consultation location to the independent practice
   */
  addPracticeLocation: async (psychologistId, locationData) => {
    const indepId = `indep_${psychologistId}`;
    const practice = (await firebaseRtdbAdapter.get(`practices/${indepId}`)) || {};
    const locations = Array.isArray(practice.locations) ? [...practice.locations] : [];

    const newLocId = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isFirst = locations.length === 0;
    const shouldBeDefault = locationData.isDefault || isFirst;

    if (shouldBeDefault) {
      locations.forEach((loc) => {
        loc.isDefault = false;
      });
    }

    const newLocation = {
      id: newLocId,
      name: locationData.name?.trim() || 'Consultation Office',
      address: {
        line1: locationData.address?.line1?.trim() || '',
        city: locationData.address?.city?.trim() || '',
        state: locationData.address?.state?.trim() || '',
        postalCode: locationData.address?.postalCode?.trim() || '',
      },
      isDefault: shouldBeDefault,
      isActive: locationData.isActive !== false,
      instructions: locationData.instructions?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    locations.push(newLocation);
    await firebaseRtdbAdapter.set(`practices/${indepId}/locations`, locations);

    // If default, sync backwards-compatible clinicAddress on psychologist profile
    if (shouldBeDefault) {
      await firebaseRtdbAdapter.update(`psychologists/${psychologistId}`, {
        clinicAddress: newLocation.address,
        updatedAt: new Date().toISOString(),
      });
    }

    await auditService.record({
      action: 'PRACTICE_LOCATION_ADDED',
      userId: psychologistId,
      details: { practiceId: indepId, locationId: newLocId, name: newLocation.name },
    });

    return newLocation;
  },

  /**
   * Deletes a physical location from the independent practice
   */
  deletePracticeLocation: async (psychologistId, locationId) => {
    const indepId = `indep_${psychologistId}`;
    const practice = (await firebaseRtdbAdapter.get(`practices/${indepId}`)) || {};
    const locations = Array.isArray(practice.locations) ? [...practice.locations] : [];

    const filtered = locations.filter((loc) => loc.id !== locationId);
    if (filtered.length > 0 && !filtered.some((l) => l.isDefault)) {
      filtered[0].isDefault = true;
    }

    await firebaseRtdbAdapter.set(`practices/${indepId}/locations`, filtered);

    // Update psychologist clinicAddress fallback
    const newDefault = filtered.find((l) => l.isDefault);
    await firebaseRtdbAdapter.update(`psychologists/${psychologistId}`, {
      clinicAddress: newDefault ? newDefault.address : null,
      updatedAt: new Date().toISOString(),
    });

    await auditService.record({
      action: 'PRACTICE_LOCATION_REMOVED',
      userId: psychologistId,
      details: { practiceId: indepId, locationId },
    });

    return { success: true, remainingCount: filtered.length };
  },

  /**
   * Lists registered clinics for membership affiliation discovery
   */
  getRegisteredClinics: async () => {
    const allPractices = (await firebaseRtdbAdapter.get('practices')) || {};
    const clinics = Object.values(allPractices)
      .filter((p) => p.type === 'clinic' && p.isActive !== false)
      .map((c) => ({
        id: c.id,
        name: c.practiceName || c.name,
        city: c.locations?.[0]?.address?.city || c.city || 'Central Clinic',
        state: c.locations?.[0]?.address?.state || c.state || '',
        description: c.professionalBio || c.description || 'Registered Clinical Practice',
      }));

    return clinics;
  },

  /**
   * Requests membership affiliation with an authorized clinic
   */
  requestClinicAffiliation: async (psychologistId, clinicId, note = '') => {
    const clinic = await firebaseRtdbAdapter.get(`practices/${clinicId}`);
    if (!clinic || clinic.type !== 'clinic') {
      const err = new Error('Target clinic not found or is not a registered clinic organization.');
      err.status = 404;
      err.code = 'CLINIC_NOT_FOUND';
      throw err;
    }

    const membershipId = `mem_${psychologistId}_${clinicId}`;
    const existing = await firebaseRtdbAdapter.get(`practiceMemberships/${membershipId}`);
    if (existing && existing.status === 'approved') {
      const err = new Error('You are already an approved member of this clinic.');
      err.status = 400;
      err.code = 'MEMBERSHIP_ALREADY_EXISTS';
      throw err;
    }

    const psych = (await firebaseRtdbAdapter.get(`psychologists/${psychologistId}`)) || {};

    const membership = {
      id: membershipId,
      psychologistId,
      psychologistName: psych.fullName || 'Clinician',
      clinicId,
      clinicName: clinic.practiceName || clinic.name || 'Clinic',
      role: 'psychologist',
      status: 'pending',
      requestNote: note.trim() || null,
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firebaseRtdbAdapter.set(`practiceMemberships/${membershipId}`, membership);

    await auditService.record({
      action: 'CLINIC_AFFILIATION_REQUESTED',
      userId: psychologistId,
      details: { membershipId, clinicId },
    });

    return membership;
  },

  /**
   * Switches the active practice context for hybrid psychologists
   */
  switchActivePracticeContext: async (psychologistId, targetPracticeId) => {
    const indepId = `indep_${psychologistId}`;

    if (targetPracticeId !== indepId) {
      // Must verify approved membership in the clinic
      const membershipId = `mem_${psychologistId}_${targetPracticeId}`;
      const membership = await firebaseRtdbAdapter.get(`practiceMemberships/${membershipId}`);

      if (!membership || membership.status !== 'approved') {
        const err = new Error('Access denied. You do not hold an active, approved membership in this clinic.');
        err.status = 403;
        err.code = 'UNAUTHORIZED_PRACTICE_CONTEXT';
        throw err;
      }
    }

    await firebaseRtdbAdapter.update(`psychologists/${psychologistId}`, {
      activePracticeId: targetPracticeId,
      updatedAt: new Date().toISOString(),
    });

    await auditService.record({
      action: 'PRACTICE_CONTEXT_SWITCHED',
      userId: psychologistId,
      details: { activePracticeId: targetPracticeId },
    });

    return { activePracticeId: targetPracticeId };
  },
};
