import test from 'node:test';
import assert from 'node:assert/strict';
import { filterFaqs } from '../../../frontend/src/features/public/components/faqUtils.js';

const SAMPLE_FAQS = [
  {
    id: 'faq_01',
    category: 'Product Overview',
    question: 'What is Psyco AI?',
    answer: 'Psyco AI is a dedicated mental health practice-management platform designed for clinical psychologists.',
  },
  {
    id: 'faq_02',
    category: 'Session Modes',
    question: 'Which consultation modes are supported?',
    answer: 'In-person consultation is the primary and default session mode, tailored to traditional clinical psychology practices. Online consultations via Google Meet are also supported.',
  },
  {
    id: 'faq_03',
    category: 'Privacy & Storage',
    question: 'Does Psyco AI store permanent audio recordings of therapy sessions?',
    answer: 'No. Psyco AI enforces a strict zero-binary-media policy. Session audio is processed transiently in memory to extract text, and wiped immediately.',
  },
  {
    id: 'faq_04',
    category: 'Clinical AI Ethics',
    question: 'Does AI replace the psychologist or diagnose patients autonomously?',
    answer: 'Never. All AI capabilities operate under a strict Human-in-the-Loop paradigm. Gemini produces draft notes that must be reviewed and signed.',
  },
  {
    id: 'faq_05',
    category: 'Access & Governance',
    question: 'Can an administrator access confidential patient therapy notes?',
    answer: 'No. The platform architecture employs Relationship-Based Access Control (ReBAC). Administrators are explicitly barred from viewing confidential clinical notes.',
  },
];

test('FAQ Keyword Search & Filtering Architecture Test Suite', async (suite) => {
  await suite.test('1. Matching question: Keyword query successfully matches question text', () => {
    const results = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'consultation modes' });
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'faq_02');
  });

  await suite.test('2. Matching answer: Keyword query successfully matches text located only in answer body', () => {
    // "zero-binary-media" only appears in the answer of faq_03, not in the question
    const results = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'zero-binary-media' });
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'faq_03');
    assert.ok(results[0].answer.includes('zero-binary-media'));
  });

  await suite.test('3. Mixed-case search: Case-insensitive matching works regardless of letter casing', () => {
    const lowerResults = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'rebac' });
    const upperResults = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'REBAC' });
    const mixedResults = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'ReBaC' });

    assert.equal(lowerResults.length, 1);
    assert.equal(upperResults.length, 1);
    assert.equal(mixedResults.length, 1);
    assert.equal(lowerResults[0].id, 'faq_05');
    assert.equal(upperResults[0].id, 'faq_05');
    assert.equal(mixedResults[0].id, 'faq_05');
  });

  await suite.test('4. Empty search: When query is blank or whitespace, returns all items in category', () => {
    const emptyResults = filterFaqs(SAMPLE_FAQS, { category: 'All', query: '' });
    const whitespaceResults = filterFaqs(SAMPLE_FAQS, { category: 'All', query: '   ' });

    assert.equal(emptyResults.length, SAMPLE_FAQS.length);
    assert.equal(whitespaceResults.length, SAMPLE_FAQS.length);
  });

  await suite.test('5. No matching results: Returns empty array for unmentioned search keywords', () => {
    const results = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'quantum-blockchain-cryptocurrency' });
    assert.equal(results.length, 0);
  });

  await suite.test('6. Search combined with category filter: Intersects keyword query with active category', () => {
    // Both faq_01 and faq_02 mention "psycholog..."
    const allMatches = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'psycholog' });
    assert.ok(allMatches.length >= 2, 'Multiple FAQs mention psychologist');

    // Scoped specifically to "Session Modes" category
    const scopedMatches = filterFaqs(SAMPLE_FAQS, { category: 'Session Modes', query: 'psycholog' });
    assert.equal(scopedMatches.length, 1);
    assert.equal(scopedMatches[0].id, 'faq_02');

    // Searching for a keyword that exists in another category returns 0 in this category
    const zeroMatches = filterFaqs(SAMPLE_FAQS, { category: 'Session Modes', query: 'zero-binary-media' });
    assert.equal(zeroMatches.length, 0);
  });

  await suite.test('7. Clear search: Resetting query restores full list of FAQs', () => {
    // Start with a filtered search
    const filtered = filterFaqs(SAMPLE_FAQS, { category: 'All', query: 'Gemini' });
    assert.equal(filtered.length, 1);

    // Simulate clearing search input
    const cleared = filterFaqs(SAMPLE_FAQS, { category: 'All', query: '' });
    assert.equal(cleared.length, SAMPLE_FAQS.length);
  });
});
