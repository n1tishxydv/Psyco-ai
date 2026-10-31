import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { practiceService } from '../services/practice.service.js';

export async function getPracticeWorkspace(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const workspace = await practiceService.getPsychologistPracticeWorkspace(psychologistId);
    return successResponse(res, workspace);
  } catch (err) {
    next(err);
  }
}

export async function updatePracticeSettings(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const updated = await practiceService.updateIndependentPracticeSettings(psychologistId, req.body);
    return successResponse(res, {
      message: 'Practice configuration saved successfully.',
      practice: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function addLocation(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const location = await practiceService.addPracticeLocation(psychologistId, req.body);
    return successResponse(res, {
      message: 'Practice location added successfully.',
      location,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteLocation(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { locationId } = req.params;
    const result = await practiceService.deletePracticeLocation(psychologistId, locationId);
    return successResponse(res, {
      message: 'Practice location removed successfully.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getClinics(req, res, next) {
  try {
    const clinics = await practiceService.getRegisteredClinics();
    return successResponse(res, { clinics, count: clinics.length });
  } catch (err) {
    next(err);
  }
}

export async function requestAffiliation(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { clinicId, note } = req.body;
    const membership = await practiceService.requestClinicAffiliation(psychologistId, clinicId, note);
    return successResponse(res, {
      message: 'Clinic affiliation request submitted.',
      membership,
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function switchContext(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { practiceId } = req.body;
    const result = await practiceService.switchActivePracticeContext(psychologistId, practiceId);
    return successResponse(res, {
      message: 'Practice context updated.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
