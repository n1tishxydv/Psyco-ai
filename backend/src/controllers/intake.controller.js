import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';
import { clinicalService } from '../services/clinical.service.js';
import { auditService } from '../services/audit.service.js';

/**
 * Get Intake Questionnaire (Patient retrieves own, or assigned Psychologist retrieves patient's)
 */
export async function getIntake(req, res, next) {
  try {
    const userRole = req.user.role;
    const targetPatientId = req.params.patientId || req.user.uid;

    if (userRole === 'admin') {
      return errorResponse(
        res,
        'Administrative accounts are barred from accessing direct patient clinical intake records.',
        403,
        'ADMIN_CLINICAL_ACCESS_PROHIBITED'
      );
    }

    if (userRole === 'patient') {
      if (targetPatientId !== req.user.uid) {
        return errorResponse(res, 'Access denied. You can only view your own intake.', 403, 'FORBIDDEN');
      }
    } else if (userRole === 'psychologist') {
      await clinicalService.assertTherapeuticRelationship(req.user.uid, targetPatientId);
    } else {
      return errorResponse(res, 'Access denied.', 403, 'FORBIDDEN');
    }

    const intakeRecord = await firebaseRtdbAdapter.get(`patientIntake/${targetPatientId}`);

    await auditService.record({
      action: 'CLINICAL_INTAKE_ACCESSED',
      userId: req.user.uid,
      actorRole: userRole,
      targetResource: `patientIntake/${targetPatientId}`,
      details: { patientId: targetPatientId },
    });

    return successResponse(res, {
      patientId: targetPatientId,
      intake: intakeRecord || { status: 'not_started' },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Save draft intake questionnaire (Patient only)
 */
export async function saveDraftIntake(req, res, next) {
  try {
    const patientId = req.user.uid;
    const existing = (await firebaseRtdbAdapter.get(`patientIntake/${patientId}`)) || {};

    const draftData = {
      ...existing,
      ...req.body,
      status: 'draft',
      patientId,
      updatedAt: new Date().toISOString(),
    };

    await firebaseRtdbAdapter.set(`patientIntake/${patientId}`, draftData);

    return successResponse(res, {
      message: 'Draft intake saved successfully.',
      intake: draftData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit final intake questionnaire (Patient only)
 */
export async function submitIntake(req, res, next) {
  try {
    const patientId = req.user.uid;
    const existing = (await firebaseRtdbAdapter.get(`patientIntake/${patientId}`)) || {};
    const now = new Date().toISOString();

    const finalData = {
      ...existing,
      ...req.body,
      patientId,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      version: 1,
    };

    await firebaseRtdbAdapter.set(`patientIntake/${patientId}`, finalData);

    await auditService.record({
      action: 'PATIENT_INTAKE_SUBMITTED',
      userId: patientId,
      details: {
        submittedAt: now,
        hasCrisisIndicators: Boolean(
          req.body.sectionE?.suicidalIdeationPastMonth || req.body.sectionE?.immediateRiskAcknowledged
        ),
      },
    });

    return successResponse(
      res,
      {
        message: 'Clinical intake questionnaire submitted successfully.',
        intake: finalData,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get Psychologist Intake Template
 */
export async function getPsychologistTemplate(req, res, next) {
  try {
    const psychologistId = req.params.psychologistId || req.user.uid;
    const template = await firebaseRtdbAdapter.get(`intakeTemplates/${psychologistId}`);

    return successResponse(res, {
      psychologistId,
      template: template || {
        psychologistId,
        title: 'Standard Clinical Intake Questions',
        description: 'Default intake questionnaire customized by your psychologist.',
        customQuestions: [],
        isActive: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Psychologist Intake Template (Psychologist only)
 */
export async function updatePsychologistTemplate(req, res, next) {
  try {
    const psychologistId = req.user.uid;
    const { title, description, customQuestions, isActive } = req.body;
    const now = new Date().toISOString();

    const templateData = {
      psychologistId,
      title: title || 'Practice Intake Questions',
      description: description || '',
      customQuestions: customQuestions || [],
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: now,
    };

    await firebaseRtdbAdapter.set(`intakeTemplates/${psychologistId}`, templateData);

    await auditService.record({
      action: 'INTAKE_TEMPLATE_UPDATED',
      userId: psychologistId,
      details: { questionCount: customQuestions?.length || 0 },
    });

    return successResponse(res, {
      message: 'Intake template saved successfully.',
      template: templateData,
    });
  } catch (err) {
    next(err);
  }
}
