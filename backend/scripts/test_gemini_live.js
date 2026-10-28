import { GeminiAdapter } from '../src/integrations/gemini/geminiAdapter.js';

async function testGeminiLive() {
  const adapter = new GeminiAdapter();
  console.log('Adapter status:', adapter.getStatus());

  const context = {
    transcriptText: `
Psychologist: Good morning Sarah, how have you been feeling since our last session?
Patient: It has been a stressful week at work. My sleep has been poor, waking up around 3 AM with anxious thoughts about project deadlines.
Psychologist: Let's discuss cognitive reframing strategies and progressive muscle relaxation before bed.
Patient: That sounds helpful. I will try the 15-minute relaxation exercise every night before sleeping.
`,
    transcriptVersion: 1,
    session: { id: 'ses_live_test_01', type: 'individual_therapy' },
    patient: { id: 'pat_live_test_01', fullName: 'Sarah Test', preferredName: 'Sarah' },
    intake: null,
    existingTreatmentPlan: null,
  };

  try {
    const result = await adapter.generateClinicalDocumentation('GENERATE_SOAP', context);
    console.log('✅ Gemini Live Result:', {
      modelUsed: result.modelUsed,
      isSimulated: result.isSimulated,
      subjective: result.output.subjective?.substring(0, 100),
      plan: result.output.plan?.substring(0, 100),
    });
  } catch (err) {
    console.error('❌ Gemini Live Test Error:', err.message);
  }
}

testGeminiLive();
