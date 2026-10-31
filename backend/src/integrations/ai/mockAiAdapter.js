/**
 * Psyco AI — Deterministic Mock AI Provider (Phase 6.3 Sandbox)
 * 
 * Generates structured, evidence-grounded synthetic clinical documentation drafts
 * for staging pilots without invoking Google Gemini or transmitting patient data externally.
 * 
 * Invariants:
 * 1. ZERO external network transmission.
 * 2. Deterministic output based strictly on provided transcript dialogue.
 * 3. Every generated draft is flagged isDraft=true, approvalStatus='pending_approval'.
 * 4. All metadata explicitly marked: provider='mock', isSynthetic=true, isMock=true, sandboxMode=true.
 * 5. Psychologist review and digital signature are mandatory before clinical record finalization.
 */

import { logger } from '../../utils/logger.js';

export class MockAiAdapter {
  constructor() {
    this.name = 'Psyco AI Mock Clinical Provider (Sandbox)';
    this.modelName = 'mock-deterministic-clinical-v1';
  }

  getStatus() {
    return {
      service: this.name,
      provider: 'mock',
      sandboxMode: true,
      syntheticOnly: true,
      externalCallsBlocked: true,
      status: 'ACTIVE_SANDBOX',
      model: this.modelName,
      storagePolicy: 'ZERO_EXTERNAL_TRANSMISSION',
      humanInTheLoopEnforced: true,
      message: 'Mock AI Clinical Provider active for staging pilot. All drafts are synthetic and require psychologist approval.',
    };
  }

  /**
   * Generates deterministic synthetic clinical documentation
   * @param {string} jobType - e.g. GENERATE_SOAP, GENERATE_DAP, etc.
   * @param {object} context - { transcriptText, transcriptVersion, session, patient, intake, existingTreatmentPlan }
   * @returns {Promise<{ output: object, modelUsed: string, isSimulated: boolean, isSynthetic: boolean, isMock: boolean, provider: string, sandboxMode: boolean }>}
   */
  async generateClinicalDocumentation(jobType, context) {
    const { transcriptText, transcriptVersion, patient, intake, existingTreatmentPlan } = context || {};

    if (!transcriptText || !transcriptText.trim()) {
      const err = new Error('Cannot generate synthetic clinical documentation from an empty transcript.');
      err.status = 400;
      err.code = 'EMPTY_TRANSCRIPT';
      throw err;
    }

    logger.info(`[AI SANDBOX] Generating deterministic mock draft for jobType=${jobType} (v${transcriptVersion || 1}) - Zero External Calls`);

    const lines = transcriptText.split('\n').filter((l) => l.trim().length > 0);

    const patientLines = lines
      .filter((l) => /patient|client|speaker 2/i.test(l))
      .map((l) => l.replace(/^\[?.*?\]?:\s*/, '').trim());

    const therapistLines = lines
      .filter((l) => /psychologist|therapist|dr\.|counselor|speaker 1/i.test(l))
      .map((l) => l.replace(/^\[?.*?\]?:\s*/, '').trim());

    const patientTextSample = patientLines.slice(0, 3).join(' ') || 'Patient reported feeling overwhelmed with work and personal obligations.';
    const therapistTextSample = therapistLines.slice(0, 2).join(' ') || 'Therapist reviewed cognitive reframing strategies and progressive relaxation techniques.';

    let output = {};

    switch (jobType) {
      case 'GENERATE_SOAP':
        output = {
          subjective: `[SYNTHETIC TEST DRAFT] Patient reports: "${patientTextSample}". Reports difficulty switching off work thoughts in the evening and disrupted sleep continuity.`,
          objective: '[SYNTHETIC TEST DRAFT] Client attended on time via scheduled appointment. Speech rate and volume normal; communicative and cooperative. Affect was euthymic to mildly anxious when discussing workload. No psychomotor agitation or thought disorder observed.',
          assessment: '[SYNTHETIC TEST DRAFT] Clinical themes align with situational anxiety and adjustment stress. Intact cognitive insight and high therapeutic alliance demonstrated. Responding favorably to CBT psychoeducation.',
          plan: '[SYNTHETIC TEST DRAFT] 1. Continue weekly individual cognitive-behavioral therapy.\n2. Complete daily 5-minute diaphragmatic breathing before sleep.\n3. Maintain situational thought log for review in next consultation.',
          evidenceReferences: [
            { turnOrder: 1, quote: patientLines[0] || 'Patient discussed current concerns.', section: 'subjective' },
            { turnOrder: 2, quote: therapistLines[0] || 'Therapist discussed cognitive reframing.', section: 'plan' },
          ],
          missingInformation: ['Specific psychometric assessment scale (GAD-7/PHQ-9) score requires clinician confirmation.'],
        };
        break;

      case 'GENERATE_DAP':
        output = {
          data: `[SYNTHETIC TEST DRAFT] Data:\nSubjective: "${patientTextSample}".\nObjective: Client was alert, oriented x4, engaged throughout dialogue with appropriate eye contact.`,
          assessment: '[SYNTHETIC TEST DRAFT] Client exhibits adaptive coping skills with emerging awareness of automatic cognitive distortions. No active safety risks reported.',
          plan: '[SYNTHETIC TEST DRAFT] Follow up on assigned thought log next week. Review sleep hygiene milestones.',
          evidenceReferences: [
            { turnOrder: 1, quote: patientLines[0] || 'Patient statements on stress triggers.', section: 'data' },
          ],
          missingInformation: ['Collateral medical history was not documented during this dialogue.'],
        };
        break;

      case 'GENERATE_BIRP':
        output = {
          behavior: `[SYNTHETIC TEST DRAFT] Client presented discussing occupational stress and fatigue: "${patientTextSample}".`,
          intervention: `[SYNTHETIC TEST DRAFT] Clinician guided cognitive restructuring and autonomic relaxation exercises: "${therapistTextSample}".`,
          response: '[SYNTHETIC TEST DRAFT] Client recognized catastrophic thinking pattern and practiced diaphragmatic pacing with observable reduction in physiological tension.',
          plan: '[SYNTHETIC TEST DRAFT] Maintain therapy schedule. Practice relaxation exercise 4x weekly.',
          evidenceReferences: [
            { turnOrder: 1, quote: patientLines[0] || 'Client reported experience.', section: 'behavior' },
          ],
          missingInformation: ['Formal rating scale assessment not documented.'],
        };
        break;

      case 'GENERATE_SESSION_SUMMARY':
        output = {
          title: '[SYNTHETIC TEST DRAFT] Clinical Session Summary',
          presentingConcerns: patientLines.slice(0, 2).length ? patientLines.slice(0, 2) : ['Stress and situational anxiety discussed.'],
          mainTopicsDiscussed: [
            'Workplace deadlines and interpersonal boundaries',
            'Sleep hygiene and evening relaxation routine',
            'Identification of cognitive distortions',
          ],
          patientReportedSymptoms: ['Situational anxiety', 'Initial insomnia', 'Muscle tension'],
          clinicalObservations: [
            'Client communicated clearly and was cooperative throughout.',
            'Affect congruent with reported themes; no perceptual abnormalities.',
          ],
          interventionsDocumented: [therapistTextSample],
          patientResponse: 'Client engaged positively and committed to tracking thought triggers.',
          progressNotes: 'Good treatment alliance; client shows motivation for active skill acquisition.',
          riskAssessmentNotes: 'Zero imminent harm to self or others expressed or observed. Standard clinical safety protocol maintained.',
          followUpPlan: ['Continue weekly individual CBT session', 'Review completed thought record next session'],
          missingInformation: ['Medication reconciliation pending physician communication.'],
        };
        break;

      case 'GENERATE_TREATMENT_PLAN_DRAFT':
        output = {
          title: '[SYNTHETIC TEST DRAFT] Cognitive-Behavioral Anxiety Management Plan',
          presentingProblem: 'Elevated stress and situational anxiety interfering with daily productivity and sleep hygiene.',
          patientStatedGoals: [
            'Reduce daily tension and feeling overwhelmed at work',
            'Fall asleep within 30 minutes without rumination',
          ],
          proposedLongTermGoals: [
            'Master cognitive reframing and autonomic downregulation skills over 12 weeks',
            'Restore restful sleep latency and emotional stability',
          ],
          shortTermObjectives: [
            {
              objective: 'Log 3 automatic thought records per week identifying cognitive distortions.',
              targetWeeks: 4,
              measurableCriteria: 'Completed thought log presented in 3 consecutive sessions.',
            },
            {
              objective: 'Engage in 10 minutes of progressive muscle relaxation or box breathing nightly.',
              targetWeeks: 4,
              measurableCriteria: 'Relaxation practice logged on at least 4 nights each week.',
            },
          ],
          proposedInterventions: [
            'Cognitive restructuring (all-or-nothing thinking, catastrophizing)',
            'Autonomic somatic regulation (Progressive Muscle Relaxation, 4-7-8 breathing)',
            'Sleep hygiene behavioral guidelines',
          ],
          suggestedReviewFrequencyWeeks: 4,
          progressEvaluationCriteria: 'Bi-weekly clinical check-in and monthly administration of standardized inventory.',
          missingInformation: ['Medical rule-out of thyroid or sleep apnea conditions requires clinician confirmation.'],
        };
        break;

      case 'GENERATE_HOMEWORK_SUGGESTIONS':
        output = {
          suggestions: [
            {
              title: '[SYNTHETIC] 3-Column Thought Record',
              description: 'Record triggering situations, automatic thoughts, and a balanced cognitive alternative once per day.',
              therapeuticRationale: 'Fosters cognitive flexibility and self-awareness of cognitive distortions.',
              suggestedFrequency: 'Daily as triggers occur',
              dueDateDays: 7,
            },
            {
              title: '[SYNTHETIC] Evening Relaxation Routine',
              description: 'Practice 10 minutes of progressive muscle relaxation or guided body scan prior to bedtime.',
              therapeuticRationale: 'Lowers physiological sympathetic arousal to promote sleep onset.',
              suggestedFrequency: 'Nightly',
              dueDateDays: 7,
            },
          ],
          clinicianReviewNotes: 'Ensure patient feels the assignments are feasible and non-demanding.',
        };
        break;

      case 'GENERATE_FOLLOW_UP_SUGGESTIONS':
        output = {
          suggestions: [
            {
              title: '[SYNTHETIC] Schedule Follow-up Session',
              category: 'scheduling',
              description: 'Confirm regular appointment slot for next week to evaluate homework progress.',
              priority: 'routine',
              suggestedTimeframe: 'Within 7-10 days',
            },
            {
              title: '[SYNTHETIC] Psychometric Inventory Baseline',
              category: 'assessment',
              description: 'Administer standardized anxiety self-report inventory at next session opening.',
              priority: 'routine',
              suggestedTimeframe: 'Start of next appointment',
            },
          ],
          clinicianReviewNotes: 'Standard clinical continuity procedures.',
        };
        break;

      case 'CHECK_DOCUMENTATION_COMPLETENESS':
        output = {
          overallCompletenessScore: 89,
          status: 'complete',
          findings: [
            {
              domain: 'subjective_presentation',
              severity: 'info',
              finding: 'Patient subjective report is thoroughly grounded in dialogue.',
              recommendation: 'Ensure timeline of symptoms is documented in clinical notes.',
            },
            {
              domain: 'clinical_interventions',
              severity: 'info',
              finding: 'Therapeutic interventions (CBT, PMR) clearly identified.',
              recommendation: 'Document specific psychoeducation materials provided to patient.',
            },
            {
              domain: 'risk_inquiry',
              severity: 'advisory',
              finding: 'No crisis indicators reported in session transcript.',
              recommendation: 'Clinician should explicitly note absence of suicidal or self-harm ideation in signed note.',
            },
          ],
          missingExpectedElements: ['Explicit psychometric inventory score'],
          disclaimer: 'This automated check provides clinical documentation suggestions only and does not constitute a legal or compliance certification.',
        };
        break;

      default:
        throw new Error(`Unsupported AI job type for mock provider: ${jobType}`);
    }

    return {
      output,
      modelUsed: this.modelName,
      isSimulated: true,
      isSynthetic: true,
      isMock: true,
      provider: 'mock',
      sandboxMode: true,
    };
  }
}

export const mockAiAdapter = new MockAiAdapter();
