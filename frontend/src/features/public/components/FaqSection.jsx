import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/cards/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Textarea } from '../../../components/common/Textarea';
import { Badge } from '../../../components/common/Badge';
import { AlertBanner } from '../../../components/common/AlertBanner';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { publicService } from '../../../services/publicService';
import { isBackendConfigured } from '../../../services/apiClient';
import { ChevronDown, ChevronUp, HelpCircle, Send, CheckCircle2 } from 'lucide-react';

const FALLBACK_FAQS = [
  {
    id: 'faq_01',
    category: 'Product Overview',
    question: 'What is Psyco AI?',
    answer: 'Psyco AI is a dedicated mental health practice-management platform designed for clinical psychologists, therapists, and their patients. It centralizes appointment scheduling, patient intake, structured clinical notes, and treatment plans in a calm, accessible workspace.',
  },
  {
    id: 'faq_02',
    category: 'Target Audience',
    question: 'Who is Psyco AI designed for?',
    answer: 'The platform serves three distinct roles: (1) Patients seeking streamlined provider discovery and appointment management, (2) Psychologists running independent practices or clinics, and (3) Practice administrators managing provider verification and system health.',
  },
  {
    id: 'faq_03',
    category: 'Session Modes',
    question: 'Which consultation modes are supported?',
    answer: 'In-person consultation is the primary and default session mode, tailored to traditional clinical psychology practices. Online consultations via Google Meet video links are seamlessly supported when chosen by the psychologist or patient.',
  },
  {
    id: 'faq_04',
    category: 'Privacy & Storage',
    question: 'Does Psyco AI store permanent audio recordings of therapy sessions?',
    answer: 'No. Psyco AI enforces a strict zero-binary-media policy. Session audio for future transcription features will be processed transiently in memory to extract text, and the audio buffer is wiped immediately. No audio files or raw voice recordings are stored.',
  },
  {
    id: 'faq_05',
    category: 'Clinical AI Ethics',
    question: 'Does AI replace the psychologist or diagnose patients autonomously?',
    answer: 'Never. All AI capabilities operate under a strict Human-in-the-Loop paradigm. Gemini produces draft notes that must be reviewed, edited, and digitally signed by the licensed psychologist before becoming part of the patient record.',
  },
  {
    id: 'faq_06',
    category: 'Access & Governance',
    question: 'Can an administrator access confidential patient therapy notes?',
    answer: 'No. The platform architecture employs Relationship-Based Access Control (ReBAC). Administrators manage accounts and verifications, but are explicitly barred from viewing confidential clinical notes, transcripts, or treatment plans.',
  },
];

export function FaqSection({ defaultExpandedId = 'faq_01' }) {
  const [faqs, setFaqs] = useState(FALLBACK_FAQS);
  const [loading, setLoading] = useState(!isBackendConfigured() ? false : true);
  const [expandedId, setExpandedId] = useState(defaultExpandedId);
  const [activeCategory, setActiveCategory] = useState('All');

  // Question Submission State
  const [question, setQuestion] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!isBackendConfigured()) {
      setFaqs(FALLBACK_FAQS);
      setLoading(false);
      return;
    }

    publicService
      .getPublishedFaqs()
      .then((res) => {
        if (mounted && res.data?.faqs) {
          setFaqs(res.data.faqs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setFaqs(FALLBACK_FAQS);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const categories = ['All', ...new Set(faqs.map((f) => f.category || 'General'))];

  const filteredFaqs = activeCategory === 'All'
    ? faqs
    : faqs.filter((f) => (f.category || 'General') === activeCategory);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (question.trim().length < 8) {
      setSubmitError('Your question must be at least 8 characters long.');
      return;
    }

    if (!isBackendConfigured()) {
      setSubmitError('FAQ question submission is currently unavailable while the backend service is being updated.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicService.submitFaqQuestion({
        question: question.trim(),
        name: submitterName.trim() || undefined,
        email: submitterEmail.trim() || undefined,
        hp_website: honeypot || undefined,
      });

      setSubmitSuccess(res.data?.message || 'Your question has been submitted for editorial moderation.');
      setQuestion('');
      setSubmitterName('');
      setSubmitterEmail('');
    } catch (err) {
      setSubmitError(
        err.message || 'Failed to submit your question. The backend persistence service may be offline.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="faq" className="space-y-10 py-10">
      <div className="text-center space-y-3">
        <Badge variant="teal">Product Clarifications</Badge>
        <h2 className="text-3xl font-bold tracking-tight text-primaryText">
          Frequently Asked Questions
        </h2>
        <p className="text-sm text-secondaryText max-w-2xl mx-auto">
          Clear answers regarding platform capabilities, clinical privacy, and the phased development roadmap.
        </p>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 2 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                activeCategory === cat
                  ? 'bg-softTeal text-midnightNavy font-semibold border-softTeal'
                  : 'bg-deepBlueGray text-secondaryText hover:text-primaryText border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Accordion List */}
      <div className="max-w-3xl mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-10 space-y-2">
            <LoadingSpinner size="md" />
            <p className="text-xs text-secondaryText">Loading published FAQs...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <p className="text-center text-xs text-secondaryText py-6">No FAQs available in this category.</p>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-deepBlueGray/80 border border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-150"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-medium text-sm text-primaryText hover:text-softTeal transition-colors focus-visible:ring-2 focus-visible:ring-softTeal focus-visible:outline-none"
                >
                  <span className="pr-4">{faq.question}</span>
                  <div className="shrink-0 text-secondaryText">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-softTeal" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-secondaryText leading-relaxed border-t border-slate-700/50 pt-3">
                    <p>{faq.answer}</p>
                    {faq.category && (
                      <span className="inline-block mt-3 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                        Category: {faq.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Public FAQ Question Submission Form */}
      <div className="max-w-2xl mx-auto pt-6">
        <Card className="border-slate-700/80 bg-gradient-to-b from-deepBlueGray to-midnightNavy">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-softTeal" />
              <div>
                <CardTitle className="text-base">Have a Question We Haven't Answered?</CardTitle>
                <p className="text-xs text-secondaryText mt-0.5">
                  Submit a question for editorial consideration. New submissions enter a moderation queue.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {submitSuccess ? (
              <AlertBanner
                type="success"
                title="Question Submitted"
                message={submitSuccess}
              />
            ) : (
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                {submitError && (
                  <AlertBanner
                    type="error"
                    title="Submission Failed"
                    message={submitError}
                  />
                )}

                {/* Honeypot field - hidden from genuine users */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="hp_website"
                    tabIndex="-1"
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <Textarea
                  label="Your Question"
                  required
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How does the psychologist buffer time configuration prevent schedule overlap?"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name (Optional)"
                    value={submitterName}
                    onChange={(e) => setSubmitterName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                  <Input
                    label="Your Email (Optional)"
                    type="email"
                    value={submitterEmail}
                    onChange={(e) => setSubmitterEmail(e.target.value)}
                    placeholder="jane@example.com"
                    helperText="Only used if we need to follow up directly."
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-secondaryText">
                    * Submissions require administrative approval before being published.
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={Send}
                    isLoading={submitting}
                  >
                    Submit Question
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
