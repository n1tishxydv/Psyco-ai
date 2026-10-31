import React, { useState } from 'react';
import { LegalDocumentLayout } from './components/LegalDocumentLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/cards/Card';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { AlertBanner } from '../../components/common/AlertBanner';
import { contactConfig } from '../../config/contactConfig';
import { publicService } from '../../services/publicService';
import { isBackendConfigured } from '../../services/apiClient';
import {
  FileText,
  ShieldCheck,
  Send,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export function PrivacyRequestsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'patient',
    requestType: 'access',
    description: '',
    hp_website: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const requestOptions = [
    { value: 'access', label: 'Access to Personal Data (Summary of Processing)' },
    { value: 'correction', label: 'Correction of Inaccurate Information' },
    { value: 'erasure', label: 'Erasure / Account Deletion' },
    { value: 'consent_withdrawal', label: 'Withdrawal of Consent (e.g. Transcription)' },
    { value: 'grievance', label: 'Privacy Complaint / Grievance Redressal' },
    { value: 'general', label: 'General Data Protection Query' },
  ];

  const roleOptions = [
    { value: 'patient', label: 'Patient / Client' },
    { value: 'psychologist', label: 'Psychologist / Clinician' },
    { value: 'guardian', label: 'Parent / Legal Guardian' },
    { value: 'other', label: 'Other Requester' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.name.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMsg('A valid email address is required.');
      return;
    }
    if (formData.description.trim().length < 10) {
      setErrorMsg('Please provide at least 10 characters describing your request.');
      return;
    }

    if (!isBackendConfigured()) {
      setErrorMsg('Backend services are updating. Please send your request directly to ' + contactConfig.email);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: `[DATA-PRIVACY-REQUEST] ${formData.requestType.toUpperCase()} - Role: ${formData.role}`,
        message: `REQUEST TYPE: ${formData.requestType}\nROLE: ${formData.role}\nDETAILS:\n${formData.description.trim()}`,
        hp_website: formData.hp_website,
      };

      const res = await publicService.submitContactForm(payload);
      setSubmissionId(res.data?.submissionId || 'CONFIRMED');
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(
        err.message || 'Unable to submit your request at this time. Please contact our platform representative via email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toc = [
    { id: 'rights-overview', label: '1. Summary of Data Rights' },
    { id: 'request-form', label: '2. Submit a Privacy Request' },
    { id: 'verification-process', label: '3. Identity Verification Process' },
    { id: 'response-expectations', label: '4. Operational Response Expectations' },
    { id: 'statutory-contact', label: '5. Direct Contact Information' },
  ];

  return (
    <LegalDocumentLayout
      title="Data Rights & Privacy Requests"
      subtitle="Exercise your rights under applicable data protection laws, request data correction, withdraw consent, or file a privacy inquiry."
      category="Privacy and Data Protection"
      toc={toc}
    >
      {/* 1. Rights Overview */}
      <section id="rights-overview" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-softTeal" />
          1. Summary of Your Data Rights
        </h2>
        <p>
          In accordance with the Digital Personal Data Protection Act, 2023 and general data privacy principles,
          you possess specific legal rights regarding personal data processed by Psyco AI:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-softTeal">Right of Access</h4>
            <p className="text-slate-400">Request a summary of personal data being processed and third-party sub-processors who received data.</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-softTeal">Right of Correction</h4>
            <p className="text-slate-400">Request correction, completion, or updating of misleading or inaccurate personal information.</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-softTeal">Right of Erasure</h4>
            <p className="text-slate-400">Request permanent deletion of non-clinical account data (subject to mandatory medical record retention).</p>
          </div>
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
            <h4 className="font-semibold text-softTeal">Right to Withdraw Consent</h4>
            <p className="text-slate-400">Withdraw optional electronic consent (e.g. ambient consultation transcription) at any time.</p>
          </div>
        </div>
      </section>

      {/* 2. Request Form */}
      <section id="request-form" className="space-y-4">
        <h2 className="text-lg font-bold text-primaryText flex items-center gap-2">
          <FileText className="w-5 h-5 text-softTeal" />
          2. Submit a Formal Privacy Request
        </h2>

        <Card className="bg-deepBlueGray/80 border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-sm font-semibold">Privacy & Data Rights Form</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {submitted ? (
              <div className="space-y-4 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-calmGreen/20 text-calmGreen mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-primaryText">Data Request Logged</h3>
                <p className="text-xs text-secondaryText max-w-md mx-auto leading-relaxed">
                  Your privacy request has been recorded under Tracking Reference:
                </p>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-softTeal text-xs inline-block">
                  {submissionId}
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Our platform contact representative will verify your identity before processing personal data disclosures.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        role: 'patient',
                        requestType: 'access',
                        description: '',
                        hp_website: '',
                      });
                    }}
                  >
                    Submit Another Request
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <AlertBanner
                    type="error"
                    title="Submission Incomplete"
                    message={errorMsg}
                  />
                )}

                {/* Honeypot hidden field */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="hp_website"
                    tabIndex="-1"
                    autoComplete="off"
                    value={formData.hp_website}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Legal Name *"
                    name="name"
                    required
                    placeholder="Enter your registered name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Input
                    label="Registered Account Email *"
                    name="email"
                    type="email"
                    required
                    placeholder="account@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Your Platform Role *"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={loading}
                    options={roleOptions}
                  />
                  <Select
                    label="Request Category *"
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleChange}
                    disabled={loading}
                    options={requestOptions}
                  />
                </div>

                <Textarea
                  label="Detailed Request Description *"
                  name="description"
                  required
                  rows={4}
                  placeholder="Specify the exact records, corrections, or privacy actions requested..."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                />

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Lock className="w-3.5 h-3.5 text-softTeal" />
                    <span>Identity Verification Security Gate</span>
                  </div>
                  <p>
                    To protect sensitive mental health records against unauthorized disclosure,
                    we verify your registered email before providing exports or executing account deletions.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon={Send}
                    disabled={loading}
                  >
                    {loading ? 'Transmitting Request...' : 'Submit Privacy Request'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 3. Verification Process */}
      <section id="verification-process" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">3. Identity Verification Process</h2>
        <p>
          Before disclosing, updating, or deleting any personal information, Psyco AI must verify that the requester is
          the authenticated data principal (or authorized legal guardian). Verification will typically occur through a confirmation
          link sent to the registered email address.
        </p>
      </section>

      {/* 4. Response Expectations */}
      <section id="response-expectations" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">4. Operational Response Expectations</h2>
        <p>
          We endeavor to acknowledge privacy requests promptly during standard business hours.
          As the platform operates in controlled staging, formal statutory turnaround timelines will be finalized
          in conjunction with qualified legal counsel upon commercial launch.
        </p>
      </section>

      {/* 5. Statutory Contact */}
      <section id="statutory-contact" className="space-y-3">
        <h2 className="text-lg font-bold text-primaryText">5. Direct Contact Channels</h2>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs space-y-1.5">
          <p><strong>Platform Contact:</strong> {contactConfig.contactPerson}</p>
          <p><strong>Designation:</strong> {contactConfig.designation}</p>
          <p><strong>Direct Email:</strong> <a href={contactConfig.emailHref} className="text-softTeal hover:underline">{contactConfig.email}</a></p>
          <p><strong>Direct Phone:</strong> <a href={contactConfig.phoneHref} className="text-calmGreen hover:underline">{contactConfig.phone}</a></p>
        </div>
      </section>
    </LegalDocumentLayout>
  );
}
