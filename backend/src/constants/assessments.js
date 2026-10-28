/**
 * Standardized Psychometric Assessment Instruments Catalog
 * Authoritative item wording, response scales, and verified scoring definitions.
 *
 * PHQ-9: Kroenke, Spitzer, & Williams (2001) - 9 DSM-IV Depression Criteria.
 * GAD-7: Spitzer, Kroenke, Williams, & Löwe (2006) - Generalized Anxiety Disorder.
 * C-SSRS: The Columbia-Suicide Severity Rating Scale (Screener version - Posner et al., 2011).
 */

export const INSTRUMENT_DEFINITIONS = {
  'phq-9': {
    id: 'phq-9',
    name: 'Patient Health Questionnaire-9 (PHQ-9)',
    shortName: 'PHQ-9',
    version: '1.0.0',
    publisher: 'Pfizer Inc. (Public Domain for Clinical Practice)',
    intendedPopulation: 'Adults and adolescents (12+) in clinical and outpatient settings',
    timeframe: 'Over the last 2 weeks',
    instructions:
      'Over the last 2 weeks, how often have you been bothered by any of the following problems? Please select the option that best describes your experience.',
    scoringRange: { min: 0, max: 27 },
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
    items: [
      { id: 'phq9_1', order: 1, text: 'Little interest or pleasure in doing things' },
      { id: 'phq9_2', order: 2, text: 'Feeling down, depressed, or hopeless' },
      { id: 'phq9_3', order: 3, text: 'Trouble falling or staying asleep, or sleeping too much' },
      { id: 'phq9_4', order: 4, text: 'Feeling tired or having little energy' },
      { id: 'phq9_5', order: 5, text: 'Poor appetite or overeating' },
      {
        id: 'phq9_6',
        order: 6,
        text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      },
      {
        id: 'phq9_7',
        order: 7,
        text: 'Trouble concentrating on things, such as reading the newspaper or watching television',
      },
      {
        id: 'phq9_8',
        order: 8,
        text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
      },
      {
        id: 'phq9_9',
        order: 9,
        text: 'Thoughts that you would be better off dead or of hurting yourself in some way',
        isCriticalSafetyItem: true,
      },
    ],
    severityCategories: [
      { min: 0, max: 4, label: 'None-minimal depression', severity: 'minimal' },
      { min: 5, max: 9, label: 'Mild depression', severity: 'mild' },
      { min: 10, max: 14, label: 'Moderate depression', severity: 'moderate' },
      { min: 15, max: 19, label: 'Moderately severe depression', severity: 'moderately_severe' },
      { min: 20, max: 27, label: 'Severe depression', severity: 'severe' },
    ],
    disclaimer:
      'The PHQ-9 is a standardized symptom screening questionnaire, not a standalone diagnostic instrument. A clinical diagnosis requires professional evaluation by a qualified mental health clinician.',
  },

  'gad-7': {
    id: 'gad-7',
    name: 'Generalized Anxiety Disorder-7 (GAD-7)',
    shortName: 'GAD-7',
    version: '1.0.0',
    publisher: 'Pfizer Inc. (Public Domain for Clinical Practice)',
    intendedPopulation: 'Adults and adolescents (12+) in clinical and outpatient settings',
    timeframe: 'Over the last 2 weeks',
    instructions:
      'Over the last 2 weeks, how often have you been bothered by the following problems? Please select the option that best reflects your experience.',
    scoringRange: { min: 0, max: 21 },
    options: [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ],
    items: [
      { id: 'gad7_1', order: 1, text: 'Feeling nervous, anxious, or on edge' },
      { id: 'gad7_2', order: 2, text: 'Not being able to stop or control worrying' },
      { id: 'gad7_3', order: 3, text: 'Worrying too much about different things' },
      { id: 'gad7_4', order: 4, text: 'Trouble relaxing' },
      { id: 'gad7_5', order: 5, text: "Being so restless that it's hard to sit still" },
      { id: 'gad7_6', order: 6, text: 'Becoming easily annoyed or irritable' },
      { id: 'gad7_7', order: 7, text: 'Feeling afraid as if something awful might happen' },
    ],
    severityCategories: [
      { min: 0, max: 4, label: 'Minimal anxiety', severity: 'minimal' },
      { min: 5, max: 9, label: 'Mild anxiety', severity: 'mild' },
      { min: 10, max: 14, label: 'Moderate anxiety', severity: 'moderate' },
      { min: 15, max: 21, label: 'Severe anxiety', severity: 'severe' },
    ],
    disclaimer:
      'The GAD-7 is a standardized anxiety screening tool. Elevated scores warrant comprehensive clinical evaluation by an authorized clinician.',
  },

  'cssrs-screener': {
    id: 'cssrs-screener',
    name: 'Columbia-Suicide Severity Rating Scale (C-SSRS Screener)',
    shortName: 'C-SSRS Screener',
    version: '1.0.0',
    publisher: 'The Columbia Lighthouse Project (Posner et al.)',
    intendedPopulation: 'Clinical triage and suicide risk screening in healthcare settings',
    timeframe: 'Past month and lifetime',
    instructions:
      'Please answer the following questions truthfully. These questions help your healthcare team assess your safety and well-being.',
    scoringRange: { min: 0, max: 6 },
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' },
    ],
    items: [
      {
        id: 'cssrs_1',
        order: 1,
        text: 'Have you wished you were dead or wished you could go to sleep and not wake up?',
        isTriageGateway: true,
      },
      {
        id: 'cssrs_2',
        order: 2,
        text: 'Have you actually had any thoughts of killing yourself?',
        isTriageGateway: true,
      },
      {
        id: 'cssrs_3',
        order: 3,
        text: 'Have you been thinking about how you might kill yourself?',
        conditionalOn: 'cssrs_2_yes',
      },
      {
        id: 'cssrs_4',
        order: 4,
        text: 'Have you had these thoughts and had some intention of acting on them?',
        conditionalOn: 'cssrs_2_yes',
      },
      {
        id: 'cssrs_5',
        order: 5,
        text: 'Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?',
        conditionalOn: 'cssrs_2_yes',
      },
      {
        id: 'cssrs_6',
        order: 6,
        text: 'Have you ever done anything, started to do anything, or prepared to do anything to end your life?',
        alwaysRequired: true,
      },
    ],
    disclaimer:
      'The C-SSRS Screener is a structured clinical triage aid. Absence of affirmative answers does NOT guarantee safety, and positive responses require immediate, direct clinical evaluation by a qualified professional.',
  },
};
