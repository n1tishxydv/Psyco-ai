import { GeminiAdapter } from '../src/integrations/gemini/geminiAdapter.js';
const geminiAdapter = new GeminiAdapter();

async function testGeminiLive() {
  console.log('--- TESTING GEMINI ADAPTER LIVE ---');
  console.log('Adapter Status:', geminiAdapter.getStatus());

  try {
    const context = {
      transcriptText: `
Psychologist: Good morning John, how have you been sleeping lately?
Patient: Not great honestly. I wake up at 3am with my heart racing worrying about work deadlines.
Psychologist: Have you tried the 4-7-8 breathing exercise we discussed?
Patient: I tried it twice, and it helped calm me down before bed, but the panic woke me up later.
Psychologist: That is good progress that it helped initially. Let's practice progressive muscle relaxation today and set a goal to practice 10 minutes each night.
Patient: Okay, I can commit to that.
      `,
      transcriptVersion: 1,
      session: { id: 'ses_live_test_01', sessionNumber: 2 },
      patient: { id: 'pat_live_01', fullName: 'John Doe', age: 34, gender: 'male' },
      intake: { sectionB: { primaryReasons: ['Generalized anxiety', 'Sleep disruption'] } },
    };

    console.log('Calling generateClinicalDocumentation for GENERATE_SOAP...');
    const result = await geminiAdapter.generateClinicalDocumentation('GENERATE_SOAP', context);
    console.log('✅ GEMINI LIVE INFERENCE SUCCESS!');
    console.log('Model Used:', result.modelUsed);
    console.log('Is Simulated:', result.isSimulated);
    console.log('Generated Subjective:', result.output?.subjective);
    console.log('Generated Assessment:', result.output?.assessment);
    console.log('Generated Plan:', result.output?.plan);
  } catch (err) {
    console.error('❌ Gemini Inference Error:', err.message, err.stack);
  }
}

testGeminiLive();
