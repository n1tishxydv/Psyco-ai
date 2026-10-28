import { INSTRUMENT_DEFINITIONS } from '../constants/assessments.js';

export const assessmentScoringService = {
  /**
   * Deterministically scores a completed PHQ-9 questionnaire
   * @param {object} responses - Map of item IDs to response values { phq9_1: 0..3, ... }
   */
  scorePhq9: (responses) => {
    const def = INSTRUMENT_DEFINITIONS['phq-9'];
    if (!responses || typeof responses !== 'object') {
      const err = new Error('PHQ-9 responses must be a valid key-value object.');
      err.status = 400;
      err.code = 'INVALID_RESPONSES_OBJECT';
      throw err;
    }

    let totalScore = 0;
    const itemScores = {};

    for (const item of def.items) {
      const val = responses[item.id];
      if (val === undefined || val === null || val === '') {
        const err = new Error(`Missing response for required item: "${item.text}" (${item.id}). Partial completion cannot be silently scored as zero.`);
        err.status = 400;
        err.code = 'MISSING_ASSESSMENT_ITEM';
        err.itemId = item.id;
        throw err;
      }

      const numVal = Number(val);
      if (!Number.isInteger(numVal) || numVal < 0 || numVal > 3) {
        const err = new Error(`Invalid response value "${val}" for item ${item.id}. Allowed values are integers 0, 1, 2, or 3.`);
        err.status = 400;
        err.code = 'INVALID_ITEM_VALUE';
        err.itemId = item.id;
        throw err;
      }

      itemScores[item.id] = numVal;
      totalScore += numVal;
    }

    // Determine clinical severity category
    const category = def.severityCategories.find(
      (cat) => totalScore >= cat.min && totalScore <= cat.max
    ) || { label: 'Unspecified', severity: 'unspecified' };

    // Check Question 9 (Suicidal Ideation / Self-Harm)
    const q9Score = itemScores['phq9_9'] || 0;
    const hasCriticalSafetySignal = q9Score > 0;
    let safetyReviewFlag = null;

    if (hasCriticalSafetySignal) {
      safetyReviewFlag = {
        item: 'phq9_9',
        score: q9Score,
        severity: q9Score >= 2 ? 'high_priority' : 'elevated',
        summary: `Question 9 affirmative response (${q9Score}/3) indicates thoughts of death or self-harm requiring direct clinical evaluation.`,
        recommendedAction: 'Conduct immediate clinical safety assessment and document crisis protocol evaluation.',
      };
    }

    return {
      instrumentId: 'phq-9',
      instrumentVersion: def.version,
      scoringAlgorithmVersion: '1.0.0',
      totalScore,
      maxScore: def.scoringRange.max,
      severityCategory: category.label,
      severityCode: category.severity,
      itemScores,
      hasCriticalSafetySignal,
      safetyReviewFlag,
      scoredAt: new Date().toISOString(),
      disclaimer: def.disclaimer,
    };
  },

  /**
   * Deterministically scores a completed GAD-7 questionnaire
   * @param {object} responses - Map of item IDs to response values { gad7_1: 0..3, ... }
   */
  scoreGad7: (responses) => {
    const def = INSTRUMENT_DEFINITIONS['gad-7'];
    if (!responses || typeof responses !== 'object') {
      const err = new Error('GAD-7 responses must be a valid key-value object.');
      err.status = 400;
      err.code = 'INVALID_RESPONSES_OBJECT';
      throw err;
    }

    let totalScore = 0;
    const itemScores = {};

    for (const item of def.items) {
      const val = responses[item.id];
      if (val === undefined || val === null || val === '') {
        const err = new Error(`Missing response for required item: "${item.text}" (${item.id}). Missing answers cannot be treated as zero.`);
        err.status = 400;
        err.code = 'MISSING_ASSESSMENT_ITEM';
        err.itemId = item.id;
        throw err;
      }

      const numVal = Number(val);
      if (!Number.isInteger(numVal) || numVal < 0 || numVal > 3) {
        const err = new Error(`Invalid response value "${val}" for item ${item.id}. Allowed values are integers 0, 1, 2, or 3.`);
        err.status = 400;
        err.code = 'INVALID_ITEM_VALUE';
        err.itemId = item.id;
        throw err;
      }

      itemScores[item.id] = numVal;
      totalScore += numVal;
    }

    // Determine anxiety severity bracket
    const category = def.severityCategories.find(
      (cat) => totalScore >= cat.min && totalScore <= cat.max
    ) || { label: 'Unspecified', severity: 'unspecified' };

    return {
      instrumentId: 'gad-7',
      instrumentVersion: def.version,
      scoringAlgorithmVersion: '1.0.0',
      totalScore,
      maxScore: def.scoringRange.max,
      severityCategory: category.label,
      severityCode: category.severity,
      itemScores,
      scoredAt: new Date().toISOString(),
      disclaimer: def.disclaimer,
    };
  },

  /**
   * Evaluates the C-SSRS Screener triage decision rules
   * @param {object} responses - Map of item IDs to response values { cssrs_1: 0|1, ... }
   */
  scoreCssrsScreener: (responses) => {
    const def = INSTRUMENT_DEFINITIONS['cssrs-screener'];
    if (!responses || typeof responses !== 'object') {
      const err = new Error('C-SSRS responses must be a valid key-value object.');
      err.status = 400;
      err.code = 'INVALID_RESPONSES_OBJECT';
      throw err;
    }

    const itemScores = {};
    for (const item of def.items) {
      const val = responses[item.id];
      // Check conditional logic: Q3, Q4, Q5 only required if Q2 was Yes (1)
      if (item.conditionalOn === 'cssrs_2_yes' && responses['cssrs_2'] !== 1) {
        itemScores[item.id] = 0; // Not applicable due to triage gateway
        continue;
      }

      if (val === undefined || val === null || val === '') {
        const err = new Error(`Missing response for required C-SSRS item: "${item.text}" (${item.id}).`);
        err.status = 400;
        err.code = 'MISSING_ASSESSMENT_ITEM';
        err.itemId = item.id;
        throw err;
      }

      const numVal = Number(val);
      if (numVal !== 0 && numVal !== 1) {
        const err = new Error(`Invalid response value "${val}" for C-SSRS item ${item.id}. Expected 0 (No) or 1 (Yes).`);
        err.status = 400;
        err.code = 'INVALID_ITEM_VALUE';
        err.itemId = item.id;
        throw err;
      }

      itemScores[item.id] = numVal;
    }

    // Triage Risk Classification
    let triageLevel = 'none_identified';
    let triageLabel = 'No immediate suicidal ideation reported';
    let safetyReviewFlag = null;

    if (itemScores['cssrs_4'] === 1 || itemScores['cssrs_5'] === 1 || itemScores['cssrs_6'] === 1) {
      triageLevel = 'high_risk';
      triageLabel = 'High Suicidal Risk Indicator (Intent, Plan, or Recent Behavior)';
      safetyReviewFlag = {
        severity: 'high_priority',
        summary: 'Affirmative response to suicidal intent (Q4), specific plan (Q5), or suicidal behavior (Q6).',
        recommendedAction: 'Immediate comprehensive clinical risk assessment, clinician notification, and implementation of safety plan.',
      };
    } else if (itemScores['cssrs_3'] === 1) {
      triageLevel = 'moderate_risk';
      triageLabel = 'Moderate Suicidal Risk Indicator (Method without Plan/Intent)';
      safetyReviewFlag = {
        severity: 'elevated',
        summary: 'Affirmative response to suicidal ideation with method (Q3).',
        recommendedAction: 'Clinician evaluation of protective factors and safety planning.',
      };
    } else if (itemScores['cssrs_1'] === 1 || itemScores['cssrs_2'] === 1) {
      triageLevel = 'low_risk';
      triageLabel = 'Passive / Non-Specific Suicidal Thoughts';
      safetyReviewFlag = {
        severity: 'advisory',
        summary: 'Affirmative response to passive wish to die (Q1) or non-specific thoughts (Q2).',
        recommendedAction: 'Clinical exploration of stressors, coping mechanisms, and support systems.',
      };
    }

    const affirmativeCount = Object.values(itemScores).filter((v) => v === 1).length;

    return {
      instrumentId: 'cssrs-screener',
      instrumentVersion: def.version,
      scoringAlgorithmVersion: '1.0.0',
      totalScore: affirmativeCount,
      triageLevel,
      triageLabel,
      itemScores,
      hasCriticalSafetySignal: triageLevel !== 'none_identified',
      safetyReviewFlag,
      scoredAt: new Date().toISOString(),
      disclaimer: def.disclaimer,
    };
  },

  /**
   * Main scoring dispatcher based on instrument ID
   */
  calculateScore: (instrumentId, responses) => {
    switch (instrumentId) {
      case 'phq-9':
        return assessmentScoringService.scorePhq9(responses);
      case 'gad-7':
        return assessmentScoringService.scoreGad7(responses);
      case 'cssrs-screener':
        return assessmentScoringService.scoreCssrsScreener(responses);
      default: {
        const err = new Error(`Unsupported assessment instrument: "${instrumentId}". Available: phq-9, gad-7, cssrs-screener.`);
        err.status = 400;
        err.code = 'UNSUPPORTED_INSTRUMENT';
        throw err;
      }
    }
  },
};
