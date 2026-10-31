import { Router } from 'express';
import { firebaseRtdbAdapter } from '../../integrations/firebase/firebaseRtdbAdapter.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { getPublicSlots } from '../../controllers/availability.controller.js';

const router = Router();

/**
 * Public Directory: List approved clinicians available for public discovery.
 * Supports query filters: ?search=..., ?mode=in_person|online|both, ?specialization=..., ?language=...
 */
router.get('/', async (req, res, next) => {
  try {
    const allPsychologists = (await firebaseRtdbAdapter.get('psychologists')) || {};
    let list = Object.values(allPsychologists);

    // Filter approved clinicians
    list = list.filter((p) => p.approvalStatus === 'approved');

    const { search, mode, specialization, language } = req.query;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.fullName && p.fullName.toLowerCase().includes(q)) ||
          (p.bio && p.bio.toLowerCase().includes(q)) ||
          (p.specializations && p.specializations.some((s) => s.toLowerCase().includes(q)))
      );
    }

    if (mode && mode !== 'all') {
      list = list.filter((p) => p.offeredModes === 'both' || p.offeredModes === mode);
    }

    if (specialization) {
      const sLower = specialization.toLowerCase();
      list = list.filter((p) => p.specializations?.some((s) => s.toLowerCase().includes(sLower)));
    }

    if (language) {
      const lLower = language.toLowerCase();
      list = list.filter((p) => p.languages?.some((l) => l.toLowerCase().includes(lLower)));
    }

    // Sanitize output - never expose private emails, phone numbers, or administrative data
    const sanitized = list.map((p) => ({
      uid: p.uid,
      fullName: p.fullName,
      licenseNumber: p.licenseNumber,
      bio: p.bio,
      specializations: p.specializations || [],
      qualifications: p.qualifications || [],
      languages: p.languages || ['English'],
      offeredModes: p.offeredModes || 'both',
      defaultMode: p.defaultMode || 'in_person',
      clinicAddress: p.clinicAddress ? {
        city: p.clinicAddress.city,
        state: p.clinicAddress.state,
      } : null,
      timezone: p.timezone || 'Asia/Kolkata',
    }));

    return successResponse(res, { psychologists: sanitized, count: sanitized.length });
  } catch (err) {
    next(err);
  }
});

/**
 * Public: Get single psychologist profile
 */
router.get('/:psychologistId', async (req, res, next) => {
  try {
    const { psychologistId } = req.params;
    const psych = await firebaseRtdbAdapter.get(`psychologists/${psychologistId}`);

    if (!psych || psych.approvalStatus !== 'approved') {
      return errorResponse(res, 'Psychologist not found or not approved.', 404, 'NOT_FOUND');
    }

    const publicProfile = {
      uid: psych.uid,
      fullName: psych.fullName,
      licenseNumber: psych.licenseNumber,
      bio: psych.bio,
      specializations: psych.specializations || [],
      qualifications: psych.qualifications || [],
      languages: psych.languages || ['English'],
      offeredModes: psych.offeredModes || 'both',
      defaultMode: psych.defaultMode || 'in_person',
      clinicAddress: psych.clinicAddress || null,
      timezone: psych.timezone || 'Asia/Kolkata',
    };

    return successResponse(res, { psychologist: publicProfile });
  } catch (err) {
    next(err);
  }
});

/**
 * Public / Patient: Retrieve available slots for a specific date and mode
 */
router.get('/:psychologistId/available-slots', getPublicSlots);

export default router;
